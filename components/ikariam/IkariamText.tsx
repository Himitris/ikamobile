import React from 'react';
import { Text, type TextProps, StyleSheet } from 'react-native';
import { IkariamTheme } from '@/constants/ikariamTheme';

export type IkariamTextProps = TextProps & {
  variant?: 'title' | 'heading' | 'subheading' | 'body' | 'caption' | 'label';
  color?: 'primary' | 'secondary' | 'tertiary' | 'light' | 'inverse';
  weight?: 'light' | 'regular' | 'medium' | 'semibold' | 'bold';
};

export function IkariamText({
  style,
  variant = 'body',
  color = 'primary',
  weight,
  ...rest
}: IkariamTextProps) {
  return (
    <Text
      style={[
        styles[variant],
        styles[`color_${color}`],
        weight && { fontWeight: IkariamTheme.typography.fontWeight[weight] },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  // Variants
  title: {
    fontFamily: IkariamTheme.typography.fontFamily.title,
    fontSize: IkariamTheme.typography.fontSize['4xl'],
    fontWeight: IkariamTheme.typography.fontWeight.bold,
    lineHeight: IkariamTheme.typography.fontSize['4xl'] * IkariamTheme.typography.lineHeight.tight,
    color: IkariamTheme.colors.text.primary,
  },
  heading: {
    fontFamily: IkariamTheme.typography.fontFamily.title,
    fontSize: IkariamTheme.typography.fontSize['2xl'],
    fontWeight: IkariamTheme.typography.fontWeight.bold,
    lineHeight: IkariamTheme.typography.fontSize['2xl'] * IkariamTheme.typography.lineHeight.tight,
    color: IkariamTheme.colors.text.primary,
  },
  subheading: {
    fontFamily: IkariamTheme.typography.fontFamily.title,
    fontSize: IkariamTheme.typography.fontSize.xl,
    fontWeight: IkariamTheme.typography.fontWeight.semibold,
    lineHeight: IkariamTheme.typography.fontSize.xl * IkariamTheme.typography.lineHeight.normal,
    color: IkariamTheme.colors.text.primary,
  },
  body: {
    fontFamily: IkariamTheme.typography.fontFamily.body,
    fontSize: IkariamTheme.typography.fontSize.md,
    fontWeight: IkariamTheme.typography.fontWeight.regular,
    lineHeight: IkariamTheme.typography.fontSize.md * IkariamTheme.typography.lineHeight.normal,
    color: IkariamTheme.colors.text.primary,
  },
  caption: {
    fontFamily: IkariamTheme.typography.fontFamily.body,
    fontSize: IkariamTheme.typography.fontSize.sm,
    fontWeight: IkariamTheme.typography.fontWeight.regular,
    lineHeight: IkariamTheme.typography.fontSize.sm * IkariamTheme.typography.lineHeight.normal,
    color: IkariamTheme.colors.text.secondary,
  },
  label: {
    fontFamily: IkariamTheme.typography.fontFamily.body,
    fontSize: IkariamTheme.typography.fontSize.sm,
    fontWeight: IkariamTheme.typography.fontWeight.semibold,
    lineHeight: IkariamTheme.typography.fontSize.sm * IkariamTheme.typography.lineHeight.normal,
    color: IkariamTheme.colors.text.primary,
  },

  // Colors
  color_primary: {
    color: IkariamTheme.colors.text.primary,
  },
  color_secondary: {
    color: IkariamTheme.colors.text.secondary,
  },
  color_tertiary: {
    color: IkariamTheme.colors.text.tertiary,
  },
  color_light: {
    color: IkariamTheme.colors.text.light,
  },
  color_inverse: {
    color: IkariamTheme.colors.text.inverse,
  },
});
