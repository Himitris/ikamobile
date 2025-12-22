import { Platform } from 'react-native';

/**
 * Configuration de l'API
 */

// IP locale de votre ordinateur pour que le mobile puisse se connecter
// Pour trouver votre IP:
// - Windows: ipconfig (cherchez "Adresse IPv4")
// - Mac/Linux: ifconfig | grep "inet " (ou ip addr show)
const LOCAL_IP = '192.168.1.46';

// URL du backend proxy
// Automatiquement détecte si web (localhost) ou mobile (IP locale)
export const PROXY_URL = __DEV__
  ? Platform.OS === 'web'
    ? 'http://localhost:3001' // Web : localhost
    : `http://${LOCAL_IP}:3001` // Mobile : IP locale
  : 'https://your-deployed-proxy.herokuapp.com';

// Active le mode proxy (nécessaire pour React Native et web)
export const USE_PROXY = true;

console.log('🔧 PROXY_URL configuré:', PROXY_URL, '(Platform:', Platform.OS + ')');
