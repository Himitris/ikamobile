# Ikariam Mobile App

Application mobile React Native / Expo pour jouer à Ikariam depuis votre téléphone.

## 📱 Description

Cette application permet de gérer vos villes Ikariam en déplacement, sans fonctionnalités de bot/automation. Elle reproduit uniquement ce qu'un joueur ferait manuellement.

## ✨ Fonctionnalités (Phase 1 - MVP)

- ✅ Connexion via cookie de session
- ✅ Vue de la liste de vos villes
- ✅ Détails d'une ville (ressources, constructions en cours)
- 🚧 Lancer des constructions (à venir)

## 🚀 Installation

### Prérequis

- Node.js (version 18 ou supérieure)
- npm ou yarn
- Expo CLI
- Un téléphone ou émulateur Android/iOS

### Étapes

1. Installer les dépendances :
```bash
npm install
```

2. Lancer l'application :
```bash
npx expo start
```

3. Scanner le QR code avec l'application Expo Go (iOS/Android)

## 🔐 Comment obtenir votre cookie de session

### Méthode Chrome/Edge

1. Ouvrez Ikariam dans votre navigateur
2. Connectez-vous à votre compte
3. Appuyez sur `F12` pour ouvrir les outils de développement
4. Allez dans l'onglet **Application** (ou **Storage**)
5. Dans le menu de gauche, cliquez sur **Cookies** puis sur le site Ikariam
6. Copiez tous les cookies au format : `name=value; name2=value2; ...`

### Méthode Firefox

1. Ouvrez Ikariam dans Firefox
2. Connectez-vous à votre compte
3. Appuyez sur `F12` pour ouvrir les outils de développement
4. Allez dans l'onglet **Stockage**
5. Cliquez sur **Cookies** puis sur le site Ikariam
6. Copiez tous les cookies

### Format du cookie

Le cookie doit ressembler à ceci :
```
ikariam=abc123def456; PHPSESSID=xyz789; lang=fr; ...
```

### Serveur

Le nom du serveur suit ce format :
- `s1-fr` pour le serveur 1 français
- `s42-de` pour le serveur 42 allemand
- `s100-en` pour le serveur 100 anglais

## 🏗️ Architecture du projet

```
ikamobile/
├── src/
│   ├── services/          # Services (API, stockage)
│   │   ├── ikariamApi.ts  # Client API Ikariam
│   │   └── storage.ts     # Stockage local
│   ├── screens/           # Écrans de l'application
│   │   ├── LoginScreen.tsx
│   │   ├── CitiesListScreen.tsx
│   │   └── CityDetailScreen.tsx
│   ├── types/             # Types TypeScript
│   │   └── index.ts
│   ├── constants/         # Constantes du jeu
│   │   └── game.ts
│   └── App.tsx            # Composant principal
└── app/                   # Routes Expo Router
```

## 🔧 Technologies utilisées

- **React Native** : Framework mobile
- **Expo** : Outils de développement et build
- **TypeScript** : Typage statique
- **Axios** : Client HTTP
- **AsyncStorage** : Stockage persistant

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

## 📧 Support

Pour toute question ou problème, ouvrez une issue sur GitHub.
