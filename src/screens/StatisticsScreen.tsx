import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { CATEGORIES, CATEGORY_LIST } from '../utils/categories';
import { formatKRW } from '../utils/format';
import { Category } from '../types';

type Period = 'month' | 'year' | 'all';

// ── 최근 N개월 목록 생성 ──────────────────────────────────────
function getRecentMonths(n: number) {
  const result: { year: number; month: number; label: string; prefix: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    result.push({
      year: y,
      month: m,
      label: `${m}월`,
      prefix: `${y}-${String(m).padStart(2, '0')}`,
    });
  }
  return result;
}

const TAB_BAR_HEIGHT = 56;

export function StatisticsScreen() {
  const { records } = useStore();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>('month');

  const now = new Date();
  const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisYear = String(now.getFullYear());

  // 기간 필터
  const filtered = useMemo(() => {
    if (period === 'month') return records.filter((r) => r.date.startsWith(thisMonthPrefix));
    if (period === 'year') return records.filter((r) => r.date.startsWith(thisYear));
    return records;
  }, [records, period, thisMonthPrefix, thisYear]);

  const totalAmount = useMemo(
    () => filtered.reduce((s, r) => s + r.amount, 0),
    [filtered]
  );
  const avgPerRecord = filtered.length > 0 ? Math.round(totalAmount / filtered.length) : 0;

  // 카테고리별 합계
  const catTotals = useMemo(() => {
    const map: Record<Category, number> = {
      freelance: 0, content: 0, invest: 0, sales: 0, consult: 0, other: 0,
    };
    filtered.forEach((r) => { map[r.category] += r.amount; });
    return CATEGORY_LIST
      .map((cat) => ({ cat, amount: map[cat], pct: totalAmount > 0 ? map[cat] / totalAmount : 0 }))
      .filter((x) => x.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [filtered, totalAmount]);

  // 활동명별 Top 10
  const activityTotals = useMemo(() => {
    const map: Record<string, { amount: number; count: number; category: Category }> = {};
    filtered.forEach((r) => {
      if (!map[r.name]) map[r.name] = { amount: 0, count: 0, category: r.category };
      map[r.name].amount += r.amount;
      map[r.name].count += 1;
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [filtered]);

  // 월별 추이 (최근 6개월)
  const recentMonths = useMemo(() => getRecentMonths(6), []);
  const monthlyTotals = useMemo(() =>
    recentMonths.map((m) => ({
      ...m,
      amount: records
        .filter((r) => r.date.startsWith(m.prefix))
        .reduce((s, r) => s + r.amount, 0),
    })),
    [records, recentMonths]
  );
  const maxMonthly = Math.max(...monthlyTotals.map((m) => m.amount), 1);

  const PERIODS: { key: Period; label: string }[] = [
    { key: 'month', label: '이번 달' },
    { key: 'year', label: '올해' },
    { key: 'all', label: '전체' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>통계</Text>
      </View>

      {/* Period tabs */}
      <View style={styles.tabsWrap}>
        <View style={styles.tabs}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.tab, period === p.key && styles.tabActive]}
              onPress={() => setPeriod(p.key)}
            >
              <Text style={[styles.tabText, period === p.key && styles.tabTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 요약 */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>총 수입</Text>
            <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>
              {formatKRW(totalAmount)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>건수</Text>
            <Text style={styles.summaryValue}>{filtered.length}건</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>건당 평균</Text>
            <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>
              {formatKRW(avgPerRecord)}
            </Text>
          </View>
        </View>

        {/* 월별 추이 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>월별 수입 추이 (최근 6개월)</Text>
          <View style={styles.card}>
            {monthlyTotals.every((m) => m.amount === 0) ? (
              <Text style={styles.emptyText}>데이터가 없습니다</Text>
            ) : (
              <View style={styles.barChart}>
                {monthlyTotals.map((m) => (
                  <View key={m.prefix} style={styles.barCol}>
                    <Text style={styles.barAmount} numberOfLines={1}>
                      {m.amount > 0 ? shortKRW(m.amount) : ''}
                    </Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: `${Math.max((m.amount / maxMonthly) * 100, m.amount > 0 ? 4 : 0)}%`,
                            backgroundColor: m.prefix === thisMonthPrefix ? '#059669' : '#A7F3D0',
                          },
                        ]}
                      />
                    </View>
                    <Text style={[
                      styles.barLabel,
                      m.prefix === thisMonthPrefix && styles.barLabelActive,
                    ]}>
                      {m.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* 카테고리별 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>카테고리별 수입</Text>
          {catTotals.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyText}>데이터가 없습니다</Text>
            </View>
          ) : (
            <View style={styles.card}>
              {catTotals.map(({ cat, amount, pct }) => {
                const cfg = CATEGORIES[cat];
                return (
                  <View key={cat} style={styles.catRow}>
                    <View style={[styles.catDot, { backgroundColor: cfg.color }]} />
                    <View style={styles.catInfo}>
                      <View style={styles.catTopRow}>
                        <Text style={styles.catName}>{cfg.label}</Text>
                        <Text style={styles.catPct}>{Math.round(pct * 100)}%</Text>
                      </View>
                      <View style={styles.catTrack}>
                        <View
                          style={[
                            styles.catBar,
                            { width: `${pct * 100}%`, backgroundColor: cfg.color },
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={styles.catAmount}>{formatKRW(amount)}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* 활동별 Top 10 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>수익 활동 순위</Text>
          {activityTotals.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyText}>데이터가 없습니다</Text>
            </View>
          ) : (
            <View style={styles.card}>
              {activityTotals.map(({ name, amount, count, category }, i) => {
                const cfg = CATEGORIES[category];
                return (
                  <View
                    key={name}
                    style={[styles.rankRow, i < activityTotals.length - 1 && styles.rankRowBorder]}
                  >
                    <Text style={[styles.rankNum, i < 3 && styles.rankNumTop]}>
                      {i + 1}
                    </Text>
                    <View style={[styles.rankIcon, { backgroundColor: cfg.bgColor }]}>
                      <Ionicons name={cfg.icon as any} size={14} color={cfg.color} />
                    </View>
                    <View style={styles.rankContent}>
                      <Text style={styles.rankName} numberOfLines={1}>{name}</Text>
                      <Text style={styles.rankCount}>{count}회</Text>
                    </View>
                    <Text style={styles.rankAmount}>{formatKRW(amount)}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function shortKRW(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${Math.round(n / 10_000)}만`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}천`;
  return String(n);
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },

  tabsWrap: { paddingHorizontal: 16, paddingBottom: 10 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 9 },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  tabTextActive: { color: '#111827', fontWeight: '700' },

  scroll: { flex: 1 },
  content: { paddingTop: 16, paddingHorizontal: 16 },

  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  summaryValue: { fontSize: 15, fontWeight: '800', color: '#111827' },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 10 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 14, paddingVertical: 12 },

  // Bar chart
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 130,
    gap: 6,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barAmount: { fontSize: 9, color: '#6B7280', fontWeight: '600', height: 12 },
  barTrack: {
    flex: 1,
    width: '70%',
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: { width: '100%', borderRadius: 4, minHeight: 0 },
  barLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  barLabelActive: { color: '#059669', fontWeight: '700' },

  // Category
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  catDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  catInfo: { flex: 1, gap: 4 },
  catTopRow: { flexDirection: 'row', justifyContent: 'space-between' },
  catName: { fontSize: 13, fontWeight: '600', color: '#374151' },
  catPct: { fontSize: 12, color: '#9CA3AF' },
  catTrack: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  catBar: { height: '100%', borderRadius: 3 },
  catAmount: { fontSize: 13, fontWeight: '700', color: '#111827', minWidth: 80, textAlign: 'right' },

  // Rank
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  rankRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  rankNum: { width: 20, fontSize: 13, fontWeight: '700', color: '#9CA3AF', textAlign: 'center' },
  rankNumTop: { color: '#F59E0B' },
  rankIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rankContent: { flex: 1, gap: 1 },
  rankName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  rankCount: { fontSize: 11, color: '#9CA3AF' },
  rankAmount: { fontSize: 14, fontWeight: '700', color: '#059669' },
});
