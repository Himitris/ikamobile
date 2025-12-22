import axios, { AxiosInstance } from 'axios';
import type { IkariamSession, City, Resources, ApiResponse } from '../types';

/**
 * Service API pour interagir avec Ikariam
 * Basé sur le reverse-engineering d'Ikabot
 */
export class IkariamApi {
  private axiosInstance: AxiosInstance;
  private session: IkariamSession | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 10000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      },
    });
  }

  /**
   * Initialise la session avec un cookie
   */
  async initSession(cookie: string, server: string): Promise<ApiResponse<IkariamSession>> {
    try {
      this.session = { cookie, server };

      // Configure l'instance axios avec le cookie
      this.axiosInstance.defaults.baseURL = `https://${server}.ikariam.gameforge.com`;
      this.axiosInstance.defaults.headers.common['Cookie'] = cookie;

      // Vérifie que la session est valide en récupérant les données du joueur
      const isValid = await this.validateSession();

      if (!isValid) {
        return {
          success: false,
          error: 'Cookie de session invalide ou expiré',
        };
      }

      return {
        success: true,
        data: this.session,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'initialisation de la session',
      };
    }
  }

  /**
   * Valide que la session est toujours active
   */
  private async validateSession(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get('/index.php?view=city');

      // Vérifie que la réponse contient des données de ville
      // Si on est redirigé vers la page de login, la session est invalide
      return response.data.includes('cityId') || response.data.includes('relatedCityData');
    } catch {
      return false;
    }
  }

  /**
   * Récupère la liste des villes du joueur
   */
  async getCities(): Promise<ApiResponse<City[]>> {
    if (!this.session) {
      return { success: false, error: 'Aucune session active' };
    }

    try {
      const response = await this.axiosInstance.get('/index.php?view=city');
      const html = response.data;

      // Parse le JSON contenant les données des villes
      // Basé sur la logique d'Ikabot (pedirInfo.py)
      const citiesMatch = html.match(/relatedCityData\s*:\s*JSON\.parse\('(.+?)',.*?additionalInfo/s);

      if (!citiesMatch) {
        return { success: false, error: 'Impossible de récupérer les villes' };
      }

      // Decode le JSON échappé
      let citiesJson = citiesMatch[1];
      citiesJson = citiesJson.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');

      const citiesData = JSON.parse(citiesJson);
      const cities: City[] = [];

      // Parse chaque ville
      for (const cityId in citiesData) {
        const cityData = citiesData[cityId];
        cities.push({
          id: cityId,
          name: cityData.name || 'Ville sans nom',
          islandId: cityData.islandId || '',
          x: cityData.coords?.x || 0,
          y: cityData.coords?.y || 0,
          resources: {
            wood: 0,
            wine: 0,
            marble: 0,
            crystal: 0,
            sulfur: 0,
          },
        });
      }

      return { success: true, data: cities };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération des villes',
      };
    }
  }

  /**
   * Récupère les détails d'une ville spécifique
   */
  async getCityDetails(cityId: string): Promise<ApiResponse<City>> {
    if (!this.session) {
      return { success: false, error: 'Aucune session active' };
    }

    try {
      const response = await this.axiosInstance.get(`/index.php?view=city&cityId=${cityId}`);
      const html = response.data;

      // Parse les ressources
      const resourcesMatch = html.match(/updateBackgroundData[^{]*({[^}]+})/);
      let resources: Resources = {
        wood: 0,
        wine: 0,
        marble: 0,
        crystal: 0,
        sulfur: 0,
      };

      if (resourcesMatch) {
        try {
          const resourcesData = JSON.parse(resourcesMatch[1]);
          resources = {
            wood: parseInt(resourcesData.wood || '0'),
            wine: parseInt(resourcesData.wine || '0'),
            marble: parseInt(resourcesData.marble || '0'),
            crystal: parseInt(resourcesData.crystal || '0'),
            sulfur: parseInt(resourcesData.sulfur || '0'),
            gold: parseInt(resourcesData.gold || '0'),
            citizens: parseInt(resourcesData.citizens || '0'),
          };
        } catch (e) {
          console.error('Erreur parsing ressources:', e);
        }
      }

      // Parse les constructions en cours
      const constructionMatches = html.matchAll(/buildingUpgrade[^}]+position[^:]*:([^,]+)[^}]+buildingId[^:]*:([^,]+)[^}]+upgradeCountDown[^:]*:([^,]+)/g);
      const constructionQueue = [];

      for (const match of constructionMatches) {
        constructionQueue.push({
          buildingId: match[2].trim(),
          buildingName: '',
          targetLevel: 0,
          completionTime: Date.now() + parseInt(match[3].trim()) * 1000,
          currentLevel: 0,
        });
      }

      // Parse le nom de la ville
      const nameMatch = html.match(/cityName[^>]*>([^<]+)</);
      const cityName = nameMatch ? nameMatch[1].trim() : 'Ville';

      return {
        success: true,
        data: {
          id: cityId,
          name: cityName,
          islandId: '',
          x: 0,
          y: 0,
          resources,
          constructionQueue,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération des détails de la ville',
      };
    }
  }

  /**
   * Lance la construction d'un bâtiment
   */
  async startConstruction(cityId: string, buildingId: string): Promise<ApiResponse> {
    if (!this.session) {
      return { success: false, error: 'Aucune session active' };
    }

    try {
      // Récupère d'abord le token CSRF depuis la page de la ville
      const cityResponse = await this.axiosInstance.get(`/index.php?view=city&cityId=${cityId}`);
      const actionRequestMatch = cityResponse.data.match(/actionRequest[^']*'([^']+)/);

      if (!actionRequestMatch) {
        return { success: false, error: 'Token CSRF non trouvé' };
      }

      const actionRequest = actionRequestMatch[1];

      // Envoie la requête de construction
      const response = await this.axiosInstance.post('/index.php', null, {
        params: {
          action: 'CityScreen',
          function: 'build',
          cityId,
          position: buildingId,
          actionRequest,
        },
      });

      if (response.data.includes('error') || response.status !== 200) {
        return { success: false, error: 'Échec de la construction' };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur lors du lancement de la construction',
      };
    }
  }

  /**
   * Récupère la session actuelle
   */
  getSession(): IkariamSession | null {
    return this.session;
  }

  /**
   * Déconnecte la session
   */
  logout(): void {
    this.session = null;
    this.axiosInstance.defaults.headers.common['Cookie'] = '';
  }
}

// Export singleton
export const ikariamApi = new IkariamApi();
