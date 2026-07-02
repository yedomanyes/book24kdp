import type { ChapterMemory } from '../../types/cmie';
import type { BrainBookInput, BrainState, NicheBrainProfile } from '../../types/brain';
import { slugify } from './BrainService';

const IDB_NAME = 'book24_obsidian_vault';
const IDB_STORE = 'handles';
const HANDLE_KEY = 'vault_root';
const CONTEXT_CACHE_KEY = 'book24_obsidian_context_cache_v2';

const ROOT_GOAL_FILE = 'goal.md';
const ROOT_PROGRESS_FILE = 'progress.md';
const ROOT_SUMMARY_FILE = 'summary.md';
const ROOT_CODEBASE_FILE = 'codebase.md';

type DirHandle = FileSystemDirectoryHandle;

type VaultContextCache = {
  updatedAt: string;
  claude: string;
  system: string;
  successPatterns: string;
  avoidPatterns: string;
  goal: string;
  progress: string;
  summary: string;
  codebase: string;
  architecture: string[];
  recentLogs: string[];
  niches: Record<string, string>;
  books: Record<string, string>;
};

declare global {
  interface Window {
    showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<DirHandle>;
  }
}

async function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveHandle(handle: DirHandle): Promise<void> {
  const db = await openIdb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(handle, HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function loadHandle(): Promise<DirHandle | null> {
  try {
    const db = await openIdb();
    const handle = await new Promise<DirHandle | null>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(HANDLE_KEY);
      req.onsuccess = () => resolve((req.result as DirHandle) || null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return handle;
  } catch {
    return null;
  }
}

async function ensureDir(parent: DirHandle, name: string): Promise<DirHandle> {
  return parent.getDirectoryHandle(name, { create: true });
}

async function writeTextFile(root: DirHandle, pathParts: string[], content: string): Promise<void> {
  let dir = root;
  for (let i = 0; i < pathParts.length - 1; i++) {
    dir = await ensureDir(dir, pathParts[i]);
  }
  const fileName = pathParts[pathParts.length - 1];
  const fileHandle = await dir.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

async function readTextFile(root: DirHandle, pathParts: string[]): Promise<string | null> {
  try {
    let dir = root;
    for (let i = 0; i < pathParts.length - 1; i++) {
      dir = await dir.getDirectoryHandle(pathParts[i]);
    }
    const fileName = pathParts[pathParts.length - 1];
    const fileHandle = await dir.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return await file.text();
  } catch {
    return null;
  }
}

async function listMarkdownFiles(root: DirHandle, pathParts: string[]): Promise<string[]> {
  try {
    let dir = root;
    for (const part of pathParts) {
      dir = await dir.getDirectoryHandle(part);
    }

    const names: string[] = [];
    for await (const entry of (dir as any).values()) {
      if (entry.kind === 'file' && entry.name.toLowerCase().endsWith('.md')) {
        names.push(entry.name);
      }
    }
    return names.sort((a, b) => b.localeCompare(a));
  } catch {
    return [];
  }
}

async function listDirectories(root: DirHandle, pathParts: string[]): Promise<string[]> {
  try {
    let dir = root;
    for (const part of pathParts) {
      dir = await dir.getDirectoryHandle(part);
    }

    const names: string[] = [];
    for await (const entry of (dir as any).values()) {
      if (entry.kind === 'directory') {
        names.push(entry.name);
      }
    }
    return names.sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

function stripFrontmatter(markdown: string): string {
  return markdown.replace(/^---\n[\s\S]*?\n---\n?/m, '').trim();
}

function compactMarkdown(markdown: string | null | undefined, maxLength = 1400): string {
  if (!markdown) return '';
  const compact = stripFrontmatter(markdown)
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/`+/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength).trim()}…`;
}

function loadContextCache(): VaultContextCache | null {
  try {
    const raw = localStorage.getItem(CONTEXT_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as VaultContextCache;
  } catch {
    return null;
  }
}

function saveContextCache(cache: VaultContextCache): void {
  try {
    localStorage.setItem(CONTEXT_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore storage failures
  }
}

function yamlFrontmatter(data: Record<string, string | number | boolean>): string {
  const lines = Object.entries(data).map(([k, v]) => `${k}: ${JSON.stringify(v)}`);
  return `---\n${lines.join('\n')}\n---\n\n`;
}

function countCompletedPages(book: BrainBookInput): number {
  return Object.values(book.pagesStatus || {}).filter((status) => status === 'completed').length;
}

function getRemainingPages(book: BrainBookInput): number {
  const target = book.targetPages || book.outline?.pages?.length || countCompletedPages(book);
  return Math.max(0, target - countCompletedPages(book));
}

function formatNicheMd(profile: NicheBrainProfile, state: BrainState): string {
  const fm = yamlFrontmatter({
    type: 'niche',
    keyword: profile.keyword,
    booksCount: profile.booksCount,
    pagesGenerated: profile.pagesGenerated,
    avgMarketScore: profile.avgMarketScore,
    avgTokensPerPage: profile.avgTokensPerPage,
    bestMarketScore: profile.bestMarketScore,
    lastUpdated: profile.lastUpdated,
  });

  let body = fm;
  body += `# Nische: ${profile.keyword}\n\n`;
  body += `## Statistik\n`;
  body += `- Bücher: ${profile.booksCount}\n`;
  body += `- Generierte Seiten: ${profile.pagesGenerated}\n`;
  body += `- Ø Tokens/Seite: ${profile.avgTokensPerPage}\n`;
  body += `- Ø Markt-Score: ${profile.avgMarketScore}\n\n`;

  if (profile.successPatterns.length > 0) {
    body += `## Was funktioniert\n`;
    profile.successPatterns.forEach((p) => { body += `- ${p}\n`; });
    body += `\n`;
  }
  if (profile.avoidPatterns.length > 0) {
    body += `## Was vermeiden\n`;
    profile.avoidPatterns.forEach((p) => { body += `- ${p}\n`; });
    body += `\n`;
  }

  body += `## System\n`;
  body += `- Globale Ø Tokens/Seite: ${state.avgTokensPerPage}\n`;
  body += `- Brain-Seiten gesamt: ${state.totalPagesLearned}\n`;
  return body;
}

function formatChapterMd(book: BrainBookInput, pageNum: number, memory: ChapterMemory): string {
  const fm = yamlFrontmatter({
    type: 'chapter',
    bookId: book.id,
    bookTitle: book.title,
    page: pageNum,
    chapterTitle: memory.chapter_title,
    niche: book.marketNiche || book.title,
    learnedAt: new Date().toISOString(),
  });

  let body = fm;
  body += `# ${memory.chapter_title}\n\n`;
  body += `> Buch: [[${slugify(book.title)}/meta|${book.title}]]\n\n`;
  body += `## Zusammenfassung\n${memory.chapter_summary}\n\n`;
  body += `## Einstieg\n${memory.opening_sentences}\n\n`;
  if (memory.key_facts.length > 0) {
    body += `## Key Facts\n`;
    memory.key_facts.forEach((fact) => { body += `- ${fact}\n`; });
    body += `\n`;
  }
  if (memory.key_terms.length > 0) {
    body += `## Begriffe\n${memory.key_terms.join(', ')}\n`;
  }
  return body;
}

function formatBookMetaMd(book: BrainBookInput, state: BrainState): string {
  const completed = countCompletedPages(book);
  const fm = yamlFrontmatter({
    type: 'book',
    id: book.id,
    title: book.title,
    niche: book.marketNiche || book.title,
    language: book.language || 'de',
    pages: book.targetPages || completed,
    marketScore: book.marketScore || 0,
    earningsPotential: book.earningsPotential || 'unknown',
    status: book.bookStatus || 'working',
    completedPages: completed,
    lastUpdated: new Date().toISOString(),
  });

  let body = fm;
  body += `# ${book.title}\n\n`;
  if (book.subtitle) body += `*${book.subtitle}*\n\n`;
  body += `## Meta\n`;
  body += `- Nische: [[${slugify(book.marketNiche || book.title)}]]\n`;
  body += `- Status: ${book.bookStatus || 'working'}\n`;
  body += `- Zielseiten: ${book.targetPages || 'unbekannt'}\n`;
  body += `- Seiten fertig: ${completed}\n`;
  body += `- Restseiten: ${getRemainingPages(book)}\n`;
  body += `- Format: ${book.pageSize || '6x9'}\n`;
  body += `- Stil: ${book.writingStyle || 'Sachbuch'}\n\n`;
  if (book.idea) {
    body += `## Idee\n${book.idea}\n\n`;
  }
  body += `## Brain\n`;
  body += `- System Ø Tokens/Seite: ${state.avgTokensPerPage}\n`;
  return body;
}

function formatSystemMd(state: BrainState): string {
  const fm = yamlFrontmatter({
    type: 'brain-system',
    totalPagesLearned: state.totalPagesLearned,
    totalBooksTracked: state.totalBooksTracked,
    avgTokensPerPage: state.avgTokensPerPage,
    nicheCount: Object.keys(state.niches).length,
    lastUpdated: new Date().toISOString(),
  });

  let body = fm;
  body += `# Book24 Brain — Systemzustand\n\n`;
  body += `| Metrik | Wert |\n|--------|------|\n`;
  body += `| Seiten gelernt | ${state.totalPagesLearned} |\n`;
  body += `| Bücher | ${state.totalBooksTracked} |\n`;
  body += `| Nischen | ${Object.keys(state.niches).length} |\n`;
  body += `| Ø Tokens/Seite | ${state.avgTokensPerPage} |\n\n`;

  body += `## Top Nischen\n`;
  const ranked = Object.values(state.niches)
    .sort((a, b) => b.avgMarketScore - a.avgMarketScore || b.pagesGenerated - a.pagesGenerated)
    .slice(0, 8);
  ranked.forEach((niche) => {
    body += `- [[${niche.slug}]] — Score ${niche.avgMarketScore}, ${niche.pagesGenerated} Seiten\n`;
  });

  body += `\n## Letzte Events\n`;
  state.events.slice(0, 15).forEach((event) => {
    body += `- \`${event.timestamp.slice(0, 16).replace('T', ' ')}\` ${event.message}\n`;
  });
  return body;
}

function formatPatternsMd(state: BrainState, kind: 'success' | 'avoid'): string {
  const list = kind === 'success' ? state.patterns.success : state.patterns.avoid;
  const title = kind === 'success' ? 'Erfolgreiche Patterns' : 'Vermeiden';
  let body = yamlFrontmatter({ type: `pattern-${kind}`, count: list.length, lastUpdated: new Date().toISOString() });
  body += `# ${title}\n\n`;
  list.forEach((entry) => { body += `- ${entry}\n`; });
  return body;
}

function formatLearningLogMd(
  book: BrainBookInput,
  pageNum: number,
  memory: ChapterMemory,
  state: BrainState
): string {
  const niche = book.marketNiche || book.title;
  let body = yamlFrontmatter({
    type: 'learning-log',
    bookId: book.id,
    bookTitle: book.title,
    niche,
    page: pageNum,
    learnedAt: new Date().toISOString(),
  });
  body += `# Lern-Event — ${book.title} / Seite ${pageNum}\n\n`;
  body += `- Nische: ${niche}\n`;
  body += `- Kapitel: ${memory.chapter_title}\n`;
  body += `- Gesamtseiten gelernt: ${state.totalPagesLearned}\n\n`;
  body += `## Summary\n${memory.chapter_summary}\n\n`;
  body += `## Einstieg\n${memory.opening_sentences}\n\n`;
  if (memory.key_facts.length > 0) {
    body += `## Key Facts\n`;
    memory.key_facts.forEach((fact) => { body += `- ${fact}\n`; });
    body += `\n`;
  }
  if (memory.key_terms.length > 0) {
    body += `## Begriffe\n${memory.key_terms.join(', ')}\n`;
  }
  return body;
}

function formatGoalMd(accountId: string, state: BrainState, books: BrainBookInput[]): string {
  const activeBooks = books
    .filter((book) => (book.bookStatus || 'working') !== 'done')
    .sort((a, b) => getRemainingPages(b) - getRemainingPages(a));
  const topNiches = Object.values(state.niches)
    .sort((a, b) => b.pagesGenerated - a.pagesGenerated)
    .slice(0, 5);

  let body = yamlFrontmatter({
    type: 'workspace-goal',
    accountId,
    updatedAt: new Date().toISOString(),
  });
  body += `# Goal\n\n`;
  body += `Dieses Vault ist der aktive Arbeits- und Lernspeicher für Book24 Studio. Ziel ist ein selbstverbesserndes KDP-System, das Kontext behält, Generierungen verdichtet und Code-/Produktentscheidungen schneller macht.\n\n`;
  body += `## Hauptziele\n`;
  body += `- Jede neue Generation soll aus vorhandenen Patterns, Logs und Projektwissen lernen.\n`;
  body += `- Kontext aus Vault, Architektur und aktiven Projekten soll sofort wieder in die nächste Generation einfließen.\n`;
  body += `- Obsidian bleibt die zentrale Quelle für Goal, Progress, Summary, Codewissen und Learnings.\n\n`;

  body += `## Aktive Buchziele\n`;
  if (activeBooks.length === 0) {
    body += `- Aktuell keine offenen Buchziele.\n`;
  } else {
    activeBooks.slice(0, 8).forEach((book) => {
      body += `- ${book.title} — ${countCompletedPages(book)}/${book.targetPages || countCompletedPages(book)} Seiten, Rest: ${getRemainingPages(book)}\n`;
    });
  }

  body += `\n## Fokus-Nischen\n`;
  if (topNiches.length === 0) {
    body += `- Noch keine Nischen gelernt.\n`;
  } else {
    topNiches.forEach((niche) => {
      body += `- ${niche.keyword} — ${niche.pagesGenerated} Seiten gelernt, Score Ø ${niche.avgMarketScore}\n`;
    });
  }

  body += `\n## Operating Rules\n`;
  body += `- Goal, Progress und Summary werden automatisch aktualisiert.\n`;
  body += `- Architektur- und Codewissen aus dem Vault ist Teil des Generationskontexts.\n`;
  body += `- Neue Learnings dürfen geschrieben werden, aber der Kernkontext bleibt in festen Root-Dateien gebündelt.\n`;
  return body;
}

function formatProgressMd(state: BrainState, books: BrainBookInput[]): string {
  const completedBooks = books.filter((book) => getRemainingPages(book) === 0 && books.length > 0);
  const activeBooks = books.filter((book) => getRemainingPages(book) > 0);

  let body = yamlFrontmatter({
    type: 'workspace-progress',
    updatedAt: new Date().toISOString(),
    booksTracked: books.length,
    eventsTracked: state.totalEvents,
  });
  body += `# Progress\n\n`;
  body += `## KPI\n`;
  body += `- Gelernte Seiten: ${state.totalPagesLearned}\n`;
  body += `- Verfolgte Bücher: ${Math.max(state.totalBooksTracked, books.length)}\n`;
  body += `- Nischen: ${Object.keys(state.niches).length}\n`;
  body += `- Events: ${state.totalEvents}\n`;
  body += `- Obsidian Files Written: ${state.obsidianFilesWritten}\n`;
  body += `- Letzter Obsidian Sync: ${state.obsidianLastSync || 'noch keiner'}\n\n`;

  body += `## Buchstatus\n`;
  if (books.length === 0) {
    body += `- Noch keine Buchprojekte vorhanden.\n`;
  } else {
    books.slice(0, 12).forEach((book) => {
      body += `- ${book.title}: ${countCompletedPages(book)}/${book.targetPages || countCompletedPages(book)} Seiten, Status ${book.bookStatus || 'working'}\n`;
    });
  }

  body += `\n## Offene Arbeit\n`;
  if (activeBooks.length === 0) {
    body += `- Keine offenen Seiten mehr.\n`;
  } else {
    activeBooks
      .sort((a, b) => getRemainingPages(b) - getRemainingPages(a))
      .slice(0, 8)
      .forEach((book) => {
        body += `- ${book.title}: noch ${getRemainingPages(book)} Seiten offen\n`;
      });
  }

  body += `\n## Fertig\n`;
  if (completedBooks.length === 0) {
    body += `- Noch kein Projekt vollständig abgeschlossen.\n`;
  } else {
    completedBooks.slice(0, 8).forEach((book) => {
      body += `- ${book.title}\n`;
    });
  }

  body += `\n## Letzte Brain-Events\n`;
  state.events.slice(0, 12).forEach((event) => {
    body += `- ${event.timestamp.slice(0, 16).replace('T', ' ')} — ${event.message}\n`;
  });
  return body;
}

function formatSummaryMd(state: BrainState, books: BrainBookInput[]): string {
  const bestPatterns = state.patterns.success.slice(0, 8);
  const avoidPatterns = state.patterns.avoid.slice(0, 8);
  const hottestBook = [...books].sort((a, b) => countCompletedPages(b) - countCompletedPages(a))[0];

  let body = yamlFrontmatter({
    type: 'workspace-summary',
    updatedAt: new Date().toISOString(),
  });
  body += `# Summary\n\n`;
  body += `## Jetzt wichtig\n`;
  body += `- Brain sammelt Pattern, Buchfortschritt, Kapitelwissen und Vault-Kontext.\n`;
  body += `- Dieses Dokument ist die schnelle Management-Zusammenfassung für die nächste Session oder Generation.\n`;
  if (hottestBook) {
    body += `- Derzeit am weitesten: ${hottestBook.title} mit ${countCompletedPages(hottestBook)} fertigen Seiten.\n`;
  }

  body += `\n## Success Patterns\n`;
  if (bestPatterns.length === 0) {
    body += `- Noch keine stabilen Success Patterns vorhanden.\n`;
  } else {
    bestPatterns.forEach((pattern) => { body += `- ${pattern}\n`; });
  }

  body += `\n## Avoid Patterns\n`;
  if (avoidPatterns.length === 0) {
    body += `- Noch keine Avoid Patterns vorhanden.\n`;
  } else {
    avoidPatterns.forEach((pattern) => { body += `- ${pattern}\n`; });
  }

  body += `\n## Top Bereiche\n`;
  Object.values(state.niches)
    .sort((a, b) => b.pagesGenerated - a.pagesGenerated)
    .slice(0, 6)
    .forEach((niche) => {
      body += `- ${niche.keyword}: ${niche.pagesGenerated} Seiten, Ø ${niche.avgTokensPerPage} Tokens/Seite\n`;
    });
  return body;
}

function formatCodebaseMd(): string {
  let body = yamlFrontmatter({
    type: 'workspace-codebase',
    updatedAt: new Date().toISOString(),
  });
  body += `# Codebase\n\n`;
  body += `Dieses Dokument fasst die wichtigsten Projektmodule zusammen, damit Generierungen und Coding-Sessions schneller werden.\n\n`;
  body += `## Kernpfade\n`;
  body += `- src/App.tsx — zentrale App, Routing-artige Tab-Logik, Brain/Studio/UI-Flow\n`;
  body += `- src/services/GeminiService.ts — LLM/Content-Generierung\n`;
  body += `- src/services/cmie/ — Iterative Kapitelgenerierung, Duplikat- und Konsistenzschutz\n`;
  body += `- src/services/brain/BrainService.ts — Lernlogik und Kontextaufbau\n`;
  body += `- src/services/brain/ObsidianSyncService.ts — Vault-Sync, Cache, Workspace-Kontext\n`;
  body += `- src/services/brain/CloudQueueService.ts — Cloud/Warteschlange für Brain/Obsidian-Sync\n`;
  body += `- src/services/StorageService.ts — Buch-/Account-Speicherung lokal + Cloud\n`;
  body += `- src/components/BrainDashboard.tsx — 3D Brain UI\n`;
  body += `- vault/CLAUDE.md + vault/architecture/*.md — dauerhaftes Projektwissen\n\n`;

  body += `## Coding-Regeln\n`;
  body += `- Vor Änderungen Vault-Kontext lesen.\n`;
  body += `- Goal/Progress/Summary nutzen, um Session-Kontext schnell wiederherzustellen.\n`;
  body += `- Brain- und Obsidian-Code so behandeln, dass das System iterativ besser wird statt nur Daten zu exportieren.\n`;
  return body;
}

export class ObsidianSyncService {
  private static rootHandle: DirHandle | null = null;
  private static initPromise: Promise<void> | null = null;

  static isConnected(): boolean {
    return !!this.rootHandle;
  }

  static async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = (async () => {
      const handle = await loadHandle();
      if (handle) {
        try {
          const perm = await (handle as any).queryPermission?.({ mode: 'readwrite' });
          if (perm === 'granted') {
            this.rootHandle = handle;
          } else {
            const req = await (handle as any).requestPermission?.({ mode: 'readwrite' });
            if (req === 'granted') this.rootHandle = handle;
          }
        } catch {
          this.rootHandle = null;
        }
      }
      if (this.rootHandle) {
        await this.ensureWorkspaceScaffold();
        await this.refreshContextCache();
      }
    })();
    return this.initPromise;
  }

  static async connectVault(): Promise<boolean> {
    if (!window.showDirectoryPicker) {
      alert(
        '⚠️ Hinweis für Safari / Firefox Nutzer:\n\n' +
        'Apple Safari blockiert aus Sicherheitsgründen den direkten lokalen Dateizugriff für Web-Apps.\n\n' +
        '👉 Damit deine KDP-Kapitel vollautomatisch als Markdown (.md) in deinen Obsidian-Ordner gespiegelt werden können, kopiere bitte die URL oben und öffne diese Studio-App kurz in Google Chrome, Microsoft Edge oder Brave!'
      );
      return false;
    }
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      await saveHandle(handle);
      this.rootHandle = handle;
      await this.ensureWorkspaceScaffold();
      await this.refreshContextCache();
      return true;
    } catch {
      return false;
    }
  }

  static async disconnectVault(): Promise<void> {
    this.rootHandle = null;
    try {
      localStorage.removeItem(CONTEXT_CACHE_KEY);
      const db = await openIdb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).delete(HANDLE_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    } catch {
      // ignore
    }
  }

  private static async writeIfConnected(pathParts: string[], content: string): Promise<boolean> {
    await this.init();
    if (!this.rootHandle) return false;
    try {
      await writeTextFile(this.rootHandle, pathParts, content);
      return true;
    } catch (err) {
      console.warn('Obsidian sync write failed:', err);
      return false;
    }
  }

  private static async writeIfMissing(pathParts: string[], content: string): Promise<boolean> {
    await this.init();
    if (!this.rootHandle) return false;
    const existing = await readTextFile(this.rootHandle, pathParts);
    if (existing != null) return false;
    try {
      await writeTextFile(this.rootHandle, pathParts, content);
      return true;
    } catch (err) {
      console.warn('Obsidian scaffold write failed:', err);
      return false;
    }
  }

  static async ensureWorkspaceScaffold(): Promise<number> {
    await this.init();
    if (!this.rootHandle) return 0;
    let written = 0;
    if (await this.writeIfMissing([ROOT_GOAL_FILE], '# Goal\n\nWird automatisch von Book24 gepflegt.\n')) written++;
    if (await this.writeIfMissing([ROOT_PROGRESS_FILE], '# Progress\n\nWird automatisch von Book24 gepflegt.\n')) written++;
    if (await this.writeIfMissing([ROOT_SUMMARY_FILE], '# Summary\n\nWird automatisch von Book24 gepflegt.\n')) written++;
    if (await this.writeIfMissing([ROOT_CODEBASE_FILE], '# Codebase\n\nWird automatisch von Book24 gepflegt.\n')) written++;
    return written;
  }

  static getCachedGenerationContext(book: BrainBookInput): string {
    const cache = loadContextCache();
    if (!cache) return '';

    const nicheSlug = slugify(book.marketNiche || book.title);
    const bookSlug = slugify(book.title);
    const chunks = [
      cache.goal,
      cache.progress,
      cache.summary,
      cache.codebase,
      ...cache.architecture,
      cache.claude,
      cache.system,
      cache.successPatterns,
      cache.avoidPatterns,
      cache.niches[nicheSlug] || '',
      cache.books[bookSlug] || '',
      ...cache.recentLogs,
    ].filter(Boolean);

    if (chunks.length === 0) return '';

    return [
      '### [OBSIDIAN VAULT KONTEXT]',
      ...chunks.map((chunk, index) => compactMarkdown(chunk, index < 4 ? 1200 : 900)),
      'Nutze diese vorhandenen Markdown-Notizen als bereits gelerntes Projektwissen, Coding-Kontext und operativen Speicher. Lerne implizit weiter und halte Goal/Progress/Summary konsistent.',
      '',
    ].join('\n');
  }

  static async refreshContextCache(): Promise<void> {
    await this.init();
    if (!this.rootHandle) return;

    const [
      claude,
      system,
      successPatterns,
      avoidPatterns,
      goal,
      progress,
      summary,
      codebase,
      brainArchitecture,
      cmieArchitecture,
      graphicsArchitecture,
      nicheFiles,
      logFiles,
      bookDirs,
    ] = await Promise.all([
      readTextFile(this.rootHandle, ['CLAUDE.md']),
      readTextFile(this.rootHandle, ['99-Brain-State', 'system.md']),
      readTextFile(this.rootHandle, ['03-Patterns', 'erfolgreich.md']),
      readTextFile(this.rootHandle, ['03-Patterns', 'vermeiden.md']),
      readTextFile(this.rootHandle, [ROOT_GOAL_FILE]),
      readTextFile(this.rootHandle, [ROOT_PROGRESS_FILE]),
      readTextFile(this.rootHandle, [ROOT_SUMMARY_FILE]),
      readTextFile(this.rootHandle, [ROOT_CODEBASE_FILE]),
      readTextFile(this.rootHandle, ['architecture', 'brain.md']),
      readTextFile(this.rootHandle, ['architecture', 'cmie.md']),
      readTextFile(this.rootHandle, ['architecture', 'graphics.md']),
      listMarkdownFiles(this.rootHandle, ['01-Nischen']),
      listMarkdownFiles(this.rootHandle, ['logs']),
      listDirectories(this.rootHandle, ['02-Buecher']),
    ]);

    const niches: Record<string, string> = {};
    for (const fileName of nicheFiles.slice(0, 60)) {
      const content = await readTextFile(this.rootHandle, ['01-Nischen', fileName]);
      if (content) {
        niches[fileName.replace(/\.md$/i, '')] = content;
      }
    }

    const books: Record<string, string> = {};
    for (const bookDir of bookDirs.slice(0, 60)) {
      const meta = await readTextFile(this.rootHandle, ['02-Buecher', bookDir, 'meta.md']);
      if (meta) {
        books[bookDir] = meta;
      }
    }

    const recentLogs: string[] = [];
    for (const fileName of logFiles.slice(0, 5)) {
      const content = await readTextFile(this.rootHandle, ['logs', fileName]);
      if (content) {
        recentLogs.push(content);
      }
    }

    saveContextCache({
      updatedAt: new Date().toISOString(),
      claude: claude || '',
      system: system || '',
      successPatterns: successPatterns || '',
      avoidPatterns: avoidPatterns || '',
      goal: goal || '',
      progress: progress || '',
      summary: summary || '',
      codebase: codebase || '',
      architecture: [brainArchitecture, cmieArchitecture, graphicsArchitecture].filter(Boolean) as string[],
      recentLogs,
      niches,
      books,
    });
  }

  static async syncWorkspaceSnapshot(accountId: string, state: BrainState, books: BrainBookInput[]): Promise<number> {
    let written = 0;
    if (await this.writeIfConnected([ROOT_GOAL_FILE], formatGoalMd(accountId, state, books))) written++;
    if (await this.writeIfConnected([ROOT_PROGRESS_FILE], formatProgressMd(state, books))) written++;
    if (await this.writeIfConnected([ROOT_SUMMARY_FILE], formatSummaryMd(state, books))) written++;
    if (await this.writeIfConnected([ROOT_CODEBASE_FILE], formatCodebaseMd())) written++;
    if (await this.writeIfConnected(['99-Brain-State', 'system.md'], formatSystemMd(state))) written++;
    if (await this.writeIfConnected(['03-Patterns', 'erfolgreich.md'], formatPatternsMd(state, 'success'))) written++;
    if (await this.writeIfConnected(['03-Patterns', 'vermeiden.md'], formatPatternsMd(state, 'avoid'))) written++;
    if (written > 0) {
      await this.refreshContextCache();
    }
    return written;
  }

  static async syncPageLearned(
    book: BrainBookInput,
    pageNum: number,
    memory: ChapterMemory,
    state: BrainState
  ): Promise<number> {
    let written = 0;
    const bookSlug = slugify(book.title);
    const nicheSlug = slugify(book.marketNiche || book.title);
    const dayKey = new Date().toISOString().slice(0, 10);

    if (await this.writeIfConnected(['02-Buecher', bookSlug, 'kapitel', `${String(pageNum).padStart(2, '0')}.md`], formatChapterMd(book, pageNum, memory))) written++;
    if (await this.writeIfConnected(['02-Buecher', bookSlug, 'meta.md'], formatBookMetaMd(book, state))) written++;
    if (await this.writeIfConnected(['04-Learnings', dayKey, `${bookSlug}-seite-${String(pageNum).padStart(2, '0')}.md`], formatLearningLogMd(book, pageNum, memory, state))) written++;
    const niche = state.niches[nicheSlug];
    if (niche && await this.writeIfConnected(['01-Nischen', `${nicheSlug}.md`], formatNicheMd(niche, state))) written++;
    if (await this.writeIfConnected(['99-Brain-State', 'system.md'], formatSystemMd(state))) written++;
    if (await this.writeIfConnected(['03-Patterns', 'erfolgreich.md'], formatPatternsMd(state, 'success'))) written++;
    if (await this.writeIfConnected(['03-Patterns', 'vermeiden.md'], formatPatternsMd(state, 'avoid'))) written++;
    if (written > 0) {
      await this.refreshContextCache();
    }
    return written;
  }

  static async syncNicheProfile(profile: NicheBrainProfile | undefined, state: BrainState): Promise<number> {
    if (!profile) return 0;
    let written = 0;
    if (await this.writeIfConnected(['01-Nischen', `${profile.slug}.md`], formatNicheMd(profile, state))) written++;
    if (await this.writeIfConnected(['99-Brain-State', 'system.md'], formatSystemMd(state))) written++;
    if (written > 0) {
      await this.refreshContextCache();
    }
    return written;
  }

  static async syncBookMeta(book: BrainBookInput, state: BrainState): Promise<number> {
    let written = 0;
    const bookSlug = slugify(book.title);
    if (await this.writeIfConnected(['02-Buecher', bookSlug, 'meta.md'], formatBookMetaMd(book, state))) written++;
    if (await this.writeIfConnected(['99-Brain-State', 'system.md'], formatSystemMd(state))) written++;
    if (written > 0) {
      await this.refreshContextCache();
    }
    return written;
  }

  static async syncFullState(state: BrainState, books: BrainBookInput[], accountId = 'default'): Promise<number> {
    let written = 0;
    for (const profile of Object.values(state.niches)) {
      if (await this.writeIfConnected(['01-Nischen', `${profile.slug}.md`], formatNicheMd(profile, state))) written++;
    }
    for (const book of books) {
      if (await this.writeIfConnected(['02-Buecher', slugify(book.title), 'meta.md'], formatBookMetaMd(book, state))) written++;
      const pages = book.pagesText || {};
      for (const [pageStr] of Object.entries(pages)) {
        const pageNum = Number(pageStr);
        const memory = book.cmieStore?.[pageNum];
        if (memory) {
          if (await this.writeIfConnected(
            ['02-Buecher', slugify(book.title), 'kapitel', `${String(pageNum).padStart(2, '0')}.md`],
            formatChapterMd(book, pageNum, memory)
          )) written++;
          if (await this.writeIfConnected(
            ['04-Learnings', new Date().toISOString().slice(0, 10), `${slugify(book.title)}-seite-${String(pageNum).padStart(2, '0')}.md`],
            formatLearningLogMd(book, pageNum, memory, state)
          )) written++;
        }
      }
    }
    written += await this.syncWorkspaceSnapshot(accountId, state, books);
    return written;
  }
}
