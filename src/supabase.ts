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
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(`${name}=`)) {
        return decodeURIComponent(cookie.substring(name.length + 1));
      }
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

export const supabase = (typeof window !== 'undefined' && window.location.search.includes('dev_mode=true'))
  ? null
  : (isSupabaseConfigured()
      ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            // IMPORTANT: Implicit flow is required for Safari + Safari Private Mode compatibility.
            // With PKCE, Supabase stores a `code_verifier` in localStorage before the Google redirect.
            // Safari's ITP deletes localStorage during cross-site redirects (google.com → book24kdp.vercel.app),
            // making the code exchange fail silently — user lands back on landing page.
            // With implicit flow, the access_token is embedded directly in the URL hash (#access_token=...),
            // so NO localStorage read is needed during the callback. The token is immediately available.
            flowType: 'implicit',
            storage: safeStorage,
          },
        })
      : null);

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

  const providerData = (user.identities || []).map((identity: any) => ({
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
