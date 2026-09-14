// Supabase Edge Function: delete-account
//
// Permanently deletes the calling user's account and all associated data.
// All user-owned tables cascade-delete on auth.users.id (see migrations),
// so deleting the auth row is sufficient. The Storage bucket objects (documents)
// do not auto-delete — this function purges them first, then deletes the user.
//
// Deploy: supabase functions deploy delete-account
// Requires: service-role key is available via ctx.supabaseAdmin automatically.

import { withSupabase } from 'npm:@supabase/server@^1';

export default {
  fetch: withSupabase({ auth: 'user' }, async (_req: Request, ctx: any) => {
    const userId = ctx.userClaims.id as string;

    // Remove uploaded documents from Storage before deleting the user row,
    // because Storage objects are not cascade-deleted by the DB trigger.
    const { data: docRows } = await ctx.supabase
      .from('documents')
      .select('storage_path')
      .eq('user_id', userId);

    if (docRows && docRows.length > 0) {
      const paths = docRows.map((d: { storage_path: string }) => d.storage_path);
      await ctx.supabaseAdmin.storage.from('documents').remove(paths);
    }

    // Deleting the auth user cascades to every table that references auth.users(id)
    // with ON DELETE CASCADE — profiles, tasks, events, notes, habits, etc.
    const { error } = await ctx.supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      console.error('Failed to delete user', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  }),
};
