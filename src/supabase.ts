import { createClient, type User as SupabaseAuthUser } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
};

// Safe cookie helper functions for Safari's private mode and OAuth redirects
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return decodeURIComponent(parts.pop()!.split(';').shift()!);
    }
  } catch (e) {
    console.error('Failed to get cookie:', e);
  }
  return null;
};

const setCookie = (name: string, value: string): void => {
  if (typeof document === 'undefined') return;
  try {
    // Set cookie with 1 year expiration, SameSite=Lax, and Secure
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax; Secure`;
  } catch (e) {
    console.error('Failed to set cookie:', e);
  }
};

const removeCookie = (name: string): void => {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax; Secure`;
  } catch (e) {
    console.error('Failed to remove cookie:', e);
  }
};

const safeStorage = {
  getItem(key: string): string | null {
    try {
      const localValue = window.localStorage.getItem(key);
      if (localValue) return localValue;
    } catch (e) {}
    return getCookie(key);
  },
  setItem(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {}
    setCookie(key, value);
  },
  removeItem(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {}
    removeCookie(key);
  }
};

export const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Using standard PKCE flow.
        // Safari's ITP / Private Mode restrictions are bypassed by backing up
        // the PKCE code_verifier and auth sessions in cookies, which survive
        // the cross-domain redirect.
        flowType: 'pkce',
        storage: safeStorage,
      },
    })
  : null;

export type AppUser = {
  id: string;
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  providerData: Array<{ providerId: string }>;
  metadata: {
    creationTime: string | null;
    lastSignInTime: string | null;
  };
  raw: SupabaseAuthUser;
  getIdToken: () => Promise<string>;
};

export const toAppUser = (user: SupabaseAuthUser | null): AppUser | null => {
  if (!user) return null;

  const providerData = (user.identities || []).map((identity) => ({
    providerId: identity.provider || 'unknown',
  }));

  return {
    id: user.id,
    uid: user.id,
    email: user.email ?? null,
    displayName:
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      null,
    photoURL: (user.user_metadata?.avatar_url as string | undefined) || null,
    emailVerified: Boolean(user.email_confirmed_at),
    providerData,
    metadata: {
      creationTime: user.created_at ?? null,
      lastSignInTime: user.last_sign_in_at ?? null,
    },
    raw: user,
    getIdToken: async () => {
      if (!supabase) return '';
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? '';
    },
  };
};

export const getCurrentAppUser = async (): Promise<AppUser | null> => {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return toAppUser(data.user ?? null);
};
