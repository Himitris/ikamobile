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

  const loadCityDetails = async () => {
    try {
      console.log('🏛️ CityDetailScreen: Chargement détails ville', cityId);
      const result = await ikariamApi.getCityDetails(cityId);

      if (result.success && result.data) {
        console.log('🏛️ CityDetailScreen: Détails chargés:', result.data.name);
        console.log('🏛️ CityDetailScreen: Ressources:', result.data.resources);
        console.log('🏛️ CityDetailScreen: Bâtiments:', result.data.buildings?.length || 0);
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
    let message = `Niveau ${building.level} → ${building.level + 1}`;

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
      message += '\n\n⚠️ Ressources insuffisantes';
    }

    Alert.alert(
      building.name,
      message,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Améliorer',
          onPress: async () => {
            try {
              const result = await ikariamApi.startConstruction(cityId, building.position.toString());
              if (result.success) {
                Alert.alert('Succès', 'Construction lancée !');
                loadCityDetails();
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
    // Affiche le chiffre exact avec séparateur de milliers
    return num.toLocaleString('fr-FR');
  };

  useEffect(() => {
    loadCityDetails();
  }, [cityId]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={IkariamTheme.colors.wood.base} />
      </View>
    );
  }

  if (!city) {
    return (
      <View style={styles.centerContainer}>
        <IkariamText variant="body">Ville non trouvée</IkariamText>
        <IkariamButton title="Retour" onPress={onBack} variant="secondary" size="md" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header avec nom de ville et retour */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <IkariamText variant="body" color="light" style={styles.backIcon}>
            ←
          </IkariamText>
        </TouchableOpacity>
        <IkariamText variant="heading" color="light" style={styles.cityName}>
          {city.name}
        </IkariamText>
        <IkariamText variant="caption" color="light" style={styles.coords}>
          [{city.x}:{city.y}]
        </IkariamText>
      </View>

      {/* Barre de ressources (compacte en haut) */}
      <View style={styles.resourcesBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.resourcesScroll}>
          <View style={styles.resourcesList}>
            <ResourceBadge icon="🪵" value={formatNumber(city.resources.wood)} />
            <ResourceBadge icon="🍷" value={formatNumber(city.resources.wine)} />
            <ResourceBadge icon="⚪" value={formatNumber(city.resources.marble)} />
            <ResourceBadge icon="💎" value={formatNumber(city.resources.crystal)} />
            <ResourceBadge icon="⚠️" value={formatNumber(city.resources.sulfur)} />
            {city.resources.gold !== undefined && (
              <ResourceBadge icon="💰" value={formatNumber(city.resources.gold)} highlight />
            )}
            {city.resources.citizens !== undefined && (
              <ResourceBadge icon="👥" value={formatNumber(city.resources.citizens)} />
            )}
          </View>
        </ScrollView>
      </View>

      {/* Liste des bâtiments */}
      <ScrollView
        style={styles.buildingsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={IkariamTheme.colors.wood.base}
            colors={[IkariamTheme.colors.wood.base]}
          />
        }
      >
        {/* Constructions en cours */}
        {city.constructionQueue && city.constructionQueue.length > 0 && (
          <View style={styles.queueSection}>
            <IkariamText variant="caption" color="secondary" style={styles.queueTitle}>
              🔨 Constructions en cours ({city.constructionQueue.length})
            </IkariamText>
            {city.constructionQueue.map((construction, index) => (
              <ConstructionItem key={index} construction={construction} />
            ))}
          </View>
        )}

        {/* Bâtiments */}
        {city.buildings && city.buildings.length > 0 ? (
          city.buildings
            .sort((a, b) => b.level - a.level)
            .map((building) => (
              <BuildingItem
                key={building.id}
                building={building}
                currentResources={city.resources}
                onUpgrade={() => handleBuildingUpgrade(building)}
              />
            ))
        ) : (
          <View style={styles.emptyState}>
            <IkariamText variant="caption" color="secondary">
              Aucun bâtiment trouvé
            </IkariamText>
            <IkariamText variant="caption" color="secondary" style={styles.emptyHint}>
              Consultez les logs pour plus d'informations
            </IkariamText>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const ResourceBadge: React.FC<{ icon: string; value: string; highlight?: boolean }> = ({
  icon,
  value,
  highlight = false,
}) => (
  <View style={[styles.resourceBadge, highlight && styles.resourceBadgeHighlight]}>
    <IkariamText variant="caption" style={styles.resourceIcon}>
      {icon}
    </IkariamText>
    <IkariamText variant="caption" weight="semibold" style={styles.resourceValue}>
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
    <View style={styles.queueItem}>
      <View style={styles.queueInfo}>
        <IkariamText variant="caption" weight="semibold">
          {construction.buildingName}
        </IkariamText>
        <IkariamText variant="caption" color="secondary" style={styles.queueLevel}>
          Niv. {construction.currentLevel} → {construction.targetLevel}
        </IkariamText>
      </View>
      <IkariamText variant="caption" color="primary" style={styles.queueTime}>
        ⏱ {timeRemaining}
      </IkariamText>
    </View>
  );
};

const BuildingItem: React.FC<{
  building: Building;
  currentResources: Resources;
  onUpgrade: () => void;
}> = ({ building, currentResources, onUpgrade }) => {
  const buildingName = BUILDING_NAMES[building.type] || building.name || building.type;

  const hasEnoughResources = building.upgradeCost
    ? Object.entries(building.upgradeCost).every(([resource, cost]) => {
        const currentAmount = currentResources[resource as keyof typeof currentResources] || 0;
        return currentAmount >= cost;
      })
    : true;

  const getBuildingIcon = (type: string): string => {
    const icons: Record<string, string> = {
      townhall: '🏛️',
      academy: '📚',
      warehouse: '📦',
      palace: '👑',
      museum: '🏺',
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
    return hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`;
  };

  return (
    <View style={styles.buildingCard}>
      <View style={styles.buildingHeader}>
        <View style={styles.buildingTitleRow}>
          <IkariamText variant="body" style={styles.buildingIcon}>
            {getBuildingIcon(building.type)}
          </IkariamText>
          <View style={styles.buildingInfo}>
            <IkariamText variant="body" weight="semibold">
              {buildingName}
            </IkariamText>
            <IkariamText variant="caption" color="secondary">
              Niveau {building.level}
            </IkariamText>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.upgradeButtonCompact,
            !hasEnoughResources && styles.upgradeButtonDisabled,
          ]}
          onPress={onUpgrade}
        >
          <IkariamText variant="caption" color="light" weight="semibold">
            ⬆
          </IkariamText>
        </TouchableOpacity>
      </View>

      {/* Coûts et temps (affichés si disponibles) */}
      {(building.upgradeCost || building.upgradeTime) && (
        <View style={styles.buildingDetails}>
          {building.upgradeCost && (
            <View style={styles.costsRow}>
              {building.upgradeCost.wood > 0 && (
                <IkariamText
                  variant="caption"
                  style={[
                    styles.costItem,
                    currentResources.wood < building.upgradeCost.wood && styles.costInsufficient,
                  ]}
                >
                  🪵 {formatNumber(building.upgradeCost.wood)}
                </IkariamText>
              )}
              {building.upgradeCost.wine > 0 && (
                <IkariamText
                  variant="caption"
                  style={[
                    styles.costItem,
                    currentResources.wine < building.upgradeCost.wine && styles.costInsufficient,
                  ]}
                >
                  🍷 {formatNumber(building.upgradeCost.wine)}
                </IkariamText>
              )}
              {building.upgradeCost.marble > 0 && (
                <IkariamText
                  variant="caption"
                  style={[
                    styles.costItem,
                    currentResources.marble < building.upgradeCost.marble && styles.costInsufficient,
                  ]}
                >
                  ⚪ {formatNumber(building.upgradeCost.marble)}
                </IkariamText>
              )}
              {building.upgradeCost.crystal > 0 && (
                <IkariamText
                  variant="caption"
                  style={[
                    styles.costItem,
                    currentResources.crystal < building.upgradeCost.crystal && styles.costInsufficient,
                  ]}
                >
                  💎 {formatNumber(building.upgradeCost.crystal)}
                </IkariamText>
              )}
              {building.upgradeCost.sulfur > 0 && (
                <IkariamText
                  variant="caption"
                  style={[
                    styles.costItem,
                    currentResources.sulfur < building.upgradeCost.sulfur && styles.costInsufficient,
                  ]}
                >
                  ⚠️ {formatNumber(building.upgradeCost.sulfur)}
                </IkariamText>
              )}
            </View>
          )}
          {building.upgradeTime && (
            <IkariamText variant="caption" color="secondary" style={styles.timeText}>
              ⏱ {formatTime(building.upgradeTime)}
            </IkariamText>
          )}
        </View>
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
    paddingHorizontal: IkariamTheme.spacing.base,
    paddingTop: IkariamTheme.spacing['4xl'],
    paddingBottom: IkariamTheme.spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: IkariamTheme.colors.wood.darkest,
  },
  backButton: {
    padding: IkariamTheme.spacing.sm,
    marginRight: IkariamTheme.spacing.sm,
  },
  backIcon: {
    fontSize: 24,
  },
  cityName: {
    flex: 1,
  },
  coords: {
    opacity: 0.8,
  },
  resourcesBar: {
    backgroundColor: IkariamTheme.colors.parchment.dark,
    borderBottomWidth: 1,
    borderBottomColor: IkariamTheme.colors.border.base,
    paddingVertical: IkariamTheme.spacing.xs,
  },
  resourcesScroll: {
    flexGrow: 0,
  },
  resourcesList: {
    flexDirection: 'row',
    paddingHorizontal: IkariamTheme.spacing.sm,
    gap: IkariamTheme.spacing.sm,
  },
  resourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IkariamTheme.colors.parchment.base,
    paddingHorizontal: IkariamTheme.spacing.sm,
    paddingVertical: IkariamTheme.spacing.xs,
    borderRadius: IkariamTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: IkariamTheme.colors.border.light,
    gap: 4,
  },
  resourceBadgeHighlight: {
    backgroundColor: IkariamTheme.colors.gold.light,
    borderColor: IkariamTheme.colors.gold.base,
  },
  resourceIcon: {
    fontSize: 14,
  },
  resourceValue: {
    fontSize: 12,
  },
  buildingsList: {
    flex: 1,
    padding: IkariamTheme.spacing.base,
  },
  queueSection: {
    marginBottom: IkariamTheme.spacing.base,
    padding: IkariamTheme.spacing.base,
    backgroundColor: IkariamTheme.colors.mediterranean.light + '20',
    borderRadius: IkariamTheme.borderRadius.base,
    borderLeftWidth: 3,
    borderLeftColor: IkariamTheme.colors.mediterranean.base,
  },
  queueTitle: {
    marginBottom: IkariamTheme.spacing.sm,
  },
  queueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: IkariamTheme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: IkariamTheme.colors.border.light,
  },
  queueInfo: {
    flex: 1,
  },
  queueLevel: {
    marginTop: 2,
  },
  queueTime: {
    marginLeft: IkariamTheme.spacing.sm,
  },
  buildingCard: {
    backgroundColor: IkariamTheme.colors.parchment.light,
    borderRadius: IkariamTheme.borderRadius.base,
    borderWidth: 1,
    borderColor: IkariamTheme.colors.border.base,
    padding: IkariamTheme.spacing.base,
    marginBottom: IkariamTheme.spacing.sm,
    ...IkariamTheme.shadows.sm,
  },
  buildingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buildingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: IkariamTheme.spacing.sm,
  },
  buildingIcon: {
    fontSize: 24,
  },
  buildingInfo: {
    flex: 1,
  },
  upgradeButtonCompact: {
    width: 36,
    height: 36,
    backgroundColor: IkariamTheme.colors.wood.base,
    borderRadius: IkariamTheme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    ...IkariamTheme.shadows.sm,
  },
  upgradeButtonDisabled: {
    backgroundColor: IkariamTheme.colors.wood.light,
    opacity: 0.5,
  },
  buildingDetails: {
    marginTop: IkariamTheme.spacing.sm,
    paddingTop: IkariamTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: IkariamTheme.colors.border.light,
  },
  costsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: IkariamTheme.spacing.sm,
    marginBottom: IkariamTheme.spacing.xs,
  },
  costItem: {
    fontSize: 12,
  },
  costInsufficient: {
    color: IkariamTheme.colors.error,
    opacity: 0.7,
  },
  timeText: {
    fontSize: 11,
  },
  emptyState: {
    alignItems: 'center',
    padding: IkariamTheme.spacing.xl,
  },
  emptyHint: {
    marginTop: IkariamTheme.spacing.xs,
    fontStyle: 'italic',
  },
});
