import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category, IncomeRecord } from '../types';
import { CATEGORIES, CATEGORY_LIST } from '../utils/categories';
import { getTodayString, formatDisplayDate } from '../utils/format';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Omit<IncomeRecord, 'id' | 'createdAt'>) => void;
  editRecord?: IncomeRecord | null;
}

function parseDateParts(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return { year: y, month: m, day: d };
}

export function AddRecordModal({ visible, onClose, onSave, editRecord }: Props) {
  const [name, setName] = useState('');
  const [amountText, setAmountText] = useState('');
  const [category, setCategory] = useState<Category>('freelance');
  const [date, setDate] = useState(getTodayString());
  const [memo, setMemo] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDateParts, setTempDateParts] = useState(parseDateParts(getTodayString()));

  useEffect(() => {
    if (visible) {
      if (editRecord) {
        setName(editRecord.name);
        setAmountText(String(editRecord.amount));
        setCategory(editRecord.category);
        setDate(editRecord.date);
        setMemo(editRecord.memo ?? '');
      } else {
        const today = getTodayString();
        setName('');
        setAmountText('');
        setCategory('freelance');
        setDate(today);
        setMemo('');
      }
    }
  }, [visible, editRecord]);

  const handleAmountChange = (text: string) => {
    // Allow only digits
    const digits = text.replace(/[^0-9]/g, '');
    setAmountText(digits);
  };

  const getFormattedAmount = () => {
    if (!amountText) return '';
    return Number(amountText).toLocaleString('ko-KR');
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('알림', '활동명을 입력해주세요.');
      return;
    }
    const amount = parseInt(amountText, 10);
    if (!amountText || isNaN(amount) || amount <= 0) {
      Alert.alert('알림', '금액을 올바르게 입력해주세요.');
      return;
    }
    onSave({ name: name.trim(), amount, category, date, memo: memo.trim() || undefined });
    onClose();
  };

  const openDatePicker = () => {
    setTempDateParts(parseDateParts(date));
    setShowDatePicker(true);
  };

  const confirmDate = () => {
    const { year, month, day } = tempDateParts;
    const m = String(month).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    setDate(`${year}-${m}-${d}`);
    setShowDatePicker(false);
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const daysInMonth = getDaysInMonth(tempDateParts.year, tempDateParts.month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.sheetWrapper}
      >
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <Text style={styles.headerTitle}>
              {editRecord ? '수입 수정' : '새 수입 추가'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Activity name */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>활동명</Text>
              <TextInput
                style={styles.input}
                placeholder="예: 웹사이트 개발 프리랜서"
                placeholderTextColor="#D1D5DB"
                value={name}
                onChangeText={setName}
                returnKeyType="next"
              />
            </View>

            {/* Amount */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>금액 (₩)</Text>
              <View style={styles.amountWrap}>
                <Text style={styles.wonSign}>₩</Text>
                <TextInput
                  style={[styles.input, styles.amountInput]}
                  placeholder="0"
                  placeholderTextColor="#D1D5DB"
                  keyboardType="numeric"
                  value={amountText ? getFormattedAmount() : ''}
                  onChangeText={handleAmountChange}
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Category */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>카테고리</Text>
              <View style={styles.categoryGrid}>
                {CATEGORY_LIST.map((cat) => {
                  const cfg = CATEGORIES[cat];
                  const selected = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.catItem,
                        selected && {
                          backgroundColor: cfg.bgColor,
                          borderColor: cfg.color,
                        },
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Ionicons
                        name={cfg.icon as any}
                        size={18}
                        color={selected ? cfg.color : '#9CA3AF'}
                      />
                      <Text
                        style={[
                          styles.catLabel,
                          selected && { color: cfg.color, fontWeight: '700' },
                        ]}
                      >
                        {cfg.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Date */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>날짜</Text>
              <TouchableOpacity style={styles.datePicker} onPress={openDatePicker}>
                <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                <Text style={styles.dateText}>{formatDisplayDate(date)}</Text>
                <Ionicons name="chevron-down" size={16} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            </View>

            {/* Memo */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>메모 (선택)</Text>
              <TextInput
                style={[styles.input, styles.memoInput]}
                placeholder="간단한 메모를 남겨보세요"
                placeholderTextColor="#D1D5DB"
                value={memo}
                onChangeText={setMemo}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Save button */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Ionicons name="checkmark" size={20} color="#FFF" />
              <Text style={styles.saveBtnText}>저장하기</Text>
            </TouchableOpacity>
            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowDatePicker(false)} />
        <View style={styles.datePickerModal}>
          <Text style={styles.datePickerTitle}>날짜 선택</Text>
          <View style={styles.wheelRow}>
            {/* Year */}
            <View style={styles.wheelCol}>
              <Text style={styles.wheelHeader}>년</Text>
              <ScrollView style={styles.wheel} showsVerticalScrollIndicator={false}>
                {years.map((y) => (
                  <TouchableOpacity
                    key={y}
                    style={[styles.wheelItem, tempDateParts.year === y && styles.wheelItemActive]}
                    onPress={() => setTempDateParts((p) => ({ ...p, year: y }))}
                  >
                    <Text style={[styles.wheelItemText, tempDateParts.year === y && styles.wheelItemTextActive]}>
                      {y}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            {/* Month */}
            <View style={styles.wheelCol}>
              <Text style={styles.wheelHeader}>월</Text>
              <ScrollView style={styles.wheel} showsVerticalScrollIndicator={false}>
                {months.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.wheelItem, tempDateParts.month === m && styles.wheelItemActive]}
                    onPress={() => setTempDateParts((p) => ({ ...p, month: m, day: Math.min(p.day, getDaysInMonth(p.year, m)) }))}
                  >
                    <Text style={[styles.wheelItemText, tempDateParts.month === m && styles.wheelItemTextActive]}>
                      {m}월
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            {/* Day */}
            <View style={styles.wheelCol}>
              <Text style={styles.wheelHeader}>일</Text>
              <ScrollView style={styles.wheel} showsVerticalScrollIndicator={false}>
                {days.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.wheelItem, tempDateParts.day === d && styles.wheelItemActive]}
                    onPress={() => setTempDateParts((p) => ({ ...p, day: d }))}
                  >
                    <Text style={[styles.wheelItemText, tempDateParts.day === d && styles.wheelItemTextActive]}>
                      {d}일
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
          <View style={styles.datePickerBtns}>
            <TouchableOpacity
              style={[styles.datePickerBtn, styles.datePickerCancel]}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.datePickerCancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.datePickerBtn, styles.datePickerConfirm]}
              onPress={confirmDate}
            >
              <Text style={styles.datePickerConfirmText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    position: 'relative',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    top: 26,
    padding: 4,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  field: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  wonSign: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '700',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 12,
  },
  memoInput: {
    height: 80,
    paddingTop: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  catLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateText: {
    fontSize: 15,
    color: '#111827',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 8,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Date picker modal
  datePickerModal: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  wheelRow: {
    flexDirection: 'row',
    gap: 8,
    height: 200,
  },
  wheelCol: {
    flex: 1,
    alignItems: 'center',
  },
  wheelHeader: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 4,
  },
  wheel: {
    flex: 1,
    width: '100%',
  },
  wheelItem: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  wheelItemActive: {
    backgroundColor: '#D1FAE5',
  },
  wheelItemText: {
    fontSize: 14,
    color: '#6B7280',
  },
  wheelItemTextActive: {
    color: '#059669',
    fontWeight: '700',
  },
  datePickerBtns: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  datePickerBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  datePickerCancel: {
    backgroundColor: '#F3F4F6',
  },
  datePickerCancelText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  datePickerConfirm: {
    backgroundColor: '#059669',
  },
  datePickerConfirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
