#!/bin/bash

# Script pour démarrer le backend et l'app en développement

echo "🚀 Démarrage du backend proxy..."
cd backend
npm install > /dev/null 2>&1 &
npm start &
BACKEND_PID=$!

# Attendre que le backend démarre
echo "⏳ Attente du démarrage du backend..."
sleep 3

cd ..
echo "📱 Démarrage de l'application Expo..."
npx expo start

# Nettoyage à la sortie
trap "kill $BACKEND_PID" EXIT
