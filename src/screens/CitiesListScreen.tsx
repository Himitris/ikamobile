import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { ikariamApi } from '../services/ikariamApi';
import { storageService } from '../services/storage';
import type { City } from '../types';
import { IkariamText, IkariamCard, IkariamButton, IkariamBadge } from '@/components/ikariam';
import { IkariamTheme } from '@/constants/ikariamTheme';

interface CitiesListScreenProps {
  onCitySelect: (cityId: string, cities?: City[]) => void;
  onLogout: () => void;
}

export const CitiesListScreen: React.FC<CitiesListScreenProps> = ({
  onCitySelect,
  onLogout,
}) => {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCities = async () => {
    try {
      console.log('🏙️ CitiesListScreen: Chargement des villes...');
      const result = await ikariamApi.getCities();

      if (result.success && result.data) {
        console.log('🏙️ CitiesListScreen: Villes chargées:', result.data.length);
        setCities(result.data);
        setError(null);
      } else {
        const errorMsg = result.error || 'Impossible de charger les villes';
        console.error('🏙️ CitiesListScreen: Erreur:', errorMsg);
        setError(errorMsg);
        // N'affiche l'alert que si on a 0 villes (sinon on garde l'ancien state)
        if (cities.length === 0) {
          Alert.alert('Erreur', errorMsg);
        }
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Une erreur est survenue';
      console.error('🏙️ CitiesListScreen: Exception:', errorMsg);
      setError(errorMsg);
      if (cities.length === 0) {
        Alert.alert('Erreur', errorMsg);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadCities();
  };

  const handleLogout = async () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await storageService.clearSession();
          ikariamApi.logout();
          onLogout();
        },
      },
    ]);
  };

  useEffect(() => {
    loadCities();
  }, []);

  const renderCityItem = ({ item }: { item: City }) => (
    <TouchableOpacity onPress={() => onCitySelect(item.id, cities)}>
      <IkariamCard style={styles.cityCard}>
        <View style={styles.cityHeader}>
          <IkariamText variant="heading" style={styles.cityName}>
            {item.name}
          </IkariamText>
          <IkariamBadge label={`[${item.x}:${item.y}]`} size="sm" variant="info" />
        </View>
        <View style={styles.cityInfo}>
          <IkariamText variant="caption" color="tertiary">
            ID: {item.id}
          </IkariamText>
        </View>
      </IkariamCard>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={IkariamTheme.colors.wood.base} />
        <IkariamText variant="body" color="secondary" style={styles.loadingText}>
          Chargement des villes...
        </IkariamText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <IkariamText variant="heading" color="light" style={styles.title}>
            Mes Villes
          </IkariamText>
          <IkariamBadge
            label={`${cities.length}`}
            variant="warning"
            size="md"
            style={styles.citiesCount}
          />
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <IkariamText variant="label" color="light">
            Déconnexion
          </IkariamText>
        </TouchableOpacity>
      </View>

      {error && (
        <IkariamCard variant="default" style={styles.errorBanner}>
          <View style={styles.errorContent}>
            <IkariamText variant="caption" style={styles.errorText}>
              ⚠️ {error}
            </IkariamText>
            <TouchableOpacity onPress={() => setError(null)} style={styles.dismissButton}>
              <IkariamText variant="body" weight="bold" style={styles.dismissText}>
                ✕
              </IkariamText>
            </TouchableOpacity>
          </View>
        </IkariamCard>
      )}

      {cities.length === 0 ? (
        <View style={styles.centerContainer}>
          <IkariamText variant="body" color="secondary" style={styles.emptyText}>
            {error ? 'Erreur de chargement' : 'Aucune ville trouvée'}
          </IkariamText>
          <IkariamButton
            title="Réessayer"
            onPress={loadCities}
            variant="secondary"
            size="md"
          />
        </View>
      ) : (
        <FlatList
          data={cities}
          keyExtractor={(item) => item.id}
          renderItem={renderCityItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={IkariamTheme.colors.wood.base}
              colors={[IkariamTheme.colors.wood.base]}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IkariamTheme.colors.background.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: IkariamTheme.spacing.xl,
  },
  header: {
    backgroundColor: IkariamTheme.colors.wood.dark,
    padding: IkariamTheme.spacing.lg,
    paddingTop: IkariamTheme.spacing['5xl'],
    borderBottomWidth: 3,
    borderBottomColor: IkariamTheme.colors.wood.darkest,
    ...IkariamTheme.shadows.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: IkariamTheme.spacing.md,
  },
  title: {
    marginRight: IkariamTheme.spacing.md,
  },
  citiesCount: {
    marginTop: IkariamTheme.spacing.xs,
  },
  logoutButton: {
    backgroundColor: IkariamTheme.colors.wood.darkest,
    paddingHorizontal: IkariamTheme.spacing.base,
    paddingVertical: IkariamTheme.spacing.sm,
    borderRadius: IkariamTheme.borderRadius.base,
    borderWidth: 1,
    borderColor: IkariamTheme.colors.wood.base,
    ...IkariamTheme.shadows.sm,
  },
  loadingText: {
    marginTop: IkariamTheme.spacing.md,
  },
  listContent: {
    padding: IkariamTheme.spacing.base,
  },
  cityCard: {
    marginBottom: IkariamTheme.spacing.base,
  },
  cityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: IkariamTheme.spacing.md,
  },
  cityName: {
    flex: 1,
    marginRight: IkariamTheme.spacing.md,
  },
  cityInfo: {
    borderTopWidth: 1,
    borderTopColor: IkariamTheme.colors.border.light,
    paddingTop: IkariamTheme.spacing.sm,
  },
  emptyText: {
    marginBottom: IkariamTheme.spacing.lg,
  },
  errorBanner: {
    margin: IkariamTheme.spacing.base,
    backgroundColor: IkariamTheme.colors.error,
    borderColor: '#A0522D',
    borderWidth: 2,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: IkariamTheme.colors.text.light,
    flex: 1,
  },
  dismissButton: {
    paddingLeft: IkariamTheme.spacing.md,
  },
  dismissText: {
    color: IkariamTheme.colors.text.light,
  },
});
