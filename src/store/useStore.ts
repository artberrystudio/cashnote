import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IncomeRecord, Category } from '../types';
import { generateId, getTodayString } from '../utils/format';

const STORAGE_KEY = '@cashnote_records';

interface StoreState {
  records: IncomeRecord[];
  isLoaded: boolean;
  loadRecords: () => Promise<void>;
  addRecord: (data: Omit<IncomeRecord, 'id' | 'createdAt'>) => Promise<void>;
  updateRecord: (id: string, data: Omit<IncomeRecord, 'id' | 'createdAt'>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
}

async function persist(records: IncomeRecord[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export const useStore = create<StoreState>((set, get) => ({
  records: [],
  isLoaded: false,

  loadRecords: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const records: IncomeRecord[] = raw ? JSON.parse(raw) : [];
      set({ records, isLoaded: true });
    } catch {
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
    set({ records: next });
    await persist(next);
  },

  updateRecord: async (id, data) => {
    const next = get().records.map((r) =>
      r.id === id ? { ...r, ...data } : r
    );
    set({ records: next });
    await persist(next);
  },

  deleteRecord: async (id) => {
    const next = get().records.filter((r) => r.id !== id);
    set({ records: next });
    await persist(next);
  },
}));
