import React from 'react';
import { View, StyleSheet, ScrollView, ViewStyle, StyleProp } from 'react-native';
import { IkariamTheme } from '@/constants/ikariamTheme';
import { IkariamText } from './IkariamText';

interface ResourceData {
  wood: number;
  wine: number;
  marble: number;
  crystal: number;
  sulfur: number;
  gold?: number;
  citizens?: number;
}

interface IkariamResourcePanelProps {
  resources: ResourceData;
  warehouseCapacity?: number;
  variant?: 'compact' | 'detailed' | 'horizontal';
  showProduction?: boolean;
  production?: Partial<ResourceData>;
  style?: StyleProp<ViewStyle>;
}

const RESOURCE_CONFIG = [
  { key: 'wood', icon: '🪵', label: 'Bois', color: '#8B6F47' },
  { key: 'wine', icon: '🍷', label: 'Vin', color: '#8B2252' },
  { key: 'marble', icon: '⚪', label: 'Marbre', color: '#C8C5C0' },
  { key: 'crystal', icon: '💎', label: 'Cristal', color: '#5B9FC7' },
  { key: 'sulfur', icon: '⚠️', label: 'Soufre', color: '#D4AF37' },
] as const;

export function IkariamResourcePanel({
  resources,
  warehouseCapacity,
  variant = 'horizontal',
  showProduction = false,
  production,
  style,
}: IkariamResourcePanelProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
    return num.toLocaleString('fr-FR');
  };

  const getResourceStatus = (value: number): 'normal' | 'warning' | 'critical' => {
    if (!warehouseCapacity) return 'normal';
    const ratio = value / warehouseCapacity;
    if (ratio >= 0.95) return 'critical';
    if (ratio >= 0.8) return 'warning';
    return 'normal';
  };

  if (variant === 'compact') {
    return (
      <View style={[styles.compactContainer, style]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.compactList}>
            {RESOURCE_CONFIG.map(({ key, icon }) => (
              <View
                key={key}
                style={[
                  styles.compactItem,
                  getResourceStatus(resources[key as keyof ResourceData] as number) === 'critical' &&
                    styles.compactItemCritical,
                ]}
              >
                <IkariamText variant="caption" style={styles.compactIcon}>
                  {icon}
                </IkariamText>
                <IkariamText variant="caption" weight="semibold">
                  {formatNumber(resources[key as keyof ResourceData] as number)}
                </IkariamText>
              </View>
            ))}
            {resources.gold !== undefined && (
              <View style={[styles.compactItem, styles.compactItemGold]}>
                <IkariamText variant="caption" style={styles.compactIcon}>
                  💰
                </IkariamText>
                <IkariamText variant="caption" weight="semibold">
                  {formatNumber(resources.gold)}
                </IkariamText>
              </View>
            )}
            {resources.citizens !== undefined && (
              <View style={styles.compactItem}>
                <IkariamText variant="caption" style={styles.compactIcon}>
                  👥
                </IkariamText>
                <IkariamText variant="caption" weight="semibold">
                  {formatNumber(resources.citizens)}
                </IkariamText>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (variant === 'detailed') {
    return (
      <View style={[styles.detailedContainer, style]}>
        <View style={styles.detailedHeader}>
          <IkariamText variant="label" weight="bold">
            Ressources
          </IkariamText>
          {warehouseCapacity && (
            <IkariamText variant="caption" color="secondary">
              Capacité: {formatNumber(warehouseCapacity)}
            </IkariamText>
          )}
        </View>
        <View style={styles.detailedGrid}>
          {RESOURCE_CONFIG.map(({ key, icon, label, color }) => {
            const value = resources[key as keyof ResourceData] as number;
            const status = getResourceStatus(value);
            const prod = production?.[key as keyof ResourceData];

            return (
              <View key={key} style={styles.detailedItem}>
                <View style={styles.detailedItemHeader}>
                  <IkariamText variant="body" style={styles.detailedIcon}>
                    {icon}
                  </IkariamText>
                  <IkariamText variant="caption" color="secondary">
                    {label}
                  </IkariamText>
                </View>
                <View style={styles.detailedValueRow}>
                  <IkariamText
                    variant="body"
                    weight="bold"
                    style={[
                      status === 'critical' && styles.valueCritical,
                      status === 'warning' && styles.valueWarning,
                    ]}
                  >
                    {formatNumber(value)}
                  </IkariamText>
                  {showProduction && prod !== undefined && (
                    <IkariamText
                      variant="caption"
                      style={[
                        styles.production,
                        prod > 0 ? styles.productionPositive : styles.productionNegative,
                      ]}
                    >
                      {prod > 0 ? '+' : ''}{formatNumber(prod)}/h
                    </IkariamText>
                  )}
                </View>
                {warehouseCapacity && (
                  <View style={styles.miniProgressContainer}>
                    <View
                      style={[
                        styles.miniProgressFill,
                        {
                          width: `${Math.min((value / warehouseCapacity) * 100, 100)}%`,
                          backgroundColor:
                            status === 'critical'
                              ? IkariamTheme.colors.error
                              : status === 'warning'
                                ? IkariamTheme.colors.warning
                                : color,
                        },
                      ]}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>
        {/* Gold and Citizens */}
        <View style={styles.specialResources}>
          {resources.gold !== undefined && (
            <View style={[styles.specialItem, styles.goldItem]}>
              <IkariamText variant="body" style={styles.detailedIcon}>
                💰
              </IkariamText>
              <IkariamText variant="body" weight="bold">
                {formatNumber(resources.gold)}
              </IkariamText>
              <IkariamText variant="caption" color="secondary">
                Or
              </IkariamText>
            </View>
          )}
          {resources.citizens !== undefined && (
            <View style={styles.specialItem}>
              <IkariamText variant="body" style={styles.detailedIcon}>
                👥
              </IkariamText>
              <IkariamText variant="body" weight="bold">
                {formatNumber(resources.citizens)}
              </IkariamText>
              <IkariamText variant="caption" color="secondary">
                Citoyens
              </IkariamText>
            </View>
          )}
        </View>
      </View>
    );
  }

  // Horizontal variant (default)
  return (
    <View style={[styles.horizontalContainer, style]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.horizontalList}>
          {RESOURCE_CONFIG.map(({ key, icon, color }) => {
            const value = resources[key as keyof ResourceData] as number;
            const status = getResourceStatus(value);

            return (
              <View
                key={key}
                style={[
                  styles.horizontalItem,
                  status === 'critical' && styles.horizontalItemCritical,
                  status === 'warning' && styles.horizontalItemWarning,
                ]}
              >
                <View style={[styles.resourceIconBg, { backgroundColor: color + '30' }]}>
                  <IkariamText variant="body" style={styles.horizontalIcon}>
                    {icon}
                  </IkariamText>
                </View>
                <IkariamText
                  variant="caption"
                  weight="semibold"
                  style={[
                    styles.horizontalValue,
                    status === 'critical' && styles.valueCritical,
                  ]}
                >
                  {formatNumber(value)}
                </IkariamText>
              </View>
            );
          })}
          {resources.gold !== undefined && (
            <View style={[styles.horizontalItem, styles.goldItemHorizontal]}>
              <View style={[styles.resourceIconBg, styles.goldIconBg]}>
                <IkariamText variant="body" style={styles.horizontalIcon}>
                  💰
                </IkariamText>
              </View>
              <IkariamText variant="caption" weight="bold" style={styles.horizontalValue}>
                {formatNumber(resources.gold)}
              </IkariamText>
            </View>
          )}
          {resources.citizens !== undefined && (
            <View style={styles.horizontalItem}>
              <View style={[styles.resourceIconBg, styles.citizensIconBg]}>
                <IkariamText variant="body" style={styles.horizontalIcon}>
                  👥
                </IkariamText>
              </View>
              <IkariamText variant="caption" weight="semibold" style={styles.horizontalValue}>
                {formatNumber(resources.citizens)}
              </IkariamText>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Compact variant
  compactContainer: {
    backgroundColor: IkariamTheme.colors.parchment.dark,
    borderBottomWidth: 1,
    borderBottomColor: IkariamTheme.colors.border.base,
    paddingVertical: IkariamTheme.spacing.xs,
  },
  compactList: {
    flexDirection: 'row',
    paddingHorizontal: IkariamTheme.spacing.sm,
    gap: IkariamTheme.spacing.sm,
  },
  compactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IkariamTheme.colors.parchment.base,
    paddingHorizontal: IkariamTheme.spacing.sm,
    paddingVertical: IkariamTheme.spacing.xs,
    borderRadius: IkariamTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: IkariamTheme.colors.border.light,
    gap: 4,
  },
  compactItemCritical: {
    borderColor: IkariamTheme.colors.error,
    backgroundColor: IkariamTheme.colors.error + '10',
  },
  compactItemGold: {
    backgroundColor: IkariamTheme.colors.gold.light,
    borderColor: IkariamTheme.colors.gold.base,
  },
  compactIcon: {
    fontSize: 14,
  },

  // Detailed variant
  detailedContainer: {
    backgroundColor: IkariamTheme.colors.parchment.light,
    borderRadius: IkariamTheme.borderRadius.md,
    borderWidth: 2,
    borderColor: IkariamTheme.colors.wood.base,
    padding: IkariamTheme.spacing.base,
    ...IkariamTheme.shadows.md,
  },
  detailedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: IkariamTheme.spacing.base,
    paddingBottom: IkariamTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: IkariamTheme.colors.border.light,
  },
  detailedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: IkariamTheme.spacing.sm,
  },
  detailedItem: {
    width: '30%',
    minWidth: 90,
    backgroundColor: IkariamTheme.colors.parchment.base,
    borderRadius: IkariamTheme.borderRadius.sm,
    padding: IkariamTheme.spacing.sm,
    borderWidth: 1,
    borderColor: IkariamTheme.colors.border.light,
  },
  detailedItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IkariamTheme.spacing.xs,
    marginBottom: IkariamTheme.spacing.xs,
  },
  detailedIcon: {
    fontSize: 18,
  },
  detailedValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  miniProgressContainer: {
    height: 4,
    backgroundColor: IkariamTheme.colors.parchment.dark,
    borderRadius: 2,
    marginTop: IkariamTheme.spacing.xs,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  production: {
    fontSize: 10,
    marginLeft: IkariamTheme.spacing.xs,
  },
  productionPositive: {
    color: IkariamTheme.colors.success,
  },
  productionNegative: {
    color: IkariamTheme.colors.error,
  },
  specialResources: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: IkariamTheme.spacing.lg,
    marginTop: IkariamTheme.spacing.base,
    paddingTop: IkariamTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: IkariamTheme.colors.border.light,
  },
  specialItem: {
    alignItems: 'center',
    gap: IkariamTheme.spacing.xs,
  },
  goldItem: {
    backgroundColor: IkariamTheme.colors.gold.light + '40',
    paddingHorizontal: IkariamTheme.spacing.base,
    paddingVertical: IkariamTheme.spacing.sm,
    borderRadius: IkariamTheme.borderRadius.base,
  },
  valueCritical: {
    color: IkariamTheme.colors.error,
  },
  valueWarning: {
    color: IkariamTheme.colors.warning,
  },

  // Horizontal variant
  horizontalContainer: {
    backgroundColor: IkariamTheme.colors.parchment.dark,
    borderBottomWidth: 1,
    borderBottomColor: IkariamTheme.colors.border.base,
    paddingVertical: IkariamTheme.spacing.sm,
  },
  horizontalList: {
    flexDirection: 'row',
    paddingHorizontal: IkariamTheme.spacing.sm,
    gap: IkariamTheme.spacing.sm,
  },
  horizontalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IkariamTheme.colors.parchment.base,
    paddingRight: IkariamTheme.spacing.md,
    borderRadius: IkariamTheme.borderRadius.base,
    borderWidth: 1,
    borderColor: IkariamTheme.colors.border.light,
    overflow: 'hidden',
    gap: IkariamTheme.spacing.xs,
  },
  horizontalItemCritical: {
    borderColor: IkariamTheme.colors.error,
  },
  horizontalItemWarning: {
    borderColor: IkariamTheme.colors.warning,
  },
  resourceIconBg: {
    padding: IkariamTheme.spacing.sm,
  },
  goldIconBg: {
    backgroundColor: IkariamTheme.colors.gold.light,
  },
  citizensIconBg: {
    backgroundColor: IkariamTheme.colors.mediterranean.light + '40',
  },
  goldItemHorizontal: {
    backgroundColor: IkariamTheme.colors.gold.light,
    borderColor: IkariamTheme.colors.gold.base,
  },
  horizontalIcon: {
    fontSize: 16,
  },
  horizontalValue: {
    minWidth: 40,
    textAlign: 'right',
  },
});
