/**
 * Application configuration.
 * 
 * Environment variables can be set via .env files or deployment platform.
 */

export const config = {
  // Backend API URL
  apiUrl: import.meta.env['VITE_API_URL'] || 'http://localhost:8000',
  
  // Enable real voice (set to false to use mock during development)
  enableRealVoice: import.meta.env['VITE_ENABLE_REAL_VOICE'] === 'true',
  
  // Debug mode
  debug: import.meta.env.DEV,
} as const;
