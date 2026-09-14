import { useCallback, useEffect, useState } from 'react';

import { supabase } from '../../lib/supabase/client';

export type SearchResultType = 'task' | 'note' | 'document' | 'expense' | 'habit';

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle: string;
}

const ICON: Record<SearchResultType, string> = {
  task: 'checkmark.circle',
  note: 'note.text',
  document: 'doc',
  expense: 'dollarsign.circle',
  habit: 'repeat',
};

export { ICON as searchResultIcon };

export function useSearch(userId: string | undefined) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(
    async (q: string) => {
      if (!userId || q.trim().length < 2) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      const term = `%${q.trim()}%`;

      try {
        const [tasks, notes, documents, expenses, habits] = await Promise.all([
          supabase
            .from('tasks')
            .select('id, title, status')
            .eq('user_id', userId)
            .ilike('title', term)
            .limit(5),
          supabase
            .from('notes')
            .select('id, title, content')
            .eq('user_id', userId)
            .or(`title.ilike.${term},content.ilike.${term}`)
            .limit(5),
          supabase
            .from('documents')
            .select('id, name, category')
            .eq('user_id', userId)
            .ilike('name', term)
            .limit(5),
          supabase
            .from('expenses')
            .select('id, description, amount, currency')
            .eq('user_id', userId)
            .ilike('description', term)
            .limit(5),
          supabase
            .from('habits')
            .select('id, name, frequency')
            .eq('user_id', userId)
            .ilike('name', term)
            .limit(5),
        ]);

        const out: SearchResult[] = [];

        for (const t of tasks.data ?? []) {
          out.push({
            type: 'task',
            id: t.id,
            title: t.title,
            subtitle: t.status === 'completed' ? 'Completed' : 'Task',
          });
        }
        for (const n of notes.data ?? []) {
          out.push({
            type: 'note',
            id: n.id,
            title: n.title || (n.content as string).slice(0, 60),
            subtitle: 'Note',
          });
        }
        for (const d of documents.data ?? []) {
          out.push({ type: 'document', id: d.id, title: d.name, subtitle: d.category });
        }
        for (const e of expenses.data ?? []) {
          out.push({
            type: 'expense',
            id: e.id,
            title: e.description,
            subtitle: `${e.currency} ${(e.amount as number).toFixed(2)}`,
          });
        }
        for (const h of habits.data ?? []) {
          out.push({ type: 'habit', id: h.id, title: h.name, subtitle: h.frequency });
        }

        setResults(out);
      } catch (err) {
        console.error('Search error', err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [userId]
  );

  // Debounce: wait 300 ms after the last keystroke before querying.
  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  return { query, setQuery, results, isSearching };
}
