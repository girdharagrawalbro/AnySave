import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DownloadJob } from '../api/downloader';

interface Props {
  item: DownloadJob;
  onSave: () => void;
  onDelete: () => void;
}

export function LibraryItem({ item, onSave, onDelete }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{item.title || item.url}</Text>
        <Text style={styles.meta}>{item.platform}{item.quality ? ` · ${item.quality}` : ''}</Text>
      </View>
      <Pressable style={styles.actionButton} onPress={onSave}>
        <Text style={styles.actionText}>Save</Text>
      </Pressable>
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
    gap: 10,
  },
  info: { flex: 1, gap: 2 },
  title: { fontWeight: '600', color: '#111' },
  meta: { fontSize: 12, color: '#777' },
  actionButton: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionText: { color: '#2563eb', fontWeight: '600', fontSize: 13 },
  delete: { fontSize: 16, color: '#999', paddingHorizontal: 4 },
});
