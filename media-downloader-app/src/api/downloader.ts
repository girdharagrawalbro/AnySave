import { client } from './client';

export type ContentKind = 'video' | 'audio' | 'photo';

export interface ResolveResult {
  platform: string;
  title: string;
  thumbnail_url: string;
  duration: number | null;
  qualities: string[];
}

export interface DownloadJob {
  id: number;
  url: string;
  platform: string;
  status: 'pending' | 'resolving' | 'downloading' | 'processing' | 'done' | 'failed';
  title: string;
  thumbnail_url: string;
  file_path: string;
  file_url: string | null;
  file_size_bytes: number | null;
  quality: string;
  progress_percent: number;
  error: string;
  created_at: string;
  updated_at: string;
}

export function inferContentKind(result: ResolveResult): ContentKind {
  if (result.platform === 'spotify') return 'audio';
  if (!result.duration) return 'photo';
  return 'video';
}

export async function resolveUrl(url: string): Promise<ResolveResult> {
  const { data } = await client.post('/resolve/', { url });
  return data;
}

export async function startDownload(url: string, quality?: string): Promise<DownloadJob> {
  const { data } = await client.post('/download/', { url, quality });
  return data;
}

export async function getJobStatus(jobId: number): Promise<DownloadJob> {
  const { data } = await client.get(`/jobs/${jobId}/status/`);
  return data;
}

export async function listJobs(): Promise<DownloadJob[]> {
  const { data } = await client.get('/jobs/');
  return data;
}

export async function deleteJob(jobId: number): Promise<void> {
  await client.delete(`/jobs/${jobId}/`);
}
