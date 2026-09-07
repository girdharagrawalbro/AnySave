import { ActivityIndicator, StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppNavigator } from './src/navigation/AppNavigator';
import { useSettings } from './src/hooks/useSettings';

export default function App() {
  const { loaded } = useSettings();

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      {loaded ? (
        <AppNavigator />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
        </View>
      )}
    </SafeAreaProvider>
  );
}
