// Constantes du jeu Ikariam

export const RESOURCES = {
  WOOD: 'wood',
  WINE: 'wine',
  MARBLE: 'marble',
  CRYSTAL: 'crystal',
  SULFUR: 'sulfur',
  GOLD: 'gold',
} as const;

export const BUILDING_NAMES: Record<string, string> = {
  townHall: 'Hôtel de ville',
  academy: 'Académie',
  warehouse: 'Entrepôt',
  palace: 'Palais',
  museum: 'Musée',
  port: 'Port',
  shipyard: 'Chantier naval',
  barracks: 'Caserne',
  wall: 'Muraille',
  tavern: 'Taverne',
  tradingPost: 'Comptoir commercial',
  workshop: 'Atelier',
  hideout: 'Cachette',
  sawmill: 'Scierie',
  vineyard: 'Vignoble',
  quarry: 'Carrière',
  crystalMine: 'Mine de cristal',
  sulfurPit: 'Mine de soufre',
};

// URLs relatives pour les vues Ikariam
export const IKARIAM_VIEWS = {
  CITY: 'view=city&cityId=',
  ISLAND: 'view=island&islandId=',
  WORLDMAP: 'view=worldmap_iso',
  PORT: 'view=port&cityId=',
  MILITARY: 'view=militaryAdvisor&cityId=',
  RESEARCH: 'view=researchAdvisor&cityId=',
} as const;

// Actions possibles
export const IKARIAM_ACTIONS = {
  BUILD: 'action=CityScreen&function=build',
  CANCEL_BUILD: 'action=CityScreen&function=cancelUpgrade',
  GET_JSON_AREA: 'action=WorldMap&function=getJSONArea',
} as const;
