import { getLocalSubjects, upsertLocalSubject, type SubjectRow } from '../../lib/database/localSubjects';
import { enqueueDelete, enqueueUpsert } from '../../lib/sync/engine';
import { generateId } from '../../lib/sync/ids';
import type { Subject } from '../../types';

function mapRow(row: SubjectRow): Subject {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    color: row.color,
    instructor: row.instructor,
    term: row.term,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchSubjects(userId: string): Promise<Subject[]> {
  const rows = await getLocalSubjects(userId);
  return rows.map(mapRow);
}

export interface CreateSubjectInput {
  userId: string;
  name: string;
  color?: string;
  instructor?: string | null;
  term?: string | null;
}

const DEFAULT_SUBJECT_COLORS = ['#3B6EA5', '#2F6F5E', '#A5673B', '#6E5BA6', '#C1473C', '#8A6D3B'];

export async function createSubject(input: CreateSubjectInput): Promise<Subject> {
  const now = new Date().toISOString();
  const row: SubjectRow = {
    id: generateId(),
    user_id: input.userId,
    name: input.name.trim(),
    color: input.color ?? DEFAULT_SUBJECT_COLORS[Math.floor(Math.random() * DEFAULT_SUBJECT_COLORS.length)],
    instructor: input.instructor ?? null,
    term: input.term ?? null,
    created_at: now,
    updated_at: now,
  };

  await upsertLocalSubject(row);
  await enqueueUpsert('subject', row.id, row as unknown as Record<string, unknown>);

  return mapRow(row);
}

export async function deleteSubject(id: string): Promise<void> {
  await enqueueDelete('subject', id);
}
