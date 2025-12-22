import type { IkariamSession, City, Resources, ApiResponse } from '../types';
import { parseCookies, validateCookies } from '../utils/cookieParser';
import { PROXY_URL, USE_PROXY } from '../config/api';

/**
 * Service API pour interagir avec Ikariam
 * Basé sur le reverse-engineering d'Ikabot
 * Utilise un backend proxy pour contourner les limitations React Native
 */
export class IkariamApi {
  private session: IkariamSession | null = null;
  private baseURL: string = '';

  /**
   * Effectue une requête HTTP via le proxy
   */
  private async request(
    path: string,
    options: RequestInit = {}
  ): Promise<{ data: string; status: number }> {
    const url = `${this.baseURL}${path}`;

    if (USE_PROXY) {
      // Utilise le backend proxy
      const response = await fetch(`${PROXY_URL}/api/proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          cookies: this.session?.cookie || '',
          method: options.method || 'GET',
          body: options.body,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur du proxy');
      }

      return {
        data: result.data,
        status: result.status,
      };
    } else {
      // Mode direct (ne fonctionne pas dans React Native)
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cookie': this.session?.cookie || '',
          ...options.headers,
        },
      });

      const data = await response.text();
      return { data, status: response.status };
    }
  }

  /**
   * Initialise la session avec un cookie
   */
  async initSession(cookie: string, server: string): Promise<ApiResponse<IkariamSession>> {
    try {
      // Parse les cookies (supporte format standard et format Ikabot JSON)
      const parsedCookie = parseCookies(cookie);

      if (!parsedCookie) {
        return {
          success: false,
          error: 'Format de cookie invalide. Utilisez le format standard ou le format Ikabot JSON.',
        };
      }

      // Valide que les cookies contiennent les éléments essentiels
      const validation = validateCookies(parsedCookie);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || 'Cookies invalides',
        };
      }

      this.session = { cookie: parsedCookie, server };
      this.baseURL = `https://${server}.ikariam.gameforge.com`;

      console.log('Session initialization:', {
        server,
        baseURL: this.baseURL,
        cookieLength: parsedCookie.length,
        cookiePreview: parsedCookie.substring(0, 100) + '...',
        hasPHPSESSID: parsedCookie.includes('PHPSESSID'),
      });

      // Vérifie que la session est valide en récupérant les données du joueur
      const isValid = await this.validateSession();

      if (!isValid) {
        return {
          success: false,
          error: 'Cookie de session invalide ou expiré. Reconnectez-vous à Ikariam et copiez à nouveau vos cookies.',
        };
      }

      return {
        success: true,
        data: this.session,
      };
    } catch (error: any) {
      console.error('Init session error:', error);
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
      const response = await this.request('/index.php?view=city');
      const html = response.data;

      // Debug: affiche un extrait de la réponse
      console.log('Response preview (first 500 chars):', html.substring(0, 500));
      console.log('Response preview (last 500 chars):', html.substring(html.length - 500));

      // Vérifie que la réponse contient des données de ville
      // Patterns de détection plus larges
      const patterns = {
        cityId: html.includes('cityId'),
        relatedCityData: html.includes('relatedCityData'),
        updateBackgroundData: html.includes('updateBackgroundData'),
        cityView: html.includes('view=city'),
        buildingGround: html.includes('buildingGround'),
        ikariam: html.includes('ikariam'),
        cityName: html.includes('cityName'),
        gameData: html.includes('gameData'),
        ajaxToken: html.includes('ajaxRequestUrl'),
      };

      const isLoginPage =
        html.includes('loginForm') ||
        html.includes('login">') ||
        html.includes('password">') ||
        html.includes('login_redirect');

      // Debug logging détaillé
      console.log('Session validation patterns:', patterns);
      console.log('Is login page:', isLoginPage);

      // Considère la session valide si au moins 2 patterns sont trouvés
      const matchCount = Object.values(patterns).filter(Boolean).length;
      const hasGameData = matchCount >= 2;

      const isValid = hasGameData && !isLoginPage;

      console.log('Session validation result:', {
        hasGameData,
        matchCount,
        isLoginPage,
        responseLength: html.length,
        statusCode: response.status,
        VALID: isValid,
      });

      return isValid;
    } catch (error) {
      console.error('Session validation error:', error);
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
      console.log('📍 getCities: Début de la récupération des villes...');
      const response = await this.request('/index.php?view=city');
      const html = response.data;

      console.log('📍 getCities: HTML reçu, longueur:', html.length);

      // Parse le JSON contenant les données des villes
      // Cherche différents patterns possibles
      const patterns = [
        /relatedCityData\s*:\s*JSON\.parse\('(.+?)'\s*,/s,
        /relatedCityData\s*:\s*JSON\.parse\("(.+?)"\s*,/s,
        /relatedCityData\s*:\s*JSON\.parse\('(.+?)'/s,
        /relatedCityData\s*:\s*JSON\.parse\("(.+?)"/s,
        /relatedCityData\s*:\s*(\{.+?\})\s*,\s*additionalInfo/s,
        /relatedCityData\s*:\s*(\{(?:[^{}]|(?:\{[^{}]*\}))*\})/s,
      ];

      let citiesMatch = null;
      let patternIndex = -1;

      for (let i = 0; i < patterns.length; i++) {
        citiesMatch = html.match(patterns[i]);
        if (citiesMatch) {
          patternIndex = i;
          console.log('📍 getCities: Pattern trouvé (index', i, ')');
          break;
        }
      }

      if (!citiesMatch) {
        console.error('📍 getCities: Aucun pattern trouvé!');
        console.log('📍 Extrait HTML (recherche relatedCityData):');
        const idx = html.indexOf('relatedCityData');
        if (idx >= 0) {
          console.log(html.substring(idx, idx + 500));

          // Fallback: extraction manuelle par comptage d'accolades
          const startIdx = html.indexOf('{', idx);
          if (startIdx >= 0) {
            let braceCount = 0;
            let endIdx = startIdx;

            for (let i = startIdx; i < html.length; i++) {
              if (html[i] === '{') braceCount++;
              if (html[i] === '}') braceCount--;
              if (braceCount === 0) {
                endIdx = i;
                break;
              }
            }

            if (endIdx > startIdx) {
              console.log('📍 getCities: Tentative extraction manuelle par comptage accolades');
              const extractedJson = html.substring(startIdx, endIdx + 1);
              console.log('📍 JSON extrait (premiers 200 chars):', extractedJson.substring(0, 200));

              try {
                const citiesData = JSON.parse(extractedJson);
                const cities: City[] = [];

                for (const cityId in citiesData) {
                  const cityData = citiesData[cityId];

                  // Filtre: ne garde que les vraies villes
                  const isCityKey = cityId.startsWith('city_');
                  const isCityObject = typeof cityData === 'object' && cityData !== null &&
                                       ('id' in cityData || 'name' in cityData);

                  if (!isCityKey && !isCityObject) {
                    console.log('📍 getCities (fallback): Ignore métadonnée:', cityId);
                    continue;
                  }

                  // Parse les coordonnées
                  let x = 0, y = 0;
                  if (typeof cityData.coords === 'string') {
                    const coordMatch = cityData.coords.match(/\[(\d+):(\d+)\]/);
                    if (coordMatch) {
                      x = parseInt(coordMatch[1]);
                      y = parseInt(coordMatch[2]);
                    }
                  } else if (cityData.coords && typeof cityData.coords === 'object') {
                    x = cityData.coords.x || 0;
                    y = cityData.coords.y || 0;
                  }

                  cities.push({
                    id: cityId,
                    name: cityData.name || 'Ville sans nom',
                    islandId: cityData.islandId || '',
                    x,
                    y,
                    resources: {
                      wood: 0,
                      wine: 0,
                      marble: 0,
                      crystal: 0,
                      sulfur: 0,
                    },
                  });
                }

                console.log('📍 getCities: Villes parsées (fallback):', cities.length);
                return { success: true, data: cities };
              } catch (fallbackError: any) {
                console.error('📍 getCities: Erreur fallback:', fallbackError.message);
              }
            }
          }
        } else {
          console.log('relatedCityData non trouvé dans le HTML!');
        }
        return { success: false, error: 'Impossible de récupérer les villes (pattern non trouvé)' };
      }

      console.log('📍 getCities: Extraction du JSON...');
      // Decode le JSON échappé
      let citiesJson = citiesMatch[1];
      citiesJson = citiesJson.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');

      console.log('📍 getCities: JSON extrait (premiers 200 chars):', citiesJson.substring(0, 200));

      let citiesData;
      try {
        citiesData = JSON.parse(citiesJson);
        console.log('📍 getCities: JSON parsé, nombre de villes:', Object.keys(citiesData).length);
      } catch (parseError: any) {
        console.error('📍 getCities: Erreur JSON.parse:', parseError.message);
        console.log('📍 getCities: Tentative fallback avec comptage accolades...');

        // Fallback: retrouver relatedCityData et extraire manuellement
        const idx = html.indexOf('relatedCityData');
        if (idx >= 0) {
          const startIdx = html.indexOf('{', idx);
          if (startIdx >= 0) {
            let braceCount = 0;
            let endIdx = startIdx;

            for (let i = startIdx; i < html.length; i++) {
              if (html[i] === '{') braceCount++;
              if (html[i] === '}') braceCount--;
              if (braceCount === 0) {
                endIdx = i;
                break;
              }
            }

            if (endIdx > startIdx) {
              const fallbackJson = html.substring(startIdx, endIdx + 1);
              console.log('📍 JSON fallback extrait (premiers 200 chars):', fallbackJson.substring(0, 200));

              try {
                citiesData = JSON.parse(fallbackJson);
                console.log('📍 getCities: JSON parsé via fallback, nombre de villes:', Object.keys(citiesData).length);
              } catch (fallbackError: any) {
                console.error('📍 getCities: Erreur fallback aussi:', fallbackError.message);
                return {
                  success: false,
                  error: 'Impossible de parser les données des villes: ' + fallbackError.message,
                };
              }
            }
          }
        }

        if (!citiesData) {
          return {
            success: false,
            error: 'Impossible de parser les données des villes: ' + parseError.message,
          };
        }
      }

      const cities: City[] = [];

      // Parse chaque ville (filtre les métadonnées comme "additionalInfo", "selectedCity")
      for (const cityId in citiesData) {
        const cityData = citiesData[cityId];

        // Filtre: ne garde que les vraies villes
        // Les villes ont soit une clé qui commence par "city_", soit un objet avec "id" et "name"
        const isCityKey = cityId.startsWith('city_');
        const isCityObject = typeof cityData === 'object' && cityData !== null &&
                             ('id' in cityData || 'name' in cityData);

        if (!isCityKey && !isCityObject) {
          console.log('📍 getCities: Ignore métadonnée:', cityId);
          continue;
        }

        // Parse les coordonnées (format: "[X:Y] " ou {x: X, y: Y})
        let x = 0, y = 0;
        if (typeof cityData.coords === 'string') {
          // Format: "[46:53] "
          const coordMatch = cityData.coords.match(/\[(\d+):(\d+)\]/);
          if (coordMatch) {
            x = parseInt(coordMatch[1]);
            y = parseInt(coordMatch[2]);
          }
        } else if (cityData.coords && typeof cityData.coords === 'object') {
          x = cityData.coords.x || 0;
          y = cityData.coords.y || 0;
        }

        cities.push({
          id: cityId,
          name: cityData.name || 'Ville sans nom',
          islandId: cityData.islandId || '',
          x,
          y,
          resources: {
            wood: 0,
            wine: 0,
            marble: 0,
            crystal: 0,
            sulfur: 0,
          },
        });
      }

      console.log('📍 getCities: Villes parsées:', cities.length);
      return { success: true, data: cities };
    } catch (error: any) {
      console.error('📍 getCities: ERREUR:', error);
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
      const response = await this.request(`/index.php?view=city&cityId=${cityId}`);
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
      const constructionMatches = html.matchAll(
        /buildingUpgrade[^}]+position[^:]*:([^,]+)[^}]+buildingId[^:]*:([^,]+)[^}]+upgradeCountDown[^:]*:([^,]+)/g
      );
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
      const cityResponse = await this.request(`/index.php?view=city&cityId=${cityId}`);
      const actionRequestMatch = cityResponse.data.match(/actionRequest[^']*'([^']+)/);

      if (!actionRequestMatch) {
        return { success: false, error: 'Token CSRF non trouvé' };
      }

      const actionRequest = actionRequestMatch[1];

      // Envoie la requête de construction
      const response = await this.request(
        `/index.php?action=CityScreen&function=build&cityId=${cityId}&position=${buildingId}&actionRequest=${actionRequest}`,
        { method: 'POST' }
      );

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
  }
}

// Export singleton
export const ikariamApi = new IkariamApi();
