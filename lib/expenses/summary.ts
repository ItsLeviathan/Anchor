import type { Expense } from '../../types';

export interface MonthlySummary {
  income: number;
  expenses: number;
  remaining: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function isInMonth(dateStr: string, year: number, month: number): boolean {
  const [y, m] = dateStr.split('-').map(Number);
  return y === year && m - 1 === month;
}

export function computeMonthlySummary(expenses: Expense[], now: Date = new Date()): MonthlySummary {
  const year = now.getFullYear();
  const month = now.getMonth();

  let income = 0;
  let expenseTotal = 0;

  for (const item of expenses) {
    if (!isInMonth(item.date, year, month)) continue;
    if (item.type === 'income') income += item.amount;
    else expenseTotal += item.amount;
  }

  return {
    income: round2(income),
    expenses: round2(expenseTotal),
    remaining: round2(income - expenseTotal),
  };
}

export interface CategoryTotal {
  category: string;
  total: number;
}

export function computeCategoryTotals(expenses: Expense[], now: Date = new Date()): CategoryTotal[] {
  const year = now.getFullYear();
  const month = now.getMonth();
  const totals = new Map<string, number>();

  for (const item of expenses) {
    if (item.type !== 'expense' || !isInMonth(item.date, year, month)) continue;
    totals.set(item.category, (totals.get(item.category) ?? 0) + item.amount);
  }

  return Array.from(totals.entries())
    .map(([category, total]) => ({ category, total: round2(total) }))
    .sort((a, b) => b.total - a.total);
}
