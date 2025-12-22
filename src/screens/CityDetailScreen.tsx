import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { ikariamApi } from '../services/ikariamApi';
import type { City, Construction } from '../types';

interface CityDetailScreenProps {
  cityId: string;
  onBack: () => void;
}

export const CityDetailScreen: React.FC<CityDetailScreenProps> = ({ cityId, onBack }) => {
  const [city, setCity] = useState<City | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCityDetails = async () => {
    try {
      const result = await ikariamApi.getCityDetails(cityId);

      if (result.success && result.data) {
        setCity(result.data);
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de charger les détails de la ville');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadCityDetails();
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString('fr-FR');
  };

  const formatTime = (timestamp: number): string => {
    const remaining = timestamp - Date.now();
    if (remaining <= 0) return 'Terminé';

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  useEffect(() => {
    loadCityDetails();
  }, [cityId]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!city) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Ville non trouvée</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backIconButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{city.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Ressources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ressources</Text>
          <View style={styles.resourcesGrid}>
            <ResourceItem
              icon="🪵"
              name="Bois"
              value={formatNumber(city.resources.wood)}
              color="#8B4513"
            />
            <ResourceItem
              icon="🍷"
              name="Vin"
              value={formatNumber(city.resources.wine)}
              color="#8B0000"
            />
            <ResourceItem
              icon="⚪"
              name="Marbre"
              value={formatNumber(city.resources.marble)}
              color="#DCDCDC"
            />
            <ResourceItem
              icon="💎"
              name="Cristal"
              value={formatNumber(city.resources.crystal)}
              color="#4169E1"
            />
            <ResourceItem
              icon="⚠️"
              name="Soufre"
              value={formatNumber(city.resources.sulfur)}
              color="#FFD700"
            />
            {city.resources.gold !== undefined && (
              <ResourceItem
                icon="💰"
                name="Or"
                value={formatNumber(city.resources.gold)}
                color="#FFD700"
              />
            )}
          </View>
        </View>

        {/* Citoyens */}
        {city.resources.citizens !== undefined && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Population</Text>
            <View style={styles.statsRow}>
              <Text style={styles.statLabel}>Citoyens disponibles :</Text>
              <Text style={styles.statValue}>{formatNumber(city.resources.citizens)}</Text>
            </View>
            {city.resources.scientistsAvailable !== undefined && (
              <View style={styles.statsRow}>
                <Text style={styles.statLabel}>Scientifiques disponibles :</Text>
                <Text style={styles.statValue}>
                  {formatNumber(city.resources.scientistsAvailable)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Constructions en cours */}
        {city.constructionQueue && city.constructionQueue.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Constructions en cours</Text>
            {city.constructionQueue.map((construction, index) => (
              <ConstructionItem key={index} construction={construction} />
            ))}
          </View>
        )}

        {city.constructionQueue?.length === 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Constructions</Text>
            <Text style={styles.emptyText}>Aucune construction en cours</Text>
            <TouchableOpacity style={styles.buildButton}>
              <Text style={styles.buildButtonText}>Lancer une construction</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const ResourceItem: React.FC<{
  icon: string;
  name: string;
  value: string;
  color: string;
}> = ({ icon, name, value, color }) => (
  <View style={styles.resourceItem}>
    <Text style={styles.resourceIcon}>{icon}</Text>
    <Text style={styles.resourceName}>{name}</Text>
    <Text style={[styles.resourceValue, { color }]}>{value}</Text>
  </View>
);

const ConstructionItem: React.FC<{ construction: Construction }> = ({ construction }) => {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = construction.completionTime - Date.now();
      if (remaining <= 0) {
        setTimeRemaining('Terminé');
        clearInterval(interval);
      } else {
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [construction.completionTime]);

  return (
    <View style={styles.constructionItem}>
      <View style={styles.constructionInfo}>
        <Text style={styles.constructionName}>
          {construction.buildingName || 'Bâtiment inconnu'}
        </Text>
        <Text style={styles.constructionLevel}>
          Niveau {construction.currentLevel} → {construction.targetLevel}
        </Text>
      </View>
      <Text style={styles.constructionTime}>{timeRemaining}</Text>
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
  backIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  resourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  resourceItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  resourceIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  resourceName: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  resourceValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  statLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  constructionItem: {
    backgroundColor: '#e8f4f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  constructionInfo: {
    flex: 1,
  },
  constructionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  constructionLevel: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  constructionTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3498db',
  },
  emptyText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 15,
  },
  buildButton: {
    backgroundColor: '#27ae60',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buildButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
