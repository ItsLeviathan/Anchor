import { useCallback, useEffect, useState } from 'react';

import { getLocalAssignments } from '../../lib/database/localAssignments';
import { getLocalExpenses } from '../../lib/database/localExpenses';
import { getLocalHabits } from '../../lib/database/localHabits';
import { getLocalNotes } from '../../lib/database/localNotes';
import { getLocalSubjects } from '../../lib/database/localSubjects';
import { getLocalTasks } from '../../lib/database/localTasks';
import { supabase } from '../../lib/supabase/client';

export type SearchResultType = 'task' | 'note' | 'document' | 'expense' | 'habit' | 'subject' | 'assignment';

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle: string;
}

const MAX_RESULTS = 30;

function matches(needle: string, ...values: (string | null | undefined)[]): boolean {
  return values.some((v) => !!v && v.toLowerCase().includes(needle));
}

export function useSearch(userId: string | undefined) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!userId || trimmed.length < 2) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      const needle = trimmed.toLowerCase();
      const out: SearchResult[] = [];

      // Every domain except Documents is local-first (SQLite is the source
      // of truth, synced to Supabase in the background) — searching it
      // locally means results are instant and correct offline, and include
      // anything created moments ago that hasn't reached the sync queue
      // yet. Documents have no local table (attachments are uploaded
      // straight to Supabase Storage), so that one source stays
      // network-backed; it's run separately via allSettled so a network
      // hiccup there doesn't blank out the other, local results.
      const [tasks, notes, habits, expenses, subjects, assignments, documents] = await Promise.allSettled([
        getLocalTasks(userId),
        getLocalNotes(userId),
        getLocalHabits(userId),
        getLocalExpenses(userId),
        getLocalSubjects(userId),
        getLocalAssignments(userId),
        supabase
          .from('documents')
          .select('id, name, category')
          .eq('user_id', userId)
          .ilike('name', `%${trimmed}%`)
          .limit(5),
      ]);

      if (tasks.status === 'fulfilled') {
        for (const t of tasks.value) {
          if (!matches(needle, t.title)) continue;
          out.push({ type: 'task', id: t.id, title: t.title, subtitle: t.status === 'completed' ? 'Completed' : 'Task' });
        }
      } else {
        console.error('Task search failed', tasks.reason);
      }

      if (notes.status === 'fulfilled') {
        for (const n of notes.value) {
          if (!matches(needle, n.title, n.content)) continue;
          out.push({ type: 'note', id: n.id, title: n.title || n.content.slice(0, 60), subtitle: 'Note' });
        }
      } else {
        console.error('Note search failed', notes.reason);
      }

      if (habits.status === 'fulfilled') {
        for (const h of habits.value) {
          if (!matches(needle, h.name)) continue;
          out.push({ type: 'habit', id: h.id, title: h.name, subtitle: h.frequency });
        }
      } else {
        console.error('Habit search failed', habits.reason);
      }

      if (expenses.status === 'fulfilled') {
        for (const e of expenses.value) {
          if (!matches(needle, e.notes, e.category)) continue;
          out.push({
            type: 'expense',
            id: e.id,
            title: e.notes || e.category,
            subtitle: `${e.currency} ${e.amount.toFixed(2)}`,
          });
        }
      } else {
        console.error('Expense search failed', expenses.reason);
      }

      if (subjects.status === 'fulfilled') {
        for (const s of subjects.value) {
          if (!matches(needle, s.name, s.instructor, s.term)) continue;
          out.push({ type: 'subject', id: s.id, title: s.name, subtitle: s.term || 'Subject' });
        }
      } else {
        console.error('Subject search failed', subjects.reason);
      }

      if (assignments.status === 'fulfilled') {
        for (const a of assignments.value) {
          if (!matches(needle, a.title, a.notes)) continue;
          out.push({
            type: 'assignment',
            id: a.id,
            title: a.title,
            subtitle: a.status === 'completed' ? 'Completed' : 'Assignment',
          });
        }
      } else {
        console.error('Assignment search failed', assignments.reason);
      }

      if (documents.status === 'fulfilled' && !documents.value.error) {
        for (const d of documents.value.data ?? []) {
          out.push({ type: 'document', id: d.id, title: d.name, subtitle: d.category });
        }
      } else if (documents.status === 'rejected') {
        console.error('Document search failed', documents.reason);
      } else if (documents.status === 'fulfilled' && documents.value.error) {
        console.error('Document search failed', documents.value.error);
      }

      setResults(out.slice(0, MAX_RESULTS));
      setIsSearching(false);
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
