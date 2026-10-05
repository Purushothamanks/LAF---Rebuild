// Configurable API Client with automatic backend resolution
const DEFAULT_TUNNEL_BACKEND = 'https://translation-moms-learning-hearings.trycloudflare.com';

export function getApiBase() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('laf_custom_backend');
    if (custom) return custom.replace(/\/$/, '');

    // If served from Firebase Hosting (web.app / firebaseapp.com)
    if (window.location.hostname.includes('web.app') || window.location.hostname.includes('firebaseapp.com')) {
      return DEFAULT_TUNNEL_BACKEND;
    }
  }
  return '';
}

export function apiUrl(endpoint) {
  const base = getApiBase();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${cleanEndpoint}`;
}
