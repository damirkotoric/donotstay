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

    // Rating
    const ratingText =
      document.querySelector('[data-testid="review-score-component"] .a3b8729ab1')?.textContent?.trim() ||
      document.querySelector('.bui-review-score__badge')?.textContent?.trim() ||
      document.querySelector('[data-testid="review-score-right-component"]')?.textContent?.trim() ||
      '0';
    const rating = parseFloat(ratingText) || 0;

    // Review count - look specifically for "X review(s)" pattern to avoid capturing rating
    const reviewCountText =
      document.querySelector('[data-testid="review-score-component"] .abf093bdfe')?.textContent?.trim() ||
      document.querySelector('.bui-review-score__text')?.textContent?.trim() ||
      document.querySelector('[data-testid="review-score-right-component"]')?.parentElement?.textContent?.trim() ||
      '0';
    // Match number followed by "review" or "reviews" to avoid capturing rating score
    const reviewCountMatch = reviewCountText.match(/(\d[\d,]*)\s*reviews?/i);
    const reviewCount = reviewCountMatch ? parseInt(reviewCountMatch[1].replace(/,/g, ''), 10) : 0;

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
