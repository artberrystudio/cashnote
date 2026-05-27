import { Category } from '../types';

export interface CategoryConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: string; // Ionicons name
}

export const CATEGORIES: Record<Category, CategoryConfig> = {
  freelance: {
    label: '프리랜서',
    color: '#0D9488',
    bgColor: '#CCFBF1',
    icon: 'laptop-outline',
  },
  content: {
    label: '콘텐츠',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    icon: 'videocam-outline',
  },
  invest: {
    label: '투자',
    color: '#2563EB',
    bgColor: '#DBEAFE',
    icon: 'trending-up-outline',
  },
  sales: {
    label: '판매',
    color: '#D97706',
    bgColor: '#FEF3C7',
    icon: 'cart-outline',
  },
  consult: {
    label: '컨설팅',
    color: '#E85D4A',
    bgColor: '#FFE4E0',
    icon: 'people-outline',
  },
  other: {
    label: '기타',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    icon: 'ellipsis-horizontal-outline',
  },
};

export const CATEGORY_LIST: Category[] = [
  'freelance',
  'content',
  'invest',
  'sales',
  'consult',
  'other',
];
