import { supabase } from '../supabase';

export const logActivity = async (action: string, details: string) => {
  try {
    if (!supabase) return;

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      user_email: user.email,
      action,
      details,
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};
