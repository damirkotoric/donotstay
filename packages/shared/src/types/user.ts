import type { CreditPackType } from '../constants/rate-limits';

export interface User {
  id: string;
  email: string;
  created_at: string;
  stripe_customer_id: string | null;
  credits_remaining: number;
  // Legacy field - kept for backwards compatibility during migration
  subscription_status?: 'free' | 'monthly' | 'annual';
  subscription_ends_at?: string | null;
}

export interface Check {
  id: string;
  user_id: string | null;
  hotel_id: string;
  checked_at: string;
}

export interface CreditPurchase {
  id: string;
  user_id: string;
  stripe_payment_intent_id: string | null;
  pack_type: CreditPackType;
  credits_amount: number;
  amount_paid_cents: number;
  purchased_at: string;
}

export interface Feedback {
  id: string;
  user_id: string;
  verdict_id: string;
  type: 'inaccurate' | 'helpful' | 'other';
  details: string | null;
  created_at: string;
}
