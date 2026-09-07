import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { authHeaders, client, mediaUrl } from './client';
import { DownloadJob } from './downloader';

export async function saveToDevice(fileUrl: string, filename: string): Promise<File> {
  const downloads = new Directory(Paths.document, 'downloads');
  downloads.create({ intermediates: true });
  const destination = new File(downloads, filename);
  return File.downloadFileAsync(mediaUrl(fileUrl), destination, {
    idempotent: true,
    headers: authHeaders(),
  });
}

export async function shareFile(file: File) {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri);
  }
}

export async function listLibrary(platform?: string): Promise<DownloadJob[]> {
  const { data } = await client.get('/library/', { params: platform ? { platform } : {} });
  return data;
}

export async function deleteLibraryItem(id: number): Promise<void> {
  await client.delete(`/library/${id}/`);
}
