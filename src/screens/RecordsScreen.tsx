import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { RecordCard } from '../components/RecordCard';
import { AddRecordModal } from '../components/AddRecordModal';
import { IncomeRecord, FilterTab } from '../types';
import { getTodayString, getWeekStart, getMonthStart, formatKRW } from '../utils/format';

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'today', label: '오늘' },
  { key: 'week', label: '이번 주' },
  { key: 'month', label: '이번 달' },
];

export function RecordsScreen() {
  const { records, addRecord, updateRecord, deleteRecord } = useStore();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState<IncomeRecord | null>(null);

  const today = getTodayString();
  const weekStart = getWeekStart();
  const monthStart = getMonthStart();

  const filtered = useMemo(() => {
    let base = [...records];
    if (activeTab === 'today') base = base.filter((r) => r.date === today);
    else if (activeTab === 'week') base = base.filter((r) => r.date >= weekStart);
    else if (activeTab === 'month') base = base.filter((r) => r.date >= monthStart);
    return base.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
  }, [records, activeTab, today, weekStart, monthStart]);

  const total = useMemo(
    () => filtered.reduce((s, r) => s + r.amount, 0),
    [filtered]
  );

  const openEdit = (record: IncomeRecord) => {
    setEditRecord(record);
    setModalVisible(true);
  };

  const openAdd = () => {
    setEditRecord(null);
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

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>수입 기록</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={20} color="#059669" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsWrap}>
        <View style={styles.tabs}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Total summary */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryCount}>{filtered.length}건</Text>
        <Text style={styles.summaryTotal}>{formatKRW(total)}</Text>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecordCard
            record={item}
            onDelete={deleteRecord}
            onEdit={openEdit}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>기록이 없습니다</Text>
            <Text style={styles.emptySubText}>
              {activeTab !== 'all'
                ? '해당 기간에 기록된 수입이 없습니다'
                : '+ 버튼을 눌러 첫 수입을 추가하세요'}
            </Text>
          </View>
        }
      />

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsWrap: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 8,
  },
  summaryCount: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  summaryTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 4,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  emptySubText: {
    fontSize: 13,
    color: '#D1D5DB',
    textAlign: 'center',
  },
});
