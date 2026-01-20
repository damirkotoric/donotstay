import type { CreditPackType } from '../constants/rate-limits';
import type { HotelInfo, ScrapedReview } from './review';
import type { VerdictResult } from './verdict';

export interface AnalyzeRequest {
  hotel: HotelInfo;
  reviews: ScrapedReview[];
}

export interface AnalyzeResponse extends VerdictResult {
  hotel_id: string;
  review_count_analyzed: number;
  // Rate limit info - synced from server
  credits_remaining?: number;
  // Blur fields for free tiers - visible count indicates how many items to show unblurred
  is_blurred?: boolean;
  red_flags_visible_count?: number;
  avoid_if_visible_count?: number;
  // Date when this verdict was originally analyzed (only present for cached results)
  analyzed_at?: string;
}

export type UserTier = 'anonymous' | 'authenticated';

export interface RateLimitInfo {
  credits_remaining: number;
  tier: UserTier;
  requires_signup: boolean;
  requires_purchase: boolean;
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
  credits_remaining: number;
  has_purchased: boolean;
}

export interface FeedbackRequest {
  verdict_id: string;
  type: 'inaccurate' | 'helpful' | 'other';
  details?: string;
}

export interface MagicLinkRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  code: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
  };
}

export interface CreditPurchaseRequest {
  pack_type: CreditPackType;
}

export interface CreditPurchaseResponse {
  checkout_url: string;
}
