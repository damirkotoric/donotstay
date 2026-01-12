export interface ScrapedReview {
  author: string;
  country?: string;
  score: number;
  date: string;
  title?: string;
  pros?: string;
  cons?: string;
  text?: string;
}

export interface HotelInfo {
  hotel_id: string;
  hotel_name: string;
  location: string;
  rating: number;
  review_count: number;
  url: string;
}
