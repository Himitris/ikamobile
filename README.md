# Ikariam Mobile App

Application mobile React Native / Expo pour jouer à Ikariam depuis votre téléphone.

## 📱 Description

Cette application permet de gérer vos villes Ikariam en déplacement, sans fonctionnalités de bot/automation. Elle reproduit uniquement ce qu'un joueur ferait manuellement.

## ⚙️ Architecture

L'application utilise une architecture **client-serveur** :

```
┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│                 │          │                 │          │                 │
│  App Mobile/Web │  ◄────►  │  Backend Proxy  │  ◄────►  │  Ikariam.com    │
│  (React Native) │          │  (Node.js)      │          │                 │
│                 │          │                 │          │                 │
└─────────────────┘          └─────────────────┘          └─────────────────┘
```

**Pourquoi un backend proxy ?**
React Native ne permet pas de définir manuellement le header `Cookie` pour des raisons de sécurité. Le backend proxy contourne cette limitation en effectuant les requêtes avec les cookies à la place de l'app.

## ✨ Fonctionnalités (Phase 1 - MVP)

- ✅ Connexion via cookie de session
- ✅ Vue de la liste de vos villes
- ✅ Détails d'une ville (ressources, constructions en cours)
- 🚧 Lancer des constructions (à venir)

## 🚀 Installation et Démarrage

### Méthode rapide (tout-en-un)

```bash
./start-dev.sh
```

### Méthode manuelle

**1. Backend (Terminal 1)**
```bash
cd backend
npm install
npm start
```

Le backend démarre sur `http://localhost:3001`

**2. Application (Terminal 2)**
```bash
npm install
npx expo start
```

Puis :
- Scannez le QR code avec Expo Go (mobile)
- Appuyez sur `w` pour ouvrir dans le navigateur (web)

## 🔐 Comment obtenir votre cookie de session

### Méthode 1 - Standard

1. Ouvrez Ikariam dans votre navigateur
2. Connectez-vous à votre compte
3. Appuyez sur `F12` pour ouvrir les outils développeur
4. Allez dans l'onglet **Console**
5. Tapez : `document.cookie`
6. Copiez **TOUT** le résultat

### Méthode 2 - Format Ikabot

Si vous utilisez déjà Ikabot, vous pouvez copier directement l'objet JSON des cookies :
```json
{"PHPSESSID": "abc123", "ikariam": "100554_...", ...}
```

**IMPORTANT :** Le cookie doit contenir `PHPSESSID`

## 🏗️ Structure du projet

```
ikamobile/
├── backend/              # Backend proxy Node.js
│   ├── src/
│   │   └── server.js     # Serveur Express
│   └── package.json
├── src/
│   ├── services/         # Services (API)
│   │   └── ikariamApi.ts # Client API Ikariam
│   ├── screens/          # Écrans de l'application
│   │   ├── LoginScreen.tsx
│   │   ├── CitiesListScreen.tsx
│   │   └── CityDetailScreen.tsx
│   ├── types/            # Types TypeScript
│   ├── constants/        # Constantes du jeu
│   ├── config/           # Configuration
│   └── utils/            # Utilitaires
└── app/                  # Routes Expo Router
```

## 🔧 Technologies utilisées

**Frontend :**
- React Native (Expo)
- TypeScript
- AsyncStorage (persistance)

**Backend :**
- Node.js
- Express
- node-fetch (requêtes HTTP)

## 🌐 Déploiement du backend

### Heroku (Gratuit)

```bash
cd backend
heroku create ikariam-mobile-proxy
git subtree push --prefix backend heroku main
```

Puis modifiez `src/config/api.ts` :
```typescript
export const PROXY_URL = 'https://ikariam-mobile-proxy.herokuapp.com';
```

### Render.com (Gratuit)

1. Créez un compte sur [Render.com](https://render.com)
2. Créez un nouveau **Web Service**
3. Pointez vers le dossier `backend`
4. Déployez !

### Vercel

Ajoutez `vercel.json` dans `backend/` :
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/server.js"
    }
  ]
}
```

## 📖 Inspiration

Ce projet s'inspire du reverse-engineering d'[Ikabot](https://github.com/Ikabot-Collective/ikabot), un bot Python pour Ikariam.

## ⚠️ Avertissements

- **Ne partagez jamais votre cookie de session** avec personne
- Cette application ne collecte aucune donnée
- La session peut expirer et nécessiter une reconnexion
- **Pas de bot** : L'application ne fait qu'afficher et interagir avec le jeu, sans automation

## 🛣️ Roadmap (Phase 2)

Fonctionnalités prévues :
- 🔨 Lancer des constructions
- 💰 Commerce (marché)
- ⚔️ Vue militaire (troupes, flottes)
- 🔬 Recherches technologiques
- 📬 Messages/diplomatie
- 🔔 Notifications push

## 📝 Licence

Ce projet est à usage personnel et éducatif uniquement.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.
