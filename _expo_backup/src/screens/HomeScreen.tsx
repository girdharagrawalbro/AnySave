import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { inferContentKind, resolveUrl, startDownload, ResolveResult } from '../api/downloader';
import { useJobPolling } from '../hooks/useJobPolling';
import { LinkInputBar } from '../components/LinkInputBar';
import { MediaPreviewCard } from '../components/MediaPreviewCard';

export function HomeScreen() {
  const [resolving, setResolving] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('');
  const [result, setResult] = useState<ResolveResult | null>(null);
  const [quality, setQuality] = useState('');
  const [jobId, setJobId] = useState<number | null>(null);

  const job = useJobPolling(jobId);

  const handleResolve = async (url: string) => {
    setResolving(true);
    setResult(null);
    setJobId(null);
    try {
      const data = await resolveUrl(url);
      setSourceUrl(url);
      setResult(data);
      setQuality(data.qualities[0] ?? '');
    } catch (err: any) {
      Alert.alert('Could not resolve link', err?.response?.data?.error ?? err.message);
    } finally {
      setResolving(false);
    }
  };

  const handleDownload = async () => {
    try {
      const created = await startDownload(sourceUrl, quality);
      setJobId(created.id);
    } catch (err: any) {
      Alert.alert('Could not start download', err?.response?.data?.error ?? err.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Add a link</Text>
      <LinkInputBar onSubmit={handleResolve} loading={resolving} />

      {result && (
        <View style={styles.previewWrap}>
          <MediaPreviewCard
            kind={inferContentKind(result)}
            title={result.title}
            thumbnailUrl={result.thumbnail_url}
            sourceUrl={sourceUrl}
            qualities={result.qualities}
            selectedQuality={quality}
            onSelectQuality={setQuality}
            onDownload={handleDownload}
            downloading={job != null && job.status !== 'done' && job.status !== 'failed'}
          />
        </View>
      )}

      {job && (
        <View style={styles.jobStatus}>
          {job.status === 'done' && <Text style={styles.jobDone}>Saved to your library ✓</Text>}
          {job.status === 'failed' && <Text style={styles.jobFailed}>Failed: {job.error}</Text>}
          {job.status !== 'done' && job.status !== 'failed' && (
            <Text style={styles.jobProgress}>{job.status}… {job.progress_percent}%</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  heading: { fontSize: 22, fontWeight: '700', color: '#111' },
  previewWrap: { marginTop: 8 },
  jobStatus: { marginTop: 4 },
  jobDone: { color: '#16a34a', fontWeight: '600' },
  jobFailed: { color: '#dc2626', fontWeight: '600' },
  jobProgress: { color: '#555' },
});
