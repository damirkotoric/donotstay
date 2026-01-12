export interface User {
  id: string;
  email: string;
  created_at: string;
  stripe_customer_id: string | null;
  subscription_status: 'free' | 'monthly' | 'annual';
  subscription_ends_at: string | null;
}

export interface Check {
  id: string;
  user_id: string | null;
  hotel_id: string;
  checked_at: string;
}

export interface Feedback {
  id: string;
  user_id: string;
  verdict_id: string;
  type: 'inaccurate' | 'helpful' | 'other';
  details: string | null;
  created_at: string;
}
