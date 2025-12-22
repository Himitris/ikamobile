import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
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

interface CitiesListScreenProps {
  onCitySelect: (cityId: string) => void;
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
    <TouchableOpacity style={styles.cityCard} onPress={() => onCitySelect(item.id)}>
      <View style={styles.cityHeader}>
        <Text style={styles.cityName}>{item.name}</Text>
        <Text style={styles.cityCoords}>
          [{item.x}:{item.y}]
        </Text>
      </View>
      <View style={styles.cityInfo}>
        <Text style={styles.cityId}>ID: {item.id}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Chargement des villes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Villes ({cities.length})</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity onPress={() => setError(null)} style={styles.dismissButton}>
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {cities.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            {error ? 'Erreur de chargement' : 'Aucune ville trouvée'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadCities}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={cities}
          keyExtractor={(item) => item.id}
          renderItem={renderCityItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#3498db',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  listContent: {
    padding: 15,
  },
  cityCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  cityCoords: {
    fontSize: 14,
    color: '#7f8c8d',
    marginLeft: 10,
  },
  cityInfo: {
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingTop: 10,
  },
  cityId: {
    fontSize: 12,
    color: '#95a5a6',
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 20,
  },
  errorBanner: {
    backgroundColor: '#ffe6e6',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#ffcccc',
  },
  errorText: {
    color: '#c0392b',
    fontSize: 14,
    flex: 1,
  },
  dismissButton: {
    padding: 5,
  },
  dismissText: {
    color: '#c0392b',
    fontSize: 18,
    fontWeight: 'bold',
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
