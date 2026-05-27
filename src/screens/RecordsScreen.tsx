import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { RecordCard } from '../components/RecordCard';
import { MonthCalendar } from '../components/MonthCalendar';
import { AddRecordModal } from '../components/AddRecordModal';
import { IncomeRecord } from '../types';
import { formatKRW } from '../utils/format';

const TAB_BAR_HEIGHT = 64;

export function RecordsScreen() {
  const { records, addRecord, updateRecord, deleteRecord } = useStore();
  const insets = useSafeAreaInsets();

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState<IncomeRecord | null>(null);

  // Records for current viewed month
  const monthPrefix = `${viewYear}-${String(viewMonth).padStart(2, '0')}`;
  const monthRecords = useMemo(
    () => records.filter((r) => r.date.startsWith(monthPrefix)),
    [records, monthPrefix]
  );

  // Records for selected date (or all month if none selected)
  const displayRecords = useMemo(() => {
    const base = selectedDate
      ? records.filter((r) => r.date === selectedDate)
      : monthRecords;
    return [...base].sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
  }, [records, selectedDate, monthRecords]);

  const displayTotal = useMemo(
    () => displayRecords.reduce((s, r) => s + r.amount, 0),
    [displayRecords]
  );

  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
    else setViewMonth(m => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
    else setViewMonth(m => m + 1);
    setSelectedDate(null);
  };

  const openEdit = (record: IncomeRecord) => {
    setEditRecord(record);
    setModalVisible(true);
  };
  const openAdd = () => {
    setEditRecord(null);
    setModalVisible(true);
  };
  const handleSave = (data: Omit<IncomeRecord, 'id' | 'createdAt'>) => {
    if (editRecord) updateRecord(editRecord.id, data);
    else addRecord(data);
  };

  const monthTotal = useMemo(
    () => monthRecords.reduce((s, r) => s + r.amount, 0),
    [monthRecords]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>수입 기록</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.iconBtn, showCalendar && styles.iconBtnActive]}
            onPress={() => setShowCalendar(v => !v)}
          >
            <Ionicons
              name="calendar-outline"
              size={18}
              color={showCalendar ? '#059669' : '#6B7280'}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
            <Ionicons name="add" size={20} color="#059669" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Month navigator */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={20} color="#374151" />
        </TouchableOpacity>
        <View style={styles.monthInfo}>
          <Text style={styles.monthLabel}>{viewYear}년 {viewMonth}월</Text>
          <Text style={styles.monthTotal}>{formatKRW(monthTotal)}</Text>
        </View>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar */}
        {showCalendar && (
          <View style={styles.calendarCard}>
            <MonthCalendar
              year={viewYear}
              month={viewMonth}
              records={monthRecords}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </View>
        )}

        {/* List header */}
        <View style={styles.listHeader}>
          <Text style={styles.listHeaderText}>
            {selectedDate
              ? `${selectedDate.replace(/-/g, '.')} · ${displayRecords.length}건`
              : `${viewMonth}월 전체 · ${displayRecords.length}건`}
          </Text>
          <Text style={styles.listHeaderAmount}>{formatKRW(displayTotal)}</Text>
        </View>

        {/* Record list */}
        {displayRecords.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={44} color="#D1D5DB" />
            <Text style={styles.emptyText}>기록이 없습니다</Text>
          </View>
        ) : (
          displayRecords.map((r) => (
            <RecordCard
              key={r.id}
              record={r}
              onDelete={deleteRecord}
              onEdit={openEdit}
            />
          ))
        )}
      </ScrollView>

      <AddRecordModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        editRecord={editRecord}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  headerRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: { backgroundColor: '#D1FAE5' },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  navBtn: { padding: 6 },
  monthInfo: { flex: 1, alignItems: 'center', gap: 1 },
  monthLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },
  monthTotal: { fontSize: 13, fontWeight: '600', color: '#059669' },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 12, paddingHorizontal: 12 },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  listHeaderText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  listHeaderAmount: { fontSize: 14, fontWeight: '800', color: '#059669' },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyText: { fontSize: 15, color: '#9CA3AF', fontWeight: '500' },
});
