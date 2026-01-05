import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Animated } from 'react-native';
import { IkariamTheme } from '@/constants/ikariamTheme';
import { IkariamText } from './IkariamText';

type ResourceType = 'wood' | 'wine' | 'marble' | 'crystal' | 'sulfur' | 'gold' | 'citizens' | 'default';

interface IkariamProgressBarProps {
  value: number;
  maxValue: number;
  label?: string;
  icon?: string;
  resourceType?: ResourceType;
  showPercentage?: boolean;
  showValues?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}

const RESOURCE_COLORS: Record<ResourceType, { fill: string; bg: string; border: string }> = {
  wood: {
    fill: IkariamTheme.colors.wood.base,
    bg: IkariamTheme.colors.wood.light + '40',
    border: IkariamTheme.colors.wood.dark,
  },
  wine: {
    fill: '#8B2252',
    bg: '#8B225240',
    border: '#6B1242',
  },
  marble: {
    fill: '#C8C5C0',
    bg: '#E8E6E340',
    border: '#8B8680',
  },
  crystal: {
    fill: '#5B9FC7',
    bg: '#87CEEB40',
    border: '#2C5F7F',
  },
  sulfur: {
    fill: '#D4AF37',
    bg: '#FFD70040',
    border: '#B8860B',
  },
  gold: {
    fill: IkariamTheme.colors.gold.base,
    bg: IkariamTheme.colors.gold.light + '40',
    border: IkariamTheme.colors.gold.dark,
  },
  citizens: {
    fill: IkariamTheme.colors.mediterranean.base,
    bg: IkariamTheme.colors.mediterranean.light + '40',
    border: IkariamTheme.colors.mediterranean.dark,
  },
  default: {
    fill: IkariamTheme.colors.bronze.base,
    bg: IkariamTheme.colors.bronze.light + '40',
    border: IkariamTheme.colors.bronze.dark,
  },
};

const RESOURCE_ICONS: Record<ResourceType, string> = {
  wood: '🪵',
  wine: '🍷',
  marble: '⚪',
  crystal: '💎',
  sulfur: '⚠️',
  gold: '💰',
  citizens: '👥',
  default: '📊',
};

export function IkariamProgressBar({
  value,
  maxValue,
  label,
  icon,
  resourceType = 'default',
  showPercentage = false,
  showValues = true,
  size = 'md',
  style,
}: IkariamProgressBarProps) {
  const percentage = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;
  const colors = RESOURCE_COLORS[resourceType];
  const displayIcon = icon || RESOURCE_ICONS[resourceType];

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString('fr-FR');
  };

  const getWarningState = (): 'normal' | 'warning' | 'critical' => {
    if (percentage >= 90) return 'critical';
    if (percentage >= 75) return 'warning';
    return 'normal';
  };

  const warningState = getWarningState();

  return (
    <View style={[styles.container, styles[`container_${size}`], style]}>
      {/* Header with icon and label */}
      <View style={styles.header}>
        <View style={styles.labelSection}>
          {displayIcon && (
            <IkariamText variant="body" style={[styles.icon, styles[`icon_${size}`]]}>
              {displayIcon}
            </IkariamText>
          )}
          {label && (
            <IkariamText
              variant={size === 'sm' ? 'caption' : 'body'}
              weight="semibold"
              style={styles.label}
            >
              {label}
            </IkariamText>
          )}
        </View>

        {showValues && (
          <IkariamText
            variant="caption"
            color={warningState === 'critical' ? 'primary' : 'secondary'}
            weight={warningState === 'critical' ? 'bold' : 'regular'}
          >
            {formatNumber(value)} / {formatNumber(maxValue)}
          </IkariamText>
        )}
      </View>

      {/* Progress bar */}
      <View
        style={[
          styles.barContainer,
          styles[`barContainer_${size}`],
          { backgroundColor: colors.bg, borderColor: colors.border },
        ]}
      >
        <View
          style={[
            styles.barFill,
            {
              width: `${percentage}%`,
              backgroundColor: warningState === 'critical'
                ? IkariamTheme.colors.error
                : warningState === 'warning'
                  ? IkariamTheme.colors.warning
                  : colors.fill,
            },
          ]}
        />

        {/* Decorative marks */}
        <View style={styles.marksContainer}>
          {[25, 50, 75].map((mark) => (
            <View
              key={mark}
              style={[
                styles.mark,
                { left: `${mark}%` },
                percentage >= mark && styles.markFilled,
              ]}
            />
          ))}
        </View>

        {/* Percentage overlay */}
        {showPercentage && (
          <View style={styles.percentageOverlay}>
            <IkariamText
              variant="caption"
              weight="bold"
              style={styles.percentageText}
            >
              {Math.round(percentage)}%
            </IkariamText>
          </View>
        )}
      </View>

      {/* Warning indicator */}
      {warningState !== 'normal' && (
        <View style={styles.warningIndicator}>
          <IkariamText
            variant="caption"
            style={[
              styles.warningText,
              warningState === 'critical' && styles.warningTextCritical,
            ]}
          >
            {warningState === 'critical' ? '⚠️ Presque plein!' : '⚠️ Bientôt plein'}
          </IkariamText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: IkariamTheme.spacing.sm,
  },
  container_sm: {
    marginBottom: IkariamTheme.spacing.xs,
  },
  container_md: {
    marginBottom: IkariamTheme.spacing.sm,
  },
  container_lg: {
    marginBottom: IkariamTheme.spacing.base,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: IkariamTheme.spacing.xs,
  },
  labelSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IkariamTheme.spacing.xs,
  },
  icon: {
    fontSize: 16,
  },
  icon_sm: {
    fontSize: 12,
  },
  icon_md: {
    fontSize: 16,
  },
  icon_lg: {
    fontSize: 20,
  },
  label: {
    color: IkariamTheme.colors.text.primary,
  },
  barContainer: {
    borderRadius: IkariamTheme.borderRadius.base,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  barContainer_sm: {
    height: 12,
  },
  barContainer_md: {
    height: 18,
  },
  barContainer_lg: {
    height: 24,
  },
  barFill: {
    height: '100%',
    borderRadius: IkariamTheme.borderRadius.sm,
  },
  marksContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mark: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  markFilled: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  percentageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    color: IkariamTheme.colors.text.light,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
    fontSize: 10,
  },
  warningIndicator: {
    marginTop: IkariamTheme.spacing.xs,
  },
  warningText: {
    color: IkariamTheme.colors.warning,
    fontSize: 10,
  },
  warningTextCritical: {
    color: IkariamTheme.colors.error,
    fontWeight: IkariamTheme.typography.fontWeight.bold,
  },
});
