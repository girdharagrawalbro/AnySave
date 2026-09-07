import React, { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { DownloadJob } from '../api/downloader';
import { deleteLibraryItem, listLibrary, saveToDevice, shareFile } from '../api/library';
import { LibraryItem } from '../components/LibraryItem';

export function LibraryScreen() {
  const [items, setItems] = useState<DownloadJob[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setItems(await listLibrary());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleSave = async (item: DownloadJob) => {
    if (!item.file_url) {
      Alert.alert('No file available');
      return;
    }
    try {
      const ext = item.file_url.split('.').pop() ?? 'bin';
      const file = await saveToDevice(item.file_url, `${item.title || 'download'}.${ext}`);
      await shareFile(file);
    } catch (err: any) {
      Alert.alert('Could not save file', err.message);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteLibraryItem(id);
    load();
  };

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={items}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <LibraryItem item={item} onSave={() => handleSave(item)} onDelete={() => handleDelete(item.id)} />
      )}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={<Text style={styles.empty}>Nothing downloaded yet.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, flexGrow: 1 },
  separator: { height: 10 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
});
