import type { ChapterMemory } from '../../types/cmie';
import type { BrainBookInput, BrainState, NicheBrainProfile } from '../../types/brain';
import { slugify } from './BrainService';

const IDB_NAME = 'book24_obsidian_vault';
const IDB_STORE = 'handles';
const HANDLE_KEY = 'vault_root';

type DirHandle = FileSystemDirectoryHandle;

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

function yamlFrontmatter(data: Record<string, string | number | boolean>): string {
  const lines = Object.entries(data).map(([k, v]) => `${k}: ${JSON.stringify(v)}`);
  return `---\n${lines.join('\n')}\n---\n\n`;
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
    profile.successPatterns.forEach(p => { body += `- ${p}\n`; });
    body += `\n`;
  }
  if (profile.avoidPatterns.length > 0) {
    body += `## Was vermeiden\n`;
    profile.avoidPatterns.forEach(p => { body += `- ${p}\n`; });
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
    memory.key_facts.forEach(f => { body += `- ${f}\n`; });
    body += `\n`;
  }
  if (memory.key_terms.length > 0) {
    body += `## Begriffe\n${memory.key_terms.join(', ')}\n`;
  }
  return body;
}

function formatBookMetaMd(book: BrainBookInput, state: BrainState): string {
  const completed = Object.values(book.pagesStatus || {}).filter(s => s === 'completed').length;
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
  body += `- Seiten fertig: ${completed}\n`;
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
  ranked.forEach(n => {
    body += `- [[${n.slug}]] — Score ${n.avgMarketScore}, ${n.pagesGenerated} Seiten\n`;
  });

  body += `\n## Letzte Events\n`;
  state.events.slice(0, 15).forEach(e => {
    body += `- \`${e.timestamp.slice(0, 16).replace('T', ' ')}\` ${e.message}\n`;
  });
  return body;
}

function formatPatternsMd(state: BrainState, kind: 'success' | 'avoid'): string {
  const list = kind === 'success' ? state.patterns.success : state.patterns.avoid;
  const title = kind === 'success' ? 'Erfolgreiche Patterns' : 'Vermeiden';
  let body = yamlFrontmatter({ type: `pattern-${kind}`, count: list.length, lastUpdated: new Date().toISOString() });
  body += `# ${title}\n\n`;
  list.forEach(p => { body += `- ${p}\n`; });
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
    })();
    return this.initPromise;
  }

  static async connectVault(): Promise<boolean> {
    if (!window.showDirectoryPicker) {
      alert('Dein Browser unterstützt keinen direkten Vault-Zugriff. Nutze Chrome/Edge.');
      return false;
    }
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      await saveHandle(handle);
      this.rootHandle = handle;
      return true;
    } catch {
      return false;
    }
  }

  static async disconnectVault(): Promise<void> {
    this.rootHandle = null;
    try {
      const db = await openIdb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).delete(HANDLE_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    } catch { /* ignore */ }
  }

  private static async writeIfConnected(
    pathParts: string[],
    content: string
  ): Promise<boolean> {
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

  static async syncPageLearned(
    book: BrainBookInput,
    pageNum: number,
    memory: ChapterMemory,
    state: BrainState
  ): Promise<number> {
    let written = 0;
    const bookSlug = slugify(book.title);
    const nicheSlug = slugify(book.marketNiche || book.title);

    if (await this.writeIfConnected(['02-Buecher', bookSlug, 'kapitel', `${String(pageNum).padStart(2, '0')}.md`], formatChapterMd(book, pageNum, memory))) written++;
    if (await this.writeIfConnected(['02-Buecher', bookSlug, 'meta.md'], formatBookMetaMd(book, state))) written++;
    const niche = state.niches[nicheSlug];
    if (niche && await this.writeIfConnected(['01-Nischen', `${nicheSlug}.md`], formatNicheMd(niche, state))) written++;
    if (await this.writeIfConnected(['99-Brain-State', 'system.md'], formatSystemMd(state))) written++;
    if (await this.writeIfConnected(['03-Patterns', 'erfolgreich.md'], formatPatternsMd(state, 'success'))) written++;
    if (await this.writeIfConnected(['03-Patterns', 'vermeiden.md'], formatPatternsMd(state, 'avoid'))) written++;
    return written;
  }

  static async syncNicheProfile(profile: NicheBrainProfile | undefined, state: BrainState): Promise<number> {
    if (!profile) return 0;
    let written = 0;
    if (await this.writeIfConnected(['01-Nischen', `${profile.slug}.md`], formatNicheMd(profile, state))) written++;
    if (await this.writeIfConnected(['99-Brain-State', 'system.md'], formatSystemMd(state))) written++;
    return written;
  }

  static async syncBookMeta(book: BrainBookInput, state: BrainState): Promise<number> {
    let written = 0;
    const bookSlug = slugify(book.title);
    if (await this.writeIfConnected(['02-Buecher', bookSlug, 'meta.md'], formatBookMetaMd(book, state))) written++;
    if (await this.writeIfConnected(['99-Brain-State', 'system.md'], formatSystemMd(state))) written++;
    return written;
  }

  static async syncFullState(state: BrainState, books: BrainBookInput[]): Promise<number> {
    let written = 0;
    for (const profile of Object.values(state.niches)) {
      if (await this.writeIfConnected(['01-Nischen', `${profile.slug}.md`], formatNicheMd(profile, state))) written++;
    }
    for (const book of books) {
      if (await this.writeIfConnected(['02-Buecher', slugify(book.title), 'meta.md'], formatBookMetaMd(book, state))) written++;
      const pages = book.pagesText || {};
      for (const [pageStr, _text] of Object.entries(pages)) {
        const pageNum = Number(pageStr);
        const memory = book.cmieStore?.[pageNum];
        if (memory) {
          if (await this.writeIfConnected(
            ['02-Buecher', slugify(book.title), 'kapitel', `${String(pageNum).padStart(2, '0')}.md`],
            formatChapterMd(book, pageNum, memory)
          )) written++;
        }
      }
    }
    if (await this.writeIfConnected(['99-Brain-State', 'system.md'], formatSystemMd(state))) written++;
    if (await this.writeIfConnected(['03-Patterns', 'erfolgreich.md'], formatPatternsMd(state, 'success'))) written++;
    if (await this.writeIfConnected(['03-Patterns', 'vermeiden.md'], formatPatternsMd(state, 'avoid'))) written++;
    return written;
  }
}
