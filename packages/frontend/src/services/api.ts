const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const api = {
  async fetch(endpoint: string, options?: RequestInit) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    return response.json();
  },
};
