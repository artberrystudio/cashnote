import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../store/useStore';
import { IncomeRecord } from '../types';
import { formatKRW, getTodayString } from '../utils/format';
import { AuthModal } from '../components/AuthModal';

const STORAGE_KEY = '@cashnote_records';

// ─── Web 전용 헬퍼 ───────────────────────────────────────────
function webDownload(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function webReadFile(): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return reject(new Error('파일을 선택하지 않았습니다.'));
      const text = await file.text();
      resolve(text);
    };
    input.click();
  });
}
// ─────────────────────────────────────────────────────────────

const TAB_BAR_HEIGHT = 64;

const SYNC_LABEL: Record<string, { text: string; color: string; bg: string }> = {
  online:  { text: '● Supabase 연결됨', color: '#059669', bg: '#D1FAE5' },
  offline: { text: '● 오프라인 (로컬 저장)',  color: '#D97706', bg: '#FEF3C7' },
  syncing: { text: '↻ 동기화 중…',      color: '#2563EB', bg: '#DBEAFE' },
  idle:    { text: '— 대기 중',          color: '#9CA3AF', bg: '#F3F4F6' },
};

export function SettingsScreen() {
  const { records, loadRecords, syncStatus, userId, userEmail, isAnonymous, signOut } = useStore();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState<string | null>(null);
  const [authModal, setAuthModal] = useState<{ visible: boolean; tab: 'login' | 'signup' }>({
    visible: false,
    tab: 'login',
  });

  const totalAmount = records.reduce((s, r) => s + r.amount, 0);
  const sync = SYNC_LABEL[syncStatus] ?? SYNC_LABEL.idle;

  // ── 새로고침 ──────────────────────────────────────────────
  const handleRefresh = async () => {
    setLoading('refresh');
    await loadRecords();
    setLoading(null);
    Alert.alert('완료', '데이터를 새로 불러왔습니다.');
  };

  // ── 캐시 지우기 ───────────────────────────────────────────
  const handleClearCache = () => {
    Alert.alert(
      '캐시 지우기',
      '앱의 임시 데이터를 정리합니다.\n저장된 수입 기록은 삭제되지 않습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '지우기',
          style: 'destructive',
          onPress: async () => {
            setLoading('cache');
            try {
              const allKeys = await AsyncStorage.getAllKeys();
              const cacheKeys = allKeys.filter(
                (k) => k !== STORAGE_KEY && k.startsWith('@cashnote_')
              );
              for (const k of cacheKeys) {
                await AsyncStorage.removeItem(k);
              }
              await loadRecords();
            } finally {
              setLoading(null);
            }
            Alert.alert('완료', '캐시가 정리되었습니다.');
          },
        },
      ]
    );
  };

  // ── 로그아웃 ──────────────────────────────────────────────
  const handleSignOut = () => {
    Alert.alert(
      '로그아웃',
      '로그아웃하면 이 기기에서 데이터가 초기화됩니다.\n다시 로그인하면 데이터가 복원됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            setLoading('signout');
            await signOut();
            setLoading(null);
          },
        },
      ]
    );
  };

  // ── 전체 데이터 삭제 ──────────────────────────────────────
  const handleDeleteAll = () => {
    Alert.alert(
      '⚠️ 전체 데이터 삭제',
      `수입 기록 ${records.length}건이 모두 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.\n\n백업 후 삭제를 권장합니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            setLoading('delete');
            await AsyncStorage.removeItem(STORAGE_KEY);
            await loadRecords();
            setLoading(null);
            Alert.alert('완료', '모든 데이터가 삭제되었습니다.');
          },
        },
      ]
    );
  };

  // ── 백업 내보내기 ─────────────────────────────────────────
  const handleExport = async () => {
    if (records.length === 0) {
      Alert.alert('알림', '내보낼 기록이 없습니다.');
      return;
    }
    setLoading('export');
    try {
      const backup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        count: records.length,
        records,
      };
      const json = JSON.stringify(backup, null, 2);
      const filename = `cashnote-backup-${getTodayString()}.json`;

      if (Platform.OS === 'web') {
        webDownload(filename, json);
        Alert.alert('백업 완료', `${records.length}건의 기록이 다운로드되었습니다.`);
      } else {
        const path = FileSystem.documentDirectory + filename;
        await FileSystem.writeAsStringAsync(path, json, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(path, {
            mimeType: 'application/json',
            dialogTitle: 'CashNote 백업 저장',
          });
        } else {
          Alert.alert('백업 완료', `파일 저장됨: ${path}`);
        }
      }
    } catch (e: any) {
      Alert.alert('오류', `백업 실패: ${e.message}`);
    } finally {
      setLoading(null);
    }
  };

  // ── 백업 불러오기 ─────────────────────────────────────────
  const handleImport = async () => {
    setLoading('import');
    try {
      let json: string;

      if (Platform.OS === 'web') {
        json = await webReadFile();
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'application/json',
          copyToCacheDirectory: true,
        });
        if (result.canceled || !result.assets?.[0]) {
          setLoading(null);
          return;
        }
        json = await FileSystem.readAsStringAsync(result.assets[0].uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      }

      const backup = JSON.parse(json);
      if (!backup.records || !Array.isArray(backup.records)) {
        throw new Error('올바른 CashNote 백업 파일이 아닙니다.');
      }

      const incoming: IncomeRecord[] = backup.records;
      const validFields = ['id', 'name', 'amount', 'category', 'date', 'createdAt'];
      const isValid = incoming.every((r) => validFields.every((f) => f in r));
      if (!isValid) throw new Error('백업 데이터 형식이 올바르지 않습니다.');

      setLoading(null);

      Alert.alert(
        '백업 불러오기',
        `백업 파일에 ${incoming.length}건이 있습니다.\n현재 기록(${records.length}건)에 어떻게 합칠까요?`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '병합 (중복 제외)',
            onPress: async () => {
              setLoading('import');
              const existingIds = new Set(records.map((r) => r.id));
              const newRecords = incoming.filter((r) => !existingIds.has(r.id));
              const merged = [...records, ...newRecords].sort(
                (a, b) => (b.date > a.date ? 1 : -1)
              );
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
              await loadRecords();
              setLoading(null);
              Alert.alert('완료', `${newRecords.length}건 추가되었습니다.`);
            },
          },
          {
            text: '덮어쓰기',
            style: 'destructive',
            onPress: async () => {
              setLoading('import');
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(incoming));
              await loadRecords();
              setLoading(null);
              Alert.alert('완료', `${incoming.length}건으로 복원되었습니다.`);
            },
          },
        ]
      );
    } catch (e: any) {
      setLoading(null);
      Alert.alert('오류', e.message ?? '파일을 읽을 수 없습니다.');
    }
  };

  // ─── UI ───────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>설정</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 16 },
        ]}
      >
        {/* 동기화 상태 */}
        <View style={[styles.syncBadge, { backgroundColor: sync.bg }]}>
          <Text style={[styles.syncText, { color: sync.color }]}>{sync.text}</Text>
          {userId ? (
            <Text style={styles.syncUid} numberOfLines={1}>ID: {userId.slice(0, 8)}…</Text>
          ) : null}
        </View>

        {/* ── 계정 섹션 ─────────────────────────────────── */}
        <Text style={styles.sectionLabel}>계정</Text>

        {isAnonymous ? (
          /* 비로그인 상태 */
          <View style={styles.accountCard}>
            <View style={styles.accountIconWrap}>
              <Ionicons name="person-outline" size={28} color="#9CA3AF" />
            </View>
            <Text style={styles.accountTitle}>로그인하지 않은 상태</Text>
            <Text style={styles.accountDesc}>
              이메일 계정을 연동하면 어떤 기기에서도{'\n'}
              로그인해서 데이터를 불러올 수 있습니다.
            </Text>
            <View style={styles.accountBtns}>
              <TouchableOpacity
                style={styles.accountBtnPrimary}
                onPress={() => setAuthModal({ visible: true, tab: 'signup' })}
              >
                <Ionicons name="person-add-outline" size={16} color="#FFFFFF" />
                <Text style={styles.accountBtnPrimaryText}>회원가입</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.accountBtnSecondary}
                onPress={() => setAuthModal({ visible: true, tab: 'login' })}
              >
                <Ionicons name="log-in-outline" size={16} color="#059669" />
                <Text style={styles.accountBtnSecondaryText}>로그인</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* 로그인 상태 */
          <View style={styles.group}>
            <View style={styles.loggedInRow}>
              <View style={[styles.rowIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="person-circle-outline" size={20} color="#059669" />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>{userEmail}</Text>
                <Text style={styles.rowSub}>이메일 계정으로 로그인됨</Text>
              </View>
            </View>
            <Separator />
            <SettingsRow
              icon="log-out-outline"
              iconColor="#EF4444"
              iconBg="#FEE2E2"
              title="로그아웃"
              subtitle="다른 계정으로 전환하거나 로그아웃합니다"
              onPress={handleSignOut}
              loading={loading === 'signout'}
              danger
            />
          </View>
        )}

        {/* 데이터 요약 */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{records.length}</Text>
            <Text style={styles.statLabel}>전체 기록</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
              {formatKRW(totalAmount)}
            </Text>
            <Text style={styles.statLabel}>총 수입</Text>
          </View>
        </View>

        {/* 앱 섹션 */}
        <Text style={styles.sectionLabel}>앱</Text>
        <View style={styles.group}>
          <SettingsRow
            icon="refresh-outline"
            iconColor="#2563EB"
            iconBg="#DBEAFE"
            title="새로고침"
            subtitle="저장된 데이터를 다시 불러옵니다"
            onPress={handleRefresh}
            loading={loading === 'refresh'}
          />
          <Separator />
          <SettingsRow
            icon="trash-outline"
            iconColor="#D97706"
            iconBg="#FEF3C7"
            title="캐시 지우기"
            subtitle="임시 데이터를 정리합니다 (기록 유지)"
            onPress={handleClearCache}
            loading={loading === 'cache'}
          />
        </View>

        {/* 백업 섹션 */}
        <Text style={styles.sectionLabel}>백업 & 복원</Text>
        <View style={styles.group}>
          <SettingsRow
            icon="download-outline"
            iconColor="#059669"
            iconBg="#D1FAE5"
            title="백업 내보내기"
            subtitle="모든 기록을 JSON 파일로 저장합니다"
            onPress={handleExport}
            loading={loading === 'export'}
            badge={records.length > 0 ? `${records.length}건` : undefined}
          />
          <Separator />
          <SettingsRow
            icon="cloud-upload-outline"
            iconColor="#7C3AED"
            iconBg="#EDE9FE"
            title="백업 불러오기"
            subtitle="JSON 백업 파일에서 복원합니다"
            onPress={handleImport}
            loading={loading === 'import'}
          />
        </View>

        {/* 위험 섹션 */}
        <Text style={styles.sectionLabel}>데이터</Text>
        <View style={styles.group}>
          <SettingsRow
            icon="warning-outline"
            iconColor="#EF4444"
            iconBg="#FEE2E2"
            title="전체 데이터 삭제"
            subtitle="모든 수입 기록을 완전히 삭제합니다"
            onPress={handleDeleteAll}
            loading={loading === 'delete'}
            danger
          />
        </View>

        <Text style={styles.footer}>CashNote v1.0.0</Text>
      </ScrollView>

      {/* 이메일 인증 모달 */}
      <AuthModal
        visible={authModal.visible}
        onClose={() => setAuthModal({ visible: false, tab: 'login' })}
        initialTab={authModal.tab}
      />
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────

function Separator() {
  return <View style={styles.sep} />;
}

interface RowProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  loading?: boolean;
  badge?: string;
  danger?: boolean;
}

function SettingsRow({
  icon, iconColor, iconBg, title, subtitle,
  onPress, loading, badge, danger,
}: RowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.65}
      disabled={!!loading}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, danger && styles.rowTitleDanger]}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      {loading ? (
        <ActivityIndicator size="small" color="#9CA3AF" />
      ) : badge ? (
        <View style={styles.badgeWrap}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
      )}
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  scroll: { flex: 1 },
  content: { paddingTop: 16, paddingHorizontal: 16 },

  // 계정 카드 (비로그인)
  accountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  accountIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  accountTitle: { fontSize: 15, fontWeight: '700', color: '#374151' },
  accountDesc: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 19,
  },
  accountBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    width: '100%',
  },
  accountBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
  },
  accountBtnPrimaryText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  accountBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
  },
  accountBtnSecondaryText: { fontSize: 14, fontWeight: '700', color: '#059669' },

  // 로그인 상태 row
  loggedInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },

  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  divider: { width: 1, backgroundColor: '#F3F4F6', marginVertical: 4 },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  group: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  sep: { height: 1, backgroundColor: '#F9FAFB', marginLeft: 68 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowContent: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  rowTitleDanger: { color: '#EF4444' },
  rowSub: { fontSize: 12, color: '#9CA3AF' },

  badgeWrap: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#059669' },

  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  syncText: { fontSize: 13, fontWeight: '600' },
  syncUid: { fontSize: 11, color: '#9CA3AF' },

  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#D1D5DB',
    marginTop: 8,
  },
});
