export const OWNER_EMAIL_FALLBACK = 'yigitguener22@gmail.com';

export const getOwnerEmailClient = (): string => {
  const envEmail = import.meta.env.VITE_OWNER_EMAIL;
  return typeof envEmail === 'string' && envEmail.trim().length > 0
    ? envEmail.trim()
    : OWNER_EMAIL_FALLBACK;
};

export const isOwnerEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return email.trim().toLowerCase() === getOwnerEmailClient().toLowerCase();
};

export const OWNER_ROUTES = ['/owner', '/admin/users'] as const;

export const isOwnerRoute = (pathname?: string | null): boolean => {
  if (!pathname) return false;
  return OWNER_ROUTES.includes(pathname as (typeof OWNER_ROUTES)[number]);
};
