import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CityDetailScreen } from '@/src/screens/CityDetailScreen';
import { useSession } from '@/src/contexts/SessionContext';
import { IkariamText } from '@/components/ikariam';
import { IkariamTheme } from '@/constants/ikariamTheme';
import { router } from 'expo-router';

export default function BuildingsTab() {
  const { selectedCityId } = useSession();

  const handleBack = () => {
    router.push('/(tabs)/cities');
  };

  if (!selectedCityId) {
    return (
      <View style={styles.emptyContainer}>
        <IkariamText variant="heading" style={styles.emptyText}>
          Aucune ville sélectionnée
        </IkariamText>
        <IkariamText variant="body" color="secondary" style={styles.emptyHint}>
          Sélectionnez une ville dans l'onglet Villes
        </IkariamText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CityDetailScreen key={selectedCityId} cityId={selectedCityId} onBack={handleBack} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: IkariamTheme.colors.background.primary,
    padding: IkariamTheme.spacing.xl,
  },
  emptyText: {
    marginBottom: IkariamTheme.spacing.md,
    textAlign: 'center',
  },
  emptyHint: {
    textAlign: 'center',
  },
});
