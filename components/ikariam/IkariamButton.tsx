import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  StyleProp,
} from 'react-native';
import { IkariamTheme } from '@/constants/ikariamTheme';

interface IkariamButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function IkariamButton({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: IkariamButtonProps) {
  const buttonStyles = [
    styles.button,
    styles[`button_${size}`],
    styles[`button_${variant}`],
    disabled && styles.button_disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${size}`],
    styles[`text_${variant}`],
    disabled && styles.text_disabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={IkariamTheme.colors.text.inverse}
          size="small"
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: IkariamTheme.borderRadius.base,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...IkariamTheme.shadows.base,
  },

  // Sizes
  button_sm: {
    paddingVertical: IkariamTheme.spacing.sm,
    paddingHorizontal: IkariamTheme.spacing.md,
  },
  button_md: {
    paddingVertical: IkariamTheme.spacing.md,
    paddingHorizontal: IkariamTheme.spacing.lg,
  },
  button_lg: {
    paddingVertical: IkariamTheme.spacing.base,
    paddingHorizontal: IkariamTheme.spacing.xl,
  },

  // Variants
  button_primary: {
    backgroundColor: IkariamTheme.components.button.primary.backgroundColor,
    borderColor: IkariamTheme.components.button.primary.borderColor,
  },
  button_secondary: {
    backgroundColor: IkariamTheme.components.button.secondary.backgroundColor,
    borderColor: IkariamTheme.components.button.secondary.borderColor,
  },
  button_success: {
    backgroundColor: IkariamTheme.components.button.success.backgroundColor,
    borderColor: IkariamTheme.components.button.success.borderColor,
  },
  button_warning: {
    backgroundColor: IkariamTheme.components.button.warning.backgroundColor,
    borderColor: IkariamTheme.components.button.warning.borderColor,
  },
  button_danger: {
    backgroundColor: IkariamTheme.components.button.danger.backgroundColor,
    borderColor: IkariamTheme.components.button.danger.borderColor,
  },
  button_disabled: {
    backgroundColor: IkariamTheme.colors.stone.light,
    borderColor: IkariamTheme.colors.stone.base,
    opacity: 0.6,
  },

  // Text styles
  text: {
    fontFamily: IkariamTheme.typography.fontFamily.body,
    fontWeight: IkariamTheme.typography.fontWeight.semibold,
    textAlign: 'center',
  },
  text_sm: {
    fontSize: IkariamTheme.typography.fontSize.sm,
  },
  text_md: {
    fontSize: IkariamTheme.typography.fontSize.md,
  },
  text_lg: {
    fontSize: IkariamTheme.typography.fontSize.lg,
  },
  text_primary: {
    color: IkariamTheme.components.button.primary.textColor,
  },
  text_secondary: {
    color: IkariamTheme.components.button.secondary.textColor,
  },
  text_success: {
    color: IkariamTheme.components.button.success.textColor,
  },
  text_warning: {
    color: IkariamTheme.components.button.warning.textColor,
  },
  text_danger: {
    color: IkariamTheme.components.button.danger.textColor,
  },
  text_disabled: {
    color: IkariamTheme.colors.text.tertiary,
  },
});
