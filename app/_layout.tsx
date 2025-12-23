import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import App from '@/src/App';

// Layout simple : charge directement App.tsx sans tabs
export default function RootLayout() {
  return (
    <View style={{ flex: 1 }}>
      <App />
      <StatusBar style="auto" />
    </View>
  );
}
