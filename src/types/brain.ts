import type { ChapterMemory, CmiePageStatus } from './cmie';

export type BrainEventType =
  | 'page_learned'
  | 'outline_planned'
  | 'book_tracked'
  | 'niche_updated'
  | 'pattern_success'
  | 'pattern_avoid'
  | 'brain_rebuilt'
  | 'obsidian_sync';

export interface BrainEvent {
  id: string;
  type: BrainEventType;
  timestamp: string;
  bookId?: string;
  bookTitle?: string;
  niche?: string;
  pageNum?: number;
  message: string;
  detail?: string;
}

export interface NicheBrainProfile {
  keyword: string;
  slug: string;
  booksCount: number;
  pagesGenerated: number;
  avgMarketScore: number;
  avgTokensPerPage: number;
  bestMarketScore: number;
  lastUpdated: string;
  successPatterns: string[];
  avoidPatterns: string[];
  linkedBookIds: string[];
}

export interface BrainTrackedBook {
  bookId: string;
  title: string;
  niche: string;
  marketScore: number;
  completedPages: number;
  targetPages: number;
  status: string;
  lastUpdated: string;
}

export interface BrainRecommendationItem {
  id: string;
  label: string;
  detail: string;
  score?: number;
  severity?: 'low' | 'medium' | 'high';
}

export interface BrainRecommendations {
  generatedAt: string;
  thoughts: string[];
  nextActions: BrainRecommendationItem[];
  priorities: BrainRecommendationItem[];
  issues: BrainRecommendationItem[];
}

export interface BrainState {
  version: 1;
  totalPagesLearned: number;
  totalBooksTracked: number;
  totalEvents: number;
  avgTokensPerPage: number;
  tokenSamples: number;
  obsidianConnected: boolean;
  obsidianLastSync?: string;
  obsidianFilesWritten: number;
  brainStatus?: 'idle' | 'booting' | 'ready' | 'error';
  brainStatusMessage?: string;
  brainLastBootAt?: string;
  brainLastRebuildAt?: string;
  brainLibraryBookCount?: number;
  brainLibraryPageCount?: number;
  niches: Record<string, NicheBrainProfile>;
  trackedBooks: Record<string, BrainTrackedBook>;
  events: BrainEvent[];
  patterns: {
    success: string[];
    avoid: string[];
  };
  recommendations: BrainRecommendations;
}

export interface BrainBookInput {
  id: string;
  title: string;
  subtitle?: string;
  idea?: string;
  language?: string;
  targetPages?: number;
  pageSize?: string;
  writingStyle?: string;
  marketNiche?: string;
  marketScore?: number;
  earningsPotential?: string;
  bookStatus?: string;
  createdAt?: string;
  pagesText?: Record<number, string>;
  pagesStatus?: Record<number, string>;
  cmieStore?: Record<number, ChapterMemory>;
  cmieStatus?: Record<number, CmiePageStatus>;
  outline?: { pages?: { page_number: number; chapter_title?: string; focus?: string }[] } | null;
}

export const EMPTY_BRAIN_STATE = (): BrainState => ({
  version: 1,
  totalPagesLearned: 0,
  totalBooksTracked: 0,
  totalEvents: 0,
  avgTokensPerPage: 0,
  tokenSamples: 0,
  obsidianConnected: false,
  obsidianFilesWritten: 0,
  brainStatus: 'idle',
  brainStatusMessage: 'Brain wartet auf Initialisierung',
  niches: {},
  trackedBooks: {},
  events: [],
  patterns: { success: [], avoid: [] },
  recommendations: {
    generatedAt: '',
    thoughts: [],
    nextActions: [],
    priorities: [],
    issues: [],
  },
});
