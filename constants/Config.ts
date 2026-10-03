const ENV_URL = process.env.EXPO_PUBLIC_API_URL?.trim();

if (!ENV_URL) {
  throw new Error('EXPO_PUBLIC_API_URL must be configured for this build.');
}

if (!ENV_URL.startsWith('https://')) {
  throw new Error('EXPO_PUBLIC_API_URL must use HTTPS.');
}

export const BASE_URL = ENV_URL.replace(/\/$/, '');
export const API_URL = `${BASE_URL}/api`;
