# Backend Proxy Ikariam Mobile

Backend Node.js qui sert de proxy entre l'application mobile et Ikariam.

## Pourquoi ce proxy ?

React Native ne permet pas de définir manuellement le header `Cookie` pour des raisons de sécurité. Ce backend contourne cette limitation en :
1. Recevant les cookies de l'app mobile
2. Effectuant les requêtes vers Ikariam avec ces cookies
3. Renvoyant les réponses à l'app

## Installation

```bash
cd backend
npm install
```

## Lancement

### Développement
```bash
npm run dev
```

### Production
```bash
npm start
```

Le serveur démarre sur `http://localhost:3001` par défaut.

## Endpoints

### POST /api/proxy
Proxy toutes les requêtes vers Ikariam.

**Body:**
```json
{
  "url": "https://s67-fr.ikariam.gameforge.com/index.php?view=city",
  "cookies": "PHPSESSID=abc123; ikariam=...",
  "method": "GET",
  "body": null
}
```

**Response:**
```json
{
  "success": true,
  "data": "<html>...</html>",
  "status": 200,
  "cookies": null
}
```

### GET /api/health
Vérifie que le serveur fonctionne.

## Variables d'environnement

- `PORT` : Port du serveur (défaut: 3001)

## Déploiement

### Heroku
```bash
heroku create ikariam-mobile-proxy
git subtree push --prefix backend heroku main
```

### Vercel
Ajouter `vercel.json` à la racine du backend.

### Render.com
Créer un nouveau Web Service et pointer vers le dossier `backend`.
