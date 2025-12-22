// Types TypeScript pour l'application Ikariam Mobile

export interface IkariamSession {
  cookie: string;
  server: string;
  userId?: string;
  username?: string;
}

export interface City {
  id: string;
  name: string;
  islandId: string;
  x: number;
  y: number;
  resources: Resources;
  buildings?: Building[];
  constructionQueue?: Construction[];
}

export interface Resources {
  wood: number;
  wine: number;
  marble: number;
  crystal: number;
  sulfur: number;
  gold?: number;
  citizens?: number;
  scientistsAvailable?: number;
}

export interface Building {
  id: string;
  name: string;
  level: number;
  position: number;
  type: BuildingType;
  upgradeTime?: number;
  upgradeCost?: Resources;
}

export interface Construction {
  buildingId: string;
  buildingName: string;
  targetLevel: number;
  completionTime: number; // timestamp
  currentLevel: number;
}

export enum BuildingType {
  TOWN_HALL = 'townHall',
  ACADEMY = 'academy',
  WAREHOUSE = 'warehouse',
  PALACE = 'palace',
  MUSEUM = 'museum',
  PORT = 'port',
  SHIPYARD = 'shipyard',
  BARRACKS = 'barracks',
  WALL = 'wall',
  TAVERN = 'tavern',
  TRADING_POST = 'tradingPost',
  WORKSHOP = 'workshop',
  HIDEOUT = 'hideout',
  // Ressources
  SAWMILL = 'sawmill',
  VINEYARD = 'vineyard',
  QUARRY = 'quarry',
  CRYSTAL_MINE = 'crystalMine',
  SULFUR_PIT = 'sulfurPit',
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
