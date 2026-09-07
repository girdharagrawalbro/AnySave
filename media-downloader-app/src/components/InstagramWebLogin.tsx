import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import CookieManager from '@preeternal/react-native-cookie-manager';

import { loginWithCookies } from '../api/instagram';

interface Props {
  visible: boolean;
  onClose: () => void;
  onLoggedIn: (username: string) => void;
}

const LOGIN_URL = 'https://www.instagram.com/accounts/login/';

export function InstagramWebLogin({ visible, onClose, onLoggedIn }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const handledRef = useRef(false);

  const handleNavigationStateChange = async (navState: WebViewNavigation) => {
    if (handledRef.current || submitting) return;
    if (navState.loading) return;
    if (!navState.url.includes('instagram.com')) return;
    if (navState.url.includes('/accounts/login')) return;

    const cookies = await CookieManager.get('https://www.instagram.com');
    if (!cookies.sessionid?.value) return;

    handledRef.current = true;
    setSubmitting(true);
    try {
      const cookieMap: Record<string, string> = {};
      Object.values(cookies).forEach((c) => {
        cookieMap[c.name] = c.value;
      });
      const result = await loginWithCookies(cookieMap);
      onLoggedIn(result.username);
    } catch (err: any) {
      handledRef.current = false;
      setSubmitting(false);
      Alert.alert('Could not finish login', err?.response?.data?.error ?? err.message);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={8}>
          <Text style={styles.closeButton}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Log in to Instagram</Text>
        <View style={styles.headerSpacer} />
      </View>
      <WebView
        source={{ uri: LOGIN_URL }}
        onNavigationStateChange={handleNavigationStateChange}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
      />
      {submitting && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.overlayText}>Signing in…</Text>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e2e2',
  },
  closeButton: { color: '#2563eb', fontSize: 15 },
  headerTitle: { fontSize: 15, fontWeight: '600', color: '#111' },
  headerSpacer: { width: 50 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  overlayText: { color: '#fff', fontSize: 14 },
});
