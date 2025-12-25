import type { IkariamSession, City, Resources, Building, ApiResponse } from '../types';
import { parseCookies, validateCookies } from '../utils/cookieParser';
import { PROXY_URL, USE_PROXY } from '../config/api';

/**
 * Extrait un objet JSON depuis du HTML - supporte plusieurs formats:
 * 1. Format JSON-RPC Ikariam: ["patternName", {...data...}],["next"...]
 * 2. Format JSON.parse(): patternName: JSON.parse('...')
 * 3. Format objet direct: patternName: {...}
 *
 * @param html Le HTML source
 * @param startPattern Le pattern de recherche (ex: "relatedCityData", "updateBackgroundData")
 * @returns Le JSON extrait ou null si non trouvé
 */
function extractJsonFromHtml(html: string, startPattern: string): any | null {
  console.log(`🔍 extractJsonFromHtml: Recherche "${startPattern}"...`);

  // === MÉTHODE 1: Format JSON-RPC Ikariam ===
  // Pattern: ["updateBackgroundData", {...}],["updateTemplateData"
  // Basé sur le code d'Ikabot
  const jsonRpcPattern = new RegExp(
    `"${startPattern}"\\s*,\\s*([\\s\\S]*?)\\]\\s*,\\s*\\["`,
    'i'
  );
  const jsonRpcMatch = html.match(jsonRpcPattern);

  if (jsonRpcMatch) {
    const jsonStr = jsonRpcMatch[1].trim();
    console.log(`✅ Format JSON-RPC trouvé pour "${startPattern}" (${jsonStr.length} chars)`);
    try {
      const parsed = JSON.parse(jsonStr);
      console.log(`✅ JSON-RPC parsé avec succès pour "${startPattern}"`);
      return parsed;
    } catch (e: any) {
      console.log(`⚠️ Échec parsing JSON-RPC pour "${startPattern}": ${e.message}`);
      // Continue vers les autres méthodes
    }
  }

  // === MÉTHODE 2: Cherche l'index du pattern ===
  const idx = html.indexOf(startPattern);
  if (idx < 0) {
    console.log(`⚠️ Pattern "${startPattern}" non trouvé dans le HTML`);
    return null;
  }

  const afterPattern = html.substring(idx + startPattern.length);

  // === MÉTHODE 3: Format JSON.parse('...') ou JSON.parse("...") ===
  const parseMatch = afterPattern.match(/^\s*:\s*JSON\.parse\s*\(\s*(['"])([\s\S]+?)\1/);
  if (parseMatch) {
    let jsonStr = parseMatch[2];
    // Décode les échappements JavaScript dans l'ordre correct
    jsonStr = jsonStr.replace(/\\\\/g, '\x00'); // Temporaire pour \\
    jsonStr = jsonStr.replace(/\\"/g, '"');
    jsonStr = jsonStr.replace(/\\'/g, "'");
    jsonStr = jsonStr.replace(/\x00/g, '\\'); // Restaure les vrais backslashes
    console.log(`✅ JSON extrait de JSON.parse() pour "${startPattern}" (${jsonStr.length} chars)`);
    try {
      return JSON.parse(jsonStr);
    } catch (e: any) {
      console.error(`❌ Erreur parsing JSON.parse() pour "${startPattern}":`, e.message);
    }
  }

  // === MÉTHODE 4: Extraction directe par comptage d'accolades ===
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

  const jsonStr = html.substring(startIdx, endIdx + 1);
  console.log(`✅ JSON extrait par comptage pour "${startPattern}" (${jsonStr.length} chars)`);

  try {
    return JSON.parse(jsonStr);
  } catch (e: any) {
    console.error(`❌ Erreur parsing JSON pour "${startPattern}":`, e.message);
    console.log('Extrait (200 premiers chars):', jsonStr.substring(0, 200));
    return null;
  }
}

/**
 * Extrait les données relatedCityData spécifiquement
 * Ikariam peut les stocker de différentes façons
 */
function extractRelatedCityData(html: string): any | null {
  console.log('🏙️ extractRelatedCityData: Recherche des villes...');

  // Méthode 1: Cherche dans le format JSON-RPC ["relatedCityData", {...}]
  const jsonRpcPattern = /"relatedCityData"\s*,\s*(\{[\s\S]*?\})\s*\]/;
  const jsonRpcMatch = html.match(jsonRpcPattern);
  if (jsonRpcMatch) {
    try {
      const data = JSON.parse(jsonRpcMatch[1]);
      console.log('✅ relatedCityData trouvé via JSON-RPC');
      return data;
    } catch (e) {
      console.log('⚠️ Échec parsing relatedCityData JSON-RPC');
    }
  }

  // Méthode 2: Cherche relatedCityData: JSON.parse('...')
  const parsePattern = /relatedCityData\s*:\s*JSON\.parse\s*\(\s*['"](.+?)['"]\s*\)/;
  const parseMatch = html.match(parsePattern);
  if (parseMatch) {
    try {
      let jsonStr = parseMatch[1];
      jsonStr = jsonStr.replace(/\\"/g, '"').replace(/\\'/g, "'");
      const data = JSON.parse(jsonStr);
      console.log('✅ relatedCityData trouvé via JSON.parse()');
      return data;
    } catch (e) {
      console.log('⚠️ Échec parsing relatedCityData JSON.parse()');
    }
  }

  // Méthode 3: Cherche relatedCityData directement comme objet
  const directPattern = /relatedCityData\s*[:=]\s*(\{[\s\S]*?\})\s*[,;\n\]]/;
  const directMatch = html.match(directPattern);
  if (directMatch) {
    try {
      const data = JSON.parse(directMatch[1]);
      console.log('✅ relatedCityData trouvé directement');
      return data;
    } catch (e) {
      console.log('⚠️ Échec parsing relatedCityData direct');
    }
  }

  // Méthode 4: Extraction via updateBackgroundData qui contient relatedCityData
  const bgData = extractJsonFromHtml(html, 'updateBackgroundData');
  if (bgData && bgData.relatedCityData) {
    console.log('✅ relatedCityData trouvé dans updateBackgroundData');
    return bgData.relatedCityData;
  }

  // Méthode 5: Recherche avec comptage d'accolades depuis relatedCityData
  const idx = html.indexOf('relatedCityData');
  if (idx >= 0) {
    // Trouve le début de l'objet JSON
    const searchStart = idx + 'relatedCityData'.length;
    const braceStart = html.indexOf('{', searchStart);

    if (braceStart >= 0 && braceStart - searchStart < 20) { // Max 20 chars entre pattern et {
      let braceCount = 0;
      let endIdx = braceStart;
      let inString = false;
      let escapeNext = false;

      for (let i = braceStart; i < Math.min(html.length, braceStart + 50000); i++) {
        const char = html[i];

        if (escapeNext) {
          escapeNext = false;
          continue;
        }

        if (char === '\\') {
          escapeNext = true;
          continue;
        }

        if (char === '"') {
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

      if (braceCount === 0 && endIdx > braceStart) {
        const jsonStr = html.substring(braceStart, endIdx + 1);
        try {
          const data = JSON.parse(jsonStr);
          console.log('✅ relatedCityData extrait par comptage d\'accolades');
          return data;
        } catch (e) {
          console.log('⚠️ Échec parsing relatedCityData par comptage');
        }
      }
    }
  }

  console.log('❌ relatedCityData non trouvé avec aucune méthode');
  return null;
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

      // Met à jour les cookies si le serveur en envoie de nouveaux
      if (result.cookies && this.session) {
        const newCookies = result.cookies;
        console.log('🔄 Mise à jour des cookies de session');
        this.session.cookie = newCookies;
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

      // Debug: cherche différents patterns possibles
      const patterns = [
        'relatedCityData',
        'updateBackgroundData',
        'cityId',
        'cityName',
        'ikariam.model',
        'backgroundData',
      ];

      console.log('📍 getCities: Vérification patterns disponibles:');
      patterns.forEach(pattern => {
        const found = html.includes(pattern);
        console.log(`  - ${pattern}: ${found}`);
        if (found) {
          const idx = html.indexOf(pattern);
          console.log(`    Position: ${idx}, contexte: "${html.substring(idx, idx + 150)}..."`);
        }
      });

      // Utilise la nouvelle fonction spécialisée pour extraire relatedCityData
      const citiesData = extractRelatedCityData(html);

      if (!citiesData) {
        // Dernier recours: essaie d'extraire les villes depuis updateBackgroundData
        console.log('📍 getCities: Essai extraction depuis updateBackgroundData...');
        const backgroundData = extractJsonFromHtml(html, 'updateBackgroundData');

        if (backgroundData) {
          console.log('📍 getCities: updateBackgroundData trouvé, clés:', Object.keys(backgroundData));

          // Peut-être que les villes sont directement dans backgroundData
          if (backgroundData.relatedCityData) {
            console.log('📍 getCities: relatedCityData trouvé dans backgroundData');
            return this.parseCitiesFromData(backgroundData.relatedCityData);
          }

          // Ou peut-être que backgroundData contient directement les infos de la ville courante
          // et on peut construire une liste à partir de ça
          if (backgroundData.id && backgroundData.name) {
            console.log('📍 getCities: Construction liste depuis backgroundData directement');
            const city: City = {
              id: backgroundData.id,
              name: backgroundData.name,
              islandId: backgroundData.islandId || '',
              x: parseInt(backgroundData.islandXCoord) || 0,
              y: parseInt(backgroundData.islandYCoord) || 0,
              resources: { wood: 0, wine: 0, marble: 0, crystal: 0, sulfur: 0 },
            };
            return { success: true, data: [city] };
          }
        }

        return {
          success: false,
          error: 'Impossible de récupérer les données des villes depuis le HTML. Vérifiez que votre cookie est valide.',
        };
      }

      return this.parseCitiesFromData(citiesData);
    } catch (error: any) {
      console.error('📍 getCities: ERREUR:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération des villes',
      };
    }
  }

  /**
   * Parse les données de villes depuis l'objet relatedCityData
   */
  private parseCitiesFromData(citiesData: any): ApiResponse<City[]> {
    console.log('📍 parseCitiesFromData: Nombre total de clés:', Object.keys(citiesData).length);

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
        console.log('📍 parseCitiesFromData: Ignore métadonnée:', cityId);
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

      // L'ID réel est dans cityData.id, pas la clé (city_765 → 765)
      const realId = cityData.id ? String(cityData.id) : cityId.replace('city_', '');

      cities.push({
        id: realId,
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
      console.log(`📍 parseCitiesFromData: Ville ajoutée - ${cityData.name} (ID: ${realId})`);
    }

    console.log('📍 parseCitiesFromData: Villes parsées:', cities.length);
    return { success: true, data: cities };
  }

  /**
   * Récupère les détails d'une ville spécifique
   */
  async getCityDetails(cityId: string): Promise<ApiResponse<City>> {
    if (!this.session) {
      return { success: false, error: 'Aucune session active' };
    }

    try {
      // Extrait l'ID numérique (765) de "city_765" ou garde l'ID tel quel s'il est déjà numérique
      const numericId = cityId.replace('city_', '');
      console.log('📍 getCityDetails: Récupération détails ville', cityId, '→ ID numérique:', numericId);

      // IMPORTANT: Il faut d'abord faire une requête pour changer de ville active
      // sinon Ikariam retourne toujours les infos de la ville courante
      console.log('📍 getCityDetails: Changement de ville active vers', numericId);

      // Première requête pour changer de ville
      await this.request(`/index.php?view=city&cityId=${numericId}`);

      // Petite pause pour laisser le serveur traiter le changement
      await new Promise(resolve => setTimeout(resolve, 100));

      // Deuxième requête pour récupérer les données
      const response = await this.request(`/index.php?view=city&cityId=${numericId}`);
      const html = response.data;

      console.log(`📍 getCityDetails: HTML reçu pour ${cityId}, taille:`, html.length);

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
        console.log('🔍 DEBUG resourcesData complet:', JSON.stringify(resourcesData, null, 2));
        console.log('🔍 DEBUG resourcesData.resource:', resourcesData.resource);
        console.log('🔍 DEBUG resourcesData["1"]:', resourcesData['1']);
        console.log('🔍 DEBUG resourcesData["2"]:', resourcesData['2']);
        console.log('🔍 DEBUG resourcesData["3"]:', resourcesData['3']);
        console.log('🔍 DEBUG resourcesData["4"]:', resourcesData['4']);

        // Mapping correct basé sur Ikabot:
        // "resource" = bois (wood) - ressource de base
        // "1" = vin (wine)
        // "2" = marbre (marble)
        // "3" = cristal (crystal)
        // "4" = soufre (sulfur)
        // L'or est probablement dans un autre champ (gold, tradegood, etc.)
        resources = {
          wood: parseNumber(resourcesData.resource || resourcesData.wood || 0),
          wine: parseNumber(resourcesData['1'] || resourcesData.wine || 0),
          marble: parseNumber(resourcesData['2'] || resourcesData.marble || 0),
          crystal: parseNumber(resourcesData['3'] || resourcesData.crystal || 0),
          sulfur: parseNumber(resourcesData['4'] || resourcesData.sulfur || 0),
          // L'or peut être dans différents champs selon le contexte
          gold: parseNumber(resourcesData.gold || resourcesData.tradegood || cityInfo?.gold || 0),
          citizens: parseNumber(resourcesData.citizens || 0),
        };
        console.log('✅ getCityDetails: Ressources parsées:', resources);
      } else {
        console.warn('⚠️ getCityDetails: Ressources non trouvées - affichage à 0');
      }

      // Parse les bâtiments de la ville depuis cityInfo.position (comme Ikabot)
      let buildings: Building[] = [];
      try {
        console.log('🏗️ Début du parsing des bâtiments...');

        if (cityInfo && cityInfo.position && Array.isArray(cityInfo.position)) {
          console.log(`✅ Positions trouvées dans cityInfo: ${cityInfo.position.length}`);

          cityInfo.position.forEach((positionData: any, index: number) => {
            // Skip les positions vides
            if (!positionData.building || positionData.building === 'empty') {
              return;
            }

            const level = parseNumber(positionData.level);
            if (level === 0) {
              return; // Skip si pas de niveau
            }

            // Le type de bâtiment peut contenir "constructionSite" s'il est en construction
            let buildingType = positionData.building;
            const isBusy = buildingType.includes('constructionSite');
            if (isBusy) {
              buildingType = buildingType.replace('constructionSite', '').trim();
            }

            // Nettoie le type (enlève "buildingGround" si présent)
            buildingType = buildingType.replace(/buildingGround\s*/g, '').trim();

            if (!buildingType) {
              return; // Skip si pas de type valide
            }

            // Le nom peut être dans positionData.name ou on utilise le type
            const name = positionData.name || buildingType;

            console.log(`✅ Bâtiment trouvé: ${buildingType} (${name}) niveau ${level} à position ${index}`);

            buildings.push({
              id: `${index}`,
              name,
              level,
              position: index,
              type: buildingType as any,
              // Les coûts et temps d'upgrade ne sont pas dans updateBackgroundData
              // Il faudrait une requête supplémentaire pour les obtenir
            });
          });
        } else {
          console.warn('⚠️ cityInfo.position non trouvé ou n\'est pas un tableau');
          console.log('🔍 Structure de cityInfo:', Object.keys(cityInfo || {}));
        }

        console.log(`📍 getCityDetails: Total bâtiments trouvés: ${buildings.length}`);
        if (buildings.length > 0) {
          console.log('📍 Bâtiments:', buildings.map(b => `${b.name} (niv ${b.level})`).join(', '));
        }
      } catch (error) {
        console.error('❌ getCityDetails: Erreur parsing bâtiments:', error);
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
          id: numericId,
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
   * Récupère les coûts d'upgrade d'un bâtiment
   * Approche simplifiée: requête directe sur la page du bâtiment
   */
  async getBuildingUpgradeCost(
    cityId: string,
    position: number,
    buildingType: string,
    currentLevel: number = 0
  ): Promise<ApiResponse<{ cost: Resources; time: number }>> {
    if (!this.session) {
      return { success: false, error: 'Aucune session active' };
    }

    try {
      const numericCityId = cityId.replace('city_', '');
      const targetLevel = currentLevel + 1;
      console.log(`💰 getBuildingUpgradeCost: cityId=${numericCityId}, position=${position}, type=${buildingType}, cible=niv.${targetLevel}`);

      // Initialise les coûts
      const cost: Resources = { wood: 0, wine: 0, marble: 0, crystal: 0, sulfur: 0 };
      let time = 0;

      // Requête directe sur la page du bâtiment - plus simple et fiable
      const buildingUrl = `/index.php?view=${buildingType}&cityId=${numericCityId}&position=${position}&ajax=1`;
      console.log('💰 URL:', buildingUrl);

      const response = await this.request(buildingUrl);
      let html = response.data;

      // Si c'est du JSON-RPC, extrait le HTML
      if (html.startsWith('[["')) {
        try {
          const jsonData = JSON.parse(html);
          for (const item of jsonData) {
            if (Array.isArray(item) && item[0] === 'updateTemplateData') {
              // Le HTML peut être dans item[1] directement ou dans item[1][1]
              if (typeof item[1] === 'string') {
                html = item[1];
                break;
              } else if (item[1] && typeof item[1][1] === 'string') {
                html = item[1][1];
                break;
              }
            }
          }
        } catch (e) {
          console.warn('💰 Erreur parsing JSON-RPC:', e);
        }
      }

      console.log('💰 HTML length:', html.length);

      // === MÉTHODE 1: Cherche les coûts dans la section "upgradeAction" ===
      // Format: <li class="resources"><span class="icon wood">123</span>...
      const upgradeSection = html.match(/class="[^"]*upgradeAction[^"]*"[\s\S]*?<\/div>/i)?.[0] || '';

      if (upgradeSection) {
        console.log('💰 Section upgradeAction trouvée');

        // Extraction des ressources par classe CSS
        const resourcePatterns = [
          { key: 'wood', pattern: /class="[^"]*(?:wood|resource)[^"]*"[^>]*>[\s\S]*?([\d\s,.'']+)/i },
          { key: 'wine', pattern: /class="[^"]*wine[^"]*"[^>]*>[\s\S]*?([\d\s,.'']+)/i },
          { key: 'marble', pattern: /class="[^"]*marble[^"]*"[^>]*>[\s\S]*?([\d\s,.'']+)/i },
          { key: 'crystal', pattern: /class="[^"]*(?:crystal|glass)[^"]*"[^>]*>[\s\S]*?([\d\s,.'']+)/i },
          { key: 'sulfur', pattern: /class="[^"]*sulfu?r[^"]*"[^>]*>[\s\S]*?([\d\s,.'']+)/i },
        ];

        for (const { key, pattern } of resourcePatterns) {
          const match = upgradeSection.match(pattern);
          if (match) {
            const value = parseInt(match[1].replace(/[\s,.'']/g, '')) || 0;
            cost[key as keyof Resources] = value;
            console.log(`💰 ${key}: ${value}`);
          }
        }

        // Extraction du temps
        const timeMatch = upgradeSection.match(/(?:time|temps)[^>]*>[\s\S]*?(\d+)[:\s]*(\d+)?[:\s]*(\d+)?/i);
        if (timeMatch) {
          // Peut être HH:MM:SS ou juste des minutes
          const h = parseInt(timeMatch[1]) || 0;
          const m = parseInt(timeMatch[2]) || 0;
          const s = parseInt(timeMatch[3]) || 0;
          time = h * 3600 + m * 60 + s;
          console.log(`💰 Temps: ${h}h ${m}m ${s}s = ${time}s`);
        }
      }

      // === MÉTHODE 2: Cherche dans les ressources affichées (format liste) ===
      if (cost.wood === 0 && cost.marble === 0) {
        console.log('💰 Essai méthode 2: pattern liste ressources...');

        // Pattern: <li ... class="... wood ..."><span class="value">123</span>
        const liPatterns = [
          { key: 'wood', pattern: /<li[^>]*class="[^"]*wood[^"]*"[^>]*>[\s\S]*?<span[^>]*class="[^"]*value[^"]*"[^>]*>([\d\s,.'']+)/gi },
          { key: 'wine', pattern: /<li[^>]*class="[^"]*wine[^"]*"[^>]*>[\s\S]*?<span[^>]*class="[^"]*value[^"]*"[^>]*>([\d\s,.'']+)/gi },
          { key: 'marble', pattern: /<li[^>]*class="[^"]*marble[^"]*"[^>]*>[\s\S]*?<span[^>]*class="[^"]*value[^"]*"[^>]*>([\d\s,.'']+)/gi },
          { key: 'crystal', pattern: /<li[^>]*class="[^"]*(?:crystal|glass)[^"]*"[^>]*>[\s\S]*?<span[^>]*class="[^"]*value[^"]*"[^>]*>([\d\s,.'']+)/gi },
          { key: 'sulfur', pattern: /<li[^>]*class="[^"]*sulfu?r[^"]*"[^>]*>[\s\S]*?<span[^>]*class="[^"]*value[^"]*"[^>]*>([\d\s,.'']+)/gi },
        ];

        for (const { key, pattern } of liPatterns) {
          const match = pattern.exec(html);
          if (match) {
            const value = parseInt(match[1].replace(/[\s,.'']/g, '')) || 0;
            cost[key as keyof Resources] = value;
            console.log(`💰 [li] ${key}: ${value}`);
          }
        }
      }

      // === MÉTHODE 3: Extraction depuis un tableau de coûts (ikipedia) ===
      if (cost.wood === 0 && cost.marble === 0) {
        console.log('💰 Essai méthode 3: tableau de coûts...');

        // Cherche la ligne du niveau cible
        const rowPattern = new RegExp(
          `<tr[^>]*>[\\s\\S]*?<td[^>]*class="[^"]*level[^"]*"[^>]*>\\s*${targetLevel}\\s*<\\/td>([\\s\\S]*?)<\\/tr>`,
          'i'
        );
        const rowMatch = html.match(rowPattern);

        if (rowMatch) {
          console.log('💰 Ligne niveau', targetLevel, 'trouvée');
          const rowHtml = rowMatch[1];

          // Extrait toutes les valeurs de la ligne
          const values: number[] = [];
          const cellPattern = /<td[^>]*class="[^"]*costs[^"]*"[^>]*>[\s\S]*?([\d\s,.'']+)[\s\S]*?<\/td>/gi;
          let cellMatch;
          while ((cellMatch = cellPattern.exec(rowHtml)) !== null) {
            const value = parseInt(cellMatch[1].replace(/[\s,.'']/g, '')) || 0;
            values.push(value);
          }

          console.log('💰 Valeurs ligne:', values);

          // Assigne par position (ordre standard Ikariam)
          if (values.length >= 1) cost.wood = values[0];
          if (values.length >= 2) cost.marble = values[1];
          if (values.length >= 3) {
            // La 3ème colonne peut être le temps ou une autre ressource
            // Si c'est petit (< 1000), c'est probablement le temps en minutes
            if (values[2] < 1000) {
              time = values[2] * 60;
            } else {
              cost.wine = values[2];
            }
          }
          if (values.length >= 4) cost.crystal = values[3];
          if (values.length >= 5) cost.sulfur = values[4];
          if (values.length >= 6) time = values[5] * 60; // Temps en minutes
        }
      }

      // === MÉTHODE 4: Cherche les nombres après les icônes de ressources ===
      if (cost.wood === 0 && cost.marble === 0) {
        console.log('💰 Essai méthode 4: icônes ressources...');

        // Pattern simple: cherche les spans avec des icônes suivis de nombres
        const iconPatterns = [
          { key: 'wood', pattern: /(?:wood|bois|matériau)[^<]*<[^>]*>[\s\S]{0,100}?([\d\s,.'']+)/gi },
          { key: 'marble', pattern: /(?:marble|marbre)[^<]*<[^>]*>[\s\S]{0,100}?([\d\s,.'']+)/gi },
          { key: 'wine', pattern: /(?:wine|vin)[^<]*<[^>]*>[\s\S]{0,100}?([\d\s,.'']+)/gi },
          { key: 'crystal', pattern: /(?:crystal|cristal|glass|verre)[^<]*<[^>]*>[\s\S]{0,100}?([\d\s,.'']+)/gi },
          { key: 'sulfur', pattern: /(?:sulfur|soufre)[^<]*<[^>]*>[\s\S]{0,100}?([\d\s,.'']+)/gi },
        ];

        for (const { key, pattern } of iconPatterns) {
          const match = pattern.exec(html);
          if (match) {
            const value = parseInt(match[1].replace(/[\s,.'']/g, '')) || 0;
            if (value > 0) {
              cost[key as keyof Resources] = value;
              console.log(`💰 [icon] ${key}: ${value}`);
            }
          }
        }
      }

      // Extraction du temps si pas encore trouvé
      if (time === 0) {
        // Cherche format HH:MM:SS ou similaire
        const timePatterns = [
          /data-(?:end)?time="(\d+)"/i,
          /countdown[^>]*>[\s\S]*?(\d+):(\d+):(\d+)/i,
          /(?:durée|duration|temps|time)[^>]*>[\s\S]*?(\d+)\s*[hH]\s*(\d+)/i,
        ];

        for (const pattern of timePatterns) {
          const match = html.match(pattern);
          if (match) {
            if (match[2]) {
              // Format avec heures et minutes
              time = (parseInt(match[1]) || 0) * 3600 + (parseInt(match[2]) || 0) * 60 + (parseInt(match[3]) || 0);
            } else {
              // Timestamp ou durée simple
              time = parseInt(match[1]) || 0;
            }
            if (time > 0) {
              console.log(`💰 Temps trouvé: ${time}s`);
              break;
            }
          }
        }
      }

      console.log('💰 Résultat final - Coûts:', cost, 'Temps:', time);

      return {
        success: true,
        data: { cost, time },
      };
    } catch (error: any) {
      console.error('💰 Erreur getBuildingUpgradeCost:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération des coûts',
      };
    }
  }

  /**
   * Lance l'upgrade d'un bâtiment
   * Basé sur l'API Ikabot: envoie une requête POST pour démarrer la construction
   */
  async startConstruction(
    cityId: string,
    buildingPosition: number,
    buildingType: string
  ): Promise<ApiResponse<{ message: string }>> {
    if (!this.session) {
      return { success: false, error: 'Aucune session active' };
    }

    try {
      const numericCityId = cityId.replace('city_', '');
      console.log(`🔨 startConstruction: cityId=${numericCityId}, position=${buildingPosition}, type=${buildingType}`);

      // Étape 1: Récupère le token CSRF
      const cityResponse = await this.request(`/index.php?view=city&cityId=${numericCityId}`);
      let actionRequest = '';

      // Cherche actionRequest dans le HTML
      const match = cityResponse.data.match(/actionRequest\s*[=:]\s*["']([a-zA-Z0-9]+)["']/);
      if (match) {
        actionRequest = match[1];
      }

      if (!actionRequest) {
        console.error('🔨 Token CSRF non trouvé');
        return { success: false, error: 'Token CSRF non trouvé' };
      }

      console.log('🔨 actionRequest:', actionRequest.substring(0, 10) + '...');

      // Étape 2: Envoie la requête d'upgrade
      // Format Ikabot: action=CityScreen&function=upgradeBuilding&cityId=X&position=Y&level=Z&activeTab=tabBuilding
      const upgradeUrl = `/index.php?action=CityScreen&function=upgradeBuilding&actionRequest=${actionRequest}&cityId=${numericCityId}&position=${buildingPosition}&backgroundView=city&currentCityId=${numericCityId}&templateView=city&ajax=1`;

      console.log('🔨 URL upgrade:', upgradeUrl);

      const response = await this.request(upgradeUrl, { method: 'GET' });

      console.log('🔨 Réponse upgrade:', response.status, response.data.substring(0, 300));

      // Vérifie si la réponse contient une erreur
      if (response.status !== 200) {
        return { success: false, error: 'Erreur serveur' };
      }

      // Parse la réponse JSON-RPC si possible
      if (response.data.startsWith('[["')) {
        try {
          const jsonData = JSON.parse(response.data);

          // Cherche des indicateurs d'erreur dans la réponse
          for (const [name, data] of jsonData) {
            if (name === 'error' || (typeof data === 'object' && data?.error)) {
              const errorMsg = data?.error || data?.message || 'Erreur inconnue';
              console.error('🔨 Erreur dans réponse:', errorMsg);
              return { success: false, error: errorMsg };
            }
          }

          console.log('🔨 ✅ Upgrade lancé avec succès!');
          return {
            success: true,
            data: { message: 'Construction lancée avec succès!' }
          };
        } catch (e) {
          console.warn('🔨 Erreur parsing réponse:', e);
        }
      }

      // Vérifie si c'est une page d'erreur HTML
      if (response.data.includes('errorMessage') || response.data.includes('class="error"')) {
        return { success: false, error: 'Ressources insuffisantes ou construction en cours' };
      }

      // Par défaut, considère que c'est un succès si pas d'erreur explicite
      return {
        success: true,
        data: { message: 'Construction lancée!' }
      };
    } catch (error: any) {
      console.error('🔨 startConstruction: Erreur:', error);
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
