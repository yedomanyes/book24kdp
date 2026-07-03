import type { ChapterMemory, CmiePageStatus } from '../../types/cmie';
import type {
  BrainBookInput,
  BrainEvent,
  BrainRecommendationItem,
  BrainRecommendations,
  BrainState,
  BrainTrackedBook,
  NicheBrainProfile,
} from '../../types/brain';
import { EMPTY_BRAIN_STATE } from '../../types/brain';
import { ObsidianSyncService } from './ObsidianSyncService';
import { CloudQueueService } from './CloudQueueService';

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

const NEON_COLORS = [
  '#ec4899', // Pink
  '#22d3ee', // Cyan
  '#a78bfa', // Purple
  '#fbbf24', // Amber
  '#10b981', // Emerald
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#f97316', // Orange
];

export function getNicheColor(nicheName: string): string {
  if (!nicheName) return NEON_COLORS[0];
  let hash = 0;
  for (let i = 0; i < nicheName.length; i++) {
    hash = nicheName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return NEON_COLORS[Math.abs(hash) % NEON_COLORS.length];
}

function nicheKeyword(book: BrainBookInput): string {
  return (book.marketNiche || book.title || 'Allgemein').trim();
}

function summarizeLibrary(books: BrainBookInput[]) {
  const trackedBookIds = new Set<string>();
  let learnablePages = 0;

  for (const book of books) {
    if (book?.id) trackedBookIds.add(book.id);
    const pages = book.pagesText || {};
    for (const [pageStr, text] of Object.entries(pages)) {
      const pageNum = Number(pageStr);
      if (text && book.cmieStore?.[pageNum]) {
        learnablePages += 1;
      }
    }
  }

  return {
    bookCount: trackedBookIds.size,
    learnablePages,
    trackedBookIds,
  };
}

function collectTrackedBookIds(state: BrainState): Set<string> {
  const tracked = new Set<string>();
  for (const niche of Object.values(state.niches)) {
    for (const bookId of niche.linkedBookIds || []) {
      tracked.add(bookId);
    }
  }
  return tracked;
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

function upsertTrackedBook(state: BrainState, book: BrainBookInput): BrainState {
  const completedPages = Object.values(book.pagesStatus || {}).filter((status) => status === 'completed').length;
  const snapshot: BrainTrackedBook = {
    bookId: book.id,
    title: book.title || 'Unbenanntes Buch',
    niche: nicheKeyword(book),
    marketScore: book.marketScore || 0,
    completedPages,
    targetPages: book.targetPages || 0,
    status: book.bookStatus || 'draft',
    lastUpdated: new Date().toISOString(),
  };

  return {
    ...state,
    trackedBooks: {
      ...state.trackedBooks,
      [book.id]: snapshot,
    },
  };
}

function scoreRecommendation(label: string, detail: string, score: number, severity?: 'low' | 'medium' | 'high'): BrainRecommendationItem {
  return {
    id: slugify(`${label}-${detail}`),
    label,
    detail,
    score,
    severity,
  };
}

function deriveRecommendations(state: BrainState): BrainRecommendations {
  const niches = Object.values(state.niches);
  const trackedBooks = Object.values(state.trackedBooks || {});
  const bestNiche = [...niches].sort((a, b) => (b.bestMarketScore + b.avgMarketScore) - (a.bestMarketScore + a.avgMarketScore))[0];
  const hotBooks = [...trackedBooks]
    .sort((a, b) => ((b.marketScore * 3) + b.completedPages) - ((a.marketScore * 3) + a.completedPages))
    .slice(0, 3)
    .map((book, index) => scoreRecommendation(
      index === 0 ? 'Top Fokus' : `Priorität ${index + 1}`,
      `${book.title} · Score ${book.marketScore || 0} · ${book.completedPages}/${book.targetPages || '?'} Seiten`,
      Math.max(1, Math.round((book.marketScore || 0) + book.completedPages * 0.8)),
    ));

  const issues: BrainRecommendationItem[] = [];
  if (state.totalBooksTracked === 0) {
    issues.push(scoreRecommendation('Leere Library', 'Noch kein Buch ist sauber im Brain verankert.', 95, 'high'));
  }
  if (state.totalBooksTracked > 0 && state.totalPagesLearned === 0) {
    issues.push(scoreRecommendation('Kein Seitenwissen', 'Es gibt Bücher, aber noch kein gelerntes Kapitelwissen.', 88, 'high'));
  }
  if ((state.patterns.avoid?.length || 0) > (state.patterns.success?.length || 0)) {
    issues.push(scoreRecommendation('Zu viele Anti-Pattern', 'Es wurden mehr Schwächen als Erfolgsbeispiele gespeichert.', 74, 'medium'));
  }
  if (!state.obsidianConnected) {
    issues.push(scoreRecommendation('Vault nicht verbunden', 'Das Brain läuft lokal, schreibt sein Wissen aber nicht aktiv in Obsidian zurück.', 58, 'low'));
  }

  const thoughts = [
    state.totalBooksTracked > 0
      ? `${state.totalBooksTracked} Bücher und ${state.totalPagesLearned} Seiten bilden den aktuellen Brain-Korpus.`
      : 'Das Brain hat noch keinen echten Buchkorpus aufgebaut.',
    bestNiche
      ? `Stärkster Cluster aktuell: ${bestNiche.keyword} mit Best-Score ${bestNiche.bestMarketScore || bestNiche.avgMarketScore || 0}.`
      : 'Noch kein dominanter Nischen-Cluster erkannt.',
    (state.patterns.success?.length || 0) > 0
      ? `${state.patterns.success.length} Erfolgs-Pattern stehen als Wiederverwendung bereit.`
      : 'Es fehlen noch belastbare Erfolgs-Pattern für Wiederverwendung.',
  ].filter(Boolean);

  const nextActions: BrainRecommendationItem[] = [];
  if (state.totalBooksTracked === 0) {
    nextActions.push(scoreRecommendation('Erstes Projekt verankern', 'Ein Buch vollständig tracken, damit das Brain überhaupt Prioritäten bilden kann.', 96, 'high'));
  }
  if (state.totalBooksTracked > 0 && state.totalPagesLearned === 0) {
    nextActions.push(scoreRecommendation('CMIE-Wissen aufbauen', 'Mindestens einige Seiten generieren oder analysieren, damit echtes Seitenlernen entsteht.', 91, 'high'));
  }
  if (bestNiche) {
    nextActions.push(scoreRecommendation('Winning Niche verdoppeln', `Für ${bestNiche.keyword} neue Outline oder Spin-off prüfen, weil dort die besten Signale liegen.`, Math.max(60, bestNiche.bestMarketScore || bestNiche.avgMarketScore), 'medium'));
  }
  if ((state.patterns.avoid?.length || 0) > 0) {
    nextActions.push(scoreRecommendation('Schwächen aktiv vermeiden', `Die letzten ${Math.min(3, state.patterns.avoid.length)} Anti-Pattern in die nächste Generierung übernehmen.`, 67, 'medium'));
  }
  if (!state.obsidianConnected) {
    nextActions.push(scoreRecommendation('Vault-Loop aktivieren', 'Obsidian verbinden, damit Learnings dauerhaft gespiegelt und wiederverwendet werden.', 52, 'low'));
  }

  return {
    generatedAt: new Date().toISOString(),
    thoughts: thoughts.slice(0, 3),
    nextActions: nextActions.slice(0, 4),
    priorities: hotBooks,
    issues: issues.slice(0, 4),
  };
}

function normalizeState(state: BrainState): BrainState {
  const trackedBooks = state.trackedBooks || {};
  return {
    ...state,
    totalBooksTracked: Object.keys(trackedBooks).length || state.totalBooksTracked || 0,
    trackedBooks,
    recommendations: deriveRecommendations({
      ...state,
      trackedBooks,
      recommendations: state.recommendations || EMPTY_BRAIN_STATE().recommendations,
    }),
  };
}

export class BrainService {
  static loadState(accountId: string): BrainState {
    try {
      const raw = localStorage.getItem(BRAIN_KEY(accountId));
      if (!raw) return normalizeState(EMPTY_BRAIN_STATE());
      const parsed = JSON.parse(raw) as BrainState;
      return normalizeState({ ...EMPTY_BRAIN_STATE(), ...parsed, version: 1 });
    } catch {
      return normalizeState(EMPTY_BRAIN_STATE());
    }
  }

  static saveState(accountId: string, state: BrainState): void {
    const normalized = normalizeState(state);
    localStorage.setItem(BRAIN_KEY(accountId), JSON.stringify(normalized));
    void CloudQueueService.pushBrainState(accountId, normalized);
  }

  static async syncCloudState(accountId: string): Promise<BrainState> {
    const cloudState = await CloudQueueService.pullBrainState(accountId);
    const localState = this.loadState(accountId);
    const normalizedCloud = cloudState ? normalizeState(cloudState) : null;
    
    if (normalizedCloud && normalizedCloud.totalEvents > localState.totalEvents) {
      localStorage.setItem(BRAIN_KEY(accountId), JSON.stringify(normalizedCloud));
      return normalizedCloud;
    }
    return localState;
  }

  static getState(accountId: string): BrainState {
    const state = this.loadState(accountId);
    return {
      ...state,
      obsidianConnected: ObsidianSyncService.isConnected(),
    };
  }

  static autoInitializeFromLibrary(accountId: string, books: BrainBookInput[]): { state: BrainState; rebuilt: boolean } {
    const state = this.loadState(accountId);
    const summary = summarizeLibrary(books);
    const trackedIds = collectTrackedBookIds(state);
    const shouldRebuild =
      summary.bookCount > 0 && (
        state.totalBooksTracked === 0 ||
        (summary.learnablePages > 0 && state.totalPagesLearned === 0) ||
        state.totalBooksTracked < summary.bookCount ||
        state.totalPagesLearned < summary.learnablePages ||
        books.some((book) => book?.id && !trackedIds.has(book.id))
      );

    if (shouldRebuild) {
      return {
        state: this.rebuildFromLibrary(accountId, books),
        rebuilt: true,
      };
    }

    const next: BrainState = {
      ...state,
      brainStatus: 'ready',
      brainStatusMessage:
        summary.bookCount > 0
          ? `Brain aktiv — ${summary.bookCount} Bücher und ${summary.learnablePages} Seiten im Kontext`
          : 'Brain bereit — noch keine Bücher in der Library',
      brainLastBootAt: new Date().toISOString(),
      brainLibraryBookCount: summary.bookCount,
      brainLibraryPageCount: summary.learnablePages,
    };

    this.saveState(accountId, next);
    return { state: next, rebuilt: false };
  }

  static markBootError(accountId: string, message: string): BrainState {
    const state = this.loadState(accountId);
    const next: BrainState = {
      ...state,
      brainStatus: 'error',
      brainStatusMessage: message,
      brainLastBootAt: new Date().toISOString(),
    };
    this.saveState(accountId, next);
    return next;
  }

  static learnFromPage(
    accountId: string,
    book: BrainBookInput,
    pageNum: number,
    memory: ChapterMemory,
    cmieStatus: CmiePageStatus,
    pageText: string,
    qualityScore?: number
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
    state = upsertTrackedBook(state, book);

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

    if (qualityScore && qualityScore >= 8) {
      const golden = `Golden Example (Score ${qualityScore}/10) aus Kap. ${pageNum}: "${memory.opening_sentences.slice(0, 80)}..."`;
      state = {
        ...state,
        patterns: {
          ...state.patterns,
          success: upsertPattern(state.patterns.success, golden),
        },
      };
      state = upsertNiche(state, book, {
        successPatterns: upsertPattern(state.niches[nicheSlug]?.successPatterns || [], golden, 15),
      });
      state = pushEvent(state, {
        type: 'pattern_success',
        bookId: book.id,
        bookTitle: book.title,
        niche,
        pageNum,
        message: `High-Quality Score (${qualityScore}/10) für Seite ${pageNum}`,
      });
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
    void ObsidianSyncService.syncPageLearned(book, pageNum, memory, state).then((filesWritten) => {
      if (filesWritten > 0) {
        this.markObsidianSync(accountId, filesWritten);
      }
    });
    void CloudQueueService.pushBookToQueue(accountId, book);
    return state;
  }

  static learnFromOutline(accountId: string, book: BrainBookInput, pageCount: number): BrainState {
    let state = this.loadState(accountId);
    state = upsertNiche(state, book);
    state = upsertTrackedBook(state, book);
    state = pushEvent(state, {
      type: 'outline_planned',
      bookId: book.id,
      bookTitle: book.title,
      niche: nicheKeyword(book),
      message: `Gliederung geplant — ${pageCount} Seiten`,
      detail: book.idea?.slice(0, 120),
    });
    this.saveState(accountId, state);
    void ObsidianSyncService.syncNicheProfile(state.niches[slugify(nicheKeyword(book))], state).then((filesWritten) => {
      if (filesWritten > 0) {
        this.markObsidianSync(accountId, filesWritten);
      }
    });
    void CloudQueueService.pushBookToQueue(accountId, book);
    return state;
  }

  static trackBook(accountId: string, book: BrainBookInput): BrainState {
    let state = this.loadState(accountId);
    const completed = Object.values(book.pagesStatus || {}).filter(s => s === 'completed').length;
    state = upsertNiche(state, book);
    state = upsertTrackedBook(state, book);

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
    void ObsidianSyncService.syncBookMeta(book, state).then((filesWritten) => {
      if (filesWritten > 0) {
        this.markObsidianSync(accountId, filesWritten);
      }
    });
    void CloudQueueService.pushBookToQueue(accountId, book);
    return state;
  }

  static rebuildFromLibrary(accountId: string, books: BrainBookInput[]): BrainState {
    const summary = summarizeLibrary(books);
    const now = new Date().toISOString();
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
      state = upsertTrackedBook(state, book);
      state = this.trackBookInternal(state, book);
    }
    state = pushEvent(state, {
      type: 'brain_rebuilt',
      message: `Brain aus ${books.length} Büchern neu aufgebaut`,
      detail: `${state.totalPagesLearned} Seiten, ${Object.keys(state.niches).length} Nischen`,
    });
    state = {
      ...state,
      brainStatus: 'ready',
      brainStatusMessage: `Brain neu aufgebaut — ${summary.bookCount} Bücher und ${summary.learnablePages} Seiten geladen`,
      brainLastBootAt: now,
      brainLastRebuildAt: now,
      brainLibraryBookCount: summary.bookCount,
      brainLibraryPageCount: summary.learnablePages,
    };
    this.saveState(accountId, state);
    void ObsidianSyncService.syncFullState(state, books, accountId).then((filesWritten) => {
      if (filesWritten > 0) {
        this.markObsidianSync(accountId, filesWritten);
      }
    });
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
    state = upsertTrackedBook(state, book);
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
    state = upsertTrackedBook(state, book);
    state = { ...state, totalBooksTracked: Object.keys(state.trackedBooks).length };
    return state;
  }

  static buildContextPrompt(accountId: string, book: BrainBookInput): string {
    const state = this.loadState(accountId);
    const slug = slugify(nicheKeyword(book));
    const niche = state.niches[slug];
    const obsidianCtx = ObsidianSyncService.getCachedGenerationContext(book);
    if (!niche && state.patterns.avoid.length === 0 && state.patterns.success.length === 0 && !obsidianCtx) {
      return '';
    }

    let prompt = `\n### [BOOK24 BRAIN] Globales Lern-Gedächtnis:\n`;

    const nicheColor = getNicheColor(nicheKeyword(book));
    prompt += `[SEMANTIC CLUSTER: ${nicheColor}]\n`;

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

    if (state.recommendations.priorities.length > 0) {
      prompt += `Aktive Prioritäten: ${state.recommendations.priorities.slice(0, 2).map((item) => item.detail).join(' | ')}\n`;
    }
    if (state.recommendations.nextActions.length > 0) {
      prompt += `Nächste Brain-Aktionen: ${state.recommendations.nextActions.slice(0, 2).map((item) => item.label).join(' | ')}\n`;
    }

    const globalAvoid = state.patterns.avoid.slice(0, 2);
    if (globalAvoid.length > 0 && !niche?.avoidPatterns.length) {
      prompt += `Global vermeiden: ${globalAvoid.join(' | ')}\n`;
    }

    prompt += `Nutze etabliertes Wissen — keine Wiederholung bekannter Schwächen.\n`;
    if (obsidianCtx) {
      prompt += `\n${obsidianCtx}`;
    }
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
