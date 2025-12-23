import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { IkariamTheme } from '@/constants/ikariamTheme';
import { useSession } from '@/src/contexts/SessionContext';

export default function TabLayout() {
  const { isAuthenticated } = useSession();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: IkariamTheme.colors.gold.base,
        tabBarInactiveTintColor: IkariamTheme.colors.wood.light,
        tabBarStyle: {
          backgroundColor: IkariamTheme.colors.wood.dark,
          borderTopColor: IkariamTheme.colors.wood.darkest,
          borderTopWidth: 2,
          height: Platform.OS === 'ios' ? 88 : 60,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        },
        tabBarLabelStyle: {
          fontFamily: Platform.select({
            ios: 'ui-serif',
            android: 'serif',
            default: 'serif',
          }),
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Connexion',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.circle.fill" color={color} />
          ),
          href: isAuthenticated ? null : '/(tabs)',
        }}
      />
      <Tabs.Screen
        name="cities"
        options={{
          title: 'Villes',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="building.2.fill" color={color} />
          ),
          href: isAuthenticated ? '/(tabs)/cities' : null,
        }}
      />
      <Tabs.Screen
        name="buildings"
        options={{
          title: 'Bâtiments',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="hammer.fill" color={color} />
          ),
          href: isAuthenticated ? '/(tabs)/buildings' : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="gearshape.fill" color={color} />
          ),
          href: isAuthenticated ? '/(tabs)/profile' : null,
        }}
      />
    </Tabs>
  );
}
