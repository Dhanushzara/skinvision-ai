// For physical device testing: copy .env.example → .env and set your machine's local IP
// Android emulator → localhost maps to 10.0.2.2
// iOS simulator → localhost works directly
export const API_BASE =
  (process.env.EXPO_PUBLIC_API_URL as string | undefined) ?? 'http://10.0.2.2:8000';

export const ENDPOINTS = {
  analyze: `${API_BASE}/api/analyze`,
  scans: `${API_BASE}/api/scans`,
  scan: (id: string) => `${API_BASE}/api/scans/${id}`,
  health: `${API_BASE}/health`,
};
