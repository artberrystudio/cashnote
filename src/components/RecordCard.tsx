import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IncomeRecord } from '../types';
import { CATEGORIES } from '../utils/categories';
import { formatKRW, formatDisplayDate } from '../utils/format';
import { CategoryBadge } from './CategoryBadge';

interface Props {
  record: IncomeRecord;
  onDelete: (id: string) => void;
  onEdit?: (record: IncomeRecord) => void;
}

export function RecordCard({ record, onDelete, onEdit }: Props) {
  const cfg = CATEGORIES[record.category];

  const handleDelete = () => {
    Alert.alert('삭제', `"${record.name}" 항목을 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => onDelete(record.id),
      },
    ]);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onEdit?.(record)}
      activeOpacity={0.7}
    >
      {/* Left icon */}
      <View style={[styles.iconWrap, { backgroundColor: cfg.bgColor }]}>
        <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
      </View>

      {/* Middle content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {record.name}
        </Text>
        <View style={styles.row}>
          <CategoryBadge category={record.category} size="sm" />
          <Text style={styles.date}>{formatDisplayDate(record.date)}</Text>
        </View>
        {record.memo ? (
          <Text style={styles.memo} numberOfLines={1}>
            {record.memo}
          </Text>
        ) : null}
      </View>

      {/* Right: amount + delete */}
      <View style={styles.right}>
        <Text style={styles.amount}>{formatKRW(record.amount)}</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  date: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  memo: {
    fontSize: 12,
    color: '#6B7280',
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
    flexShrink: 0,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#059669',
  },
  deleteBtn: {
    padding: 2,
  },
});
