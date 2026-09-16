import { ClientApprovalStatus, ItemCategory, ItemStatus } from '../types';

export function formatCurrency(amount: number): string {
  return (
    new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(Math.round(amount || 0)) + ' ₸'
  );
}

/**
 * Calculates price with supplier discount
 */
export function calcDiscountedPrice(basePrice: number, discountPercent: number): number {
  const discount = Math.max(0, Math.min(100, discountPercent || 0));
  return Math.round(basePrice * (1 - discount / 100));
}

/**
 * Calculates total position amount
 */
export function calcItemTotal(basePrice: number, discountPercent: number, quantity: number): number {
  const unitPrice = calcDiscountedPrice(basePrice, discountPercent);
  return Math.round(unitPrice * (quantity || 0));
}

/**
 * Format dimensions input: automatically inserts " × " on typing space after digits
 * Example: "2800 " -> "2800 × "
 * "2800 × 1200 " -> "2800 × 1200 × "
 */
export function formatDimensionsInput(value: string, prevValue: string = ''): string {
  // If user is deleting text (backspace), don't aggressively re-append
  if (value.length < prevValue.length) {
    return value;
  }

  // If user just typed a space after numbers or 'x'/'X'/'х'/'Х'
  // replace Latin/Cyrillic x with proper multiplication sign ×
  let formatted = value.replace(/([0-9])\s*(?:x|X|х|Х)\s*/g, '$1 × ');

  // If the string ends with digits followed by a space and not already followed by ×
  if (/[0-9]+\s$/.test(value) && !/×\s$/.test(value)) {
    formatted = value.replace(/([0-9]+)\s$/, '$1 × ');
  }

  return formatted;
}

export interface StatusMeta {
  key: ItemStatus;
  label: string;
  bg: string;
  text: string;
  dot: string;
  border: string;
}

export const STATUS_CONFIG: Record<ItemStatus, StatusMeta> = {
  in_selection: {
    key: 'in_selection',
    label: 'В подборе / Идея',
    bg: 'bg-amber-950/40',
    text: 'text-amber-300',
    dot: 'bg-amber-400',
    border: 'border-amber-800/40',
  },
  approved: {
    key: 'approved',
    label: 'Согласовано',
    bg: 'bg-sky-950/50',
    text: 'text-sky-300',
    dot: 'bg-sky-400',
    border: 'border-sky-800/40',
  },
  invoice_issued: {
    key: 'invoice_issued',
    label: 'Счёт выставлен',
    bg: 'bg-purple-950/40',
    text: 'text-purple-300',
    dot: 'bg-purple-400',
    border: 'border-purple-800/40',
  },
  paid_in_production: {
    key: 'paid_in_production',
    label: 'Оплачено / В производстве',
    bg: 'bg-amber-900/40',
    text: 'text-amber-200',
    dot: 'bg-amber-500',
    border: 'border-amber-700/40',
  },
  shipping: {
    key: 'shipping',
    label: 'В доставке',
    bg: 'bg-indigo-950/40',
    text: 'text-indigo-300',
    dot: 'bg-indigo-400',
    border: 'border-indigo-800/40',
  },
  on_site: {
    key: 'on_site',
    label: 'На объекте',
    bg: 'bg-teal-950/40',
    text: 'text-teal-300',
    dot: 'bg-teal-400',
    border: 'border-teal-800/40',
  },
  installed: {
    key: 'installed',
    label: 'Смонтировано',
    bg: 'bg-emerald-950/40',
    text: 'text-emerald-300',
    dot: 'bg-emerald-400',
    border: 'border-emerald-800/40',
  },
};

export const CATEGORY_COLORS: Record<ItemCategory, { bg: string; text: string }> = {
  'Мебель': { bg: 'bg-purple-950/60 text-purple-300 border border-purple-800/50', text: 'text-purple-300' },
  'Столярные изделия': { bg: 'bg-amber-950/70 text-amber-300 border border-amber-800/50', text: 'text-amber-300' },
  'Освещение': { bg: 'bg-yellow-950/60 text-yellow-300 border border-yellow-800/50', text: 'text-yellow-300' },
  'Отделочные материалы': { bg: 'bg-teal-950/60 text-teal-300 border border-teal-800/50', text: 'text-teal-300' },
  'Бытовая техника': { bg: 'bg-rose-950/60 text-rose-300 border border-rose-800/50', text: 'text-rose-300' },
  'Сантехника': { bg: 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/50', text: 'text-cyan-300' },
  'Двери': { bg: 'bg-orange-950/60 text-orange-300 border border-orange-800/50', text: 'text-orange-300' },
  'Декор и текстиль': { bg: 'bg-pink-950/60 text-pink-300 border border-pink-800/50', text: 'text-pink-300' },
  'Отопление и климат': { bg: 'bg-blue-950/60 text-blue-300 border border-blue-800/50', text: 'text-blue-300' },
  'Прочее': { bg: 'bg-slate-800/60 text-slate-300 border border-slate-700', text: 'text-slate-300' },
};

export const UNITS = ['шт', 'компл.', 'уп.', 'м²', 'пог. м', 'л', 'комплект'];

export const CLIENT_STATUS_CONFIG: Record<ClientApprovalStatus, {
  label: string;
  shortLabel: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
  icon: string;
}> = {
  pending: {
    label: 'На рассмотрении заказчика',
    shortLabel: 'На рассмотрении',
    bg: 'bg-slate-800/70',
    text: 'text-slate-300',
    border: 'border-slate-700',
    dot: 'bg-slate-400',
    icon: '⏳',
  },
  approved: {
    label: 'Согласовано заказчиком',
    shortLabel: 'Согласовано',
    bg: 'bg-emerald-950/70',
    text: 'text-emerald-300',
    border: 'border-emerald-600/50',
    dot: 'bg-emerald-400',
    icon: '✅',
  },
  attention: {
    label: 'Обратить внимание / Вопрос',
    shortLabel: 'Вопрос клиента',
    bg: 'bg-amber-950/70',
    text: 'text-amber-300',
    border: 'border-amber-600/60',
    dot: 'bg-amber-400',
    icon: '⚠️',
  },
  change_requested: {
    label: 'Запросить замену / аналог',
    shortLabel: 'Нужна замена',
    bg: 'bg-rose-950/70',
    text: 'text-rose-300',
    border: 'border-rose-600/60',
    dot: 'bg-rose-400',
    icon: '🔄',
  },
};

export const CATEGORIES: ItemCategory[] = [
  'Мебель',
  'Столярные изделия',
  'Освещение',
  'Отделочные материалы',
  'Бытовая техника',
  'Сантехника',
  'Двери',
  'Декор и текстиль',
  'Отопление и климат',
  'Прочее',
];

export function getCategoryColor(category: string): { bg: string; text: string } {
  if (CATEGORY_COLORS[category]) {
    return CATEGORY_COLORS[category];
  }
  return {
    bg: 'bg-slate-800/80 text-slate-300 border border-slate-700',
    text: 'text-slate-300',
  };
}

