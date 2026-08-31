import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../../lib/supabase/client';

const STUDENT_MODE_KEY = ['student_mode'] as const;

async function fetchStudentModeEnabled(userId: string): Promise<boolean> {
  const { data, error } = await supabase.from('profiles').select('student_mode_enabled').eq('id', userId).single();

  if (error) throw error;
  return Boolean(data?.student_mode_enabled);
}

export function useStudentMode(userId: string | undefined) {
  return useQuery({
    queryKey: [...STUDENT_MODE_KEY, userId],
    queryFn: () => fetchStudentModeEnabled(userId as string),
    enabled: Boolean(userId),
  });
}

export function useSetStudentMode(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!userId) return enabled;
      const { error } = await supabase.from('profiles').update({ student_mode_enabled: enabled }).eq('id', userId);
      if (error) throw error;
      return enabled;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...STUDENT_MODE_KEY, userId] }),
  });
}
