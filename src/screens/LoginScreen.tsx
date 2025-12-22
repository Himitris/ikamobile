import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { ikariamApi } from '../services/ikariamApi';
import { storageService } from '../services/storage';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [cookie, setCookie] = useState('');
  const [server, setServer] = useState('s1-fr');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!cookie.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre cookie de session');
      return;
    }

    if (!server.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le nom du serveur');
      return;
    }

    setLoading(true);

    try {
      const result = await ikariamApi.initSession(cookie, server);

      if (result.success && result.data) {
        // Sauvegarde la session
        await storageService.saveSession(result.data);

        Alert.alert('Succès', 'Connexion réussie !', [
          {
            text: 'OK',
            onPress: onLoginSuccess,
          },
        ]);
      } else {
        Alert.alert('Erreur', result.error || 'Échec de la connexion');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Ikariam Mobile</Text>
        <Text style={styles.subtitle}>Connexion</Text>

        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsTitle}>Comment obtenir votre cookie ?</Text>
          <Text style={styles.instructionsText}>
            <Text style={styles.bold}>Méthode 1 - Standard :{'\n'}</Text>
            1. Ouvrez Ikariam dans votre navigateur{'\n'}
            2. Connectez-vous à votre compte{'\n'}
            3. F12 → Console → Tapez: document.cookie{'\n'}
            4. Copiez TOUT le résultat{'\n'}
            {'\n'}
            <Text style={styles.bold}>Méthode 2 - Format Ikabot :{'\n'}</Text>
            Collez directement l'objet JSON d'Ikabot{'\n'}
            Ex: {'{'}&#34;PHPSESSID&#34;: &#34;abc123&#34;, &#34;ikariam&#34;: &#34;...&#34;{'}'}
            {'\n'}
            {'\n'}
            ⚠️ IMPORTANT: Doit contenir PHPSESSID
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Serveur</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: s1-fr, s42-de, s100-en"
            value={server}
            onChangeText={setServer}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Cookie de session</Text>
          <TextInput
            style={[styles.input, styles.cookieInput]}
            placeholder="Collez votre cookie ici..."
            value={cookie}
            onChangeText={setCookie}
            multiline
            numberOfLines={4}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Se connecter</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            ⚠️ Attention : Ne partagez jamais votre cookie de session avec personne.
            Cette application ne collecte aucune donnée.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 30,
  },
  instructionsBox: {
    backgroundColor: '#e8f4f8',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 22,
  },
  bold: {
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  form: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 20,
  },
  cookieInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#95a5a6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  warningText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 20,
  },
});
