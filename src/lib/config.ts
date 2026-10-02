/**
 * Application configuration.
 * 
 * Environment variables can be set via .env files or deployment platform.
 */

const configuredApiUrl = import.meta.env['VITE_API_URL'] || 'http://localhost:8000';
const apiUrl = import.meta.env.PROD
  ? configuredApiUrl.replace(/^http:\/\//i, 'https://')
  : configuredApiUrl;

export const config = {
  // Backend API URL
  apiUrl: apiUrl.replace(/\/+$/, ''),
  
  // Enable real voice (set to false to use mock during development)
  enableRealVoice: import.meta.env['VITE_ENABLE_REAL_VOICE'] === 'true',
  
  // Debug mode
  debug: import.meta.env.DEV,
} as const;
