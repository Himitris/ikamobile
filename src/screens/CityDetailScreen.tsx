import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Modal,
  FlatList,
} from 'react-native';
import { ikariamApi } from '../services/ikariamApi';
import type { City, Construction, Building, Resources } from '../types';
import { BUILDING_NAMES } from '../constants/game';
import { IkariamText, IkariamHeader, IkariamResourcePanel, IkariamCityCard } from '@/components/ikariam';
import { IkariamTheme } from '@/constants/ikariamTheme';

interface CityDetailScreenProps {
  cityId: string;
  allCities?: City[];
  onBack: () => void;
  onCityChange?: (cityId: string) => void;
}

// Interface pour le modal de confirmation d'upgrade
interface UpgradeModalData {
  visible: boolean;
  building: Building | null;
  upgradeCost: Resources | null;
  upgradeTime: number;
  hasEnoughResources: boolean;
  isLoading: boolean;
  isUpgrading: boolean;
  message: string;
}

export const CityDetailScreen: React.FC<CityDetailScreenProps> = ({
  cityId,
  allCities = [],
  onBack,
  onCityChange,
}) => {
  const [city, setCity] = useState<City | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingCosts, setLoadingCosts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCitySelector, setShowCitySelector] = useState(false);

  // État pour le modal de confirmation d'upgrade
  const [upgradeModal, setUpgradeModal] = useState<UpgradeModalData>({
    visible: false,
    building: null,
    upgradeCost: null,
    upgradeTime: 0,
    hasEnoughResources: true,
    isLoading: false,
    isUpgrading: false,
    message: '',
  });

  const loadCityDetails = async () => {
    try {
      console.log('🏛️ CityDetailScreen: Chargement détails ville', cityId);
      const result = await ikariamApi.getCityDetails(cityId);

      if (result.success && result.data) {
        console.log('🏛️ CityDetailScreen: Détails chargés:', result.data.name);
        console.log('🏛️ CityDetailScreen: Ressources:', result.data.resources);
        console.log('🏛️ CityDetailScreen: Bâtiments:', result.data.buildings?.length || 0);

        // Affiche d'abord la ville sans les coûts
        setCity(result.data);
        setError(null);
        setLoading(false);

        // Puis charge les coûts d'upgrade en arrière-plan
        const cityData = result.data;
        if (cityData.buildings && cityData.buildings.length > 0) {
          setLoadingCosts(true);
          console.log('💰 Chargement des coûts d\'upgrade pour', cityData.buildings.length, 'bâtiments...');

          try {
            const buildingsWithCosts = await Promise.all(
              cityData.buildings.map(async (building) => {
                try {
                  const costResult = await ikariamApi.getBuildingUpgradeCost(
                    cityId,
                    building.position,
                    building.type,
                    building.level
                  );

                  if (costResult.success && costResult.data) {
                    const hasCosts = Object.values(costResult.data.cost).some(v => v > 0);
                    if (hasCosts || costResult.data.time > 0) {
                      console.log(`💰 ${building.name}: coûts chargés`);
                      return {
                        ...building,
                        upgradeCost: costResult.data.cost,
                        upgradeTime: costResult.data.time,
                      };
                    }
                  }
                } catch (err) {
                  console.warn(`⚠️ Erreur coûts ${building.name}:`, err);
                }
                return building;
              })
            );

            // Met à jour la ville avec les coûts
            setCity(prev => prev ? { ...prev, buildings: buildingsWithCosts } : null);
          } finally {
            setLoadingCosts(false);
          }
        }

        return; // Early return car on a déjà fait setLoading(false)
      } else {
        const errorMsg = result.error || 'Impossible de charger les détails de la ville';
        console.error('🏛️ CityDetailScreen: Erreur:', errorMsg);
        setError(errorMsg);
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Une erreur est survenue';
      console.error('🏛️ CityDetailScreen: Exception:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadCityDetails();
  };

  // Ferme le modal d'upgrade
  const closeUpgradeModal = () => {
    setUpgradeModal(prev => ({ ...prev, visible: false }));
  };

  // Lance l'upgrade depuis le modal
  const confirmUpgrade = async () => {
    if (!upgradeModal.building) return;

    console.log('🔨 Lancement upgrade:', upgradeModal.building.name, 'position:', upgradeModal.building.position);
    setUpgradeModal(prev => ({ ...prev, isUpgrading: true, message: 'Lancement de la construction...' }));

    try {
      const result = await ikariamApi.startConstruction(
        cityId,
        upgradeModal.building.position,
        upgradeModal.building.type
      );

      if (result.success) {
        setUpgradeModal(prev => ({ ...prev, message: result.data?.message || 'Construction lancée !', isUpgrading: false }));
        // Ferme le modal après 1.5s et rafraîchit
        setTimeout(() => {
          closeUpgradeModal();
          loadCityDetails();
        }, 1500);
      } else {
        setUpgradeModal(prev => ({ ...prev, message: result.error || 'Erreur lors du lancement', isUpgrading: false }));
      }
    } catch (error: any) {
      console.error('🔨 Erreur upgrade:', error);
      setUpgradeModal(prev => ({ ...prev, message: error.message || 'Erreur', isUpgrading: false }));
    }
  };

  // Ouvre le modal de confirmation d'upgrade
  const handleBuildingUpgrade = async (building: Building) => {
    if (!city) return;

    console.log('🔨 handleBuildingUpgrade: Clic sur', building.name, 'position:', building.position);

    // Ouvre le modal en mode chargement si les coûts ne sont pas disponibles
    let upgradeCost = building.upgradeCost || null;
    let upgradeTime = building.upgradeTime || 0;
    const needsLoading = !upgradeCost;

    // Calcule si on a assez de ressources (avec les données actuelles)
    const checkResources = (cost: Resources | null) => {
      if (!cost) return true;
      return Object.entries(cost).every(([resource, amount]) => {
        if (amount === 0) return true;
        const currentAmount = city.resources[resource as keyof typeof city.resources] || 0;
        return currentAmount >= amount;
      });
    };

    // Ouvre le modal
    setUpgradeModal({
      visible: true,
      building,
      upgradeCost,
      upgradeTime,
      hasEnoughResources: checkResources(upgradeCost),
      isLoading: needsLoading,
      isUpgrading: false,
      message: needsLoading ? 'Chargement des coûts...' : '',
    });

    // Si on n'a pas les coûts, les récupère
    if (needsLoading) {
      try {
        console.log('💰 Récupération des coûts pour', building.name);
        const costResult = await ikariamApi.getBuildingUpgradeCost(
          cityId,
          building.position,
          building.type,
          building.level
        );

        if (costResult.success && costResult.data) {
          upgradeCost = costResult.data.cost;
          upgradeTime = costResult.data.time;
          console.log('💰 Coûts récupérés:', upgradeCost, 'Temps:', upgradeTime);

          setUpgradeModal(prev => ({
            ...prev,
            upgradeCost,
            upgradeTime,
            hasEnoughResources: checkResources(upgradeCost),
            isLoading: false,
            message: '',
          }));
        } else {
          setUpgradeModal(prev => ({
            ...prev,
            isLoading: false,
            message: 'Coûts non disponibles',
          }));
        }
      } catch (error) {
        console.error('❌ Erreur récupération coûts:', error);
        setUpgradeModal(prev => ({
          ...prev,
          isLoading: false,
          message: 'Erreur lors du chargement des coûts',
        }));
      }
    }
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

  const handleCitySelect = (selectedCityId: string) => {
    setShowCitySelector(false);
    if (selectedCityId !== cityId && onCityChange) {
      setLoading(true);
      onCityChange(selectedCityId);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header décoré */}
      <IkariamHeader
        title={city.name}
        subtitle={`[${city.x}:${city.y}]`}
        variant="compact"
        leftAction={{
          icon: '←',
          onPress: onBack,
        }}
        rightAction={allCities.length > 1 ? {
          icon: '▼',
          onPress: () => setShowCitySelector(true),
        } : undefined}
      />

      {/* Modal sélecteur de ville */}
      <Modal
        visible={showCitySelector}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCitySelector(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCitySelector(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <IkariamText variant="heading" style={styles.modalTitle}>
              Choisir une ville
            </IkariamText>
            <FlatList
              data={allCities}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <IkariamCityCard
                  city={item}
                  variant="compact"
                  isSelected={item.id === cityId}
                  onPress={() => handleCitySelect(item.id)}
                />
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de confirmation d'upgrade */}
      <Modal
        visible={upgradeModal.visible}
        transparent
        animationType="fade"
        onRequestClose={closeUpgradeModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={upgradeModal.isUpgrading ? undefined : closeUpgradeModal}
        >
          <View style={styles.upgradeModalContent} onStartShouldSetResponder={() => true}>
            {upgradeModal.building && (
              <>
                {/* Titre du bâtiment */}
                <IkariamText variant="heading" style={styles.modalTitle}>
                  {BUILDING_NAMES[upgradeModal.building.type] || upgradeModal.building.name || upgradeModal.building.type}
                </IkariamText>

                {/* Niveau */}
                <IkariamText variant="body" style={styles.upgradeLevel}>
                  Niveau {upgradeModal.building.level} → {upgradeModal.building.level + 1}
                </IkariamText>

                {/* Indicateur de chargement */}
                {upgradeModal.isLoading && (
                  <View style={styles.upgradeLoadingRow}>
                    <ActivityIndicator size="small" color={IkariamTheme.colors.wood.base} />
                    <IkariamText variant="caption" color="secondary" style={styles.upgradeLoadingText}>
                      Chargement des coûts...
                    </IkariamText>
                  </View>
                )}

                {/* Coûts */}
                {!upgradeModal.isLoading && upgradeModal.upgradeCost && (
                  <View style={styles.upgradeCostsContainer}>
                    <IkariamText variant="caption" color="secondary" style={styles.upgradeCostsLabel}>
                      Coûts:
                    </IkariamText>
                    <View style={styles.upgradeCostsGrid}>
                      {upgradeModal.upgradeCost.wood > 0 && (
                        <View style={styles.upgradeCostItem}>
                          <IkariamText variant="body">🪵</IkariamText>
                          <IkariamText
                            variant="body"
                            style={[
                              styles.upgradeCostValue,
                              city && city.resources.wood < upgradeModal.upgradeCost.wood && styles.costInsufficient,
                            ]}
                          >
                            {formatNumber(upgradeModal.upgradeCost.wood)}
                          </IkariamText>
                        </View>
                      )}
                      {upgradeModal.upgradeCost.wine > 0 && (
                        <View style={styles.upgradeCostItem}>
                          <IkariamText variant="body">🍷</IkariamText>
                          <IkariamText
                            variant="body"
                            style={[
                              styles.upgradeCostValue,
                              city && city.resources.wine < upgradeModal.upgradeCost.wine && styles.costInsufficient,
                            ]}
                          >
                            {formatNumber(upgradeModal.upgradeCost.wine)}
                          </IkariamText>
                        </View>
                      )}
                      {upgradeModal.upgradeCost.marble > 0 && (
                        <View style={styles.upgradeCostItem}>
                          <IkariamText variant="body">⚪</IkariamText>
                          <IkariamText
                            variant="body"
                            style={[
                              styles.upgradeCostValue,
                              city && city.resources.marble < upgradeModal.upgradeCost.marble && styles.costInsufficient,
                            ]}
                          >
                            {formatNumber(upgradeModal.upgradeCost.marble)}
                          </IkariamText>
                        </View>
                      )}
                      {upgradeModal.upgradeCost.crystal > 0 && (
                        <View style={styles.upgradeCostItem}>
                          <IkariamText variant="body">💎</IkariamText>
                          <IkariamText
                            variant="body"
                            style={[
                              styles.upgradeCostValue,
                              city && city.resources.crystal < upgradeModal.upgradeCost.crystal && styles.costInsufficient,
                            ]}
                          >
                            {formatNumber(upgradeModal.upgradeCost.crystal)}
                          </IkariamText>
                        </View>
                      )}
                      {upgradeModal.upgradeCost.sulfur > 0 && (
                        <View style={styles.upgradeCostItem}>
                          <IkariamText variant="body">⚠️</IkariamText>
                          <IkariamText
                            variant="body"
                            style={[
                              styles.upgradeCostValue,
                              city && city.resources.sulfur < upgradeModal.upgradeCost.sulfur && styles.costInsufficient,
                            ]}
                          >
                            {formatNumber(upgradeModal.upgradeCost.sulfur)}
                          </IkariamText>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Temps */}
                {!upgradeModal.isLoading && upgradeModal.upgradeTime > 0 && (
                  <View style={styles.upgradeTimeRow}>
                    <IkariamText variant="caption" color="secondary">
                      Temps: ⏱ {Math.floor(upgradeModal.upgradeTime / 3600)}h {Math.floor((upgradeModal.upgradeTime % 3600) / 60)}m
                    </IkariamText>
                  </View>
                )}

                {/* Message (erreur ou succès) */}
                {upgradeModal.message && !upgradeModal.isLoading && (
                  <IkariamText
                    variant="caption"
                    color={upgradeModal.message.includes('Erreur') || upgradeModal.message.includes('non disponible') ? 'error' : 'primary'}
                    style={styles.upgradeMessage}
                  >
                    {upgradeModal.message}
                  </IkariamText>
                )}

                {/* Avertissement ressources insuffisantes */}
                {!upgradeModal.isLoading && !upgradeModal.hasEnoughResources && (
                  <IkariamText variant="caption" color="error" style={styles.upgradeWarning}>
                    Ressources insuffisantes
                  </IkariamText>
                )}

                {/* Boutons */}
                <View style={styles.upgradeButtonsRow}>
                  <TouchableOpacity
                    style={[styles.upgradeModalButton, styles.upgradeModalButtonCancel]}
                    onPress={closeUpgradeModal}
                    disabled={upgradeModal.isUpgrading}
                  >
                    <IkariamText variant="body" weight="semibold" style={styles.upgradeModalButtonText}>
                      Annuler
                    </IkariamText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.upgradeModalButton,
                      styles.upgradeModalButtonConfirm,
                      (upgradeModal.isLoading || upgradeModal.isUpgrading) && styles.upgradeModalButtonDisabled,
                    ]}
                    onPress={confirmUpgrade}
                    disabled={upgradeModal.isLoading || upgradeModal.isUpgrading}
                  >
                    {upgradeModal.isUpgrading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <IkariamText variant="body" weight="semibold" color="light">
                        Améliorer
                      </IkariamText>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Barre de ressources avec nouveau composant */}
      <IkariamResourcePanel
        resources={city.resources}
        variant="horizontal"
      />
      {loadingCosts && (
        <View style={styles.loadingCostsBar}>
          <ActivityIndicator size="small" color={IkariamTheme.colors.wood.base} />
          <IkariamText variant="caption" color="secondary" style={styles.loadingCostsText}>
            Chargement des coûts...
          </IkariamText>
        </View>
      )}

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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: IkariamTheme.spacing.xl,
  },
  modalContent: {
    backgroundColor: IkariamTheme.colors.parchment.base,
    borderRadius: IkariamTheme.borderRadius.lg,
    padding: IkariamTheme.spacing.lg,
    maxHeight: '70%',
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: IkariamTheme.colors.wood.base,
    ...IkariamTheme.shadows.lg,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: IkariamTheme.spacing.lg,
  },
  loadingCostsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: IkariamTheme.spacing.xs,
    gap: IkariamTheme.spacing.sm,
    backgroundColor: IkariamTheme.colors.parchment.base,
    borderTopWidth: 1,
    borderTopColor: IkariamTheme.colors.border.light,
  },
  loadingCostsText: {
    fontSize: 11,
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
  // Styles pour le modal d'upgrade
  upgradeModalContent: {
    backgroundColor: IkariamTheme.colors.parchment.base,
    borderRadius: IkariamTheme.borderRadius.lg,
    padding: IkariamTheme.spacing.xl,
    width: '90%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: IkariamTheme.colors.wood.base,
    ...IkariamTheme.shadows.lg,
  },
  upgradeLevel: {
    textAlign: 'center',
    marginBottom: IkariamTheme.spacing.lg,
  },
  upgradeLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: IkariamTheme.spacing.sm,
    marginVertical: IkariamTheme.spacing.lg,
  },
  upgradeLoadingText: {
    marginLeft: IkariamTheme.spacing.sm,
  },
  upgradeCostsContainer: {
    marginBottom: IkariamTheme.spacing.base,
  },
  upgradeCostsLabel: {
    marginBottom: IkariamTheme.spacing.sm,
  },
  upgradeCostsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: IkariamTheme.spacing.base,
  },
  upgradeCostItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IkariamTheme.spacing.xs,
  },
  upgradeCostValue: {
    minWidth: 50,
  },
  upgradeTimeRow: {
    marginBottom: IkariamTheme.spacing.base,
  },
  upgradeMessage: {
    textAlign: 'center',
    marginVertical: IkariamTheme.spacing.sm,
  },
  upgradeWarning: {
    textAlign: 'center',
    marginBottom: IkariamTheme.spacing.base,
  },
  upgradeButtonsRow: {
    flexDirection: 'row',
    gap: IkariamTheme.spacing.base,
    marginTop: IkariamTheme.spacing.lg,
  },
  upgradeModalButton: {
    flex: 1,
    paddingVertical: IkariamTheme.spacing.base,
    paddingHorizontal: IkariamTheme.spacing.lg,
    borderRadius: IkariamTheme.borderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  upgradeModalButtonCancel: {
    backgroundColor: IkariamTheme.colors.parchment.dark,
    borderWidth: 1,
    borderColor: IkariamTheme.colors.border.base,
  },
  upgradeModalButtonConfirm: {
    backgroundColor: IkariamTheme.colors.wood.base,
  },
  upgradeModalButtonDisabled: {
    opacity: 0.5,
  },
  upgradeModalButtonText: {
    color: IkariamTheme.colors.text.primary,
  },
});
