/**
 * Chrome runtime messaging utilities
 */

import type { AnalyzeResponse, ApiError, HotelInfo, ScrapedReview, UserInfo } from '@donotstay/shared';

// Message types
export type MessageType =
  | 'ANALYZE_HOTEL'
  | 'GET_AUTH_STATUS'
  | 'TRIGGER_ANALYSIS'
  | 'AUTH_UPDATED'
  | 'OPEN_SIDEBAR';

export interface AnalyzeHotelMessage {
  type: 'ANALYZE_HOTEL';
  hotel: HotelInfo;
  reviews: ScrapedReview[];
}

export interface GetAuthStatusMessage {
  type: 'GET_AUTH_STATUS';
}

export interface TriggerAnalysisMessage {
  type: 'TRIGGER_ANALYSIS';
}

export interface AuthUpdatedMessage {
  type: 'AUTH_UPDATED';
  authenticated: boolean;
  user: UserInfo | null;
}

export interface OpenSidebarMessage {
  type: 'OPEN_SIDEBAR';
}

export type ExtensionMessage =
  | AnalyzeHotelMessage
  | GetAuthStatusMessage
  | TriggerAnalysisMessage
  | AuthUpdatedMessage
  | OpenSidebarMessage;

/**
 * Send message to background script
 */
export function sendToBackground<T>(message: ExtensionMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Send message to content script in active tab
 */
export async function sendToActiveTab(message: ExtensionMessage): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    await chrome.tabs.sendMessage(tab.id, message);
  }
}

/**
 * Send message to content script in specific tab
 */
export async function sendToTab(tabId: number, message: ExtensionMessage): Promise<void> {
  await chrome.tabs.sendMessage(tabId, message);
}

/**
 * Analyze hotel via background script
 */
export async function analyzeHotelViaBackground(
  hotel: HotelInfo,
  reviews: ScrapedReview[]
): Promise<AnalyzeResponse | ApiError> {
  return sendToBackground<AnalyzeResponse | ApiError>({
    type: 'ANALYZE_HOTEL',
    hotel,
    reviews,
  });
}

/**
 * Get auth status from background
 */
export async function getAuthStatus(): Promise<{ authenticated: boolean; user: UserInfo | null }> {
  return sendToBackground<{ authenticated: boolean; user: UserInfo | null }>({
    type: 'GET_AUTH_STATUS',
  });
}
