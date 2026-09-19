import { supabase } from '../../lib/supabase/client';
import { generateId } from '../../lib/sync/ids';
import type { AnchorDocument, DocumentCategory } from '../../types';

interface DocumentRow {
  id: string;
  user_id: string;
  name: string;
  category: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  issue_date: string | null;
  expiration_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: DocumentRow): AnchorDocument {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    category: row.category as DocumentCategory,
    storagePath: row.storage_path,
    fileName: row.file_name,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    issueDate: row.issue_date,
    expirationDate: row.expiration_date,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchDocuments(userId: string): Promise<AnchorDocument[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('expiration_date', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data as DocumentRow[]).map(mapRow);
}

export interface PickedFile {
  uri: string;
  name: string;
  mimeType: string | null;
  size: number | null;
}

export interface CreateDocumentInput {
  userId: string;
  name: string;
  category: DocumentCategory;
  file: PickedFile;
  issueDate?: string | null;
  expirationDate?: string | null;
  notes?: string | null;
}

/**
 * A plain Blob from `fetch(uri).blob()` does not upload correctly from
 * React Native to Supabase Storage (a well-documented gotcha - see
 * Supabase's own React Native storage guide). Converting to an
 * ArrayBuffer first is the reliable path.
 */
export async function createDocument(input: CreateDocumentInput): Promise<AnchorDocument> {
  const id = generateId();
  const storagePath = `${input.userId}/${id}-${input.file.name}`;

  const arrayBuffer = await (await fetch(input.file.uri)).arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, arrayBuffer, {
      contentType: input.file.mimeType ?? 'application/octet-stream',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('documents')
    .insert({
      id,
      user_id: input.userId,
      name: input.name.trim(),
      category: input.category,
      storage_path: storagePath,
      file_name: input.file.name,
      mime_type: input.file.mimeType,
      file_size: input.file.size,
      issue_date: input.issueDate ?? null,
      expiration_date: input.expirationDate ?? null,
      notes: input.notes ?? null,
    })
    .select('*')
    .single();

  if (error) {
    // Best-effort cleanup - don't leave an orphaned file in Storage if the
    // metadata insert failed.
    await supabase.storage.from('documents').remove([storagePath]);
    throw error;
  }

  return mapRow(data as DocumentRow);
}

/** Short-lived signed URL for viewing/downloading - the bucket is private, there is no permanent public link. */
export async function getDocumentSignedUrl(storagePath: string, expiresInSeconds = 60): Promise<string> {
  const { data, error } = await supabase.storage.from('documents').createSignedUrl(storagePath, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteDocument(document: AnchorDocument): Promise<void> {
  const { error: storageError } = await supabase.storage.from('documents').remove([document.storagePath]);
  if (storageError) throw storageError;

  const { error } = await supabase.from('documents').delete().eq('id', document.id);
  if (error) throw error;
}
