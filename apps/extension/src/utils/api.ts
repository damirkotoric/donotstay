import type {
  AnalyzeRequest,
  AnalyzeResponse,
  ApiError,
  UserInfo,
  FeedbackRequest,
  CheckoutRequest,
  CheckoutResponse
} from '@donotstay/shared';
import { getStoredToken } from './auth';

const API_URL = 'http://localhost:3000/api';

async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T | ApiError> {
  try {
    const token = await getStoredToken();

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return data as ApiError;
    }

    return data as T;
  } catch (error) {
    console.error('API request failed:', error);
    return {
      error: 'Network error. Please check your connection.',
      code: 'NETWORK_ERROR',
    };
  }
}

export async function analyzeHotel(request: AnalyzeRequest): Promise<AnalyzeResponse | ApiError> {
  return fetchWithAuth<AnalyzeResponse>('/analyze', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function getUser(): Promise<UserInfo | ApiError> {
  return fetchWithAuth<UserInfo>('/user');
}

export async function submitFeedback(request: FeedbackRequest): Promise<{ success: boolean } | ApiError> {
  return fetchWithAuth<{ success: boolean }>('/feedback', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function createCheckout(request: CheckoutRequest): Promise<CheckoutResponse | ApiError> {
  return fetchWithAuth<CheckoutResponse>('/stripe/create-checkout', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function requestMagicLink(email: string): Promise<{ success: boolean } | ApiError> {
  return fetchWithAuth<{ success: boolean }>('/auth/magic-link', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function isApiError(response: unknown): response is ApiError {
  return typeof response === 'object' && response !== null && 'error' in response;
}
