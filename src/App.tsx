import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { LoginScreen } from './screens/LoginScreen';
import { CitiesListScreen } from './screens/CitiesListScreen';
import { CityDetailScreen } from './screens/CityDetailScreen';
import { ikariamApi } from './services/ikariamApi';
import { storageService } from './services/storage';

type Screen = 'loading' | 'login' | 'cities' | 'cityDetail';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('loading');
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);

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

  const handleLogout = () => {
    setCurrentScreen('login');
  };

  const handleCitySelect = (cityId: string) => {
    setSelectedCityId(cityId);
    setCurrentScreen('cityDetail');
  };

  const handleBackToCities = () => {
    setSelectedCityId(null);
    setCurrentScreen('cities');
  };

  if (currentScreen === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
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
    return <CityDetailScreen cityId={selectedCityId} onBack={handleBackToCities} />;
  }

  return null;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
