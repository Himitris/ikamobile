import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { ikariamApi } from '../services/ikariamApi';
import type { City, Construction, Building } from '../types';
import { BUILDING_NAMES } from '../constants/game';
import { IkariamText, IkariamCard, IkariamButton, IkariamBadge } from '@/components/ikariam';
import { IkariamTheme } from '@/constants/ikariamTheme';

interface CityDetailScreenProps {
  cityId: string;
  onBack: () => void;
}

export const CityDetailScreen: React.FC<CityDetailScreenProps> = ({ cityId, onBack }) => {
  const [city, setCity] = useState<City | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCityDetails = async () => {
    try {
      console.log('🏛️ CityDetailScreen: Chargement détails ville', cityId);
      const result = await ikariamApi.getCityDetails(cityId);

      if (result.success && result.data) {
        console.log('🏛️ CityDetailScreen: Détails chargés:', result.data.name);
        console.log('🏛️ CityDetailScreen: Ressources:', result.data.resources);
        setCity(result.data);
        setError(null);
      } else {
        const errorMsg = result.error || 'Impossible de charger les détails de la ville';
        console.error('🏛️ CityDetailScreen: Erreur:', errorMsg);
        setError(errorMsg);
        Alert.alert('Erreur', errorMsg);
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Une erreur est survenue';
      console.error('🏛️ CityDetailScreen: Exception:', errorMsg);
      setError(errorMsg);
      Alert.alert('Erreur', errorMsg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadCityDetails();
  };

  const handleBuildingUpgrade = async (building: Building) => {
    Alert.alert(
      `Améliorer ${building.name}`,
      `Voulez-vous améliorer ${building.name} au niveau ${building.level + 1} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Améliorer',
          onPress: async () => {
            try {
              const result = await ikariamApi.startConstruction(cityId, building.position.toString());
              if (result.success) {
                Alert.alert('Succès', 'Construction lancée !');
                loadCityDetails(); // Recharge les données
              } else {
                Alert.alert('Erreur', result.error || 'Impossible de lancer la construction');
              }
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Une erreur est survenue');
            }
          },
        },
      ]
    );
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
        <ActivityIndicator size="large" color={IkariamTheme.colors.wood.base} />
        <IkariamText variant="body" color="secondary" style={styles.loadingText}>
          Chargement...
        </IkariamText>
      </View>
    );
  }

  if (!city) {
    return (
      <View style={styles.centerContainer}>
        <IkariamText variant="body" style={styles.errorText}>
          Ville non trouvée
        </IkariamText>
        <IkariamButton
          title="Retour"
          onPress={onBack}
          variant="secondary"
          size="md"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backIconButton}>
          <IkariamText variant="heading" color="light" style={styles.backIcon}>
            ←
          </IkariamText>
        </TouchableOpacity>
        <IkariamText variant="heading" color="light" style={styles.title}>
          {city.name}
        </IkariamText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={IkariamTheme.colors.wood.base}
            colors={[IkariamTheme.colors.wood.base]}
          />
        }
      >
        {/* Avertissement si toutes les ressources sont à 0 */}
        {city.resources &&
          Object.values(city.resources).every((val) => val === 0 || val === undefined) && (
            <IkariamCard variant="default" style={styles.warningBanner}>
              <IkariamText variant="caption" color="secondary" style={styles.warningText}>
                ⚠️ Les ressources n'ont pas pu être chargées. Consultez les logs de la console
                pour plus de détails.
              </IkariamText>
            </IkariamCard>
          )}

        {/* Ressources */}
        <IkariamCard style={styles.section}>
          <IkariamText variant="subheading" style={styles.sectionTitle}>
            Ressources
          </IkariamText>
          <View style={styles.resourcesGrid}>
            <ResourceItem
              icon="🪵"
              name="Bois"
              value={formatNumber(city.resources.wood)}
              color={IkariamTheme.colors.resources.wood}
            />
            <ResourceItem
              icon="🍷"
              name="Vin"
              value={formatNumber(city.resources.wine)}
              color={IkariamTheme.colors.resources.wine}
            />
            <ResourceItem
              icon="⚪"
              name="Marbre"
              value={formatNumber(city.resources.marble)}
              color={IkariamTheme.colors.resources.marble}
            />
            <ResourceItem
              icon="💎"
              name="Cristal"
              value={formatNumber(city.resources.crystal)}
              color={IkariamTheme.colors.resources.crystal}
            />
            <ResourceItem
              icon="⚠️"
              name="Soufre"
              value={formatNumber(city.resources.sulfur)}
              color={IkariamTheme.colors.resources.sulfur}
            />
            {city.resources.gold !== undefined && (
              <ResourceItem
                icon="💰"
                name="Or"
                value={formatNumber(city.resources.gold)}
                color={IkariamTheme.colors.resources.gold}
              />
            )}
          </View>
        </IkariamCard>

        {/* Citoyens */}
        {city.resources.citizens !== undefined && (
          <IkariamCard style={styles.section}>
            <IkariamText variant="subheading" style={styles.sectionTitle}>
              Population
            </IkariamText>
            <View style={styles.statsRow}>
              <IkariamText variant="caption" color="secondary">
                Citoyens disponibles :
              </IkariamText>
              <IkariamText variant="body" weight="bold">
                {formatNumber(city.resources.citizens)}
              </IkariamText>
            </View>
            {city.resources.scientistsAvailable !== undefined && (
              <View style={styles.statsRow}>
                <IkariamText variant="caption" color="secondary">
                  Scientifiques disponibles :
                </IkariamText>
                <IkariamText variant="body" weight="bold">
                  {formatNumber(city.resources.scientistsAvailable)}
                </IkariamText>
              </View>
            )}
          </IkariamCard>
        )}

        {/* Constructions en cours */}
        {city.constructionQueue && city.constructionQueue.length > 0 && (
          <IkariamCard style={styles.section}>
            <IkariamText variant="subheading" style={styles.sectionTitle}>
              Constructions en cours
            </IkariamText>
            {city.constructionQueue.map((construction, index) => (
              <ConstructionItem key={index} construction={construction} />
            ))}
          </IkariamCard>
        )}

        {city.constructionQueue?.length === 0 && (
          <IkariamCard style={styles.section}>
            <IkariamText variant="subheading" style={styles.sectionTitle}>
              Constructions
            </IkariamText>
            <IkariamText variant="caption" color="secondary" style={styles.emptyText}>
              Aucune construction en cours
            </IkariamText>
          </IkariamCard>
        )}

        {/* Bâtiments */}
        {city.buildings && city.buildings.length > 0 && (
          <IkariamCard style={styles.section}>
            <IkariamText variant="subheading" style={styles.sectionTitle}>
              Bâtiments ({city.buildings.length})
            </IkariamText>
            {city.buildings
              .sort((a, b) => b.level - a.level)
              .map((building) => (
                <BuildingItem
                  key={building.id}
                  building={building}
                  onUpgrade={() => handleBuildingUpgrade(building)}
                />
              ))}
          </IkariamCard>
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
    <IkariamText variant="body" style={styles.resourceIcon}>
      {icon}
    </IkariamText>
    <IkariamText variant="caption" color="secondary" style={styles.resourceName}>
      {name}
    </IkariamText>
    <IkariamText variant="body" weight="bold" style={[styles.resourceValue, { color }]}>
      {value}
    </IkariamText>
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
        <IkariamText variant="body" weight="semibold">
          {construction.buildingName || 'Bâtiment inconnu'}
        </IkariamText>
        <IkariamText variant="caption" color="secondary">
          Niveau {construction.currentLevel} → {construction.targetLevel}
        </IkariamText>
      </View>
      <IkariamBadge label={timeRemaining} variant="info" size="sm" />
    </View>
  );
};

const BuildingItem: React.FC<{
  building: Building;
  onUpgrade: () => void;
}> = ({ building, onUpgrade }) => {
  // Récupère le nom localisé du bâtiment
  const buildingName = BUILDING_NAMES[building.type] || building.name || 'Bâtiment inconnu';

  // Icônes pour différents types de bâtiments
  const getBuildingIcon = (type: string): string => {
    const icons: Record<string, string> = {
      townhall: '🏛️',
      academy: '📚',
      warehouse: '📦',
      palace: '👑',
      museum: '🏛️',
      port: '⚓',
      shipyard: '🚢',
      barracks: '⚔️',
      wall: '🏰',
      tavern: '🍺',
      tradingpost: '🏪',
      workshop: '🔨',
      hideout: '🗡️',
      sawmill: '🪵',
      vineyard: '🍷',
      quarry: '⚪',
      crystalmine: '💎',
      sulfurpit: '⚠️',
    };
    return icons[type.toLowerCase()] || '🏗️';
  };

  return (
    <View style={styles.buildingItem}>
      <View style={styles.buildingInfo}>
        <View style={styles.buildingHeader}>
          <IkariamText variant="body" style={styles.buildingIcon}>
            {getBuildingIcon(building.type)}
          </IkariamText>
          <IkariamText variant="body" weight="semibold" style={styles.buildingName}>
            {buildingName}
          </IkariamText>
        </View>
        <IkariamText variant="caption" color="secondary">
          Niveau {building.level}
        </IkariamText>
      </View>
      <IkariamButton
        title="⬆ Améliorer"
        onPress={onUpgrade}
        variant="success"
        size="sm"
        style={styles.upgradeButton}
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: IkariamTheme.colors.wood.darkest,
    ...IkariamTheme.shadows.lg,
  },
  backIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    textAlign: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: IkariamTheme.spacing.md,
  },
  errorText: {
    marginBottom: IkariamTheme.spacing.lg,
    color: IkariamTheme.colors.error,
  },
  content: {
    flex: 1,
  },
  warningBanner: {
    margin: IkariamTheme.spacing.base,
    marginBottom: 0,
    backgroundColor: IkariamTheme.colors.gold.light,
    borderColor: IkariamTheme.colors.gold.dark,
    borderLeftWidth: 4,
  },
  warningText: {
    lineHeight: IkariamTheme.typography.fontSize.sm * IkariamTheme.typography.lineHeight.normal,
  },
  section: {
    margin: IkariamTheme.spacing.base,
  },
  sectionTitle: {
    marginBottom: IkariamTheme.spacing.base,
  },
  resourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  resourceItem: {
    width: '48%',
    backgroundColor: IkariamTheme.colors.parchment.base,
    padding: IkariamTheme.spacing.md,
    borderRadius: IkariamTheme.borderRadius.base,
    borderWidth: 1,
    borderColor: IkariamTheme.colors.border.light,
    marginBottom: IkariamTheme.spacing.md,
    alignItems: 'center',
    ...IkariamTheme.shadows.sm,
  },
  resourceIcon: {
    marginBottom: IkariamTheme.spacing.xs,
  },
  resourceName: {
    marginBottom: IkariamTheme.spacing.xs,
  },
  resourceValue: {},
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: IkariamTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: IkariamTheme.colors.border.light,
  },
  constructionItem: {
    backgroundColor: IkariamTheme.colors.parchment.base,
    padding: IkariamTheme.spacing.md,
    borderRadius: IkariamTheme.borderRadius.base,
    borderWidth: 1,
    borderColor: IkariamTheme.colors.border.base,
    marginBottom: IkariamTheme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...IkariamTheme.shadows.sm,
  },
  constructionInfo: {
    flex: 1,
    marginRight: IkariamTheme.spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: IkariamTheme.spacing.base,
  },
  buildingItem: {
    backgroundColor: IkariamTheme.colors.parchment.base,
    padding: IkariamTheme.spacing.md,
    borderRadius: IkariamTheme.borderRadius.base,
    borderWidth: 1,
    borderColor: IkariamTheme.colors.border.base,
    marginBottom: IkariamTheme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...IkariamTheme.shadows.sm,
  },
  buildingInfo: {
    flex: 1,
    marginRight: IkariamTheme.spacing.md,
  },
  buildingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: IkariamTheme.spacing.xs,
  },
  buildingIcon: {
    marginRight: IkariamTheme.spacing.sm,
  },
  buildingName: {
    flex: 1,
  },
  upgradeButton: {
    minWidth: 100,
  },
});
