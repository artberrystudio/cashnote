import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';

interface Props {
  visible: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'signup';
}

type Tab = 'login' | 'signup';

export function AuthModal({ visible, onClose, initialTab = 'login' }: Props) {
  const { signIn, signUp, authError, clearAuthError } = useStore();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const reset = () => {
    setEmail('');
    setPassword('');
    setShowPw(false);
    setLoading(false);
    setSuccessMsg('');
    clearAuthError();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleTabChange = (t: Tab) => {
    setTab(t);
    setSuccessMsg('');
    clearAuthError();
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    setSuccessMsg('');
    clearAuthError();

    if (tab === 'login') {
      const ok = await signIn(email.trim(), password);
      setLoading(false);
      if (ok) {
        setSuccessMsg('로그인 되었습니다! 🎉');
        setTimeout(() => handleClose(), 1200);
      }
    } else {
      const ok = await signUp(email.trim(), password);
      setLoading(false);
      if (ok) {
        setSuccessMsg('가입 완료! 🎉\n이제 어떤 기기에서도 이 이메일로\n로그인하면 데이터가 동기화됩니다.');
        setTimeout(() => handleClose(), 1800);
      } else if (authError === 'EMAIL_CONFIRM_NEEDED') {
        // 이메일 확인 필요 케이스
        setSuccessMsg(`📧 가입 완료!\n${email} 로 인증 링크를 보냈습니다.\n이메일 확인 후 로그인해주세요.`);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kvWrap}
        >
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            {/* 헤더 */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>계정</Text>
              <TouchableOpacity onPress={handleClose} hitSlop={12}>
                <Ionicons name="close" size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* 탭 */}
            <View style={styles.tabs}>
              {(['login', 'signup'] as Tab[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tab, tab === t && styles.tabActive]}
                  onPress={() => handleTabChange(t)}
                >
                  <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                    {t === 'login' ? '로그인' : '회원가입'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 설명 */}
            <Text style={styles.desc}>
              {tab === 'login'
                ? '다른 기기에서 같은 계정으로 로그인하면\n데이터가 자동으로 불러와집니다.'
                : '이메일 계정을 연동하면 어떤 기기에서도\n로그인해서 데이터를 불러올 수 있습니다.'}
            </Text>

            {/* 입력 */}
            <View style={styles.fields}>
              <View style={styles.fieldWrap}>
                <Ionicons name="mail-outline" size={18} color="#9CA3AF" style={styles.fieldIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="이메일"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
              <View style={styles.fieldWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={styles.fieldIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="비밀번호 (6자 이상)"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowPw(!showPw)} hitSlop={8}>
                  <Ionicons
                    name={showPw ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* 에러 */}
            {authError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={15} color="#EF4444" />
                <Text style={styles.errorText}>{authError}</Text>
              </View>
            ) : null}

            {/* 성공 */}
            {successMsg ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>{successMsg}</Text>
              </View>
            ) : null}

            {/* 버튼 */}
            <TouchableOpacity
              style={[styles.btn, (!email.trim() || !password || loading) && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={!email.trim() || !password || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.btnText}>
                  {tab === 'login' ? '로그인' : '계정 연동하기'}
                </Text>
              )}
            </TouchableOpacity>

            {tab === 'signup' && (
              <Text style={styles.hint}>
                * 회원가입 시 이메일 인증 링크가 발송될 수 있습니다
              </Text>
            )}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  kvWrap: { width: '100%', maxWidth: 420 },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },

  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9 },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  tabTextActive: { color: '#111827', fontWeight: '700' },

  desc: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
    marginBottom: 20,
  },

  fields: { gap: 10, marginBottom: 16 },
  fieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'web' ? 10 : 0,
    backgroundColor: '#F9FAFB',
    gap: 8,
  },
  fieldIcon: { flexShrink: 0 },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    paddingVertical: Platform.OS === 'web' ? 0 : 12,
    outlineStyle: 'none',
  } as any,

  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorText: { flex: 1, fontSize: 13, color: '#EF4444', lineHeight: 18 },

  successBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  successText: { fontSize: 13, color: '#059669', lineHeight: 19 },

  btn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: '#D1FAE5' },
  btnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  hint: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 10,
  },
});
