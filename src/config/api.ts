/**
 * Configuration de l'API
 */

// URL du backend proxy
// En développement local : http://localhost:3001
// En production : déployer sur Heroku/Vercel et mettre l'URL ici
export const PROXY_URL = __DEV__
  ? 'http://localhost:3001'
  : 'https://your-deployed-proxy.herokuapp.com';

// Active le mode proxy (nécessaire pour React Native et web)
export const USE_PROXY = true;
