import { client } from '../openapi-client';

export function initializeApiClient() {
  client.setConfig({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3004',
  });
}
