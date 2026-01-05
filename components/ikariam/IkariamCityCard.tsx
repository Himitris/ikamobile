import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { IkariamTheme } from '@/constants/ikariamTheme';
import { IkariamText } from './IkariamText';
import { IkariamBadge } from './IkariamBadge';

interface CityData {
  id: string;
  name: string;
  x: number;
  y: number;
  isCapital?: boolean;
  buildingsCount?: number;
  populationPercentage?: number;
  hasConstruction?: boolean;
  specialResource?: 'wine' | 'marble' | 'crystal' | 'sulfur';
}

interface IkariamCityCardProps {
  city: CityData;
  onPress: () => void;
  isSelected?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  style?: StyleProp<ViewStyle>;
}

const RESOURCE_DISPLAY = {
  wine: { icon: '🍷', label: 'Vin', color: '#8B2252' },
  marble: { icon: '⚪', label: 'Marbre', color: '#C8C5C0' },
  crystal: { icon: '💎', label: 'Cristal', color: '#5B9FC7' },
  sulfur: { icon: '⚠️', label: 'Soufre', color: '#D4AF37' },
};

export function IkariamCityCard({
  city,
  onPress,
  isSelected = false,
  variant = 'default',
  style,
}: IkariamCityCardProps) {
  const resource = city.specialResource ? RESOURCE_DISPLAY[city.specialResource] : null;

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={[styles.compactContainer, isSelected && styles.compactSelected, style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.compactContent}>
          {city.isCapital && (
            <IkariamText variant="body" style={styles.capitalIcon}>
              👑
            </IkariamText>
          )}
          <IkariamText
            variant="body"
            weight={isSelected ? 'bold' : 'regular'}
            numberOfLines={1}
            style={styles.compactName}
          >
            {city.name}
          </IkariamText>
          <IkariamText variant="caption" color="secondary">
            [{city.x}:{city.y}]
          </IkariamText>
        </View>
        {city.hasConstruction && (
          <View style={styles.constructionDot} />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.containerSelected, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Decorative corner elements */}
      <View style={[styles.corner, styles.cornerTopLeft]} />
      <View style={[styles.corner, styles.cornerTopRight]} />
      <View style={[styles.corner, styles.cornerBottomLeft]} />
      <View style={[styles.corner, styles.cornerBottomRight]} />

      {/* Header with name and badges */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {city.isCapital && (
            <View style={styles.capitalBadge}>
              <IkariamText variant="body" style={styles.capitalIconLarge}>
                👑
              </IkariamText>
            </View>
          )}
          <IkariamText
            variant="heading"
            numberOfLines={1}
            style={styles.cityName}
          >
            {city.name}
          </IkariamText>
        </View>
        <IkariamBadge
          label={`[${city.x}:${city.y}]`}
          variant="info"
          size="sm"
        />
      </View>

      {/* City info section */}
      <View style={styles.infoSection}>
        {/* ID and basic info */}
        <View style={styles.infoRow}>
          <IkariamText variant="caption" color="tertiary">
            ID: {city.id}
          </IkariamText>
          {city.buildingsCount !== undefined && (
            <View style={styles.infoItem}>
              <IkariamText variant="caption" style={styles.infoIcon}>
                🏗️
              </IkariamText>
              <IkariamText variant="caption" color="secondary">
                {city.buildingsCount} bâtiments
              </IkariamText>
            </View>
          )}
        </View>

        {/* Resource and construction status */}
        <View style={styles.statusRow}>
          {resource && (
            <View style={[styles.resourceBadge, { borderColor: resource.color }]}>
              <IkariamText variant="caption" style={styles.resourceIcon}>
                {resource.icon}
              </IkariamText>
              <IkariamText variant="caption" color="secondary">
                {resource.label}
              </IkariamText>
            </View>
          )}
          {city.hasConstruction && (
            <View style={styles.constructionBadge}>
              <IkariamText variant="caption" style={styles.constructionIcon}>
                🔨
              </IkariamText>
              <IkariamText variant="caption" color="primary">
                En construction
              </IkariamText>
            </View>
          )}
        </View>

        {/* Population bar (if available) */}
        {city.populationPercentage !== undefined && (
          <View style={styles.populationSection}>
            <View style={styles.populationHeader}>
              <IkariamText variant="caption" style={styles.populationIcon}>
                👥
              </IkariamText>
              <IkariamText variant="caption" color="secondary">
                Population
              </IkariamText>
              <IkariamText variant="caption" weight="semibold">
                {city.populationPercentage}%
              </IkariamText>
            </View>
            <View style={styles.populationBar}>
              <View
                style={[
                  styles.populationFill,
                  { width: `${city.populationPercentage}%` },
                  city.populationPercentage >= 90 && styles.populationFillHigh,
                ]}
              />
            </View>
          </View>
        )}
      </View>

      {/* Action arrow */}
      <View style={styles.arrowContainer}>
        <IkariamText variant="body" color="secondary" style={styles.arrow}>
          →
        </IkariamText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: IkariamTheme.colors.parchment.light,
    borderRadius: IkariamTheme.borderRadius.lg,
    borderWidth: 2,
    borderColor: IkariamTheme.colors.wood.base,
    padding: IkariamTheme.spacing.base,
    marginBottom: IkariamTheme.spacing.base,
    position: 'relative',
    overflow: 'hidden',
    ...IkariamTheme.shadows.md,
  },
  containerSelected: {
    borderColor: IkariamTheme.colors.gold.base,
    borderWidth: 3,
    backgroundColor: IkariamTheme.colors.gold.light + '20',
  },

  // Decorative corners
  corner: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderColor: IkariamTheme.colors.gold.base,
  },
  cornerTopLeft: {
    top: 4,
    left: 4,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 4,
  },
  cornerTopRight: {
    top: 4,
    right: 4,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 4,
  },
  cornerBottomLeft: {
    bottom: 4,
    left: 4,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 4,
  },
  cornerBottomRight: {
    bottom: 4,
    right: 4,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 4,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: IkariamTheme.spacing.md,
    paddingRight: IkariamTheme.spacing.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: IkariamTheme.spacing.sm,
  },
  capitalBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: IkariamTheme.colors.gold.light,
    borderWidth: 2,
    borderColor: IkariamTheme.colors.gold.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capitalIconLarge: {
    fontSize: 14,
  },
  cityName: {
    flex: 1,
  },

  infoSection: {
    borderTopWidth: 1,
    borderTopColor: IkariamTheme.colors.border.light,
    paddingTop: IkariamTheme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: IkariamTheme.spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IkariamTheme.spacing.xs,
  },
  infoIcon: {
    fontSize: 12,
  },

  statusRow: {
    flexDirection: 'row',
    gap: IkariamTheme.spacing.sm,
    flexWrap: 'wrap',
  },
  resourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IkariamTheme.colors.parchment.base,
    paddingHorizontal: IkariamTheme.spacing.sm,
    paddingVertical: IkariamTheme.spacing.xs,
    borderRadius: IkariamTheme.borderRadius.sm,
    borderWidth: 1,
    gap: IkariamTheme.spacing.xs,
  },
  resourceIcon: {
    fontSize: 12,
  },
  constructionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IkariamTheme.colors.mediterranean.light + '30',
    paddingHorizontal: IkariamTheme.spacing.sm,
    paddingVertical: IkariamTheme.spacing.xs,
    borderRadius: IkariamTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: IkariamTheme.colors.mediterranean.base,
    gap: IkariamTheme.spacing.xs,
  },
  constructionIcon: {
    fontSize: 12,
  },

  populationSection: {
    marginTop: IkariamTheme.spacing.sm,
  },
  populationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IkariamTheme.spacing.xs,
    marginBottom: IkariamTheme.spacing.xs,
  },
  populationIcon: {
    fontSize: 12,
  },
  populationBar: {
    height: 6,
    backgroundColor: IkariamTheme.colors.parchment.dark,
    borderRadius: 3,
    overflow: 'hidden',
  },
  populationFill: {
    height: '100%',
    backgroundColor: IkariamTheme.colors.mediterranean.base,
    borderRadius: 3,
  },
  populationFillHigh: {
    backgroundColor: IkariamTheme.colors.warning,
  },

  arrowContainer: {
    position: 'absolute',
    right: IkariamTheme.spacing.base,
    top: '50%',
    marginTop: -12,
  },
  arrow: {
    fontSize: 24,
    opacity: 0.5,
  },

  // Compact variant
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: IkariamTheme.colors.parchment.base,
    paddingVertical: IkariamTheme.spacing.base,
    paddingHorizontal: IkariamTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: IkariamTheme.colors.border.light,
  },
  compactSelected: {
    backgroundColor: IkariamTheme.colors.gold.light,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: IkariamTheme.spacing.sm,
  },
  capitalIcon: {
    fontSize: 14,
  },
  compactName: {
    flex: 1,
  },
  constructionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: IkariamTheme.colors.mediterranean.base,
  },
});
