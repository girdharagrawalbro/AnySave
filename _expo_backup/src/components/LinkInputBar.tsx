import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

interface Props {
  onSubmit: (url: string) => void;
  loading: boolean;
}

export function LinkInputBar({ onSubmit, loading }: Props) {
  const [value, setValue] = useState('');

  const pasteFromClipboard = async () => {
    const text = await Clipboard.getString();
    if (text) setValue(text);
  };

  return (
    <View style={styles.row}>
      <TextInput
        style={styles.input}
        placeholder="Paste a YouTube, Spotify, or other link…"
        placeholderTextColor="#888"
        value={value}
        onChangeText={setValue}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Pressable style={styles.pasteButton} onPress={pasteFromClipboard}>
        <Text style={styles.pasteButtonText}>Paste</Text>
      </Pressable>
      <Pressable
        style={[styles.goButton, (!value || loading) && styles.goButtonDisabled]}
        onPress={() => value && onSubmit(value)}
        disabled={!value || loading}
      >
        {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.goButtonText}>Go</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e2e2e2',
  },
  pasteButton: { paddingHorizontal: 10, paddingVertical: 10 },
  pasteButtonText: { color: '#2563eb', fontWeight: '600' },
  goButton: {
    backgroundColor: '#111',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  goButtonDisabled: { opacity: 0.4 },
  goButtonText: { color: '#fff', fontWeight: '600' },
});
