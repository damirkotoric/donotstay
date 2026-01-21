declare const __DEV__: boolean;

export const WEB_URL = __DEV__ ? 'http://localhost:3000' : 'https://donotstay.app';
export const API_URL = `${WEB_URL}/api`;
