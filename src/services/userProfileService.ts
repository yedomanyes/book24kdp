import type { AppUser } from '../supabase';
import { supabase } from '../supabase';

export async function syncUserProfile(user: AppUser): Promise<void> {
  if (!supabase || !user?.uid) return;

  // We rely on the database trigger `on_auth_user_created` to INSERT new profiles.
  // Here we just update the last_login_at.
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.uid);

    if (error) {
      console.warn('Could not update last_login_at:', error);
    }
  } catch (err) {
    console.warn('Error syncing profile login time:', err);
  }
}
