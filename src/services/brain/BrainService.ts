import type { ChapterMemory, CmiePageStatus } from '../../types/cmie';
import type {
  BrainBookInput,
  BrainEvent,
  BrainState,
  NicheBrainProfile,
} from '../../types/brain';
import { EMPTY_BRAIN_STATE } from '../../types/brain';
import { ObsidianSyncService } from './ObsidianSyncService';

const BRAIN_KEY = (accountId: string) => `b24studio_v1_brain_${accountId}`;
const MAX_EVENTS = 120;
const MAX_PATTERNS = 40;
const EST_CHARS_PER_TOKEN = 4;

export function slugify(text: string): string {
  return (text || 'unbekannt')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'unbekannt';
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil((text || '').length / EST_CHARS_PER_TOKEN));
}

function nicheKeyword(book: BrainBookInput): string {
  return (book.marketNiche || book.title || 'Allgemein').trim();
}

function pushEvent(
  state: BrainState,
  partial: Omit<BrainEvent, 'id' | 'timestamp'>
): BrainState {
  const event: BrainEvent = {
    ...partial,
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
  };
  return {
    ...state,
    events: [event, ...state.events].slice(0, MAX_EVENTS),
    totalEvents: state.totalEvents + 1,
  };
}

function upsertPattern(list: string[], entry: string, max = MAX_PATTERNS): string[] {
  const trimmed = entry.trim();
  if (!trimmed || list.includes(trimmed)) return list;
  return [trimmed, ...list].slice(0, max);
}

function upsertNiche(
  state: BrainState,
  book: BrainBookInput,
  patch: Partial<NicheBrainProfile> = {}
): BrainState {
  const keyword = nicheKeyword(book);
  const slug = slugify(keyword);
  const existing = state.niches[slug];
  const linked = new Set(existing?.linkedBookIds || []);
  linked.add(book.id);

  const next: NicheBrainProfile = {
    keyword,
    slug,
    booksCount: linked.size,
    pagesGenerated: existing?.pagesGenerated || 0,
    avgMarketScore: existing?.avgMarketScore || 0,
    avgTokensPerPage: existing?.avgTokensPerPage || 0,
    bestMarketScore: existing?.bestMarketScore || 0,
    lastUpdated: new Date().toISOString(),
    successPatterns: existing?.successPatterns || [],
    avoidPatterns: existing?.avoidPatterns || [],
    linkedBookIds: Array.from(linked),
    ...patch,
  };

  if (book.marketScore != null && book.marketScore > 0) {
    const prevCount = existing?.booksCount || 0;
    const prevAvg = existing?.avgMarketScore || 0;
    next.avgMarketScore = Math.round(
      (prevAvg * prevCount + book.marketScore) / Math.max(1, prevCount + (existing?.linkedBookIds.includes(book.id) ? 0 : 1))
    );
    next.bestMarketScore = Math.max(existing?.bestMarketScore || 0, book.marketScore);
  }

  return {
    ...state,
    niches: { ...state.niches, [slug]: next },
  };
}

export class BrainService {
  static loadState(accountId: string): BrainState {
    try {
      const raw = localStorage.getItem(BRAIN_KEY(accountId));
      if (!raw) return EMPTY_BRAIN_STATE();
      const parsed = JSON.parse(raw) as BrainState;
      return { ...EMPTY_BRAIN_STATE(), ...parsed, version: 1 };
    } catch {
      return EMPTY_BRAIN_STATE();
    }
  }

  static saveState(accountId: string, state: BrainState): void {
    localStorage.setItem(BRAIN_KEY(accountId), JSON.stringify(state));
  }

  static getState(accountId: string): BrainState {
    const state = this.loadState(accountId);
    return {
      ...state,
      obsidianConnected: ObsidianSyncService.isConnected(),
    };
  }

  static learnFromPage(
    accountId: string,
    book: BrainBookInput,
    pageNum: number,
    memory: ChapterMemory,
    cmieStatus: CmiePageStatus,
    pageText: string
  ): BrainState {
    let state = this.loadState(accountId);
    const tokens = estimateTokens(pageText);
    const niche = nicheKeyword(book);

    state = {
      ...state,
      totalPagesLearned: state.totalPagesLearned + 1,
      tokenSamples: state.tokenSamples + 1,
      avgTokensPerPage: Math.round(
        (state.avgTokensPerPage * state.tokenSamples + tokens) / (state.tokenSamples + 1)
      ),
    };

    const nicheSlug = slugify(niche);
    const nicheProfile = state.niches[nicheSlug];
    const prevPages = nicheProfile?.pagesGenerated || 0;
    const prevTok = nicheProfile?.avgTokensPerPage || 0;

    state = upsertNiche(state, book, {
      pagesGenerated: prevPages + 1,
      avgTokensPerPage: Math.round((prevTok * prevPages + tokens) / (prevPages + 1)),
      lastUpdated: new Date().toISOString(),
    });

    if (cmieStatus === 'similar') {
      const avoid = `Duplikat-Einstieg vermeiden (Kap. ${pageNum}: "${memory.opening_sentences.slice(0, 80)}...")`;
      state = {
        ...state,
        patterns: {
          ...state.patterns,
          avoid: upsertPattern(state.patterns.avoid, avoid),
        },
      };
      state = upsertNiche(state, book, {
        avoidPatterns: upsertPattern(state.niches[slugify(niche)]?.avoidPatterns || [], avoid, 15),
      });
      state = pushEvent(state, {
        type: 'pattern_avoid',
        bookId: book.id,
        bookTitle: book.title,
        niche,
        pageNum,
        message: `Anti-Pattern gelernt: Duplikat auf Seite ${pageNum}`,
        detail: memory.opening_sentences.slice(0, 120),
      });
    }

    if (cmieStatus === 'ok' && memory.key_terms.length >= 3) {
      const success = `Starker Begriffseinstieg in "${memory.chapter_title}" (${memory.key_terms.slice(0, 4).join(', ')})`;
      state = {
        ...state,
        patterns: {
          ...state.patterns,
          success: upsertPattern(state.patterns.success, success),
        },
      };
    }

    state = pushEvent(state, {
      type: 'page_learned',
      bookId: book.id,
      bookTitle: book.title,
      niche,
      pageNum,
      message: `Seite ${pageNum} gelernt — ~${tokens} Tokens`,
      detail: memory.chapter_summary.slice(0, 140),
    });

    this.saveState(accountId, state);
    void ObsidianSyncService.syncPageLearned(book, pageNum, memory, state);
    return state;
  }

  static learnFromOutline(accountId: string, book: BrainBookInput, pageCount: number): BrainState {
    let state = this.loadState(accountId);
    state = upsertNiche(state, book);
    state = pushEvent(state, {
      type: 'outline_planned',
      bookId: book.id,
      bookTitle: book.title,
      niche: nicheKeyword(book),
      message: `Gliederung geplant — ${pageCount} Seiten`,
      detail: book.idea?.slice(0, 120),
    });
    this.saveState(accountId, state);
    void ObsidianSyncService.syncNicheProfile(state.niches[slugify(nicheKeyword(book))], state);
    return state;
  }

  static trackBook(accountId: string, book: BrainBookInput): BrainState {
    let state = this.loadState(accountId);
    const completed = Object.values(book.pagesStatus || {}).filter(s => s === 'completed').length;
    state = upsertNiche(state, book);

    const alreadyTracked = state.events.some(e => e.type === 'book_tracked' && e.bookId === book.id);

    if (book.marketScore != null && book.marketScore >= 70) {
      const pattern = `${nicheKeyword(book)}: Score ${book.marketScore}, ${completed} Seiten, Format ${book.pageSize || '6x9'}`;
      state = {
        ...state,
        patterns: {
          ...state.patterns,
          success: upsertPattern(state.patterns.success, pattern),
        },
      };
      state = upsertNiche(state, book, {
        successPatterns: upsertPattern(state.niches[slugify(nicheKeyword(book))]?.successPatterns || [], pattern, 12),
      });
      state = pushEvent(state, {
        type: 'pattern_success',
        bookId: book.id,
        bookTitle: book.title,
        niche: nicheKeyword(book),
        message: `Erfolgs-Pattern gespeichert (Score ${book.marketScore})`,
      });
    }

    if (!alreadyTracked) {
      state = {
        ...state,
        totalBooksTracked: state.totalBooksTracked + 1,
      };
      state = pushEvent(state, {
        type: 'book_tracked',
        bookId: book.id,
        bookTitle: book.title,
        niche: nicheKeyword(book),
        message: `Buch "${book.title}" im Brain — ${completed} Seiten`,
      });
    } else if (book.marketScore != null && book.marketScore >= 70) {
      state = pushEvent(state, {
        type: 'niche_updated',
        bookId: book.id,
        bookTitle: book.title,
        niche: nicheKeyword(book),
        message: `"${book.title}" Score aktualisiert (${book.marketScore})`,
      });
    }

    this.saveState(accountId, state);
    void ObsidianSyncService.syncBookMeta(book, state);
    return state;
  }

  static rebuildFromLibrary(accountId: string, books: BrainBookInput[]): BrainState {
    let state = EMPTY_BRAIN_STATE();
    for (const book of books) {
      const pages = book.pagesText || {};
      for (const [pageStr, text] of Object.entries(pages)) {
        const pageNum = Number(pageStr);
        const memory = book.cmieStore?.[pageNum];
        const status = book.cmieStatus?.[pageNum] || 'ok';
        if (memory && text) {
          state = this.learnFromPageInternal(state, book, pageNum, memory, status, text);
        }
      }
      if (book.outline?.pages?.length) {
        state = upsertNiche(state, book);
      }
      state = this.trackBookInternal(state, book);
    }
    state = pushEvent(state, {
      type: 'brain_rebuilt',
      message: `Brain aus ${books.length} Büchern neu aufgebaut`,
      detail: `${state.totalPagesLearned} Seiten, ${Object.keys(state.niches).length} Nischen`,
    });
    this.saveState(accountId, state);
    void ObsidianSyncService.syncFullState(state, books);
    return state;
  }

  private static learnFromPageInternal(
    state: BrainState,
    book: BrainBookInput,
    pageNum: number,
    _memory: ChapterMemory,
    cmieStatus: CmiePageStatus,
    pageText: string
  ): BrainState {
    const tokens = estimateTokens(pageText);
    const niche = nicheKeyword(book);
    state = {
      ...state,
      totalPagesLearned: state.totalPagesLearned + 1,
      tokenSamples: state.tokenSamples + 1,
      avgTokensPerPage: Math.round(
        (state.avgTokensPerPage * state.tokenSamples + tokens) / (state.tokenSamples + 1)
      ),
    };
    const slug = slugify(niche);
    const nicheProfile = state.niches[slug];
    const prevPages = nicheProfile?.pagesGenerated || 0;
    const prevTok = nicheProfile?.avgTokensPerPage || 0;
    state = upsertNiche(state, book, {
      pagesGenerated: prevPages + 1,
      avgTokensPerPage: Math.round((prevTok * prevPages + tokens) / (prevPages + 1)),
    });
    if (cmieStatus === 'similar') {
      const avoid = `Duplikat-Einstieg vermeiden (Kap. ${pageNum})`;
      state = {
        ...state,
        patterns: { ...state.patterns, avoid: upsertPattern(state.patterns.avoid, avoid) },
      };
    }
    return state;
  }

  private static trackBookInternal(state: BrainState, book: BrainBookInput): BrainState {
    state = upsertNiche(state, book);
    state = { ...state, totalBooksTracked: Math.max(state.totalBooksTracked, state.niches[slugify(nicheKeyword(book))]?.linkedBookIds.length || 0) };
    return state;
  }

  static buildContextPrompt(accountId: string, book: BrainBookInput): string {
    const state = this.loadState(accountId);
    const slug = slugify(nicheKeyword(book));
    const niche = state.niches[slug];
    if (!niche && state.patterns.avoid.length === 0 && state.patterns.success.length === 0) {
      return '';
    }

    let prompt = `\n### [BOOK24 BRAIN] Globales Lern-Gedächtnis:\n`;

    if (niche) {
      prompt += `Nische "${niche.keyword}": ${niche.booksCount} Bücher, Ø ${niche.avgTokensPerPage} Tokens/Seite`;
      if (niche.avgMarketScore > 0) prompt += `, Ø Markt-Score ${niche.avgMarketScore}`;
      prompt += `.\n`;
      if (niche.successPatterns.length > 0) {
        prompt += `Bewährt: ${niche.successPatterns.slice(0, 2).join(' | ')}\n`;
      }
      if (niche.avoidPatterns.length > 0) {
        prompt += `Vermeiden: ${niche.avoidPatterns.slice(0, 2).join(' | ')}\n`;
      }
    }

    if (state.avgTokensPerPage > 0) {
      prompt += `Ziel: Antwort kompakt halten (~${state.avgTokensPerPage} Tokens/Seite im System-Durchschnitt).\n`;
    }

    const globalAvoid = state.patterns.avoid.slice(0, 2);
    if (globalAvoid.length > 0 && !niche?.avoidPatterns.length) {
      prompt += `Global vermeiden: ${globalAvoid.join(' | ')}\n`;
    }

    prompt += `Nutze etabliertes Wissen — keine Wiederholung bekannter Schwächen.\n`;
    return prompt;
  }

  static markObsidianSync(accountId: string, filesWritten: number): BrainState {
    const state = this.loadState(accountId);
    const next = pushEvent(
      {
        ...state,
        obsidianConnected: true,
        obsidianLastSync: new Date().toISOString(),
        obsidianFilesWritten: state.obsidianFilesWritten + filesWritten,
      },
      {
        type: 'obsidian_sync',
        message: `${filesWritten} Obsidian-Dateien aktualisiert`,
      }
    );
    this.saveState(accountId, next);
    return next;
  }
}
