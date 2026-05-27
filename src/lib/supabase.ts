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
    // 네이티브에서는 AsyncStorage, 웹에서는 localStorage(기본값) 사용
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
