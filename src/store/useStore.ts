import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IncomeRecord } from '../types';
import { generateId } from '../utils/format';

const STORAGE_KEY = '@cashnote_records';

// ── 저장 재시도 ───────────────────────────────────────────────
async function persist(records: IncomeRecord[]): Promise<void> {
  const json = JSON.stringify(records);

  // 1차 시도
  try {
    await AsyncStorage.setItem(STORAGE_KEY, json);
    return;
  } catch (e) {
    console.warn('[CashNote] 1차 저장 실패, 재시도…', e);
  }

  // 2차 시도 (100ms 후)
  await new Promise((r) => setTimeout(r, 100));
  try {
    await AsyncStorage.setItem(STORAGE_KEY, json);
    return;
  } catch (e) {
    console.error('[CashNote] 저장 최종 실패 — 데이터 손실 위험', e);
    throw e; // 호출부에서 Alert 처리
  }
}

// ── 안전한 JSON 파싱 ──────────────────────────────────────────
function safeParse(raw: string | null): IncomeRecord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // 필수 필드 검증
    return parsed.filter(
      (r) =>
        r &&
        typeof r.id === 'string' &&
        typeof r.name === 'string' &&
        typeof r.amount === 'number' &&
        typeof r.category === 'string' &&
        typeof r.date === 'string'
    );
  } catch {
    return [];
  }
}

interface StoreState {
  records: IncomeRecord[];
  isLoaded: boolean;
  saveError: string | null;
  loadRecords: () => Promise<void>;
  addRecord: (data: Omit<IncomeRecord, 'id' | 'createdAt'>) => Promise<boolean>;
  updateRecord: (id: string, data: Omit<IncomeRecord, 'id' | 'createdAt'>) => Promise<boolean>;
  deleteRecord: (id: string) => Promise<boolean>;
  clearSaveError: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
  records: [],
  isLoaded: false,
  saveError: null,

  clearSaveError: () => set({ saveError: null }),

  loadRecords: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const records = safeParse(raw);
      set({ records, isLoaded: true });
    } catch (e) {
      console.error('[CashNote] 데이터 불러오기 실패', e);
      set({ records: [], isLoaded: true });
    }
  },

  addRecord: async (data) => {
    const record: IncomeRecord = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const next = [record, ...get().records];
    set({ records: next }); // 즉시 UI 반영
    try {
      await persist(next);
      return true;
    } catch {
      // 롤백
      set({ records: get().records.filter((r) => r.id !== record.id), saveError: '저장 실패: 저장 공간을 확인해주세요.' });
      return false;
    }
  },

  updateRecord: async (id, data) => {
    const prev = get().records;
    const next = prev.map((r) => (r.id === id ? { ...r, ...data } : r));
    set({ records: next });
    try {
      await persist(next);
      return true;
    } catch {
      set({ records: prev, saveError: '수정 저장 실패: 저장 공간을 확인해주세요.' });
      return false;
    }
  },

  deleteRecord: async (id) => {
    const prev = get().records;
    const next = prev.filter((r) => r.id !== id);
    set({ records: next });
    try {
      await persist(next);
      return true;
    } catch {
      set({ records: prev, saveError: '삭제 저장 실패' });
      return false;
    }
  },
}));
