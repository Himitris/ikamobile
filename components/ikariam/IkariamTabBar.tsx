import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { IkariamTheme } from '@/constants/ikariamTheme';
import { IkariamText } from './IkariamText';

interface TabItem {
  key: string;
  label: string;
  icon: string;
  badge?: number;
}

interface IkariamTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabKey: string) => void;
  variant?: 'default' | 'compact' | 'floating';
  style?: StyleProp<ViewStyle>;
}

export function IkariamTabBar({
  tabs,
  activeTab,
  onTabChange,
  variant = 'default',
  style,
}: IkariamTabBarProps) {
  const isFloating = variant === 'floating';
  const isCompact = variant === 'compact';

  return (
    <View
      style={[
        styles.container,
        isFloating && styles.containerFloating,
        isCompact && styles.containerCompact,
        style,
      ]}
    >
      {/* Decorative top border for default variant */}
      {!isFloating && !isCompact && (
        <View style={styles.decorativeBorder}>
          <View style={styles.borderLeft} />
          <View style={styles.borderCenter} />
          <View style={styles.borderRight} />
        </View>
      )}

      <View style={[styles.tabsContainer, isFloating && styles.tabsContainerFloating]}>
        {tabs.map((tab, index) => {
          const isActive = tab.key === activeTab;
          const isFirst = index === 0;
          const isLast = index === tabs.length - 1;

          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                isCompact && styles.tabCompact,
                isFloating && styles.tabFloating,
                isActive && styles.tabActive,
                isActive && isFloating && styles.tabActiveFloating,
                isFirst && styles.tabFirst,
                isLast && styles.tabLast,
              ]}
              onPress={() => onTabChange(tab.key)}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                <IkariamText
                  variant="body"
                  style={[
                    styles.tabIcon,
                    isCompact && styles.tabIconCompact,
                    isActive && styles.tabIconActive,
                  ]}
                >
                  {tab.icon}
                </IkariamText>
                {!isCompact && (
                  <IkariamText
                    variant="caption"
                    weight={isActive ? 'bold' : 'regular'}
                    style={[styles.tabLabel, isActive && styles.tabLabelActive]}
                  >
                    {tab.label}
                  </IkariamText>
                )}
              </View>

              {/* Badge */}
              {tab.badge !== undefined && tab.badge > 0 && (
                <View style={[styles.badge, isActive && styles.badgeActive]}>
                  <IkariamText variant="caption" style={styles.badgeText}>
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </IkariamText>
                </View>
              )}

              {/* Active indicator */}
              {isActive && !isFloating && (
                <View style={styles.activeIndicator} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Decorative bottom border for default variant */}
      {!isFloating && !isCompact && (
        <View style={styles.bottomDecoration}>
          <View style={styles.bottomLine} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: IkariamTheme.colors.wood.dark,
    borderTopWidth: 1,
    borderTopColor: IkariamTheme.colors.wood.base,
  },
  containerFloating: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    position: 'absolute',
    bottom: IkariamTheme.spacing.lg,
    left: IkariamTheme.spacing.lg,
    right: IkariamTheme.spacing.lg,
  },
  containerCompact: {
    backgroundColor: IkariamTheme.colors.parchment.dark,
    borderTopWidth: 0,
    borderBottomWidth: 2,
    borderBottomColor: IkariamTheme.colors.wood.base,
  },
  decorativeBorder: {
    flexDirection: 'row',
    height: 3,
  },
  borderLeft: {
    width: 20,
    backgroundColor: IkariamTheme.colors.gold.base,
    borderTopRightRadius: 3,
  },
  borderCenter: {
    flex: 1,
    backgroundColor: IkariamTheme.colors.gold.dark,
  },
  borderRight: {
    width: 20,
    backgroundColor: IkariamTheme.colors.gold.base,
    borderTopLeftRadius: 3,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingVertical: IkariamTheme.spacing.sm,
    paddingHorizontal: IkariamTheme.spacing.xs,
  },
  tabsContainerFloating: {
    backgroundColor: IkariamTheme.colors.wood.dark,
    borderRadius: IkariamTheme.borderRadius.xl,
    borderWidth: 2,
    borderColor: IkariamTheme.colors.gold.base,
    ...IkariamTheme.shadows.xl,
    paddingVertical: IkariamTheme.spacing.xs,
    paddingHorizontal: IkariamTheme.spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: IkariamTheme.spacing.sm,
    paddingHorizontal: IkariamTheme.spacing.xs,
    borderRadius: IkariamTheme.borderRadius.base,
    marginHorizontal: 2,
    position: 'relative',
  },
  tabCompact: {
    paddingVertical: IkariamTheme.spacing.sm,
  },
  tabFloating: {
    borderRadius: IkariamTheme.borderRadius.lg,
    marginHorizontal: IkariamTheme.spacing.xs,
  },
  tabFirst: {
    marginLeft: 0,
  },
  tabLast: {
    marginRight: 0,
  },
  tabActive: {
    backgroundColor: IkariamTheme.colors.wood.base,
  },
  tabActiveFloating: {
    backgroundColor: IkariamTheme.colors.gold.base,
  },
  tabContent: {
    alignItems: 'center',
    gap: 2,
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.7,
  },
  tabIconCompact: {
    fontSize: 24,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    color: IkariamTheme.colors.text.light,
    opacity: 0.7,
    fontSize: 10,
    textAlign: 'center',
  },
  tabLabelActive: {
    opacity: 1,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: IkariamTheme.colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: IkariamTheme.colors.wood.dark,
  },
  badgeActive: {
    borderColor: IkariamTheme.colors.gold.base,
  },
  badgeText: {
    color: IkariamTheme.colors.text.inverse,
    fontSize: 10,
    fontWeight: IkariamTheme.typography.fontWeight.bold,
    lineHeight: 14,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -IkariamTheme.spacing.sm - 2,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: IkariamTheme.colors.gold.base,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  bottomDecoration: {
    height: 2,
    backgroundColor: IkariamTheme.colors.wood.darkest,
  },
  bottomLine: {
    flex: 1,
    height: 1,
    backgroundColor: IkariamTheme.colors.wood.base,
  },
});
