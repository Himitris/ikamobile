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
import type { City, Construction, Building, Resources } from '../types';
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
  const [buildingSortBy, setBuildingSortBy] = useState<'level' | 'type' | 'name'>('level');

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
    if (!city) return;

    // Vérifie si on a assez de ressources
    const hasEnoughResources = building.upgradeCost
      ? Object.entries(building.upgradeCost).every(([resource, cost]) => {
          const currentAmount = city.resources[resource as keyof typeof city.resources] || 0;
          return currentAmount >= cost;
        })
      : true;

    // Construit le message avec le coût
    let message = `Voulez-vous améliorer ${building.name} au niveau ${building.level + 1} ?`;

    if (building.upgradeCost) {
      const costs = [];
      if (building.upgradeCost.wood > 0) costs.push(`🪵 ${formatNumber(building.upgradeCost.wood)}`);
      if (building.upgradeCost.wine > 0) costs.push(`🍷 ${formatNumber(building.upgradeCost.wine)}`);
      if (building.upgradeCost.marble > 0) costs.push(`⚪ ${formatNumber(building.upgradeCost.marble)}`);
      if (building.upgradeCost.crystal > 0) costs.push(`💎 ${formatNumber(building.upgradeCost.crystal)}`);
      if (building.upgradeCost.sulfur > 0) costs.push(`⚠️ ${formatNumber(building.upgradeCost.sulfur)}`);

      if (costs.length > 0) {
        message += `\n\nCoût: ${costs.join(', ')}`;
      }
    }

    if (building.upgradeTime) {
      const hours = Math.floor(building.upgradeTime / 3600);
      const minutes = Math.floor((building.upgradeTime % 3600) / 60);
      message += `\nTemps: ${hours}h ${minutes}m`;
    }

    if (!hasEnoughResources) {
      message += '\n\n⚠️ Vous n\'avez pas assez de ressources !';
    }

    Alert.alert(
      `Améliorer ${building.name}`,
      message,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: hasEnoughResources ? 'Améliorer' : 'Améliorer quand même',
          style: hasEnoughResources ? 'default' : 'destructive',
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

  const sortBuildings = (buildings: Building[]): Building[] => {
    const sorted = [...buildings];
    switch (buildingSortBy) {
      case 'level':
        return sorted.sort((a, b) => b.level - a.level);
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'type':
        return sorted.sort((a, b) => a.type.localeCompare(b.type));
      default:
        return sorted;
    }
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
            <View style={styles.buildingHeader}>
              <IkariamText variant="subheading" style={styles.sectionTitle}>
                Bâtiments ({city.buildings.length})
              </IkariamText>
              <View style={styles.sortButtons}>
                <TouchableOpacity
                  style={[styles.sortButton, buildingSortBy === 'level' && styles.sortButtonActive]}
                  onPress={() => setBuildingSortBy('level')}
                >
                  <IkariamText
                    variant="caption"
                    color={buildingSortBy === 'level' ? 'light' : 'secondary'}
                  >
                    Niveau
                  </IkariamText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sortButton, buildingSortBy === 'name' && styles.sortButtonActive]}
                  onPress={() => setBuildingSortBy('name')}
                >
                  <IkariamText
                    variant="caption"
                    color={buildingSortBy === 'name' ? 'light' : 'secondary'}
                  >
                    Nom
                  </IkariamText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sortButton, buildingSortBy === 'type' && styles.sortButtonActive]}
                  onPress={() => setBuildingSortBy('type')}
                >
                  <IkariamText
                    variant="caption"
                    color={buildingSortBy === 'type' ? 'light' : 'secondary'}
                  >
                    Type
                  </IkariamText>
                </TouchableOpacity>
              </View>
            </View>
            {sortBuildings(city.buildings).map((building) => (
              <BuildingItem
                key={building.id}
                building={building}
                currentResources={city.resources}
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
  currentResources: Resources;
  onUpgrade: () => void;
}> = ({ building, currentResources, onUpgrade }) => {
  // Récupère le nom localisé du bâtiment
  const buildingName = BUILDING_NAMES[building.type] || building.name || 'Bâtiment inconnu';

  // Vérifie si on a assez de ressources
  const hasEnoughResources = building.upgradeCost
    ? Object.entries(building.upgradeCost).every(([resource, cost]) => {
        const currentAmount = currentResources[resource as keyof typeof currentResources] || 0;
        return currentAmount >= cost;
      })
    : true;

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

  const formatNumber = (num: number): string => {
    return num.toLocaleString('fr-FR');
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <View style={styles.buildingItemContainer}>
      <View style={styles.buildingItem}>
        <View style={styles.buildingMainInfo}>
          <View style={styles.buildingHeaderRow}>
            <IkariamText variant="body" style={styles.buildingIconText}>
              {getBuildingIcon(building.type)}
            </IkariamText>
            <IkariamText variant="body" weight="semibold" style={styles.buildingNameText}>
              {buildingName}
            </IkariamText>
            <IkariamBadge label={`Niv. ${building.level}`} variant="default" size="sm" />
          </View>

          {/* Coût d'upgrade */}
          {building.upgradeCost && (
            <View style={styles.upgradeCostRow}>
              <IkariamText variant="caption" color="secondary" style={styles.costLabel}>
                Coût:
              </IkariamText>
              <View style={styles.costList}>
                {building.upgradeCost.wood > 0 && (
                  <IkariamText
                    variant="caption"
                    color={
                      currentResources.wood >= building.upgradeCost.wood ? 'primary' : 'tertiary'
                    }
                  >
                    🪵 {formatNumber(building.upgradeCost.wood)}
                  </IkariamText>
                )}
                {building.upgradeCost.wine > 0 && (
                  <IkariamText
                    variant="caption"
                    color={
                      currentResources.wine >= building.upgradeCost.wine ? 'primary' : 'tertiary'
                    }
                  >
                    🍷 {formatNumber(building.upgradeCost.wine)}
                  </IkariamText>
                )}
                {building.upgradeCost.marble > 0 && (
                  <IkariamText
                    variant="caption"
                    color={
                      currentResources.marble >= building.upgradeCost.marble
                        ? 'primary'
                        : 'tertiary'
                    }
                  >
                    ⚪ {formatNumber(building.upgradeCost.marble)}
                  </IkariamText>
                )}
                {building.upgradeCost.crystal > 0 && (
                  <IkariamText
                    variant="caption"
                    color={
                      currentResources.crystal >= building.upgradeCost.crystal
                        ? 'primary'
                        : 'tertiary'
                    }
                  >
                    💎 {formatNumber(building.upgradeCost.crystal)}
                  </IkariamText>
                )}
                {building.upgradeCost.sulfur > 0 && (
                  <IkariamText
                    variant="caption"
                    color={
                      currentResources.sulfur >= building.upgradeCost.sulfur
                        ? 'primary'
                        : 'tertiary'
                    }
                  >
                    ⚠️ {formatNumber(building.upgradeCost.sulfur)}
                  </IkariamText>
                )}
              </View>
            </View>
          )}

          {/* Temps d'upgrade */}
          {building.upgradeTime && (
            <View style={styles.upgradeTimeRow}>
              <IkariamText variant="caption" color="secondary">
                ⏱️ Temps: {formatTime(building.upgradeTime)}
              </IkariamText>
            </View>
          )}
        </View>

        <IkariamButton
          title="⬆"
          onPress={onUpgrade}
          variant={hasEnoughResources ? 'success' : 'warning'}
          size="sm"
          style={styles.upgradeButton}
        />
      </View>
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
  buildingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: IkariamTheme.spacing.md,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: IkariamTheme.spacing.xs,
  },
  sortButton: {
    paddingHorizontal: IkariamTheme.spacing.sm,
    paddingVertical: IkariamTheme.spacing.xs,
    borderRadius: IkariamTheme.borderRadius.sm,
    backgroundColor: IkariamTheme.colors.parchment.dark,
    borderWidth: 1,
    borderColor: IkariamTheme.colors.border.light,
  },
  sortButtonActive: {
    backgroundColor: IkariamTheme.colors.wood.base,
    borderColor: IkariamTheme.colors.wood.dark,
  },
  buildingItemContainer: {
    marginBottom: IkariamTheme.spacing.md,
  },
  buildingItem: {
    backgroundColor: IkariamTheme.colors.parchment.base,
    padding: IkariamTheme.spacing.md,
    borderRadius: IkariamTheme.borderRadius.base,
    borderWidth: 1,
    borderColor: IkariamTheme.colors.border.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...IkariamTheme.shadows.sm,
  },
  buildingMainInfo: {
    flex: 1,
    marginRight: IkariamTheme.spacing.md,
  },
  buildingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: IkariamTheme.spacing.xs,
    gap: IkariamTheme.spacing.sm,
  },
  buildingIconText: {
    fontSize: 20,
  },
  buildingNameText: {
    flex: 1,
  },
  upgradeCostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: IkariamTheme.spacing.xs,
    flexWrap: 'wrap',
  },
  costLabel: {
    marginRight: IkariamTheme.spacing.sm,
  },
  costList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: IkariamTheme.spacing.sm,
  },
  upgradeTimeRow: {
    marginTop: IkariamTheme.spacing.xs,
  },
  upgradeButton: {
    minWidth: 50,
    paddingHorizontal: IkariamTheme.spacing.md,
  },
});
