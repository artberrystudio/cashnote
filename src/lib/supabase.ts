import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IncomeRecord } from '../types';

// ── 클라이언트 설정 ────────────────────────────────────────────
const SUPABASE_URL = 'https://qydsxlzjbtpaadupkdvn.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ZHN4bHpqYnRwYWFkdXBka3ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNDY2MzQsImV4cCI6MjA5MzkyMjYzNH0.BEk6XIDcXVQkxpZ0chKveb-NHODyAJaVquLOZZvlgTo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    ...(Platform.OS !== 'web' && { storage: AsyncStorage as any }),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ── 익명 로그인 (앱 시작 시 1회 호출) ────────────────────────────
export async function ensureAuth(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) return session.user.id;

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    return data.user?.id ?? null;
  } catch (e) {
    console.warn('[Supabase] 인증 실패:', e);
    return null;
  }
}

// ── 이메일 로그인 ──────────────────────────────────────────────
export async function signInWithEmail(email: string, password: string): Promise<string> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(translateAuthError(error.message));
  return data.user?.id ?? '';
}

// ── 이메일 회원가입 → 즉시 로그인까지 처리 ───────────────────
export async function upgradeToEmailAccount(email: string, password: string): Promise<string> {
  // 1) 회원가입
  let signUpData: any, signUpError: any;
  try {
    const result = await supabase.auth.signUp({ email, password });
    signUpData = result.data;
    signUpError = result.error;
  } catch (e: any) {
    throw new Error(translateAuthError(e.message ?? 'Load failed'));
  }
  if (signUpError) {
    // 이미 가입된 경우 → 로그인으로 처리
    if (signUpError.message.includes('already registered') || signUpError.message.includes('already been registered')) {
      throw new Error('이미 등록된 이메일입니다. 로그인 탭을 이용해주세요.');
    }
    throw new Error(translateAuthError(signUpError.message));
  }

  // 2) 이메일 확인 없이 바로 로그인 시도
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (!signInError && signInData.user) {
    return signInData.user.id;
  }

  // 3) 로그인 실패 (이메일 확인 필요) → 확인 요청 안내
  if (signUpData.user) {
    throw new Error('EMAIL_CONFIRM_NEEDED');
  }
  throw new Error('회원가입에 실패했습니다. 다시 시도해주세요.');
}

// ── 로그아웃 ───────────────────────────────────────────────────
export async function signOutUser(): Promise<void> {
  await supabase.auth.signOut();
}

// ── 현재 유저 정보 ─────────────────────────────────────────────
export async function getUserInfo(): Promise<{ id: string | null; email: string | null; isAnonymous: boolean }> {
  const { data: { user } } = await supabase.auth.getUser();
  return {
    id: user?.id ?? null,
    email: user?.email ?? null,
    isAnonymous: user?.is_anonymous ?? true,
  };
}

// ── 에러 메시지 한글화 ─────────────────────────────────────────
function translateAuthError(msg: string): string {
  if (!msg) return '알 수 없는 오류가 발생했습니다.';
  if (msg.includes('Load failed') || msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('network'))
    return '네트워크 연결을 확인해주세요. (Supabase URL 설정이 필요할 수 있습니다)';
  if (msg.includes('Invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않습니다.';
  if (msg.includes('Email not confirmed')) return '이메일 인증이 필요합니다. 받은 편지함을 확인해주세요.';
  if (msg.includes('User already registered') || msg.includes('already been registered')) return '이미 등록된 이메일입니다. 로그인 탭을 이용해주세요.';
  if (msg.includes('Password should be')) return '비밀번호는 6자 이상이어야 합니다.';
  if (msg.includes('Unable to validate email') || msg.includes('valid email')) return '올바른 이메일 형식을 입력해주세요.';
  if (msg.includes('Email rate limit') || msg.includes('rate limit')) return '잠시 후 다시 시도해주세요.';
  if (msg.includes('Anonymous sign-ins are disabled')) return '익명 로그인이 비활성화되어 있습니다. Supabase 대시보드에서 활성화해주세요.';
  return msg;
}

// ── DB row ↔ IncomeRecord 변환 ──────────────────────────────────
type DbRow = {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  category: string;
  date: string;
  memo: string | null;
  created_at: string;
};

export function rowToRecord(row: DbRow): IncomeRecord {
  return {
    id: row.id,
    name: row.name,
    amount: row.amount,
    category: row.category as IncomeRecord['category'],
    date: row.date,
    memo: row.memo ?? undefined,
    createdAt: row.created_at,
  };
}

export function recordToRow(r: IncomeRecord, userId: string): Omit<DbRow, 'created_at'> {
  return {
    id: r.id,
    user_id: userId,
    name: r.name,
    amount: r.amount,
    category: r.category,
    date: r.date,
    memo: r.memo ?? null,
  };
}

// ── CRUD ────────────────────────────────────────────────────────
export async function sbFetchAll(): Promise<IncomeRecord[] | null> {
  try {
    const { data, error } = await supabase
      .from('income_records')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return (data as DbRow[]).map(rowToRecord);
  } catch (e) {
    console.warn('[Supabase] 조회 실패:', e);
    return null;
  }
}

export async function sbInsert(record: IncomeRecord, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('income_records')
      .insert(recordToRow(record, userId));
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[Supabase] 추가 실패:', e);
    return false;
  }
}

export async function sbUpdate(record: IncomeRecord, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('income_records')
      .update(recordToRow(record, userId))
      .eq('id', record.id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[Supabase] 수정 실패:', e);
    return false;
  }
}

export async function sbDelete(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('income_records')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[Supabase] 삭제 실패:', e);
    return false;
  }
}

export async function sbBulkInsert(records: IncomeRecord[], userId: string): Promise<boolean> {
  if (records.length === 0) return true;
  try {
    const { error } = await supabase
      .from('income_records')
      .upsert(records.map((r) => recordToRow(r, userId)), { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[Supabase] 대량 저장 실패:', e);
    return false;
  }
}
