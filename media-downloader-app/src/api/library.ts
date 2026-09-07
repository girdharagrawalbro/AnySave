import RNFS from 'react-native-fs';
import Share from 'react-native-share';

import { authHeaders, client, mediaUrl } from './client';
import { DownloadJob } from './downloader';

export async function saveToDevice(fileUrl: string, filename: string): Promise<string> {
  const dir = `${RNFS.DocumentDirectoryPath}/downloads`;
  await RNFS.mkdir(dir);
  const toFile = `${dir}/${filename}`;
  const { promise } = RNFS.downloadFile({
    fromUrl: mediaUrl(fileUrl),
    toFile,
    headers: authHeaders(),
  });
  await promise;
  return toFile;
}

export async function shareFile(localPath: string) {
  await Share.open({ url: `file://${localPath}` });
}

export async function listLibrary(platform?: string): Promise<DownloadJob[]> {
  const { data } = await client.get('/library/', { params: platform ? { platform } : {} });
  return data;
}

export async function deleteLibraryItem(id: number): Promise<void> {
  await client.delete(`/library/${id}/`);
}
