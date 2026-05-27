import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IncomeRecord } from '../types';
import { generateId } from '../utils/format';
import {
  ensureAuth,
  sbFetchAll,
  sbInsert,
  sbUpdate,
  sbDelete,
  sbBulkInsert,
  signInWithEmail,
  upgradeToEmailAccount,
  signOutUser,
  getUserInfo,
} from '../lib/supabase';

const STORAGE_KEY = '@cashnote_records';
const MIGRATION_KEY = '@cashnote_sb_migrated';

// ── 로컬 캐시 ─────────────────────────────────────────────────
async function cacheSet(records: IncomeRecord[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.warn('[Cache] 저장 실패:', e);
  }
}
async function cacheGet(): Promise<IncomeRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r) =>
        r &&
        typeof r.id === 'string' &&
        typeof r.name === 'string' &&
        typeof r.amount === 'number' &&
        typeof r.category === 'string' &&
        typeof r.date === 'string',
    );
  } catch {
    return [];
  }
}

// ── 스토어 타입 ───────────────────────────────────────────────
export type SyncStatus = 'idle' | 'syncing' | 'online' | 'offline';

interface StoreState {
  records: IncomeRecord[];
  isLoaded: boolean;
  syncStatus: SyncStatus;
  userId: string | null;
  userEmail: string | null;
  isAnonymous: boolean;
  saveError: string | null;
  authError: string | null;

  loadRecords: () => Promise<void>;
  addRecord: (data: Omit<IncomeRecord, 'id' | 'createdAt'>) => Promise<boolean>;
  updateRecord: (id: string, data: Omit<IncomeRecord, 'id' | 'createdAt'>) => Promise<boolean>;
  deleteRecord: (id: string) => Promise<boolean>;
  clearSaveError: () => void;
  clearAuthError: () => void;

  // 인증
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  records: [],
  isLoaded: false,
  syncStatus: 'idle',
  userId: null,
  userEmail: null,
  isAnonymous: true,
  saveError: null,
  authError: null,

  clearSaveError: () => set({ saveError: null }),
  clearAuthError: () => set({ authError: null }),

  // ── 초기 로드 ─────────────────────────────────────────────
  loadRecords: async () => {
    set({ syncStatus: 'syncing' });

    // 1) 로컬 캐시 먼저 표시 (빠른 초기 렌더)
    const cached = await cacheGet();
    if (cached.length > 0) {
      set({ records: cached, isLoaded: true });
    }

    // 2) Supabase 인증
    const uid = await ensureAuth();
    if (!uid) {
      set({ isLoaded: true, syncStatus: 'offline' });
      return;
    }

    // 3) 유저 정보 확인
    const info = await getUserInfo();
    set({ userId: uid, userEmail: info.email, isAnonymous: info.isAnonymous });

    // 4) 로컬 데이터 마이그레이션 (최초 1회)
    const migrated = await AsyncStorage.getItem(MIGRATION_KEY);
    if (!migrated && cached.length > 0) {
      await sbBulkInsert(cached, uid);
      await AsyncStorage.setItem(MIGRATION_KEY, '1');
    }

    // 5) Supabase에서 최신 데이터 로드
    const remote = await sbFetchAll();
    if (remote !== null) {
      set({ records: remote, isLoaded: true, syncStatus: 'online' });
      await cacheSet(remote);
    } else {
      set({ isLoaded: true, syncStatus: 'offline' });
    }
  },

  // ── 추가 ─────────────────────────────────────────────────
  addRecord: async (data) => {
    const record: IncomeRecord = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const next = [record, ...get().records];
    set({ records: next });

    const uid = get().userId;
    if (uid) {
      const ok = await sbInsert(record, uid);
      if (!ok) {
        set({ records: get().records.filter((r) => r.id !== record.id), saveError: '저장 실패 — 네트워크를 확인해주세요.' });
        return false;
      }
    }
    await cacheSet(next);
    return true;
  },

  // ── 수정 ─────────────────────────────────────────────────
  updateRecord: async (id, data) => {
    const prev = get().records;
    const updated = prev.find((r) => r.id === id);
    if (!updated) return false;
    const record: IncomeRecord = { ...updated, ...data };
    const next = prev.map((r) => (r.id === id ? record : r));
    set({ records: next });

    const uid = get().userId;
    if (uid) {
      const ok = await sbUpdate(record, uid);
      if (!ok) {
        set({ records: prev, saveError: '수정 저장 실패 — 네트워크를 확인해주세요.' });
        return false;
      }
    }
    await cacheSet(next);
    return true;
  },

  // ── 삭제 ─────────────────────────────────────────────────
  deleteRecord: async (id) => {
    const prev = get().records;
    const next = prev.filter((r) => r.id !== id);
    set({ records: next });

    const uid = get().userId;
    if (uid) {
      const ok = await sbDelete(id);
      if (!ok) {
        set({ records: prev, saveError: '삭제 실패 — 네트워크를 확인해주세요.' });
        return false;
      }
    }
    await cacheSet(next);
    return true;
  },

  // ── 이메일 로그인 ─────────────────────────────────────────
  signIn: async (email, password) => {
    set({ authError: null });
    try {
      const uid = await signInWithEmail(email, password);
      set({ userId: uid, userEmail: email, isAnonymous: false });
      // 로그인 후 해당 계정 데이터 로드
      await get().loadRecords();
      return true;
    } catch (e: any) {
      set({ authError: e.message ?? '로그인 실패' });
      return false;
    }
  },

  // ── 이메일 회원가입 (익명 → 이메일 계정 업그레이드) ──────────
  signUp: async (email, password) => {
    set({ authError: null });
    try {
      const uid = await upgradeToEmailAccount(email, password);
      set({ userId: uid, userEmail: email, isAnonymous: false });
      return true;
    } catch (e: any) {
      set({ authError: e.message ?? '회원가입 실패' });
      return false;
    }
  },

  // ── 로그아웃 ──────────────────────────────────────────────
  signOut: async () => {
    await signOutUser();
    set({ userId: null, userEmail: null, isAnonymous: true, records: [], syncStatus: 'idle' });
    await cacheSet([]);
    await get().loadRecords();
  },
}));
