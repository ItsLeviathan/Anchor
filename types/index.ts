export interface Profile {
  id: string;
  displayName: string | null;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string | null;
  isDefault: boolean;
  sortOrder: number;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'completed' | 'cancelled';

export interface RecurrenceRule {
  freq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  /** 0 = Sunday … 6 = Saturday, used when freq is 'weekly' */
  byweekday?: number[];
}

export interface Task {
  id: string;
  userId: string;
  categoryId: string | null;
  title: string;
  description: string | null;
  /** 'YYYY-MM-DD' */
  dueDate: string | null;
  /** 'HH:MM' */
  dueTime: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  estimatedDurationMinutes: number | null;
  actualDurationMinutes: number | null;
  recurrenceRule: RecurrenceRule | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Calendar {
  id: string;
  userId: string;
  name: string;
  color: string;
  isDefault: boolean;
}

export type MoneyCategory =
  | 'Food'
  | 'Transportation'
  | 'Bills'
  | 'Shopping'
  | 'Entertainment'
  | 'School'
  | 'Health'
  | 'Personal'
  | 'Other';

export type ExpenseType = 'income' | 'expense';

export interface Expense {
  id: string;
  userId: string;
  type: ExpenseType;
  amount: number;
  currency: string;
  category: MoneyCategory;
  /** 'YYYY-MM-DD' */
  date: string;
  paymentMethod: string | null;
  notes: string | null;
  recurrenceRule: RecurrenceRule | null;
  createdAt: string;
  updatedAt: string;
}

export type BillStatus = 'unpaid' | 'paid';

export interface Bill {
  id: string;
  userId: string;
  name: string;
  amount: number;
  currency: string;
  category: MoneyCategory;
  /** 'YYYY-MM-DD' */
  dueDate: string;
  paymentMethod: string | null;
  notes: string | null;
  recurrenceRule: RecurrenceRule | null;
  status: BillStatus;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  calendarId: string;
  title: string;
  location: string | null;
  description: string | null;
  /** ISO datetime */
  startAt: string;
  /** ISO datetime */
  endAt: string;
  allDay: boolean;
  recurrenceRule: RecurrenceRule | null;
  createdAt: string;
  updatedAt: string;
}

