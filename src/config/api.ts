/**
 * Configuration de l'API
 */

// URL du backend proxy
// IMPORTANT: Pour tester sur mobile, utilisez l'IP de votre ordinateur
// Pour trouver votre IP:
// - Windows: ipconfig (cherchez "Adresse IPv4")
// - Mac/Linux: ifconfig | grep "inet " (ou ip addr show)
export const PROXY_URL = __DEV__
  ? 'http://192.168.1.46:3001' // IP locale pour que mobile puisse se connecter
  : 'https://your-deployed-proxy.herokuapp.com';

// Active le mode proxy (nécessaire pour React Native et web)
export const USE_PROXY = true;
