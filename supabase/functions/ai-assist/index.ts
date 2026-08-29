// Supabase Edge Function: ai-assist
//
// Consolidates every AI action behind one function (the "hub" pattern) so
// adding a new action later doesn't mean deploying a whole new function.
// Deploy with: supabase functions deploy ai-assist
// Requires a secret: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// Security notes (see the master + monetization specs):
//  - The Anthropic API key lives only here, in an env var - never in the app.
//  - Quota is enforced here (server-side), not trusted from the client.
//  - ai_usage rows are written with ctx.supabaseAdmin because the table's
//    RLS intentionally has no insert policy for authenticated users - see
//    supabase/migrations/0001_init.sql.

import { withSupabase } from 'npm:@supabase/server@^1';

import { callClaudeWithTool } from '../_shared/claude.ts';
import { checkAiQuota } from '../_shared/entitlements.ts';

const DEFAULT_CATEGORIES = [
  'Personal',
  'Home',
  'Work',
  'School',
  'Money',
  'Health',
  'Family',
  'Social',
  'Documents',
  'Other',
];

interface BrainDumpItem {
  title: string;
  category: string;
  dueDate: string; // empty string means "no date mentioned"
}

interface RequestBody {
  action?: 'brain_dump' | 'daily_plan';
  text?: string;
  /** User's local "today" as YYYY-MM-DD - the server has no idea what timezone the user is in. */
  todayIso?: string;
  /** Start/end of the user's local "today", as full ISO datetimes, for querying events. */
  dayStartIso?: string;
  dayEndIso?: string;
}

async function handleBrainDump(ctx: any, userId: string, body: RequestBody, quotaLimit: number, quotaUsed: number) {
  const text = body.text?.trim();
  if (!text) {
    return Response.json({ error: 'text is required for brain_dump' }, { status: 400 });
  }

  const result = await callClaudeWithTool<{ items: BrainDumpItem[] }>({
    system:
      `You help organize a personal task list. Today's date is ${body.todayIso ?? 'unknown'}. ` +
      `Extract every distinct actionable item from the user's text as a task. For each item, pick the single ` +
      `best-fitting category from exactly this list: ${DEFAULT_CATEGORIES.join(', ')}. If a specific or ` +
      `clearly-implied date is mentioned (e.g. "Monday", "next month"), resolve it to an ISO date (YYYY-MM-DD) ` +
      `relative to today's date; otherwise leave dueDate as an empty string. Keep each title short and ` +
      `action-oriented, in the user's own words where reasonable. Do not invent items the user didn't mention.`,
    userText: text,
    toolName: 'record_brain_dump_items',
    toolDescription: "Records the structured list of actionable items extracted from the user's text.",
    inputSchema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              category: { type: 'string', enum: DEFAULT_CATEGORIES },
              dueDate: { type: 'string', description: 'YYYY-MM-DD, or empty string if no date was mentioned' },
            },
            required: ['title', 'category', 'dueDate'],
          },
        },
      },
      required: ['items'],
    },
  });

  await ctx.supabaseAdmin.from('ai_usage').insert({
    user_id: userId,
    request_type: 'brain_dump',
    model: 'claude-sonnet-4-6',
    input_tokens: result.inputTokens,
    output_tokens: result.outputTokens,
  });

  return Response.json({
    items: result.input.items.map((item) => ({ ...item, dueDate: item.dueDate || null })),
    remaining: Math.max(quotaLimit - quotaUsed - 1, 0),
  });
}

async function handleDailyPlan(ctx: any, userId: string, body: RequestBody, quotaLimit: number, quotaUsed: number) {
  const { todayIso, dayStartIso, dayEndIso } = body;
  if (!todayIso || !dayStartIso || !dayEndIso) {
    return Response.json(
      { error: 'todayIso, dayStartIso, and dayEndIso are required for daily_plan' },
      { status: 400 }
    );
  }

  // Queried here (not trusted from the client) so the plan is always based
  // on real, current, RLS-scoped data.
  const [{ data: taskRows }, { data: eventRows }] = await Promise.all([
    ctx.supabase.from('tasks').select('id, title, priority, due_time, status').eq('due_date', todayIso).neq('status', 'cancelled'),
    ctx.supabase.from('events').select('title, start_at, end_at').gte('start_at', dayStartIso).lt('start_at', dayEndIso),
  ]);

  const pendingTasks = (taskRows ?? []).filter((task: { status: string }) => task.status === 'pending');
  const events = eventRows ?? [];

  if (pendingTasks.length === 0 && events.length === 0) {
    return Response.json({
      summary: 'Nothing on the calendar or due today - a good day to get ahead on something.',
      focusTaskId: null,
      remaining: Math.max(quotaLimit - quotaUsed, 0),
    });
  }

  const summaryLines = [
    ...pendingTasks.map(
      (task: { id: string; title: string; priority: string; due_time: string | null }) =>
        `Task "${task.title}" (priority: ${task.priority}${task.due_time ? `, due at ${task.due_time}` : ''}) [id: ${task.id}]`
    ),
    ...events.map((event: { title: string; start_at: string; end_at: string }) => `Event "${event.title}" from ${event.start_at} to ${event.end_at}`),
  ];

  const result = await callClaudeWithTool<{ summary: string; focusTaskId: string }>({
    system:
      `You are a calm, concise personal planning assistant. Today is ${todayIso}. Given the tasks and events ` +
      `below, write a short (2-3 sentence) plan for the day: what to focus on first and why, and how the ` +
      `events fit around it. Be specific and practical, not generic filler. If one pending task clearly stands ` +
      `out as the single most important thing to do, set focusTaskId to its id; otherwise leave it as an empty string.`,
    userText: summaryLines.join('\n'),
    toolName: 'record_daily_plan',
    toolDescription: "Records the day's plan summary and the single most important task, if any.",
    inputSchema: {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        focusTaskId: { type: 'string', description: 'id of the single most important pending task, or empty string' },
      },
      required: ['summary', 'focusTaskId'],
    },
  });

  await ctx.supabaseAdmin.from('ai_usage').insert({
    user_id: userId,
    request_type: 'daily_plan',
    model: 'claude-sonnet-4-6',
    input_tokens: result.inputTokens,
    output_tokens: result.outputTokens,
  });

  return Response.json({
    summary: result.input.summary,
    focusTaskId: result.input.focusTaskId || null,
    remaining: Math.max(quotaLimit - quotaUsed - 1, 0),
  });
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req: Request, ctx: any) => {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const userId = ctx.userClaims.id as string;

    const quota = await checkAiQuota(ctx.supabase, userId);
    if (!quota.allowed) {
      return Response.json({ error: 'limit_reached', limit: quota.limit, used: quota.used }, { status: 429 });
    }

    try {
      if (body.action === 'brain_dump') {
        return await handleBrainDump(ctx, userId, body, quota.limit, quota.used);
      }
      if (body.action === 'daily_plan') {
        return await handleDailyPlan(ctx, userId, body, quota.limit, quota.used);
      }
      return Response.json({ error: `Unknown action: ${body.action}` }, { status: 400 });
    } catch (err) {
      console.error('ai-assist error', err);
      return Response.json({ error: 'Something went wrong processing that request.' }, { status: 502 });
    }
  }),
};
