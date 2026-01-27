import type { ScrapedReview } from '@donotstay/shared';
import type { GraphQLParams } from './scraper';

const GRAPHQL_ENDPOINT = 'https://www.booking.com/dml/graphql';
const REVIEW_LIST_URL = 'https://www.booking.com/reviewlist.en-gb.html';
const MAX_REVIEWS = 200;
const HIGH_SCORE_RATIO = 0.25; // 25% of reviews should be high-scoring for balance
const REVIEWS_PER_REQUEST = 50;
const REVIEWS_PER_HTML_PAGE = 25;

/**
 * Calculate detail score for a review based on text length
 * Longer reviews = more signal = higher priority
 */
function getDetailScore(review: ScrapedReview): number {
  const prosLength = review.pros?.length || 0;
  const consLength = review.cons?.length || 0;
  const textLength = review.text?.length || 0;
  return prosLength + consLength + textLength;
}

/**
 * Stable sort for reviews when detail scores are equal
 * Ensures deterministic selection across multiple runs
 */
function stableReviewSort(a: ScrapedReview, b: ScrapedReview): number {
  // Primary: sort by score ascending (low scores first)
  if (a.score !== b.score) return a.score - b.score;

  // Secondary: sort by date descending (recent first)
  if (a.date && b.date) {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
  }

  // Tertiary: sort by author alphabetically
  if (a.author && b.author) {
    return a.author.localeCompare(b.author);
  }

  // Final tie-breaker: review text
  const aText = (a.pros || '') + (a.cons || '');
  const bText = (b.pros || '') + (b.cons || '');
  return aText.localeCompare(bText);
}

interface GraphQLReview {
  id: string;
  countryCode?: string;
  reviewDate?: string;
  title?: string;
  positiveText?: string;
  negativeText?: string;
  reviewScore?: number;
  reviewer?: {
    name?: string;
    countryCode?: string;
  };
}

interface ReviewListResponse {
  data?: {
    reviewList?: {
      reviewCard?: Array<{
        review: GraphQLReview;
      }>;
      pagination?: {
        hasMore: boolean;
        total: number;
      };
    };
  };
  errors?: Array<{ message: string }>;
}

const REVIEW_LIST_QUERY = `
  query ReviewList($input: ReviewListInput!) {
    reviewList(input: $input) {
      reviewCard {
        review {
          id
          countryCode
          reviewDate
          title
          positiveText
          negativeText
          reviewScore
          reviewer {
            name
            countryCode
          }
        }
      }
      pagination {
        hasMore
        total
      }
    }
  }
`;

/**
 * Fetch reviews - tries GraphQL first, falls back to HTML scraping
 * Prioritizes low-scoring reviews first, then recent reviews
 */
export async function fetchReviewsViaGraphQL(params: GraphQLParams): Promise<ScrapedReview[]> {
  // Try GraphQL first
  const graphqlReviews = await tryGraphQL(params);
  if (graphqlReviews.length > 0) {
    return graphqlReviews;
  }

  // Fallback to HTML scraping
  console.log('DoNotStay: GraphQL failed, falling back to HTML scraping...');
  return await fetchReviewsViaHtml(params.countryCode);
}

/**
 * Try to fetch reviews via GraphQL API
 * Fetches from multiple sources and selects the most detailed reviews
 * with ~25% being high-scoring for balance
 */
async function tryGraphQL(params: GraphQLParams): Promise<ScrapedReview[]> {
  const seenIds = new Set<string>();
  const lowScorePool: ScrapedReview[] = [];
  const recentPool: ScrapedReview[] = [];
  const highScorePool: ScrapedReview[] = [];

  const dedupeAndAdd = (reviews: ScrapedReview[], pool: ScrapedReview[]) => {
    for (const review of reviews) {
      const key = `${review.author}:${review.date}:${review.score}`;
      if (!seenIds.has(key)) {
        seenIds.add(key);
        pool.push(review);
      }
    }
  };

  try {
    // Fetch from all sources in parallel for speed
    console.log('DoNotStay: Fetching reviews from multiple sources via GraphQL...');
    const [lowScore1, recent, highScore] = await Promise.all([
      fetchReviewPage(params, 'LOWEST_SCORE', 0),
      fetchReviewPage(params, 'MOST_RECENT', 0),
      fetchReviewPage(params, 'HIGHEST_SCORE', 0),
    ]);

    dedupeAndAdd(lowScore1, lowScorePool);
    dedupeAndAdd(recent, recentPool);
    dedupeAndAdd(highScore, highScorePool);

    // Fetch more low-scoring if we got a full page (likely more available)
    if (lowScore1.length === REVIEWS_PER_REQUEST) {
      const lowScore2 = await fetchReviewPage(params, 'LOWEST_SCORE', REVIEWS_PER_REQUEST);
      dedupeAndAdd(lowScore2, lowScorePool);
    }

    console.log(`DoNotStay: Raw pools - Low: ${lowScorePool.length}, Recent: ${recentPool.length}, High: ${highScorePool.length}`);

    // Now select the best reviews:
    // 1. Sort each pool by detail (longest reviews first)
    // 2. Take ~25% from high-scoring pool
    // 3. Fill rest from low-score and recent pools, prioritizing detail

    const sortByDetail = (a: ScrapedReview, b: ScrapedReview) => {
      const detailDiff = getDetailScore(b) - getDetailScore(a);
      return detailDiff !== 0 ? detailDiff : stableReviewSort(a, b);
    };

    lowScorePool.sort(sortByDetail);
    recentPool.sort(sortByDetail);
    highScorePool.sort(sortByDetail);

    const finalReviews: ScrapedReview[] = [];
    const finalIds = new Set<string>();

    const addToFinal = (review: ScrapedReview): boolean => {
      const key = `${review.author}:${review.date}:${review.score}`;
      if (!finalIds.has(key) && finalReviews.length < MAX_REVIEWS) {
        finalIds.add(key);
        finalReviews.push(review);
        return true;
      }
      return false;
    };

    // Add high-scoring reviews first (up to 25% of MAX_REVIEWS)
    const highScoreTarget = Math.floor(MAX_REVIEWS * HIGH_SCORE_RATIO);
    for (const review of highScorePool) {
      if (finalReviews.length >= highScoreTarget) break;
      addToFinal(review);
    }
    console.log(`DoNotStay: Added ${finalReviews.length} high-scoring reviews`);

    // Fill remaining with low-score reviews (prioritized)
    for (const review of lowScorePool) {
      if (finalReviews.length >= MAX_REVIEWS) break;
      addToFinal(review);
    }

    // Fill any remaining slots with recent reviews
    for (const review of recentPool) {
      if (finalReviews.length >= MAX_REVIEWS) break;
      addToFinal(review);
    }

    console.log(`DoNotStay: Final selection: ${finalReviews.length} reviews (targeting ${highScoreTarget} high-scoring)`);
    return finalReviews;
  } catch (error) {
    console.error('DoNotStay: Error fetching reviews via GraphQL:', error);
    return [];
  }
}

/**
 * Fetch a single page of reviews from the GraphQL API
 */
async function fetchReviewPage(
  params: GraphQLParams,
  sorter: string,
  skip: number
): Promise<ScrapedReview[]> {
  const variables = {
    input: {
      hotelId: params.hotelId,
      ufi: params.ufi,
      hotelCountryCode: params.countryCode,
      sorter,
      skip,
      limit: REVIEWS_PER_REQUEST,
    },
  };

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-booking-pageview-id': params.pageviewId,
        'x-apollo-operation-name': 'ReviewList',
      },
      credentials: 'include',
      body: JSON.stringify({
        operationName: 'ReviewList',
        query: REVIEW_LIST_QUERY,
        variables,
      }),
    });

    if (!response.ok) {
      console.error(`DoNotStay: GraphQL request failed (${response.status})`);
      return [];
    }

    const data: ReviewListResponse = await response.json();

    if (data.errors?.length) {
      console.error('DoNotStay: GraphQL errors:', data.errors.map(e => e.message).join(', '));
      return [];
    }

    const reviewCards = data.data?.reviewList?.reviewCard || [];
    const transformed = reviewCards.map((card) => transformReview(card.review));
    const filtered = transformed.filter((r): r is ScrapedReview => r !== null);
    console.log(`DoNotStay: GraphQL returned ${reviewCards.length} reviews, ${filtered.length} have text content`);
    return filtered;
  } catch (error) {
    console.error('DoNotStay: Error in GraphQL fetch:', error);
    return [];
  }
}

/**
 * Transform GraphQL review to ScrapedReview format
 */
function transformReview(review: GraphQLReview): ScrapedReview | null {
  if (!review) return null;

  // Must have actual review text, not just a title
  if (!review.positiveText && !review.negativeText) {
    return null;
  }

  return {
    author: review.reviewer?.name || 'Anonymous',
    country: review.reviewer?.countryCode || review.countryCode,
    score: review.reviewScore || 0,
    date: review.reviewDate || '',
    title: review.title,
    pros: review.positiveText,
    cons: review.negativeText,
  };
}

// ============ HTML Scraping Fallback ============

/**
 * Fetch reviews by scraping HTML pages (fallback when GraphQL fails)
 * Also fetches high-scoring reviews and prioritizes detailed ones
 */
async function fetchReviewsViaHtml(countryCode: string): Promise<ScrapedReview[]> {
  const seenIds = new Set<string>();
  const lowScorePool: ScrapedReview[] = [];
  const recentPool: ScrapedReview[] = [];
  const highScorePool: ScrapedReview[] = [];

  // Extract pagename from current URL
  const pagenameMatch = window.location.pathname.match(/\/hotel\/[a-z]{2}\/([^/.?]+)/);
  const pagename = pagenameMatch ? pagenameMatch[1] : null;

  if (!pagename) {
    console.error('DoNotStay: Could not extract pagename for HTML scraping');
    return [];
  }

  const dedupeAndAdd = (reviews: ScrapedReview[], pool: ScrapedReview[]) => {
    for (const review of reviews) {
      const key = `${review.author}:${review.date}:${review.score}`;
      if (!seenIds.has(key)) {
        seenIds.add(key);
        pool.push(review);
      }
    }
  };

  try {
    // Fetch from multiple sources
    console.log('DoNotStay: Fetching reviews from multiple sources via HTML...');

    // Low-scoring reviews
    const lowScore1 = await fetchHtmlReviewPage(countryCode, pagename, 0, 'f_score_asc');
    dedupeAndAdd(lowScore1, lowScorePool);

    if (lowScore1.length === REVIEWS_PER_HTML_PAGE) {
      const lowScore2 = await fetchHtmlReviewPage(countryCode, pagename, REVIEWS_PER_HTML_PAGE, 'f_score_asc');
      dedupeAndAdd(lowScore2, lowScorePool);
    }

    // Recent reviews
    const recent = await fetchHtmlReviewPage(countryCode, pagename, 0, 'f_recent_desc');
    dedupeAndAdd(recent, recentPool);

    // High-scoring reviews (f_score_desc = highest first)
    const highScore = await fetchHtmlReviewPage(countryCode, pagename, 0, 'f_score_desc');
    dedupeAndAdd(highScore, highScorePool);

    console.log(`DoNotStay: Raw pools - Low: ${lowScorePool.length}, Recent: ${recentPool.length}, High: ${highScorePool.length}`);

    // Sort each pool by detail (longest reviews first)
    const sortByDetail = (a: ScrapedReview, b: ScrapedReview) => {
      const detailDiff = getDetailScore(b) - getDetailScore(a);
      return detailDiff !== 0 ? detailDiff : stableReviewSort(a, b);
    };
    lowScorePool.sort(sortByDetail);
    recentPool.sort(sortByDetail);
    highScorePool.sort(sortByDetail);

    const finalReviews: ScrapedReview[] = [];
    const finalIds = new Set<string>();

    const addToFinal = (review: ScrapedReview): boolean => {
      const key = `${review.author}:${review.date}:${review.score}`;
      if (!finalIds.has(key) && finalReviews.length < MAX_REVIEWS) {
        finalIds.add(key);
        finalReviews.push(review);
        return true;
      }
      return false;
    };

    // Add high-scoring reviews first (up to 25%)
    const highScoreTarget = Math.floor(MAX_REVIEWS * HIGH_SCORE_RATIO);
    for (const review of highScorePool) {
      if (finalReviews.length >= highScoreTarget) break;
      addToFinal(review);
    }

    // Fill with low-score reviews
    for (const review of lowScorePool) {
      if (finalReviews.length >= MAX_REVIEWS) break;
      addToFinal(review);
    }

    // Fill remaining with recent reviews
    for (const review of recentPool) {
      if (finalReviews.length >= MAX_REVIEWS) break;
      addToFinal(review);
    }

    console.log(`DoNotStay: Final selection: ${finalReviews.length} reviews via HTML`);
    return finalReviews;
  } catch (error) {
    console.error('DoNotStay: Error in HTML scraping:', error);
    return [];
  }
}

/**
 * Fetch a single page of reviews from the HTML endpoint
 */
async function fetchHtmlReviewPage(
  cc1: string,
  pagename: string,
  offset: number,
  sortBy: string
): Promise<ScrapedReview[]> {
  const url = new URL(REVIEW_LIST_URL);
  url.searchParams.set('cc1', cc1);
  url.searchParams.set('pagename', pagename);
  url.searchParams.set('rows', String(REVIEWS_PER_HTML_PAGE));
  url.searchParams.set('offset', String(offset));
  url.searchParams.set('sort', sortBy);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      console.error(`DoNotStay: HTML fetch failed (${response.status})`);
      return [];
    }

    const html = await response.text();
    return parseReviewsFromHtml(html);
  } catch (error) {
    console.error('DoNotStay: Error fetching HTML review page:', error);
    return [];
  }
}

/**
 * Parse reviews from HTML using DOMParser (available in content scripts)
 */
function parseReviewsFromHtml(html: string): ScrapedReview[] {
  const reviews: ScrapedReview[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Find all review blocks - try multiple selector patterns
  const reviewBlocks = doc.querySelectorAll(
    '.review_list_new_item_block, [data-review-url], .c-review-block, li[data-review-score]'
  );

  console.log(`DoNotStay: Found ${reviewBlocks.length} review blocks in HTML`);

  // Debug: log first review block to see actual structure
  if (reviewBlocks.length > 0) {
    console.log('DoNotStay: Sample review block HTML:', reviewBlocks[0].outerHTML.substring(0, 2000));
  }

  for (const block of reviewBlocks) {
    const review = parseHtmlReviewBlock(block);
    if (review) {
      reviews.push(review);
    }
  }

  console.log(`DoNotStay: Parsed ${reviews.length} reviews with content`);
  if (reviews.length > 0) {
    console.log('DoNotStay: Sample review:', JSON.stringify(reviews[0]));
  }

  return reviews;
}

/**
 * Parse a single review block from HTML
 */
function parseHtmlReviewBlock(block: Element): ScrapedReview | null {
  try {
    // Author name - try multiple selectors
    const author =
      block.querySelector('.bui-avatar-block__title')?.textContent?.trim() ||
      block.querySelector('.c-review__author')?.textContent?.trim() ||
      block.querySelector('[class*="reviewer"] [class*="name"]')?.textContent?.trim() ||
      block.querySelector('[data-testid*="reviewer-name"]')?.textContent?.trim() ||
      'Anonymous';

    // Country - try multiple selectors
    const country =
      block.querySelector('.bui-avatar-block__subtitle')?.textContent?.trim() ||
      block.querySelector('.c-review__country')?.textContent?.trim() ||
      block.querySelector('[class*="reviewer"] [class*="country"]')?.textContent?.trim() ||
      block.querySelector('[data-testid*="reviewer-country"]')?.textContent?.trim();

    // Score - try multiple selectors including data attribute
    const scoreAttr = block.getAttribute('data-review-score');
    const scoreText =
      scoreAttr ||
      block.querySelector('.bui-review-score__badge')?.textContent?.trim() ||
      block.querySelector('.c-score')?.textContent?.trim() ||
      block.querySelector('[class*="review-score"] [class*="badge"]')?.textContent?.trim() ||
      block.querySelector('[data-testid*="review-score"]')?.textContent?.trim() ||
      '0';
    const score = parseFloat(scoreText) || 0;

    // Date - try multiple selectors
    const date =
      block.querySelector('.c-review-block__date')?.textContent?.trim() ||
      block.querySelector('.c-review__date')?.textContent?.trim() ||
      block.querySelector('[class*="review"] [class*="date"]')?.textContent?.trim() ||
      block.querySelector('[data-testid*="review-date"]')?.textContent?.trim() ||
      '';

    // Title - try multiple selectors
    const title =
      block.querySelector('.c-review-block__title')?.textContent?.trim() ||
      block.querySelector('.c-review__title')?.textContent?.trim() ||
      block.querySelector('[data-testid*="review-title"]')?.textContent?.trim();

    // Positive text (pros) - try many selector patterns
    const prosElement =
      block.querySelector('.c-review__row--positive .c-review__body') ||
      block.querySelector('.c-review-block__row--positive .c-review-block__text') ||
      block.querySelector('[data-testid*="positive"]') ||
      block.querySelector('[data-testid="review-positive"]') ||
      block.querySelector('.review_pos') ||
      block.querySelector('.review_pos_bubble') ||
      block.querySelector('[class*="positive"] [class*="text"]') ||
      block.querySelector('[class*="positive"] span[lang]') ||
      block.querySelector('.c-review__row:first-of-type .c-review__body') ||
      // Look for paragraphs with positive indicators
      block.querySelector('p.review_pos, p[class*="positive"]');

    let pros = prosElement?.textContent?.trim();

    // If no pros found, try looking for text after "Liked" or similar
    if (!pros) {
      const allText = block.textContent || '';
      const likedMatch = allText.match(/(?:Liked|Positive|Good|Pros?)[\s:·]+([^·\n]+)/i);
      if (likedMatch) {
        pros = likedMatch[1].trim();
      }
    }

    // Negative text (cons) - try many selector patterns
    const consElement =
      block.querySelector('.c-review__row--negative .c-review__body') ||
      block.querySelector('.c-review-block__row--negative .c-review-block__text') ||
      block.querySelector('[data-testid*="negative"]') ||
      block.querySelector('[data-testid="review-negative"]') ||
      block.querySelector('.review_neg') ||
      block.querySelector('.review_neg_bubble') ||
      block.querySelector('[class*="negative"] [class*="text"]') ||
      block.querySelector('[class*="negative"] span[lang]') ||
      block.querySelector('.c-review__row:last-of-type .c-review__body') ||
      // Look for paragraphs with negative indicators
      block.querySelector('p.review_neg, p[class*="negative"]');

    let cons = consElement?.textContent?.trim();

    // If no cons found, try looking for text after "Disliked" or similar
    if (!cons) {
      const allText = block.textContent || '';
      const dislikedMatch = allText.match(/(?:Disliked|Negative|Bad|Cons?)[\s:·]+([^·\n]+)/i);
      if (dislikedMatch) {
        cons = dislikedMatch[1].trim();
      }
    }

    // Filter out placeholder text that indicates no actual review content
    const noContentPlaceholder = /no comments available|there are no comments/i;
    if (pros && noContentPlaceholder.test(pros)) pros = undefined;
    if (cons && noContentPlaceholder.test(cons)) cons = undefined;

    // Must have actual review text, not just a title
    if (!pros && !cons) {
      return null;
    }

    return { author, country, score, date, title, pros, cons };
  } catch (error) {
    console.error('DoNotStay: Error parsing HTML review block:', error);
    return null;
  }
}
