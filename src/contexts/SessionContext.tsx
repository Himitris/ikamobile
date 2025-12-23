import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ikariamApi } from '../services/ikariamApi';
import { storageService } from '../services/storage';
import type { IkariamSession } from '../types';

interface SessionContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: IkariamSession | null;
  selectedCityId: string | null;
  login: (cookie: string, server: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setSelectedCity: (cityId: string) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<IkariamSession | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const savedSession = await storageService.getSession();
      if (savedSession) {
        const result = await ikariamApi.initSession(savedSession.cookie, savedSession.server);
        if (result.success) {
          setSession(savedSession);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (cookie: string, server: string) => {
    const result = await ikariamApi.initSession(cookie, server);
    if (result.success && result.data) {
      await storageService.saveSession(result.data);
      setSession(result.data);
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const logout = async () => {
    await storageService.clearSession();
    ikariamApi.logout();
    setSession(null);
    setIsAuthenticated(false);
    setSelectedCityId(null);
  };

  const setSelectedCity = (cityId: string) => {
    setSelectedCityId(cityId);
  };

  return (
    <SessionContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        session,
        selectedCityId,
        login,
        logout,
        setSelectedCity,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
};
