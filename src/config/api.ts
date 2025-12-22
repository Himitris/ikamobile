/**
 * Configuration de l'API
 */

// URL du backend proxy
// IMPORTANT: Pour tester sur mobile, remplacez 'localhost' par l'IP de votre ordinateur
// Exemple: 'http://192.168.1.10:3001'
// Pour trouver votre IP:
// - Windows: ipconfig (cherchez "Adresse IPv4")
// - Mac/Linux: ifconfig | grep "inet " (ou ip addr show)
export const PROXY_URL = __DEV__
  ? 'http://localhost:3001' // Change en 'http://192.168.X.X:3001' pour mobile
  : 'https://your-deployed-proxy.herokuapp.com';

// Active le mode proxy (nécessaire pour React Native et web)
export const USE_PROXY = true;
