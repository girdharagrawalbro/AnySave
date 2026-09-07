import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Video from 'react-native-video';

import { authHeaders, streamUrl } from '../api/client';
import { ContentKind } from '../api/downloader';

interface Props {
  kind: ContentKind;
  title: string;
  thumbnailUrl: string;
  sourceUrl: string;
  qualities: string[];
  selectedQuality: string;
  onSelectQuality: (quality: string) => void;
  onDownload: () => void;
  downloading: boolean;
}

export function MediaPreviewCard({
  kind,
  title,
  thumbnailUrl,
  sourceUrl,
  qualities,
  selectedQuality,
  onSelectQuality,
  onDownload,
  downloading,
}: Props) {
  const videoOptions = qualities.filter((q) => q !== 'audio-only');
  const canPickAudioOnly = kind !== 'photo';

  return (
    <View style={styles.card}>
      <View style={styles.previewArea}>
        {kind === 'video' && <VideoPreview sourceUrl={sourceUrl} quality={selectedQuality} />}
        {kind === 'audio' && <AudioPreview sourceUrl={sourceUrl} quality={selectedQuality} thumbnailUrl={thumbnailUrl} />}
        {kind === 'photo' && (
          <Image source={{ uri: sourceUrl || thumbnailUrl }} style={styles.photo} resizeMode="contain" />
        )}
      </View>

      <Text style={styles.title} numberOfLines={2}>{title}</Text>

      {(videoOptions.length > 0 || canPickAudioOnly) && (
        <View style={styles.qualityRow}>
          {kind === 'video' && videoOptions.map((q) => (
            <QualityPill key={q} label={q} active={q === selectedQuality} onPress={() => onSelectQuality(q)} />
          ))}
          {canPickAudioOnly && (
            <QualityPill
              label="Audio only"
              active={selectedQuality === 'audio-only'}
              onPress={() => onSelectQuality('audio-only')}
            />
          )}
        </View>
      )}

      <Pressable style={styles.downloadButton} onPress={onDownload} disabled={downloading}>
        {downloading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.downloadButtonText}>
            Download{selectedQuality === 'audio-only' ? ' audio' : selectedQuality ? ` (${selectedQuality})` : ''}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

function VideoPreview({ sourceUrl, quality }: { sourceUrl: string; quality: string }) {
  return (
    <Video
      style={styles.video}
      source={{ uri: streamUrl(sourceUrl, quality), headers: authHeaders() }}
      controls
      repeat
      paused={false}
      resizeMode="contain"
    />
  );
}

function AudioPreview({
  sourceUrl,
  quality,
  thumbnailUrl,
}: {
  sourceUrl: string;
  quality: string;
  thumbnailUrl: string;
}) {
  const [paused, setPaused] = useState(false);

  return (
    <View style={styles.audioWrap}>
      {thumbnailUrl ? (
        <Image source={{ uri: thumbnailUrl }} style={styles.audioArt} resizeMode="cover" />
      ) : (
        <View style={[styles.audioArt, styles.audioArtPlaceholder]} />
      )}
      <Video
        style={styles.hiddenVideo}
        source={{ uri: streamUrl(sourceUrl, quality || 'audio-only'), headers: authHeaders() }}
        paused={paused}
        repeat
      />
      <Pressable style={styles.audioPlayButton} onPress={() => setPaused((p) => !p)}>
        <Text style={styles.audioPlayButtonText}>{paused ? '▶' : '⏸'}</Text>
      </Pressable>
    </View>
  );
}

function QualityPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.pill, active && styles.pillActive]} onPress={onPress}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  previewArea: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 12,
  },
  video: { width: '100%', height: '100%' },
  hiddenVideo: { width: 0, height: 0 },
  photo: { width: '100%', height: '100%' },
  audioWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioArt: { width: '100%', height: '100%', position: 'absolute' },
  audioArtPlaceholder: { backgroundColor: '#333' },
  audioPlayButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioPlayButtonText: { fontSize: 22, color: '#111' },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#111' },
  qualityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  pillActive: { backgroundColor: '#111' },
  pillText: { fontSize: 13, color: '#333' },
  pillTextActive: { color: '#fff' },
  downloadButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  downloadButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
