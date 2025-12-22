import type { IkariamSession, City, Resources, Building, ApiResponse } from '../types';
import { parseCookies, validateCookies } from '../utils/cookieParser';
import { PROXY_URL, USE_PROXY } from '../config/api';

/**
 * Extrait un objet JSON depuis du HTML en utilisant le comptage d'accolades
 * @param html Le HTML source
 * @param startPattern Le pattern de recherche (ex: "relatedCityData", "updateBackgroundData")
 * @returns Le JSON extrait ou null si non trouvé
 */
function extractJsonFromHtml(html: string, startPattern: string): any | null {
  const idx = html.indexOf(startPattern);
  if (idx < 0) {
    console.log(`⚠️ Pattern "${startPattern}" non trouvé dans le HTML`);
    return null;
  }

  // Cherche si c'est dans un JSON.parse('...') ou JSON.parse("...")
  const afterPattern = html.substring(idx + startPattern.length);
  const parseMatch = afterPattern.match(/^\s*:\s*JSON\.parse\s*\(\s*(['"])([\s\S]+?)\1/);
  let jsonStr = '';

  if (parseMatch) {
    // C'est dans un JSON.parse(), extrait la string et décode les échappements
    jsonStr = parseMatch[2];
    // Décode les échappements JavaScript dans l'ordre correct
    jsonStr = jsonStr.replace(/\\\\/g, '\x00'); // Temporaire pour \\
    jsonStr = jsonStr.replace(/\\"/g, '"');
    jsonStr = jsonStr.replace(/\\'/g, "'");
    jsonStr = jsonStr.replace(/\x00/g, '\\'); // Restaure les vrais backslashes
    console.log(`✅ JSON extrait de JSON.parse() pour "${startPattern}" (${jsonStr.length} chars)`);
  }

  // Fallback: extraction directe par comptage d'accolades
  if (!jsonStr) {
    const startIdx = html.indexOf('{', idx);
    if (startIdx < 0) {
      console.log(`⚠️ Accolade ouvrante non trouvée après "${startPattern}"`);
      return null;
    }

    let braceCount = 0;
    let endIdx = startIdx;
    let inString = false;
    let escapeNext = false;

    for (let i = startIdx; i < html.length; i++) {
      const char = html[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;

        if (braceCount === 0) {
          endIdx = i;
          break;
        }
      }
    }

    if (braceCount !== 0 || endIdx === startIdx) {
      console.log(`⚠️ JSON incomplet trouvé pour "${startPattern}"`);
      return null;
    }

    jsonStr = html.substring(startIdx, endIdx + 1);
    console.log(`✅ JSON extrait par comptage pour "${startPattern}" (${jsonStr.length} chars)`);
  }

  try {
    return JSON.parse(jsonStr);
  } catch (e: any) {
    console.error(`❌ Erreur parsing JSON pour "${startPattern}":`, e.message);
    console.log('Extrait (200 premiers chars):', jsonStr.substring(0, 200));
    return null;
  }
}

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

      // Extrait relatedCityData en utilisant extractJsonFromHtml
      const citiesData = extractJsonFromHtml(html, 'relatedCityData');

      if (!citiesData) {
        return {
          success: false,
          error: 'Impossible de récupérer les données des villes depuis le HTML',
        };
      }

      console.log('📍 getCities: Données parsées, nombre total de clés:', Object.keys(citiesData).length);

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
      console.log('📍 getCityDetails: Récupération détails ville', cityId);
      const response = await this.request(`/index.php?view=city&cityId=${cityId}`);
      const html = response.data;

      // Fonction helper pour parser les nombres de manière sûre
      const parseNumber = (val: any): number => {
        if (typeof val === 'number') return Math.floor(val);
        const num = parseInt(String(val || '0'), 10);
        return isNaN(num) ? 0 : num;
      };

      // Parse les infos de la ville depuis updateBackgroundData
      const cityInfo = extractJsonFromHtml(html, 'updateBackgroundData');
      const cityName = cityInfo?.name || cityId;
      const islandId = cityInfo?.islandId || '';
      const x = parseNumber(cityInfo?.islandXCoord);
      const y = parseNumber(cityInfo?.islandYCoord);

      console.log('📍 getCityDetails: Infos ville:', { cityName, islandId, x, y });

      // Parse les ressources depuis currentResources ou autres patterns
      let resources: Resources = {
        wood: 0,
        wine: 0,
        marble: 0,
        crystal: 0,
        sulfur: 0,
      };

      // Essaye plusieurs patterns pour les ressources
      const patterns = ['currentResources'];
      let resourcesData = null;

      for (const pattern of patterns) {
        const data = extractJsonFromHtml(html, pattern);
        if (data) {
          console.log(`📍 getCityDetails: "${pattern}" trouvé, contenu:`, data);
          console.log(`📍 getCityDetails: Clés disponibles:`, Object.keys(data));

          // Vérifie si c'est les ressources (a des clés comme wood, wine, etc)
          const hasResourceKeys = Object.keys(data).some(key =>
            ['wood', 'wine', 'marble', 'crystal', 'sulfur', 'resource', 'production'].includes(key)
          );

          if (hasResourceKeys) {
            resourcesData = data;
            console.log(`✅ Ressources identifiées dans "${pattern}"`);
            break;
          }
        }
      }

      if (resourcesData) {
        // DEBUG: log les valeurs brutes
        console.log('🔍 DEBUG resourcesData["1"]:', resourcesData['1']);
        console.log('🔍 DEBUG resourcesData["2"]:', resourcesData['2']);
        console.log('🔍 DEBUG resourcesData.resource:', resourcesData.resource);

        // Mapping des IDs de ressources Ikariam vers les noms
        // 1 = wood, 2 = wine, 3 = marble, 4 = crystal, 5 = sulfur
        resources = {
          wood: parseNumber(resourcesData['1'] || resourcesData.wood),
          wine: parseNumber(resourcesData['2'] || resourcesData.wine),
          marble: parseNumber(resourcesData['3'] || resourcesData.marble),
          crystal: parseNumber(resourcesData['4'] || resourcesData.crystal),
          sulfur: parseNumber(resourcesData['5'] || resourcesData.sulfur),
          gold: parseNumber(resourcesData.resource || resourcesData.gold),
          citizens: parseNumber(resourcesData.citizens),
        };
        console.log('✅ getCityDetails: Ressources parsées:', resources);
      } else {
        console.warn('⚠️ getCityDetails: Ressources non trouvées - affichage à 0');
      }

      // Parse les bâtiments de la ville
      let buildings: Building[] = [];
      try {
        // Cherche buildingGround dans le HTML pour les bâtiments
        const buildingGroundMatch = html.match(/id="buildingGround"[\s\S]*?<\/div>/);
        if (buildingGroundMatch) {
          const buildingGroundHtml = buildingGroundMatch[0];

          // Parse chaque position de bâtiment (0-17)
          for (let position = 0; position <= 17; position++) {
            const positionRegex = new RegExp(
              `position${position}[^>]*class="([^"]*)"[^>]*>([\\s\\S]*?)<\\/div>`
            );
            const positionMatch = buildingGroundHtml.match(positionRegex);

            if (positionMatch) {
              const classes = positionMatch[1];
              const content = positionMatch[2];

              // Extrait le type de bâtiment depuis la classe
              const buildingTypeMatch = classes.match(/building(\w+)/);
              const buildingType = buildingTypeMatch ? buildingTypeMatch[1].toLowerCase() : '';

              // Extrait le niveau
              const levelMatch = content.match(/buildingLevel(\d+)/);
              const level = levelMatch ? parseInt(levelMatch[1]) : 0;

              // Extrait le nom du bâtiment
              const nameMatch = content.match(/buildinginfo[^>]*title="([^"]+)"/);
              const name = nameMatch ? nameMatch[1].replace(/&nbsp;/g, ' ').trim() : '';

              if (buildingType && level > 0) {
                // Tente d'extraire les coûts et le temps d'upgrade depuis le HTML
                // Ces infos sont souvent dans les attributs data- ou dans le contenu
                let upgradeTime: number | undefined;
                let upgradeCost: Resources | undefined;

                // Cherche le temps de construction (format: data-constructiontime="3600" en secondes)
                const timeMatch = content.match(/data-constructiontime="(\d+)"/);
                if (timeMatch) {
                  upgradeTime = parseInt(timeMatch[1]);
                }

                // Cherche les coûts dans les attributs data-costs
                const costsMatch = content.match(/data-costs="([^"]+)"/);
                if (costsMatch) {
                  try {
                    const costsData = JSON.parse(costsMatch[1].replace(/&quot;/g, '"'));
                    upgradeCost = {
                      wood: parseNumber(costsData['1'] || 0),
                      wine: parseNumber(costsData['2'] || 0),
                      marble: parseNumber(costsData['3'] || 0),
                      crystal: parseNumber(costsData['4'] || 0),
                      sulfur: parseNumber(costsData['5'] || 0),
                    };
                  } catch (e) {
                    console.warn('⚠️ Impossible de parser les coûts pour', buildingType);
                  }
                }

                buildings.push({
                  id: `${position}`,
                  name: name || buildingType,
                  level,
                  position,
                  type: buildingType as any,
                  upgradeTime,
                  upgradeCost,
                });
              }
            }
          }
          console.log('📍 getCityDetails: Bâtiments trouvés:', buildings.length);
        }
      } catch (error) {
        console.error('⚠️ getCityDetails: Erreur parsing bâtiments:', error);
      }

      // Parse les constructions en cours
      let constructionQueue: Construction[] = [];
      try {
        // Cherche la section de la file de construction
        const queueMatch = html.match(/id="constructionQueue"[\s\S]*?<\/ul>/);
        if (queueMatch) {
          const queueHtml = queueMatch[0];

          // Parse chaque élément de la file (limite à 10 pour éviter les problèmes)
          const itemMatches = queueHtml.match(/<li[^>]*class="[^"]*queueItem[^"]*"[^>]*>[\s\S]*?<\/li>/g);

          if (itemMatches && itemMatches.length > 0) {
            for (let i = 0; i < Math.min(itemMatches.length, 10); i++) {
              const item = itemMatches[i];

              // Extrait le nom du bâtiment
              const nameMatch = item.match(/title="([^"]+)"/);
              const buildingName = nameMatch ? nameMatch[1].replace(/&nbsp;/g, ' ').trim() : '';

              // Extrait le niveau cible
              const levelMatch = item.match(/Niveau (\d+)/i) || item.match(/Level (\d+)/i);
              const targetLevel = levelMatch ? parseInt(levelMatch[1]) : 0;

              // Extrait le temps de fin (timestamp)
              const timeMatch = item.match(/data-endtime="(\d+)"/);
              const completionTime = timeMatch ? parseInt(timeMatch[1]) * 1000 : Date.now();

              // Extrait l'ID du bâtiment
              const idMatch = item.match(/data-buildingid="(\d+)"/);
              const buildingId = idMatch ? idMatch[1] : '';

              if (buildingName && targetLevel > 0) {
                constructionQueue.push({
                  buildingId,
                  buildingName,
                  targetLevel,
                  completionTime,
                  currentLevel: targetLevel - 1,
                });
              }
            }
          }
        }
        console.log('📍 getCityDetails: Constructions en cours:', constructionQueue.length);
      } catch (error) {
        console.error('⚠️ getCityDetails: Erreur parsing constructions:', error);
      }

      console.log('📍 getCityDetails: Constructions en cours:', constructionQueue.length);
      console.log('📍 getCityDetails: Prêt à retourner les données');
      console.log('📍 getCityDetails: cityName =', cityName);
      console.log('📍 getCityDetails: resources =', resources);

      const result = {
        success: true,
        data: {
          id: cityId,
          name: cityName,
          islandId,
          x,
          y,
          resources,
          buildings,
          constructionQueue,
        },
      };

      console.log('✅ getCityDetails: SUCCESS - Retour des données');
      return result;
    } catch (error: any) {
      console.error('❌ getCityDetails: EXCEPTION:', error);
      console.error('❌ getCityDetails: Stack:', error.stack);
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
