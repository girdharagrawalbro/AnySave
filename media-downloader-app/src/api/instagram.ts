import { client } from './client';

export function isInstagramUrl(url: string) {
  return /instagram\.com/i.test(url);
}

export function extractShortcode(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/i);
  return match ? match[1] : null;
}

export interface IGStatus {
  logged_in: boolean;
  username?: string;
  last_used?: string;
}

export interface IGFollowee {
  username: string;
  full_name: string;
}

export interface IGPost {
  shortcode: string;
  caption: string;
  is_video: boolean;
  thumbnail_url: string;
  media_url: string;
}

export async function login(username: string, password: string) {
  const { data } = await client.post('/instagram/login/', { username, password });
  return data;
}

export async function loginWithCookies(cookies: Record<string, string>) {
  const { data } = await client.post('/instagram/login-with-cookies/', { cookies });
  return data;
}

export async function logout() {
  const { data } = await client.post('/instagram/logout/');
  return data;
}

export async function getStatus(): Promise<IGStatus> {
  const { data } = await client.get('/instagram/status/');
  return data;
}

export async function listFollowing(): Promise<IGFollowee[]> {
  const { data } = await client.get('/instagram/following/');
  return data;
}

export async function listProfilePosts(username: string): Promise<IGPost[]> {
  const { data } = await client.get(`/instagram/profile/${username}/posts/`);
  return data;
}

export async function savePost(shortcode: string): Promise<{ job_id: number }> {
  const { data } = await client.post('/instagram/save/', { shortcode });
  return data;
}
