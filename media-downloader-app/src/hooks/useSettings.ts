import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { configureServer } from '../api/client';

const STORAGE_KEY = 'media-downloader/server-settings';

interface ServerSettings {
  serverUrl: string;
  apiKey: string;
}

const DEFAULTS: ServerSettings = { serverUrl: 'https://anysave-2yg8.onrender.com', apiKey: '' };

export function useSettings() {
  const [settings, setSettings] = useState<ServerSettings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      const parsed: ServerSettings = raw ? JSON.parse(raw) : DEFAULTS;
      configureServer(parsed.serverUrl, parsed.apiKey);
      setSettings(parsed);
      setLoaded(true);
    });
  }, []);

  const save = async (next: ServerSettings) => {
    configureServer(next.serverUrl, next.apiKey);
    setSettings(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  return { settings, save, loaded };
}
