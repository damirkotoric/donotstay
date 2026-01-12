export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          stripe_customer_id: string | null;
          subscription_status: 'free' | 'monthly' | 'annual';
          subscription_ends_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
          stripe_customer_id?: string | null;
          subscription_status?: 'free' | 'monthly' | 'annual';
          subscription_ends_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          stripe_customer_id?: string | null;
          subscription_status?: 'free' | 'monthly' | 'annual';
          subscription_ends_at?: string | null;
        };
      };
      verdicts: {
        Row: {
          id: string;
          hotel_id: string;
          platform: string;
          verdict: string;
          confidence: number;
          one_liner: string;
          red_flags: unknown;
          avoid_if: unknown;
          bottom_line: string;
          review_count: number;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          hotel_id: string;
          platform?: string;
          verdict: string;
          confidence: number;
          one_liner: string;
          red_flags: unknown;
          avoid_if: unknown;
          bottom_line: string;
          review_count: number;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          hotel_id?: string;
          platform?: string;
          verdict?: string;
          confidence?: number;
          one_liner?: string;
          red_flags?: unknown;
          avoid_if?: unknown;
          bottom_line?: string;
          review_count?: number;
          created_at?: string;
          expires_at?: string;
        };
      };
      checks: {
        Row: {
          id: string;
          user_id: string | null;
          hotel_id: string;
          checked_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          hotel_id: string;
          checked_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          hotel_id?: string;
          checked_at?: string;
        };
      };
      feedback: {
        Row: {
          id: string;
          user_id: string;
          verdict_id: string;
          type: string;
          details: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          verdict_id: string;
          type: string;
          details?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          verdict_id?: string;
          type?: string;
          details?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
