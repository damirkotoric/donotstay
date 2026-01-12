/**
 * Normalize a Booking.com hotel URL to extract the hotel ID
 * Examples:
 * - https://www.booking.com/hotel/vn/vian-and-spa-danang.html -> vn/vian-and-spa-danang
 * - https://www.booking.com/hotel/us/hilton-new-york.en-gb.html -> us/hilton-new-york
 */
export function normalizeBookingUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Extract hotel path: /hotel/{country}/{hotel-slug}
    const match = pathname.match(/\/hotel\/([a-z]{2})\/([^/.]+)/);
    if (match) {
      return `booking:${match[1]}/${match[2]}`;
    }

    // Fallback: use full pathname without extension
    return `booking:${pathname.replace(/\.[a-z-]+\.html$/, '').replace('.html', '')}`;
  } catch {
    // If URL parsing fails, hash the raw URL
    return `booking:${url}`;
  }
}

/**
 * Create a simple hash for cache keys
 * Uses a basic hash function suitable for cache keys (not cryptographic)
 */
export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Create a cache key for a hotel
 */
export function createCacheKey(url: string): string {
  return normalizeBookingUrl(url);
}
