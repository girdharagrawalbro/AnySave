import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DownloadJob } from '../api/downloader';

interface Props {
  job: DownloadJob;
  onDelete: () => void;
}

const STATUS_LABEL: Record<DownloadJob['status'], string> = {
  pending: 'Queued',
  resolving: 'Resolving…',
  downloading: 'Downloading…',
  processing: 'Processing…',
  done: 'Done',
  failed: 'Failed',
};

export function JobProgressItem({ job, onDelete }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{job.title || job.url}</Text>
        <Text style={styles.meta}>{job.platform} · {STATUS_LABEL[job.status]}</Text>
        {job.status === 'downloading' && (
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${job.progress_percent}%` }]} />
          </View>
        )}
        {job.status === 'failed' && <Text style={styles.error} numberOfLines={2}>{job.error}</Text>}
      </View>
      <Pressable onPress={onDelete} hitSlop={8}>
        <Text style={styles.delete}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  info: { flex: 1, gap: 4 },
  title: { fontWeight: '600', color: '#111' },
  meta: { fontSize: 12, color: '#777' },
  track: { height: 4, backgroundColor: '#eee', borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, backgroundColor: '#2563eb' },
  error: { fontSize: 12, color: '#dc2626' },
  delete: { fontSize: 16, color: '#999', paddingHorizontal: 4 },
});
