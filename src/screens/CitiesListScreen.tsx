import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { ikariamApi } from '../services/ikariamApi';
import { storageService } from '../services/storage';
import type { City } from '../types';
import { IkariamText, IkariamButton, IkariamHeader, IkariamCityCard } from '@/components/ikariam';
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
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await storageService.clearSession();
    ikariamApi.logout();
    onLogout();
  };

  useEffect(() => {
    loadCities();
  }, []);

  const renderCityItem = ({ item, index }: { item: City; index: number }) => (
    <IkariamCityCard
      city={{
        ...item,
        isCapital: index === 0, // Première ville = capitale (simplifié)
      }}
      onPress={() => onCitySelect(item.id, cities)}
    />
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
      {/* Header décoré */}
      <IkariamHeader
        title="Mes Villes"
        subtitle={`${cities.length} ville${cities.length > 1 ? 's' : ''}`}
        variant="decorated"
        rightAction={{
          label: 'Déconnexion',
          onPress: handleLogout,
        }}
      />

      {/* Modal de déconnexion */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLogoutModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <IkariamText variant="heading" style={styles.modalTitle}>
              Déconnexion
            </IkariamText>
            <IkariamText variant="body" color="secondary" style={styles.modalMessage}>
              Voulez-vous vraiment vous déconnecter ?
            </IkariamText>
            <View style={styles.modalButtons}>
              <IkariamButton
                title="Annuler"
                variant="secondary"
                size="md"
                onPress={() => setShowLogoutModal(false)}
                style={styles.modalButton}
              />
              <IkariamButton
                title="Déconnexion"
                variant="danger"
                size="md"
                onPress={confirmLogout}
                style={styles.modalButton}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Bannière d'erreur */}
      {error && (
        <View style={styles.errorBanner}>
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
        </View>
      )}

      {/* Liste des villes ou état vide */}
      {cities.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyStateIcon}>
            <IkariamText variant="title" style={styles.emptyIcon}>
              🏛️
            </IkariamText>
          </View>
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
          showsVerticalScrollIndicator={false}
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
  loadingText: {
    marginTop: IkariamTheme.spacing.md,
  },
  listContent: {
    padding: IkariamTheme.spacing.base,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: IkariamTheme.colors.parchment.dark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: IkariamTheme.spacing.lg,
    borderWidth: 3,
    borderColor: IkariamTheme.colors.wood.base,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyText: {
    marginBottom: IkariamTheme.spacing.lg,
    textAlign: 'center',
  },
  errorBanner: {
    margin: IkariamTheme.spacing.base,
    backgroundColor: IkariamTheme.colors.error,
    borderRadius: IkariamTheme.borderRadius.base,
    padding: IkariamTheme.spacing.base,
    borderWidth: 2,
    borderColor: '#A0522D',
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
  // Modal styles
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
    padding: IkariamTheme.spacing.xl,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: IkariamTheme.colors.wood.base,
    ...IkariamTheme.shadows.lg,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: IkariamTheme.spacing.md,
  },
  modalMessage: {
    textAlign: 'center',
    marginBottom: IkariamTheme.spacing.xl,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: IkariamTheme.spacing.base,
  },
  modalButton: {
    flex: 1,
  },
});
