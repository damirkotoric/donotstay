import type { HotelInfo, ScrapedReview } from '@donotstay/shared';

const MAX_REVIEWS = 50;

/**
 * Scrape hotel information from Booking.com hotel page
 */
export function scrapeHotelInfo(): HotelInfo | null {
  try {
    // Hotel name - multiple selector strategies
    const hotelName =
      document.querySelector('[data-testid="property-header-name"]')?.textContent?.trim() ||
      document.querySelector('h2.pp-header__title')?.textContent?.trim() ||
      document.querySelector('.hp__hotel-name')?.textContent?.trim() ||
      document.querySelector('h1')?.textContent?.trim();

    if (!hotelName) {
      console.error('DoNotStay: Could not find hotel name');
      return null;
    }

    // Location
    const location =
      document.querySelector('[data-testid="property-header-address"]')?.textContent?.trim() ||
      document.querySelector('.hp_address_subtitle')?.textContent?.trim() ||
      '';

    // Rating
    const ratingText =
      document.querySelector('[data-testid="review-score-component"] .a3b8729ab1')?.textContent?.trim() ||
      document.querySelector('.bui-review-score__badge')?.textContent?.trim() ||
      document.querySelector('[data-testid="review-score-right-component"]')?.textContent?.trim() ||
      '0';
    const rating = parseFloat(ratingText) || 0;

    // Review count
    const reviewCountText =
      document.querySelector('[data-testid="review-score-component"] .abf093bdfe')?.textContent?.trim() ||
      document.querySelector('.bui-review-score__text')?.textContent?.trim() ||
      document.querySelector('[data-testid="review-score-right-component"]')?.parentElement?.textContent?.trim() ||
      '0';
    const reviewCountMatch = reviewCountText.match(/[\d,]+/);
    const reviewCount = reviewCountMatch ? parseInt(reviewCountMatch[0].replace(/,/g, ''), 10) : 0;

    // Hotel ID from URL
    const url = window.location.href;
    const hotelIdMatch = url.match(/\/hotel\/([a-z]{2})\/([^/.]+)/);
    const hotelId = hotelIdMatch ? `${hotelIdMatch[1]}/${hotelIdMatch[2]}` : url;

    return {
      hotel_id: hotelId,
      hotel_name: hotelName,
      location,
      rating,
      review_count: reviewCount,
      url,
    };
  } catch (error) {
    console.error('DoNotStay: Error scraping hotel info', error);
    return null;
  }
}

/**
 * Scrape reviews from Booking.com hotel page
 * Uses multiple selector strategies for resilience
 */
export async function scrapeReviews(): Promise<ScrapedReview[]> {
  const reviews: ScrapedReview[] = [];

  try {
    // First, try to find review containers
    const reviewContainers = findReviewContainers();

    for (const container of reviewContainers) {
      if (reviews.length >= MAX_REVIEWS) break;

      const review = parseReviewContainer(container);
      if (review) {
        reviews.push(review);
      }
    }

    // If we didn't get enough reviews, try expanding or loading more
    if (reviews.length < 10 && reviewContainers.length > 0) {
      await tryLoadMoreReviews();

      // Try again after loading more
      const moreContainers = findReviewContainers();
      for (const container of moreContainers) {
        if (reviews.length >= MAX_REVIEWS) break;

        // Skip if we already have this review
        const review = parseReviewContainer(container);
        if (review && !reviews.some(r => r.text === review.text && r.author === review.author)) {
          reviews.push(review);
        }
      }
    }

    console.log(`DoNotStay: Found ${reviews.length} reviews`);
    return reviews;
  } catch (error) {
    console.error('DoNotStay: Error scraping reviews', error);
    return reviews;
  }
}

/**
 * Find review container elements using multiple strategies
 */
function findReviewContainers(): Element[] {
  // Strategy 1: data-testid selectors (most stable)
  let containers = Array.from(document.querySelectorAll('[data-testid="review-card"]'));
  if (containers.length > 0) return containers;

  // Strategy 2: Class-based selectors
  containers = Array.from(document.querySelectorAll('.review_list_new_item_block'));
  if (containers.length > 0) return containers;

  // Strategy 3: Newer Booking.com layout
  containers = Array.from(document.querySelectorAll('[data-testid="PropertyReviewCard"]'));
  if (containers.length > 0) return containers;

  // Strategy 4: Look for review-like structures
  containers = Array.from(document.querySelectorAll('.c-review-block'));
  if (containers.length > 0) return containers;

  // Strategy 5: Generic fallback
  containers = Array.from(document.querySelectorAll('[class*="review"][class*="item"]'));

  return containers;
}

/**
 * Parse a single review container into structured data
 */
function parseReviewContainer(container: Element): ScrapedReview | null {
  try {
    // Author name
    const author =
      container.querySelector('[data-testid="review-author"]')?.textContent?.trim() ||
      container.querySelector('.bui-avatar-block__title')?.textContent?.trim() ||
      container.querySelector('[class*="reviewer_name"]')?.textContent?.trim() ||
      'Anonymous';

    // Country
    const country =
      container.querySelector('[data-testid="review-country"]')?.textContent?.trim() ||
      container.querySelector('.bui-avatar-block__subtitle')?.textContent?.trim() ||
      container.querySelector('[class*="reviewer_country"]')?.textContent?.trim() ||
      undefined;

    // Score
    const scoreText =
      container.querySelector('[data-testid="review-score"]')?.textContent?.trim() ||
      container.querySelector('.bui-review-score__badge')?.textContent?.trim() ||
      container.querySelector('[class*="review_score"]')?.textContent?.trim() ||
      '0';
    const score = parseFloat(scoreText) || 0;

    // Date
    const date =
      container.querySelector('[data-testid="review-date"]')?.textContent?.trim() ||
      container.querySelector('.c-review-block__date')?.textContent?.trim() ||
      container.querySelector('[class*="review_date"]')?.textContent?.trim() ||
      '';

    // Title
    const title =
      container.querySelector('[data-testid="review-title"]')?.textContent?.trim() ||
      container.querySelector('.c-review-block__title')?.textContent?.trim() ||
      undefined;

    // Positive (pros)
    const prosElement =
      container.querySelector('[data-testid="review-positive-text"]') ||
      container.querySelector('.c-review__row--positive .c-review__body') ||
      container.querySelector('[class*="positive"] [class*="text"]');
    const pros = prosElement?.textContent?.trim();

    // Negative (cons)
    const consElement =
      container.querySelector('[data-testid="review-negative-text"]') ||
      container.querySelector('.c-review__row--negative .c-review__body') ||
      container.querySelector('[class*="negative"] [class*="text"]');
    const cons = consElement?.textContent?.trim();

    // Full text (if pros/cons not found separately)
    const fullText =
      container.querySelector('[data-testid="review-text"]')?.textContent?.trim() ||
      container.querySelector('.review_content')?.textContent?.trim();

    // Skip if we have no content at all
    if (!pros && !cons && !fullText) {
      return null;
    }

    return {
      author,
      country,
      score,
      date,
      title,
      pros,
      cons,
      text: fullText,
    };
  } catch (error) {
    console.error('DoNotStay: Error parsing review container', error);
    return null;
  }
}

/**
 * Try to load more reviews by clicking "load more" or scrolling
 */
async function tryLoadMoreReviews(): Promise<void> {
  // Look for "load more" or "show all reviews" button
  const loadMoreButton =
    document.querySelector('[data-testid="read-all-reviews"]') ||
    document.querySelector('[data-testid="load-more-reviews"]') ||
    document.querySelector('.show_all_reviews_btn') ||
    document.querySelector('[class*="load-more"]');

  if (loadMoreButton && loadMoreButton instanceof HTMLElement) {
    loadMoreButton.click();
    // Wait for reviews to load
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
}
