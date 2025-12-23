import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { LoginScreen } from './screens/LoginScreen';
import { CitiesListScreen } from './screens/CitiesListScreen';
import { CityDetailScreen } from './screens/CityDetailScreen';
import { ikariamApi } from './services/ikariamApi';
import { storageService } from './services/storage';
import { IkariamTheme } from '@/constants/ikariamTheme';
import type { City } from './types';

type Screen = 'loading' | 'login' | 'cities' | 'cityDetail';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('loading');
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [allCities, setAllCities] = useState<City[]>([]);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const session = await storageService.getSession();

      if (session) {
        const result = await ikariamApi.initSession(session.cookie, session.server);

        if (result.success) {
          setCurrentScreen('cities');
        } else {
          setCurrentScreen('login');
        }
      } else {
        setCurrentScreen('login');
      }
    } catch {
      setCurrentScreen('login');
    }
  };

  const handleLoginSuccess = () => {
    setCurrentScreen('cities');
  };

  const handleLogout = async () => {
    await storageService.clearSession();
    ikariamApi.logout();
    setSelectedCityId(null);
    setCurrentScreen('login');
  };

  const handleCitySelect = (cityId: string, cities?: City[]) => {
    console.log('🏙️ App: Ville sélectionnée:', cityId);
    setSelectedCityId(cityId);
    if (cities) {
      setAllCities(cities);
    }
    setCurrentScreen('cityDetail');
  };

  const handleCityChange = (cityId: string) => {
    console.log('🏙️ App: Changement de ville vers:', cityId);
    setSelectedCityId(cityId);
  };

  const handleBackToCities = () => {
    console.log('🔙 App: Retour à la liste des villes');
    setCurrentScreen('cities');
  };

  if (currentScreen === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={IkariamTheme.colors.wood.base} />
      </View>
    );
  }

  if (currentScreen === 'login') {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentScreen === 'cities') {
    return <CitiesListScreen onCitySelect={handleCitySelect} onLogout={handleLogout} />;
  }

  if (currentScreen === 'cityDetail' && selectedCityId) {
    return (
      <CityDetailScreen
        key={selectedCityId}
        cityId={selectedCityId}
        allCities={allCities}
        onBack={handleBackToCities}
        onCityChange={handleCityChange}
      />
    );
  }

  return null;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: IkariamTheme.colors.background.primary,
  },
});
