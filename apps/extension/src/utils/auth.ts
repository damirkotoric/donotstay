const AUTH_TOKEN_KEY = 'authToken';
const USER_KEY = 'user';

export interface StoredUser {
  id: string;
  email: string;
  subscription_status: string;
}

/**
 * Get stored auth token from chrome.storage
 */
export async function getStoredToken(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get([AUTH_TOKEN_KEY], (result) => {
      resolve(result[AUTH_TOKEN_KEY] || null);
    });
  });
}

/**
 * Store auth token in chrome.storage
 */
export async function setStoredToken(token: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [AUTH_TOKEN_KEY]: token }, resolve);
  });
}

/**
 * Remove stored auth token
 */
export async function clearStoredToken(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove([AUTH_TOKEN_KEY, USER_KEY], resolve);
  });
}

/**
 * Get stored user info
 */
export async function getStoredUser(): Promise<StoredUser | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get([USER_KEY], (result) => {
      resolve(result[USER_KEY] || null);
    });
  });
}

/**
 * Store user info
 */
export async function setStoredUser(user: StoredUser): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [USER_KEY]: user }, resolve);
  });
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getStoredToken();
  return token !== null;
}

/**
 * Generate or get anonymous ID for rate limiting
 */
export async function getAnonymousId(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['anonymousId'], (result) => {
      if (result.anonymousId) {
        resolve(result.anonymousId);
      } else {
        // Generate new ID
        const id = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        chrome.storage.local.set({ anonymousId: id }, () => {
          resolve(id);
        });
      }
    });
  });
}
