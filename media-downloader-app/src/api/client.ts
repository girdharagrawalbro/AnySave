import axios from 'axios';

// Point this at your Django server's LAN or VPN address, e.g. http://192.168.1.20:8000
export let SERVER_URL = 'https://anysave-2yg8.onrender.com';
export let API_KEY = '';

export function configureServer(url: string, apiKey: string) {
  SERVER_URL = url.replace(/\/$/, '');
  API_KEY = apiKey;
  client.defaults.baseURL = `${SERVER_URL}/api`;
  client.defaults.headers.common['X-API-Key'] = apiKey;
}

export const client = axios.create({
  baseURL: `${SERVER_URL}/api`,
  headers: API_KEY ? { 'X-API-Key': API_KEY } : {},
});

export function mediaUrl(path: string) {
  return `${SERVER_URL}${path.startsWith('/media/') ? path : `/media/${path}`}`;
}

export function authHeaders(): Record<string, string> {
  return API_KEY ? { 'X-API-Key': API_KEY } : {};
}

export function streamUrl(sourceUrl: string, quality?: string) {
  const params = new URLSearchParams({ url: sourceUrl });
  if (quality) params.set('quality', quality);
  return `${SERVER_URL}/api/stream/?${params.toString()}`;
}
