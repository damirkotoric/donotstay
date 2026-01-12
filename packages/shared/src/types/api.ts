import type { HotelInfo, ScrapedReview } from './review';
import type { VerdictResult } from './verdict';

export interface AnalyzeRequest {
  hotel: HotelInfo;
  reviews: ScrapedReview[];
}

export interface AnalyzeResponse extends VerdictResult {
  hotel_id: string;
  review_count_analyzed: number;
}

export interface RateLimitInfo {
  remaining: number;
  reset_at: string;
  is_paid: boolean;
}

export interface ApiError {
  error: string;
  code: string;
  rate_limit?: RateLimitInfo;
}

export interface AuthResponse {
  user: UserInfo | null;
  session_token?: string;
}

export interface UserInfo {
  id: string;
  email: string;
  subscription_status: SubscriptionStatus;
  subscription_ends_at: string | null;
  rate_limit: RateLimitInfo;
}

export type SubscriptionStatus = 'free' | 'monthly' | 'annual';

export interface FeedbackRequest {
  verdict_id: string;
  type: 'inaccurate' | 'helpful' | 'other';
  details?: string;
}

export interface MagicLinkRequest {
  email: string;
}

export interface CheckoutRequest {
  plan: 'monthly' | 'annual';
}

export interface CheckoutResponse {
  checkout_url: string;
}
