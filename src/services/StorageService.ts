import { db } from '../firebase';
import { doc, getDoc, getDocs, collection, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';

/**
 * StorageService — Persistente Datenspeicherung für Book24 Studio
 *
 * Strategie:
 * 1. Primär: localStorage mit festem, unveränderlichem Key "b24studio_v1_*"
 * 2. Automatische Migration aller alten Keys (kryork_*, book24_*)
 * 3. Export: JSON-Datei auf die Festplatte herunterladen
 * 4. Import: JSON-Datei von der Festplatte lesen und wiederherstellen
 * 5. Cloud-Sync: Lese/Schreib-Operationen mit Firestore, wenn eingeloggt
 */

const STORAGE_PREFIX = 'b24studio_v1';

/** Feste Key-Namen — werden NIE mehr geändert */
export const KEYS = {
  theme:         `${STORAGE_PREFIX}_theme`,
  accounts:      `${STORAGE_PREFIX}_accounts`,
  activeAccount: `${STORAGE_PREFIX}_active_account`,
  selectedModel: `${STORAGE_PREFIX}_selected_model`,
  library:       (accountId: string) => `${STORAGE_PREFIX}_library_${accountId}`,
};

/** Alle alten Key-Präfixe die migriert werden sollen */
const LEGACY_PREFIXES = ['kryork_', 'book24_'];

/**
 * Einmalige Migration: Kopiert alle alten localStorage-Daten
 * zu den neuen festen Keys. Läuft sicher mehrfach (idempotent).
 */
export function migrateOldKeys(): void {
  const mapKey = (oldPrefix: string, suffix: string) => `${oldPrefix}${suffix}`;

  const migrations: Array<{ newKey: string; oldSuffixes: string[] }> = [
    { newKey: KEYS.theme,         oldSuffixes: ['theme'] },
    { newKey: KEYS.accounts,      oldSuffixes: ['accounts'] },
    { newKey: KEYS.activeAccount, oldSuffixes: ['active_account'] },
    { newKey: KEYS.selectedModel, oldSuffixes: ['selected_model'] },
  ];

  // Migrate simple keys
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

  // Migrate library keys — find all account IDs across all old prefixes
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
}

// ─── Export ──────────────────────────────────────────────────────────────────

export interface BackupData {
  version: number;
  exportedAt: string;
  theme: string | null;
  accounts: string | null;
  activeAccount: string | null;
  selectedModel: string | null;
  libraries: Record<string, string>; // accountId → JSON string
}

/** Erstellt ein vollständiges Backup-Objekt aus localStorage */
export function createBackup(): BackupData {
  const libraries: Record<string, string> = {};

  // Find all library entries
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
    theme:         localStorage.getItem(KEYS.theme),
    accounts:      localStorage.getItem(KEYS.accounts),
    activeAccount: localStorage.getItem(KEYS.activeAccount),
    selectedModel: localStorage.getItem(KEYS.selectedModel),
    libraries,
  };
}

/** Lädt das Backup als .json Datei auf die Festplatte herunter */
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

// ─── Import ──────────────────────────────────────────────────────────────────

/** Liest eine Backup-Datei ein und stellt alle Daten wieder her */
export function importBackup(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target?.result as string) as BackupData;

        if (backup.version !== 1) {
          throw new Error('Unbekannte Backup-Version.');
        }

        // Restore simple keys
        if (backup.theme)         localStorage.setItem(KEYS.theme, backup.theme);
        if (backup.accounts)      localStorage.setItem(KEYS.accounts, backup.accounts);
        if (backup.activeAccount) localStorage.setItem(KEYS.activeAccount, backup.activeAccount);
        if (backup.selectedModel) localStorage.setItem(KEYS.selectedModel, backup.selectedModel);

        // Restore libraries
        for (const [accountId, data] of Object.entries(backup.libraries)) {
          localStorage.setItem(KEYS.library(accountId), data);
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

/** Auto-Backup: Speichert Backup-Datum nach jedem erfolgreichen Schreibvorgang */
export const AUTO_BACKUP_KEY = `${STORAGE_PREFIX}_last_backup`;
export function markBackupTime(): void {
  localStorage.setItem(AUTO_BACKUP_KEY, new Date().toISOString());
}
export function getLastBackupTime(): string | null {
  return localStorage.getItem(AUTO_BACKUP_KEY);
}

// ─── Cloud Sync (Firestore) ──────────────────────────────────────────────────

/** Speichert ein einzelnes Buch in der Cloud */
export async function saveBookToCloud(uid: string, book: any): Promise<void> {
  if (!db) return;
  try {
    const bookRef = doc(db, 'users', uid, 'books', book.id);
    await setDoc(bookRef, book);
  } catch (err) {
    console.error('Failed to save book to cloud:', err);
  }
}

/** Löscht ein einzelnes Buch aus der Cloud */
export async function deleteBookFromCloud(uid: string, bookId: string): Promise<void> {
  if (!db) return;
  try {
    const bookRef = doc(db, 'users', uid, 'books', bookId);
    await deleteDoc(bookRef);
  } catch (err) {
    console.error('Failed to delete book from cloud:', err);
  }
}

/** Lädt alle Bücher eines Benutzers aus der Cloud */
export async function loadBooksFromCloud(uid: string): Promise<any[]> {
  if (!db) return [];
  try {
    const booksColl = collection(db, 'users', uid, 'books');
    const snap = await getDocs(booksColl);
    const books: any[] = [];
    snap.forEach(docSnap => {
      books.push(docSnap.data());
    });
    return books;
  } catch (err) {
    console.error('Failed to load books from cloud:', err);
    return [];
  }
}

/** Synchronisiert die gesamte lokale Bibliothek beim ersten Login in die Cloud */
export async function syncLocalLibraryToCloud(uid: string, books: any[]): Promise<void> {
  if (!db || books.length === 0) return;
  try {
    const batch = writeBatch(db);
    books.forEach(book => {
      const bookRef = doc(db, 'users', uid, 'books', book.id);
      batch.set(bookRef, book);
    });
    await batch.commit();
  } catch (err) {
    console.error('Failed to sync local library to cloud:', err);
  }
}

/** Speichert die Accounts-Konfiguration in der Cloud */
export async function saveAccountsToCloud(uid: string, accounts: any[]): Promise<void> {
  if (!db) return;
  try {
    const dataRef = doc(db, 'users', uid, 'data', 'accounts');
    await setDoc(dataRef, { accounts });
  } catch (err) {
    console.error('Failed to save accounts to cloud:', err);
  }
}

/** Lädt die Accounts-Konfiguration aus der Cloud */
export async function loadAccountsFromCloud(uid: string): Promise<any[] | null> {
  if (!db) return null;
  try {
    const dataRef = doc(db, 'users', uid, 'data', 'accounts');
    const snap = await getDoc(dataRef);
    if (snap.exists()) {
      return snap.data().accounts || [];
    }
    return null;
  } catch (err) {
    console.error('Failed to load accounts from cloud:', err);
    return null;
  }
}
