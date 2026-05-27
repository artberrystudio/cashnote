import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { SummaryCard } from '../components/SummaryCard';
import { CategoryChart } from '../components/CategoryChart';
import { RecordCard } from '../components/RecordCard';
import { AddRecordModal } from '../components/AddRecordModal';
import { formatKRW, getTodayString, getMonthStart } from '../utils/format';
import { IncomeRecord } from '../types';

export function DashboardScreen() {
  const { records, addRecord, updateRecord, deleteRecord } = useStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState<IncomeRecord | null>(null);

  const today = getTodayString();
  const monthStart = getMonthStart();

  const todayTotal = useMemo(
    () =>
      records
        .filter((r) => r.date === today)
        .reduce((s, r) => s + r.amount, 0),
    [records, today]
  );

  const monthTotal = useMemo(
    () =>
      records
        .filter((r) => r.date >= monthStart)
        .reduce((s, r) => s + r.amount, 0),
    [records, monthStart]
  );

  const recentRecords = useMemo(
    () =>
      [...records]
        .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0))
        .slice(0, 5),
    [records]
  );

  const openAdd = () => {
    setEditRecord(null);
    setModalVisible(true);
  };

  const openEdit = (record: IncomeRecord) => {
    setEditRecord(record);
    setModalVisible(true);
  };

  const handleSave = (data: Omit<IncomeRecord, 'id' | 'createdAt'>) => {
    if (editRecord) {
      updateRecord(editRecord.id, data);
    } else {
      addRecord(data);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>안녕하세요 👋</Text>
            <Text style={styles.title}>수입 대시보드</Text>
          </View>
          <View style={styles.logoWrap}>
            <Ionicons name="wallet" size={24} color="#059669" />
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.cardRow}>
          <SummaryCard
            label="오늘 수입"
            value={formatKRW(todayTotal)}
            icon="today-outline"
            iconColor="#059669"
            iconBg="#D1FAE5"
          />
          <SummaryCard
            label="이번 달 합계"
            value={formatKRW(monthTotal)}
            icon="calendar-outline"
            iconColor="#2563EB"
            iconBg="#DBEAFE"
          />
          <SummaryCard
            label="전체 건수"
            value={`${records.length}건`}
            icon="list-outline"
            iconColor="#7C3AED"
            iconBg="#EDE9FE"
          />
        </View>

        {/* Category Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>카테고리별 수입</Text>
          <View style={styles.card}>
            <CategoryChart records={records} />
          </View>
        </View>

        {/* Recent Records */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>최근 기록</Text>
          {recentRecords.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="receipt-outline" size={40} color="#D1D5DB" />
              <Text style={styles.emptyText}>아직 기록이 없습니다</Text>
              <Text style={styles.emptySubText}>
                + 버튼을 눌러 첫 수입을 기록해보세요
              </Text>
            </View>
          ) : (
            recentRecords.map((r) => (
              <RecordCard
                key={r.id}
                record={r}
                onDelete={deleteRecord}
                onEdit={openEdit}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openAdd} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

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
  safe: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  greeting: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  emptySubText: {
    fontSize: 13,
    color: '#D1D5DB',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});
