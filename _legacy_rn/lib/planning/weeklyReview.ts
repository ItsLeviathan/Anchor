import type { Expense, Habit, Task } from '../../types';

export interface WeeklyReviewResult {
  summary: string;
}

function toDatePart(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Rule-based replacement for the old LLM-generated weekly review: same
 * stats the edge function used to compute (completed tasks, overdue
 * tasks, habit check-ins, expenses this week), templated into a sentence
 * instead of model-written prose.
 */
export function computeWeeklyReview(tasks: Task[], habits: Habit[], expenses: Expense[], now: Date = new Date()): WeeklyReviewResult {
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const weekStartKey = toDatePart(weekStart);
  const todayKey = toDatePart(now);

  const completedTasks = tasks.filter(
    (task) => task.status === 'completed' && task.completedAt && toDatePart(new Date(task.completedAt)) >= weekStartKey
  );
  const overdueTasks = tasks.filter((task) => task.status === 'pending' && task.dueDate !== null && task.dueDate < todayKey);
  const habitCheckIns = habits.reduce(
    (sum, habit) => sum + habit.completedDates.filter((date) => date >= weekStartKey).length,
    0
  );
  const weekExpenses = expenses.filter((expense) => expense.type === 'expense' && expense.date >= weekStartKey);
  const totalSpent = weekExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const lines: string[] = [];
  if (completedTasks.length > 0) lines.push(`completed ${completedTasks.length} task${completedTasks.length === 1 ? '' : 's'}`);
  if (habitCheckIns > 0) lines.push(`checked off ${habitCheckIns} habit${habitCheckIns === 1 ? '' : 's'}`);
  if (weekExpenses.length > 0) {
    const currency = weekExpenses[0].currency;
    lines.push(`spent ${currency} ${totalSpent.toFixed(2)} across ${weekExpenses.length} expense${weekExpenses.length === 1 ? '' : 's'}`);
  }

  if (lines.length === 0 && overdueTasks.length === 0) {
    return { summary: 'A quiet week - nothing tracked yet. Start small: add one task, one habit, or one expense.' };
  }

  let summary = lines.length > 0 ? `This week you ${lines.join(', ')}.` : 'A quiet week on the tracked fronts.';
  if (overdueTasks.length > 0) {
    summary += ` ${overdueTasks.length} task${overdueTasks.length === 1 ? '' : 's'} still overdue.`;
  }

  return { summary };
}
