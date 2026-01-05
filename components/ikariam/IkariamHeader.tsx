import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, TouchableOpacity } from 'react-native';
import { IkariamTheme } from '@/constants/ikariamTheme';
import { IkariamText } from './IkariamText';

interface IkariamHeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: {
    icon: string;
    onPress: () => void;
  };
  rightAction?: {
    icon?: string;
    label?: string;
    onPress: () => void;
  };
  variant?: 'default' | 'compact' | 'decorated';
  style?: StyleProp<ViewStyle>;
}

export function IkariamHeader({
  title,
  subtitle,
  leftAction,
  rightAction,
  variant = 'default',
  style,
}: IkariamHeaderProps) {
  const isDecorated = variant === 'decorated';
  const isCompact = variant === 'compact';

  return (
    <View style={[styles.container, isCompact && styles.containerCompact, style]}>
      {/* Decorative top border */}
      {isDecorated && (
        <View style={styles.decorativeBorder}>
          <View style={styles.decorativeCorner} />
          <View style={styles.decorativeLine} />
          <View style={styles.decorativeCenter}>
            <View style={styles.decorativeOrnament} />
          </View>
          <View style={styles.decorativeLine} />
          <View style={styles.decorativeCorner} />
        </View>
      )}

      {/* Main header content */}
      <View style={[styles.content, isCompact && styles.contentCompact]}>
        {/* Left action */}
        {leftAction && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={leftAction.onPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IkariamText variant="heading" color="light" style={styles.actionIcon}>
              {leftAction.icon}
            </IkariamText>
          </TouchableOpacity>
        )}

        {/* Title section */}
        <View style={styles.titleSection}>
          <IkariamText
            variant={isCompact ? 'subheading' : 'heading'}
            color="light"
            style={styles.title}
            numberOfLines={1}
          >
            {title}
          </IkariamText>
          {subtitle && (
            <IkariamText variant="caption" color="light" style={styles.subtitle}>
              {subtitle}
            </IkariamText>
          )}
        </View>

        {/* Right action */}
        {rightAction && (
          <TouchableOpacity
            style={[styles.actionButton, styles.rightActionButton]}
            onPress={rightAction.onPress}
          >
            {rightAction.icon && (
              <IkariamText variant="body" color="light" style={styles.actionIcon}>
                {rightAction.icon}
              </IkariamText>
            )}
            {rightAction.label && (
              <IkariamText variant="caption" color="light">
                {rightAction.label}
              </IkariamText>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Decorative bottom border */}
      {isDecorated && (
        <View style={styles.decorativeBorderBottom}>
          <View style={styles.borderGradient} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: IkariamTheme.colors.wood.dark,
    paddingTop: IkariamTheme.spacing['5xl'],
    borderBottomWidth: 3,
    borderBottomColor: IkariamTheme.colors.wood.darkest,
    ...IkariamTheme.shadows.lg,
  },
  containerCompact: {
    paddingTop: IkariamTheme.spacing['4xl'],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IkariamTheme.spacing.base,
    paddingBottom: IkariamTheme.spacing.base,
  },
  contentCompact: {
    paddingBottom: IkariamTheme.spacing.sm,
  },
  titleSection: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    opacity: 0.8,
    marginTop: 2,
  },
  actionButton: {
    padding: IkariamTheme.spacing.sm,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightActionButton: {
    backgroundColor: IkariamTheme.colors.wood.darkest,
    borderRadius: IkariamTheme.borderRadius.base,
    borderWidth: 1,
    borderColor: IkariamTheme.colors.wood.base,
    paddingHorizontal: IkariamTheme.spacing.md,
    paddingVertical: IkariamTheme.spacing.sm,
  },
  actionIcon: {
    fontSize: 20,
  },

  // Decorative elements
  decorativeBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IkariamTheme.spacing.sm,
    marginBottom: IkariamTheme.spacing.sm,
  },
  decorativeCorner: {
    width: 12,
    height: 12,
    borderWidth: 2,
    borderColor: IkariamTheme.colors.gold.base,
    borderRadius: 2,
    backgroundColor: IkariamTheme.colors.wood.dark,
    transform: [{ rotate: '45deg' }],
  },
  decorativeLine: {
    flex: 1,
    height: 2,
    backgroundColor: IkariamTheme.colors.gold.base,
    marginHorizontal: IkariamTheme.spacing.xs,
  },
  decorativeCenter: {
    padding: IkariamTheme.spacing.xs,
  },
  decorativeOrnament: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: IkariamTheme.colors.gold.base,
    borderRadius: 10,
    backgroundColor: IkariamTheme.colors.gold.light,
  },
  decorativeBorderBottom: {
    height: 4,
    backgroundColor: IkariamTheme.colors.wood.darkest,
  },
  borderGradient: {
    flex: 1,
    height: 2,
    backgroundColor: IkariamTheme.colors.gold.dark,
    marginHorizontal: IkariamTheme.spacing['2xl'],
  },
});
