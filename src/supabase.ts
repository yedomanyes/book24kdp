import { createClient, type User as SupabaseAuthUser } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
};

// Safe storage wrapper for Safari's private mode / third-party context restrictions
const memoryStorage: Record<string, string> = {};
const safeStorage = {
  getItem(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return memoryStorage[key] || null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      memoryStorage[key] = value;
    }
  },
  removeItem(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      delete memoryStorage[key];
    }
  }
};

export const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Using implicit flow (not PKCE) for Safari compatibility.
        // Safari's ITP clears localStorage during cross-site OAuth redirects,
        // which destroys the PKCE code_verifier and breaks the auth exchange.
        // Implicit flow puts the token directly in the URL hash — no stored state needed.
        flowType: 'implicit',
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
