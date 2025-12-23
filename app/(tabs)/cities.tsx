import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CitiesListScreen } from '@/src/screens/CitiesListScreen';
import { useSession } from '@/src/contexts/SessionContext';
import { router } from 'expo-router';

export default function CitiesTab() {
  const { setSelectedCity } = useSession();

  const handleCitySelect = (cityId: string) => {
    setSelectedCity(cityId);
    // Navigate to buildings tab
    router.push('/(tabs)/buildings');
  };

  const handleLogout = () => {
    // Handled in profile tab
    router.push('/(tabs)/profile');
  };

  return (
    <View style={styles.container}>
      <CitiesListScreen onCitySelect={handleCitySelect} onLogout={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
