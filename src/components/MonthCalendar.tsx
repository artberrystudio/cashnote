import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IncomeRecord } from '../types';
import { CATEGORIES } from '../utils/categories';

interface Props {
  year: number;
  month: number; // 1-12
  records: IncomeRecord[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

export function MonthCalendar({ year, month, records, selectedDate, onSelectDate }: Props) {
  // Build set of dates that have records, grouped by date
  const dateMap: Record<string, IncomeRecord[]> = {};
  records.forEach((r) => {
    if (!dateMap[r.date]) dateMap[r.date] = [];
    dateMap[r.date].push(r);
  });

  // Calendar grid
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // Mon=0
  const totalDays = lastDay.getDate();

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date();
  const todayStr =
    today.getFullYear() === year && today.getMonth() + 1 === month
      ? String(today.getDate())
      : null;

  return (
    <View style={styles.container}>
      {/* Day headers */}
      <View style={styles.headerRow}>
        {DAYS.map((d, i) => (
          <Text
            key={d}
            style={[styles.dayHeader, i === 5 && styles.sat, i === 6 && styles.sun]}
          >
            {d}
          </Text>
        ))}
      </View>

      {/* Weeks */}
      {Array.from({ length: cells.length / 7 }, (_, w) => (
        <View key={w} style={styles.week}>
          {cells.slice(w * 7, w * 7 + 7).map((day, i) => {
            if (!day) return <View key={i} style={styles.cell} />;

            const m = String(month).padStart(2, '0');
            const d = String(day).padStart(2, '0');
            const dateStr = `${year}-${m}-${d}`;
            const dayRecords = dateMap[dateStr] ?? [];
            const isSelected = selectedDate === dateStr;
            const isToday = String(day) === todayStr;

            // Up to 3 category dots
            const dots = dayRecords.slice(0, 3);

            return (
              <TouchableOpacity
                key={i}
                style={styles.cell}
                onPress={() => onSelectDate(isSelected ? null : dateStr)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.dayCircle,
                    isSelected && styles.dayCircleSelected,
                    isToday && !isSelected && styles.dayCircleToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNum,
                      i === 5 && styles.sat,
                      i === 6 && styles.sun,
                      isSelected && styles.dayNumSelected,
                      isToday && !isSelected && styles.dayNumToday,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
                {dots.length > 0 && (
                  <View style={styles.dots}>
                    {dots.map((r, di) => (
                      <View
                        key={di}
                        style={[
                          styles.dot,
                          { backgroundColor: CATEGORIES[r.category].color },
                        ]}
                      />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 4 },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  sat: { color: '#2563EB' },
  sun: { color: '#EF4444' },
  week: { flexDirection: 'row', marginBottom: 2 },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
    gap: 2,
  },
  dayCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: '#059669',
  },
  dayCircleToday: {
    backgroundColor: '#D1FAE5',
  },
  dayNum: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  dayNumSelected: { color: '#FFFFFF', fontWeight: '700' },
  dayNumToday: { color: '#059669', fontWeight: '700' },
  dots: {
    flexDirection: 'row',
    gap: 2,
    height: 6,
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
