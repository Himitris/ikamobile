import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { IkariamTheme } from '@/constants/ikariamTheme';

interface IkariamCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'highlighted' | 'dark';
}

export function IkariamCard({
  children,
  style,
  variant = 'default'
}: IkariamCardProps) {
  const cardStyle = [
    styles.card,
    variant === 'highlighted' && styles.highlighted,
    variant === 'dark' && styles.dark,
    style,
  ];

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: IkariamTheme.colors.parchment.light,
    borderWidth: 2,
    borderColor: IkariamTheme.colors.wood.base,
    borderRadius: IkariamTheme.borderRadius.md,
    padding: IkariamTheme.spacing.base,
    ...IkariamTheme.shadows.md,
  },
  highlighted: {
    backgroundColor: IkariamTheme.colors.gold.light,
    borderColor: IkariamTheme.colors.gold.dark,
    borderWidth: 3,
  },
  dark: {
    backgroundColor: IkariamTheme.colors.wood.dark,
    borderColor: IkariamTheme.colors.wood.darkest,
  },
});
