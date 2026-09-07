import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { deleteJob, listJobs, DownloadJob } from '../api/downloader';
import { JobProgressItem } from '../components/JobProgressItem';

export function JobQueueScreen() {
  const [jobs, setJobs] = useState<DownloadJob[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setJobs(await listJobs());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      const interval = setInterval(load, 2000);
      return () => clearInterval(interval);
    }, [load]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleDelete = async (id: number) => {
    await deleteJob(id);
    load();
  };

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={jobs}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <JobProgressItem job={item} onDelete={() => handleDelete(item.id)} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={<Text style={styles.empty}>No downloads yet.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, flexGrow: 1 },
  separator: { height: 10 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
});
