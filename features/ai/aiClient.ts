import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '../../lib/supabase/client';

export interface BrainDumpItemResult {
  title: string;
  category: string;
  dueDate: string | null;
}

export interface BrainDumpResponse {
  items: BrainDumpItemResult[];
  remaining: number;
}

export interface DailyPlanResponse {
  summary: string;
  focusTaskId: string | null;
  remaining: number;
}

export class AiLimitReachedError extends Error {
  limit: number;
  used: number;

  constructor(limit: number, used: number) {
    super('AI action limit reached');
    this.name = 'AiLimitReachedError';
    this.limit = limit;
    this.used = used;
  }
}

function toDatePart(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function invokeAiAssist<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('ai-assist', { body });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      try {
        const payload = await error.context.json();
        if (payload?.error === 'limit_reached') {
          throw new AiLimitReachedError(payload.limit, payload.used);
        }
      } catch (parseErr) {
        if (parseErr instanceof AiLimitReachedError) throw parseErr;
        // Fall through to the generic throw below if the body wasn't the
        // JSON shape we expected.
      }
    }
    throw error;
  }

  return data as T;
}

export async function requestBrainDump(text: string): Promise<BrainDumpResponse> {
  return invokeAiAssist<BrainDumpResponse>({
    action: 'brain_dump',
    text,
    todayIso: toDatePart(new Date()),
  });
}

export async function requestDailyPlan(): Promise<DailyPlanResponse> {
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  return invokeAiAssist<DailyPlanResponse>({
    action: 'daily_plan',
    todayIso: toDatePart(now),
    dayStartIso: dayStart.toISOString(),
    dayEndIso: dayEnd.toISOString(),
  });
}
