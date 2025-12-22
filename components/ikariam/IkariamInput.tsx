import React from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  StyleProp,
} from 'react-native';
import { IkariamTheme } from '@/constants/ikariamTheme';

interface IkariamInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export function IkariamInput({
  label,
  error,
  containerStyle,
  inputStyle,
  ...textInputProps
}: IkariamInputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.input_error, inputStyle]}
        placeholderTextColor={IkariamTheme.colors.text.tertiary}
        {...textInputProps}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: IkariamTheme.spacing.md,
  },
  label: {
    fontSize: IkariamTheme.typography.fontSize.sm,
    fontFamily: IkariamTheme.typography.fontFamily.body,
    fontWeight: IkariamTheme.typography.fontWeight.semibold,
    color: IkariamTheme.colors.text.primary,
    marginBottom: IkariamTheme.spacing.sm,
  },
  input: {
    backgroundColor: IkariamTheme.components.input.backgroundColor,
    borderColor: IkariamTheme.components.input.borderColor,
    borderWidth: IkariamTheme.components.input.borderWidth,
    borderRadius: IkariamTheme.components.input.borderRadius,
    padding: IkariamTheme.components.input.padding,
    color: IkariamTheme.components.input.color,
    fontSize: IkariamTheme.typography.fontSize.md,
    fontFamily: IkariamTheme.typography.fontFamily.body,
    ...IkariamTheme.shadows.sm,
  },
  input_error: {
    borderColor: IkariamTheme.colors.error,
    borderWidth: 2,
  },
  error: {
    fontSize: IkariamTheme.typography.fontSize.sm,
    fontFamily: IkariamTheme.typography.fontFamily.body,
    color: IkariamTheme.colors.error,
    marginTop: IkariamTheme.spacing.xs,
  },
});
