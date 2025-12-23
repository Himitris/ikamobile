import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LoginScreen } from '@/src/screens/LoginScreen';
import { useSession } from '@/src/contexts/SessionContext';
import { router } from 'expo-router';
import { Redirect } from 'expo-router';

export default function LoginTab() {
  const { isAuthenticated, isLoading } = useSession();

  const handleLoginSuccess = () => {
    router.replace('/(tabs)/cities');
  };

  // Si déjà authentifié, redirige vers cities
  if (isAuthenticated && !isLoading) {
    return <Redirect href="/(tabs)/cities" />;
  }

  return (
    <View style={styles.container}>
      <LoginScreen onLoginSuccess={handleLoginSuccess} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
