import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { IkariamTheme } from '@/constants/ikariamTheme';

interface IkariamBadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function IkariamBadge({
  label,
  variant = 'default',
  size = 'md',
  style,
  textStyle,
}: IkariamBadgeProps) {
  const badgeStyles = [
    styles.badge,
    styles[`badge_${size}`],
    styles[`badge_${variant}`],
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${size}`],
    styles[`text_${variant}`],
    textStyle,
  ];

  return (
    <View style={badgeStyles}>
      <Text style={textStyles}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: IkariamTheme.borderRadius.base,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    ...IkariamTheme.shadows.sm,
  },

  // Sizes
  badge_sm: {
    paddingVertical: IkariamTheme.spacing.xs,
    paddingHorizontal: IkariamTheme.spacing.sm,
  },
  badge_md: {
    paddingVertical: IkariamTheme.spacing.sm,
    paddingHorizontal: IkariamTheme.spacing.md,
  },
  badge_lg: {
    paddingVertical: IkariamTheme.spacing.md,
    paddingHorizontal: IkariamTheme.spacing.base,
  },

  // Variants
  badge_default: {
    backgroundColor: IkariamTheme.colors.gold.light,
    borderColor: IkariamTheme.colors.gold.dark,
  },
  badge_success: {
    backgroundColor: IkariamTheme.colors.success,
    borderColor: '#556B2F',
  },
  badge_warning: {
    backgroundColor: IkariamTheme.colors.warning,
    borderColor: IkariamTheme.colors.gold.dark,
  },
  badge_error: {
    backgroundColor: IkariamTheme.colors.error,
    borderColor: '#A0522D',
  },
  badge_info: {
    backgroundColor: IkariamTheme.colors.mediterranean.light,
    borderColor: IkariamTheme.colors.mediterranean.dark,
  },

  // Text styles
  text: {
    fontFamily: IkariamTheme.typography.fontFamily.body,
    fontWeight: IkariamTheme.typography.fontWeight.semibold,
  },
  text_sm: {
    fontSize: IkariamTheme.typography.fontSize.xs,
  },
  text_md: {
    fontSize: IkariamTheme.typography.fontSize.sm,
  },
  text_lg: {
    fontSize: IkariamTheme.typography.fontSize.base,
  },
  text_default: {
    color: IkariamTheme.colors.text.primary,
  },
  text_success: {
    color: IkariamTheme.colors.text.inverse,
  },
  text_warning: {
    color: IkariamTheme.colors.text.primary,
  },
  text_error: {
    color: IkariamTheme.colors.text.inverse,
  },
  text_info: {
    color: IkariamTheme.colors.text.inverse,
  },
});
