import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import {
  extractShortcode,
  getStatus,
  listFollowing,
  listProfilePosts,
  logout,
  savePost,
  IGFollowee,
  IGPost,
  IGStatus,
} from '../api/instagram';
import { InstagramWebLogin } from '../components/InstagramWebLogin';

function errorMessage(err: any) {
  return err?.response?.data?.error ?? err?.message ?? 'Something went wrong';
}

export function InstagramScreen() {
  const [status, setStatus] = useState<IGStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [handledPendingUrl, setHandledPendingUrl] = useState<string | null>(null);

  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const pendingUrl: string | undefined = route.params?.pendingUrl;

  const loadStatus = () => {
    setError(null);
    setStatus(null);
    getStatus()
      .then(setStatus)
      .catch((err) => setError(errorMessage(err)));
  };

  useEffect(loadStatus, []);

  useEffect(() => {
    if (!status?.logged_in || !pendingUrl || pendingUrl === handledPendingUrl) return;

    const shortcode = extractShortcode(pendingUrl);
    setHandledPendingUrl(pendingUrl);
    navigation.setParams({ pendingUrl: undefined });

    if (!shortcode) {
      Alert.alert(
        'Not a post link',
        "That looks like a profile link, not a post/reel. Browse the account below and tap Save on the post you want.",
      );
      return;
    }

    savePost(shortcode)
      .then(() => Alert.alert('Saving…', 'Check the Queue tab for progress.'))
      .catch((err) => Alert.alert('Could not save', errorMessage(err)));
  }, [status, pendingUrl, handledPendingUrl, navigation]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Instagram</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.primaryButton} onPress={loadStatus}>
          <Text style={styles.primaryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!status) return <ActivityIndicator style={styles.loader} />;
  if (!status.logged_in) return <LoginForm onLoggedIn={loadStatus} />;
  if (selectedUsername) {
    return <ProfilePosts username={selectedUsername} onBack={() => setSelectedUsername(null)} />;
  }
  return <FollowingList onSelect={setSelectedUsername} loggedInAs={status.username!} onLoggedOut={loadStatus} />;
}

function LoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [showWebLogin, setShowWebLogin] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Log in to Instagram</Text>
      <Text style={styles.hint}>
        Session is stored encrypted on your server and reused, so you shouldn't need to log in often.
      </Text>

      <Pressable style={styles.primaryButton} onPress={() => setShowWebLogin(true)}>
        <Text style={styles.primaryButtonText}>Log in with Instagram</Text>
      </Pressable>
      <Text style={styles.hint}>
        Opens the real Instagram login page in-app — your password never passes through this app, and 2FA works
        normally.
      </Text>

      <InstagramWebLogin
        visible={showWebLogin}
        onClose={() => setShowWebLogin(false)}
        onLoggedIn={() => {
          setShowWebLogin(false);
          onLoggedIn();
        }}
      />
    </View>
  );
}

function FollowingList({
  onSelect,
  loggedInAs,
  onLoggedOut,
}: {
  onSelect: (username: string) => void;
  loggedInAs: string;
  onLoggedOut: () => void;
}) {
  const [following, setFollowing] = useState<IGFollowee[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setError(null);
    setFollowing(null);
    listFollowing()
      .then(setFollowing)
      .catch((err) => setError(errorMessage(err)));
  };

  useEffect(load, []);

  const handleLogout = () => {
    Alert.alert('Log out of Instagram?', 'This clears the saved session from the server.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => logout().then(onLoggedOut).catch((err) => Alert.alert('Could not log out', errorMessage(err))),
      },
    ]);
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.primaryButton} onPress={load}>
          <Text style={styles.primaryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={following ?? []}
      keyExtractor={(item) => item.username}
      ListHeaderComponent={
        <>
          <View style={styles.headerRow}>
            <Text style={styles.heading}>Following (@{loggedInAs})</Text>
            <Pressable onPress={handleLogout}>
              <Text style={styles.logoutLink}>Log out</Text>
            </Pressable>
          </View>
          <Text style={styles.hint}>Tap an account, then tap Save on the post you want to download.</Text>
        </>
      }
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
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setError(null);
    setPosts(null);
    listProfilePosts(username)
      .then(setPosts)
      .catch((err) => setError(errorMessage(err)));
  };

  useEffect(load, [username]);

  const handleSave = async (shortcode: string) => {
    try {
      await savePost(shortcode);
      Alert.alert('Saving…', 'Check the Queue tab for progress.');
    } catch (err: any) {
      Alert.alert('Could not save', errorMessage(err));
    }
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Pressable onPress={onBack}>
          <Text style={styles.backLink}>‹ Back to following</Text>
        </Pressable>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.primaryButton} onPress={load}>
          <Text style={styles.primaryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

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
        <View style={styles.postRow}>
          <Image source={{ uri: item.thumbnail_url }} style={styles.postThumb} resizeMode="cover" />
          <View style={styles.postInfo}>
            <Text style={styles.title} numberOfLines={2}>{item.caption || '(no caption)'}</Text>
            <Text style={styles.meta}>{item.is_video ? 'Video' : 'Photo'}</Text>
            <Pressable style={styles.primaryButtonSmall} onPress={() => handleSave(item.shortcode)}>
              <Text style={styles.primaryButtonText}>Save</Text>
            </Pressable>
          </View>
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logoutLink: { color: '#dc2626', fontWeight: '600', fontSize: 13 },
  hint: { fontSize: 13, color: '#777', marginBottom: 8 },
  errorText: { fontSize: 14, color: '#dc2626', marginBottom: 8 },
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
  postRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 12 },
  postThumb: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#eee' },
  postInfo: { flex: 1, gap: 4 },
  separator: { height: 10 },
  title: { fontWeight: '600', color: '#111' },
  meta: { fontSize: 12, color: '#777' },
  backLink: { color: '#2563eb', fontWeight: '600', marginBottom: 12 },
});
