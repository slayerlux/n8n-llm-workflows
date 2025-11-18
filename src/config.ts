/**
 * Centralised configuration for n8n API access.
 */

export interface N8nConfig {
  baseUrl: string;
  apiKey?: string;
  sessionCookie?: string;
}

export function getDefaultBaseUrl(): string {
  return process.env.N8N_URL || 'http://localhost:5678';
}

export function loadConfig(): N8nConfig {
  return {
    baseUrl: getDefaultBaseUrl(),
    apiKey: process.env.N8N_API_KEY,
    sessionCookie: process.env.N8N_SESSION_COOKIE,
  };
}
