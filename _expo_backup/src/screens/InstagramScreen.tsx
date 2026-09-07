import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  getStatus,
  listFollowing,
  listProfilePosts,
  login,
  savePost,
  IGFollowee,
  IGPost,
  IGStatus,
} from '../api/instagram';

export function InstagramScreen() {
  const [status, setStatus] = useState<IGStatus | null>(null);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);

  useEffect(() => {
    getStatus().then(setStatus);
  }, []);

  if (!status) return <ActivityIndicator style={styles.loader} />;
  if (!status.logged_in) return <LoginForm onLoggedIn={() => getStatus().then(setStatus)} />;
  if (selectedUsername) {
    return <ProfilePosts username={selectedUsername} onBack={() => setSelectedUsername(null)} />;
  }
  return <FollowingList onSelect={setSelectedUsername} loggedInAs={status.username!} />;
}

function LoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login(username, password);
      onLoggedIn();
    } catch (err: any) {
      Alert.alert('Login failed', err?.response?.data?.error ?? err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Log in to Instagram</Text>
      <Text style={styles.hint}>
        Session is stored encrypted on your server and reused, so you shouldn't need to log in often.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Pressable style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Log in</Text>}
      </Pressable>
    </View>
  );
}

function FollowingList({ onSelect, loggedInAs }: { onSelect: (username: string) => void; loggedInAs: string }) {
  const [following, setFollowing] = useState<IGFollowee[] | null>(null);

  useEffect(() => {
    listFollowing().then(setFollowing);
  }, []);

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={following ?? []}
      keyExtractor={(item) => item.username}
      ListHeaderComponent={<Text style={styles.heading}>Following (@{loggedInAs})</Text>}
      ListEmptyComponent={following ? <Text style={styles.hint}>No accounts found.</Text> : <ActivityIndicator />}
      renderItem={({ item }) => (
        <Pressable style={styles.row} onPress={() => onSelect(item.username)}>
          <Text style={styles.title}>{item.full_name || item.username}</Text>
          <Text style={styles.meta}>@{item.username}</Text>
        </Pressable>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

function ProfilePosts({ username, onBack }: { username: string; onBack: () => void }) {
  const [posts, setPosts] = useState<IGPost[] | null>(null);

  useEffect(() => {
    listProfilePosts(username).then(setPosts);
  }, [username]);

  const handleSave = async (shortcode: string) => {
    try {
      await savePost(shortcode);
      Alert.alert('Saving…', 'Check the Queue tab for progress.');
    } catch (err: any) {
      Alert.alert('Could not save', err?.response?.data?.error ?? err.message);
    }
  };

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={posts ?? []}
      keyExtractor={(item) => item.shortcode}
      ListHeaderComponent={
        <Pressable onPress={onBack}>
          <Text style={styles.backLink}>‹ Back to following</Text>
        </Pressable>
      }
      ListEmptyComponent={posts ? <Text style={styles.hint}>No posts found.</Text> : <ActivityIndicator />}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Text style={styles.title} numberOfLines={2}>{item.caption || '(no caption)'}</Text>
          <Text style={styles.meta}>{item.is_video ? 'Video' : 'Photo'}</Text>
          <Pressable style={styles.primaryButtonSmall} onPress={() => handleSave(item.shortcode)}>
            <Text style={styles.primaryButtonText}>Save</Text>
          </Pressable>
        </View>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  loader: { marginTop: 40 },
  heading: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 8 },
  hint: { fontSize: 13, color: '#777', marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e2e2',
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#111',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonSmall: {
    marginTop: 8,
    backgroundColor: '#111',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  primaryButtonText: { color: '#fff', fontWeight: '600' },
  list: { padding: 16, flexGrow: 1 },
  row: { backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 4 },
  separator: { height: 10 },
  title: { fontWeight: '600', color: '#111' },
  meta: { fontSize: 12, color: '#777' },
  backLink: { color: '#2563eb', fontWeight: '600', marginBottom: 12 },
});
