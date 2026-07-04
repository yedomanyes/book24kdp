import { supabase } from '../supabase';

/**
 * StorageService — Persistente Datenspeicherung für Book24 Studio
 *
 * Strategie:
 * 1. Primär: localStorage mit festem, unveränderlichem Key "b24studio_v1_*"
 * 2. Automatische Migration aller alten Keys (kryork_*, book24_*)
 * 3. Export: JSON-Datei auf die Festplatte herunterladen
 * 4. Import: JSON-Datei von der Festplatte lesen und wiederherstellen
 * 5. Cloud-Sync: Lese/Schreib-Operationen mit Supabase, wenn eingeloggt
 */

const STORAGE_PREFIX = 'b24studio_v1';
const IDB_DB_NAME = 'book24studio_storage';
const IDB_DB_VERSION = 1;
const IDB_LIBRARY_STORE = 'libraries';

type LibrarySnapshotRecord = {
  accountId: string;
  data: any[];
  updatedAt: string;
};

function openStorageDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(IDB_DB_NAME, IDB_DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_LIBRARY_STORE)) {
          db.createObjectStore(IDB_LIBRARY_STORE, { keyPath: 'accountId' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveLibrarySnapshot(accountId: string, books: any[]): Promise<boolean> {
  const db = await openStorageDb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_LIBRARY_STORE, 'readwrite');
      const store = tx.objectStore(IDB_LIBRARY_STORE);
      store.put({ accountId, data: books, updatedAt: new Date().toISOString() } satisfies LibrarySnapshotRecord);
      tx.oncomplete = () => {
        db.close();
        resolve(true);
      };
      tx.onerror = () => {
        db.close();
        resolve(false);
      };
    } catch {
      db.close();
      resolve(false);
    }
  });
}

export async function loadLibrarySnapshot(accountId: string): Promise<any[] | null> {
  const db = await openStorageDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_LIBRARY_STORE, 'readonly');
      const store = tx.objectStore(IDB_LIBRARY_STORE);
      const request = store.get(accountId);
      request.onsuccess = () => {
        db.close();
        resolve(Array.isArray(request.result?.data) ? request.result.data : null);
      };
      request.onerror = () => {
        db.close();
        resolve(null);
      };
    } catch {
      db.close();
      resolve(null);
    }
  });
}

export async function loadAllLibrarySnapshots(): Promise<Record<string, any[]>> {
  const db = await openStorageDb();
  if (!db) return {};
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_LIBRARY_STORE, 'readonly');
      const store = tx.objectStore(IDB_LIBRARY_STORE);
      const request = store.getAll();
      request.onsuccess = () => {
        const rows = Array.isArray(request.result) ? request.result : [];
        const out = rows.reduce<Record<string, any[]>>((acc, row: LibrarySnapshotRecord) => {
          if (row?.accountId && Array.isArray(row.data)) acc[row.accountId] = row.data;
          return acc;
        }, {});
        db.close();
        resolve(out);
      };
      request.onerror = () => {
        db.close();
        resolve({});
      };
    } catch {
      db.close();
      resolve({});
    }
  });
}

export async function deleteLibrarySnapshot(accountId: string): Promise<void> {
  const db = await openStorageDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(IDB_LIBRARY_STORE, 'readwrite');
      tx.objectStore(IDB_LIBRARY_STORE).delete(accountId);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}

/** Feste Key-Namen — werden NIE mehr geändert */
export const KEYS = {
  theme: `${STORAGE_PREFIX}_theme`,
  accounts: `${STORAGE_PREFIX}_accounts`,
  activeAccount: `${STORAGE_PREFIX}_active_account`,
  selectedModel: `${STORAGE_PREFIX}_selected_model`,
  generationTurbo: `${STORAGE_PREFIX}_generation_turbo`,
  library: (accountId: string) => `${STORAGE_PREFIX}_library_${accountId}`,
};

/** Alle alten Key-Präfixe die migriert werden sollen */
const LEGACY_PREFIXES = ['b24studio_', 'kryork_', 'book24_'];

const getActiveAccountId = (): string => {
  return localStorage.getItem(KEYS.activeAccount) || 'default';
};

/**
 * Einmalige Migration: Kopiert alle alten localStorage-Daten
 * zu den neuen festen Keys. Läuft sicher mehrfach (idempotent).
 */
export function migrateOldKeys(): void {
  try {
    const mapKey = (oldPrefix: string, suffix: string) => `${oldPrefix}${suffix}`;

    const migrations: Array<{ newKey: string; oldSuffixes: string[] }> = [
      { newKey: KEYS.theme, oldSuffixes: ['theme'] },
      { newKey: KEYS.accounts, oldSuffixes: ['accounts'] },
      { newKey: KEYS.activeAccount, oldSuffixes: ['active_account'] },
      { newKey: KEYS.selectedModel, oldSuffixes: ['selected_model'] },
      { newKey: KEYS.generationTurbo, oldSuffixes: ['generation_turbo'] },
    ];

    for (const { newKey, oldSuffixes } of migrations) {
      if (!localStorage.getItem(newKey)) {
        for (const prefix of LEGACY_PREFIXES) {
          for (const suffix of oldSuffixes) {
            const val = localStorage.getItem(mapKey(prefix, suffix));
            if (val) {
              localStorage.setItem(newKey, val);
              break;
            }
          }
          if (localStorage.getItem(newKey)) break;
        }
      }
    }

    const accountIds = new Set<string>(['default']);
    for (const prefix of LEGACY_PREFIXES) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(`${prefix}library_`)) {
          const id = key.replace(`${prefix}library_`, '');
          accountIds.add(id);
        }
      }
    }

    for (const id of accountIds) {
      const newKey = KEYS.library(id);
      const newVal = localStorage.getItem(newKey);
      const isNewValEmpty = !newVal || newVal === '[]' || newVal === 'null' || newVal === 'undefined';

      if (isNewValEmpty) {
        for (const prefix of LEGACY_PREFIXES) {
          const oldKey = `${prefix}library_${id}`;
          const val = localStorage.getItem(oldKey);
          if (val && val !== '[]' && val !== 'null') {
            localStorage.setItem(newKey, val);
            break;
          }
        }
      }
    }
  } catch (e) {
    console.error('Failed to migrate old keys:', e);
  }
}

export interface BackupData {
  version: number;
  exportedAt: string;
  theme: string | null;
  accounts: string | null;
  activeAccount: string | null;
  selectedModel: string | null;
  generationTurbo: string | null;
  libraries: Record<string, string>;
}

export function createBackup(): BackupData {
  const libraries: Record<string, string> = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(`${STORAGE_PREFIX}_library_`)) {
      const accountId = key.replace(`${STORAGE_PREFIX}_library_`, '');
      const val = localStorage.getItem(key);
      if (val) libraries[accountId] = val;
    }
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    theme: localStorage.getItem(KEYS.theme),
    accounts: localStorage.getItem(KEYS.accounts),
    activeAccount: localStorage.getItem(KEYS.activeAccount),
    selectedModel: localStorage.getItem(KEYS.selectedModel),
    generationTurbo: localStorage.getItem(KEYS.generationTurbo),
    libraries,
  };
}

export function downloadBackup(): void {
  const backup = createBackup();
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);

  const a = document.createElement('a');
  a.href = url;
  a.download = `book24studio_backup_${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importBackup(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const backup = JSON.parse(e.target?.result as string) as BackupData;

        if (backup.version !== 1) {
          throw new Error('Unbekannte Backup-Version.');
        }

        if (backup.theme) localStorage.setItem(KEYS.theme, backup.theme);
        if (backup.accounts) localStorage.setItem(KEYS.accounts, backup.accounts);
        if (backup.activeAccount) localStorage.setItem(KEYS.activeAccount, backup.activeAccount);
        if (backup.selectedModel) localStorage.setItem(KEYS.selectedModel, backup.selectedModel);
        if (backup.generationTurbo) localStorage.setItem(KEYS.generationTurbo, backup.generationTurbo);

        for (const [accountId, data] of Object.entries(backup.libraries)) {
          localStorage.setItem(KEYS.library(accountId), data);
          try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
              await saveLibrarySnapshot(accountId, parsed);
            }
          } catch {
            // ignore malformed snapshot during import; localStorage still has raw backup
          }
        }

        resolve();
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden.'));
    reader.readAsText(file);
  });
}

export const AUTO_BACKUP_KEY = `${STORAGE_PREFIX}_last_backup`;
export function markBackupTime(): void {
  localStorage.setItem(AUTO_BACKUP_KEY, new Date().toISOString());
}
export function getLastBackupTime(): string | null {
  return localStorage.getItem(AUTO_BACKUP_KEY);
}

export async function saveBookToCloud(uid: string, book: any): Promise<void> {
  if (!supabase || !uid || !book?.id) return;
  const accountId = getActiveAccountId();
  try {
    const { error } = await supabase.from('books').upsert({
      id: book.id,
      user_id: uid,
      account_id: accountId,
      title: book.title ?? null,
      market_niche: book.marketNiche ?? null,
      payload: book,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,id' });

    if (error) throw error;
  } catch (err) {
    console.error('Failed to save book to cloud:', err);
  }
}

export async function deleteBookFromCloud(uid: string, bookId: string): Promise<void> {
  if (!supabase || !uid || !bookId) return;
  try {
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('user_id', uid)
      .eq('id', bookId)
      .eq('account_id', getActiveAccountId());

    if (error) throw error;
  } catch (err) {
    console.error('Failed to delete book from cloud:', err);
  }
}

export async function loadBooksFromCloud(uid: string, accountId: string = getActiveAccountId()): Promise<any[]> {
  if (!supabase || !uid) return [];
  try {
    let query = supabase
      .from('books')
      .select('payload, updated_at')
      .eq('user_id', uid);

    if (accountId) {
      query = query.eq('account_id', accountId);
    }

    const { data, error } = await query.order('updated_at', { ascending: true });

    if (error) throw error;
    return (data || []).map((row: any) => row.payload).filter(Boolean);
  } catch (err) {
    console.error('Failed to load books from cloud:', err);
    return [];
  }
}

export async function syncLocalLibraryToCloud(uid: string, books: any[]): Promise<void> {
  if (!supabase || !uid || books.length === 0) return;
  const accountId = getActiveAccountId();
  const rows = books.map((book) => ({
    id: book.id,
    user_id: uid,
    account_id: accountId,
    title: book.title ?? null,
    market_niche: book.marketNiche ?? null,
    payload: book,
    updated_at: new Date().toISOString(),
  }));

  // Batch in chunks of 10 to avoid payload limits
  const CHUNK = 10;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    let attempts = 0;
    while (attempts < 3) {
      try {
        const { error } = await supabase.from('books').upsert(chunk, { onConflict: 'user_id,id' });
        if (error) throw error;
        break; // success
      } catch (err) {
        attempts++;
        if (attempts >= 3) {
          console.error(`[CloudSync] FAILED after 3 attempts for chunk ${i}–${i + CHUNK}:`, err);
        } else {
          await new Promise(r => setTimeout(r, 800 * attempts)); // backoff
        }
      }
    }
  }
}

/**
 * Garantierter Force-Push aller Bücher zur Cloud.
 * Wird bei Login, nach jeder Generierung und alle 2 Min aufgerufen.
 */
export async function forcePushBooksToCloud(uid: string, books: any[]): Promise<{ ok: boolean; synced: number; failed: number }> {
  if (!supabase || !uid) return { ok: false, synced: 0, failed: 0 };
  if (books.length === 0) return { ok: true, synced: 0, failed: 0 };

  const accountId = getActiveAccountId();
  let synced = 0;
  let failed = 0;

  for (const book of books) {
    if (!book?.id) continue;
    let attempts = 0;
    let success = false;
    while (attempts < 3 && !success) {
      try {
        const { error } = await supabase.from('books').upsert({
          id: book.id,
          user_id: uid,
          account_id: accountId,
          title: book.title ?? null,
          market_niche: book.marketNiche ?? null,
          payload: book,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,id' });
        if (error) throw error;
        success = true;
        synced++;
      } catch (err) {
        attempts++;
        if (attempts >= 3) {
          console.error(`[ForcePush] Could not save book "${book.title ?? book.id}":`, err);
          failed++;
        } else {
          await new Promise(r => setTimeout(r, 600 * attempts));
        }
      }
    }
  }

  console.log(`[CloudSync] ✅ ${synced} saved, ❌ ${failed} failed`);
  return { ok: failed === 0, synced, failed };
}


export async function saveAccountsToCloud(uid: string, accounts: any[]): Promise<void> {
  if (!supabase || !uid) return;
  try {
    const { error: deleteError } = await supabase.from('accounts').delete().eq('user_id', uid);
    if (deleteError) throw deleteError;

    if (accounts.length === 0) return;

    const rows = accounts.map((account) => ({
      id: account.id,
      user_id: uid,
      username: account.username,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('accounts').insert(rows);
    if (error) throw error;
  } catch (err) {
    console.error('Failed to save accounts to cloud:', err);
  }
}

export async function loadAccountsFromCloud(uid: string): Promise<any[] | null> {
  if (!supabase || !uid) return null;
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('id, username')
      .eq('user_id', uid)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Failed to load accounts from cloud:', err);
    return null;
  }
}
