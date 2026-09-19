import { getLocalAssignments, upsertLocalAssignment, type AssignmentRow } from '../../lib/database/localAssignments';
import { enqueueDelete, enqueueUpsert } from '../../lib/sync/engine';
import { generateId } from '../../lib/sync/ids';
import type { Assignment, AssignmentKind, AssignmentStatus } from '../../types';

function mapRow(row: AssignmentRow): Assignment {
  return {
    id: row.id,
    userId: row.user_id,
    subjectId: row.subject_id,
    kind: row.kind as AssignmentKind,
    title: row.title,
    dueDate: row.due_date,
    dueTime: row.due_time,
    notes: row.notes,
    status: row.status as AssignmentStatus,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchAssignments(userId: string): Promise<Assignment[]> {
  const rows = await getLocalAssignments(userId);
  return rows.map(mapRow);
}

export interface CreateAssignmentInput {
  userId: string;
  subjectId: string;
  kind: AssignmentKind;
  title: string;
  dueDate?: string | null;
  dueTime?: string | null;
  notes?: string | null;
}

export async function createAssignment(input: CreateAssignmentInput): Promise<Assignment> {
  const now = new Date().toISOString();
  const row: AssignmentRow = {
    id: generateId(),
    user_id: input.userId,
    subject_id: input.subjectId,
    kind: input.kind,
    title: input.title.trim(),
    due_date: input.dueDate ?? null,
    due_time: input.dueTime ?? null,
    notes: input.notes ?? null,
    status: 'pending',
    completed_at: null,
    created_at: now,
    updated_at: now,
  };

  await upsertLocalAssignment(row);
  await enqueueUpsert('assignment', row.id, row as unknown as Record<string, unknown>);

  return mapRow(row);
}

export async function setAssignmentStatus(assignment: Assignment, status: AssignmentStatus): Promise<Assignment> {
  const row: AssignmentRow = {
    id: assignment.id,
    user_id: assignment.userId,
    subject_id: assignment.subjectId,
    kind: assignment.kind,
    title: assignment.title,
    due_date: assignment.dueDate,
    due_time: assignment.dueTime,
    notes: assignment.notes,
    status,
    completed_at: status === 'completed' ? new Date().toISOString() : null,
    created_at: assignment.createdAt,
    updated_at: new Date().toISOString(),
  };

  await upsertLocalAssignment(row);
  await enqueueUpsert('assignment', row.id, row as unknown as Record<string, unknown>);

  return mapRow(row);
}

export async function deleteAssignment(id: string): Promise<void> {
  await enqueueDelete('assignment', id);
}
