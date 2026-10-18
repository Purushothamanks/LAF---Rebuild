// Configurable API Client with automatic backend resolution
export function getApiBase() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('laf_custom_backend');
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/$/, '');
    }
  }
  return '';
}

export function apiUrl(endpoint) {
  const base = getApiBase();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${cleanEndpoint}`;
}
