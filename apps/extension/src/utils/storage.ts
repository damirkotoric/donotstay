/**
 * Chrome storage utilities
 */

export interface StorageData {
  authToken?: string;
  user?: {
    id: string;
    email: string;
    subscription_status: string;
  };
  anonymousId?: string;
  lastCheck?: {
    hotelId: string;
    timestamp: number;
  };
}

/**
 * Get value from chrome.storage.local
 */
export async function getLocal<K extends keyof StorageData>(
  key: K
): Promise<StorageData[K] | undefined> {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key]);
    });
  });
}

/**
 * Set value in chrome.storage.local
 */
export async function setLocal<K extends keyof StorageData>(
  key: K,
  value: StorageData[K]
): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

/**
 * Remove value from chrome.storage.local
 */
export async function removeLocal(keys: (keyof StorageData)[]): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(keys as string[], resolve);
  });
}

/**
 * Get multiple values from chrome.storage.local
 */
export async function getLocalMultiple<K extends keyof StorageData>(
  keys: K[]
): Promise<Pick<StorageData, K>> {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys as string[], (result) => {
      resolve(result as Pick<StorageData, K>);
    });
  });
}

/**
 * Clear all storage
 */
export async function clearLocal(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.clear(resolve);
  });
}
