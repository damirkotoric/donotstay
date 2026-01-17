import type { HotelInfo } from '@donotstay/shared';

export interface GraphQLParams {
  hotelId: number;
  ufi: number;
  countryCode: string;
  pageviewId: string;
}

/**
 * Extract hotel information from URL and page
 * Reviews are fetched separately via the background script API
 */
export function scrapeHotelInfo(): HotelInfo | null {
  try {
    const url = window.location.href;

    // Extract country code and hotel slug from URL
    // Format: https://www.booking.com/hotel/<cc>/<slug>.html
    const hotelIdMatch = url.match(/\/hotel\/([a-z]{2})\/([^/.?]+)/);
    if (!hotelIdMatch) {
      console.error('DoNotStay: Could not parse hotel ID from URL');
      return null;
    }

    const cc1 = hotelIdMatch[1]; // Country code (e.g., "gb", "us")
    const pagename = hotelIdMatch[2]; // Hotel slug
    const hotelId = `${cc1}/${pagename}`;

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

    // Rating - try multiple strategies
    const rating = extractRating();

    // Review count - try multiple strategies
    const reviewCount = extractReviewCount();

    return {
      hotel_id: hotelId,
      hotel_name: hotelName,
      location,
      rating,
      review_count: reviewCount,
      url,
      // Additional fields for review fetching
      cc1,
      pagename,
    };
  } catch (error) {
    console.error('DoNotStay: Error scraping hotel info', error);
    return null;
  }
}

/**
 * Extract parameters needed for GraphQL API calls from the page
 */
export function scrapeGraphQLParams(): GraphQLParams | null {
  try {
    // Extract numeric hotelId from Schema.org JSON-LD
    const hotelId = extractHotelIdFromJsonLd();
    if (!hotelId) {
      console.error('DoNotStay: Could not find numeric hotel ID');
      return null;
    }

    // Extract ufi (location ID) from page context
    const ufi = extractUfi();
    if (!ufi) {
      console.error('DoNotStay: Could not find ufi');
      return null;
    }

    // Extract country code from URL
    const countryMatch = window.location.pathname.match(/\/hotel\/([a-z]{2})\//);
    const countryCode = countryMatch ? countryMatch[1] : '';

    // Extract pageview_id from window.B.env
    const pageviewId = extractPageviewId();
    if (!pageviewId) {
      console.error('DoNotStay: Could not find pageview ID');
      return null;
    }

    return { hotelId, ufi, countryCode, pageviewId };
  } catch (error) {
    console.error('DoNotStay: Error extracting GraphQL params', error);
    return null;
  }
}

/**
 * Extract rating using multiple strategies
 */
function extractRating(): number {
  // Strategy 1: Direct selectors (various Booking.com layouts)
  const selectors = [
    '[data-testid="review-score-component"] .a3b8729ab1',
    '[data-testid="review-score-component"] [class*="d0522b"]', // Score badge
    '.bui-review-score__badge',
    '[data-testid="review-score-right-component"]',
    '.review-score-badge',
    '[class*="review-score"] [class*="badge"]',
    // Aparthotel/apartment specific
    '[data-testid="review-score-component"]',
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) {
      const text = el.textContent?.trim() || '';
      // Extract first number that looks like a rating (1-10 scale, may have decimal)
      const match = text.match(/\b(\d+\.?\d?)\b/);
      if (match) {
        const rating = parseFloat(match[1]);
        // Valid Booking.com ratings are 1-10
        if (rating >= 1 && rating <= 10) {
          console.log(`DoNotStay: Found rating ${rating} via selector: ${selector}`);
          return rating;
        }
      }
    }
  }

  // Strategy 2: JSON-LD structured data
  const jsonLdRating = extractRatingFromJsonLd();
  if (jsonLdRating) {
    console.log(`DoNotStay: Found rating ${jsonLdRating} via JSON-LD`);
    return jsonLdRating;
  }

  // Strategy 3: Look for "Exceptional/Superb/Fabulous X.X" pattern anywhere
  const scoreContainers = document.querySelectorAll('[class*="score"], [class*="review"], [class*="rating"]');
  for (const container of scoreContainers) {
    const text = container.textContent || '';
    // Match patterns like "Exceptional 9.6" or "9.6 Exceptional"
    const match = text.match(/(?:Exceptional|Superb|Fabulous|Very Good|Good|Pleasant|Review score|Wonderful)\s*(\d+\.?\d?)/i) ||
                  text.match(/(\d+\.?\d?)\s*(?:Exceptional|Superb|Fabulous|Very Good|Good|Pleasant|Wonderful)/i);
    if (match) {
      const rating = parseFloat(match[1]);
      if (rating >= 1 && rating <= 10) {
        console.log(`DoNotStay: Found rating ${rating} via text pattern`);
        return rating;
      }
    }
  }

  console.warn('DoNotStay: Could not extract rating, defaulting to 0');
  return 0;
}

/**
 * Extract rating from JSON-LD structured data
 */
function extractRatingFromJsonLd(): number | null {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent || '');
      // Check for aggregateRating in various schema types
      const schemas = Array.isArray(data) ? data : [data];
      for (const schema of schemas) {
        if (schema.aggregateRating?.ratingValue) {
          const rating = parseFloat(schema.aggregateRating.ratingValue);
          if (!isNaN(rating) && rating >= 1 && rating <= 10) {
            return rating;
          }
        }
        // Also check nested structures
        if (schema['@graph']) {
          for (const item of schema['@graph']) {
            if (item.aggregateRating?.ratingValue) {
              const rating = parseFloat(item.aggregateRating.ratingValue);
              if (!isNaN(rating) && rating >= 1 && rating <= 10) {
                return rating;
              }
            }
          }
        }
      }
    } catch {
      // Continue to next script
    }
  }
  return null;
}

/**
 * Extract review count using multiple strategies
 */
function extractReviewCount(): number {
  // Strategy 1: Direct selectors
  const selectors = [
    '[data-testid="review-score-component"] .abf093bdfe',
    '[data-testid="review-score-component"]',
    '.bui-review-score__text',
    '[data-testid="review-score-right-component"]',
    '[class*="review-score"] [class*="text"]',
    '[class*="reviews-count"]',
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) {
      const text = el.textContent || '';
      // Match "X reviews" or "X review" pattern
      const match = text.match(/(\d[\d,]*)\s*reviews?/i);
      if (match) {
        const count = parseInt(match[1].replace(/,/g, ''), 10);
        if (count > 0) {
          console.log(`DoNotStay: Found review count ${count} via selector: ${selector}`);
          return count;
        }
      }
    }
  }

  // Strategy 2: JSON-LD structured data
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent || '');
      const schemas = Array.isArray(data) ? data : [data];
      for (const schema of schemas) {
        if (schema.aggregateRating?.reviewCount) {
          const count = parseInt(schema.aggregateRating.reviewCount, 10);
          if (!isNaN(count) && count > 0) {
            console.log(`DoNotStay: Found review count ${count} via JSON-LD`);
            return count;
          }
        }
      }
    } catch {
      // Continue
    }
  }

  // Strategy 3: Look for "Guest reviews (X)" in tabs
  const tabs = document.querySelectorAll('[class*="tab"], [role="tab"]');
  for (const tab of tabs) {
    const text = tab.textContent || '';
    const match = text.match(/reviews?\s*\((\d[\d,]*)\)/i);
    if (match) {
      const count = parseInt(match[1].replace(/,/g, ''), 10);
      if (count > 0) {
        console.log(`DoNotStay: Found review count ${count} via tab`);
        return count;
      }
    }
  }

  console.warn('DoNotStay: Could not extract review count, defaulting to 0');
  return 0;
}

/**
 * Extract numeric hotel ID from Schema.org JSON-LD embedded in page
 */
function extractHotelIdFromJsonLd(): number | null {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent || '');
      // Look for Hotel schema with identifier
      if (data['@type'] === 'Hotel' && data.identifier) {
        const id = parseInt(data.identifier, 10);
        if (!isNaN(id)) return id;
      }
      // Also check for array of schemas
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item['@type'] === 'Hotel' && item.identifier) {
            const id = parseInt(item.identifier, 10);
            if (!isNaN(id)) return id;
          }
        }
      }
    } catch {
      // Continue to next script tag
    }
  }

  // Fallback: try to find hotel_id in page scripts
  const allScripts = document.querySelectorAll('script:not([src])');
  for (const script of allScripts) {
    const content = script.textContent || '';
    // Look for b_hotel_id or hotelId patterns
    const match = content.match(/b_hotel_id["']?\s*[:=]\s*["']?(\d+)/) ||
                  content.match(/hotelId["']?\s*[:=]\s*["']?(\d+)/) ||
                  content.match(/"hotel_id"\s*:\s*(\d+)/);
    if (match) {
      const id = parseInt(match[1], 10);
      if (!isNaN(id)) return id;
    }
  }

  return null;
}

/**
 * Extract ufi (location identifier) from page context
 */
function extractUfi(): number | null {
  // Try to find ufi in inline scripts
  const allScripts = document.querySelectorAll('script:not([src])');
  for (const script of allScripts) {
    const content = script.textContent || '';
    // Look for ufi or dest_id patterns
    const match = content.match(/["']ufi["']\s*[:=]\s*(-?\d+)/) ||
                  content.match(/ufi\s*[:=]\s*(-?\d+)/) ||
                  content.match(/dest_id["']?\s*[:=]\s*["']?(-?\d+)/) ||
                  content.match(/"destId"\s*:\s*(-?\d+)/);
    if (match) {
      const id = parseInt(match[1], 10);
      if (!isNaN(id)) return id;
    }
  }

  // Fallback: try window.booking object
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    if (win.booking?.env?.b_dest_id) {
      return parseInt(win.booking.env.b_dest_id, 10);
    }
    if (win.B?.env?.b_dest_id) {
      return parseInt(win.B.env.b_dest_id, 10);
    }
  } catch {
    // Ignore errors accessing window properties
  }

  return null;
}

/**
 * Extract pageview_id from window.B.env
 */
function extractPageviewId(): string | null {
  // Try direct access to window.B.env
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    if (win.B?.env?.pageview_id) {
      return win.B.env.pageview_id;
    }
    if (win.booking?.env?.pageview_id) {
      return win.booking.env.pageview_id;
    }
  } catch {
    // Ignore errors
  }

  // Fallback: parse from inline scripts
  const allScripts = document.querySelectorAll('script:not([src])');
  for (const script of allScripts) {
    const content = script.textContent || '';
    const match = content.match(/pageview_id["']?\s*[:=]\s*["']([a-f0-9]+)["']/);
    if (match) {
      return match[1];
    }
  }

  return null;
}
