export type Category =
  | 'freelance'
  | 'content'
  | 'invest'
  | 'sales'
  | 'consult'
  | 'other';

export interface IncomeRecord {
  id: string;
  name: string;
  amount: number;
  category: Category;
  date: string;      // YYYY-MM-DD
  memo?: string;
  createdAt: string;
}

export type FilterTab = 'all' | 'today' | 'week' | 'month';
