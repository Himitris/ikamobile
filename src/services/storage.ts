import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IkariamSession } from '../types';

const STORAGE_KEYS = {
  SESSION: '@ikariam_session',
} as const;

/**
 * Service de stockage pour persister les données de session
 */
export class StorageService {
  /**
   * Sauvegarde la session
   */
  async saveSession(session: IkariamSession): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la session:', error);
      throw error;
    }
  }

  /**
   * Récupère la session sauvegardée
   */
  async getSession(): Promise<IkariamSession | null> {
    try {
      const sessionJson = await AsyncStorage.getItem(STORAGE_KEYS.SESSION);
      if (!sessionJson) return null;

      return JSON.parse(sessionJson) as IkariamSession;
    } catch (error) {
      console.error('Erreur lors de la récupération de la session:', error);
      return null;
    }
  }

  /**
   * Supprime la session
   */
  async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
    } catch (error) {
      console.error('Erreur lors de la suppression de la session:', error);
      throw error;
    }
  }

  /**
   * Vérifie si une session existe
   */
  async hasSession(): Promise<boolean> {
    try {
      const session = await this.getSession();
      return session !== null;
    } catch {
      return false;
    }
  }
}

export const storageService = new StorageService();
