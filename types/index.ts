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

