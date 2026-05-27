import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { IncomeRecord, Category } from '../types';
import { CATEGORIES, CATEGORY_LIST } from '../utils/categories';
import { formatKRW } from '../utils/format';

interface Props {
  records: IncomeRecord[];
}

const BAR_HEIGHT = 28;
const BAR_GAP = 10;
const LABEL_WIDTH = 64;
const AMOUNT_WIDTH = 88;
const PADDING = 16;

export function CategoryChart({ records }: Props) {
  const totals = CATEGORY_LIST.reduce((acc, cat) => {
    acc[cat] = records
      .filter((r) => r.category === cat)
      .reduce((s, r) => s + r.amount, 0);
    return acc;
  }, {} as Record<Category, number>);

  const maxVal = Math.max(...Object.values(totals), 1);
  const activeCategories = CATEGORY_LIST.filter((c) => totals[c] > 0);

  if (activeCategories.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>아직 기록된 수입이 없습니다</Text>
      </View>
    );
  }

  const BAR_AREA_WIDTH_RATIO = 1; // dynamic, computed below
  const svgHeight =
    activeCategories.length * (BAR_HEIGHT + BAR_GAP) - BAR_GAP + PADDING * 2;

  return (
    <View style={styles.container}>
      {activeCategories.map((cat, i) => {
        const cfg = CATEGORIES[cat];
        const val = totals[cat];
        return (
          <View key={cat} style={styles.row}>
            {/* Label */}
            <Text style={[styles.label, { color: cfg.color }]}>
              {cfg.label}
            </Text>
            {/* Bar track */}
            <View style={styles.trackWrap}>
              <View style={styles.track}>
                <View
                  style={[
                    styles.bar,
                    {
                      backgroundColor: cfg.color,
                      width: `${(val / maxVal) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
            {/* Amount */}
            <Text style={styles.amount} numberOfLines={1}>
              {formatKRW(val)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: BAR_HEIGHT,
  },
  label: {
    width: 58,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  trackWrap: {
    flex: 1,
  },
  track: {
    height: BAR_HEIGHT,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  bar: {
    height: '100%',
    borderRadius: 6,
    minWidth: 6,
  },
  amount: {
    width: 90,
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'right',
  },
  empty: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});
