import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '../types';
import { CATEGORIES } from '../utils/categories';

interface Props {
  category: Category;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function CategoryBadge({ category, showLabel = true, size = 'md' }: Props) {
  const cfg = CATEGORIES[category];
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: cfg.bgColor },
        isSmall && styles.badgeSm,
      ]}
    >
      <Ionicons
        name={cfg.icon as any}
        size={isSmall ? 12 : 14}
        color={cfg.color}
      />
      {showLabel && (
        <Text
          style={[
            styles.label,
            { color: cfg.color },
            isSmall && styles.labelSm,
          ]}
        >
          {cfg.label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  labelSm: {
    fontSize: 10,
  },
});
