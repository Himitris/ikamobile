import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useSession } from '../contexts/SessionContext';
import { IkariamText, IkariamCard, IkariamButton, IkariamInput } from '@/components/ikariam';
import { IkariamTheme } from '@/constants/ikariamTheme';

interface LoginScreenProps {
  onLoginSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [cookie, setCookie] = useState('');
  const [server, setServer] = useState('s67-fr');
  const [loading, setLoading] = useState(false);
  const { login } = useSession();

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
      const result = await login(cookie, server);

      if (result.success) {
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
        <IkariamText variant="title" style={styles.title}>
          Ikariam Mobile
        </IkariamText>
        <IkariamText variant="subheading" color="secondary" style={styles.subtitle}>
          Connexion à votre empire
        </IkariamText>

        <IkariamCard variant="highlighted" style={styles.instructionsCard}>
          <IkariamText variant="subheading" style={styles.instructionsTitle}>
            Comment obtenir votre cookie ?
          </IkariamText>
          <IkariamText variant="caption" color="secondary" style={styles.instructionsText}>
            <IkariamText variant="caption" weight="bold">
              Méthode 1 - Standard :{'\n'}
            </IkariamText>
            1. Ouvrez Ikariam dans votre navigateur{'\n'}
            2. Connectez-vous à votre compte{'\n'}
            3. F12 → Console → Tapez: document.cookie{'\n'}
            4. Copiez TOUT le résultat{'\n'}
            {'\n'}
            <IkariamText variant="caption" weight="bold">
              Méthode 2 - Format Ikabot :{'\n'}
            </IkariamText>
            Collez directement l'objet JSON d'Ikabot{'\n'}
            Ex: {'{'}&#34;PHPSESSID&#34;: &#34;abc123&#34;, &#34;ikariam&#34;: &#34;...&#34;{'}'}
            {'\n'}
            {'\n'}
            ⚠️ IMPORTANT: Doit contenir PHPSESSID
          </IkariamText>
        </IkariamCard>

        <View style={styles.form}>
          <IkariamInput
            label="Serveur"
            placeholder="Ex: s1-fr, s42-de, s100-en"
            value={server}
            onChangeText={setServer}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <IkariamInput
            label="Cookie de session"
            placeholder="Collez votre cookie ici..."
            value={cookie}
            onChangeText={setCookie}
            multiline
            numberOfLines={4}
            autoCapitalize="none"
            autoCorrect={false}
            inputStyle={styles.cookieInput}
          />

          <IkariamButton
            title="Se connecter"
            onPress={handleLogin}
            variant="primary"
            size="lg"
            loading={loading}
            disabled={loading}
          />
        </View>

        <IkariamCard variant="default" style={styles.warningCard}>
          <IkariamText variant="caption" color="secondary" style={styles.warningText}>
            ⚠️ Attention : Ne partagez jamais votre cookie de session avec personne.
            Cette application ne collecte aucune donnée.
          </IkariamText>
        </IkariamCard>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: IkariamTheme.colors.background.primary,
  },
  content: {
    flex: 1,
    padding: IkariamTheme.spacing.lg,
    paddingTop: IkariamTheme.spacing['5xl'],
  },
  title: {
    textAlign: 'center',
    marginBottom: IkariamTheme.spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: IkariamTheme.spacing.xl,
  },
  instructionsCard: {
    marginBottom: IkariamTheme.spacing.lg,
  },
  instructionsTitle: {
    marginBottom: IkariamTheme.spacing.md,
  },
  instructionsText: {
    lineHeight: IkariamTheme.typography.fontSize.sm * IkariamTheme.typography.lineHeight.relaxed,
  },
  form: {
    marginBottom: IkariamTheme.spacing.lg,
  },
  cookieInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  warningCard: {
    backgroundColor: IkariamTheme.colors.gold.light,
    borderColor: IkariamTheme.colors.gold.dark,
    borderLeftWidth: 4,
  },
  warningText: {
    lineHeight: IkariamTheme.typography.fontSize.sm * IkariamTheme.typography.lineHeight.normal,
  },
});
