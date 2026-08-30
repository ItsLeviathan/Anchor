import { getLocalNotes, upsertLocalNote, type NoteRow } from '../../lib/database/localNotes';
import { enqueueDelete, enqueueUpsert } from '../../lib/sync/engine';
import { generateId } from '../../lib/sync/ids';
import type { Note } from '../../types';

function mapRow(row: NoteRow): Note {
  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    title: row.title,
    content: row.content,
    tags: row.tags,
    isPinned: row.is_pinned,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchNotes(userId: string): Promise<Note[]> {
  const rows = await getLocalNotes(userId);
  return rows.map(mapRow);
}

export interface CreateNoteInput {
  userId: string;
  title?: string | null;
  content: string;
  categoryId?: string | null;
  tags?: string[];
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
  const now = new Date().toISOString();
  const row: NoteRow = {
    id: generateId(),
    user_id: input.userId,
    category_id: input.categoryId ?? null,
    title: input.title ?? null,
    content: input.content,
    tags: input.tags ?? [],
    is_pinned: false,
    created_at: now,
    updated_at: now,
  };

  await upsertLocalNote(row);
  await enqueueUpsert('note', row.id, row as unknown as Record<string, unknown>);

  return mapRow(row);
}

export async function toggleNotePinned(note: Note): Promise<Note> {
  const row: NoteRow = {
    id: note.id,
    user_id: note.userId,
    category_id: note.categoryId,
    title: note.title,
    content: note.content,
    tags: note.tags,
    is_pinned: !note.isPinned,
    created_at: note.createdAt,
    updated_at: new Date().toISOString(),
  };

  await upsertLocalNote(row);
  await enqueueUpsert('note', row.id, row as unknown as Record<string, unknown>);

  return mapRow(row);
}

export async function deleteNote(id: string): Promise<void> {
  await enqueueDelete('note', id);
}
