import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSession } from '@/src/contexts/SessionContext';
import { IkariamText, IkariamCard, IkariamButton } from '@/components/ikariam';
import { IkariamTheme } from '@/constants/ikariamTheme';
import { router } from 'expo-router';

export default function ProfileTab() {
  const { session, logout } = useSession();

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <IkariamText variant="title" style={styles.title}>
          Profil
        </IkariamText>
      </View>

      <IkariamCard style={styles.card}>
        <IkariamText variant="subheading" style={styles.sectionTitle}>
          Informations de session
        </IkariamText>
        <View style={styles.infoRow}>
          <IkariamText variant="caption" color="secondary">
            Serveur:
          </IkariamText>
          <IkariamText variant="body" weight="semibold">
            {session?.server || 'N/A'}
          </IkariamText>
        </View>
        <View style={styles.infoRow}>
          <IkariamText variant="caption" color="secondary">
            Statut:
          </IkariamText>
          <IkariamText variant="body" weight="semibold" style={{ color: IkariamTheme.colors.success }}>
            Connecté
          </IkariamText>
        </View>
      </IkariamCard>

      <IkariamCard style={styles.card}>
        <IkariamText variant="subheading" style={styles.sectionTitle}>
          À propos
        </IkariamText>
        <IkariamText variant="body" color="secondary" style={styles.aboutText}>
          Ikariam Mobile vous permet de gérer vos villes depuis votre appareil mobile.
        </IkariamText>
        <IkariamText variant="caption" color="tertiary" style={styles.version}>
          Version 1.0.0
        </IkariamText>
      </IkariamCard>

      <View style={styles.actions}>
        <IkariamButton
          title="Déconnexion"
          onPress={handleLogout}
          variant="warning"
          size="lg"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IkariamTheme.colors.background.primary,
  },
  content: {
    padding: IkariamTheme.spacing.base,
  },
  header: {
    paddingVertical: IkariamTheme.spacing.xl,
    paddingTop: IkariamTheme.spacing['4xl'],
    alignItems: 'center',
  },
  title: {
    color: IkariamTheme.colors.wood.dark,
  },
  card: {
    marginBottom: IkariamTheme.spacing.base,
  },
  sectionTitle: {
    marginBottom: IkariamTheme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: IkariamTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: IkariamTheme.colors.border.light,
  },
  aboutText: {
    lineHeight: 22,
    marginBottom: IkariamTheme.spacing.md,
  },
  version: {
    textAlign: 'center',
  },
  actions: {
    marginTop: IkariamTheme.spacing.xl,
    marginBottom: IkariamTheme.spacing['4xl'],
  },
});
