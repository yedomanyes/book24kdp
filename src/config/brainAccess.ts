/** Accounts with access to Book24 Brain (beta). Case-insensitive. */
export const BRAIN_ALLOWED_EMAILS = [
  'yigitguener22@gmail.com',
] as const;

export function hasBrainAccess(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return BRAIN_ALLOWED_EMAILS.some(allowed => allowed.toLowerCase() === normalized);
}
