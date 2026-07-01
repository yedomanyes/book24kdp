import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Play, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  FileDown,
  Plus,
  Trash2,
  Bold,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlignJustify,
  Layout,
  Sparkles,
  Eye,
  EyeOff,
  Scissors,
  Copy,
  User,
  Undo,
  Image as ImageIcon,
  Sun,
  Moon,
  Pencil
} from 'lucide-react';
import { GeminiService } from './services/GeminiService';
import type { BookOutline, BookOutlinePage } from './services/GeminiService';
import type { ChapterMemory, CmieConfig, CmiePageStatus } from './types/cmie';
import { CmieOrchestrator } from './services/cmie/CmieOrchestrator';
import Aurora from './components/Aurora';
import { NecessityDetector } from './services/graphics/NecessityDetector';
import { SvgGraphicRenderer } from './services/graphics/SvgGraphicRenderer';
import type { GraphicDecision } from './types/graphics';
import { generateBookPdf } from './utils/PdfGenerator';
import type { PdfConfig } from './utils/PdfGenerator';
import { 
  KEYS, 
  migrateOldKeys, 
  saveBookToCloud,
  deleteBookFromCloud,
  loadBooksFromCloud,
  loadAccountsFromCloud,
  syncLocalLibraryToCloud,
  forcePushBooksToCloud
} from './services/StorageService';
import { supabase, toAppUser } from './supabase';
import { Auth } from './components/Auth';
import { LandingPage } from './components/LandingPage';
import { LicensePrompt } from './components/LicensePrompt';
import { NicheFinderDashboard } from './components/NicheFinderDashboard';
import { BrainDashboard } from './components/BrainDashboard';
import { GilService } from './services/gil/GilService';
import { GilInsightsPanel } from './components/GilInsightsPanel';
import { TrendingUp } from 'lucide-react';

import { SettingsModal } from './components/SettingsModal';
import KdpCalculator from './components/KdpCalculator';
import MaintenanceView from './components/MaintenanceView';
import GooeyNav from './components/GooeyNav';
import { searchNiche, type NicheResult } from './services/NicheService';
import { BrainService } from './services/brain/BrainService';
import { LayoutFixDB } from './services/brain/LayoutFixDB';
import { ObsidianSyncService } from './services/brain/ObsidianSyncService';
import { CloudQueueService } from './services/brain/CloudQueueService';
import { hasBrainAccess } from './config/brainAccess';
import { OwnerPanel } from './components/OwnerPanel';
import { isOwnerEmail, isOwnerRoute } from './lib/owner';
import { syncUserProfile } from './services/userProfileService';

// Run migration once at module load (before any state is initialized)
migrateOldKeys();

const NAV_TABS = ['projects', 'dashboard', 'brain', 'studio', 'calculator', 'owner'] as const;
type NavTabId = typeof NAV_TABS[number];

const NAV_TAB_PARTICLE_COLORS: Record<NavTabId, number[]> = {
  projects: [1, 2, 3, 4],
  dashboard: [1, 2, 3, 4],
  brain: [1, 2, 3, 4],
  studio: [1, 2, 3, 4],
  calculator: [1, 2, 3, 4],
  owner: [1, 2, 3, 4],
};

const getScopedActiveBookStorageKey = (accountId: string) => `b24studio_activeBookId_${accountId}`;
const getScopedSelectedPageStorageKey = (accountId: string, bookId: string) => `b24studio_selectedPage_${accountId}_${bookId}`;

const COVER_FONTS = [
  { value: 'playfair', label: 'Playfair Display (Serif)' },
  { value: 'times', label: 'Times New Roman (Serif)' },
  { value: 'georgia', label: 'Georgia (Serif)' },
  { value: 'garamond', label: 'EB Garamond (Antiqua)' },
  { value: 'cormorant', label: 'Cormorant Garamond' },
  { value: 'cardo', label: 'Cardo (Klassisch)' },
  { value: 'cinzel', label: 'Cinzel (Stein-Optik)' },
  { value: 'cinzeldec', label: 'Cinzel Decorative' },
  { value: 'bodoni', label: 'Bodoni Moda (Modernist)' },
  { value: 'lora', label: 'Lora (Buchschrift)' },
  { value: 'merriweather', label: 'Merriweather (Kräftig)' },
  { value: 'montserrat', label: 'Montserrat (Geometrisch)' },
  { value: 'poppins', label: 'Poppins (Rund & Modern)' },
  { value: 'oswald', label: 'Oswald (Kondensiert)' },
  { value: 'inter', label: 'Inter (Präzise)' },
  { value: 'helvetica', label: 'Helvetica (Neutral)' },
  { value: 'arial', label: 'Arial (Standard)' },
  { value: 'greatvibes', label: 'Great Vibes (Kalligrafie)' },
  { value: 'sacramento', label: 'Sacramento (Retro-Script)' },
  { value: 'courier', label: 'Courier New (Monospace)' }
];

const getCssFontFamily = (fontKey: string | undefined, defaultFont: string) => {
  const f = (fontKey || defaultFont).toLowerCase();
  if (f === 'times') return "'Times New Roman', Times, Georgia, serif";
  if (f === 'playfair') return "'Playfair Display', Georgia, serif";
  if (f === 'georgia') return "Georgia, serif";
  if (f === 'garamond') return "'EB Garamond', Garamond, serif";
  if (f === 'cormorant') return "'Cormorant Garamond', Garamond, serif";
  if (f === 'cardo') return "Cardo, serif";
  if (f === 'cinzel') return "Cinzel, serif";
  if (f === 'cinzeldec') return "'Cinzel Decorative', Cinzel, serif";
  if (f === 'bodoni') return "'Bodoni Moda', serif";
  if (f === 'lora') return "Lora, serif";
  if (f === 'merriweather') return "Merriweather, Georgia, serif";
  if (f === 'montserrat') return "Montserrat, sans-serif";
  if (f === 'poppins') return "Poppins, sans-serif";
  if (f === 'oswald') return "Oswald, sans-serif";
  if (f === 'inter') return "Inter, system-ui, sans-serif";
  if (f === 'helvetica') return "Helvetica, Arial, sans-serif";
  if (f === 'arial') return "Arial, Helvetica, sans-serif";
  if (f === 'greatvibes') return "'Great Vibes', cursive";
  if (f === 'sacramento') return "'Sacramento', cursive";
  if (f === 'courier') return "'Courier New', Courier, monospace";
  return "sans-serif";
};

export interface BoxDesign {
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  borderThickness?: number;
  borderRadius?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  fontStyle?: 'normal' | 'italic';
}

export const DEFAULT_BOX1_DESIGN: BoxDesign = {
  backgroundColor: '#f8fafc',
  borderColor: '#cbd5e1',
  textColor: '#0f172a',
  borderThickness: 1,
  borderRadius: 6,
  borderStyle: 'solid',
  fontStyle: 'normal'
};

export const DEFAULT_BOX2_DESIGN: BoxDesign = {
  backgroundColor: '#f0fdf4',
  borderColor: '#bbf7d0',
  textColor: '#166534',
  borderThickness: 1,
  borderRadius: 6,
  borderStyle: 'solid',
  fontStyle: 'normal'
};

export const DEFAULT_BOX3_DESIGN: BoxDesign = {
  backgroundColor: '#fef2f2',
  borderColor: '#fecaca',
  textColor: '#991b1b',
  borderThickness: 1,
  borderRadius: 6,
  borderStyle: 'solid',
  fontStyle: 'normal'
};

interface Account {
  id: string;
  username: string;
}

export interface TitlePageCustomText {
  id: string;
  text: string;
  x: number;
  y: number;
  size: number;
  font: 'times' | 'helvetica' | 'courier' | 'arial' | 'playfair' | 'inter';
  align: 'left' | 'center' | 'right';
  isBold?: boolean;
}

interface Book {
  id: string;
  title: string;
  subtitle: string;
  hideTitlePage?: boolean;
  box1Design?: BoxDesign;
  box2Design?: BoxDesign;
  box3Design?: BoxDesign;
  images?: { [key: string]: string };
  imagesTransform?: { [key: string]: { scale?: number; x?: number; y?: number } };
  idea: string;
  language: string;
  targetPages: number;
  writingStyle: string;
  fontFamily: 'times' | 'helvetica' | 'courier' | 'arial' | 'playfair' | 'inter';
  fontSize: number;
  pageSize: string; // "5x8" | "5.5x8.5" | "6x9" | "8.5x11" | "custom" | "a4"
  customWidth?: number; // in inches
  customHeight?: number; // in inches
  paragraphStyle?: 'indent' | 'spacing' | 'block';
  pagesParagraphStyle?: { [key: number]: 'indent' | 'spacing' | 'block' };
  alignment?: 'justify' | 'left';
  chapterOrnament?: string;
  amazonDescription?: string;
  kdpKeywords?: string[];
  kdpCategories?: string[];
  customGuidelines?: string;
  outline: BookOutline | null;
  pagesText: { [key: number]: string };
  pagesStatus: { [key: number]: 'idle' | 'generating' | 'completed' | 'failed' };
  pagesError: { [key: number]: string };
  pagesGenerationTime?: { [key: number]: number }; // tracking generation duration in milliseconds
  generationQueue?: number[];
  pagesReprompt?: { [key: number]: string };
  pagesOverflow?: { [key: number]: boolean };
  showRunningHeader?: boolean;
  showPageNumbers?: boolean;
  noQuotes?: boolean;
  showChapterTitles?: boolean;
  pagesHideChapter?: number[];
  pagesHideRunningHeader?: number[];
  pagesInitial?: number[];
  pagesHideQuotes?: number[];          // pages where quotes are hidden
  titlePageEmblem?: 'geometric' | 'floral' | 'star' | 'book' | 'custom';
  titlePageImage?: string;
  publisherLine?: string;
  generateTOC?: boolean;
  titlePageImageScale?: number;
  titlePageImageX?: number;
  titlePageImageY?: number;
  titlePageLayout?: 'centered' | 'top_centered';
  titlePageShowBorders?: boolean;
  authorName?: string;
  tocLineSpacing?: number;
  tocFontFamily?: string;
  tocFontSize?: number;
  titlePageTitleAlign?: 'left' | 'center' | 'right';
  titlePageTitleSize?: number;
  titlePageTitleFont?: string;
  titlePageTitleX?: number;
  titlePageTitleY?: number;
  titlePageTitleBold?: boolean;
  
  titlePageSubtitleAlign?: 'left' | 'center' | 'right';
  titlePageSubtitleSize?: number;
  titlePageSubtitleFont?: string;
  titlePageSubtitleX?: number;
  titlePageSubtitleY?: number;
  titlePageSubtitleBold?: boolean;

  titlePageAuthorAlign?: 'left' | 'center' | 'right';
  titlePageAuthorSize?: number;
  titlePageAuthorFont?: string;
  titlePageAuthorX?: number;
  titlePageAuthorY?: number;
  titlePageAuthorBold?: boolean;

  titlePagePublisherAlign?: 'left' | 'center' | 'right';
  titlePagePublisherSize?: number;
  titlePagePublisherFont?: string;
  titlePagePublisherX?: number;
  titlePagePublisherY?: number;
  titlePagePublisherBold?: boolean;
  
  titlePageCustomTexts?: TitlePageCustomText[];
  autoChapterDropCaps?: boolean;
  autoChapterGraphics?: boolean;
  autoChapterRecto?: boolean;
  chapterTopPadding?: number;
  sourceUrls?: string;
  extractedSourceText?: string;
  // Mediathek ratings & dashboard
  marketScore?: number;                // 1-100
  earningsPotential?: 'low' | 'medium' | 'high' | 'very_high';
  marketNiche?: string;
  pricePoint?: number;                 // Verkaufspreis in USD
  royaltyRate?: number;                // KDP-Royalty 0.35 or 0.70
  revenueConservative?: number;        // monatlich konservativ
  revenueBestCase?: number;            // monatlich Best Case
  revenueWorstCase?: number;           // monatlich Worst Case
  adSpendSuggestion?: number;          // empfohlenes monatliches Werbebudget
  pageOrderOverride?: number[];        // custom page order for drag & drop
  // Book tracking
  bookStatus?: 'working' | 'done' | 'uploaded'; // Bearbeitungsstatus
  uploadedAt?: string;                  // ISO date when uploaded to KDP
  createdAt?: string;                   // ISO date when book was created
  outlineBackup?: BookOutlinePage[];
  fullOutlineBackup?: BookOutline | null;
  pagesTextBackup?: { [key: number]: string };
  pagesStatusBackup?: { [key: number]: 'idle' | 'generating' | 'completed' | 'failed' };
  pagesErrorBackup?: { [key: number]: string };
  cmieStore?: { [key: number]: ChapterMemory };
  cmieStatus?: { [key: number]: CmiePageStatus };
  cmieGlossary?: { [key: string]: string };
  cmieConfig?: CmieConfig;
  pagesGraphic?: { [key: number]: GraphicDecision };
  pagesGraphicDisabled?: { [key: number]: boolean };
}

const getProjectFormattedDate = (book: Book): string => {
  let date: Date;
  if (book.createdAt) {
    date = new Date(book.createdAt);
  } else {
    // Try to extract timestamp from book ID
    const parts = book.id.split('_');
    const timestamp = Number(parts[1]);
    if (!isNaN(timestamp) && timestamp > 0) {
      date = new Date(timestamp);
    } else {
      return "Unbekannt"; // Fallback so it doesn't change on every render
    }
  }
  
  // Format as DD.MM.YYYY HH:MM
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${day}.${month}.${year} um ${hours}:${minutes} Uhr`;
};

export type WorkbookBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'checkbox'; text: string; checked: boolean }
  | { type: 'dotted_line' }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'box'; title: string; children: WorkbookBlock[]; styleNum?: number; boxType?: string }
  | { type: 'pagebreak' }
  | { type: 'ornament' }
  | { type: 'heading'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'bullet'; text: string }
  | { type: 'numbered'; text: string; num: string }
  | { type: 'image'; prompt: string; width?: number; float?: 'none' | 'left' | 'right' }
  | { type: 'custom_image'; id: string; width?: number; float?: 'none' | 'left' | 'right' };

const PageGenerationProgress: React.FC<{ pageNum: number }> = ({ pageNum }) => {
  const [elapsed, setElapsed] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev < 40) return prev + 8;
        if (prev < 75) return prev + 4;
        if (prev < 95) return prev + 1;
        return prev;
      });
    }, 400);

    return () => {
      clearInterval(timer);
      clearInterval(progressTimer);
    };
  }, []);

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '260px',
      gap: '16px',
      color: 'var(--text-main)',
      padding: '24px',
      backgroundColor: 'var(--bg-card)',
      borderRadius: '8px',
      border: '1px solid var(--border-color)',
      maxWidth: '400px',
      width: '100%',
      margin: '40px auto',
      boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
    }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="spinner" style={{ width: '40px', height: '40px', color: 'var(--primary)' }} />
        <span style={{ position: 'absolute', fontSize: '10px', fontWeight: 'bold', color: 'var(--text-main)' }}>{elapsed}s</span>
      </div>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '14px', fontWeight: 600 }}>Schreibe Seite {pageNum}...</span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Lese Outline & generiere Text</span>
      </div>
      
      <div style={{ width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '9999px', height: '6px', overflow: 'hidden' }}>
        <div style={{
          width: `${progress}%`,
          backgroundColor: 'var(--primary)',
          height: '100%',
          borderRadius: '9999px',
          transition: 'width 0.4s ease-out'
        }} />
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '10px', color: 'var(--text-muted)' }}>
        <span>Fortschritt: {progress}%</span>
        <span>Dauer: {elapsed} Sek.</span>
      </div>
    </div>
  );
};

export const parsePageLines = (rawLines: string[]): WorkbookBlock[] => {
  const blocks: WorkbookBlock[] = [];
  let i = 0;
  while (i < rawLines.length) {
    const raw = rawLines[i];
    const trimmed = raw.trim().replace(/ {2,}/g, ' ');
    if (!trimmed) { i++; continue; }

    // :::box ... :::
    if (/^:::\s*(box|callout|reflection|action)/i.test(trimmed)) {
      const match = trimmed.match(/^:::\s*(box|callout|reflection|action)\s*(\d+)?\s*(.*)/i);
      const boxType = match && match[1] ? match[1].toLowerCase() : 'box';
      const styleNum = match && match[2] ? parseInt(match[2]) : 1;
      const boxTitle = match && match[3] ? match[3].trim() : '';
      i++;
      const innerLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim() !== ':::') {
        innerLines.push(rawLines[i]);
        i++;
      }
      i++; // skip closing :::
      blocks.push({ type: 'box', title: boxTitle, children: parsePageLines(innerLines), styleNum, boxType });
      continue;
    }

    // Markdown table rows (| col | col |)
    if (trimmed.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('|')) {
        tableLines.push(rawLines[i].trim());
        i++;
      }
      const parseCells = (line: string) =>
        line.split('|').map(c => c.trim()).filter((_c, idx2, arr) => idx2 > 0 && idx2 < arr.length - 1);
      const headerRow = parseCells(tableLines[0] || '');
      const dataRows = tableLines
        .slice(2)
        .filter(l => !/^[\|\s\-:]+$/.test(l))
        .map(l => parseCells(l));
      if (headerRow.length > 0) {
        blocks.push({ type: 'table', headers: headerRow, rows: dataRows });
      }
      continue;
    }

    // Checkbox: [ ] or [x]
    if (/^\[[ xX]\] /.test(trimmed)) {
      const checked = /^\[[xX]\] /.test(trimmed);
      const text = trimmed.replace(/^\[[xX ]\] /, '').trim();
      blocks.push({ type: 'checkbox', text, checked });
      i++;
      continue;
    }

    // Dotted line (only dots or underscores, at least 6 chars)
    if (/^[.\_]{6,}$/.test(trimmed.replace(/\s/g, ''))) {
      blocks.push({ type: 'dotted_line' });
      i++;
      continue;
    }

    // Page break
    if (trimmed === '---' || /^-{3,}$/.test(trimmed)) {
      blocks.push({ type: 'pagebreak' });
      i++;
      continue;
    }

    // Ornament
    if (trimmed === '***' || trimmed === '* * *') {
      blocks.push({ type: 'ornament' });
      i++;
      continue;
    }

    // Heading (**bold** or ### heading)
    if ((trimmed.startsWith('**') && trimmed.endsWith('**')) || trimmed.startsWith('### ')) {
      const text = trimmed.startsWith('### ') ? trimmed.slice(4) : trimmed.slice(2, -2);
      blocks.push({ type: 'heading', text });
      i++;
      continue;
    }

    // Quote
    if (trimmed.startsWith('>')) {
      blocks.push({ type: 'quote', text: trimmed.replace(/^>\s*/, '') });
      i++;
      continue;
    }
    
    // Fallback if AI writes: "Zitat" - Autor
    if (trimmed.startsWith('"') && /"\s*[-—]\s*.+$/.test(trimmed)) {
      blocks.push({ type: 'quote', text: trimmed });
      i++;
      continue;
    }
    
    // Fallback if AI writes: """Zitat"""
    if (trimmed.startsWith('"""') && trimmed.endsWith('"""') && trimmed.length >= 6) {
      blocks.push({ type: 'quote', text: trimmed.slice(3, -3).trim() });
      i++;
      continue;
    }

    // Bullet
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('\u2022 ')) {
      const text = trimmed.startsWith('\u2022 ') ? trimmed.slice(2) : trimmed.slice(2);
      blocks.push({ type: 'bullet', text });
      i++;
      continue;
    }

    // Numbered List
    if (/^\d+\.\s/.test(trimmed)) {
      const match = trimmed.match(/^(\d+\.)\s(.*)/);
      if (match) {
        blocks.push({ type: 'numbered', num: match[1], text: match[2] });
        i++;
        continue;
      }
    }

    // Image placeholder new format: :::image PROMPT float:left width:50
    if (/^:::image\s+/i.test(trimmed)) {
      const lineText = trimmed.replace(/^:::image\s+/i, '');
      const widthMatch = lineText.match(/width:(\d+)/i);
      const floatMatch = lineText.match(/float:(none|left|right)/i);
      
      const width = widthMatch ? parseInt(widthMatch[1]) : 85;
      const float = floatMatch ? (floatMatch[1] as any) : 'none';
      
      const prompt = lineText
        .replace(/width:\d+/i, '')
        .replace(/float:(none|left|right)/i, '')
        .trim();
        
      blocks.push({ type: 'image', prompt, width, float });
      i++;
      continue;
    }

    // Custom image new format: :::custom_image ID float:left width:50
    if (/^:::custom_image\s+/i.test(trimmed)) {
      const lineText = trimmed.replace(/^:::custom_image\s+/i, '');
      const widthMatch = lineText.match(/width:(\d+)/i);
      const floatMatch = lineText.match(/float:(none|left|right)/i);
      
      const width = widthMatch ? parseInt(widthMatch[1]) : 85;
      const float = floatMatch ? (floatMatch[1] as any) : 'none';
      
      const id = lineText
        .replace(/width:\d+/i, '')
        .replace(/float:(none|left|right)/i, '')
        .trim();
        
      blocks.push({ type: 'custom_image', id, width, float });
      i++;
      continue;
    }

    // Legacy Image placeholder [grafik: prompt]
    if (/^\[grafik:\s*(.*?)\]$/i.test(trimmed)) {
      const match = trimmed.match(/^\[grafik:\s*(.*?)\]$/i);
      const prompt = match ? match[1].trim() : '';
      blocks.push({ type: 'image', prompt });
      i++;
      continue;
    }

    // Normal paragraph
    blocks.push({ type: 'paragraph', text: trimmed });
    i++;
  }
  return blocks;
};

export const serializeBlocksToMarkdown = (blocks: WorkbookBlock[]): string => {
  const lines: string[] = [];
  
  const serializeBlock = (b: WorkbookBlock) => {
    switch (b.type) {
      case 'paragraph':
        lines.push(b.text);
        break;
      case 'heading':
        lines.push(`### ${b.text}`);
        break;
      case 'quote':
        lines.push(`> ${b.text}`);
        break;
      case 'bullet':
        lines.push(`- ${b.text}`);
        break;
      case 'checkbox':
        lines.push(`[${b.checked ? 'x' : ' '}] ${b.text}`);
        break;
      case 'dotted_line':
        lines.push('......');
        break;
      case 'ornament':
        lines.push('***');
        break;
      case 'pagebreak':
        lines.push('---');
        break;
      case 'table':
        lines.push('| ' + b.headers.join(' | ') + ' |');
        lines.push('| ' + b.headers.map(() => '---').join(' | ') + ' |');
        b.rows.forEach(row => {
          lines.push('| ' + row.join(' | ') + ' |');
        });
        break;
      case 'box':
        lines.push(`:::box${b.styleNum ? ' ' + b.styleNum : ''}${b.title ? ' ' + b.title : ''}`);
        b.children.forEach(child => serializeBlock(child));
        lines.push(':::');
        break;
      case 'image': {
        let imgOptions = '';
        if (b.float && b.float !== 'none') imgOptions += ` float:${b.float}`;
        if (b.width && b.width !== 85) imgOptions += ` width:${b.width}`;
        lines.push(`:::image ${b.prompt}${imgOptions}`.trim());
        break;
      }
      case 'custom_image': {
        let customImgOptions = '';
        if (b.float && b.float !== 'none') customImgOptions += ` float:${b.float}`;
        if (b.width && b.width !== 85) customImgOptions += ` width:${b.width}`;
        lines.push(`:::custom_image ${b.id}${customImgOptions}`.trim());
        break;
      }
    }
  };

  blocks.forEach(b => serializeBlock(b));
  return lines.join('\n');
};

const PreviewGraphicBox: React.FC<{
  transform?: { scale?: number; x?: number; y?: number; width?: number; float?: 'none' | 'left' | 'right' };
  onChange: (t: any) => void;
  onDelete?: () => void;
  defaultWidth?: number;
  defaultFloat?: 'none' | 'left' | 'right';
  children: React.ReactNode;
}> = ({ transform = {}, onChange, onDelete, defaultWidth = 85, defaultFloat = 'none', children }) => {
  const scale = transform.scale ?? 1;
  const propX = transform.x ?? 0;
  const propY = transform.y ?? 0;
  const currWidth = transform.width ?? defaultWidth;
  const currFloat = transform.float ?? defaultFloat;

  const [isHovered, setIsHovered] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [liveX, setLiveX] = useState(propX);
  const [liveY, setLiveY] = useState(propY);
  const [liveW, setLiveW] = useState(currWidth);
  const [flipBottom, setFlipBottom] = useState(false);

  const boxRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, w: 0, dir: 1 });
  const stateRef = useRef({ x: propX, y: propY, w: currWidth });
  stateRef.current = { x: liveX, y: liveY, w: liveW };

  // Smart live float based on horizontal drag offset so text wraps cleanly around the outside
  const effectiveFloat = liveX < -35 ? 'left' : (liveX > 35 ? 'right' : currFloat);
  const isFloated = effectiveFloat === 'left' || effectiveFloat === 'right';

  useEffect(() => {
    if (!isDragging.current && !isResizing.current) {
      setLiveX(propX);
      setLiveY(propY);
      setLiveW(currWidth);
    }
  }, [propX, propY, currWidth]);

  useEffect(() => {
    if (boxRef.current) {
      const top = boxRef.current.offsetTop;
      setFlipBottom(top < 50 || liveY < -15);
    }
  }, [liveY, isHovered, isSelected]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button, input, select')) return;
    e.stopPropagation();
    setIsSelected(true);
    isDragging.current = true;
    dragStart.current = { x: e.clientX - liveX, y: e.clientY - liveY };
    
    // Set focus to the box so keyboard events (like Backspace) are caught reliably
    if (boxRef.current) {
      boxRef.current.focus();
    }
  };

  const handleResizeStart = (e: React.MouseEvent, dir: number) => {
    e.stopPropagation();
    setIsSelected(true);
    isResizing.current = true;
    resizeStart.current = { x: e.clientX, w: liveW, dir };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing.current) {
        const dx = (e.clientX - resizeStart.current.x) * resizeStart.current.dir;
        const newW = Math.max(15, Math.min(100, Math.round(resizeStart.current.w + dx * 0.35)));
        setLiveW(newW);
        return;
      }
      if (!isDragging.current) return;
      const nx = Math.max(-180, Math.min(180, e.clientX - dragStart.current.x));
      const ny = Math.max(-280, Math.min(280, e.clientY - dragStart.current.y));
      setLiveX(nx);
      setLiveY(ny);
    };

    const handleMouseUp = () => {
      if (isDragging.current || isResizing.current) {
        isDragging.current = false;
        isResizing.current = false;
        const finalFloat = liveX < -35 ? 'left' : (liveX > 35 ? 'right' : currFloat);
        const finalX = isFloated ? 0 : stateRef.current.x;
        onChange({ ...transform, x: finalX, y: stateRef.current.y, width: stateRef.current.w, float: finalFloat });
      }
    };

    const handleGlobalDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.preview-graphic-container')) {
        setIsSelected(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSelected && onDelete && (e.key === 'Backspace' || e.key === 'Delete')) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          e.preventDefault();
          onDelete();
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousedown', handleGlobalDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousedown', handleGlobalDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [transform, onChange, liveX, currFloat, isFloated, isSelected, onDelete]);

  // Ensure bottom margin is strictly positive (>= 12px) so text NEVER overlaps the image
  const topMargin = Math.max(4, 10 + liveY);
  const botMargin = Math.max(12, 14 - liveY);

  return (
    <div
      ref={boxRef}
      tabIndex={0}
      className="preview-graphic-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleMouseDown}
      style={{
        position: 'relative',
        display: 'block',
        float: isFloated ? effectiveFloat : 'none',
        width: `${liveW}%`,
        margin: isFloated 
          ? (effectiveFloat === 'left' ? `${topMargin}px 16px ${botMargin}px 0px` : `${topMargin}px 0px ${botMargin}px 16px`)
          : `${topMargin}px auto ${botMargin}px auto`,
        transform: isFloated ? 'none' : `translate(${liveX}px, 0px)`,
        clear: isFloated ? 'none' : 'both',
        boxSizing: 'border-box',
        cursor: isDragging.current ? 'grabbing' : 'grab',
        transition: isDragging.current || isResizing.current ? 'none' : 'all 0.15s ease',
        outline: (isHovered || isSelected) ? '1.5px dashed #38bdf8' : 'none',
        outlineOffset: '3px',
        borderRadius: '4px'
      }}
    >
      {/* Invisible hover bridges for top and bottom */}
      <div style={{ position: 'absolute', top: -38, left: 0, width: '100%', height: 38, zIndex: 99 }} />
      <div style={{ position: 'absolute', bottom: -38, left: 0, width: '100%', height: 38, zIndex: 99 }} />

      {(isHovered || isSelected) && (
        <>
          <div onMouseDown={e => handleResizeStart(e, -1)} style={{ position: 'absolute', top: -6, left: -6, width: 11, height: 11, background: '#38bdf8', border: '1.5px solid #fff', borderRadius: 2, cursor: 'nwse-resize', zIndex: 105 }} />
          <div onMouseDown={e => handleResizeStart(e, 1)} style={{ position: 'absolute', top: -6, right: -6, width: 11, height: 11, background: '#38bdf8', border: '1.5px solid #fff', borderRadius: 2, cursor: 'nesw-resize', zIndex: 105 }} />
          <div onMouseDown={e => handleResizeStart(e, -1)} style={{ position: 'absolute', bottom: -6, left: -6, width: 11, height: 11, background: '#38bdf8', border: '1.5px solid #fff', borderRadius: 2, cursor: 'nesw-resize', zIndex: 105 }} />
          <div onMouseDown={e => handleResizeStart(e, 1)} style={{ position: 'absolute', bottom: -6, right: -6, width: 11, height: 11, background: '#38bdf8', border: '1.5px solid #fff', borderRadius: 2, cursor: 'nwse-resize', zIndex: 105 }} />
        </>
      )}

      {(isHovered || isSelected || scale !== 1 || propX !== 0 || propY !== 0 || currWidth !== defaultWidth || currFloat !== defaultFloat) && (
        <div style={{
          position: 'absolute', 
          top: flipBottom ? 'calc(100% + 8px)' : -34, 
          left: '50%', transform: 'translateX(-50%)', zIndex: 100,
          display: 'flex', alignItems: 'center', gap: 5,
          background: '#0f172a', padding: '3px 8px', borderRadius: 6,
          border: '1px solid #38bdf8', boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
          fontSize: 10.5, color: '#fff', userSelect: 'none', whiteSpace: 'nowrap'
        }}>
          <span style={{ fontSize: 8.5, color: '#94a3b8', textTransform: 'uppercase' }}>Größe:</span>
          <button onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onChange({ ...transform, width: Math.max(15, liveW - 5) }); }} style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: 3, padding: '0 4px', cursor: 'pointer' }}>➖</button>
          <input
            type="number"
            min="15"
            max="100"
            value={liveW}
            onChange={e => {
              const v = Number(e.target.value);
              if (!isNaN(v) && v >= 10 && v <= 100) onChange({ ...transform, width: v });
            }}
            style={{ width: '38px', background: '#1e293b', border: '1px solid #38bdf8', color: '#38bdf8', borderRadius: 3, textAlign: 'center', fontWeight: 'bold', fontSize: 10 }}
          />
          <span style={{ color: '#38bdf8', fontWeight: 700 }}>%</span>
          <button onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onChange({ ...transform, width: Math.min(100, liveW + 5) }); }} style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: 3, padding: '0 4px', cursor: 'pointer' }}>➕</button>
          
          <div style={{ width: 1, height: 10, background: '#334155', margin: '0 2px' }} />

          <button onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onChange({ ...transform, float: 'none' }); }} style={{ background: effectiveFloat === 'none' ? '#38bdf8' : '#1e293b', color: effectiveFloat === 'none' ? '#0f172a' : '#fff', fontWeight: 700, borderRadius: 3, padding: '1px 5px', border: 'none', cursor: 'pointer', fontSize: 8.5 }}>⏹️ Mitte</button>
          <button onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onChange({ ...transform, float: 'left' }); }} style={{ background: effectiveFloat === 'left' ? '#38bdf8' : '#1e293b', color: effectiveFloat === 'left' ? '#0f172a' : '#fff', fontWeight: 700, borderRadius: 3, padding: '1px 5px', border: 'none', cursor: 'pointer', fontSize: 8.5 }}>⬅️ Links</button>
          <button onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onChange({ ...transform, float: 'right' }); }} style={{ background: effectiveFloat === 'right' ? '#38bdf8' : '#1e293b', color: effectiveFloat === 'right' ? '#0f172a' : '#fff', fontWeight: 700, borderRadius: 3, padding: '1px 5px', border: 'none', cursor: 'pointer', fontSize: 8.5 }}>➡️ Rechts</button>

          {(propX !== 0 || propY !== 0 || scale !== 1 || currWidth !== defaultWidth || currFloat !== defaultFloat) && (
            <button
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onChange({ scale: 1, x: 0, y: 0, width: defaultWidth, float: defaultFloat }); }}
              title="Reset"
              style={{ background: '#ef444420', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 3, padding: '1px 4px', cursor: 'pointer', fontSize: 8.5 }}
            >Reset</button>
          )}

          {onDelete && (
            <button
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onDelete(); }}
              title="Bild löschen"
              style={{ background: '#dc2626', border: 'none', color: '#ffffff', borderRadius: 3, padding: '1px 6px', cursor: 'pointer', fontWeight: 'bold', fontSize: 9 }}
            >🗑️ Löschen</button>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

const MaintenanceOverlay = ({ message, endsAt }: { message: string | null; endsAt: string | null }) => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 999999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ backgroundColor: '#141414', padding: '40px', borderRadius: '16px', border: '1px solid #262626', maxWidth: '500px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 16px 0', color: '#f5f5f5' }}>Wartungsarbeiten</h1>
        <p style={{ fontSize: '15px', color: '#a3a3a3', lineHeight: 1.5, margin: '0 0 24px 0' }}>
          {message || 'Book24 Studio wird gerade gewartet. Bitte versuche es später wieder.'}
        </p>
        {endsAt && (
          <div style={{ backgroundColor: '#1a1a1a', padding: '12px', borderRadius: '8px', border: '1px solid #262626', fontSize: '14px', color: '#e5e5e5' }}>
            Voraussichtlich wieder online am:<br/>
            <strong style={{ color: '#38bdf8' }}>{new Date(endsAt).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })} Uhr</strong>
          </div>
        )}
      </div>
    </div>
  );
};

// Safe localStorage wrapper to prevent Safari SecurityError in private/third-party contexts
const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {}
  },
  removeItem(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {}
  }
};

export default function App() {
  // Supabase Auth states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [userHasValidLicense, setUserHasValidLicense] = useState<boolean | null>(null);
  const [maintenanceInfo, setMaintenanceInfo] = useState<{ active: boolean; message: string | null; endsAt: string | null }>({ active: false, message: null, endsAt: null });
  const [activeModules, setActiveModules] = useState<Record<string, any>>({ brain: true, dashboard: true, calculator: true, studio: true });
  const [showBanModal, setShowBanModal] = useState(false);

  // Tracks whether books were already loaded for the current user session.
  // Prevents onAuthStateChange re-runs (e.g. token refresh) from overwriting books.
  const booksLoadedForUidRef = React.useRef<string | null>(null);
  const isCheckingRef = React.useRef<boolean>(false);

  // Sync state with Supabase auth status
  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    // Safety net: force authLoading=false after 3s max — keeps UI responsive even on slow networks.
    const safetyTimeoutId = setTimeout(() => {
      setAuthLoading(false);
    }, 3000);

    const checkUser = async () => {
      if (!supabase) return;
      if (isCheckingRef.current) return;
      isCheckingRef.current = true;

      try {
        // ── FAST PATH: check session FIRST so the user is never stuck on a black screen ──
        // getSession() is near-instant (reads from storage). We show the user immediately,
        // then load maintenance/modules in background.
        const { data: { session } } = await supabase.auth.getSession();
      const user = toAppUser(session?.user ?? null);
      if (user) {
        // Wichtig: eingeloggte Nutzer nicht auf einem schwarzen Bootstrap-Screen festhalten,
        // während Profil/Cloud-Daten im Hintergrund geladen werden.
        setCurrentUser(user);
        setAuthLoading(false);
        clearTimeout(safetyTimeoutId);

        // Background: fetch maintenance/module state (non-blocking)
        Promise.resolve(supabase.rpc('get_maintenance_mode')).then(({ data: mmData }) => {
          if (mmData && typeof mmData === 'object') {
            setMaintenanceInfo({ active: Boolean(mmData.active), message: mmData.message, endsAt: mmData.ends_at });
          } else if (typeof mmData === 'boolean') {
            setMaintenanceInfo(prev => ({ ...prev, active: mmData }));
          }
        }).catch(() => {});
        Promise.resolve(supabase.rpc('get_system_modules')).then(({ data: modData }) => {
          if (modData && typeof modData === 'object') setActiveModules(modData);
        }).catch(() => {});

        // Fetch profile status and license
        let profileStatus = null;
        let hasLicense = false;
        try {
          const { data: profile } = await supabase.from('profiles').select('status, license_key').eq('id', user.uid).single();
          profileStatus = profile?.status;
          if (profile?.license_key) {
            hasLicense = true;
          }
        } catch (err) {
          // ignore
        }
        
        if (profileStatus === 'banned') {
          await supabase.auth.signOut();
          setCurrentUser(null);
          setShowBanModal(true);
          return;
        }

        // Mark user as returning so they bypass LicensePrompt in the future on this browser
        safeLocalStorage.setItem('b24_returning_user', 'true');

        // Check for Gumroad License in localStorage
        const savedLicense = safeLocalStorage.getItem('b24_valid_license_key');
        if (savedLicense && !hasLicense) {
          try {
            await supabase.rpc('claim_license_key', { key_to_claim: savedLicense });
            hasLicense = true;
            safeLocalStorage.removeItem('b24_valid_license_key'); // clear after claim
          } catch (e) {
            console.error('Failed to claim license:', e);
          }
        }

        // Owner Bypass
        if (isOwnerEmail(user.email)) {
          hasLicense = true;
        }

        // NOTE: Grandfather clause removed — all new accounts must enter a valid license key.
        // Existing users with a license_key stored in their Supabase profile are already covered above.

        setUserHasValidLicense(hasLicense);
        setCurrentUser(user);


        // Clear any cached data from a previous (different) user to prevent data leakage
        const lastUid = safeLocalStorage.getItem('b24studio_last_uid');
        const isSupabaseUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        
        if (lastUid && lastUid !== user.uid) {
          if (!isSupabaseUuid(lastUid) && isSupabaseUuid(user.uid)) {
            // Migration scenario: Old Firebase UID to New Supabase UUID
            // Do not wipe local storage. Existing data will be automatically synced to the new account.
            console.log('Migrating local data from Firebase to Supabase for user', user.uid);
          } else {
            // Different user logged in — wipe all local caches
            try {
              const keysToRemove: string[] = [];
              for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('b24studio_v1')) keysToRemove.push(k);
              }
              for (const k of keysToRemove) localStorage.removeItem(k);
            } catch (e) {}
          }
        }
        safeLocalStorage.setItem('b24studio_last_uid', user.uid);

        // Load accounts from Supabase (source of truth — never use localStorage of another user)
        const cloudAccs = await loadAccountsFromCloud(user.uid);
        if (cloudAccs && cloudAccs.length > 0) {
          setAccounts(cloudAccs);
        }

        // Load books
        const activeAcc = safeLocalStorage.getItem(KEYS.activeAccount) || 'default';
        BrainService.syncCloudState(activeAcc).then(() => {
          if (lastUid && !isSupabaseUuid(lastUid) && isSupabaseUuid(user.uid)) {
            // Force push local BrainState to Supabase during migration
            const localBrain = BrainService.loadState(activeAcc);
            BrainService.saveState(activeAcc, localBrain);
          }
        }).catch(console.error);
        // ── SKIP BOOK LOAD if already loaded for this user (e.g. token refresh) ──
        // This prevents onAuthStateChange from overwriting books the user just created.
        if (booksLoadedForUidRef.current === user.uid) {
          setAuthLoading(false);
          return;
        }

        // ── RESCUE SCAN: lese ALLE b24studio_v1_library_* Keys, nicht nur den aktiven ──
        // Das verhindert Datenverlust wenn activeAcc sich geändert hat
        let localBooks: any[] | null = null;
        try {
          const allLibraryBooks: any[] = [];
          const seenIds = new Set<string>();
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('b24studio_v1_library_')) {
              try {
                const raw = localStorage.getItem(key);
                if (raw) {
                  const parsed = JSON.parse(raw);
                  if (Array.isArray(parsed)) {
                    parsed.forEach((b: any) => {
                      if (b?.id && !seenIds.has(b.id)) {
                        seenIds.add(b.id);
                        allLibraryBooks.push(b);
                      }
                    });
                  }
                }
              } catch { /* skip corrupt key */ }
            }
          }
          if (allLibraryBooks.length > 0) localBooks = allLibraryBooks;
        } catch (e) {}

        const cloudBooks = await loadBooksFromCloud(user.uid);

        let finalBooks: any[];
        const isSameUser = lastUid === user.uid;

        if (isSameUser && localBooks && localBooks.length > 0) {
          if (!cloudBooks || cloudBooks.length === 0) {
            // Same user, cloud empty — use local as source of truth
            finalBooks = localBooks;
          } else {
            // Merge: local wins for content, cloud fills in missing books
            const merged = localBooks.map((localBook: any) => {
              const cloudBook = cloudBooks.find((cb: any) => cb.id === localBook.id);
              if (!cloudBook) return localBook;
              return {
                ...cloudBook,
                ...localBook,
                images: { ...(cloudBook.images || {}), ...(localBook.images || {}) },
                imagesTransform: { ...(cloudBook.imagesTransform || {}), ...(localBook.imagesTransform || {}) },
                pagesText: { ...(cloudBook.pagesText || {}), ...(localBook.pagesText || {}) },
                pagesOverflow: { ...(cloudBook.pagesOverflow || {}), ...(localBook.pagesOverflow || {}) }
              };
            });
            cloudBooks.forEach((cb: any) => {
              if (!merged.find((fb: any) => fb.id === cb.id)) merged.push(cb);
            });
            finalBooks = merged;
          }
        } else if (!isSameUser) {
          // Different user — cloud is the ONLY source of truth (security: no cross-account leak)
          finalBooks = cloudBooks || [];
        } else {
          finalBooks = cloudBooks || [];
        }

        // ── BULLETPROOF SYNC: Always push ALL books to cloud on login ──
        // This guarantees that localStorage books are never lost even if
        // the previous session failed to save.
        if (finalBooks.length > 0) {
          forcePushBooksToCloud(user.uid, finalBooks).then(result => {
            console.log(`[Login Sync] Books pushed to cloud:`, result);
          });
        }

        // Determine final books to show
        let booksToSet: any[] = [];
        if (finalBooks && finalBooks.length > 0) {
          booksToSet = finalBooks;
        } else {
          // Last resort: if cloud AND finalBooks both empty, check localStorage directly
          const localFallback = safeLocalStorage.getItem(KEYS.library(activeAcc));
          if (localFallback) {
            try {
              const parsed = JSON.parse(localFallback);
              if (Array.isArray(parsed) && parsed.length > 0) {
                booksToSet = parsed;
                forcePushBooksToCloud(user.uid, parsed); // rescue sync
              }
            } catch { /* invalid JSON */ }
          }
        }

        if (booksToSet.length > 0) {
          const cleanBooks = booksToSet.map((b: any) => ({
            ...b,
            pagesStatus: Object.fromEntries(
              Object.entries(b.pagesStatus || {}).map(([k, v]) => [k, v === 'generating' ? 'idle' : v])
            )
          }));
          setBooksState(cleanBooks);
          safeLocalStorage.setItem(KEYS.library(activeAcc), JSON.stringify(cleanBooks));
        } else {
          setBooksState([]);
        }

        // Mark books as loaded for this user — prevents future re-runs from overwriting
        booksLoadedForUidRef.current = user.uid;
      } else {
        setCurrentUser(null);
        booksLoadedForUidRef.current = null;
        // Do not wipe localStorage on null auth emission (prevents localhost F5 race condition data loss)
      }
      } catch (err) {
        console.error("Error during checkUser:", err);
      } finally {
        isCheckingRef.current = false;
        setAuthLoading(false);
      }
    };

    void checkUser();

    const { data: { subscription } } = supabase!.auth.onAuthStateChange((event, session) => {
      const user = toAppUser(session?.user ?? null);
      if (!user) {
        // Only clear user state for explicit sign-out events, not for INITIAL_SESSION
        // which can fire with null before getSession() resolves in checkUser.
        if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          booksLoadedForUidRef.current = null;
          setAuthLoading(false);
        } else if (event !== 'INITIAL_SESSION') {
          // For TOKEN_REFRESHED, USER_UPDATED etc. with null user — treat as sign out
          setCurrentUser(null);
          booksLoadedForUidRef.current = null;
          setAuthLoading(false);
        }
        // For INITIAL_SESSION with null: do nothing — checkUser() is already running
        // and will call setAuthLoading(false) in its finally block.
      } else {
        if (event === 'SIGNED_IN') {
          // ── INSTANT SIGN-IN: show app immediately from the session data we already have ──
          // This fires right after OAuth redirect — no need to wait for checkUser().
          setCurrentUser(user);
          setAuthLoading(false);
          clearTimeout(safetyTimeoutId);
          setActiveTab('projects');
          try {
            safeLocalStorage.setItem('b24studio_activeTab', 'projects');
          } catch (e) {}
        }
        // Run full checkUser() in background for books, license, profile etc.
        void checkUser();
      }
    });

    // Setup Maintenance Polling every 15 seconds
    const intervalId = setInterval(async () => {
      if (!supabase) return;
      try {
        const { data: mmData } = await supabase.rpc('get_maintenance_mode');
        if (mmData && typeof mmData === 'object') {
          setMaintenanceInfo({ 
            active: Boolean(mmData.active), 
            message: mmData.message, 
            endsAt: mmData.ends_at 
          });
        }
      } catch (err) {
        // silent
      }
    }, 15000);

    const settingsSub = supabase.channel('system-settings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, (payload: any) => {
        const newRow = payload.new as any;
        if (newRow && newRow.key === 'active_modules') {
          setActiveModules(newRow.value);
        }
      }).subscribe();

    // ── AUTO-SYNC: Push alle Bücher alle 2 Minuten zur Cloud ──
    const autoSyncId = setInterval(() => {
      // Read current user UID from global ref (avoids stale closure)
      const uid = (window as any).__b24_uid__;
      if (!uid) return;
      const activeAcc = safeLocalStorage.getItem(KEYS.activeAccount) || 'default';
      const booksStr = safeLocalStorage.getItem(KEYS.library(activeAcc));
      if (!booksStr) return;
      try {
        const localBooks = JSON.parse(booksStr);
        if (Array.isArray(localBooks) && localBooks.length > 0) {
          syncLocalLibraryToCloud(uid, localBooks);
        }
      } catch { /* silent */ }
    }, 2 * 60 * 1000); // every 2 minutes

    return () => {
      subscription.unsubscribe();
      clearInterval(intervalId);
      clearInterval(autoSyncId);
      clearTimeout(safetyTimeoutId);
      settingsSub.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    syncUserProfile(currentUser).catch(console.error);
    // Store UID globally so the auto-sync interval can access it
    (window as any).__b24_uid__ = currentUser.uid;
    return () => { (window as any).__b24_uid__ = null; };
  }, [currentUser]);


  // Theme Manager
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (safeLocalStorage.getItem(KEYS.theme) as 'dark' | 'light') || 'dark';
  });

  // Account System
  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      const saved = safeLocalStorage.getItem(KEYS.accounts);
      return saved ? JSON.parse(saved) : [{ id: 'default', username: 'Haupt-Bibliothekar' }];
    } catch (e) {
      return [{ id: 'default', username: 'Haupt-Bibliothekar' }];
    }
  });
  const [activeAccountId, setActiveAccountIdState] = useState<string>(() => {
    return safeLocalStorage.getItem(KEYS.activeAccount) || 'default';
  });
  const activeAccountIdRef = React.useRef<string>(activeAccountId);
  const setActiveAccountId = (id: string) => {
    setActiveAccountIdState(id);
    activeAccountIdRef.current = id;
  };
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [newUsernameInput, setNewUsernameInput] = useState<string>('');


  // Multi-Provider API Keys (Groq & Google Gemini)
  const [groqKeysInput, setGroqKeysInput] = useState<string>(() => {
    return safeLocalStorage.getItem('groq_api_keys') || safeLocalStorage.getItem('groq_api_key') || '';
  });
  const [geminiKeysInput, setGeminiKeysInput] = useState<string>(() => {
    return safeLocalStorage.getItem('gemini_api_keys') || '';
  });
  const [showSettings, setShowSettings] = useState<boolean>(() => {
    const groqEmpty = !(safeLocalStorage.getItem('groq_api_keys') || safeLocalStorage.getItem('groq_api_key'));
    const geminiEmpty = !safeLocalStorage.getItem('gemini_api_keys');
    return groqEmpty && geminiEmpty;
  });

  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return safeLocalStorage.getItem(KEYS.selectedModel) || 'llama-3.3-70b-versatile';
  });

  useEffect(() => {
    localStorage.setItem(KEYS.selectedModel, selectedModel);
  }, [selectedModel]);

  // Explorer and Marketing tabs state
  const [explorerTab, setExplorerTab] = useState<'settings' | 'marketing'>('settings');
  const [isGeneratingMarketing, setIsGeneratingMarketing] = useState<boolean>(false);

  const getActiveKeys = (modelName: string) => {
    const isGemini = modelName.startsWith('gemini-');
    const inputVal = isGemini ? geminiKeysInput : groqKeysInput;
    return inputVal.split(/[\n,]+/).map(k => k.trim()).filter(Boolean);
  };

  const hasKeysForModel = (modelName: string) => {
    return getActiveKeys(modelName).length > 0;
  };

  const groqConnected = getActiveKeys('llama-3.3-70b-versatile').length > 0;
  const geminiConnected = getActiveKeys('gemini-2.0-flash').length > 0;
  const settingsNeedAttention = !groqConnected || !geminiConnected;

  const handleGroqKeysChange = (value: string) => {
    setGroqKeysInput(value);
    localStorage.setItem('groq_api_keys', value);
  };

  const handleGeminiKeysChange = (value: string) => {
    setGeminiKeysInput(value);
    localStorage.setItem('gemini_api_keys', value);
  };

  const openSettings = () => setShowSettings(true);

  const getServiceInstance = () => {
    const groqList = groqKeysInput.split(/[\n,]+/).map(k => k.trim()).filter(Boolean);
    const geminiList = geminiKeysInput.split(/[\n,]+/).map(k => k.trim()).filter(Boolean);
    return new GeminiService({ groq: groqList, gemini: geminiList }, selectedModel);
  };

  const checkTextOverflow = (text: string, book: Book, pageNum?: number): boolean => {
    const measurer = document.getElementById('book24-measurer');
    if (!measurer) return false;

    let wInches = 6;
    let hInches = 9;
    if (book.pageSize === '5x8') { wInches = 5; hInches = 8; }
    else if (book.pageSize === '5.5x8.5') { wInches = 5.5; hInches = 8.5; }
    else if (book.pageSize === '6x9') { wInches = 6; hInches = 9; }
    else if (book.pageSize === '8.5x11') { wInches = 8.5; hInches = 11; }
    else if (book.pageSize === 'a4') { wInches = 8.27; hInches = 11.69; }
    else if (book.pageSize === 'custom') {
      wInches = book.customWidth || 6;
      hInches = book.customHeight || 9;
    }
    
    const previewHeight = 370;
    const previewWidth = previewHeight * (wInches / hInches);
    const previewScaleY = previewHeight / (hInches * 72);
    const previewScaleX = previewWidth / (wInches * 72);

    const topMarginPx = 54 * previewScaleY;
    const bottomMarginPx = 54 * previewScaleY;
    const insideMarginPx = 54 * previewScaleX;
    const outsideMarginPx = 36 * previewScaleX;

    const contentWidth = previewWidth - (insideMarginPx + outsideMarginPx);
    const contentHeight = previewHeight - (topMarginPx + bottomMarginPx) - 18; // safe margin
    const previewFontSize = book.fontSize * previewScaleY;

    measurer.style.width = `${contentWidth}px`;
    measurer.style.fontSize = `${previewFontSize}px`;
    
    const resolvedFont = book.fontFamily === 'times' 
      ? '"Times New Roman", Times, serif' 
      : book.fontFamily === 'courier'
        ? '"Courier New", Courier, monospace'
        : 'Arial, Helvetica, sans-serif';

    measurer.style.fontFamily = resolvedFont;
    measurer.style.lineHeight = '1.5';
    measurer.style.textAlign = book.alignment === 'left' ? 'left' : 'justify';
    measurer.style.textAlignLast = 'left';
    measurer.style.wordBreak = 'break-word';
    (measurer.style as any).WebkitHyphens = 'auto';
    (measurer.style as any).msHyphens = 'auto';
    measurer.style.hyphens = 'auto';
    measurer.style.padding = '0';
    measurer.style.paddingRight = '1px';
    measurer.style.margin = '0';
    measurer.style.overflow = 'hidden';

    const paragraphStyleSetting = (pageNum !== undefined && book.pagesParagraphStyle?.[pageNum]) 
      || book.paragraphStyle 
      || 'indent';

    const showInitialOnPage = pageNum !== undefined && (book.pagesInitial || []).includes(pageNum);

    const isFirstPageOfChapter = pageNum !== undefined && book.outline && book.outline.pages && (
      pageNum === 1 ||
      (book.outline.pages[pageNum - 1]?.chapter_title !== book.outline.pages[pageNum - 2]?.chapter_title)
    );
    const globalOff = book.showChapterTitles === false;
    const pageOff = (book.pagesHideChapter || []).includes(pageNum || 0);
    const showChapterTitle = isFirstPageOfChapter && !globalOff && !pageOff;

    const getLinesCount = (txtStr: string, font: string, maxWidth: number): number => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return 1;
      ctx.font = font;
      const words = txtStr.split(' ');
      let lines = 0;
      let currentLine = '';
      for (let i = 0; i < words.length; i++) {
        const testLine = currentLine + (currentLine ? ' ' : '') + words[i];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
          lines++;
          currentLine = words[i];
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines++;
      return Math.max(1, lines);
    };

    const renderBlockToDomNode = (
      block: WorkbookBlock,
      paragraphStyle: string,
      isDropCapCandidate: boolean,
      onDropCapUsed: () => void
    ): HTMLElement | null => {
      const renderInlineHtml = (str: string): string => {
        return str.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      };

      switch (block.type) {
        case 'pagebreak': {
          const div = document.createElement('div');
          div.style.display = 'flex';
          div.style.alignItems = 'center';
          div.style.gap = '8px';
          div.style.margin = '12px 0';
          div.style.width = '100%';
          
          const lineLeft = document.createElement('div');
          lineLeft.style.flex = '1';
          lineLeft.style.borderTop = '1px dashed #cbd5e1';
          
          const span = document.createElement('span');
          span.style.fontSize = '7px';
          span.style.color = '#94a3b8';
          span.style.textTransform = 'uppercase';
          span.style.letterSpacing = '0.05em';
          span.style.whiteSpace = 'nowrap';
          span.textContent = 'Seitenumbruch (PDF)';
          
          const lineRight = document.createElement('div');
          lineRight.style.flex = '1';
          lineRight.style.borderTop = '1px dashed #cbd5e1';
          
          div.appendChild(lineLeft);
          div.appendChild(span);
          div.appendChild(lineRight);
          return div;
        }

        case 'ornament': {
          const p = document.createElement('p');
          p.style.textAlign = 'center';
          p.style.fontSize = '10px';
          p.style.margin = '8px 0';
          p.style.color = '#64748b';
          p.textContent = book.chapterOrnament || '❦';
          return p;
        }

        case 'heading': {
          const p = document.createElement('p');
          p.className = 'literary-paragraph';
          p.style.fontWeight = 'bold';
          p.style.margin = '1.5em 0';
          p.style.padding = '0';
          p.style.lineHeight = '1.5';
          p.innerHTML = `<strong>${renderInlineHtml(block.text)}</strong>`;
          return p;
        }

        case 'quote': {
          const isInfobox = paragraphStyle === 'spacing';
          if (pageNum !== undefined && (book.pagesHideQuotes || []).includes(pageNum)) return null;
          
          if (isInfobox) {
            const div = document.createElement('div');
            div.style.backgroundColor = '#f8fafc';
            div.style.borderLeft = '2px solid #64748b';
            div.style.padding = '6px 8px';
            div.style.borderRadius = '2px';
            div.style.margin = '6px 0';
            div.style.fontStyle = 'italic';
            div.style.color = '#334155';
            div.innerHTML = renderInlineHtml(block.text);
            return div;
          }
          
          const q = document.createElement('blockquote');
          q.style.fontFamily = '"Playfair Display", Georgia, serif';
          q.style.fontStyle = 'italic';
          q.style.borderLeft = 'none';
          q.style.paddingLeft = '0';
          q.style.margin = '24px 20px';
          q.style.color = 'var(--text-muted)';
          q.style.lineHeight = '1.5';
          q.style.textAlign = 'justify';
          q.innerHTML = renderInlineHtml(block.text);
          return q;
        }

        case 'bullet': {
          const p = document.createElement('p');
          p.className = 'literary-paragraph';
          p.style.margin = '0';
          p.style.padding = '0';
          p.style.lineHeight = '1.5';
          p.style.textAlign = 'left';
          
          const spanContainer = document.createElement('span');
          spanContainer.style.display = 'flex';
          spanContainer.style.gap = '6px';
          spanContainer.style.paddingLeft = '8px';
          
          const bulletSpan = document.createElement('span');
          bulletSpan.textContent = '•';
          
          const textSpan = document.createElement('span');
          textSpan.innerHTML = renderInlineHtml(block.text);
          
          spanContainer.appendChild(bulletSpan);
          spanContainer.appendChild(textSpan);
          p.appendChild(spanContainer);
          return p;
        }

        case 'numbered': {
          const p = document.createElement('p');
          p.className = 'literary-paragraph';
          p.style.margin = '0';
          p.style.padding = '0';
          p.style.lineHeight = '1.5';
          p.style.textAlign = 'left';
          
          const spanContainer = document.createElement('span');
          spanContainer.style.display = 'flex';
          spanContainer.style.gap = '6px';
          spanContainer.style.paddingLeft = '8px';
          
          const numSpan = document.createElement('span');
          numSpan.style.fontWeight = 'bold';
          numSpan.textContent = block.num;
          
          const textSpan = document.createElement('span');
          textSpan.innerHTML = renderInlineHtml(block.text);
          
          spanContainer.appendChild(numSpan);
          spanContainer.appendChild(textSpan);
          p.appendChild(spanContainer);
          return p;
        }

        case 'checkbox': {
          const div = document.createElement('div');
          div.className = 'workbook-checkbox-container';
          div.style.display = 'flex';
          div.style.alignItems = 'flex-start';
          div.style.gap = '6px';
          div.style.margin = '3px 0';
          div.style.lineHeight = '1.5';
          
          const boxSpan = document.createElement('span');
          boxSpan.className = 'workbook-checkbox-box' + (block.checked ? ' checked' : '');
          boxSpan.style.flexShrink = '0';
          boxSpan.style.width = '1em';
          boxSpan.style.height = '1em';
          boxSpan.style.border = '1.5px solid #1e293b';
          boxSpan.style.borderRadius = '2px';
          boxSpan.style.display = 'inline-block';
          boxSpan.style.marginTop = '0.15em';
          boxSpan.style.position = 'relative';
          boxSpan.style.background = '#fff';
          
          if (block.checked) {
            const indicator = document.createElement('span');
            indicator.style.position = 'absolute';
            indicator.style.top = '-2px';
            indicator.style.left = '1px';
            indicator.style.fontSize = '0.85em';
            indicator.style.color = '#1e293b';
            indicator.style.fontWeight = '700';
            indicator.textContent = '✓';
            boxSpan.appendChild(indicator);
          }
          
          const labelSpan = document.createElement('span');
          labelSpan.innerHTML = renderInlineHtml(block.text);
          
          div.appendChild(boxSpan);
          div.appendChild(labelSpan);
          return div;
        }

        case 'dotted_line': {
          const hr = document.createElement('span');
          hr.className = 'workbook-dotted-line';
          hr.style.width = '100%';
          hr.style.border = 'none';
          hr.style.borderBottom = '1.5px dotted #94a3b8';
          hr.style.margin = '5px 0';
          hr.style.height = '1.5em';
          hr.style.display = 'block';
          return hr;
        }

        case 'table': {
          const table = document.createElement('table');
          table.className = 'workbook-table';
          table.style.width = '100%';
          table.style.borderCollapse = 'collapse';
          table.style.margin = '6px 0';
          table.style.fontSize = '0.92em';
          
          const thead = document.createElement('thead');
          const headerTr = document.createElement('tr');
          block.headers.forEach(h => {
            const th = document.createElement('th');
            th.style.border = '1px solid #cbd5e1';
            th.style.padding = '4px 7px';
            th.style.textAlign = 'left';
            th.style.verticalAlign = 'top';
            th.style.wordBreak = 'break-word';
            th.style.fontWeight = '700';
            th.style.background = '#f1f5f9';
            th.style.color = '#1e293b';
            th.innerHTML = renderInlineHtml(h);
            headerTr.appendChild(th);
          });
          thead.appendChild(headerTr);
          table.appendChild(thead);
          
          const tbody = document.createElement('tbody');
          block.rows.forEach(row => {
            const tr = document.createElement('tr');
            row.forEach(cell => {
              const td = document.createElement('td');
              td.style.border = '1px solid #cbd5e1';
              td.style.padding = '4px 7px';
              td.style.textAlign = 'left';
              td.style.verticalAlign = 'top';
              td.style.wordBreak = 'break-word';
              td.style.color = '#334155';
              td.innerHTML = renderInlineHtml(cell);
              tr.appendChild(td);
            });
            tbody.appendChild(tr);
          });
          table.appendChild(tbody);
          return table;
        }

        case 'box': {
          const boxType = block.boxType || 'box';
          const div = document.createElement('div');
          div.className = `workbook-box type-${boxType}`;
          div.style.borderRadius = '4px';
          div.style.margin = '8px 0';
          div.style.position = 'relative';

          if (boxType === 'callout') {
            div.style.borderLeft = '3px solid #334155';
            div.style.backgroundColor = '#f8fafc';
            div.style.padding = '12px 14px 10px';
          } else if (boxType === 'reflection') {
            div.style.border = '1px solid #cbd5e1';
            div.style.backgroundColor = '#fdfcfb';
            div.style.padding = '12px 14px 10px';
          } else if (boxType === 'action') {
            div.style.border = '2px solid #0f172a';
            div.style.padding = '12px 14px 10px';
            div.style.boxShadow = '3px 3px 0px #0f172a';
          } else {
            // default box
            div.style.border = '1.5px dashed #475569';
            div.style.padding = '10px 10px 8px';
          }
          
          if (block.title) {
            const titleSpan = document.createElement('span');
            titleSpan.className = 'workbook-box-title';
            titleSpan.style.position = 'absolute';
            titleSpan.style.top = '-0.7em';
            titleSpan.style.left = '50%';
            titleSpan.style.transform = 'translateX(-50%)';
            titleSpan.style.background = '#ffffff';
            titleSpan.style.padding = '0 6px';
            titleSpan.style.fontSize = '0.78em';
            titleSpan.style.fontWeight = '700';
            titleSpan.style.letterSpacing = '0.04em';
            titleSpan.style.color = '#475569';
            titleSpan.style.whiteSpace = 'nowrap';
            titleSpan.style.textTransform = 'uppercase';
            titleSpan.textContent = block.title;
            div.appendChild(titleSpan);
          }
          
          const contentDiv = document.createElement('div');
          contentDiv.className = 'workbook-box-content';
          contentDiv.style.marginTop = '4px';
          
          block.children.forEach(child => {
            const childNode = renderBlockToDomNode(child, paragraphStyle, false, () => {});
            if (childNode) {
              contentDiv.appendChild(childNode);
            }
          });
          div.appendChild(contentDiv);
          return div;
        }

        case 'paragraph': {
          const isDropCap = isDropCapCandidate && block.text.length > 1;
          const p = document.createElement('p');
          p.className = 'literary-paragraph';
          p.style.margin = '0';
          p.style.padding = '0';
          p.style.lineHeight = '1.5';
          p.style.textAlign = book.alignment === 'left' ? 'left' : 'justify';
          
          if (isDropCap) {
            onDropCapUsed();
            const dropChar = block.text[0];
            const restText = block.text.slice(1);
            
            const dropCapSpan = document.createElement('span');
            dropCapSpan.className = 'drop-cap-letter';
            dropCapSpan.style.float = 'left';
            dropCapSpan.style.fontSize = '2.85em';
            dropCapSpan.style.lineHeight = '0.72em';
            dropCapSpan.style.marginTop = '0.12em';
            dropCapSpan.style.marginRight = '6px';
            dropCapSpan.style.fontWeight = '700';
            dropCapSpan.textContent = dropChar;
            
            p.appendChild(dropCapSpan);
            
            const textSpan = document.createElement('span');
            textSpan.innerHTML = renderInlineHtml(restText);
            p.appendChild(textSpan);
          } else {
            const marginBottom = paragraphStyle === 'spacing' ? '0.8em' : '0';
            p.style.textIndent = '0';
            p.style.marginBottom = marginBottom;
            p.innerHTML = renderInlineHtml(block.text);
          }
          return p;
        }

        case 'image': {
          const div = document.createElement('div');
          div.style.backgroundColor = '#f1f5f9';
          div.style.border = '2px dashed #94a3b8';
          div.style.borderRadius = '4px';
          div.style.padding = '20px';
          div.style.margin = '16px 0';
          div.style.textAlign = 'center';
          div.style.color = '#64748b';
          div.style.display = 'flex';
          div.style.flexDirection = 'column';
          div.style.alignItems = 'center';
          div.style.gap = '8px';
          
          const iconSpan = document.createElement('span');
          iconSpan.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
          div.appendChild(iconSpan);
          
          const promptSpan = document.createElement('span');
          promptSpan.style.fontSize = '0.85em';
          promptSpan.style.fontStyle = 'italic';
          promptSpan.textContent = `Grafik-Platzhalter: ${block.prompt}`;
          div.appendChild(promptSpan);
          
          return div;
        }

        default:
          return null;
      }
    };

    const splitPageText = (t: string): string[] => {
      if (!t) return [''];
      return t.split(/\r?\n\s*-{3,}\s*(?:\r?\n|$)/);
    };

    const parts = splitPageText(text);
    let anyOverflow = false;

    for (let partIdx = 0; partIdx < parts.length; partIdx++) {
      const part = parts[partIdx];
      const hasChapterTitle = showChapterTitle && partIdx === 0;
      
      let effectiveContentHeight = contentHeight;
      if (hasChapterTitle) {
        const chapterTitleText = book.outline?.pages?.[(pageNum || 1) - 1]?.chapter_title || '';
        const titleFontSizePx = 14 * previewScaleY;
        const fontStr = `bold ${titleFontSizePx}px ${resolvedFont}`;
        const linesCount = getLinesCount(chapterTitleText, fontStr, contentWidth);
        const titlePt = linesCount * 18 + 12;
        const ornamentPt = book.chapterOrnament ? 20 : 0;
        const totalHeaderPt = titlePt + ornamentPt;
        effectiveContentHeight -= totalHeaderPt * previewScaleY;
      }

      measurer.innerHTML = '';
      measurer.style.height = `${effectiveContentHeight}px`;

      const blocks = parsePageLines(part.split('\n'));
      let dropCapUsed = false;

      blocks.forEach((block) => {
        const node = renderBlockToDomNode(block, paragraphStyleSetting, showInitialOnPage && partIdx === 0 && !dropCapUsed, () => { dropCapUsed = true; });
        if (node) {
          measurer.appendChild(node);
        }
      });

      if (measurer.scrollHeight > effectiveContentHeight + 3) {
        anyOverflow = true;
        break;
      }
    }

    return anyOverflow;
  };

  const truncateToFit = (text: string, book: Book, pageNum?: number): string => {
    if (!text) return '';
    const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
    let result = '';
    for (let i = 0; i < sentences.length; i++) {
      const testText = result + sentences[i];
      if (checkTextOverflow(testText, book, pageNum)) {
        break; // Stop before overflowing
      }
      result = testText;
    }
    if (!result.trim() && text) {
      return text.slice(0, 300) + '...';
    }
    return result.trim();
  };

  const recalculateBookOverflows = (book: Book, updatedFields?: Partial<Book>): { [key: number]: boolean } => {
    const tempBook = { ...book, ...updatedFields };
    const overflows: { [key: number]: boolean } = {};
    const pagesText = tempBook.pagesText || {};
    
    Object.keys(pagesText).forEach(key => {
      const pageNum = Number(key);
      overflows[pageNum] = checkTextOverflow(pagesText[pageNum] || '', tempBook, pageNum);
    });
    return overflows;
  };

  // Books List & Active Selection
  const [books, setBooksState] = useState<Book[]>([]);
  const booksRef = React.useRef<Book[]>(books);

  useEffect(() => {
    booksRef.current = books;
  }, [books]);

  // ── BOOKS CHANGE SYNC: Jede Änderung → Cloud (debounced 5s) ──
  useEffect(() => {
    if (!currentUser?.uid || books.length === 0) return;
    const timer = setTimeout(() => {
      syncLocalLibraryToCloud(currentUser.uid, books);
    }, 5000);
    return () => clearTimeout(timer);
  }, [books, currentUser?.uid]);

  const cloudSaveTimeoutRef = useRef<any>(null);
  const pendingCloudSavesRef = useRef<Record<string, Book>>({});

  const setBooks = (updater: Book[] | ((prev: Book[]) => Book[])) => {
    const next = typeof updater === 'function' ? updater(booksRef.current) : updater;
    const prev = booksRef.current;
    booksRef.current = next;
    setBooksState(next);
    const currentAcc = activeAccountIdRef.current;
    try {
      if (next.length > 0) {
        localStorage.setItem(KEYS.library(currentAcc), JSON.stringify(next));
      } else {
        localStorage.removeItem(KEYS.library(currentAcc));
      }
    } catch (err) {
      console.warn("localStorage quota exceeded, relying on Firestore cloud save:", err);
    }

    // Sync updates and deletions to Firestore (Debounced)
    if (currentUser) {
      const prevIds = prev.map(b => b.id);
      const nextIds = next.map(b => b.id);
      
      // Delete removed books immediately
      prevIds.forEach(id => {
        if (!nextIds.includes(id)) {
          deleteBookFromCloud(currentUser.uid, id);
          if (pendingCloudSavesRef.current[id]) {
            delete pendingCloudSavesRef.current[id];
          }
        }
      });

      // Queue updated books
      next.forEach(book => {
        const prevBook = prev.find(b => b.id === book.id);
        if (!prevBook || JSON.stringify(prevBook) !== JSON.stringify(book)) {
          pendingCloudSavesRef.current[book.id] = book;
        }
      });

      // Reset debounce timer
      if (cloudSaveTimeoutRef.current) {
        clearTimeout(cloudSaveTimeoutRef.current);
      }
      cloudSaveTimeoutRef.current = setTimeout(async () => {
        const booksToSave = Object.values(pendingCloudSavesRef.current);
        pendingCloudSavesRef.current = {};
        for (const book of booksToSave) {
          await saveBookToCloud(currentUser.uid, book);
        }
      }, 500);
    }
  };

  // Auto-Save interval (every 30 seconds) + beforeunload handler
  useEffect(() => {
    const triggerCloudFlush = async () => {
      if (currentUser && Object.keys(pendingCloudSavesRef.current).length > 0) {
        const booksToSave = Object.values(pendingCloudSavesRef.current);
        pendingCloudSavesRef.current = {};
        if (cloudSaveTimeoutRef.current) {
          clearTimeout(cloudSaveTimeoutRef.current);
        }
        for (const book of booksToSave) {
          await saveBookToCloud(currentUser.uid, book);
        }
      }
    };

    const interval = setInterval(async () => {
      await triggerCloudFlush();
    }, 30000);

    const handleBeforeUnload = () => {
      if (currentUser && Object.keys(pendingCloudSavesRef.current).length > 0) {
        const booksToSave = Object.values(pendingCloudSavesRef.current);
        pendingCloudSavesRef.current = {};
        if (cloudSaveTimeoutRef.current) {
          clearTimeout(cloudSaveTimeoutRef.current);
        }
        booksToSave.forEach(book => {
          saveBookToCloud(currentUser.uid, book);
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser]);

  const [activeBookId, setActiveBookId] = useState<string | null>(() => {
    try {
      const activeAcc = safeLocalStorage.getItem(KEYS.activeAccount) || 'default';
      const savedScopedId = safeLocalStorage.getItem(getScopedActiveBookStorageKey(activeAcc));
      const savedGlobalId = safeLocalStorage.getItem('b24studio_activeBookId');
      const savedId = savedScopedId || savedGlobalId;
      if (savedId) return savedId;
      const saved = safeLocalStorage.getItem(KEYS.library(activeAcc));
      if (saved) {
        const parsed = JSON.parse(saved) as Book[];
        return parsed.length > 0 ? parsed[0].id : null;
      }
    } catch (e) {
      console.error('Error loading activeBookId:', e);
    }
    return null;
  });

  // Automatically restore/resolve activeBookId when books load or change
  useEffect(() => {
    if (books.length === 0) return;

    const savedScopedId = localStorage.getItem(getScopedActiveBookStorageKey(activeAccountId));
    const savedGlobalId = localStorage.getItem('b24studio_activeBookId');
    const savedId = savedScopedId || savedGlobalId;

    if (savedId && books.some(b => b.id === savedId)) {
      if (activeBookId !== savedId) {
        setActiveBookId(savedId);
      }
    } else if (!activeBookId || !books.some(b => b.id === activeBookId)) {
      // Fallback: select the first book if none selected or the selected one is gone
      setActiveBookId(books[0].id);
    }
  }, [books, activeAccountId, activeBookId]);

  const activeBook = books.find(b => b.id === activeBookId) || null;
  const brainEnabled = hasBrainAccess(currentUser?.email) || currentUser?.plan === 'staff';
  const isOwnerClient = isOwnerEmail(currentUser?.email);
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const ownerRouteActive = isOwnerRoute(currentPath);

  // Layout Tab Manager
  const [activeTab, setActiveTab] = useState<NavTabId>(() => {
    return (safeLocalStorage.getItem('b24studio_activeTab') as NavTabId) || 'projects';
  });
  const [brainTick, setBrainTick] = useState(0);
  const activeNavKey: NavTabId = ownerRouteActive && isOwnerClient ? 'owner' : activeTab;

  const refreshBrain = () => setBrainTick(t => t + 1);

  const navigateToPath = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
  };

  const handleSelectNavTab = (tab: NavTabId) => {
    if (tab === 'brain' && !brainEnabled) return;
    if (tab === 'studio' && !activeBook) return;
    if (tab === 'owner') {
      if (!isOwnerClient) return;
      navigateToPath('/owner');
      return;
    }

    if (ownerRouteActive) {
      navigateToPath('/');
    }

    setActiveTab(tab);
  };

  const runBrainPageLearn = async (book: Book, pageNum: number, memory: ChapterMemory, status: CmiePageStatus, text: string) => {
    if (!brainEnabled) return;
    const service = getServiceInstance();
    const qualityScore = await service.scoreChapterQuality(text);
    
    BrainService.learnFromPage(activeAccountIdRef.current, book, pageNum, memory, status, text, qualityScore);
    if (pageNum === 1 || pageNum % 10 === 0) {
      BrainService.trackBook(activeAccountIdRef.current, book);
    }
    refreshBrain();
  };

  const buildBrainEnrichedPrompt = (book: Book, repromptInstruction?: string) => {
    const isGroq = !selectedModel.startsWith('gemini-');
    const cmieCtx = CmieOrchestrator.enrichGenerationPrompt(
      book.cmieStore,
      book.cmieGlossary,
      repromptInstruction,
      isGroq
    );
    if (!brainEnabled) return cmieCtx;
    const brainCtx = BrainService.buildContextPrompt(activeAccountIdRef.current, book);
    return brainCtx + cmieCtx;
  };

  useEffect(() => {
    if (brainEnabled) void ObsidianSyncService.init();
  }, [brainEnabled]);

  useEffect(() => {
    if (!brainEnabled) return;

    let cancelled = false;
    let intervalId: number | null = null;

    const syncWorkspace = async () => {
      if (!ObsidianSyncService.isConnected()) return;
      const liveAccountId = activeAccountIdRef.current || activeAccountId;
      const liveState = BrainService.getState(liveAccountId);
      await ObsidianSyncService.syncWorkspaceSnapshot(liveAccountId, liveState, books);
      await CloudQueueService.processQueue(liveAccountId);
    };

    void ObsidianSyncService.init().then(() => {
      if (cancelled) return;
      void syncWorkspace();
      intervalId = window.setInterval(() => {
        void syncWorkspace();
      }, 45000);
    });

    return () => {
      cancelled = true;
      if (intervalId != null) {
        window.clearInterval(intervalId);
      }
    };
  }, [brainEnabled, books, activeAccountId]);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname || '/');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!brainEnabled && activeTab === 'brain') {
      setActiveTab('projects');
    }
  }, [brainEnabled, activeTab]);

  // Resizable Panes States
  const [showGilInsights, setShowGilInsights] = useState(false);
  const [gilRefreshKey, setGilRefreshKey] = useState(0);

  const [leftWidth, setLeftWidth] = useState<number>(() => {
    const saved = safeLocalStorage.getItem('b24studio_left_width');
    return saved ? parseInt(saved, 10) : 270;
  });
  const [rightWidth, setRightWidth] = useState<number>(() => {
    const saved = safeLocalStorage.getItem('b24studio_right_width');
    return saved ? parseInt(saved, 10) : 360;
  });

  const startResizingLeft = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    const startWidth = leftWidth;
    const startX = mouseDownEvent.clientX;

    const doDrag = (mouseMoveEvent: MouseEvent) => {
      const newWidth = startWidth + (mouseMoveEvent.clientX - startX);
      setLeftWidth(Math.max(200, Math.min(500, newWidth)));
      localStorage.setItem('b24studio_left_width', Math.max(200, Math.min(500, newWidth)).toString());
    };

    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  const startResizingRight = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    const startWidth = rightWidth;
    const startX = mouseDownEvent.clientX;

    const doDrag = (mouseMoveEvent: MouseEvent) => {
      const newWidth = startWidth - (mouseMoveEvent.clientX - startX);
      setRightWidth(Math.max(280, Math.min(800, newWidth)));
      localStorage.setItem('b24studio_right_width', Math.max(280, Math.min(800, newWidth)).toString());
    };

    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  // Loading & Page states
  const [isPlanning, setIsPlanning] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const cancelGenerationRef = useRef<boolean>(false);
  const [selectedPage, setSelectedPage] = useState<number | string | null>(() => {
    const activeAcc = localStorage.getItem(KEYS.activeAccount) || 'default';
    const scopedKey = activeBookId ? getScopedSelectedPageStorageKey(activeAcc, activeBookId) : null;
    const saved = (scopedKey ? localStorage.getItem(scopedKey) : null) || localStorage.getItem('b24studio_selectedPage');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem('b24studio_activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (activeBookId) {
      localStorage.setItem('b24studio_activeBookId', activeBookId);
      localStorage.setItem(getScopedActiveBookStorageKey(activeAccountId), activeBookId);
    } else {
      localStorage.removeItem('b24studio_activeBookId');
      localStorage.removeItem(getScopedActiveBookStorageKey(activeAccountId));
    }
  }, [activeBookId, activeAccountId]);

  useEffect(() => {
    if (selectedPage !== null) {
      const serializedPage = JSON.stringify(selectedPage);
      localStorage.setItem('b24studio_selectedPage', serializedPage);
      if (activeBookId) {
        localStorage.setItem(getScopedSelectedPageStorageKey(activeAccountId, activeBookId), serializedPage);
      }
    } else {
      localStorage.removeItem('b24studio_selectedPage');
      if (activeBookId) {
        localStorage.removeItem(getScopedSelectedPageStorageKey(activeAccountId, activeBookId));
      }
    }
  }, [selectedPage, activeBookId, activeAccountId]);
  const [editorText, setEditorText] = useState<string>('');
  const [styleOptions, setStyleOptions] = useState<{ 
    version_1: string; style_1_name: string;
    version_2: string; style_2_name: string;
    version_3: string; style_3_name: string;
  } | null>(null);
  const [isGeneratingStyleOptions, setIsGeneratingStyleOptions] = useState<boolean>(false);
  const [structureOptions, setStructureOptions] = useState<{ 
    version_1: string;
    version_2: string;
    version_3: string;
  } | null>(null);
  const [isGeneratingStructureOptions, setIsGeneratingStructureOptions] = useState<boolean>(false);
  const [isUsingAISyntax, setIsUsingAISyntax] = useState<boolean>(false);
  const [titlePageTargetAudience, setTitlePageTargetAudience] = useState<string>('');
  const [titlePageOptions, setTitlePageOptions] = useState<{ variante: 'A' | 'B' | 'C'; untertitel: string; verlagszeile: string }[] | null>(null);
  const [isGeneratingTitleOptions, setIsGeneratingTitleOptions] = useState<boolean>(false);
  const [isExplorerCollapsed, setIsExplorerCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('b24studio_left_collapsed');
    return saved === 'true';
  });
  const [editingChapterTitle, setEditingChapterTitle] = useState<string | null>(null);
  const [editingPageFocus, setEditingPageFocus] = useState<{ pageNum: number; text: string } | null>(null);
  const [bulkChapterTitle, setBulkChapterTitle] = useState<string>('');
  const [dragStart, setDragStart] = useState<{ x: number; y: number; shiftX: number; shiftY: number }>({ x: 0, y: 0, shiftX: 0, shiftY: 0 });
  const [isHoveringEmblem, setIsHoveringEmblem] = useState<boolean>(false);
  const [ideaTab, setIdeaTab] = useState<'text' | 'sources'>('text');
  const [isFetchingSources, setIsFetchingSources] = useState<boolean>(false);
  const [planningProgress, setPlanningProgress] = useState<{percent: number, message: string} | null>(null);

  const handleFetchSources = async () => {
    if (!activeBookId || !activeBook?.sourceUrls) return;
    setIsFetchingSources(true);
    try {
      const { fetchAndExtractText } = await import('./utils/WebScraper');
      const urls = activeBook.sourceUrls.split('\n').map(u => u.trim()).filter(Boolean);
      const isGroq = selectedModel.startsWith('groq-') || selectedModel.includes('llama');
      const maxChars = isGroq ? 5000 : 25000;
      const text = await fetchAndExtractText(urls, maxChars);
      setBooks(prev => prev.map(b => {
        if (b.id === activeBookId) {
          return { ...b, extractedSourceText: text };
        }
        return b;
      }));
      alert(`Erfolgreich ausgelesen! ${text.length} Zeichen Text aus ${urls.length} Quellen extrahiert.`);
    } catch (err: any) {
      console.error(err);
      alert('Fehler beim Auslesen: ' + (err.message || err));
    } finally {
      setIsFetchingSources(false);
    }
  };

  // Title Page dragging / editing states
  const [draggingItem, setDraggingItem] = useState<'emblem' | 'title' | 'subtitle' | 'author' | 'publisher' | string | null>(null);
  const [hoveredField, setHoveredField] = useState<'title' | 'subtitle' | 'author' | 'publisher' | string | null>(null);



  const [editingField, setEditingField] = useState<'title' | 'subtitle' | 'author' | 'publisher' | string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [activeCoverEditField, setActiveCoverEditField] = useState<'title' | 'subtitle' | 'author' | 'publisher' | null>(null);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translationProgress, setTranslationProgress] = useState<string>('');
  const [showTranslationWarning, setShowTranslationWarning] = useState<boolean>(false);
  const [activeStyleEditNum, setActiveStyleEditNum] = useState<number | null>(null);
  const [showImageInsertModal, setShowImageInsertModal] = useState<boolean>(false);


  // Multi-selection states for pages grid
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [lastClickedPage, setLastClickedPage] = useState<number | null>(null);

  // Keep selectedPages in sync when selectedPage is changed externally
  useEffect(() => {
    setEditingChapterTitle(null);
    if (typeof selectedPage !== 'number') {
      setSelectedPages([]);
      setLastClickedPage(null);
    } else if (!selectedPages.includes(selectedPage) && selectedPages.length <= 1) {
      setSelectedPages([selectedPage]);
      setLastClickedPage(selectedPage);
    }
  }, [selectedPage]);

  // Handle page selection, supporting Shift-click for range selection
  const handlePageClick = (pageNum: number, e: React.MouseEvent) => {
    if (e.shiftKey && lastClickedPage !== null) {
      const start = Math.min(lastClickedPage, pageNum);
      const end = Math.max(lastClickedPage, pageNum);
      const range: number[] = [];
      for (let i = start; i <= end; i++) {
        range.push(i);
      }
      setSelectedPages(range);
      setSelectedPage(pageNum);
    } else {
      setSelectedPages([pageNum]);
      setSelectedPage(pageNum);
      setLastClickedPage(pageNum);
    }
  };

  // Custom confirm dialog (replaces browser's native confirm())
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    onConfirm: () => void;
    onCancel?: () => void;
  } | null>(null);

  const showConfirm = (opts: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    onConfirm: () => void;
    onCancel?: () => void;
  }) => {
    setConfirmDialog(opts);
  };

  const alert = (message: string) => {
    showConfirm({
      title: 'Hinweis',
      message: String(message),
      confirmLabel: 'Ok',
      cancelLabel: 'none',
      onConfirm: () => {}
    });
  };

  // Print preview overflow detection
  const previewContentRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState<boolean>(false);

  // Check if content overflows the live preview page
  useEffect(() => {
    const el = previewContentRef.current;
    if (el) {
      setIsOverflowing(el.scrollHeight > el.clientHeight + 3);
    } else {
      setIsOverflowing(false);
    }
  }, [
    (activeBook?.pagesText || {})[(selectedPage || 0) as any],
    selectedPage,
    activeBook?.fontSize,
    activeBook?.fontFamily,
    activeBook?.pageSize,
    activeBook?.customWidth,
    activeBook?.customHeight,
    activeBook?.paragraphStyle,
    activeBook?.pagesParagraphStyle?.[(selectedPage || 0) as any]
  ]);

  // Sync theme
  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark-theme' : 'light-theme';
    localStorage.setItem(KEYS.theme, theme);
  }, [theme]);

  // Sync accounts list
  useEffect(() => {
    localStorage.setItem(KEYS.accounts, JSON.stringify(accounts));
  }, [accounts]);

  // Sync active account selection
  useEffect(() => {
    localStorage.setItem(KEYS.activeAccount, activeAccountId);
    const savedBooks = localStorage.getItem(KEYS.library(activeAccountId));
    if (savedBooks) {
      const parsed = JSON.parse(savedBooks) as Book[];
      // Reset any stuck 'generating' status from previous session
      const cleaned = parsed.map(b => ({
        ...b,
        pagesStatus: Object.fromEntries(
          Object.entries(b.pagesStatus || {}).map(([k, v]) => [k, v === 'generating' ? 'idle' : v])
        )
      }));
      setBooks(cleaned);
      if (parsed.length > 0) {
        const savedBookId = localStorage.getItem(getScopedActiveBookStorageKey(activeAccountId));
        const resolvedBookId = savedBookId && parsed.some(b => b.id == savedBookId) ? savedBookId : parsed[0].id;
        setActiveBookId(resolvedBookId);
      } else {
        setActiveBookId(null);
        setSelectedPage(null);
      }
    } else {
      setBooks([]);
      setActiveBookId(null);
      setSelectedPage(null);
    }
  }, [activeAccountId]);

  useEffect(() => {
    if (!activeBookId) {
      setSelectedPage(null);
      return;
    }

    const scopedPageKey = getScopedSelectedPageStorageKey(activeAccountId, activeBookId);
    const savedPage = localStorage.getItem(scopedPageKey) || localStorage.getItem('b24studio_selectedPage');
    if (!savedPage) {
      setSelectedPage('title');
      return;
    }

    try {
      setSelectedPage(JSON.parse(savedPage));
    } catch {
      setSelectedPage('title');
    }
  }, [activeBookId, activeAccountId]);

  // Reset title page states when active book changes
  useEffect(() => {
    setTitlePageOptions(null);
    setTitlePageTargetAudience('');
  }, [activeBookId]);

  // Guard selectedPage for TOC when outline shrinks
  useEffect(() => {
    if (activeBook && typeof selectedPage === 'string' && selectedPage.startsWith('toc_')) {
      const tocPages = getTOCPages();
      const pageIdx = parseInt(selectedPage.split('_')[1], 10);
      if (tocPages.length === 0) {
        setSelectedPage('title');
      } else if (pageIdx >= tocPages.length) {
        setSelectedPage(`toc_${tocPages.length - 1}`);
      }
    }
  }, [activeBook?.outline?.pages, selectedPage]);




  // Sync editor field
  useEffect(() => {
    if (activeBook && selectedPage !== null && typeof selectedPage === 'number') {
      setEditorText((activeBook.pagesText || {})[selectedPage] || '');
    }
  }, [selectedPage, activeBookId, activeBook?.pagesText]);

  // Handle manual edits
  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setEditorText(text);
    if (activeBookId && selectedPage !== null && typeof selectedPage === 'number') {
      setBooks(prev => prev.map(b => {
        if (b.id === activeBookId) {
          const hasOverflow = checkTextOverflow(text, b, selectedPage);
          return {
            ...b,
            pagesText: { ...(b.pagesText || {}), [selectedPage]: text },
            pagesOverflow: { ...(b.pagesOverflow || {}), [selectedPage]: hasOverflow }
          };
        }
        return b;
      }));
    }
  };

  // Switch config values on active book
  const handleRegeneratePageGraphic = async (pageNum: number) => {
    if (!activeBook || !activeBook.pagesText) return;
    const text = activeBook.pagesText[pageNum];
    if (!text) return;
    
    const curr = (activeBook.pagesGraphic || {})[pageNum] || {};
    updateActiveBookConfig('pagesGraphic', {
      ...(activeBook.pagesGraphic || {}),
      [pageNum]: { ...curr, isRegenerating: true }
    });

    try {
      const pagesSinceGraph = NecessityDetector.evaluateDensityPlacement(pageNum, activeBook.pagesGraphic);
      const promptGraph = NecessityDetector.buildAnalysisPrompt(text, pagesSinceGraph, activeBook.outline?.language || 'de');
      const rawJson = await getServiceInstance().evaluateRawJson(promptGraph, text);
      const newDecision = NecessityDetector.parseAndValidateDecision(rawJson, text);
      
      updateActiveBookConfig('pagesGraphic', {
        ...(activeBook.pagesGraphic || {}),
        [pageNum]: {
          ...newDecision,
          themeColor: curr.themeColor,
          fontFamily: curr.fontFamily,
          borderRadius: curr.borderRadius,
          preset: curr.preset,
          selectedVariant: curr.selectedVariant
        }
      });
    } catch (err) {
      console.error("Regen graphic error:", err);
      updateActiveBookConfig('pagesGraphic', {
        ...(activeBook.pagesGraphic || {}),
        [pageNum]: { ...curr, isRegenerating: false }
      });
    }
  };

  const updateActiveBookConfig = (field: keyof Book, value: any) => {
    if (!activeBookId) return;
    if (field === 'generateTOC' && value === false && (selectedPage === 'toc' || (typeof selectedPage === 'string' && selectedPage.startsWith('toc')))) {
      setSelectedPage('title');
    }
    setBooks(prev => prev.map(b => {
      if (b.id === activeBookId) {
        const updatedBook = { ...b, [field]: value };
        const updatedOverflows = recalculateBookOverflows(updatedBook);
        return {
          ...updatedBook,
          pagesOverflow: updatedOverflows
        };
      }
      return b;
    }));
  };

  const resetTitlePage = () => {
    if (!activeBookId || !activeBook) return;
    const updates: Partial<Book> = {
      title: undefined,
      subtitle: undefined,
      authorName: undefined,
      publisherLine: undefined,
      titlePageTitleSize: undefined,
      titlePageTitleX: undefined,
      titlePageTitleY: undefined,
      titlePageSubtitleSize: undefined,
      titlePageSubtitleX: undefined,
      titlePageSubtitleY: undefined,
      titlePageAuthorSize: undefined,
      titlePageAuthorX: undefined,
      titlePageAuthorY: undefined,
      titlePagePublisherSize: undefined,
      titlePagePublisherX: undefined,
      titlePagePublisherY: undefined,
      titlePageImageScale: undefined,
      titlePageImageX: undefined,
      titlePageImageY: undefined,
      titlePageLayout: undefined,
      titlePageEmblem: undefined,
      titlePageShowBorders: undefined,
      titlePageTitleFont: undefined,
      titlePageSubtitleFont: undefined,
      titlePageAuthorFont: undefined,
      titlePagePublisherFont: undefined,
      titlePageTitleAlign: undefined,
      titlePageSubtitleAlign: undefined,
      titlePageAuthorAlign: undefined,
      titlePagePublisherAlign: undefined,
      titlePageCustomTexts: undefined
    };

    setBooks(prev => prev.map(b => b.id === activeBookId ? { ...b, ...updates } as Book : b));
  };

  const addTitlePageCustomText = () => {
    if (!activeBookId || !activeBook) return;
    const newText: TitlePageCustomText = {
      id: `custom-text-${Date.now()}`,
      text: "Neuer Text",
      x: 0,
      y: 0,
      size: 16,
      font: 'playfair',
      align: 'center'
    };
    setBooks(prev => prev.map(b => b.id === activeBookId ? {
      ...b,
      titlePageCustomTexts: [...(b.titlePageCustomTexts || []), newText]
    } : b));
  };

  const updateTitlePageCustomText = (id: string, updates: Partial<TitlePageCustomText>) => {
    if (!activeBookId) return;
    setBooks(prev => prev.map(b => {
      if (b.id !== activeBookId) return b;
      const texts = b.titlePageCustomTexts || [];
      return {
        ...b,
        titlePageCustomTexts: texts.map(t => t.id === id ? { ...t, ...updates } : t)
      };
    }));
  };

  const deleteTitlePageCustomText = (id: string) => {
    if (!activeBookId) return;
    setBooks(prev => prev.map(b => {
      if (b.id !== activeBookId) return b;
      return {
        ...b,
        titlePageCustomTexts: (b.titlePageCustomTexts || []).filter(t => t.id !== id)
      };
    }));
  };

  const handleSaveChapterTitle = (pageNum: number, newTitle: string) => {
    if (!activeBook || !activeBook.outline) return;
    const oldTitle = activeBook.outline.pages[pageNum - 1]?.chapter_title;
    const cleanTitle = newTitle.trim();
    if (!cleanTitle) return;
    const updatedPages = activeBook.outline.pages.map(p => {
      if (p.page_number === pageNum || (oldTitle && p.chapter_title === oldTitle)) {
        return { ...p, chapter_title: cleanTitle };
      }
      return p;
    });
    const updatedOutline = {
      ...activeBook.outline,
      pages: updatedPages
    };
    updateActiveBookConfig('outline', updatedOutline);
    setEditingChapterTitle(null);
  };

  const handleSavePageFocus = (pageNum: number, newFocus: string) => {
    if (!activeBook || !activeBook.outline) return;
    const cleanFocus = newFocus.trim();
    const updatedPages = activeBook.outline.pages.map(p => {
      if (p.page_number === pageNum) {
        return { ...p, focus: cleanFocus };
      }
      return p;
    });
    const updatedOutline = {
      ...activeBook.outline,
      pages: updatedPages
    };
    updateActiveBookConfig('outline', updatedOutline);
    setEditingPageFocus(null);
  };

  const handleApplyBulkChapterTitle = () => {
    if (!activeBook || !activeBook.outline || selectedPages.length === 0) return;
    if (!bulkChapterTitle.trim()) {
      alert("Bitte gib einen Kapitelnamen ein.");
      return;
    }
    const updatedPages = activeBook.outline.pages.map(p => {
      if (selectedPages.includes(p.page_number)) {
        return { ...p, chapter_title: bulkChapterTitle.trim() };
      }
      return p;
    });
    const updatedOutline = {
      ...activeBook.outline,
      pages: updatedPages
    };
    updateActiveBookConfig('outline', updatedOutline);
    setBulkChapterTitle('');
    alert(`Kapitelname für ${selectedPages.length} Seiten erfolgreich auf "${bulkChapterTitle.trim()}" geändert und zusammengeführt!`);
  };

  const applyRomanPreset = () => {
    if (!activeBookId) return;
    setBooks(prev => prev.map(b => {
      if (b.id === activeBookId) {
        const updatedBook: Book = {
          ...b,
          fontFamily: 'playfair',
          fontSize: 11,
          paragraphStyle: 'indent',
          alignment: 'justify',
          chapterOrnament: '❦'
        };
        const updatedOverflows = recalculateBookOverflows(updatedBook);
        return {
          ...updatedBook,
          pagesOverflow: updatedOverflows
        };
      }
      return b;
    }));
  };

  const applySachbuchPreset = () => {
    if (!activeBookId) return;
    setBooks(prev => prev.map(b => {
      if (b.id === activeBookId) {
        const updatedBook: Book = {
          ...b,
          fontFamily: 'inter',
          fontSize: 11,
          paragraphStyle: 'spacing',
          alignment: 'left',
          chapterOrnament: ''
        };
        const updatedOverflows = recalculateBookOverflows(updatedBook);
        return {
          ...updatedBook,
          pagesOverflow: updatedOverflows
        };
      }
      return b;
    }));
  };

  // Switch paragraph style for a specific page
  const updatePageParagraphStyle = (pageNum: number, style: 'indent' | 'spacing' | 'block') => {
    if (!activeBookId) return;
    setBooks(prev => prev.map(b => {
      if (b.id === activeBookId) {
        const updatedBook = {
          ...b,
          pagesParagraphStyle: {
            ...(b.pagesParagraphStyle || {}),
            [pageNum]: style
          }
        };
        const updatedOverflows = recalculateBookOverflows(updatedBook);
        return {
          ...updatedBook,
          pagesOverflow: updatedOverflows
        };
      }
      return b;
    }));
  };

  // Create Book
  const handleCreateBook = () => {
    const newBook: Book = {
      id: Date.now().toString(),
      title: 'Ohne Titel',
      subtitle: '',
      idea: '',
      language: 'de',
      targetPages: 15,
      writingStyle: 'Sachbuch / Informativ',
      fontFamily: 'times',
      fontSize: 11,
      pageSize: '6x9',
      customWidth: 6,
      customHeight: 9,
      paragraphStyle: 'indent',
      pagesParagraphStyle: {},
      alignment: 'justify',
      chapterOrnament: '',
      amazonDescription: '',
      kdpKeywords: [],
      kdpCategories: [],
      customGuidelines: '',
      outline: null,
      pagesText: {},
      pagesStatus: {},
      pagesError: {},
      showRunningHeader: true,
      autoChapterDropCaps: true,
      autoChapterGraphics: false,
      autoChapterRecto: false,
      chapterTopPadding: 0,
      sourceUrls: '',
      extractedSourceText: ''
    };
    setBooks(prev => [...prev, newBook]);
    setActiveBookId(newBook.id);
    setSelectedPage('title');
    setActiveTab('studio'); // automatically jump to editor studio
  };

  // Delete Book
  const handleDeleteBook = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirm({
      title: 'Buchprojekt löschen',
      message: 'Dieses Buchprojekt unwiderruflich löschen? Alle Inhalte gehen verloren.',
      confirmLabel: 'Löschen',
      danger: true,
      onConfirm: () => {
        setBooks(prev => prev.filter(b => b.id !== id));
        if (activeBookId === id) {
          setActiveBookId(null);
          setSelectedPage('title');
        }
      }
    });
    return;
  };

  // Copy/Duplicate Book
  const handleCopyBook = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const sourceBook = books.find(b => b.id === id);
    if (!sourceBook) return;

    const newBook: Book = {
      ...JSON.parse(JSON.stringify(sourceBook)),
      id: 'book_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      title: `${sourceBook.title} (Kopie)`,
      createdAt: new Date().toISOString()
    };

    setBooks(prev => {
      const updated = [newBook, ...prev];
      // Save updated list in local storage
      const activeAcc = activeAccountIdRef.current || 'default';
      localStorage.setItem(KEYS.library(activeAcc), JSON.stringify(updated));
      return updated;
    });

    if (currentUser) {
      saveBookToCloud(currentUser.uid, newBook).catch(err => console.error("Cloud save failed during copy:", err));
    }

    showConfirm({
      title: 'Projekt dupliziert',
      message: `Das Projekt "${sourceBook.title}" wurde erfolgreich als "${newBook.title}" dupliziert. Möchtest du direkt zu diesem neuen Projekt wechseln?`,
      confirmLabel: 'Zum neuen Projekt wechseln',
      cancelLabel: 'Hier bleiben',
      danger: false,
      onConfirm: () => {
        setActiveBookId(newBook.id);
        setSelectedPage('title');
        setActiveTab('studio');
      }
    });
  };

  // Create local user account
  const handleCreateAccount = () => {
    if (!newUsernameInput.trim()) return;
    const newAcc: Account = {
      id: Date.now().toString(),
      username: newUsernameInput.trim()
    };
    setAccounts(prev => [...prev, newAcc]);
    setActiveAccountId(newAcc.id);
    setNewUsernameInput('');
    setShowAccountModal(false);
  };

  // Delete account
  const handleDeleteAccount = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (accounts.length <= 1) {
      alert('Es muss mindestens ein Account vorhanden sein.');
      return;
    }
    showConfirm({
      title: 'Account löschen',
      message: 'Account und alle Bücher dieses Profils unwiderruflich löschen?',
      confirmLabel: 'Löschen',
      danger: true,
      onConfirm: () => {
        setAccounts(prev => prev.filter(a => a.id !== id));
        localStorage.removeItem(KEYS.library(id));
        if (activeAccountId === id) {
          setActiveAccountId(accounts.find(a => a.id !== id)?.id || 'default');
        }
      }
    });
    return;
  };


  // Build final guidelines string from book settings
  const getEffectiveGuidelines = (book: Book) => {
    let g = book.customGuidelines || '';
    if (book.noQuotes) {
      const noQuoteRule = 'ABSOLUTE REGEL: Verwende KEINERLEI Zitate, Blockquotes oder Zitat-Formatierungen (kein "> ...", keine Anführungszeichen-Absätze). Schreibe ausschließlich in Fließtext. Zitate sind in diesem Buch vollständig verboten.';
      g = g ? `${g}\n${noQuoteRule}` : noQuoteRule;
    } else {
      const quoteRule = 'Setze Zitate sehr sparsam ein (maximal ein Zitat pro Kapitel). Jedes Zitat MUSS folgendes Format haben – auf einer eigenen Zeile, eingeleitet mit "> ", dann das Zitat in Anführungszeichen, dann IMMER ein Gedankenstrich und der echte Autor-Name. Beispiele:\n> "Wissen ist Macht." — Francis Bacon\nEIN ZITAT OHNE AUTORENANGABE IST VERBOTEN. Format: > "[Zitat]" — [Vorname Nachname]';
      g = g ? `${g}\n${quoteRule}` : quoteRule;
    }
    if (book.extractedSourceText) {
      let safeSourceText = book.extractedSourceText;
      const isGroq = selectedModel.startsWith('groq-') || selectedModel.includes('llama');
      // Groq has a 6000 TPM limit (llama-3.1-8b-instant). 6000 chars is ~1500 tokens, very safe.
      const TOTAL_MAX_CHARS = isGroq ? 6000 : 80000;
      if (safeSourceText.length > TOTAL_MAX_CHARS) {
        safeSourceText = safeSourceText.substring(0, TOTAL_MAX_CHARS) + '\n\n... (Restliches Quellenmaterial aus Kapazitätsgründen (Token-Limit) gekürzt um System-Abstürze zu verhindern)';
      }

      const sourceRule = `[WEBSITE QUELLENMATERIAL]\nDas Folgende ist direktes Text-Quellenmaterial aus referenzierten Websites, welches du strikt als primäre Fakten- und Wissensgrundlage für das Buch nutzen musst. Ignoriere irrelevante Website-Navigation oder Werbung, die mitkopiert wurde:\n\n${safeSourceText}`;
      g = g ? `${g}\n\n${sourceRule}` : sourceRule;
    }
    return g;
  };

  const handleGenerateTitlePageOptions = async () => {
    if (!activeBook) return;
    if (!hasKeysForModel(selectedModel)) {
      const providerName = selectedModel.startsWith('gemini-') ? 'Google Gemini' : 'Groq';
      alert(`Bitte tragen Sie zuerst einen API Key für ${providerName} in den Einstellungen ein.`);
      openSettings();
      return;
    }

    setIsGeneratingTitleOptions(true);
    setTitlePageOptions(null);

    try {
      const service = getServiceInstance();
      const options = await service.generateTitlePageOptions(
        activeBook.title,
        activeBook.idea || '',
        titlePageTargetAudience,
        activeBook.language
      );
      setTitlePageOptions(options);
    } catch (err: any) {
      console.error(err);
      alert('Fehler bei der KI-Untertitel-Generierung: ' + (err.message || err));
    } finally {
      setIsGeneratingTitleOptions(false);
    }
  };

  // Plan book outline
  const handlePlanBook = async () => {
    if (!hasKeysForModel(selectedModel)) {
      const providerName = selectedModel.startsWith('gemini-') ? 'Google Gemini' : 'Groq';
      alert(`Bitte tragen Sie zuerst einen API Key für ${providerName} in den Einstellungen ein.`);
      openSettings();
      return;
    }
    if (!activeBook) return;

    const executePlanBook = async () => {
      setIsPlanning(true);
      setPlanningProgress({ percent: 0, message: 'Initialisiere Planung...' });
      setSelectedPage('title');

      let currentActiveBook = activeBook;

      // Auto-fetch sources if URLs exist
      if (currentActiveBook.sourceUrls && currentActiveBook.sourceUrls.trim()) {
        try {
          setIsFetchingSources(true);
          setPlanningProgress({ percent: 10, message: 'Websites werden eingelesen...' });
          const { fetchAndExtractText } = await import('./utils/WebScraper');
          const urls = currentActiveBook.sourceUrls.split('\n').map(u => u.trim()).filter(Boolean);
          const isGroq = selectedModel.startsWith('groq-') || selectedModel.includes('llama');
          const maxChars = isGroq ? 5000 : 25000;
          const text = await fetchAndExtractText(urls, maxChars);
          
          setBooks(prev => prev.map(b => {
            if (b.id === activeBookId) {
              return { ...b, extractedSourceText: text };
            }
            return b;
          }));
          
          currentActiveBook = { ...currentActiveBook, extractedSourceText: text };
        } catch (err) {
          console.error("Auto-fetch error", err);
        } finally {
          setIsFetchingSources(false);
        }
      }

      const originalOutline = currentActiveBook.outline;
      const originalPagesText = currentActiveBook.pagesText;
      const originalPagesStatus = currentActiveBook.pagesStatus;
      const originalPagesError = currentActiveBook.pagesError;

      setBooks(prev => prev.map(b => {
        if (b.id === activeBookId) {
          return {
            ...b,
            outlineBackup: originalOutline ? originalOutline.pages : undefined,
            fullOutlineBackup: originalOutline,
            pagesTextBackup: originalPagesText,
            pagesStatusBackup: originalPagesStatus,
            pagesErrorBackup: originalPagesError,
            outline: {
              title: currentActiveBook.title,
              subtitle: currentActiveBook.subtitle,
              language: currentActiveBook.language,
              target_pages: currentActiveBook.targetPages,
              pages: Array.from({ length: currentActiveBook.targetPages }).map((_, i) => ({
                page_number: i + 1,
                chapter_title: 'Wird geplant...',
                focus: 'Bitte warten...',
                key_points: []
              }))
            },
            pagesText: {},
            pagesStatus: {},
            pagesError: {}
          };
        }
        return b;
      }));

      setIsExplorerCollapsed(false);
      setExplorerTab('settings');

      try {
        const service = getServiceInstance();
        const generatedOutline = await service.generateOutline(
          currentActiveBook.title,
          currentActiveBook.subtitle,
          currentActiveBook.idea,
          currentActiveBook.language,
          currentActiveBook.targetPages,
          getEffectiveGuidelines(currentActiveBook),
          (percent, msg) => setPlanningProgress({ percent, message: msg }),
          (partialPages) => {
            setBooks(prev => prev.map(b => {
              if (b.id !== activeBookId) return b;
              const newPages = [...(b.outline?.pages || [])];
              partialPages.forEach(p => {
                if (p.page_number - 1 < newPages.length) {
                  newPages[p.page_number - 1] = p;
                }
              });
              return { ...b, outline: { ...b.outline!, pages: newPages } };
            }));
          }
        );

        const processedOutline = CmieOrchestrator.processOutline(generatedOutline, currentActiveBook.cmieConfig);
        const initialStatus: { [key: number]: 'idle' } = {};
        for (let i = 1; i <= processedOutline.target_pages; i++) {
          initialStatus[i] = 'idle';
        }

        setBooks(prev => prev.map(b => {
          if (b.id === activeBookId) {
            return {
              ...b,
              outline: processedOutline,
              pagesStatus: initialStatus
            };
          }
          return b;
        }));

        setSelectedPage(1);
        if (brainEnabled) {
          BrainService.learnFromOutline(activeAccountIdRef.current, currentActiveBook, processedOutline.target_pages);
          refreshBrain();
        }
        triggerPageWriting(generatedOutline, activeBook.id);
      } catch (err: any) {
        console.error(err);
        // Rollback backup on failure
        setBooks(prev => prev.map(b => {
          if (b.id === activeBookId) {
            return {
              ...b,
              outline: originalOutline,
              pagesText: originalPagesText,
              pagesStatus: originalPagesStatus,
              pagesError: originalPagesError,
              outlineBackup: undefined,
              fullOutlineBackup: undefined,
              pagesTextBackup: undefined,
              pagesStatusBackup: undefined,
              pagesErrorBackup: undefined
            };
          }
          return b;
        }));
        showConfirm({
          title: 'Fehler bei der Inhaltsplanung',
          message: (() => {
            const msg = err.message || String(err);
            if (msg.toLowerCase().includes('quota') || msg.includes('429') || msg.toLowerCase().includes('rate')) {
              return '⚠️ KI-Kontingent erschöpft (Rate Limit).\n\nBitte wechsle das KI-Modell unter PARAMETER → KI-Modell zu einem anderen Modell und versuche es erneut. Falls das Problem anhält, kurz warten (ca. 1 Minute).';
            }
            return 'Fehler bei der Inhaltsplanung: ' + msg;
          })(),
          confirmLabel: 'Ok',
          cancelLabel: 'none',
          onConfirm: () => {}
        });
      } finally {
        setIsPlanning(false);
        setPlanningProgress(null);
      }
    };

    const hasContent = activeBook.outline || Object.keys(activeBook.pagesText || {}).length > 0;
    if (hasContent) {
      showConfirm({
        title: 'Gliederung neu planen?',
        message: 'Achtung: Dies überschreibt deine aktuelle Gliederung und alle geschriebenen Seiteninhalte. Ein Backup wird automatisch angelegt, sodass du diese jederzeit wiederherstellen kannst. Möchtest du fortfahren?',
        confirmLabel: 'Ja, neu planen',
        cancelLabel: 'Abbrechen',
        onConfirm: () => {
          executePlanBook();
        }
      });
    } else {
      executePlanBook();
    }
  };

  const handleCondenseOutline = async () => {
    if (!activeBook || !activeBook.outline) return;
    if (!hasKeysForModel(selectedModel)) {
      const providerName = selectedModel.startsWith('gemini-') ? 'Google Gemini' : 'Groq';
      alert(`Bitte tragen Sie zuerst einen API Key für ${providerName} in den Einstellungen ein.`);
      openSettings();
      return;
    }

    const originalPages = activeBook.outline.pages;
    const originalCount = originalPages.length;

    setIsPlanning(true);
    try {
      const service = getServiceInstance();
      const condensedPages = await service.condenseOutline(
        activeBook.title,
        activeBook.subtitle || '',
        activeBook.idea,
        activeBook.language,
        originalPages
      );

      // ─── SAFETY NET: never reduce page count ───────────────────────────
      if (condensedPages.length < originalCount) {
        console.error(`Condense returned ${condensedPages.length} pages but original had ${originalCount}. Rejecting.`);
        alert(`Fehler: Die KI hat ${condensedPages.length} statt ${originalCount} Seiten zurückgegeben. Keine Änderung vorgenommen.`);
        return;
      }

      setBooks(prev => prev.map(b => {
        if (b.id === activeBookId && b.outline) {
          return {
            ...b,
            outlineBackup: originalPages, // ← save undo snapshot
            outline: {
              ...b.outline,
              pages: condensedPages
            }
          };
        }
        return b;
      }));

      showConfirm({
        title: 'Erfolg',
        message: `Inhaltsverzeichnis eingekürzt! (${originalCount} Seiten bleiben erhalten). Du kannst die Änderung über den Banner oben wiederherstellen.`,
        confirmLabel: 'Ok',
        cancelLabel: 'none',
        onConfirm: () => {}
      });
    } catch (err: any) {
      console.error(err);
      showConfirm({
        title: 'Fehler',
        message: 'Fehler beim Einkürzen der Gliederung: ' + (err.message || err),
        confirmLabel: 'Ok',
        cancelLabel: 'none',
        onConfirm: () => {}
      });
    } finally {
      setIsPlanning(false);
    }
  };

  const handleRegenerateChaptersFromContent = async () => {
    if (!activeBook || !activeBook.outline) return;
    if (!hasKeysForModel(selectedModel)) {
      const providerName = selectedModel.startsWith('gemini-') ? 'Google Gemini' : 'Groq';
      alert(`Bitte tragen Sie zuerst einen API Key für ${providerName} in den Einstellungen ein.`);
      openSettings();
      return;
    }

    const pagesWithText = Object.entries(activeBook.pagesText || {})
      .filter(([num, text]) => Number(num) > 0 && text.trim().length > 0);

    if (pagesWithText.length === 0) {
      alert('Es muss mindestens eine generierte Seite vorhanden sein, um das Inhaltsverzeichnis zu regenerieren.');
      return;
    }

    const originalPages = activeBook.outline.pages;

    setIsPlanning(true);
    try {
      const service = getServiceInstance();
      const updatedPages = await service.regenerateChaptersFromPages(
        activeBook.outline,
        activeBook.pagesText || {}
      );

      setBooks(prev => prev.map(b => {
        if (b.id === activeBookId && b.outline) {
          return {
            ...b,
            outlineBackup: originalPages,
            outline: {
              ...b.outline,
              pages: updatedPages
            }
          };
        }
        return b;
      }));

      showConfirm({
        title: 'Erfolg',
        message: 'Inhaltsverzeichnis erfolgreich basierend auf den geschriebenen Seiteninhalten regeneriert! Du kannst die Änderung über den Banner oben wiederherstellen.',
        confirmLabel: 'Ok',
        cancelLabel: 'none',
        onConfirm: () => {}
      });
    } catch (err: any) {
      console.error(err);
      showConfirm({
        title: 'Fehler',
        message: 'Fehler beim Regenerieren des Inhaltsverzeichnisses: ' + (err.message || err),
        confirmLabel: 'Ok',
        cancelLabel: 'none',
        onConfirm: () => {}
      });
    } finally {
      setIsPlanning(false);
    }
  };

  // One-click undo: restore the outline snapshot saved before last condense or plan
  const handleRestoreOutline = () => {
    if (!activeBook) return;
    const backup = activeBook.outlineBackup;
    const fullOutlineBackup = activeBook.fullOutlineBackup;
    const pagesTextBackup = activeBook.pagesTextBackup;
    const pagesStatusBackup = activeBook.pagesStatusBackup;
    const pagesErrorBackup = activeBook.pagesErrorBackup;

    if (!backup && !fullOutlineBackup) return;

    setBooks(prev => prev.map(b => {
      if (b.id === activeBookId) {
        let restoredOutline = b.outline;
        if (fullOutlineBackup !== undefined) {
          restoredOutline = fullOutlineBackup;
        } else if (backup) {
          restoredOutline = b.outline ? { ...b.outline, pages: backup } : null;
        }

        return {
          ...b,
          outline: restoredOutline,
          pagesText: pagesTextBackup !== undefined ? pagesTextBackup : b.pagesText,
          pagesStatus: pagesStatusBackup !== undefined ? pagesStatusBackup : b.pagesStatus,
          pagesError: pagesErrorBackup !== undefined ? pagesErrorBackup : b.pagesError,
          outlineBackup: undefined,
          fullOutlineBackup: undefined,
          pagesTextBackup: undefined,
          pagesStatusBackup: undefined,
          pagesErrorBackup: undefined
        };
      }
      return b;
    }));

    const pagesCount = fullOutlineBackup ? fullOutlineBackup.pages.length : (backup ? backup.length : 0);
    showConfirm({
      title: 'Wiederhergestellt',
      message: `Gliederung und Seiteninhalte wurden erfolgreich auf den vorherigen Stand zurückgesetzt (${pagesCount} Seiten).`,
      confirmLabel: 'Ok',
      cancelLabel: 'none',
      onConfirm: () => {}
    });
  };

  // Emergency recovery: rebuild a full-length outline from pagesText keys
  // (Used when condense accidentally shrunk the page list before backup existed)
  const handleRecoverOutlineFromPages = () => {
    if (!activeBook || !activeBook.outline) return;
    const existingPageNums = Object.keys(activeBook.pagesText || {}).map(Number).filter(n => n > 0).sort((a, b) => a - b);
    if (existingPageNums.length === 0) { alert('Keine Seiteninhalte gefunden.'); return; }

    const currentPages = activeBook.outline.pages;
    // Distribute current chapter titles proportionally over all pages
    const totalCurrent = currentPages.length;
    const totalTarget = existingPageNums.length;
    const recovered = existingPageNums.map(pageNum => {
      const ratio = totalCurrent > 1 ? (pageNum - 1) / (totalTarget - 1) : 0;
      const srcIdx = Math.min(Math.round(ratio * (totalCurrent - 1)), totalCurrent - 1);
      const src = currentPages[srcIdx] || currentPages[0];
      return {
        page_number: pageNum,
        chapter_title: src.chapter_title,
        focus: src.focus,
        key_points: src.key_points
      };
    });

    setBooks(prev => prev.map(b => {
      if (b.id === activeBookId && b.outline) {
        return {
          ...b,
          outline: { ...b.outline, pages: recovered, target_pages: totalTarget }
        };
      }
      return b;
    }));
    alert(`Wiederhergestellt: ${totalTarget} Seiten aus vorhandenem Seiteninhalt.`);
  };

  const handleTranslateToEnglish = async () => {
    if (!activeBook || !activeBook.outline) return;
    if (!hasKeysForModel(selectedModel)) {
      const providerName = selectedModel.startsWith('gemini-') ? 'Google Gemini' : 'Groq';
      alert(`Bitte zuerst einen API Key für ${providerName} in den Einstellungen eintragen.`);
      openSettings();
      return;
    }

    setIsTranslating(true);
    setShowTranslationWarning(false);

    setTranslationProgress("Erstelle eine Kopie des Projekts...");
    
    // Always duplicate the book first to protect the original!
    const duplicateBook: Book = {
      ...JSON.parse(JSON.stringify(activeBook)),
      id: 'book_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      title: `${activeBook.title} (Kopie)`,
      createdAt: new Date().toISOString()
    };

    // Add duplicate to list and switch active book
    setBooks(prev => {
      const updated = [duplicateBook, ...prev];
      const activeAcc = activeAccountIdRef.current || 'default';
      localStorage.setItem(KEYS.library(activeAcc), JSON.stringify(updated));
      return updated;
    });
    setActiveBookId(duplicateBook.id);
    const bookToTranslate = duplicateBook;

    setTranslationProgress("Übersetze Buchtitel und Untertitel...");

    try {
      const ai = getServiceInstance();

      // 1. Translate title & subtitle
      const newTitle = bookToTranslate.title ? await ai.translateToEnglish(bookToTranslate.title) : '';
      const newSubtitle = bookToTranslate.subtitle ? await ai.translateToEnglish(bookToTranslate.subtitle) : '';

      // 2. Translate outline in batch (highly efficient, avoids rate limits)
      setTranslationProgress("Übersetze die Gliederung...");
      if (!bookToTranslate.outline) {
        throw new Error('Gliederung fehlt auf dem duplizierten Buch.');
      }
      const newPages = await ai.translateOutlinePages(bookToTranslate.outline.pages);

      // 3. Translate generated page texts page-by-page (with sequential throttle delay to prevent overloads)
      const newPagesText: { [key: number]: string } = {};
      const pagesWithText = Object.keys(bookToTranslate.pagesText || {}).map(Number).sort((a, b) => a - b);
      const totalTextPages = pagesWithText.length;

      for (let i = 0; i < totalTextPages; i++) {
        const pageNum = pagesWithText[i];
        setTranslationProgress(`Übersetze Buchseite ${i + 1} von ${totalTextPages}...`);
        
        if (i > 0) {
          const isGroq = !selectedModel.startsWith('gemini-');
          const delayMs = isGroq ? 2500 : 4500;
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }

        const originalText = bookToTranslate.pagesText?.[pageNum] || '';
        if (originalText.trim()) {
          const translatedText = await ai.translateToEnglish(originalText);
          newPagesText[pageNum] = translatedText;
        } else {
          newPagesText[pageNum] = '';
        }
      }

      // Update state with translated book
      setBooks(prev => {
        const updated = prev.map(b => {
          if (b.id === bookToTranslate.id) {
            const nextB = {
              ...b,
              title: newTitle,
              subtitle: newSubtitle,
              language: 'en',
              outline: {
                ...b.outline!,
                title: newTitle,
                subtitle: newSubtitle,
                language: 'en',
                pages: newPages
              },
              pagesText: newPagesText
            };
            return nextB;
          }
          return b;
        });

        // Save updated list in local storage
        const activeAcc = activeAccountIdRef.current || 'default';
        localStorage.setItem(KEYS.library(activeAcc), JSON.stringify(updated));

        // Sync translated book to cloud
        const activeItem = updated.find(b => b.id === bookToTranslate.id);
        if (currentUser && activeItem) {
          saveBookToCloud(currentUser.uid, activeItem).catch(err => console.error("Cloud save failed during translation:", err));
        }

        return updated;
      });

      alert("Buch erfolgreich ins Englische übersetzt!");
    } catch (err: any) {
      console.error(err);
      alert("Fehler bei der Übersetzung: " + (err.message || err));
    } finally {
      setIsTranslating(false);
      setTranslationProgress('');
    }
  };


  // Emergency: extend an incomplete outline with the missing pages
  const handleExtendOutline = async () => {
    if (!hasKeysForModel(selectedModel)) {
      const providerName = selectedModel.startsWith('gemini-') ? 'Google Gemini' : 'Groq';
      alert(`Bitte zuerst einen API Key für ${providerName} in den Einstellungen eintragen.`);
      openSettings();
      return;
    }
    if (!activeBook || !activeBook.outline) {
      alert('Kein Buch oder keine Gliederung vorhanden.');
      return;
    }
    const existingPages = activeBook.outline.pages.length;
    const targetTotal = activeBook.targetPages;
    if (existingPages >= targetTotal) {
      alert(`Die Gliederung ist bereits vollständig (${existingPages} von ${targetTotal} Seiten).`);
      return;
    }

    const bookIdToExtend = activeBookId;
    const snapshotOutline = activeBook.outline;

    const doExtend = async () => {
      setIsPlanning(true);
      try {
        const service = getServiceInstance();
        const CHUNK_SIZE = 25;
        let currentExistingPages = [...snapshotOutline.pages];

        for (let start = existingPages + 1; start <= targetTotal; start += CHUNK_SIZE) {
          const end = Math.min(start + CHUNK_SIZE - 1, targetTotal);
          const existingContext = currentExistingPages.slice(-3)
            .map(p => `Seite ${p.page_number}: ${p.chapter_title} - ${p.focus}`)
            .join('\n');

          const chunkPages = await service.generateOutlineChunk(
            activeBook.title,
            activeBook.subtitle || '',
            activeBook.idea,
            activeBook.language,
            targetTotal,
            start,
            end,
            existingContext,
            getEffectiveGuidelines(activeBook)
          );

          currentExistingPages = [...currentExistingPages, ...chunkPages];

          // Push chunk immediately into state so pages appear live
          const newStatus: { [key: number]: 'idle' } = {};
          chunkPages.forEach(p => { newStatus[p.page_number] = 'idle'; });

          setBooks(prev => prev.map(b => {
            if (b.id === bookIdToExtend) {
              const existingOutline = b.outline!;
              return {
                ...b,
                outline: {
                  ...existingOutline,
                  target_pages: targetTotal,
                  pages: [...existingOutline.pages, ...chunkPages]
                },
                pagesStatus: { ...(b.pagesStatus || {}), ...newStatus },
                pagesError: { ...(b.pagesError || {}) }
              };
            }
            return b;
          }));

          if (end < targetTotal) {
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        }
      } catch (err: any) {
        console.error(err);
        alert('Fehler beim Erweitern der Gliederung: ' + (err.message || err));
      } finally {
        setIsPlanning(false);
      }
    };

    showConfirm({
      title: 'Gliederung erweitern',
      message: `Die Gliederung hat nur ${existingPages} von ${targetTotal} Seiten. Die fehlenden ${targetTotal - existingPages} Seiten (${existingPages + 1}–${targetTotal}) werden jetzt ergänzt. Bestehende Seiten bleiben unverändert.`,
      confirmLabel: 'Ergänzen',
      cancelLabel: 'Abbrechen',
      onConfirm: doExtend,
      onCancel: () => {}
    });
  };

  // Sequential page writing hook
  const triggerPageWriting = async (
    currentOutline: BookOutline,
    targetBookId: string
  ) => {
    if (!hasKeysForModel(selectedModel)) {
      const providerName = selectedModel.startsWith('gemini-') ? 'Google Gemini' : 'Groq';
      alert(`Bitte tragen Sie zuerst einen API Key für ${providerName} in den Einstellungen ein.`);
      openSettings();
      return;
    }
    setIsGenerating(true);
    cancelGenerationRef.current = false;
    const service = getServiceInstance();

    const sortedPages = [...currentOutline.pages].sort((a, b) => Number(a.page_number) - Number(b.page_number));
    
    const initialBook = booksRef.current.find(b => b.id === targetBookId);
    if (!initialBook) {
      setIsGenerating(false);
      return;
    }

    const initialPagesStatus = initialBook.pagesStatus || {};
    const initialPagesText = initialBook.pagesText || {};

    const pageTexts: { [key: number]: string } = { ...initialPagesText };
    const pageStatuses: { [key: number]: string } = { ...initialPagesStatus };

    const runQueue = async () => {
      let lastChapter = '';
      
      for (const page of sortedPages) {
        if (cancelGenerationRef.current) break;

        const pageNum = Number(page.page_number);
        if (pageStatuses[pageNum] === 'completed' || pageStatuses[pageNum] === 'failed') {
          continue;
        }

        try {
          // Delay to reduce rate limits (only if it's not the very first page of a chapter, or minimal delay)
          if (lastChapter === page.chapter_title) {
            const isGroq = !selectedModel.startsWith('gemini-');
            const delayMs = isGroq ? 8500 : 4500;
            await new Promise(resolve => setTimeout(resolve, delayMs));
          } else if (lastChapter !== '') {
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
          lastChapter = page.chapter_title;
          
          if (cancelGenerationRef.current) break;

                // Focus remains on the user's chosen page, just update UI state to generating
                setBooks(prev => prev.map(b => {
                  if (b.id === targetBookId) {
                    return {
                      ...b,
                      pagesStatus: { ...(b.pagesStatus || {}), [pageNum]: 'generating' }
                    };
                  }
                  return b;
                }));

                const currentBook = booksRef.current.find(b => b.id === targetBookId);
                if (!currentBook) throw new Error('Buch wurde gelöscht.');

                const cmieEnrichment = buildBrainEnrichedPrompt(
                  currentBook,
                  currentBook.pagesReprompt?.[pageNum]
                );

                const startTime = Date.now();
                const rawText = await service.generatePage(
                  currentOutline,
                  pageNum,
                  pageTexts,
                  currentBook.writingStyle || 'Sachbuch / Informativ',
                  currentBook.pageSize,
                  currentBook.fontSize,
                  false,
                  getEffectiveGuidelines(currentBook),
                  (currentBook.autoChapterGraphics !== false) && !(currentBook.pagesGraphicDisabled?.[pageNum]),
                  cmieEnrichment
                );
                let text = cleanPageText(rawText);

                // Global diversity checks
                if (pageNum === 1 || pageNum === 2) {
                  const divCheck = await GilService.checkGlobalDiversity(text, targetBookId);
                  if (divCheck.similarity > 0.6) {
                    console.warn(`Global Diversity warning: Page ${pageNum} similarity is ${Math.round(divCheck.similarity * 100)}% with Book ${divCheck.matchesBookId}`);
                    GilService.logLayoutWarning(
                      targetBookId,
                      pageNum,
                      currentBook.pageSize,
                      'GlobalDiversity',
                      `Similarity of ${Math.round(divCheck.similarity * 100)}% with other book opening.`
                    );
                  }
                }

                // Overflow retry
                const hasOverflow = checkTextOverflow(text, currentBook, pageNum);
                if (hasOverflow) {
                  GilService.logLayoutWarning(
                    targetBookId,
                    pageNum,
                    currentBook.pageSize,
                    'PageContent',
                    'Text overflow in page generation. Retrying shorter.'
                  );
                  try {
                    const retryRawText = await service.generatePage(
                      currentOutline,
                      pageNum,
                      pageTexts,
                      currentBook.writingStyle || 'Sachbuch / Informativ',
                      currentBook.pageSize,
                      currentBook.fontSize,
                      true,
                      getEffectiveGuidelines(currentBook),
                      currentBook.autoChapterGraphics || false,
                      cmieEnrichment
                    );
                    const retryText = cleanPageText(retryRawText);
                    if (checkTextOverflow(retryText, currentBook, pageNum)) {
                      text = truncateToFit(retryText, currentBook, pageNum);
                    } else {
                      text = retryText;
                    }
                  } catch (retryErr) {
                    text = truncateToFit(text, currentBook, pageNum);
                  }
                }

                const finalOverflow = checkTextOverflow(text, currentBook, pageNum);
                pageTexts[pageNum] = text;

                if (cancelGenerationRef.current) {
                  setBooks(prev => prev.map(b => {
                    if (b.id === targetBookId) {
                      return {
                        ...b,
                        pagesStatus: { ...(b.pagesStatus || {}), [pageNum]: 'idle' }
                      };
                    }
                    return b;
                  }));
                  break;
                }

                // Cmie checks
                const cmieRes = await CmieOrchestrator.inspectAndStorePage(
                  pageNum,
                  page.chapter_title,
                  text,
                  currentBook.extractedSourceText,
                  currentBook.cmieStore,
                  currentBook.cmieStatus,
                  currentBook.cmieGlossary,
                  currentBook.cmieConfig,
                  (page as any).chapter_scope
                );

                // Auto graphics decision
                let graphicDecisionSingle: GraphicDecision = { grafik_sinnvoll: false };
                if ((currentBook.autoChapterGraphics !== false) && !(currentBook.pagesGraphicDisabled?.[pageNum])) {
                  try {
                    const pagesSinceGraph = NecessityDetector.evaluateDensityPlacement(pageNum, currentBook.pagesGraphic);
                    const promptGraph = NecessityDetector.buildAnalysisPrompt(text, pagesSinceGraph, currentOutline?.language || 'de');
                    const rawJsonGraph = await service.evaluateRawJson(promptGraph, text);
                    graphicDecisionSingle = NecessityDetector.parseAndValidateDecision(rawJsonGraph, text);
                  } catch(eG) { console.warn("AGVE Error:", eG); }
                }

                // Update book pages state
                setBooks(prev => prev.map(b => {
                  if (b.id === targetBookId) {
                    return {
                      ...b,
                      pagesText: { ...(b.pagesText || {}), [pageNum]: text },
                      pagesStatus: { ...(b.pagesStatus || {}), [pageNum]: 'completed' },
                      pagesGenerationTime: { ...(b.pagesGenerationTime || {}), [pageNum]: Date.now() - startTime },
                      pagesError: cmieRes.warningMessage ? { ...(b.pagesError || {}), [pageNum]: cmieRes.warningMessage } : (b.pagesError || {}),
                      pagesReprompt: cmieRes.repromptInstruction ? { ...(b.pagesReprompt || {}), [pageNum]: cmieRes.repromptInstruction } : (b.pagesReprompt || {}),
                      pagesOverflow: { ...(b.pagesOverflow || {}), [pageNum]: finalOverflow },
                      cmieStore: { ...(b.cmieStore || {}), [pageNum]: cmieRes.memory },
                      cmieStatus: { ...(b.cmieStatus || {}), [pageNum]: cmieRes.pageStatus },
                      cmieGlossary: cmieRes.updatedGlossary,
                      pagesGraphic: graphicDecisionSingle.grafik_sinnvoll ? { ...(b.pagesGraphic || {}), [pageNum]: graphicDecisionSingle } : (b.pagesGraphic || {})
                    };
                  }
                  return b;
                }));

                pageStatuses[pageNum] = 'completed';

                await runBrainPageLearn(currentBook, pageNum, cmieRes.memory, cmieRes.pageStatus, text);

                // Log to GIL System
                const tokensCount = Math.ceil(text.length / 4);
                void GilService.logGeneration(
                  targetBookId,
                  pageNum,
                  currentBook.marketNiche || 'Allgemein',
                  currentBook.writingStyle || 'Sachbuch / Informativ',
                  text,
                  hasOverflow ? 1 : 0,
                  tokensCount,
                  finalOverflow,
                  hasKeysForModel(selectedModel),
                  service
                ).then(() => {
                  setGilRefreshKey(prev => prev + 1);
                });

                setSelectedPage(pageNum);
            } catch (err: any) {
              console.error(`Page ${pageNum} error:`, err);
              if (pageStatuses[pageNum] !== 'completed') {
                setBooks(prev => prev.map(b => {
                  if (b.id === targetBookId) {
                    return {
                      ...b,
                      pagesStatus: { ...(b.pagesStatus || {}), [pageNum]: 'failed' },
                      pagesError: { ...(b.pagesError || {}), [pageNum]: err.message || 'API Fehler' }
                    };
                  }
                  return b;
                }));
              }
            }
      }
    };

    await runQueue();
    setIsGenerating(false);
  };

  // Retry generating single page
  const handleRetryPage = async (pageNum: number) => {
    if (!hasKeysForModel(selectedModel)) {
      const providerName = selectedModel.startsWith('gemini-') ? 'Google Gemini' : 'Groq';
      alert(`Bitte tragen Sie zuerst einen API Key für ${providerName} in den Einstellungen ein.`);
      openSettings();
      return;
    }
    const currentBook = booksRef.current.find(b => b.id === activeBookId);
    if (!outline || !currentBook || !activeBookId) return;

    setBooks(prev => prev.map(b => {
      if (b.id === activeBookId) {
        const nextErr = { ...(b.pagesError || {}) };
        delete nextErr[pageNum];
        return {
          ...b,
          pagesStatus: { ...(b.pagesStatus || {}), [pageNum]: 'generating' },
          pagesError: nextErr
        };
      }
      return b;
    }));

    try {
      const service = getServiceInstance();
      const cmieEnrichmentBulk = buildBrainEnrichedPrompt(
        currentBook,
        currentBook.pagesReprompt?.[pageNum]
      );
      const startTime = Date.now();
      let rawText = await service.generatePage(
        outline,
        pageNum,
        currentBook.pagesText || {},
        currentBook.writingStyle,
        currentBook.pageSize,
        currentBook.fontSize,
        false,
        getEffectiveGuidelines(currentBook),
        (currentBook.autoChapterGraphics !== false) && !(currentBook.pagesGraphicDisabled?.[pageNum]),
        cmieEnrichmentBulk
      );
      let text = cleanPageText(rawText);

      // Check overflow and retry/truncate if needed
      const hasOverflow = checkTextOverflow(text, currentBook, pageNum);
      if (hasOverflow) {
        console.log(`Page ${pageNum} overflows. Retrying with shorter generation...`);
        LayoutFixDB.logWarning(currentBook.pageSize || '6x9', 'chapter_page', 'Text overflow in page generation. Retrying shorter.');
        try {
          const retryRawText = await service.generatePage(
            outline,
            pageNum,
            currentBook.pagesText || {},
            currentBook.writingStyle,
            currentBook.pageSize,
            currentBook.fontSize,
            true, // shorterRetry = true
            getEffectiveGuidelines(currentBook),
            (currentBook.autoChapterGraphics !== false) && !(currentBook.pagesGraphicDisabled?.[pageNum]),
            cmieEnrichmentBulk
          );
          const retryText = cleanPageText(retryRawText);
          if (checkTextOverflow(retryText, currentBook, pageNum)) {
            console.log(`Page ${pageNum} STILL overflows. Applying truncateToFit fallback...`);
            LayoutFixDB.logWarning(currentBook.pageSize || '6x9', 'chapter_page', 'Text overflow even after retry. Truncating.');
            text = truncateToFit(retryText, currentBook, pageNum);
          } else {
            text = retryText;
          }
        } catch (retryErr) {
          console.warn(`Shorter retry failed for page ${pageNum}, using truncated version of initial text:`, retryErr);
          text = truncateToFit(text, currentBook, pageNum);
        }
      }

      const finalOverflow = checkTextOverflow(text, currentBook, pageNum);

      const bulkPageInfo = outline.pages.find(p => p.page_number === pageNum);
      const cmieResBulk = await CmieOrchestrator.inspectAndStorePage(
        pageNum,
        bulkPageInfo?.chapter_title || `Seite ${pageNum}`,
        text,
        currentBook.extractedSourceText,
        currentBook.cmieStore,
        currentBook.cmieStatus,
        currentBook.cmieGlossary,
        currentBook.cmieConfig,
        (bulkPageInfo as any)?.chapter_scope
      );

      let graphicDecisionBulk: GraphicDecision = { grafik_sinnvoll: false };
      if ((currentBook.autoChapterGraphics !== false) && !(currentBook.pagesGraphicDisabled?.[pageNum])) {
        try {
          const pagesSinceGraphBulk = NecessityDetector.evaluateDensityPlacement(pageNum, currentBook.pagesGraphic);
          const promptGraphBulk = NecessityDetector.buildAnalysisPrompt(text, pagesSinceGraphBulk, outline?.language || 'de');
          const rawJsonGraphBulk = await service.evaluateRawJson(promptGraphBulk, text);
          graphicDecisionBulk = NecessityDetector.parseAndValidateDecision(rawJsonGraphBulk, text);
        } catch(eGB) { console.warn("AGVE Bulk Error:", eGB); }
      }

      setBooks(prev => prev.map(b => {
        if (b.id === activeBookId) {
          return {
            ...b,
            pagesText: { ...(b.pagesText || {}), [pageNum]: text },
            pagesStatus: { ...(b.pagesStatus || {}), [pageNum]: 'completed' },
            pagesGenerationTime: { ...(b.pagesGenerationTime || {}), [pageNum]: Date.now() - startTime },
            pagesError: cmieResBulk.warningMessage ? { ...(b.pagesError || {}), [pageNum]: cmieResBulk.warningMessage } : (b.pagesError || {}),
            pagesReprompt: cmieResBulk.repromptInstruction ? { ...(b.pagesReprompt || {}), [pageNum]: cmieResBulk.repromptInstruction } : (b.pagesReprompt || {}),
            pagesOverflow: { ...(b.pagesOverflow || {}), [pageNum]: finalOverflow },
            cmieStore: { ...(b.cmieStore || {}), [pageNum]: cmieResBulk.memory },
            cmieStatus: { ...(b.cmieStatus || {}), [pageNum]: cmieResBulk.pageStatus },
            cmieGlossary: cmieResBulk.updatedGlossary,
            pagesGraphic: graphicDecisionBulk.grafik_sinnvoll ? { ...(b.pagesGraphic || {}), [pageNum]: graphicDecisionBulk } : (b.pagesGraphic || {})
          };
        }
        return b;
      }));
      await runBrainPageLearn(currentBook, pageNum, cmieResBulk.memory, cmieResBulk.pageStatus, text);
      setSelectedPage(pageNum);

      const pagesStatus = currentBook.pagesStatus || {};
      const nextPending = Object.keys(pagesStatus)
        .map(Number)
        .find(n => n > pageNum && pagesStatus[n] !== 'completed');

      if (nextPending) {
        triggerPageWriting(outline, activeBookId);
      }
    } catch (err: any) {
      console.error(err);
      setBooks(prev => prev.map(b => {
        if (b.id === activeBookId) {
          return {
            ...b,
            pagesStatus: { ...(b.pagesStatus || {}), [pageNum]: 'failed' },
            pagesError: { ...(b.pagesError || {}), [pageNum]: err.message || 'API error' }
          };
        }
        return b;
      }));
      alert(`Fehler bei der Einzelgenerierung von Seite ${pageNum}: ${err.message || err}`);
    }
  };

  // Lengthen single page text
  const handleLengthenPage = async (pageNum: number) => {
    if (!hasKeysForModel(selectedModel)) {
      const providerName = selectedModel.startsWith('gemini-') ? 'Google Gemini' : 'Groq';
      alert(`Bitte tragen Sie zuerst einen API Key für ${providerName} in den Einstellungen ein.`);
      openSettings();
      return;
    }
    const currentBook = booksRef.current.find(b => b.id === activeBookId);
    if (!outline || !currentBook || !activeBookId) return;

    const currentText = (currentBook.pagesText || {})[pageNum] || '';

    setBooks(prev => prev.map(b => {
      if (b.id === activeBookId) {
        return {
          ...b,
          pagesStatus: { ...(b.pagesStatus || {}), [pageNum]: 'generating' }
        };
      }
      return b;
    }));

    try {
      const service = getServiceInstance();
      const rawText = await service.lengthenPage(
        outline,
        pageNum,
        currentText,
        currentBook.pagesText || {},
        currentBook.writingStyle,
        currentBook.pageSize,
        currentBook.fontSize
      );
      let text = cleanPageText(rawText);

      // Check overflow and truncate if needed
      const hasOverflow = checkTextOverflow(text, currentBook, pageNum);
      if (hasOverflow) {
        console.log(`Lengthened text overflows page ${pageNum}. Truncating to fit...`);
        LayoutFixDB.logWarning(currentBook.pageSize || '6x9', 'chapter_page', 'Overflow on user-triggered lengthening.');
        text = truncateToFit(text, currentBook, pageNum);
      }

      const finalOverflow = checkTextOverflow(text, currentBook, pageNum);

      setBooks(prev => prev.map(b => {
        if (b.id === activeBookId) {
          return {
            ...b,
            pagesText: { ...(b.pagesText || {}), [pageNum]: text },
            pagesStatus: { ...(b.pagesStatus || {}), [pageNum]: 'completed' },
            pagesOverflow: { ...(b.pagesOverflow || {}), [pageNum]: finalOverflow }
          };
        }
        return b;
      }));
      setSelectedPage(pageNum);
    } catch (err: any) {
      console.error(err);
      setBooks(prev => prev.map(b => {
        if (b.id === activeBookId) {
          return {
            ...b,
            pagesStatus: { ...(b.pagesStatus || {}), [pageNum]: 'completed' } // revert to completed on error
          };
        }
        return b;
      }));
      alert(`Fehler beim Verlängern der Seite ${pageNum}: ${err.message || err}`);
    }
  };

  // Generate three different style versions of the current page text
  const handleGenerateStyleOptions = async (pageNum: number) => {
    if (!hasKeysForModel(selectedModel)) {
      const providerName = selectedModel.startsWith('gemini-') ? 'Google Gemini' : 'Groq';
      alert(`Bitte tragen Sie zuerst einen API Key für ${providerName} in den Einstellungen ein.`);
      openSettings();
      return;
    }
    const currentBook = booksRef.current.find(b => b.id === activeBookId);
    if (!outline || !currentBook || !activeBookId) return;

    const currentText = (currentBook.pagesText || {})[pageNum] || '';
    if (!currentText.trim()) {
      alert('Die Seite muss Text enthalten, um stilistische Variationen zu generieren.');
      return;
    }

    setIsGeneratingStyleOptions(true);
    setStyleOptions(null);

    try {
      const service = getServiceInstance();
      const variations = await service.generateStyleVariations(
        outline,
        pageNum,
        currentText,
        currentBook.writingStyle,
        currentBook.pageSize,
        currentBook.fontSize
      );

      setStyleOptions({
        style_1_name: variations.style_1_name,
        version_1: cleanPageText(variations.version_1),
        style_2_name: variations.style_2_name,
        version_2: cleanPageText(variations.version_2),
        style_3_name: variations.style_3_name,
        version_3: cleanPageText(variations.version_3),
      });
    } catch (err: any) {
      console.error(err);
      alert(`Fehler beim Generieren der Stile für Seite ${pageNum}: ${err.message || err}`);
    } finally {
      setIsGeneratingStyleOptions(false);
    }
  };

  // Apply selected style option to the page text with overflow auto-truncation
  const handleApplyStyleOption = (text: string) => {
    if (!activeBookId || selectedPage === null || typeof selectedPage !== 'number') return;
    const currentBook = booksRef.current.find(b => b.id === activeBookId);
    if (!currentBook) return;

    let processedText = cleanPageText(text);

    // Safety overflow check and auto-truncate
    if (checkTextOverflow(processedText, currentBook, selectedPage)) {
      console.log(`Style variation overflows page ${selectedPage}. Truncating to fit...`);
      processedText = truncateToFit(processedText, currentBook, selectedPage);
    }

    const finalOverflow = checkTextOverflow(processedText, currentBook, selectedPage);

    setBooks(prev => prev.map(b => {
      if (b.id === activeBookId) {
        return {
          ...b,
          pagesText: { ...(b.pagesText || {}), [selectedPage]: processedText },
          pagesOverflow: { ...(b.pagesOverflow || {}), [selectedPage]: finalOverflow }
        };
      }
      return b;
    }));

    // Update local editor field state
    setEditorText(processedText);
    setStyleOptions(null); // close dialog
  };

  // Generate three different structural versions of the current page text instantly using local heuristics
  const handleGenerateStructureOptions = (pageNum: number) => {
    const currentBook = booksRef.current.find(b => b.id === activeBookId);
    if (!currentBook || activeBookId === null || pageNum === null) return;

    const currentText = (currentBook.pagesText || {})[pageNum] || '';
    if (!currentText.trim()) {
      alert('Die Seite muss Text enthalten, um strukturelle Variationen zu generieren.');
      return;
    }

    setStructureOptions(null);

    // Instant local transformation
    const localVariations = generateStructureVariationsLocal(currentText);

    setStructureOptions({
      version_1: cleanPageText(localVariations.version_1),
      version_2: cleanPageText(localVariations.version_2),
      version_3: cleanPageText(localVariations.version_3),
    });
    setIsUsingAISyntax(false);
  };

  // Generate three structural versions using AI (refinement fallback)
  const handleGenerateStructureOptionsAI = async () => {
    if (selectedPage === null || typeof selectedPage !== 'number') return;
    if (!hasKeysForModel(selectedModel)) {
      const providerName = selectedModel.startsWith('gemini-') ? 'Google Gemini' : 'Groq';
      alert(`Bitte tragen Sie zuerst einen API Key für ${providerName} in den Einstellungen ein.`);
      openSettings();
      return;
    }
    const currentBook = booksRef.current.find(b => b.id === activeBookId);
    if (!outline || !currentBook || !activeBookId) return;

    const currentText = (currentBook.pagesText || {})[selectedPage] || '';
    if (!currentText.trim()) return;

    setIsGeneratingStructureOptions(true);

    try {
      const service = getServiceInstance();
      const variations = await service.generateStructureVariations(
        outline,
        selectedPage,
        currentText,
        currentBook.pageSize,
        currentBook.fontSize
      );

      setStructureOptions({
        version_1: cleanPageText(variations.version_1),
        version_2: cleanPageText(variations.version_2),
        version_3: cleanPageText(variations.version_3),
      });
      setIsUsingAISyntax(true);
    } catch (err: any) {
      console.error(err);
      alert(`Fehler bei der KI-Strukturierung für Seite ${selectedPage}: ${err.message || err}`);
    } finally {
      setIsGeneratingStructureOptions(false);
    }
  };

  // Apply selected structure option to the page text with overflow auto-truncation
  const handleApplyStructureOption = (text: string) => {
    if (!activeBookId || selectedPage === null || typeof selectedPage !== 'number') return;
    const currentBook = booksRef.current.find(b => b.id === activeBookId);
    if (!currentBook) return;

    let processedText = cleanPageText(text);

    // Safety overflow check and auto-truncate
    if (checkTextOverflow(processedText, currentBook, selectedPage)) {
      console.log(`Structure variation overflows page ${selectedPage}. Truncating to fit...`);
      processedText = truncateToFit(processedText, currentBook, selectedPage);
    }

    const finalOverflow = checkTextOverflow(processedText, currentBook, selectedPage);

    setBooks(prev => prev.map(b => {
      if (b.id === activeBookId) {
        return {
          ...b,
          pagesText: { ...(b.pagesText || {}), [selectedPage]: processedText },
          pagesOverflow: { ...(b.pagesOverflow || {}), [selectedPage]: finalOverflow }
        };
      }
      return b;
    }));

    // Update local editor field state
    setEditorText(processedText);
    setStructureOptions(null); // close dialog
  };

  const [isInlineAILoading, setIsInlineAILoading] = useState<boolean>(false);

  const handleEditorAIAction = async (action: 'rephrase' | 'emotional' | 'shorten' | 'spellcheck' | 'humanize') => {
    if (selectedPage === null || typeof selectedPage !== 'number') return;
    if (!hasKeysForModel(selectedModel)) {
      const providerName = selectedModel.startsWith('gemini-') ? 'Google Gemini' : 'Groq';
      alert(`Bitte tragen Sie zuerst einen API Key für ${providerName} in den Einstellungen ein.`);
      openSettings();
      return;
    }
    const currentBook = booksRef.current.find(b => b.id === activeBookId);
    if (!currentBook || !activeBookId) return;

    // Get selection or entire text from textarea
    const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const hasSelection = start !== end;
    
    const textToProcess = hasSelection 
      ? editorText.substring(start, end) 
      : editorText;

    if (!textToProcess.trim()) {
      alert("Bitte markieren Sie Text oder geben Sie Text ein, um diese KI-Aktion auszuführen.");
      return;
    }

    setIsInlineAILoading(true);

    try {
      const service = getServiceInstance();
      let result = '';

      if (action === 'rephrase') {
        result = await service.rephraseText(textToProcess);
      } else if (action === 'emotional') {
        result = await service.makeTextEmotional(textToProcess);
      } else if (action === 'shorten') {
        result = await service.shortenText(textToProcess);
      } else if (action === 'spellcheck') {
        result = await service.spellcheckText(textToProcess);
      } else if (action === 'humanize') {
        result = await service.humanizeText(textToProcess);
      }

      let updatedText = '';
      if (hasSelection) {
        updatedText = editorText.substring(0, start) + result + editorText.substring(end);
      } else {
        updatedText = result;
      }

      // Check overflow for page
      if (checkTextOverflow(updatedText, currentBook, selectedPage)) {
        console.log(`AI edited text overflows page ${selectedPage}. Truncating to fit...`);
        updatedText = truncateToFit(updatedText, currentBook, selectedPage);
      }
      const finalOverflow = checkTextOverflow(updatedText, currentBook, selectedPage);

      setBooks(prev => prev.map(b => {
        if (b.id === activeBookId) {
          return {
            ...b,
            pagesText: { ...(b.pagesText || {}), [selectedPage]: updatedText },
            pagesOverflow: { ...(b.pagesOverflow || {}), [selectedPage]: finalOverflow }
          };
        }
        return b;
      }));
      setEditorText(updatedText);
    } catch (err: any) {
      console.error(err);
      alert(`Fehler bei der KI-Aktion: ${err.message || err}`);
    } finally {
      setIsInlineAILoading(false);
    }
  };

  const handleGenerateAmazonDescription = async () => {
    if (!activeBook) return;
    if (!hasKeysForModel(selectedModel)) {
      const providerName = selectedModel.startsWith('gemini-') ? 'Google Gemini' : 'Groq';
      alert(`Bitte tragen Sie zuerst einen API Key für ${providerName} in den Einstellungen ein.`);
      openSettings();
      return;
    }

    setIsGeneratingMarketing(true);
    try {
      const service = getServiceInstance();
      const htmlDesc = await service.generateAmazonDescription(
        activeBook.title,
        activeBook.subtitle,
        activeBook.idea,
        activeBook.language
      );
      updateActiveBookConfig('amazonDescription', htmlDesc);
    } catch (err: any) {
      console.error(err);
      alert("Fehler bei der KDP-Beschreibungsgenerierung: " + (err.message || err));
    } finally {
      setIsGeneratingMarketing(false);
    }
  };

  const handleGenerateKdpKeywords = async () => {
    if (!activeBook) return;
    if (!hasKeysForModel(selectedModel)) {
      const providerName = selectedModel.startsWith('gemini-') ? 'Google Gemini' : 'Groq';
      alert(`Bitte tragen Sie zuerst einen API Key für ${providerName} in den Einstellungen ein.`);
      openSettings();
      return;
    }

    setIsGeneratingMarketing(true);
    try {
      const service = getServiceInstance();
      const keywords = await service.generateKdpKeywords(
        activeBook.title,
        activeBook.subtitle,
        activeBook.idea,
        activeBook.language
      );
      updateActiveBookConfig('kdpKeywords', keywords);
    } catch (err: any) {
      console.error(err);
      alert("Fehler beim Generieren der KDP-Keywords: " + (err.message || err));
    } finally {
      setIsGeneratingMarketing(false);
    }
  };

  const handleGenerateKdpCategories = async () => {
    if (!activeBook) return;
    if (!hasKeysForModel(selectedModel)) {
      const providerName = selectedModel.startsWith('gemini-') ? 'Google Gemini' : 'Groq';
      alert(`Bitte tragen Sie zuerst einen API Key für ${providerName} in den Einstellungen ein.`);
      openSettings();
      return;
    }

    setIsGeneratingMarketing(true);
    try {
      const service = getServiceInstance();
      const categories = await service.generateKdpCategories(
        activeBook.title,
        activeBook.subtitle,
        activeBook.idea,
        activeBook.language
      );
      updateActiveBookConfig('kdpCategories', categories);
    } catch (err: any) {
      console.error(err);
      alert("Fehler beim Suchen der Kategorien: " + (err.message || err));
    } finally {
      setIsGeneratingMarketing(false);
    }
  };

  // Download compiled PDF
  const handleDownloadPdf = () => {
    const activeBook = booksRef.current.find(b => b.id === activeBookId);
    if (!activeBook || !activeBook.outline) return;
    try {
      const config: PdfConfig = {
        bookId: activeBook.id,
        title: activeBook.title,
        subtitle: activeBook.subtitle,
        hideTitlePage: activeBook.hideTitlePage,
        fontFamily: activeBook.fontFamily,
        fontSize: activeBook.fontSize,
        lineHeightMultiplier: 1.4,
        pageSize: activeBook.pageSize,
        customWidth: activeBook.customWidth,
        customHeight: activeBook.customHeight,
        paragraphStyle: activeBook.paragraphStyle || 'indent',
        pagesParagraphStyle: activeBook.pagesParagraphStyle || {},
        alignment: activeBook.alignment || 'justify',
        chapterOrnament: activeBook.chapterOrnament || '',
        showRunningHeader: activeBook.showRunningHeader !== false,
        showPageNumbers: activeBook.showPageNumbers !== false,
        showChapterTitles: activeBook.showChapterTitles !== false,
        pagesHideChapter: activeBook.pagesHideChapter || [],
        pagesInitial: activeBook.pagesInitial || [],
        titlePageEmblem: activeBook.titlePageEmblem || 'geometric',
        titlePageImage: activeBook.titlePageImage || '',
        publisherLine: activeBook.publisherLine !== undefined && activeBook.publisherLine !== '' ? activeBook.publisherLine : 'Book24 Studio',
        generateTOC: activeBook.generateTOC !== false,
        titlePageImageScale: activeBook.titlePageImageScale !== undefined ? activeBook.titlePageImageScale : 60,
        titlePageImageX: activeBook.titlePageImageX !== undefined ? activeBook.titlePageImageX : 0,
        titlePageImageY: activeBook.titlePageImageY !== undefined ? activeBook.titlePageImageY : 0,
        titlePageLayout: activeBook.titlePageLayout || 'centered',
        titlePageShowBorders: activeBook.titlePageShowBorders !== false,
        authorName: activeBook.authorName || '',
        tocLineSpacing: activeBook.tocLineSpacing !== undefined ? activeBook.tocLineSpacing : 18,
        tocFontFamily: activeBook.tocFontFamily || activeBook.fontFamily,
        tocFontSize: activeBook.tocFontSize !== undefined ? activeBook.tocFontSize : 10,
        titlePageTitleAlign: activeBook.titlePageTitleAlign || 'center',
        titlePageTitleSize: activeBook.titlePageTitleSize || 28,
        titlePageTitleFont: activeBook.titlePageTitleFont || 'playfair',
        titlePageTitleX: activeBook.titlePageTitleX || 0,
        titlePageTitleY: activeBook.titlePageTitleY || 0,
        titlePageTitleBold: activeBook.titlePageTitleBold === true,
        titlePageSubtitleAlign: activeBook.titlePageSubtitleAlign || 'center',
        titlePageSubtitleSize: activeBook.titlePageSubtitleSize || 12,
        titlePageSubtitleFont: activeBook.titlePageSubtitleFont || 'times',
        titlePageSubtitleX: activeBook.titlePageSubtitleX || 0,
        titlePageSubtitleY: activeBook.titlePageSubtitleY || 0,
        titlePageSubtitleBold: activeBook.titlePageSubtitleBold === true,
        titlePageAuthorAlign: activeBook.titlePageAuthorAlign || 'center',
        titlePageAuthorSize: activeBook.titlePageAuthorSize || 14,
        titlePageAuthorFont: activeBook.titlePageAuthorFont || 'times',
        titlePageAuthorX: activeBook.titlePageAuthorX || 0,
        titlePageAuthorY: activeBook.titlePageAuthorY || 0,
        titlePageAuthorBold: activeBook.titlePageAuthorBold === true,
        titlePagePublisherAlign: activeBook.titlePagePublisherAlign || 'center',
        titlePagePublisherSize: activeBook.titlePagePublisherSize || 10,
        titlePagePublisherFont: activeBook.titlePagePublisherFont || 'times',
        titlePagePublisherX: activeBook.titlePagePublisherX || 0,
        titlePagePublisherY: activeBook.titlePagePublisherY || 0,
        titlePagePublisherBold: activeBook.titlePagePublisherBold === true,
      };
      const pdfBlob = generateBookPdf(activeBook.outline, activeBook.pagesText || {}, config);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(activeBook.title || 'Unbenannt').replace(/\s+/g, '_')}_book24.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Fehler beim Kompilieren des PDFs: ' + err.message);
    }
  };

  // Calculations for live preview dimensions
  let previewWidth = 275;
  let previewHeight = 412;
  let insideMarginPx = 34;
  let outsideMarginPx = 23;
  let topMarginPx = 34;
  let bottomMarginPx = 34;
  let previewFontSize = 8;
  let previewScaleY = 0.57;
  let previewScaleX = 0.57;

  if (activeBook) {
    let wInches = 6;
    let hInches = 9;
    if (activeBook.pageSize === '5x8') { wInches = 5; hInches = 8; }
    else if (activeBook.pageSize === '5.5x8.5') { wInches = 5.5; hInches = 8.5; }
    else if (activeBook.pageSize === '6x9') { wInches = 6; hInches = 9; }
    else if (activeBook.pageSize === '8.5x11') { wInches = 8.5; hInches = 11; }
    else if (activeBook.pageSize === 'a4') { wInches = 8.27; hInches = 11.69; }
    else if (activeBook.pageSize === 'custom') {
      wInches = activeBook.customWidth || 6;
      hInches = activeBook.customHeight || 9;
    }
    // Calculate width dynamically based on the resizable right panel width
    previewWidth = Math.max(180, Math.min(600, rightWidth - 48));
    previewHeight = previewWidth * (hInches / wInches);

    // Calculate margins and fonts scaled exactly to PDF dimensions (72 pt per inch)
    previewScaleY = previewHeight / (hInches * 72);
    previewScaleX = previewWidth / (wInches * 72);

    topMarginPx = 54 * previewScaleY;
    bottomMarginPx = 54 * previewScaleY;
    insideMarginPx = 54 * previewScaleX;
    outsideMarginPx = 36 * previewScaleX;
    
    // Scale font size proportionally
    previewFontSize = activeBook.fontSize * previewScaleY;
  }

  // Completion metrics
  const completedPagesCount = activeBook ? Object.values(activeBook.pagesStatus || {}).filter(s => s === 'completed').length : 0;
  const totalPagesCount = activeBook?.outline ? activeBook.outline.pages.length : 0;
  const progressPercent = totalPagesCount > 0 ? Math.round((completedPagesCount / totalPagesCount) * 100) : 0;
  
  const outline = activeBook?.outline || null;

  const isFirstPageOfChapter = outline && selectedPage !== null && typeof selectedPage === 'number'
    ? (selectedPage === 1 || outline.pages[selectedPage - 1]?.chapter_title !== outline.pages[selectedPage - 2]?.chapter_title)
    : false;

  const getChapterPageNumbers = () => {
    if (!outline || !activeBook) return [];
    const chapters: { title: string; pageNumber: number; outlinePage: number }[] = [];
    const splitPageText = (text: string): string[] => {
      if (!text) return [''];
      return text.split(/\r?\n\s*-{3,}\s*(?:\r?\n|$)/);
    };
    let contentPageNumber = 1;
    for (let i = 1; i <= outline.pages.length; i++) {
      const pageInfo = outline.pages.find(p => p.page_number === i);
      const isFirstPageOfChapter = pageInfo ? outline.pages.find(p => p.chapter_title === pageInfo.chapter_title)?.page_number === i : false;
      if (isFirstPageOfChapter && pageInfo) {
        if (!chapters.some(c => c.title === pageInfo.chapter_title)) {
          chapters.push({ title: pageInfo.chapter_title, pageNumber: contentPageNumber, outlinePage: i });
        }
      }
      const pageText = (activeBook.pagesText || {})[i] || '';
      const parts = splitPageText(pageText);
      contentPageNumber += parts.length;
    }
    return chapters;
  };

  const toRoman = (num: number): string => {
    const romanMap: [number, string][] = [
      [1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'],
      [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'],
      [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']
    ];
    let result = '';
    let temp = num;
    for (const [val, char] of romanMap) {
      while (temp >= val) {
        result += char;
        temp -= val;
      }
    }
    return result;
  };

  const getTOCPages = () => {
    const chapters = getChapterPageNumbers();
    if (chapters.length === 0) return [];

    let hInches = 9;
    if (activeBook) {
      if (activeBook.pageSize === '5x8') { hInches = 8; }
      else if (activeBook.pageSize === '5.5x8.5') { hInches = 8.5; }
      else if (activeBook.pageSize === '6x9') { hInches = 9; }
      else if (activeBook.pageSize === '8.5x11') { hInches = 11; }
      else if (activeBook.pageSize === 'a4') { hInches = 11.69; }
      else if (activeBook.pageSize === 'custom') {
        hInches = activeBook.customHeight || 9;
      }
    }
    const pageHeightPt = hInches * 72;
    const topMargin = 54;
    const bottomMargin = 54;
    const lineSpacing = activeBook?.tocLineSpacing || 18;

    const pages: typeof chapters[] = [];
    let currentPageChapters: typeof chapters = [];
    let currentY = topMargin + 36;

    chapters.forEach((ch) => {
      if (currentY + lineSpacing > pageHeightPt - bottomMargin) {
        pages.push(currentPageChapters);
        currentPageChapters = [];
        currentY = topMargin + 36;
      }
      currentPageChapters.push(ch);
      currentY += lineSpacing;
    });

    if (currentPageChapters.length > 0) {
      pages.push(currentPageChapters);
    }
    return pages;
  };

  const renderTOCPreview = () => {
    const tocPages = getTOCPages();
    const pageIndex = typeof selectedPage === 'string' && selectedPage.includes('_')
      ? parseInt(selectedPage.split('_')[1], 10)
      : 0;

    const chaptersOnPage = tocPages[pageIndex] || [];

    const tocFontFamily = activeBook?.tocFontFamily || activeBook?.fontFamily || 'times';
    const tocLineSpacing = activeBook?.tocLineSpacing || 18;

    return (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        color: '#000000',
        backgroundColor: '#ffffff',
        boxSizing: 'border-box',
        zIndex: 5,
        paddingTop: `${topMarginPx}px`,
        paddingBottom: `${bottomMarginPx}px`,
        paddingLeft: `${(insideMarginPx + outsideMarginPx) / 2}px`,
        paddingRight: `${(insideMarginPx + outsideMarginPx) / 2}px`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: getCssFontFamily(tocFontFamily, 'times')
      }}>
        {/* Header Title */}
        <div style={{
          height: `${26 * previewScaleY}px`,
          marginTop: `${10 * previewScaleY}px`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          boxSizing: 'border-box'
        }}>
          <h3 style={{
            fontSize: `${14 * previewScaleY}px`,
            fontWeight: 'bold',
            textAlign: 'center',
            margin: 0,
            lineHeight: 1
          }}>
            {outline?.language === 'de' ? 'Inhaltsverzeichnis' : 'Table of Contents'}
          </h3>
        </div>

        {/* Chapters list */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          width: '100%'
        }}>
          {chaptersOnPage.map((ch, idx) => {
            const relativeFontSize = activeBook?.tocFontSize || 10;
            const uniformFontSizePx = relativeFontSize * previewScaleY;
            return (
              <div 
                key={idx} 
                onClick={() => setSelectedPage(ch.outlinePage)}
                title="Klicken, um zu diesem Kapitel zu springen"
                style={{ 
                  display: 'flex', 
                  alignItems: 'flex-end', 
                  justifyContent: 'space-between', 
                  width: '100%',
                  height: `${tocLineSpacing * previewScaleY}px`,
                  boxSizing: 'border-box',
                  lineHeight: 1,
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span style={{ 
                  fontWeight: 'bold', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flex: '0 1 auto', 
                  fontSize: `${uniformFontSizePx}px`,
                  color: '#000000',
                  marginRight: '4px'
                }}>
                  {ch.title}
                </span>
                <div style={{ 
                  flex: '1 1 auto', 
                  borderBottom: `${1 * previewScaleY}px dotted #000000`, 
                  margin: '0 4px', 
                  marginBottom: `${(3 * relativeFontSize / 10) * previewScaleY}px`
                }} />
                <span style={{ 
                  fontWeight: 'bold', 
                  flex: '0 0 auto',
                  fontSize: `${uniformFontSizePx}px`,
                  color: '#000000',
                  marginLeft: '4px'
                }}>
                  {ch.pageNumber}
                </span>
              </div>
            );
          })}
        </div>


      </div>
    );
  };

  // Handle global mouse dragging for cover image/emblem and text repositioning
  useEffect(() => {
    if (!draggingItem || !activeBook) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      if (draggingItem === 'emblem') {
        // Emblem moves in X and Y
        const newShiftX = Math.round(dragStart.shiftX + dx / previewScaleX);
        const newShiftY = Math.round(dragStart.shiftY + dy / previewScaleY);
        const clampedX = Math.max(-150, Math.min(150, newShiftX));
        const clampedY = Math.max(-250, Math.min(250, newShiftY));
        updateActiveBookConfig('titlePageImageX', clampedX);
        updateActiveBookConfig('titlePageImageY', clampedY);
      } else if (draggingItem === 'title') {
        // Title moves in X and Y
        const newShiftX = Math.round(dragStart.shiftX + dx / previewScaleX);
        const newShiftY = Math.round(dragStart.shiftY + dy / previewScaleY);
        const clampedX = Math.max(-200, Math.min(200, newShiftX));
        const clampedY = Math.max(-300, Math.min(300, newShiftY));
        updateActiveBookConfig('titlePageTitleX', clampedX);
        updateActiveBookConfig('titlePageTitleY', clampedY);
      } else if (draggingItem === 'subtitle') {
        // Subtitle moves in X and Y
        const newShiftX = Math.round(dragStart.shiftX + dx / previewScaleX);
        const newShiftY = Math.round(dragStart.shiftY + dy / previewScaleY);
        const clampedX = Math.max(-200, Math.min(200, newShiftX));
        const clampedY = Math.max(-300, Math.min(300, newShiftY));
        updateActiveBookConfig('titlePageSubtitleX', clampedX);
        updateActiveBookConfig('titlePageSubtitleY', clampedY);
      } else if (draggingItem === 'author' || draggingItem === 'publisher') {
        // Author and Publisher are always fixed at the bottom — no dragging
      } else if (typeof draggingItem === 'string' && draggingItem.startsWith('custom-text-')) {
        const newShiftX = Math.round(dragStart.shiftX + dx / previewScaleX);
        const newShiftY = Math.round(dragStart.shiftY + dy / previewScaleY);
        updateTitlePageCustomText(draggingItem, { x: newShiftX, y: newShiftY });
      }
    };
    
    const handleMouseUp = () => {
      setDraggingItem(null);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingItem, dragStart, activeBook, previewScaleX, previewScaleY]);

  const renderTitlePagePreview = () => {
    if (!activeBook) return null;
    if (activeBook.hideTitlePage) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: 'var(--bg-main)', color: 'var(--text-muted)' }}>
          Titelblatt ist deaktiviert
        </div>
      );
    }
    
    // Determine which emblem to draw
    const emblem = activeBook.titlePageEmblem || 'geometric';
    const publisherLine = activeBook.publisherLine !== undefined && activeBook.publisherLine !== '' ? activeBook.publisherLine : 'Book24 Studio';
    const layout = activeBook.titlePageLayout || 'centered';
    const scale = activeBook.titlePageImageScale !== undefined ? activeBook.titlePageImageScale : 60;
    const shiftX = activeBook.titlePageImageX !== undefined ? activeBook.titlePageImageX : 0;
    const shiftY = activeBook.titlePageImageY !== undefined ? activeBook.titlePageImageY : 0;

    const previewSize = scale * previewScaleX;
    const shiftXPx = shiftX * previewScaleX;
    const shiftYPx = shiftY * previewScaleY;

    return (
      <div 
        onClick={() => {
          const ta = document.querySelector('.editor-textarea') as HTMLTextAreaElement;
          if (ta) ta.focus();
        }}
        style={{
          width: '100%',
          height: '100%',
          color: '#000000',
          backgroundColor: '#ffffff',
          position: 'relative',
          boxSizing: 'border-box',
          overflow: 'hidden',
          cursor: 'text'
      }}>
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          zIndex: 50,
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              addTitlePageCustomText();
            }}
            style={{
              background: 'rgba(59, 130, 246, 0.9)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
            title="Neues Textfeld hinzufügen"
          >
            <Plus size={12} />
            + Text
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              resetTitlePage();
            }}
            style={{
              background: 'rgba(239, 68, 68, 0.9)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
            title="Titelseite komplett auf Standard zurücksetzen"
          >
            <Undo size={12} />
            Reset
          </button>
        </div>

        {/* Decorative double border */}
        {activeBook.titlePageShowBorders !== false && (
          <>
            <div style={{
              position: 'absolute',
              top: `${24 * previewScaleY}px`, bottom: `${24 * previewScaleY}px`, left: `${24 * previewScaleX}px`, right: `${24 * previewScaleX}px`,
              border: '1.5px solid #475569',
              pointerEvents: 'none',
              zIndex: 1
            }} />
            <div style={{
              position: 'absolute',
              top: `${28 * previewScaleY}px`, bottom: `${28 * previewScaleY}px`, left: `${28 * previewScaleX}px`, right: `${28 * previewScaleX}px`,
              border: '0.5px solid #475569',
              pointerEvents: 'none',
              zIndex: 1
            }} />
          </>
        )}

        {/* Title & Subtitle centered at top (layout depending) */}
        <div style={{ 
          position: 'absolute',
          left: `0px`,
          right: `0px`,
          top: `${(layout === 'top_centered' ? 0.14 : 0.25) * previewHeight}px`,
          transition: 'top 0.2s ease',
          zIndex: 2
        }}>
          {editingField === 'title' ? (
            <textarea
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={() => {
                updateActiveBookConfig('title', editingValue);
                setEditingField(null);
              }}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  updateActiveBookConfig('title', editingValue);
                  setEditingField(null);
                } else if (e.key === 'Escape') {
                  setEditingField(null);
                }
              }}
              autoFocus
              style={{
                fontSize: `${(activeBook.titlePageTitleSize || 28) * previewScaleY}px`,
                fontWeight: activeBook.titlePageTitleBold ? 'bold' : 'normal',
                fontFamily: getCssFontFamily(activeBook.titlePageTitleFont, 'playfair'),
                color: '#000000',
                lineHeight: '1.2',
                margin: '0 0 8px 0',
                padding: '4px',
                textAlign: activeBook.titlePageTitleAlign || 'center',
                transform: `translate(${(activeBook.titlePageTitleX || 0) * previewScaleX}px, ${(activeBook.titlePageTitleY || 0) * previewScaleY}px)`,
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                border: '1px dashed var(--primary)',
                borderRadius: '4px',
                width: '100%',
                resize: 'none',
                outline: 'none',
                boxSizing: 'border-box',
                whiteSpace: 'break-spaces'
              }}
            />
          ) : (
            <h1 
              onMouseEnter={() => setHoveredField('title')}
              onMouseLeave={() => setHoveredField(null)}
              onClick={() => setActiveCoverEditField('title')}
              onDoubleClick={() => {
                setEditingField('title');
                setEditingValue(activeBook.title || '');
              }}
              onMouseDown={(e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                setDraggingItem('title');
                setDragStart({
                  x: e.clientX,
                  y: e.clientY,
                  shiftX: activeBook.titlePageTitleX || 0,
                  shiftY: activeBook.titlePageTitleY || 0
                });
                setActiveCoverEditField('title');
              }}
              title="Doppelklick zum Bearbeiten / Ziehen zum Verschieben"
              style={{
                fontSize: `${(activeBook.titlePageTitleSize || 28) * previewScaleY}px`,
                fontWeight: activeBook.titlePageTitleBold ? 'bold' : 'normal',
                fontFamily: getCssFontFamily(activeBook.titlePageTitleFont, 'playfair'),
                color: '#000000',
                lineHeight: '1.2',
                margin: '0 0 8px 0',
                padding: '4px',
                textAlign: activeBook.titlePageTitleAlign || 'center',
                transform: `translate(${(activeBook.titlePageTitleX || 0) * previewScaleX}px, ${(activeBook.titlePageTitleY || 0) * previewScaleY}px)`,
                cursor: draggingItem === 'title' ? 'grabbing' : 'grab',
                border: (hoveredField === 'title' || activeCoverEditField === 'title') ? '1px dashed var(--primary)' : '1px dashed transparent',
                borderRadius: '4px',
                position: 'relative',
                whiteSpace: 'break-spaces'
              }}
            >
              {activeBook.title || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>[Titel]</span>}
              {(hoveredField === 'title' || activeCoverEditField === 'title') && (
                <>
                  <span style={{
                    position: 'absolute',
                    top: '-16px',
                    right: '0',
                    fontSize: '8px',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    padding: '2px 4px',
                    borderRadius: '3px',
                    pointerEvents: 'none',
                    zIndex: 10
                  }}>
                    ↔↕ Ziehen / Doppelklick
                  </span>
                  <div 
                    style={{
                      position: 'absolute',
                      bottom: '-24px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      backgroundColor: '#1e293b',
                      padding: '2px 4px',
                      borderRadius: '6px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      zIndex: 11,
                      border: '1px solid #475569',
                      pointerEvents: 'auto'
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); updateActiveBookConfig('titlePageTitleSize', Math.max(12, (activeBook.titlePageTitleSize || 28) - 2)); }}
                      style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '2px 6px', fontSize: '11px', fontWeight: 'bold' }}
                    >-</button>
                    <span style={{ color: '#94a3b8', fontSize: '9px', padding: '0 2px' }}>{activeBook.titlePageTitleSize || 28}pt</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateActiveBookConfig('titlePageTitleSize', Math.min(60, (activeBook.titlePageTitleSize || 28) + 2)); }}
                      style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '2px 6px', fontSize: '11px', fontWeight: 'bold' }}
                    >+</button>
                    <div style={{ width: '1px', height: '12px', backgroundColor: '#475569', margin: '0 4px' }} />
                    <button
                      onClick={(e) => { e.stopPropagation(); updateActiveBookConfig('titlePageTitleBold', !activeBook.titlePageTitleBold); }}
                      style={{ background: activeBook.titlePageTitleBold ? '#38bdf8' : 'none', border: 'none', color: activeBook.titlePageTitleBold ? '#0f172a' : '#ffffff', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center', borderRadius: '2px' }}
                      title="Fett"
                    ><Bold size={11} /></button>
                    <div style={{ width: '1px', height: '12px', backgroundColor: '#475569', margin: '0 4px' }} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingField('title');
                        setEditingValue(activeBook.title || '');
                      }}
                      style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center' }}
                      title="Titel bearbeiten"
                    ><Pencil size={11} /></button>
                    <div style={{ width: '1px', height: '12px', backgroundColor: '#475569', margin: '0 4px' }} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateActiveBookConfig('titlePageTitleSize', undefined);
                        updateActiveBookConfig('titlePageTitleX', undefined);
                        updateActiveBookConfig('titlePageTitleY', undefined);
                      }}
                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center' }}
                      title="Größe und Position zurücksetzen"
                    ><Undo size={11} /></button>
                  </div>
                </>
              )}
            </h1>
          )}

          {editingField === 'subtitle' ? (
            <textarea
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={() => {
                updateActiveBookConfig('subtitle', editingValue);
                setEditingField(null);
              }}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  updateActiveBookConfig('subtitle', editingValue);
                  setEditingField(null);
                } else if (e.key === 'Escape') {
                  setEditingField(null);
                }
              }}
              autoFocus
              placeholder="Untertitel eingeben..."
              style={{
                fontSize: `${(activeBook.titlePageSubtitleSize || 12) * previewScaleY}px`,
                fontStyle: 'italic',
                fontWeight: activeBook.titlePageSubtitleBold ? 'bold' : 'normal',
                color: '#475569',
                margin: '4px 0 0 0',
                padding: '4px',
                lineHeight: '1.3',
                textAlign: activeBook.titlePageSubtitleAlign || 'center',
                fontFamily: getCssFontFamily(activeBook.titlePageSubtitleFont, 'times'),
                transform: `translate(${(activeBook.titlePageSubtitleX || 0) * previewScaleX}px, ${(activeBook.titlePageSubtitleY || 0) * previewScaleY}px)`,
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                border: '1px dashed var(--primary)',
                borderRadius: '4px',
                width: '100%',
                resize: 'none',
                outline: 'none',
                boxSizing: 'border-box',
                whiteSpace: 'break-spaces'
              }}
            />
          ) : (
            <h2 
              onMouseEnter={() => setHoveredField('subtitle')}
              onMouseLeave={() => setHoveredField(null)}
              onClick={() => setActiveCoverEditField('subtitle')}
              onDoubleClick={() => {
                setEditingField('subtitle');
                setEditingValue(activeBook.subtitle || '');
              }}
              onMouseDown={(e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                setDraggingItem('subtitle');
                setDragStart({
                  x: e.clientX,
                  y: e.clientY,
                  shiftX: activeBook.titlePageSubtitleX || 0,
                  shiftY: activeBook.titlePageSubtitleY || 0
                });
                setActiveCoverEditField('subtitle');
              }}
              title="Doppelklick zum Bearbeiten / Ziehen zum Verschieben"
              style={{
                fontSize: `${(activeBook.titlePageSubtitleSize || 12) * previewScaleY}px`,
                fontStyle: 'italic',
                fontWeight: activeBook.titlePageSubtitleBold ? 'bold' : 'normal',
                color: activeBook.subtitle ? '#475569' : '#cbd5e1',
                margin: '4px 0 0 0',
                padding: '4px',
                lineHeight: '1.3',
                textAlign: activeBook.titlePageSubtitleAlign || 'center',
                fontFamily: getCssFontFamily(activeBook.titlePageSubtitleFont, 'times'),
                transform: `translate(${(activeBook.titlePageSubtitleX || 0) * previewScaleX}px, ${(activeBook.titlePageSubtitleY || 0) * previewScaleY}px)`,
                cursor: draggingItem === 'subtitle' ? 'grabbing' : 'grab',
                border: (hoveredField === 'subtitle' || activeCoverEditField === 'subtitle') ? '1px dashed var(--primary)' : '1px dashed transparent',
                borderRadius: '4px',
                position: 'relative',
                whiteSpace: 'break-spaces'
              }}
            >
              {activeBook.subtitle || '[Untertitel hinzufügen]'}
              {(hoveredField === 'subtitle' || activeCoverEditField === 'subtitle') && (
                <>
                  <span style={{
                    position: 'absolute',
                    top: '-16px',
                    right: '0',
                    fontSize: '8px',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    padding: '2px 4px',
                    borderRadius: '3px',
                    pointerEvents: 'none',
                    zIndex: 10
                  }}>
                    ↔↕ Ziehen / Doppelklick
                  </span>
                  <div 
                    style={{
                      position: 'absolute',
                      bottom: '-24px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      backgroundColor: '#1e293b',
                      padding: '2px 4px',
                      borderRadius: '6px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      zIndex: 11,
                      border: '1px solid #475569',
                      pointerEvents: 'auto'
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); updateActiveBookConfig('titlePageSubtitleSize', Math.max(8, (activeBook.titlePageSubtitleSize || 12) - 1)); }}
                      style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '2px 6px', fontSize: '11px', fontWeight: 'bold' }}
                    >-</button>
                    <span style={{ color: '#94a3b8', fontSize: '9px', padding: '0 2px' }}>{activeBook.titlePageSubtitleSize || 12}pt</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateActiveBookConfig('titlePageSubtitleSize', Math.min(36, (activeBook.titlePageSubtitleSize || 12) + 1)); }}
                      style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '2px 6px', fontSize: '11px', fontWeight: 'bold' }}
                    >+</button>
                    <div style={{ width: '1px', height: '12px', backgroundColor: '#475569', margin: '0 4px' }} />
                    <button
                      onClick={(e) => { e.stopPropagation(); updateActiveBookConfig('titlePageSubtitleBold', !activeBook.titlePageSubtitleBold); }}
                      style={{ background: activeBook.titlePageSubtitleBold ? '#38bdf8' : 'none', border: 'none', color: activeBook.titlePageSubtitleBold ? '#0f172a' : '#ffffff', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center', borderRadius: '2px' }}
                      title="Fett"
                    ><Bold size={11} /></button>
                    <div style={{ width: '1px', height: '12px', backgroundColor: '#475569', margin: '0 4px' }} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingField('subtitle');
                        setEditingValue(activeBook.subtitle || '');
                      }}
                      style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center' }}
                      title="Untertitel bearbeiten"
                    ><Pencil size={11} /></button>
                    <div style={{ width: '1px', height: '12px', backgroundColor: '#475569', margin: '0 4px' }} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateActiveBookConfig('titlePageSubtitleSize', undefined);
                        updateActiveBookConfig('titlePageSubtitleX', undefined);
                        updateActiveBookConfig('titlePageSubtitleY', undefined);
                      }}
                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center' }}
                      title="Größe und Position zurücksetzen"
                    ><Undo size={11} /></button>
                  </div>
                </>
              )}
            </h2>
          )}
        </div>

        {/* Emblem or Custom Image */}
        <div 
          onMouseEnter={() => setIsHoveringEmblem(true)}
          onMouseLeave={() => setIsHoveringEmblem(false)}
          style={{ 
            position: 'absolute',
            left: '50%',
            top: `${(layout === 'top_centered' ? 0.45 : 0.58) * previewHeight}px`,
            transform: `translate(-50%, -50%) translate(${shiftXPx}px, ${shiftYPx}px)`,
            transition: draggingItem === 'emblem' ? 'none' : 'transform 0.1s ease-out, top 0.2s ease',
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            cursor: draggingItem === 'emblem' ? 'grabbing' : 'grab',
            padding: '10px',
            border: isHoveringEmblem ? '1px dashed var(--primary)' : '1px dashed transparent',
            borderRadius: '4px',
            backgroundColor: isHoveringEmblem ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
            userSelect: 'none',
            zIndex: 3
          }}
          onMouseDown={(e) => {
            if (e.button !== 0) return; // Only left click
            e.preventDefault();
            setDraggingItem('emblem');
            setDragStart({
              x: e.clientX,
              y: e.clientY,
              shiftX: activeBook.titlePageImageX || 0,
              shiftY: activeBook.titlePageImageY || 0
            });
          }}
          onWheel={(e) => {
            e.preventDefault();
            const currentScale = activeBook.titlePageImageScale !== undefined ? activeBook.titlePageImageScale : 60;
            const delta = e.deltaY < 0 ? 5 : -5;
            const newScale = Math.max(20, Math.min(200, currentScale + delta));
            updateActiveBookConfig('titlePageImageScale', newScale);
          }}
        >
          {emblem === 'custom' && activeBook.titlePageImage ? (
            <img 
              src={activeBook.titlePageImage} 
              alt="Cover Emblem" 
              style={{ width: `${previewSize}px`, height: `${previewSize}px`, objectFit: 'contain', pointerEvents: 'none', backgroundColor: '#ffffff' }} 
            />
          ) : (
            <svg width={previewSize} height={previewSize} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
              {emblem === 'geometric' && (
                <>
                  <path d="M50 5L95 50L50 95L5 50L50 5Z" stroke="#475569" strokeWidth="2" />
                  <path d="M50 15L85 50L50 85L15 50L50 15Z" stroke="#475569" strokeWidth="0.5" />
                  <circle cx="50" cy="50" r="10" stroke="#475569" strokeWidth="1.5" />
                  <circle cx="50" cy="50" r="2" fill="#475569" />
                </>
              )}
              {emblem === 'floral' && (
                <>
                  <circle cx="50" cy="50" r="45" stroke="#475569" strokeWidth="1.5" />
                  <circle cx="38" cy="50" r="12" stroke="#475569" strokeWidth="1" />
                  <circle cx="62" cy="50" r="12" stroke="#475569" strokeWidth="1" />
                  <circle cx="50" cy="38" r="12" stroke="#475569" strokeWidth="1" />
                  <circle cx="50" cy="62" r="12" stroke="#475569" strokeWidth="1" />
                  <circle cx="50" cy="50" r="3" fill="#475569" />
                </>
              )}
              {emblem === 'star' && (
                <>
                  <line x1="50" y1="5" x2="50" y2="95" stroke="#475569" strokeWidth="1.5" />
                  <line x1="5" y1="50" x2="95" y2="50" stroke="#475569" strokeWidth="1.5" />
                  <line x1="18" y1="18" x2="82" y2="82" stroke="#475569" strokeWidth="1" />
                  <line x1="18" y1="82" x2="82" y2="18" stroke="#475569" strokeWidth="1" />
                  <polygon points="50,5 57,50 50,43" fill="#475569" />
                  <polygon points="50,5 43,50 50,43" fill="#cbd5e1" />
                  <polygon points="50,95 57,50 50,57" fill="#475569" />
                  <polygon points="50,95 43,50 50,57" fill="#cbd5e1" />
                  <polygon points="95,50 50,43 57,50" fill="#475569" />
                  <polygon points="95,50 50,57 57,50" fill="#cbd5e1" />
                  <polygon points="5,50 50,43 43,50" fill="#475569" />
                  <polygon points="5,50 50,57 43,50" fill="#cbd5e1" />
                </>
              )}
              {emblem === 'book' && (
                <>
                  <path d="M50,20 L15,25 L15,80 L50,75 L85,80 L85,25 Z" stroke="#475569" strokeWidth="2" strokeLinejoin="round" />
                  <line x1="50" y1="20" x2="50" y2="75" stroke="#475569" strokeWidth="2" />
                  <line x1="22" y1="35" x2="43" y2="33" stroke="#475569" strokeWidth="1" />
                  <line x1="22" y1="47" x2="43" y2="45" stroke="#475569" strokeWidth="1" />
                  <line x1="22" y1="59" x2="43" y2="57" stroke="#475569" strokeWidth="1" />
                  <line x1="57" y1="33" x2="78" y2="35" stroke="#475569" strokeWidth="1" />
                  <line x1="57" y1="45" x2="78" y2="47" stroke="#475569" strokeWidth="1" />
                  <line x1="57" y1="57" x2="78" y2="59" stroke="#475569" strokeWidth="1" />
                </>
              )}
            </svg>
          )}

          {/* Hover Controls */}
          {isHoveringEmblem && (
            <div 
              style={{
                position: 'absolute',
                bottom: '-28px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                backgroundColor: '#1e293b',
                padding: '2px 4px',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 10,
                border: '1px solid #475569',
                pointerEvents: 'auto'
              }}
              onMouseDown={(e) => e.stopPropagation()} // prevent drag when clicking controls
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const currentScale = activeBook.titlePageImageScale !== undefined ? activeBook.titlePageImageScale : 60;
                  updateActiveBookConfig('titlePageImageScale', Math.max(20, currentScale - 10));
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: 'bold'
                }}
                title="Verkleinern"
              >
                -
              </button>
              <span style={{ color: '#94a3b8', fontSize: '9px', padding: '0 2px' }}>
                {Math.round(scale)}pt
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const currentScale = activeBook.titlePageImageScale !== undefined ? activeBook.titlePageImageScale : 60;
                  updateActiveBookConfig('titlePageImageScale', Math.min(200, currentScale + 10));
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: 'bold'
                }}
                title="Vergrößern"
              >
                +
              </button>
              <div style={{ width: '1px', height: '12px', backgroundColor: '#475569', margin: '0 2px' }} />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateActiveBookConfig('titlePageImageX', 0);
                  updateActiveBookConfig('titlePageImageY', 0);
                  updateActiveBookConfig('titlePageImageScale', 60);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  fontSize: '9px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Zurücksetzen"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Author + Publisher — always stacked at bottom center */}
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: `${40 * previewScaleY}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: `${6 * previewScaleY}px`,
          zIndex: 2
        }}>
          {/* Author */}
          {editingField === 'author' ? (
            <input
              type="text"
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={() => {
                updateActiveBookConfig('authorName', editingValue);
                setEditingField(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateActiveBookConfig('authorName', editingValue);
                  setEditingField(null);
                } else if (e.key === 'Escape') {
                  setEditingField(null);
                }
              }}
              autoFocus
              style={{
                fontSize: `${(activeBook.titlePageAuthorSize || 14) * previewScaleY}px`,
                fontWeight: activeBook.titlePageAuthorBold ? 'bold' : 'normal',
                fontFamily: getCssFontFamily(activeBook.titlePageAuthorFont, 'times'),
                color: '#0f172a',
                lineHeight: '1.2',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                border: '1px dashed var(--primary)',
                borderRadius: '4px',
                textAlign: 'center',
                outline: 'none',
                boxSizing: 'border-box',
                padding: '2px 8px'
              }}
            />
          ) : (
            <div
              onDoubleClick={() => {
                setEditingField('author');
                setEditingValue(activeBook.authorName || '');
              }}
              onMouseEnter={() => setHoveredField('author')}
              onMouseLeave={() => setHoveredField(null)}
              title="Doppelklick zum Bearbeiten"
              style={{
                position: 'relative',
                fontSize: `${(activeBook.titlePageAuthorSize || 14) * previewScaleY}px`,
                fontWeight: activeBook.titlePageAuthorBold ? 'bold' : 'normal',
                fontFamily: getCssFontFamily(activeBook.titlePageAuthorFont, 'times'),
                color: '#0f172a',
                lineHeight: '1.2',
                cursor: 'text',
                padding: '2px 8px',
                border: (hoveredField === 'author' || activeCoverEditField === 'author') ? '1px dashed var(--primary)' : '1px dashed transparent',
                borderRadius: '4px'
              }}
            >
              {activeBook.authorName || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>[Autorenname]</span>}
              {(hoveredField === 'author' || activeCoverEditField === 'author') && (
                <>
                  <span style={{
                    position: 'absolute',
                    top: '-16px',
                    right: '0',
                    fontSize: '8px',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    padding: '2px 4px',
                    borderRadius: '3px',
                    pointerEvents: 'none',
                    zIndex: 10
                  }}>
                    ↔↕ Ziehen / Doppelklick
                  </span>
                  <div 
                    style={{
                      position: 'absolute',
                      bottom: '-24px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      backgroundColor: '#1e293b',
                      padding: '2px 4px',
                      borderRadius: '6px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      zIndex: 11,
                      border: '1px solid #475569',
                      pointerEvents: 'auto'
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); updateActiveBookConfig('titlePageAuthorSize', Math.max(8, (activeBook.titlePageAuthorSize || 14) - 1)); }}
                      style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '2px 6px', fontSize: '11px', fontWeight: 'bold' }}
                    >-</button>
                    <span style={{ color: '#94a3b8', fontSize: '9px', padding: '0 2px' }}>{activeBook.titlePageAuthorSize || 14}pt</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateActiveBookConfig('titlePageAuthorSize', Math.min(36, (activeBook.titlePageAuthorSize || 14) + 1)); }}
                      style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '2px 6px', fontSize: '11px', fontWeight: 'bold' }}
                    >+</button>
                    <div style={{ width: '1px', height: '12px', backgroundColor: '#475569', margin: '0 4px' }} />
                    <button
                      onClick={(e) => { e.stopPropagation(); updateActiveBookConfig('titlePageAuthorBold', !activeBook.titlePageAuthorBold); }}
                      style={{ background: activeBook.titlePageAuthorBold ? '#38bdf8' : 'none', border: 'none', color: activeBook.titlePageAuthorBold ? '#0f172a' : '#ffffff', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center', borderRadius: '2px' }}
                      title="Fett"
                    ><Bold size={11} /></button>
                    <div style={{ width: '1px', height: '12px', backgroundColor: '#475569', margin: '0 4px' }} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingField('author');
                        setEditingValue(activeBook.authorName || '');
                      }}
                      style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center' }}
                      title="Autor bearbeiten"
                    ><Pencil size={11} /></button>
                    <div style={{ width: '1px', height: '12px', backgroundColor: '#475569', margin: '0 4px' }} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateActiveBookConfig('titlePageAuthorSize', undefined);
                        updateActiveBookConfig('titlePageAuthorX', undefined);
                        updateActiveBookConfig('titlePageAuthorY', undefined);
                      }}
                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center' }}
                      title="Größe und Position zurücksetzen"
                    ><Undo size={11} /></button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Publisher */}
          {editingField === 'publisher' ? (
            <input
              type="text"
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={() => {
                updateActiveBookConfig('publisherLine', editingValue);
                setEditingField(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateActiveBookConfig('publisherLine', editingValue);
                  setEditingField(null);
                } else if (e.key === 'Escape') {
                  setEditingField(null);
                }
              }}
              autoFocus
              style={{
                fontSize: `${(activeBook.titlePagePublisherSize || 10) * previewScaleY}px`,
                fontWeight: activeBook.titlePagePublisherBold ? 'bold' : 'normal',
                fontFamily: getCssFontFamily(activeBook.titlePagePublisherFont, 'times'),
                color: '#475569',
                lineHeight: '1.2',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                border: '1px dashed var(--primary)',
                borderRadius: '4px',
                textAlign: 'center',
                outline: 'none',
                boxSizing: 'border-box',
                padding: '2px 8px'
              }}
            />
          ) : (
            <div
              onDoubleClick={() => {
                setEditingField('publisher');
                setEditingValue(activeBook.publisherLine || publisherLine);
              }}
              onMouseEnter={() => setHoveredField('publisher')}
              onMouseLeave={() => setHoveredField(null)}
              title="Doppelklick zum Bearbeiten"
              style={{
                position: 'relative',
                fontSize: `${(activeBook.titlePagePublisherSize || 10) * previewScaleY}px`,
                fontWeight: activeBook.titlePagePublisherBold ? 'bold' : 'normal',
                fontFamily: getCssFontFamily(activeBook.titlePagePublisherFont, 'times'),
                color: '#475569',
                lineHeight: '1.2',
                cursor: 'text',
                padding: '2px 8px',
                border: (hoveredField === 'publisher' || activeCoverEditField === 'publisher') ? '1px dashed var(--primary)' : '1px dashed transparent',
                borderRadius: '4px'
              }}
            >
              {activeBook.publisherLine || publisherLine || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>[Verlag]</span>}
              {(hoveredField === 'publisher' || activeCoverEditField === 'publisher') && (
                <>
                  <span style={{
                    position: 'absolute',
                    top: '-16px',
                    right: '0',
                    fontSize: '8px',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    padding: '2px 4px',
                    borderRadius: '3px',
                    pointerEvents: 'none',
                    zIndex: 10
                  }}>
                    ↔↕ Ziehen / Doppelklick
                  </span>
                  <div 
                    style={{
                      position: 'absolute',
                      bottom: '-24px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      backgroundColor: '#1e293b',
                      padding: '2px 4px',
                      borderRadius: '6px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      zIndex: 11,
                      border: '1px solid #475569',
                      pointerEvents: 'auto'
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); updateActiveBookConfig('titlePagePublisherSize', Math.max(8, (activeBook.titlePagePublisherSize || 10) - 1)); }}
                      style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '2px 6px', fontSize: '11px', fontWeight: 'bold' }}
                    >-</button>
                    <span style={{ color: '#94a3b8', fontSize: '9px', padding: '0 2px' }}>{activeBook.titlePagePublisherSize || 10}pt</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateActiveBookConfig('titlePagePublisherSize', Math.min(24, (activeBook.titlePagePublisherSize || 10) + 1)); }}
                      style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '2px 6px', fontSize: '11px', fontWeight: 'bold' }}
                    >+</button>
                    <div style={{ width: '1px', height: '12px', backgroundColor: '#475569', margin: '0 4px' }} />
                    <button
                      onClick={(e) => { e.stopPropagation(); updateActiveBookConfig('titlePagePublisherBold', !activeBook.titlePagePublisherBold); }}
                      style={{ background: activeBook.titlePagePublisherBold ? '#38bdf8' : 'none', border: 'none', color: activeBook.titlePagePublisherBold ? '#0f172a' : '#ffffff', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center', borderRadius: '2px' }}
                      title="Fett"
                    ><Bold size={11} /></button>
                    <div style={{ width: '1px', height: '12px', backgroundColor: '#475569', margin: '0 4px' }} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingField('publisher');
                        setEditingValue(activeBook.publisherLine || '');
                      }}
                      style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center' }}
                      title="Verlag bearbeiten"
                    ><Pencil size={11} /></button>
                    <div style={{ width: '1px', height: '12px', backgroundColor: '#475569', margin: '0 4px' }} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateActiveBookConfig('titlePagePublisherSize', undefined);
                        updateActiveBookConfig('titlePagePublisherX', undefined);
                        updateActiveBookConfig('titlePagePublisherY', undefined);
                      }}
                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center' }}
                      title="Größe und Position zurücksetzen"
                    ><Undo size={11} /></button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Custom Text Fields */}
        {activeBook.titlePageCustomTexts?.map((textObj) => (
          <div
            key={textObj.id}
            onMouseEnter={() => setHoveredField(textObj.id)}
            onMouseLeave={() => setHoveredField(null)}
            onMouseDown={(e) => {
              if (editingField === textObj.id) return;
              e.stopPropagation();
              e.preventDefault();
              setDraggingItem(textObj.id);
              setDragStart({ x: e.clientX, y: e.clientY, shiftX: textObj.x || 0, shiftY: textObj.y || 0 });
            }}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: `translate(calc(-50% + ${(textObj.x || 0) * previewScaleX}px), calc(-50% + ${(textObj.y || 0) * previewScaleY}px))`,
              textAlign: textObj.align,
              width: '80%',
              cursor: draggingItem === textObj.id ? 'grabbing' : 'grab',
              padding: '4px',
              border: hoveredField === textObj.id ? '1px dashed #94a3b8' : '1px dashed transparent',
              zIndex: 20
            }}
          >
            {editingField === textObj.id ? (
              <textarea
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={() => {
                  setEditingField(null);
                  updateTitlePageCustomText(textObj.id, { text: editingValue });
                }}
                autoFocus
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: '1px solid #3b82f6',
                  outline: 'none',
                  fontSize: `${(textObj.size || 16) * previewScaleY}px`,
                  fontFamily: getCssFontFamily(textObj.font, 'playfair'),
                  fontWeight: textObj.isBold ? 'bold' : 'normal',
                  textAlign: textObj.align,
                  color: '#000000',
                  resize: 'none',
                  overflow: 'hidden',
                  whiteSpace: 'break-spaces',
                  lineHeight: '1.2'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
              />
            ) : (
              <>
                <div style={{
                  fontSize: `${(textObj.size || 16) * previewScaleY}px`,
                  fontFamily: getCssFontFamily(textObj.font, 'playfair'),
                  fontWeight: textObj.isBold ? 'bold' : 'normal',
                  color: '#000000',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  lineHeight: '1.2'
                }}>
                  {(textObj.text || '').split('\n').map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < ((textObj.text || '').split('\n').length - 1) && <br />}
                    </span>
                  ))}
                </div>
                {hoveredField === textObj.id && (
                  <div style={{
                    position: 'absolute',
                    top: '-32px',
                    right: 0,
                    background: '#1e293b',
                    borderRadius: '4px',
                    padding: '4px',
                    display: 'flex',
                    gap: '4px',
                    zIndex: 30,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    alignItems: 'center'
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  >
                    <select
                      value={textObj.font}
                      onChange={(e) => updateTitlePageCustomText(textObj.id, { font: e.target.value as any })}
                      style={{ padding: '2px 4px', border: '1px solid #475569', borderRadius: '4px', fontSize: '10px', backgroundColor: '#0f172a', color: '#f1f5f9', outline: 'none', cursor: 'pointer' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="playfair">Playfair</option>
                      <option value="times">Times</option>
                      <option value="helvetica">Helvetica</option>
                      <option value="arial">Arial</option>
                      <option value="courier">Courier</option>
                      <option value="inter">Inter</option>
                    </select>

                    <button
                      onClick={(e) => { e.stopPropagation(); updateTitlePageCustomText(textObj.id, { isBold: !textObj.isBold }); }}
                      style={{ background: textObj.isBold ? '#38bdf8' : 'none', border: 'none', color: textObj.isBold ? '#0f172a' : '#ffffff', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center', borderRadius: '2px' }}
                      title="Fett"
                    ><Bold size={11} /></button>
                    
                    <div style={{ width: '1px', height: '14px', backgroundColor: '#475569', margin: '0 2px' }} />

                    <button
                      onClick={(e) => { e.stopPropagation(); updateTitlePageCustomText(textObj.id, { size: Math.max(8, (textObj.size || 16) - 1) }); }}
                      style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '2px 4px', fontSize: '12px', fontWeight: 'bold' }}
                    >-</button>
                    <span style={{ color: '#94a3b8', fontSize: '10px', minWidth: '24px', textAlign: 'center' }}>{textObj.size || 16}pt</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateTitlePageCustomText(textObj.id, { size: Math.min(100, (textObj.size || 16) + 1) }); }}
                      style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '2px 4px', fontSize: '12px', fontWeight: 'bold' }}
                    >+</button>

                    <div style={{ width: '1px', height: '14px', backgroundColor: '#475569', margin: '0 2px' }} />

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingField(textObj.id);
                        setEditingValue(textObj.text || '');
                      }}
                      style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center' }}
                      title="Text bearbeiten"
                    ><Pencil size={11} /></button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTitlePageCustomText(textObj.id);
                      }}
                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center' }}
                      title="Textfeld löschen"
                    ><Trash2 size={11} /></button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}

      </div>
    );
  };

  // parsePageLines and WorkbookBlock are now defined in the global scope above App

  const renderPartPreviewContent = (partText: string, partIndex: number) => {
    if (!activeBook || selectedPage === null) return null;
    if (!partText) {
      return (
        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
          [Textfeld leer]
        </span>
      );
    }

    const blocks = parsePageLines(partText.split('\n'));

    const updatePagePartBlocks = (blocksList: WorkbookBlock[]) => {
      if (typeof selectedPage !== 'number') return;
      const pageText = (activeBook.pagesText || {})[selectedPage] || '';
      const parts = pageText.split(/\r?\n\s*-{3,}\s*(?:\r?\n|$)/);
      parts[partIndex] = serializeBlocksToMarkdown(blocksList);
      const newPageText = parts.join('\n---\n');
      updateActiveBookConfig('pagesText', {
        ...(activeBook.pagesText || {}),
        [selectedPage]: newPageText
      });
    };

    const handleBlockTextChange = (path: number[], newText: string) => {
      const updatedBlocks = JSON.parse(JSON.stringify(blocks));
      let current = updatedBlocks;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]].children;
      }
      const targetBlock = current[path[path.length - 1]];
      if (!targetBlock) return;
      if (targetBlock.type === 'paragraph' || targetBlock.type === 'heading' || targetBlock.type === 'quote' || targetBlock.type === 'bullet' || targetBlock.type === 'checkbox') {
        targetBlock.text = newText;
      } else if (targetBlock.type === 'box') {
        targetBlock.title = newText;
      }
      updatePagePartBlocks(updatedBlocks);
    };

    const handleDeleteBlock = (path: number[]) => {
      const updatedBlocks = JSON.parse(JSON.stringify(blocks));
      let current = updatedBlocks;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]].children;
      }
      current.splice(path[path.length - 1], 1);
      updatePagePartBlocks(updatedBlocks);
    };

    const handleMoveImage = (sourcePath: number[], targetPath: number[], floatVal: 'none' | 'left' | 'right', insertBefore: boolean) => {
      const updatedBlocks = JSON.parse(JSON.stringify(blocks));
      
      // Get source parent and block
      let sourceParent = updatedBlocks;
      for (let i = 0; i < sourcePath.length - 1; i++) {
        sourceParent = sourceParent[sourcePath[i]].children;
      }
      const imageIndex = sourcePath[sourcePath.length - 1];
      const imageBlock = sourceParent[imageIndex];
      if (!imageBlock || (imageBlock.type !== 'image' && imageBlock.type !== 'custom_image')) return;
      
      // Update float
      imageBlock.float = floatVal;
      
      // Remove from source
      sourceParent.splice(imageIndex, 1);
      
      // Get target parent
      let targetParent = updatedBlocks;
      for (let i = 0; i < targetPath.length - 1; i++) {
        targetParent = targetParent[targetPath[i]].children;
      }
      
      let targetIndex = targetPath[targetPath.length - 1];
      const sameParent = sourcePath.slice(0, -1).join(',') === targetPath.slice(0, -1).join(',');
      if (sameParent && imageIndex < targetIndex) {
        targetIndex--;
      }
      
      if (insertBefore) {
        targetParent.splice(targetIndex, 0, imageBlock);
      } else {
        targetParent.splice(targetIndex, 0, imageBlock);
      }
      
      updatePagePartBlocks(updatedBlocks);
    };

    const pageParagraphStyle = (typeof selectedPage === 'number' && activeBook.pagesParagraphStyle?.[selectedPage])
      || activeBook.paragraphStyle
      || 'indent';

    const showInitialOnPage = typeof selectedPage === 'number' && (activeBook.pagesInitial || []).includes(selectedPage);
    let dropCapUsed = false;

    const renderInline = (str: string): React.ReactNode => {
      const parts: React.ReactNode[] = [];
      let currentIndex = 0;
      const boldRegex = /\*\*([^*]+)\*\*/g;
      let boldMatch;
      while ((boldMatch = boldRegex.exec(str)) !== null) {
        if (boldMatch.index > currentIndex) parts.push(str.substring(currentIndex, boldMatch.index));
        parts.push(<strong key={boldMatch.index}>{boldMatch[1]}</strong>);
        currentIndex = boldRegex.lastIndex;
      }
      if (currentIndex < str.length) parts.push(str.substring(currentIndex));
      return parts.length > 0 ? <>{parts}</> : <>{str}</>;
    };

    const getDragDropProps = (path: number[]) => ({
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const ratio = x / rect.width;
        if (ratio < 0.35) {
          (e.currentTarget as any).style.borderLeft = '3px dashed var(--primary)';
          (e.currentTarget as any).style.borderRight = 'none';
          (e.currentTarget as any).style.borderTop = 'none';
        } else if (ratio > 0.65) {
          (e.currentTarget as any).style.borderRight = '3px dashed var(--primary)';
          (e.currentTarget as any).style.borderLeft = 'none';
          (e.currentTarget as any).style.borderTop = 'none';
        } else {
          (e.currentTarget as any).style.borderTop = '3px dashed var(--primary)';
          (e.currentTarget as any).style.borderLeft = 'none';
          (e.currentTarget as any).style.borderRight = 'none';
        }
      },
      onDragLeave: (e: React.DragEvent) => {
        (e.currentTarget as any).style.borderLeft = 'none';
        (e.currentTarget as any).style.borderRight = 'none';
        (e.currentTarget as any).style.borderTop = 'none';
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        (e.currentTarget as any).style.borderLeft = 'none';
        (e.currentTarget as any).style.borderRight = 'none';
        (e.currentTarget as any).style.borderTop = 'none';
        
        const rawData = e.dataTransfer.getData('text/plain');
        if (!rawData) return;
        try {
          const { sourcePath } = JSON.parse(rawData);
          if (!sourcePath) return;
          
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const ratio = x / rect.width;
          let finalFloat: 'none' | 'left' | 'right' = 'none';
          let insertBefore = false;
          
          if (ratio < 0.35) {
            finalFloat = 'left';
          } else if (ratio > 0.65) {
            finalFloat = 'right';
          } else {
            finalFloat = 'none';
            insertBefore = true;
          }
          
          handleMoveImage(sourcePath, path, finalFloat, insertBefore);
        } catch (err) {
          console.error(err);
        }
      }
    });

    const handleMergeWithPrevious = (path: number[], currentText: string) => {
      const updatedBlocks = JSON.parse(JSON.stringify(blocks));
      let current = updatedBlocks;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]].children;
      }
      const index = path[path.length - 1];
      if (index > 0) {
        const prevBlock = current[index - 1];
        if (prevBlock.type === 'paragraph' || prevBlock.type === 'heading' || prevBlock.type === 'quote' || prevBlock.type === 'bullet') {
          const currentTextClean = currentText.replace(/\u200B/g, '').trim();
          const prevTextClean = prevBlock.text.replace(/\u200B/g, '').trim();
          prevBlock.text = prevTextClean + (prevTextClean && currentTextClean ? ' ' : '') + currentTextClean;
          if (!prevBlock.text) prevBlock.text = '\u200B';
          current.splice(index, 1);
          updatePagePartBlocks(updatedBlocks);
        }
      }
    };

    const handleMergeWithNext = (path: number[], currentText: string) => {
      const updatedBlocks = JSON.parse(JSON.stringify(blocks));
      let current = updatedBlocks;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]].children;
      }
      const index = path[path.length - 1];
      if (index < current.length - 1) {
        const nextBlock = current[index + 1];
        if (nextBlock.type === 'paragraph' || nextBlock.type === 'heading' || nextBlock.type === 'quote' || nextBlock.type === 'bullet') {
          const currentBlock = current[index];
          if (currentBlock.type === 'paragraph' || currentBlock.type === 'heading') {
            const currentTextClean = currentText.replace(/\u200B/g, '').trim();
            const nextTextClean = nextBlock.text.replace(/\u200B/g, '').trim();
            currentBlock.text = currentTextClean + (currentTextClean && nextTextClean ? ' ' : '') + nextTextClean;
            if (!currentBlock.text) currentBlock.text = '\u200B';
            current.splice(index + 1, 1);
            updatePagePartBlocks(updatedBlocks);
          }
        }
      }
    };

    const makeEditable = (path: number[]) => ({
      contentEditable: true,
      suppressContentEditableWarning: true,
      onBlur: (e: React.FocusEvent<any>) => {
        let text = e.currentTarget.innerText || '';
        if (text.trim() === '') {
           text = '\u200B';
        }
        handleBlockTextChange(path, text);
      },
      onKeyDown: (e: React.KeyboardEvent<any>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          e.currentTarget.blur();
        } else if (e.key === 'Backspace') {
          const selection = window.getSelection();
          if (selection && selection.isCollapsed && selection.anchorOffset === 0) {
            e.preventDefault();
            handleMergeWithPrevious(path, e.currentTarget.innerText);
          }
        } else if (e.key === 'Delete') {
          const selection = window.getSelection();
          if (selection && selection.isCollapsed && selection.anchorOffset === e.currentTarget.innerText.length) {
            e.preventDefault();
            handleMergeWithNext(path, e.currentTarget.innerText);
          }
        }
      }
    });

    const renderWbBlock = (block: WorkbookBlock, path: number[]): React.ReactNode => {
      const key = path.join('-');
      switch (block.type) {
        case 'pagebreak':
          return (
            <div key={key} className="group" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '12px 0', width: '100%', position: 'relative' }}>
              <div style={{ flex: 1, borderTop: '1px dashed #cbd5e1' }} />
              <span style={{ fontSize: '7px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Seitenumbruch (PDF)</span>
              <div style={{ flex: 1, borderTop: '1px dashed #cbd5e1' }} />
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); handleDeleteBlock(path); }}
                style={{ position: 'absolute', right: '0', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Umbruch entfernen"
              >
                <Trash2 size={12} />
              </button>
            </div>
          );

        case 'ornament':
          return (
            <div key={key} className="group" style={{ position: 'relative', textAlign: 'center', margin: '8px 0' }}>
              <p style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>
                {activeBook.chapterOrnament || '\u2767'}
              </p>
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); handleDeleteBlock(path); }}
                style={{ position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Ornament entfernen"
              >
                <Trash2 size={12} />
              </button>
            </div>
          );

        case 'heading':
          return (
            <p 
              key={key} 
              className="literary-paragraph" 
              style={{ fontWeight: 'bold', marginTop: path[path.length - 1] > 0 ? '1.5em' : '0', marginBottom: '1.5em', padding: '0', lineHeight: '1.5', outline: 'none' }}
              {...getDragDropProps(path)}
              {...makeEditable(path)}
            >
              <strong>{block.text}</strong>
            </p>
          );

        case 'quote': {
          const isInfobox = pageParagraphStyle === 'spacing';
          if (typeof selectedPage === 'number' && (activeBook.pagesHideQuotes || []).includes(selectedPage)) return null;
          if (isInfobox) {
            return (
              <div 
                key={key} 
                style={{ backgroundColor: '#f8fafc', borderLeft: '2px solid #64748b', padding: '6px 8px', borderRadius: '2px', margin: '6px 0', fontStyle: 'italic', color: '#334155', outline: 'none' }}
                {...getDragDropProps(path)}
                {...makeEditable(path)}
              >
                {block.text}
              </div>
            );
          }
          return (
            <blockquote 
              key={key} 
              style={{ outline: 'none' }}
              {...getDragDropProps(path)}
              {...makeEditable(path)}
            >
              {block.text}
            </blockquote>
          );
        }

        case 'bullet':
          return (
            <p 
              key={key} 
              className="literary-paragraph" 
              style={{ margin: '0', padding: '0', lineHeight: '1.5', textAlign: 'left', outline: 'none' }}
              {...getDragDropProps(path)}
            >
              <span style={{ display: 'flex', gap: '6px', paddingLeft: '8px' }}>
                <span>•</span>
                <span {...makeEditable(path)} style={{ flex: 1, outline: 'none' }}>{block.text}</span>
              </span>
            </p>
          );

        case 'checkbox':
          return (
            <div 
              key={key} 
              className="workbook-checkbox-container" 
              style={{ outline: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
              {...getDragDropProps(path)}
            >
              <span 
                className={'workbook-checkbox-box' + (block.checked ? ' checked' : '')} 
                onClick={(e) => {
                  e.stopPropagation();
                  const updatedBlocks = JSON.parse(JSON.stringify(blocks));
                  let current = updatedBlocks;
                  for (let i = 0; i < path.length - 1; i++) {
                    current = current[path[i]].children;
                  }
                  current[path[path.length - 1]].checked = !block.checked;
                  updatePagePartBlocks(updatedBlocks);
                }}
                style={{ cursor: 'pointer', flexShrink: 0 }}
              />
              <span {...makeEditable(path)} style={{ flex: 1, outline: 'none' }}>{block.text}</span>
            </div>
          );

        case 'dotted_line':
          return <span key={key} className="workbook-dotted-line" />;

        case 'table':
          return (
            <table key={key} className="workbook-table">
              <thead>
                <tr>
                  {block.headers.map((h, hi) => (
                    <th key={hi}>{renderInline(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci}>{renderInline(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          );

        case 'box': {
          const styleNum = block.styleNum || 1;
          const design = styleNum === 1 
            ? (activeBook.box1Design || DEFAULT_BOX1_DESIGN)
            : styleNum === 2 
              ? (activeBook.box2Design || DEFAULT_BOX2_DESIGN)
              : (activeBook.box3Design || DEFAULT_BOX3_DESIGN);
          
          return (
            <div 
              key={key} 
              className="workbook-box" 
              onClick={(e) => {
                e.stopPropagation();
                setActiveStyleEditNum(styleNum);
              }}
              style={{
                position: 'relative',
                backgroundColor: design.backgroundColor,
                borderColor: design.borderColor,
                borderWidth: `${design.borderThickness}px`,
                borderStyle: design.borderStyle,
                borderRadius: `${design.borderRadius}px`,
                color: design.textColor,
                fontStyle: design.fontStyle,
                padding: '12px 14px',
                margin: '14px 0',
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
              title="Klicke auf den Box-Rand, um den Stil zu bearbeiten"
            >
              {block.title && (
                <span 
                  className="workbook-box-title" 
                  onClick={(e) => e.stopPropagation()}
                  {...makeEditable(path)}
                  style={{ 
                    color: design.textColor,
                    fontSize: '11px',
                    fontWeight: 700,
                    marginBottom: '6px',
                    display: 'block',
                    outline: 'none',
                    cursor: 'text'
                  }}
                >
                  {block.title}
                </span>
              )}
              
              {/* Float Hover Edit Button */}
              <button
                className="box-edit-hover-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveStyleEditNum(styleNum);
                }}
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  padding: '2px 6px',
                  fontSize: '8.5px',
                  fontWeight: 600,
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  zIndex: 10
                }}
              >
                🎨 Stil bearbeiten
              </button>
 
              <div 
                className="workbook-box-content" 
                onClick={(e) => e.stopPropagation()}
                style={{ fontSize: 'inherit', color: 'inherit', fontStyle: 'inherit', cursor: 'default' }}
              >
                {block.children.map((child, ci) => renderWbBlock(child, [...path, ci]))}
              </div>
            </div>
          );
        }

        case 'image': {
          const widthVal = block.width !== undefined ? block.width : 85;
          const floatVal = block.float !== undefined ? block.float : 'none';

          return (
            <PreviewGraphicBox
              key={key}
              transform={activeBook.imagesTransform?.[`ai_${block.prompt}`] || {}}
              defaultWidth={widthVal}
              defaultFloat={floatVal}
              onDelete={() => handleDeleteBlock(path)}
              onChange={newT => {
                updateActiveBookConfig('imagesTransform', {
                  ...(activeBook.imagesTransform || {}),
                  [`ai_${block.prompt}`]: newT
                });
              }}
            >
              <div 
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', JSON.stringify({ sourcePath: path }));
                }}
                style={{
                  margin: '0 auto',
                  padding: '16px',
                  backgroundColor: 'rgba(241, 245, 249, 0.4)',
                  border: '1px dashed rgba(148, 163, 184, 0.5)',
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#64748b',
                  textAlign: 'center',
                  width: '100%',
                  boxSizing: 'border-box',
                  cursor: 'grab'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>K.I. Grafik-Platzhalter</span>
                  <span style={{ fontSize: '8px', fontStyle: 'italic', maxWidth: '100%', lineHeight: '1.3' }}>"{block.prompt}"</span>
                </div>
              </div>
            </PreviewGraphicBox>
          );
        }

        case 'custom_image': {
          const widthVal = block.width !== undefined ? block.width : 85;
          const floatVal = block.float !== undefined ? block.float : 'none';
          const imgSrc = activeBook.images?.[block.id] || '';
          const transform = activeBook.imagesTransform?.[block.id] || {};

          return (
            <PreviewGraphicBox
              key={key}
              transform={transform}
              defaultWidth={widthVal}
              defaultFloat={floatVal}
              onDelete={() => handleDeleteBlock(path)}
              onChange={newT => {
                updateActiveBookConfig('imagesTransform', {
                  ...(activeBook.imagesTransform || {}),
                  [block.id]: newT
                });
              }}
            >
              <div style={{ width: '100%', margin: 0, textAlign: 'center' }}>
              {imgSrc ? (
                <img 
                  src={imgSrc} 
                  alt="Benutzergrafik" 
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    display: 'block'
                  }} 
                />
              ) : (
                <div style={{
                  padding: '16px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fee2e2',
                  borderRadius: '4px',
                  color: 'var(--error)',
                  fontSize: '9px'
                }}>
                  [Bild fehlt: {block.id}]
                </div>
              )}
              </div>
            </PreviewGraphicBox>
          );
        }

        case 'paragraph': {
          const isDropCapCandidate = showInitialOnPage && partIndex === 0 && !dropCapUsed && block.text.length > 1;
          if (isDropCapCandidate) {
            dropCapUsed = true;
            const dropChar = block.text[0];
            const restText = block.text.slice(1);
            return (
              <p 
                key={key} 
                className="literary-paragraph" 
                style={{ margin: '0', padding: '0', lineHeight: '1.5', textAlign: activeBook.alignment === 'left' ? 'left' : 'justify', outline: 'none' }}
                {...getDragDropProps(path)}
                {...makeEditable(path)}
              >
                <span className="drop-cap-letter">{dropChar}</span>
                {restText}
              </p>
            );
          }
          const marginBottom = pageParagraphStyle === 'spacing' ? '0.8em' : '0';
          return (
            <p
              key={key}
              className="literary-paragraph"
              style={{
                textIndent: '0',
                marginBottom,
                margin: '0',
                padding: '0',
                lineHeight: '1.5',
                textAlign: activeBook.alignment === 'left' ? 'left' : 'justify',
                outline: 'none',
                cursor: 'text'
              }}
              {...getDragDropProps(path)}
              {...makeEditable(path)}
            >
              {renderInline(block.text)}
            </p>
          );
        }

        default:
          return null;
      }
    };

    return blocks.map((block, idx) => renderWbBlock(block, [idx])).filter(Boolean);
  };

  const renderPreviewContent = () => {
    if (!activeBook || selectedPage === null) return null;
    if (selectedPage === 'title') {
      return renderTitlePagePreview();
    }
    if (typeof selectedPage === 'string' && selectedPage.startsWith('toc')) {
      return renderTOCPreview();
    }
    return null;
  };

  const getPreviewPageNumber = (partIndex: number = 0) => {
    if (!activeBook || selectedPage === null || typeof selectedPage !== 'number' || !outline) return '';
    let contentPageNumber = 0;
    const splitPageText = (text: string): string[] => {
      if (!text) return [''];
      return text.split(/\r?\n\s*-{3,}\s*(?:\r?\n|$)/);
    };
    for (let i = 1; i <= selectedPage; i++) {
      const pageText = (activeBook.pagesText || {})[i] || '';
      const parts = splitPageText(pageText);
      if (i === selectedPage) {
        return contentPageNumber + 1 + partIndex;
      }
      contentPageNumber += parts.length;
    }
    return '';
  };

  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Nischen-Finder State
  const [nicheQuery, setNicheQuery] = useState('');
  const [isSearchingNiche, setIsSearchingNiche] = useState(false);
  const [nicheResult, setNicheResult] = useState<NicheResult | null>(null);
  const [nicheAnalysisLoading, setNicheAnalysisLoading] = useState(false);

  const handleSearchNiche = async () => {
    if (!nicheQuery.trim()) return;
    setIsSearchingNiche(true);
    setNicheResult(null);
    try {
      const result = await searchNiche(nicheQuery);
      setNicheResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingNiche(false);
    }
  };

  const handleAnalyzeNicheAI = async () => {
    if (!nicheResult || !selectedModel) return;
    setNicheAnalysisLoading(true);
    try {
      // Hole API Keys aus dem LocalStorage
      const keysStr = localStorage.getItem('b24studio_api_keys');
      let geminiKey = '';
      if (keysStr) {
        try { 
          const parsed = JSON.parse(keysStr); 
          geminiKey = (parsed.gemini && parsed.gemini.length > 0) ? parsed.gemini[0] : '';
        } catch (e) {}
      }

      if (!geminiKey) {
        setNicheResult(prev => prev ? { ...prev, aiAnalysis: 'Fehler: Kein Gemini API Key hinterlegt. Bitte füge deinen Key unter Einstellungen → API Keys ein.' } : null);
        return;
      }

      const prompt = `Analysiere die KDP Nische "${nicheResult.keyword}". Das Suchvolumen beträgt ${nicheResult.metrics.searchVolume} und der Ø BSR ist ${nicheResult.metrics.averageBsr}. Finde eine Lücke im Markt und gib uns einen Tipp für einen perfekten Buchtitel. Antworte in 2-3 knappen, professionellen Absätzen auf Deutsch.`;
      
      const payload = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 800, temperature: 0.7 }
      };

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.candidates && data.candidates[0]) {
        const analysis = data.candidates[0].content.parts[0].text;
        setNicheResult(prev => prev ? { ...prev, aiAnalysis: analysis } : null);
      }
    } catch (err) {
      console.error(err);
      setNicheResult(prev => prev ? { ...prev, aiAnalysis: 'Ein Fehler ist bei der KI-Analyse aufgetreten.' } : null);
    } finally {
      setNicheAnalysisLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontFamily: "'Poppins', sans-serif", flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <Loader2 className="spinner" style={{ width: '18px', height: '18px' }} />
          <span>Lade Book24 Studio...</span>
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{ marginTop: '8px', padding: '8px 20px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#aaa', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#aaa'; }}
        >
          Seite neu laden
        </button>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <LandingPage 
          onLoginClick={() => setShowAuthModal(true)} 
          theme={theme}
          setTheme={setTheme}
        />
        {showAuthModal && (
          <Auth 
            onAuthSuccess={() => setShowAuthModal(false)} 
            onClose={() => setShowAuthModal(false)} 
          />
        )}
      </>
    );
  }

  return (
    <>
      {/* 🚫 Account Banned Modal */}
      {showBanModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999999,
          backgroundColor: 'rgba(0,0,0,0.92)',
          backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #1a0a0a 0%, #2d0a0a 50%, #1a0a0a 100%)',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: '20px',
            padding: '40px 36px',
            maxWidth: '460px',
            width: '100%',
            boxShadow: '0 0 60px rgba(239,68,68,0.2), 0 24px 60px rgba(0,0,0,0.8)',
            textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px'
          }}>
            {/* Icon */}
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #7f1d1d, #dc2626)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '36px', boxShadow: '0 0 32px rgba(220,38,38,0.5)'
            }}>🚫</div>
            {/* Title */}
            <div>
              <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 800, color: '#fca5a5', letterSpacing: '-0.02em' }}>
                Konto gesperrt
              </h2>
              <p style={{ margin: 0, fontSize: '15px', color: '#fecaca', lineHeight: 1.6 }}>
                Dein Konto wurde vorübergehend eingefroren oder dauerhaft gesperrt.
              </p>
            </div>
            {/* Divider */}
            <div style={{ width: '100%', height: '1px', background: 'rgba(239,68,68,0.2)' }} />
            {/* Support info */}
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '16px 20px', width: '100%' }}>
              <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 700, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Support kontaktieren</p>
              <p style={{ margin: 0, fontSize: '14px', color: '#f87171', lineHeight: 1.6 }}>
                Wenn du glaubst, dass dies ein Fehler ist oder mehr Informationen benötigst, wende dich bitte an unseren Support.
              </p>
            </div>
            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <a
                href="mailto:support@book24.studio"
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px', textDecoration: 'none',
                  background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                  color: '#fff', fontSize: '14px', fontWeight: 700, textAlign: 'center',
                  display: 'block', boxShadow: '0 4px 16px rgba(220,38,38,0.4)'
                }}
              >
                ✉️ Support schreiben
              </a>
              <button
                onClick={() => setShowBanModal(false)}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.3)',
                  background: 'transparent', color: '#f87171', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* License Enforcement Overlay */}
      {userHasValidLicense === false && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'auto',
          padding: '24px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '32px 40px',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
            maxWidth: '450px',
            width: '100%',
            boxSizing: 'border-box',
            color: '#202124',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}>
            <LicensePrompt 
              onValidLicense={async (key) => {
                try {
                  await supabase!.rpc('claim_license_key', { key_to_claim: key });
                  setUserHasValidLicense(true);
                } catch (e) {
                  console.error('Failed to claim license:', e);
                  setUserHasValidLicense(true);
                }
              }}
            />
          </div>
        </div>
      )}

      <div className="app-container" style={{ 
        pointerEvents: userHasValidLicense === false ? 'none' : 'auto',
        filter: userHasValidLicense === false ? 'grayscale(80%) brightness(0.4) blur(1px)' : 'none',
        userSelect: userHasValidLicense === false ? 'none' : 'auto',
        height: '100vh',
        overflow: userHasValidLicense === false ? 'hidden' : 'auto'
      }}>

      {/* Custom Confirm Dialog */}
      {confirmDialog && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          backgroundColor: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'var(--sidebar-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '28px 32px',
            maxWidth: '420px',
            width: '90%',
            boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
            display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {confirmDialog.danger && (
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
              )}
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>{confirmDialog.title}</h3>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>{confirmDialog.message}</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              {confirmDialog.cancelLabel !== 'none' && (
                <button
                  onClick={() => { confirmDialog.onCancel?.(); setConfirmDialog(null); }}
                  className="btn"
                  style={{ padding: '8px 18px', fontSize: '13px', backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
                >
                  {confirmDialog.cancelLabel || 'Abbrechen'}
                </button>
              )}
              <button
                onClick={() => { setConfirmDialog(null); confirmDialog.onConfirm(); }}
                className="btn"
                style={{
                  padding: '8px 18px', fontSize: '13px', fontWeight: 600,
                  backgroundColor: confirmDialog.danger ? '#dc2626' : 'var(--primary)',
                  color: '#fff', border: 'none'
                }}
              >
                {confirmDialog.confirmLabel || 'Bestätigen'}
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Header Bar */}
      <header className="header">
        <div className="header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img 
              src="/logokdpbook24studio.png" 
              alt="Book24 Studio Logo" 
              style={{ height: '28px', width: 'auto', display: 'block' }} 
            />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{
                fontFamily: "'Poppins', 'Roboto', sans-serif",
                fontWeight: 700,
                fontSize: '18px',
                letterSpacing: '-0.01em',
                color: 'var(--text-main)',
                lineHeight: 1,
              }}>Book24</span>
              <span style={{
                fontFamily: "'Poppins', 'Roboto', sans-serif",
                fontWeight: 300,
                fontSize: '15px',
                color: 'var(--text-muted)',
                lineHeight: 1,
              }}>Studio</span>
            </div>
          </div>
        </div>

        <div className="header-nav-wrap">
          {(() => {
            const getModuleStatus = (tab: string): string => {
              if (isOwnerClient) return 'active';
              return activeModules[tab] || 'active';
            };

            const currentNavTabs = NAV_TABS.filter(tab => {
              if (isOwnerClient) return true; // Owner sees all tabs
              if (tab === 'owner') return false; // Non-owner never sees owner tab
              
              const status = getModuleStatus(tab);
              if (status === 'hidden') return false;
              
              if (tab === 'brain') return brainEnabled;
              return true;
            });
            const navItems = currentNavTabs.map(tab => {
              const status = getModuleStatus(tab);
              const isMaintenance = status === 'maintenance';

              if (tab === 'projects') return { label: 'Mediathek' };
              if (tab === 'dashboard') return { label: 'Nischen-Finder', maintenance: isMaintenance };
              if (tab === 'brain') return { label: 'Brain', disabled: !brainEnabled && !isMaintenance, maintenance: isMaintenance };
              if (tab === 'studio') return { label: 'Schreibstudio', maintenance: isMaintenance };
              if (tab === 'calculator') return { label: 'Rechner', maintenance: isMaintenance };
              if (tab === 'owner') return { label: 'Owner Panel' };
              return { label: '' };
            });

            return (
              <GooeyNav
                items={navItems}
                activeIndex={Math.max(0, currentNavTabs.indexOf(activeNavKey))}
                themeClassName={`gooey-tab-${activeNavKey}`}
                colorsByIndex={currentNavTabs.map(tab => NAV_TAB_PARTICLE_COLORS[tab])}
                onSelect={(index) => {
                  const tab = currentNavTabs[index];
                  handleSelectNavTab(tab);
                }}
                particleCount={12}
                particleDistances={[70, 8]}
                particleR={80}
                animationTime={550}
              />
            );
          })()}
        </div>

        <div className="header-right">
          <div className="header-divider" />

          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowAccountModal(!showAccountModal)}
              className="header-profile-btn"
            >
              <User style={{ width: '14px', height: '14px', color: 'var(--text-muted)' }} />
              <span className="truncate" style={{ maxWidth: '120px' }}>
                {(accounts.find(a => a.id === activeAccountId)?.username) || 'Profil'}
              </span>
              <ChevronDown style={{ width: '12px', height: '12px', color: 'var(--text-muted)' }} />
            </button>

            {showAccountModal && (
              <div className="dropdown-menu">
                <div style={{ fontSize: '10.5px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Profil umschalten</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '150px', overflowY: 'auto' }}>
                  {accounts.map(acc => (
                    <button
                      key={acc.id}
                      onClick={() => {
                        setActiveAccountId(acc.id);
                        setShowAccountModal(false);
                      }}
                      className={`book-item ${acc.id === activeAccountId ? 'active' : ''}`}
                      style={{ padding: '6px 10px', justifyContent: 'space-between' }}
                    >
                      <span className="truncate">{acc.username}</span>
                      {acc.id !== 'default' && (
                        <Trash2 
                          onClick={(e) => handleDeleteAccount(acc.id, e)}
                          style={{ width: '12px', height: '12px', color: 'var(--error)' }} 
                        />
                      )}
                    </button>
                  ))}
                </div>
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <input 
                    type="text" 
                    placeholder="Profilname..." 
                    value={newUsernameInput}
                    onChange={e => setNewUsernameInput(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '13px' }}
                  />
                  <button onClick={handleCreateAccount} className="btn btn-primary" style={{ width: '100%', padding: '6px 10px', fontSize: '13px' }}>
                    <Plus style={{ width: '13px', height: '13px' }} /> Hinzufügen
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className="header-icon-btn"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Light Mode aktivieren' : 'Dark Mode aktivieren'}
            style={{ marginRight: '8px' }}
          >
            {theme === 'dark' ? <Sun style={{ width: '16px', height: '16px' }} /> : <Moon style={{ width: '16px', height: '16px' }} />}
          </button>

          <button
            type="button"
            className={`header-icon-btn${settingsNeedAttention ? ' has-alert' : ''}`}
            onClick={openSettings}
            title="Einstellungen"
          >
            <Settings style={{ width: '16px', height: '16px' }} />
          </button>

          {currentUser && (
            <div className="header-user-chip">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="" className="header-user-avatar" />
              ) : (
                <div className="header-user-avatar-fallback">
                  {currentUser.displayName ? currentUser.displayName[0] : (currentUser.email ? currentUser.email[0].toUpperCase() : 'U')}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  showConfirm({
                    title: 'Abmelden',
                    message: 'Möchtest du dich wirklich abmelden?',
                    confirmLabel: 'Abmelden',
                    danger: true,
                    onConfirm: () => supabase?.auth.signOut()
                  });
                }}
                className="btn btn-danger"
                style={{ padding: '4px 10px', fontSize: '11px', height: '26px', borderRadius: '99px' }}
              >
                Abmelden
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Workspace Area */}
      <div className="workspace-content">
        {ownerRouteActive ? (
          <div
            style={{
              padding: '10px',
              height: 'calc(100vh - 110px)',
              width: '100%',
              overflowY: 'auto',
              background: theme === 'dark' ? '#070b11' : '#f4f7fb'
            }}
          >
            <OwnerPanel currentUser={currentUser} theme={theme} />
          </div>
        ) : (
        <>
        {/* Tab 1: Projects Mediathek Grid view */}
        {activeTab === 'projects' && (
          <>
            {theme === 'light' && (
              <div style={{ position: 'fixed', inset: 0, zIndex: -1, overflow: 'hidden' }}>
                <Aurora
                  colorStops={["#e0e0e0","#ffffff","#ffffff"]}
                  amplitude={1}
                  blend={0.5}
                />
              </div>
            )}
            <div className="mediathek-container" style={{ position: 'relative', zIndex: 1 }}>
              <div className="mediathek-header">
              <div>
                <h2 className="mediathek-title">Meine Buchprojekte</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Bibliothek des Profils: <strong>{(accounts.find(a => a.id === activeAccountId)?.username)}</strong>
                </p>
              </div>
              <button onClick={handleCreateBook} className="btn btn-primary">
                <Plus style={{ width: '14px', height: '14px' }} /> Neues Buchprojekt
              </button>
            </div>

            {books.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '260px', border: '1px dashed var(--border-color)', borderRadius: '4px', gap: '8px', color: 'var(--text-muted)' }}>
                <BookOpen style={{ width: '28px', height: '28px', color: 'var(--border-color)' }} />
                <p style={{ fontSize: '13px' }}>Deine Mediathek ist leer.</p>
                <button onClick={handleCreateBook} className="btn" style={{ fontSize: '12px' }}>Erstes Projekt anlegen</button>
              </div>
            ) : (
              <div className="projects-grid">
                {books.map(b => {
                  const donePages = Object.values(b.pagesStatus || {}).filter(s => s === 'completed').length;
                  const maxPages = b.outline ? b.outline.target_pages : 0;
                  const pct = maxPages > 0 ? Math.round((donePages / maxPages) * 100) : 0;

                  return (
                    <div 
                      key={b.id} 
                      className="project-card"
                      onClick={() => {
                        setActiveBookId(b.id);
                        setSelectedPage('title');
                        setActiveTab('studio');
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="flex-space" style={{ alignItems: 'start' }}>
                        <div style={{ flex: 1, paddingRight: '10px' }}>
                          <h3 className="project-title">{b.title || 'Unbenanntes Buch'}</h3>
                          <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', lineBreak: 'anywhere' }} className="truncate">
                            {b.subtitle || 'Kein Untertitel'}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button 
                            onClick={(e) => handleCopyBook(b.id, e)} 
                            className="btn"
                            style={{ padding: '4px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
                            title="Projekt kopieren"
                          >
                            <Copy style={{ width: '12px', height: '12px' }} />
                          </button>
                          <button 
                            onClick={(e) => handleDeleteBook(b.id, e)} 
                            className="btn btn-danger"
                            style={{ padding: '4px' }}
                            title="Projekt löschen"
                          >
                            <Trash2 style={{ width: '12px', height: '12px' }} />
                          </button>
                        </div>
                      </div>

                      <div className="project-meta">
                        <div><strong style={{ color: 'var(--text-main)' }}>Sprache:</strong> {b.language === 'de' ? 'Deutsch' : 'Englisch'}</div>
                        <div><strong style={{ color: 'var(--text-main)' }}>Stil:</strong> {b.writingStyle}</div>
                        <div><strong style={{ color: 'var(--text-main)' }}>Format:</strong> {b.pageSize === 'custom' ? `${b.customWidth}x${b.customHeight}"` : b.pageSize === 'a4' ? 'DIN A4' : `${b.pageSize}"`}</div>
                      </div>

                      {/* Progress widget inside card */}
                      <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div className="flex-space" style={{ fontSize: '9px', fontWeight: 'bold' }}>
                          <span>SCHREIBPROZESS</span>
                          <span>{donePages} / {maxPages} Seiten ({pct}%)</span>
                        </div>
                        <div className="progress-track" style={{ height: '3px' }}>
                          <div className="progress-bar" style={{ width: `${pct}%` }} />
                        </div>
                      </div>

                      {/* Creation Date and Time Badge */}
                      <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div
                          style={{
                            padding: '8px 10px',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '11px',
                            color: 'var(--text-muted)'
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: 'var(--primary)' }}>
                            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                            <line x1="16" x2="16" y1="2" y2="6"/>
                            <line x1="8" x2="8" y1="2" y2="6"/>
                            <line x1="3" x2="21" y1="10" y2="10"/>
                          </svg>
                          <span>
                            Erstellt: {getProjectFormattedDate(b)}
                          </span>
                        </div>
                        
                        {b.pagesGenerationTime && Object.keys(b.pagesGenerationTime).length > 0 && (() => {
                          const totalMs = Object.values(b.pagesGenerationTime!).reduce((a, val) => a + val, 0);
                          const totalSec = Math.floor(totalMs / 1000);
                          const m = Math.floor(totalSec / 60);
                          const s = totalSec % 60;
                          return (
                            <div
                              style={{
                                padding: '8px 10px',
                                background: 'rgba(201,150,62,0.08)',
                                borderRadius: '6px',
                                border: '1px solid rgba(201,150,62,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '11px',
                                color: '#C9963E'
                              }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                              </svg>
                              <span>
                                Generierungszeit: {m}:{s.toString().padStart(2, '0')}
                              </span>
                            </div>
                          );
                        })()}
                      </div>

                      <button 
                        onClick={() => {
                          setActiveBookId(b.id);
                          setSelectedPage('title');
                          setActiveTab('studio');
                        }}
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '6px', padding: '6px' }}
                      >
                        Projekt öffnen
                      </button>
                    </div>
                  );
                })}

                {/* Quick Add Card */}
                <div 
                  onClick={handleCreateBook} 
                  className="project-card" 
                  style={{ borderStyle: 'dashed', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '195px', gap: '8px', color: 'var(--text-muted)' }}
                >
                  <Plus style={{ width: '22px', height: '22px' }} />
                  <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Neues Projekt hinzufügen</span>
                </div>
              </div>
            )}
          </div>
          </>
        )}


        {/* Tab: Brain Dashboard (beta — allowlist only) */}
        {activeTab === 'brain' && brainEnabled && (
          !isOwnerClient && activeModules.brain === 'maintenance' ? (
            <MaintenanceView name="Das Brain" theme={theme} onBack={() => setActiveTab('projects')} />
          ) : (
            <BrainDashboard
              accountId={activeAccountId}
              books={books}
              refreshKey={brainTick}
              onBrainUpdate={refreshBrain}
              theme={theme}
              currentUser={currentUser}
            />
          )
        )}

        {/* Tab: Dashboard (Nischen-Finder) */}
        {activeTab === 'dashboard' && (
          !isOwnerClient && activeModules.dashboard === 'maintenance' ? (
            <MaintenanceView name="Nischenfinder" theme={theme} onBack={() => setActiveTab('projects')} />
          ) : (
            <div style={{ padding: '32px 40px', overflowY: 'auto', height: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column', flex: 1, width: '100%', alignItems: 'center', background: 'var(--bg-main)' }}>
              <div style={{ width: '100%', maxWidth: '1200px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

              {/* TOP BAR */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>KDP Publishing</div>
                  <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: 1 }}>Nischen-Finder</h1>
                </div>
              </div>

              <NicheFinderDashboard 
                nicheQuery={nicheQuery}
                setNicheQuery={setNicheQuery}
                isSearchingNiche={isSearchingNiche}
                handleSearchNiche={handleSearchNiche}
                nicheResult={nicheResult}
                nicheAnalysisLoading={nicheAnalysisLoading}
                handleAnalyzeNicheAI={handleAnalyzeNicheAI}
              />
              </div>
            </div>
          )
        )}

        {/* Tab 4: Calculator */}
        {activeTab === 'calculator' && (
          !isOwnerClient && activeModules.calculator === 'maintenance' ? (
            <MaintenanceView name="KDP Rechner" theme={theme} onBack={() => setActiveTab('projects')} />
          ) : (
            <div style={{ height: 'calc(100vh - 110px)', overflowY: 'auto', background: theme === 'dark' ? '#0f172a' : '#f8fafc', padding: '20px' }}>
              <KdpCalculator theme={theme} />
            </div>
          )
        )}

        {/* Tab 2: Studio Layout Panel Grid */}
        {activeTab === 'studio' && (
          !isOwnerClient && activeModules.studio === 'maintenance' ? (
            <MaintenanceView name="Buch Studio" theme={theme} onBack={() => setActiveTab('projects')} />
          ) : (
            !activeBook ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 'calc(100vh - 110px)',
                width: '100%',
                background: 'var(--bg-main)',
                color: 'var(--text-main)',
                fontFamily: "'Outfit', sans-serif",
                padding: '24px',
                textAlign: 'center',
                boxSizing: 'border-box'
              }}>
                <div style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '40px',
                  maxWidth: '480px',
                  width: '100%',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
                  boxSizing: 'border-box'
                }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-main)' }}>Kein Projekt ausgewählt</h2>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '24px' }}>
                    Bitte wähle zuerst in der Mediathek ein Buchprojekt aus oder erstelle ein neues Projekt, um das Schreibstudio zu öffnen.
                  </p>
                  <button
                    onClick={() => setActiveTab('projects')}
                    style={{
                      padding: '10px 20px',
                      fontSize: '13px',
                      fontWeight: 600,
                      backgroundColor: 'var(--primary)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    Zur Mediathek gehen
                  </button>
                </div>
              </div>
            ) : (
              <div className="studio-grid" style={{ display: 'flex', width: '100%', height: 'calc(100vh - 110px)', gap: '0px', position: 'relative' }}>
            {/* Left Panel: Library & Settings — Redesigned */}
            <div
              className="ex-pane"
              style={{
                width: `${leftWidth}px`,
                flexShrink: 0,
                display: isExplorerCollapsed ? 'none' : 'flex',
              }}
            >
              {/* ── Header ── */}
              <div className="ex-header">
                <div className="ex-wordmark">
                  <div className="ex-wordmark-dot" />
                  <span className="ex-wordmark-text">Explorer</span>
                </div>
                <button
                  className="ex-collapse-btn"
                  onClick={() => {
                    setIsExplorerCollapsed(true);
                    localStorage.setItem('b24studio_left_collapsed', 'true');
                  }}
                  title="Panel einklappen"
                >
                  <ChevronLeft style={{ width: '15px', height: '15px' }} />
                </button>
              </div>

              {/* ── Tab switcher ── */}
              <div className="ex-tabs">
                <button
                  className={`ex-tab${explorerTab === 'settings' ? ' active' : ''}`}
                  onClick={() => setExplorerTab('settings')}
                >
                  Layout & Inhalt
                </button>
                <button
                  className={`ex-tab${explorerTab === 'marketing' ? ' active' : ''}`}
                  onClick={() => setExplorerTab('marketing')}
                >
                  KDP Marketing
                </button>
              </div>
              
              {/* ── Body ── */}
              <div className="ex-body">
                {explorerTab === 'settings' ? (
                  <>
                    {/* ── Buch ── */}
                    <div className="ex-section-label">Buch</div>
                    <div className="ex-section">
                      <div className="ex-field">
                        <label className="ex-label">Titel</label>
                        <input
                          className="ex-input"
                          type="text"
                          value={activeBook.title}
                          onChange={e => updateActiveBookConfig('title', e.target.value)}
                          disabled={isPlanning || isGenerating}
                          placeholder="Buchtitel..."
                        />
                      </div>
                      <div className="ex-field">
                        <label className="ex-label">Untertitel</label>
                        <input
                          className="ex-input"
                          type="text"
                          value={activeBook.subtitle}
                          onChange={e => updateActiveBookConfig('subtitle', e.target.value)}
                          disabled={isPlanning || isGenerating}
                          placeholder="Untertitel..."
                        />
                      </div>
                    </div>

                    <div className="ex-divider" />

                    {/* ── Inhalt ── */}
                    <div className="ex-section-label">Inhalt & Idee</div>
                    <div className="ex-section">
                      <div className="ex-idea-tabs">
                        <button
                          type="button"
                          className={`ex-idea-tab${ideaTab === 'text' ? ' active' : ''}`}
                          onClick={() => setIdeaTab('text')}
                        >Plot / Idee</button>
                        <button
                          type="button"
                          className={`ex-idea-tab${ideaTab === 'sources' ? ' active' : ''}`}
                          onClick={() => setIdeaTab('sources')}
                        >KI Futter (URLs)</button>
                      </div>

                      {ideaTab === 'text' ? (
                        <textarea
                          className="ex-textarea"
                          rows={5}
                          value={activeBook.idea}
                          onChange={e => updateActiveBookConfig('idea', e.target.value)}
                          disabled={isPlanning || isGenerating}
                          placeholder="Hauptidee deines Buches..."
                        />
                      ) : (
                        <div className="ex-section">
                          <textarea
                            className="ex-textarea"
                            rows={4}
                            value={activeBook.sourceUrls || ''}
                            onChange={e => updateActiveBookConfig('sourceUrls', e.target.value)}
                            disabled={isPlanning || isGenerating || isFetchingSources}
                            placeholder="Website-URLs (eine pro Zeile)..."
                            style={{ fontFamily: 'monospace', fontSize: '11px' }}
                          />
                          <button
                            type="button"
                            className="ex-btn ex-btn-plan"
                            onClick={handleFetchSources}
                            disabled={isFetchingSources || isPlanning || isGenerating || !(activeBook.sourceUrls || '').trim()}
                          >
                            {isFetchingSources
                              ? <><Loader2 className="animate-spin" style={{ width: '13px', height: '13px' }} /> Lade Websites...</>
                              : <><CheckCircle2 style={{ width: '13px', height: '13px' }} /> Websites einlesen</>}
                          </button>
                          {activeBook.extractedSourceText && (
                            <div className="ex-source-ok">
                              ✓ {activeBook.extractedSourceText.length.toLocaleString()} Zeichen eingelesen
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="ex-divider" />

                    {/* ── Parameter ── */}
                    <div className="ex-section-label">Parameter</div>
                    <div className="ex-section">
                      <div className="ex-grid-2">
                        <div className="ex-field">
                          <label className="ex-label">Sprache</label>
                          <select
                            className="ex-select"
                            value={activeBook.language}
                            onChange={e => updateActiveBookConfig('language', e.target.value)}
                            disabled={isPlanning || isGenerating}
                          >
                            <option value="de">Deutsch</option>
                            <option value="en">Englisch</option>
                          </select>
                        </div>
                        <div className="ex-field">
                          <label className="ex-label">Seiten (max. 200)</label>
                          <input
                            className="ex-input"
                            type="number"
                            min={5} max={200}
                            value={activeBook.targetPages}
                            onFocus={e => e.target.select()}
                            onChange={e => updateActiveBookConfig('targetPages', Math.max(5, Math.min(200, Number(e.target.value))))}
                            disabled={isPlanning || isGenerating}
                          />
                        </div>
                      </div>

                      {activeBook.language === 'de' && (
                        <button
                          type="button"
                          className="ex-btn ex-btn-ghost"
                          onClick={() => setShowTranslationWarning(true)}
                          disabled={isTranslating || isGenerating || isPlanning}
                        >
                          {isTranslating
                            ? <><Loader2 className="animate-spin" style={{ width: '12px', height: '12px' }} />{translationProgress || 'Übersetze...'}</>
                            : <><Sparkles style={{ width: '12px', height: '12px' }} />Auf Englisch übersetzen</>}
                        </button>
                      )}

                      <div className="ex-field">
                        <label className="ex-label">Schreibstil</label>
                        <select
                          className="ex-select"
                          value={activeBook.writingStyle}
                          onChange={e => updateActiveBookConfig('writingStyle', e.target.value)}
                          disabled={isPlanning || isGenerating}
                        >
                          <option value="Sachbuch / Informativ">Sachbuch / Informativ</option>
                          <option value="Sachbuch / Theorien">Sachbuch / Theorien</option>
                          <option value="Kreatives Storytelling">Kreatives Storytelling</option>
                          <option value="Akademisch / Wissenschaftlich">Akademisch / Wissenschaftlich</option>
                          <option value="Einfache Sprache">Einfache Sprache</option>
                        </select>
                      </div>

                      <div className="ex-field">
                        <label className="ex-label">Autoren-Richtlinien</label>
                        <textarea
                          className="ex-textarea"
                          value={activeBook.customGuidelines || ''}
                          onChange={e => updateActiveBookConfig('customGuidelines', e.target.value)}
                          placeholder="z. B. Ich-Perspektive, verbotene Wörter..."
                          rows={3}
                          disabled={isPlanning || isGenerating}
                        />
                      </div>

                      <div className="ex-field">
                        <label className="ex-label">Zitate-Einstellung</label>
                        <button
                          onClick={() => updateActiveBookConfig('noQuotes', !activeBook.noQuotes)}
                          disabled={isPlanning || isGenerating}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 14px',
                            borderRadius: '8px',
                            border: `1.5px solid ${activeBook.noQuotes ? '#ef4444' : 'var(--border)'}`,
                            background: activeBook.noQuotes ? 'rgba(239,68,68,0.12)' : 'var(--bg-card)',
                            color: activeBook.noQuotes ? '#ef4444' : 'var(--text-muted)',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: isPlanning || isGenerating ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            width: '100%',
                          }}
                          title={activeBook.noQuotes ? 'Zitate sind deaktiviert — klicken zum Aktivieren' : 'Zitate sind aktiv — klicken zum Deaktivieren'}
                        >
                          {activeBook.noQuotes ? 'Zitate deaktiviert (kein > "..." in allen Seiten)' : 'Zitate aktiv (max. 1 pro Kapitel)'}
                        </button>
                      </div>

                      <div className="ex-field">
                        <label className="ex-label">KI-Modell</label>
                        <select
                          className="ex-select"
                          value={selectedModel}
                          onChange={e => setSelectedModel(e.target.value)}
                          disabled={isPlanning || isGenerating}
                        >
                          <optgroup label="Groq API">
                            <option value="llama-3.3-70b-versatile">Llama 3.3 70B — Top Qualität</option>
                            <option value="llama-3.1-8b-instant">Llama 3.1 8B — Schnell</option>
                            <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                          </optgroup>
                          <optgroup label="Google Gemini">
                            <option value="gemini-2.0-flash">Gemini 2.0 Flash ✦</option>
                            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                          </optgroup>
                        </select>
                      </div>
                    </div>

                    <div className="ex-divider" />

                    {/* ── Layout ── */}
                    <div className="ex-section-label">Layout & Design</div>
                    <div className="ex-section">
                      <div className="ex-grid-2">
                        <div className="ex-field">
                          <label className="ex-label">Schriftart</label>
                          <select
                            className="ex-select"
                            value={activeBook.fontFamily}
                            onChange={e => updateActiveBookConfig('fontFamily', e.target.value)}
                          >
                            <option value="times">Times (Serif)</option>
                            <option value="playfair">Playfair Display</option>
                            <option value="helvetica">Helvetica</option>
                            <option value="inter">Inter (Modern)</option>
                            <option value="courier">Courier Mono</option>
                            <option value="arial">Arial</option>
                          </select>
                        </div>
                        <div className="ex-field">
                          <label className="ex-label">Größe</label>
                          <select
                            className="ex-select"
                            value={activeBook.fontSize}
                            onChange={e => updateActiveBookConfig('fontSize', Number(e.target.value))}
                          >
                            <option value={10}>10 pt</option>
                            <option value={11}>11 pt</option>
                            <option value={12}>12 pt</option>
                            <option value={13}>13 pt</option>
                            <option value={14}>14 pt</option>
                          </select>
                        </div>
                      </div>

                      <div className="ex-grid-2">
                        <div className="ex-field">
                          <label className="ex-label">Ausrichtung</label>
                          <select
                            className="ex-select"
                            value={activeBook.alignment || 'justify'}
                            onChange={e => updateActiveBookConfig('alignment', e.target.value)}
                          >
                            <option value="justify">Blocksatz</option>
                            <option value="left">Linksbündig</option>
                          </select>
                        </div>
                        <div className="ex-field">
                          <label className="ex-label">Ornament</label>
                          <select
                            className="ex-select"
                            value={activeBook.chapterOrnament || ''}
                            onChange={e => updateActiveBookConfig('chapterOrnament', e.target.value)}
                          >
                            <option value="">Keines</option>
                            <option value="❦">Floral ❦</option>
                            <option value="❖">Raute ❖</option>
                            <option value="✻">Stern ✻</option>
                          </select>
                        </div>
                      </div>

                      <div className="ex-grid-2">
                        <div className="ex-field">
                          <label className="ex-label">Buchgröße</label>
                          <select
                            className="ex-select"
                            value={activeBook.pageSize}
                            onChange={e => updateActiveBookConfig('pageSize', e.target.value)}
                          >
                            <option value="5x8">5×8″ Taschenbuch</option>
                            <option value="5.5x8.5">5.5×8.5″</option>
                            <option value="6x9">6×9″ Standard KDP</option>
                            <option value="8.5x11">8.5×11″ Großformat</option>
                            <option value="custom">Custom</option>
                            <option value="a4">DIN A4</option>
                          </select>
                        </div>
                        <div className="ex-field">
                          <label className="ex-label">Kopfzeile</label>
                          <select
                            className="ex-select"
                            value={activeBook.showRunningHeader !== false ? 'true' : 'false'}
                            onChange={e => updateActiveBookConfig('showRunningHeader', e.target.value === 'true')}
                          >
                            <option value="true">Ein</option>
                            <option value="false">Aus</option>
                          </select>
                        </div>
                      </div>

                      <div className="ex-grid-2">
                        <div className="ex-field">
                          <label className="ex-label">TOC</label>
                          <select
                            className="ex-select"
                            value={activeBook.generateTOC !== false ? 'true' : 'false'}
                            onChange={e => updateActiveBookConfig('generateTOC', e.target.value === 'true')}
                          >
                            <option value="true">Generieren</option>
                            <option value="false">Überspringen</option>
                          </select>
                        </div>
                        <div />
                      </div>

                      {activeBook.pageSize === 'custom' && (
                        <div className="ex-grid-2">
                          <div className="ex-field">
                            <label className="ex-label">Breite (Zoll)</label>
                            <input
                              className="ex-input"
                              type="number" step="0.1" min="3" max="12"
                              value={activeBook.customWidth || 6}
                              onChange={e => updateActiveBookConfig('customWidth', Math.max(3, Math.min(12, Number(e.target.value))))}
                            />
                          </div>
                          <div className="ex-field">
                            <label className="ex-label">Höhe (Zoll)</label>
                            <input
                              className="ex-input"
                              type="number" step="0.1" min="4" max="18"
                              value={activeBook.customHeight || 9}
                              onChange={e => updateActiveBookConfig('customHeight', Math.max(4, Math.min(18, Number(e.target.value))))}
                            />
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={applyRomanPreset} className="ex-btn ex-btn-accent" style={{ flex: 1, padding: '7px' }}>
                          Roman
                        </button>
                        <button onClick={applySachbuchPreset} className="ex-btn ex-btn-plan" style={{ flex: 1, padding: '7px' }}>
                          Sachbuch
                        </button>
                      </div>
                    </div>

                    <div className="ex-divider" />

                    {/* ── Aktionen ── */}
                    <div className="ex-section-label">Aktionen</div>
                    <div className="ex-section">
                      {outline ? (
                        <>
                          {!isGenerating && completedPagesCount < totalPagesCount && (
                            <button
                              className="ex-btn ex-btn-generate"
                              onClick={() => triggerPageWriting(outline, activeBook.id)}
                              disabled={isPlanning}
                            >
                              <Play style={{ width: '13px', height: '13px', fill: 'currentColor' }} />
                              {completedPagesCount > 0
                                ? `Weiter (${completedPagesCount}/${totalPagesCount})`
                                : 'Alle Seiten generieren'}
                            </button>
                          )}

                          {isGenerating && (
                            <button
                              className="ex-btn ex-btn-danger"
                              onClick={() => { cancelGenerationRef.current = true; }}
                            >
                              <Loader2 className="spinner" style={{ width: '13px', height: '13px' }} />
                              Generierung stoppen
                            </button>
                          )}

                          {isPlanning && planningProgress && (
                            <div className="ex-progress-box">
                              <div className="ex-progress-info">
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Loader2 className="spinner" style={{ width: '10px', height: '10px' }} />
                                  {planningProgress.message}
                                </span>
                                <span>{planningProgress.percent}%</span>
                              </div>
                              <div className="ex-progress-track">
                                <div className="ex-progress-bar" style={{ width: `${planningProgress.percent}%` }} />
                              </div>
                            </div>
                          )}

                          <button
                            className="ex-btn ex-btn-plan"
                            onClick={handlePlanBook}
                            disabled={isPlanning || isGenerating || !activeBook.title?.trim()}
                          >
                            <RotateCw style={{ width: '13px', height: '13px' }} />
                            Gliederung neu planen
                          </button>

                          <button
                            className="ex-btn ex-btn-warn"
                            onClick={handleCondenseOutline}
                            disabled={isPlanning || isGenerating || !activeBook.outline}
                            title="Kapitelnamen kürzen"
                          >
                            {isPlanning
                              ? <Loader2 className="spinner" style={{ width: '13px', height: '13px' }} />
                              : <Scissors style={{ width: '13px', height: '13px' }} />}
                            TOC einkürzen (AI)
                          </button>

                          {activeBook.outlineBackup && (
                            <button className="ex-btn ex-btn-restore" onClick={handleRestoreOutline}>
                              <RotateCw style={{ width: '13px', height: '13px' }} />
                              {activeBook.pagesTextBackup && Object.keys(activeBook.pagesTextBackup).length > 0
                                ? 'Gliederung & Seiten wiederherstellen'
                                : 'Gliederung wiederherstellen'}
                            </button>
                          )}

                          {activeBook.outline && Object.keys(activeBook.pagesText || {}).length > activeBook.outline.pages.length && (
                            <button className="ex-btn ex-btn-recover" onClick={handleRecoverOutlineFromPages}>
                              <RotateCw style={{ width: '13px', height: '13px' }} />
                              ⚠ {Object.keys(activeBook.pagesText || {}).length} Seiten wiederherstellen
                            </button>
                          )}

                          {activeBook.outline && activeBook.outline.pages.length < activeBook.targetPages && (
                            <button className="ex-btn ex-btn-recover" onClick={handleExtendOutline} disabled={isPlanning || isGenerating}>
                              {isPlanning
                                ? <><Loader2 className="spinner" style={{ width: '13px', height: '13px' }} />Erweitere...</>
                                : `Notfall: ${activeBook.outline.pages.length}/${activeBook.targetPages} — Rest ergänzen`}
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          {isPlanning && planningProgress && (
                            <div className="ex-progress-box">
                              <div className="ex-progress-info">
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Loader2 className="spinner" style={{ width: '10px', height: '10px' }} />
                                  {planningProgress.message}
                                </span>
                                <span>{planningProgress.percent}%</span>
                              </div>
                              <div className="ex-progress-track">
                                <div className="ex-progress-bar" style={{ width: `${planningProgress.percent}%` }} />
                              </div>
                            </div>
                          )}
                          <button
                            className="ex-btn ex-btn-generate"
                            onClick={handlePlanBook}
                            disabled={isPlanning || isGenerating || !activeBook.title?.trim()}
                          >
                            {isPlanning
                              ? <><Loader2 className="spinner" style={{ width: '13px', height: '13px' }} />Plane Gliederung...</>
                              : isGenerating
                              ? <><Loader2 className="spinner" style={{ width: '13px', height: '13px' }} />Schreibe Seiten...</>
                              : <><Play style={{ width: '13px', height: '13px', fill: 'currentColor' }} />Buch generieren</>}
                          </button>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* ── Amazon Beschreibung ── */}
                    <div className="ex-section-label">Amazon Listing</div>
                    <div className="ex-section">
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(29,78,216,0.06) 100%)',
                        border: '1px solid rgba(56,189,248,0.2)',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '28px', height: '28px', borderRadius: '7px',
                              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: '0 2px 8px rgba(37,99,235,0.4)'
                            }}>
                              <span style={{ fontSize: '13px' }}>📝</span>
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--ex-font)' }}>HTML Beschreibung</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--ex-font)' }}>Amazon KDP Produktseite</div>
                            </div>
                          </div>
                          {activeBook.amazonDescription && (
                            <span style={{
                              fontSize: '9px', fontWeight: 700, padding: '2px 8px',
                              borderRadius: '20px', background: 'rgba(56,189,248,0.12)',
                              color: 'var(--ex-nvidia)', border: '1px solid rgba(56,189,248,0.25)',
                              fontFamily: 'var(--ex-font)', letterSpacing: '0.04em'
                            }}>✓ BEREIT</span>
                          )}
                        </div>
                        <button
                          className="ex-btn ex-btn-generate"
                          onClick={handleGenerateAmazonDescription}
                          disabled={isGeneratingMarketing || isPlanning || isGenerating}
                        >
                          {isGeneratingMarketing
                            ? <><Loader2 className="animate-spin" style={{ width: '13px', height: '13px' }} />Generiere...</>
                            : <><Sparkles style={{ width: '13px', height: '13px' }} />Mit AI erstellen</>}
                        </button>
                      </div>

                      <div className="ex-field">
                        <textarea
                          className="ex-textarea"
                          rows={7}
                          value={activeBook.amazonDescription || ''}
                          onChange={e => updateActiveBookConfig('amazonDescription', e.target.value)}
                          placeholder="Füge hier deine Amazon HTML Beschreibung ein oder lass sie von der AI generieren..."
                          style={{ fontFamily: 'monospace', fontSize: '11px', lineHeight: '1.6' }}
                        />
                        {activeBook.amazonDescription && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--ex-font)' }}>
                              {activeBook.amazonDescription.length} Zeichen
                            </span>
                            <button
                              className="ex-btn ex-btn-ghost"
                              onClick={() => { navigator.clipboard.writeText(activeBook.amazonDescription || ''); alert('Beschreibung kopiert!'); }}
                              style={{ width: 'auto', padding: '5px 14px', fontSize: '11px' }}
                            >
                              <Copy style={{ width: '11px', height: '11px' }} />
                              HTML kopieren
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ex-divider" />

                    {/* ── Keywords ── */}
                    <div className="ex-section-label">Keywords & Ranking</div>
                    <div className="ex-section">
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(29,78,216,0.1) 0%, rgba(37,99,235,0.04) 100%)',
                        border: '1px solid rgba(56,189,248,0.15)',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '28px', height: '28px', borderRadius: '7px',
                              background: 'linear-gradient(135deg, #38bdf8, #2563eb)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: '0 2px 8px rgba(56,189,248,0.35)'
                            }}>
                              <span style={{ fontSize: '13px' }}>🔑</span>
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--ex-font)' }}>7 KDP Keywords</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--ex-font)' }}>SEO Optimierung</div>
                            </div>
                          </div>
                          {activeBook.kdpKeywords && activeBook.kdpKeywords.length > 0 && (
                            <span style={{
                              fontSize: '9px', fontWeight: 700, padding: '2px 8px',
                              borderRadius: '20px', background: 'rgba(56,189,248,0.12)',
                              color: 'var(--ex-nvidia)', border: '1px solid rgba(56,189,248,0.25)',
                              fontFamily: 'var(--ex-font)', letterSpacing: '0.04em'
                            }}>{activeBook.kdpKeywords.length}/7</span>
                          )}
                        </div>
                        <button
                          className="ex-btn ex-btn-plan"
                          onClick={handleGenerateKdpKeywords}
                          disabled={isGeneratingMarketing || isPlanning || isGenerating}
                        >
                          {isGeneratingMarketing
                            ? <><Loader2 className="animate-spin" style={{ width: '13px', height: '13px' }} />Optimiere...</>
                            : <><Sparkles style={{ width: '13px', height: '13px' }} />Keywords optimieren</>}
                        </button>
                      </div>

                      {activeBook.kdpKeywords && activeBook.kdpKeywords.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {activeBook.kdpKeywords.map((kw, idx) => (
                            <div key={idx} className="ex-kw-item" style={{ borderRadius: '8px', padding: '8px 12px' }}>
                              <span className="ex-kw-num" style={{ fontSize: '11px', fontWeight: 800 }}>{idx + 1}</span>
                              <span className="ex-kw-text" style={{ fontSize: '12px', fontWeight: 500 }}>{kw}</span>
                            </div>
                          ))}
                          <button
                            className="ex-btn ex-btn-ghost"
                            onClick={() => { navigator.clipboard.writeText((activeBook.kdpKeywords || []).join(', ')); alert('Keywords kopiert!'); }}
                            style={{ marginTop: '2px' }}
                          >
                            <Copy style={{ width: '12px', height: '12px' }} />
                            Alle kopieren (kommagetrennt)
                          </button>
                        </div>
                      ) : (
                        <div style={{
                          textAlign: 'center', padding: '16px 12px',
                          border: '1px dashed var(--ex-border)', borderRadius: '10px',
                          color: 'var(--text-muted)', fontSize: '11.5px',
                          fontFamily: 'var(--ex-font)', fontWeight: 500
                        }}>
                          Noch keine Keywords generiert
                        </div>
                      )}
                    </div>

                    <div className="ex-divider" />

                    {/* ── Kategorien ── */}
                    <div className="ex-section-label">Kategorien</div>
                    <div className="ex-section">
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(56,189,248,0.04) 100%)',
                        border: '1px solid rgba(56,189,248,0.15)',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '28px', height: '28px', borderRadius: '7px',
                              background: 'linear-gradient(135deg, #1d4ed8, #1e40af)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: '0 2px 8px rgba(29,78,216,0.35)'
                            }}>
                              <span style={{ fontSize: '13px' }}>📂</span>
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--ex-font)' }}>Kategorie-Finder</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--ex-font)' }}>Amazon Browse Node</div>
                            </div>
                          </div>
                          {activeBook.kdpCategories && activeBook.kdpCategories.length > 0 && (
                            <span style={{
                              fontSize: '9px', fontWeight: 700, padding: '2px 8px',
                              borderRadius: '20px', background: 'rgba(56,189,248,0.12)',
                              color: 'var(--ex-nvidia)', border: '1px solid rgba(56,189,248,0.25)',
                              fontFamily: 'var(--ex-font)', letterSpacing: '0.04em'
                            }}>{activeBook.kdpCategories.length} FOUND</span>
                          )}
                        </div>
                        <button
                          className="ex-btn ex-btn-ghost"
                          style={{ border: '1px solid rgba(56,189,248,0.3)', color: 'var(--ex-nvidia)' }}
                          onClick={handleGenerateKdpCategories}
                          disabled={isGeneratingMarketing || isPlanning || isGenerating}
                        >
                          {isGeneratingMarketing
                            ? <><Loader2 className="animate-spin" style={{ width: '13px', height: '13px' }} />Suche...</>
                            : <><Sparkles style={{ width: '13px', height: '13px' }} />Kategorien suchen</>}
                        </button>
                      </div>

                      {activeBook.kdpCategories && activeBook.kdpCategories.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {activeBook.kdpCategories.map((cat, idx) => (
                            <div key={idx} className="ex-cat-item" style={{ borderRadius: '8px', padding: '9px 12px', gap: '10px' }}>
                              <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--ex-nvidia)', flexShrink: 0 }}>#{idx + 1}</span>
                              <span className="ex-cat-text" style={{ fontSize: '11.5px', fontWeight: 500, lineHeight: '1.3' }}>{cat}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{
                          textAlign: 'center', padding: '16px 12px',
                          border: '1px dashed var(--ex-border)', borderRadius: '10px',
                          color: 'var(--text-muted)', fontSize: '11.5px',
                          fontFamily: 'var(--ex-font)', fontWeight: 500
                        }}>
                          Noch keine Kategorien vorgeschlagen
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Draggable Resizer Bar */}
            {!isExplorerCollapsed && <div className="resizer-bar" onMouseDown={startResizingLeft} />}

            {/* Center Panel: Status & Text Editor */}
            <div className="pane" style={{ flex: 1, minWidth: '300px' }}>
              <div className="pane-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isExplorerCollapsed && (
                    <button
                      onClick={() => {
                        setIsExplorerCollapsed(false);
                        localStorage.setItem('b24studio_left_collapsed', 'false');
                      }}
                      style={{
                        background: 'var(--primary-glow)',
                        border: '1px solid var(--primary)',
                        color: 'var(--primary)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        gap: '4px',
                        marginRight: '6px'
                      }}
                      title="Explorer ausklappen"
                    >
                      <ChevronRight style={{ width: '13px', height: '13px' }} />
                      <span>Explorer</span>
                    </button>
                  )}
                  <div className="pane-title">Schreibstudio</div>
                  {outline && (
                    <button
                      onClick={() => setShowGilInsights(prev => !prev)}
                      style={{
                        background: showGilInsights ? 'rgba(201, 150, 62, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: showGilInsights ? '1px solid #C9963E' : '1px solid rgba(140, 138, 130, 0.25)',
                        color: showGilInsights ? '#C9963E' : '#8C8A82',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        gap: '4px',
                        marginLeft: '8px',
                        outline: 'none',
                        transition: 'all 0.2s ease-in-out'
                      }}
                      title="GIL Insights Panel ein-/ausblenden"
                      className="gil-insights-toggle-btn"
                    >
                      <TrendingUp style={{ width: '13px', height: '13px' }} />
                      <span>Insights</span>
                    </button>
                  )}
                </div>
                <button 
                  onClick={handleDownloadPdf} 
                  disabled={!outline || (completedPagesCount === 0 && Object.keys(activeBook.pagesText || {}).length === 0)}
                  className="btn btn-success" 
                  style={{ 
                    padding: '4px 10px', 
                    fontSize: '10px',
                    opacity: (!outline || (completedPagesCount === 0 && Object.keys(activeBook.pagesText || {}).length === 0)) ? 0.5 : 1,
                    cursor: (!outline || (completedPagesCount === 0 && Object.keys(activeBook.pagesText || {}).length === 0)) ? 'not-allowed' : 'pointer',
                    flexShrink: 0
                  }}
                >
                  <FileDown style={{ width: '12px', height: '12px' }} /> PDF Download
                </button>
              </div>

              <div className="pane-content">
                {/* Custom Undo/Restore Banner for Outline Actions */}
                {activeBook.outlineBackup && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '10px 14px',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '8px',
                    marginBottom: '14px',
                    fontSize: '11.5px',
                    color: 'var(--text-main)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <RotateCw style={{ width: '13px', height: '13px', color: '#10b981' }} />
                      <span>
                        {activeBook.pagesTextBackup && Object.keys(activeBook.pagesTextBackup).length > 0
                          ? 'Gliederung wurde neu geplant oder geändert. Möchtest du den vorherigen Stand (inkl. Seiteninhalte) wiederherstellen?'
                          : 'Gliederung wurde geändert (Kapitelkürzung / TOC-Regenerierung). Möchtest du sie auf den vorherigen Stand zurücksetzen?'
                        }
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={handleRestoreOutline}
                        className="btn"
                        style={{
                          padding: '4px 10px',
                          fontSize: '10.5px',
                          backgroundColor: '#10b981',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'opacity 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                        onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                      >
                        {activeBook.pagesTextBackup && Object.keys(activeBook.pagesTextBackup).length > 0
                          ? `Gliederung & Seiten wiederherstellen (${activeBook.outlineBackup.length} S.)`
                          : `Gliederung wiederherstellen (${activeBook.outlineBackup.length} S.)`
                        }
                      </button>
                      <button
                        onClick={() => {
                          setBooks(prev => prev.map(b => {
                            if (b.id === activeBookId) {
                              return {
                                ...b,
                                outlineBackup: undefined,
                                fullOutlineBackup: undefined,
                                pagesTextBackup: undefined,
                                pagesStatusBackup: undefined,
                                pagesErrorBackup: undefined
                              };
                            }
                            return b;
                          }));
                        }}
                        className="btn"
                        style={{
                          padding: '4px 10px',
                          fontSize: '10.5px',
                          backgroundColor: 'transparent',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '5px',
                          cursor: 'pointer'
                        }}
                      >
                        Behalten
                      </button>
                    </div>
                  </div>
                )}

                {/* Generation Status Progress bar */}
                {outline && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                    <div className="flex-space" style={{ alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        Fortschritt: {completedPagesCount} von {totalPagesCount} Seiten ({progressPercent}%)
                      </span>
                      {completedPagesCount < totalPagesCount && !isGenerating && (
                        <button 
                          onClick={() => triggerPageWriting(outline, activeBook.id)}
                          className="btn"
                          style={{ padding: '4px 10px', fontSize: '10px', fontWeight: 700, height: '24px', display: 'flex', alignItems: 'center', gap: '5px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', border: '1px solid #38bdf8', borderRadius: '6px', boxShadow: '0 2px 8px rgba(37,99,235,0.3)', cursor: 'pointer' }}
                        >
                          <Play style={{ width: '10px', height: '10px', fill: 'currentColor' }} />
                          Alle nicht generierten Seiten generieren
                        </button>
                      )}
                      {isGenerating && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '9.5px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Loader2 className="spinner" style={{ width: '10px', height: '10px' }} />
                            Generiere Seiten...
                          </span>
                          <button 
                            onClick={() => { cancelGenerationRef.current = true; }}
                            className="btn btn-danger"
                            style={{ padding: '2px 6px', fontSize: '9px', height: '18px', display: 'flex', alignItems: 'center' }}
                          >
                            Abbrechen
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="progress-track">
                      <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
                    </div>

                    {selectedPages.length > 1 && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        padding: '12px',
                        background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(56,189,248,0.03))',
                        border: '1px solid rgba(56,189,248,0.25)',
                        borderRadius: '10px',
                        fontSize: '11px',
                        marginTop: '6px',
                        marginBottom: '4px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '11.5px' }}>
                            {selectedPages.length} Seiten gewählt
                          </span>
                        </div>
                        
                        {/* Bulk chapter rename / merge */}
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                          <input 
                            type="text"
                            placeholder="Gemeinsamen Kapitelnamen eingeben..."
                            value={bulkChapterTitle}
                            onChange={(e) => setBulkChapterTitle(e.target.value)}
                            className="ex-input-sleek"
                            style={{ flex: 1, height: '28px' }}
                          />
                          <button
                            onClick={handleApplyBulkChapterTitle}
                            className="btn"
                            style={{ padding: '4px 12px', fontSize: '11px', fontWeight: 700, height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', border: '1px solid #38bdf8', borderRadius: '6px' }}
                            title="Alle markierten Seiten unter diesem Kapitelnamen zusammenführen"
                          >
                            Zusammenführen / Umbenennen
                          </button>
                        </div>

                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                          <button
                            onClick={() => {
                              const current = activeBook.pagesHideChapter || [];
                              const next = Array.from(new Set([...current, ...selectedPages]));
                              updateActiveBookConfig('pagesHideChapter', next);
                            }}
                            className="btn"
                            style={{ padding: '2px 8px', fontSize: '9.5px', height: '22px', backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                            title="Kapitelüberschriften für ausgewählte Seiten ausblenden"
                          >
                            <EyeOff style={{ width: '10px', height: '10px' }} /> Kapitel aus
                          </button>
                          <button
                            onClick={() => {
                              const current = activeBook.pagesHideChapter || [];
                              const next = current.filter(n => !selectedPages.includes(n));
                              updateActiveBookConfig('pagesHideChapter', next);
                            }}
                            className="btn"
                            style={{ padding: '2px 8px', fontSize: '9.5px', height: '22px', backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                            title="Kapitelüberschriften für ausgewählte Seiten einblenden"
                          >
                            <Eye style={{ width: '10px', height: '10px' }} /> Kapitel ein
                          </button>
                          <button
                            onClick={() => {
                              const current = activeBook.pagesHideRunningHeader || [];
                              const next = Array.from(new Set([...current, ...selectedPages]));
                              updateActiveBookConfig('pagesHideRunningHeader', next);
                            }}
                            className="btn"
                            style={{ padding: '2px 8px', fontSize: '9.5px', height: '22px', backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                            title="Kopfzeilen für ausgewählte Seiten ausblenden"
                          >
                            <EyeOff style={{ width: '10px', height: '10px' }} /> Kopfzeile aus
                          </button>
                          <button
                            onClick={() => {
                              const current = activeBook.pagesHideRunningHeader || [];
                              const next = current.filter(n => !selectedPages.includes(n));
                              updateActiveBookConfig('pagesHideRunningHeader', next);
                            }}
                            className="btn"
                            style={{ padding: '2px 8px', fontSize: '9.5px', height: '22px', backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                            title="Kopfzeilen für ausgewählte Seiten einblenden"
                          >
                            <Eye style={{ width: '10px', height: '10px' }} /> Kopfzeile ein
                          </button>
                          <button
                            onClick={() => {
                              const current = activeBook.pagesInitial || [];
                              const next = Array.from(new Set([...current, ...selectedPages]));
                              updateActiveBookConfig('pagesInitial', next);
                            }}
                            className="btn"
                            style={{ padding: '2px 8px', fontSize: '9.5px', height: '22px', backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                            title="Initiale (Drop Cap) für ausgewählte Seiten aktivieren"
                          >
                            <span style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'Georgia, serif', lineHeight: 1 }}>I</span> Initiale ein
                          </button>
                          <button
                            onClick={() => {
                              const current = activeBook.pagesInitial || [];
                              const next = current.filter(n => !selectedPages.includes(n));
                              updateActiveBookConfig('pagesInitial', next);
                            }}
                            className="btn"
                            style={{ padding: '2px 8px', fontSize: '9.5px', height: '22px', backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                            title="Initiale (Drop Cap) für ausgewählte Seiten deaktivieren"
                          >
                            <span style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'Georgia, serif', lineHeight: 1, opacity: 0.4 }}>I</span> Initiale aus
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Special Pages: Titelblatt & TOC */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px', marginTop: '6px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => { setSelectedPage('title'); setSelectedPages([]); }}
                          style={{
                            flex: 1,
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '4px 8px',
                            borderRadius: '6px',
                            backgroundColor: selectedPage === 'title' ? 'var(--primary)' : 'var(--bg-card)',
                            color: selectedPage === 'title' ? '#ffffff' : 'var(--text-muted)',
                            border: '1px solid var(--border-color)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          Titelblatt
                        </button>
                        
                        {activeBook.generateTOC !== false && (() => {
                          const tocPages = getTOCPages();
                          if (tocPages.length <= 1) {
                            return (
                              <button
                                onClick={() => { setSelectedPage('toc_0'); setSelectedPages([]); }}
                                style={{
                                  flex: 1,
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: selectedPage === 'toc_0' || selectedPage === 'toc' ? 'var(--primary)' : 'var(--bg-card)',
                                  color: selectedPage === 'toc_0' || selectedPage === 'toc' ? '#ffffff' : 'var(--text-muted)',
                                  border: '1px solid var(--border-color)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px'
                                }}
                              >
                                Verzeichnis
                              </button>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      {activeBook.generateTOC !== false && (() => {
                        const tocPages = getTOCPages();
                        if (tocPages.length > 1) {
                          return (
                            <div style={{ display: 'flex', gap: '4px', width: '100%' }}>
                              {tocPages.map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => { setSelectedPage(`toc_${idx}`); setSelectedPages([]); }}
                                  style={{
                                    flex: 1,
                                    fontSize: '9px',
                                    fontWeight: 600,
                                    padding: '4px 6px',
                                    borderRadius: '6px',
                                    backgroundColor: selectedPage === `toc_${idx}` ? 'var(--primary)' : 'var(--bg-card)',
                                    color: selectedPage === `toc_${idx}` ? '#ffffff' : 'var(--text-muted)',
                                    border: '1px solid var(--border-color)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '3px',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  Verzeichnis {idx + 1}
                                </button>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      <button
                        onClick={handleCondenseOutline}
                        title="Verkürzt das Inhaltsverzeichnis (z.B. wenn es zu lang ist)."
                        style={{
                          width: '100%',
                          fontSize: '9.5px',
                          fontWeight: 600,
                          padding: '5px 8px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(56, 189, 248, 0.08)',
                          color: '#38bdf8',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          marginTop: '4px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Scissors style={{ width: '10px', height: '10px' }} />
                        Inhaltsverzeichnis kürzen
                      </button>


                      {activeBook.outlineBackup && (
                        <button
                          onClick={handleRestoreOutline}
                          style={{
                            width: '100%',
                            fontSize: '9.5px',
                            fontWeight: 600,
                            padding: '5px 8px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(16, 185, 129, 0.08)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            marginTop: '2px'
                          }}
                        >
                          <RotateCw style={{ width: '10px', height: '10px' }} />
                          {activeBook.pagesTextBackup && Object.keys(activeBook.pagesTextBackup).length > 0
                            ? `Gliederung & Seiten wiederherstellen (${activeBook.outlineBackup.length} S.)`
                            : `Gliederung wiederherstellen (${activeBook.outlineBackup.length} S.)`
                          }
                        </button>
                      )}

                      {activeBook.outline && Object.keys(activeBook.pagesText || {}).length > activeBook.outline.pages.length && (
                        <button
                          onClick={handleRecoverOutlineFromPages}
                          style={{
                            width: '100%',
                            fontSize: '9.5px',
                            fontWeight: 600,
                            padding: '5px 8px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(239, 68, 68, 0.08)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            marginTop: '2px'
                          }}
                          title="Gliederung aus vorhandenem Seiteninhalt rekonstruieren"
                        >
                          <RotateCw style={{ width: '10px', height: '10px' }} />
                          ⚠️ {Object.keys(activeBook.pagesText || {}).length} Seiten wiederherstellen
                        </button>
                      )}

                      <button
                        onClick={handleRegenerateChaptersFromContent}
                        disabled={isPlanning || isGenerating || !activeBook.outline}
                        style={{
                          width: '100%',
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(29,78,216,0.05))',
                          color: '#38bdf8',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          marginTop: '4px',
                          transition: 'all 0.15s ease'
                        }}
                        title="Die KI analysiert den Text aller bereits geschriebenen Seiten und erstellt das Inhaltsverzeichnis passend dazu neu."
                      >
                        {isPlanning ? (
                          <>
                            <Loader2 className="animate-spin" style={{ width: '10px', height: '10px' }} />
                            <span>Inhaltsverzeichnis wird generiert...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles style={{ width: '10px', height: '10px' }} />
                            <span>Inhaltsverzeichnis aus Buchseiten regenerieren</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Page Navigator Grid Map */}
                    <div className="pages-grid" style={{ marginTop: '4px' }}>
                      {outline.pages.map((p) => {
                        const status = (activeBook.pagesStatus || {})[p.page_number] || 'idle';
                        const isSelected = selectedPages.includes(p.page_number);
                        const hasOverflow = (activeBook.pagesOverflow || {})[p.page_number] || false;
                        const isCurrentPreview = selectedPage === p.page_number;
                        
                        let statusClass = '';
                        if (status === 'generating') statusClass = 'generating';
                        else if (status === 'completed') statusClass = hasOverflow ? 'failed' : 'completed';
                        else if (status === 'failed') statusClass = 'failed';

                        return (
                          <button
                            key={p.page_number}
                            onClick={(e) => handlePageClick(p.page_number, e)}
                            className={`page-btn ${statusClass} ${isSelected ? 'active' : ''} ${hasOverflow ? 'overflow-warning' : ''}`}
                            style={isCurrentPreview ? {
                              borderWidth: '2px',
                              borderColor: 'var(--accent)',
                              boxShadow: '0 0 0 2px rgba(161, 66, 244, 0.2)'
                            } : undefined}
                          >
                            <span style={{ fontSize: '9px', fontWeight: isSelected ? 700 : 600, fontFamily: isSelected ? "'Plus Jakarta Sans', 'Google Sans', sans-serif" : 'inherit' }}>S. {p.page_number}</span>
                            {status === 'generating' && <Loader2 className="spinner" style={{ width: '9px', height: '9px', marginTop: '1px' }} />}
                            {status === 'completed' && !hasOverflow && <CheckCircle2 style={{ width: '9px', height: '9px', color: isSelected ? '#ffffff' : 'var(--success)', marginTop: '1px' }} />}
                            {status === 'completed' && hasOverflow && <AlertCircle style={{ width: '9px', height: '9px', color: 'var(--error)', marginTop: '1px' }} />}
                            {status === 'failed' && <AlertCircle style={{ width: '9px', height: '9px', color: 'var(--error)', marginTop: '1px' }} />}
                            {(activeBook.cmieStatus || {})[p.page_number] === 'similar' && (
                              <span title="CMIE: Ähnlichkeit zu früherem Kapitel" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#eab308', display: 'inline-block', marginLeft: '2px' }}></span>
                            )}
                            {(activeBook.cmieStatus || {})[p.page_number] === 'review_needed' && (
                              <span title="CMIE: Copyright Warnung (>15 Wörter Exakt-Match)" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block', marginLeft: '2px' }}></span>
                            )}
                            {(activeBook.cmieStatus || {})[p.page_number] === 'ok' && status === 'completed' && !hasOverflow && (
                              <span title="CMIE Integrität bestätigt" style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#38bdf8', display: 'inline-block', marginLeft: '2px' }}></span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedPage === 'title' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, padding: '16px 20px', border: '1px dashed var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-card)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>Titelblatt konfigurieren</h3>
                      <button
                        onClick={() => updateActiveBookConfig('hideTitlePage', !activeBook.hideTitlePage)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '10px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          color: activeBook.hideTitlePage ? 'var(--text-danger)' : 'var(--text-muted)',
                          padding: 0,
                          opacity: 0.8,
                          transition: 'opacity 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.opacity = '1'}
                        onMouseOut={e => e.currentTarget.style.opacity = '0.8'}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
                          {activeBook.hideTitlePage ? (
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
                          ) : (
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
                          )}
                        </svg>
                        <span>{activeBook.hideTitlePage ? 'AUSGEBLENDET' : 'SICHTBAR'}</span>
                      </button>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)' }}>Buchtitel</label>
                      <input 
                        type="text" 
                        value={activeBook.title}
                        onChange={e => updateActiveBookConfig('title', e.target.value)}
                        placeholder="Buchtitel eingeben..."
                        style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '11.5px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)' }}>Untertitel</label>
                      <input 
                        type="text" 
                        value={activeBook.subtitle || ''}
                        onChange={e => updateActiveBookConfig('subtitle', e.target.value)}
                        placeholder="Untertitel eingeben..."
                        style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '11.5px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)' }}>Autorenname</label>
                      <input 
                        type="text" 
                        value={activeBook.authorName || ''}
                        onChange={e => updateActiveBookConfig('authorName', e.target.value)}
                        placeholder="Name des Autors..."
                        style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '11.5px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)' }}>Herausgeber / Verlag</label>
                      <input 
                        type="text" 
                        value={activeBook.publisherLine || ''}
                        onChange={e => updateActiveBookConfig('publisherLine', e.target.value)}
                        placeholder="z.B. KDP Studio Edition"
                        style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '11.5px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px dashed var(--border-color)', paddingTop: '10px' }}>
                      <label style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)' }}>Titelbild / Emblem</label>
                      <select 
                        value={activeBook.titlePageEmblem || 'geometric'}
                        onChange={e => updateActiveBookConfig('titlePageEmblem', e.target.value)}
                        style={{ padding: '6px 10px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '11.5px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', cursor: 'pointer' }}
                      >
                        <option value="geometric">Geometrisches Emblem (Standard)</option>
                        <option value="floral">Florales Ornament (Kleeblatt)</option>
                        <option value="star">Klassische Windrose / Stern</option>
                        <option value="book">Minimales Buch-Symbol</option>
                        <option value="custom">Eigenes Titelbild (Lokale Datei)</option>
                      </select>
                    </div>

                    {activeBook.titlePageEmblem === 'custom' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)' }}>Titelbild hochladen (Vom Desktop)</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const img = new Image();
                                  img.onload = () => {
                                    const maxDim = 500;
                                    let w = img.width;
                                    let h = img.height;
                                    if (w > maxDim || h > maxDim) {
                                      if (w > h) {
                                        h = Math.round((h * maxDim) / w);
                                        w = maxDim;
                                      } else {
                                        w = Math.round((w * maxDim) / h);
                                        h = maxDim;
                                      }
                                    }
                                    const canvas = document.createElement('canvas');
                                    canvas.width = w;
                                    canvas.height = h;
                                    const ctx = canvas.getContext('2d');
                                    if (ctx) {
                                      ctx.fillStyle = '#ffffff';
                                      ctx.fillRect(0, 0, w, h);
                                      ctx.drawImage(img, 0, 0, w, h);
                                      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
                                      updateActiveBookConfig('titlePageImage', compressedBase64);
                                    }
                                  };
                                  img.src = event.target?.result as string;
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            style={{ display: 'none' }}
                            id="cover-image-upload"
                          />
                          <label 
                            htmlFor="cover-image-upload" 
                            className="btn btn-primary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '6px 12px', fontSize: '11px', height: '28px', whiteSpace: 'nowrap' }}
                          >
                            📁 Bild auswählen
                          </label>
                          {activeBook.titlePageImage && (
                            <button 
                              onClick={() => updateActiveBookConfig('titlePageImage', '')}
                              className="btn btn-danger"
                              style={{ padding: '6px 12px', fontSize: '11px', height: '28px' }}
                            >
                              Löschen
                            </button>
                          )}
                        </div>
                        {activeBook.titlePageImage && activeBook.titlePageImage.startsWith('data:') && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', backgroundColor: 'var(--input-bg)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <img src={activeBook.titlePageImage} alt="Vorschau" style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px', backgroundColor: '#fff', border: '1px solid var(--border-color)' }} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-main)' }}>Bild geladen</span>
                              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Lokale Datei</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px dashed var(--border-color)', paddingTop: '10px' }}>
                      <label style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)' }}>Titel-Position</label>
                      <select 
                        value={activeBook.titlePageLayout || 'centered'}
                        onChange={e => updateActiveBookConfig('titlePageLayout', e.target.value)}
                        style={{ padding: '6px 10px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '11.5px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', cursor: 'pointer' }}
                      >
                        <option value="centered">Zentriert in der Mitte</option>
                        <option value="top_centered">Zentriert Oben</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px dashed var(--border-color)', paddingTop: '10px' }}>
                      <label style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)' }}>Zierrahmen (Ränder)</label>
                      <select 
                        value={activeBook.titlePageShowBorders !== false ? 'true' : 'false'}
                        onChange={e => updateActiveBookConfig('titlePageShowBorders', e.target.value === 'true')}
                        style={{ padding: '6px 10px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '11.5px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', cursor: 'pointer' }}
                      >
                        <option value="true">Zierrahmen anzeigen (Ein)</option>
                        <option value="false">Zierrahmen ausblenden (Aus)</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dashed var(--border-color)', paddingTop: '10px' }}>
                      <label style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)' }}>Bild / Emblem anpassen</label>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--text-main)' }}>
                          <span>Größe ({activeBook.titlePageImageScale || 60} pt)</span>
                          <button 
                            onClick={() => updateActiveBookConfig('titlePageImageScale', 60)}
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '9px', padding: 0 }}
                          >Reset</button>
                        </div>
                        <input 
                          type="range" 
                          min="20" 
                          max="200" 
                          value={activeBook.titlePageImageScale || 60}
                          onChange={e => updateActiveBookConfig('titlePageImageScale', Number(e.target.value))}
                          style={{ width: '100%', height: '4px', cursor: 'pointer' }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--text-main)' }}>
                            <span>Verschieben X ({activeBook.titlePageImageX || 0})</span>
                            <button 
                              onClick={() => updateActiveBookConfig('titlePageImageX', 0)}
                              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '9px', padding: 0 }}
                            >Reset</button>
                          </div>
                          <input 
                            type="range" 
                            min="-150" 
                            max="150" 
                            value={activeBook.titlePageImageX || 0}
                            onChange={e => updateActiveBookConfig('titlePageImageX', Number(e.target.value))}
                            style={{ width: '100%', height: '4px', cursor: 'pointer' }}
                          />
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--text-main)' }}>
                            <span>Verschieben Y ({activeBook.titlePageImageY || 0})</span>
                            <button 
                              onClick={() => updateActiveBookConfig('titlePageImageY', 0)}
                              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '9px', padding: 0 }}
                            >Reset</button>
                          </div>
                          <input 
                            type="range" 
                            min="-250" 
max="250" 
                            value={activeBook.titlePageImageY || 0}
                            onChange={e => updateActiveBookConfig('titlePageImageY', Number(e.target.value))}
                            style={{ width: '100%', height: '4px', cursor: 'pointer' }}
                          />
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dashed var(--border-color)', paddingTop: '10px' }}>
                      <details style={{ width: '100%' }}>
                        <summary style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', gap: '4px', userSelect: 'none' }}>
                          <span>✍️ Typografie & Ausrichtung anpassen</span>
                        </summary>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px', padding: '6px 2px' }}>
                          
                          {/* Title Styling */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '2px solid var(--primary)', paddingLeft: '8px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-main)' }}>Buchtitel (Überschrift)</span>
                            
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <label style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Ausrichtung</label>
                                <select 
                                  value={activeBook.titlePageTitleAlign || 'center'}
                                  onChange={e => updateActiveBookConfig('titlePageTitleAlign', e.target.value)}
                                  style={{ padding: '4px 6px', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '10px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
                                >
                                  <option value="center">Zentriert</option>
                                  <option value="left">Links</option>
                                  <option value="right">Rechts</option>
                                </select>
                              </div>
                              
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <label style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Schriftart</label>
                                <select 
                                  value={activeBook.titlePageTitleFont || 'playfair'}
                                  onChange={e => updateActiveBookConfig('titlePageTitleFont', e.target.value)}
                                  style={{ padding: '4px 6px', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '10px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
                                >
                                  {COVER_FONTS.map(f => (
                                    <option key={f.value} value={f.value}>{f.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--text-main)' }}>
                                <span>Größe ({activeBook.titlePageTitleSize || 28} pt)</span>
                                <button 
                                  onClick={() => updateActiveBookConfig('titlePageTitleSize', 28)}
                                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '8.5px', padding: 0 }}
                                >Reset</button>
                              </div>
                              <input 
                                type="range" 
                                min="12" 
                                max="60" 
                                value={activeBook.titlePageTitleSize || 28}
                                onChange={e => updateActiveBookConfig('titlePageTitleSize', Number(e.target.value))}
                                style={{ width: '100%', height: '3px', cursor: 'pointer' }}
                              />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--text-main)' }}>
                                <span>Verschiebung X ({activeBook.titlePageTitleX || 0} pt)</span>
                                <button 
                                  onClick={() => updateActiveBookConfig('titlePageTitleX', 0)}
                                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '8.5px', padding: 0 }}
                                >Reset</button>
                              </div>
                              <input 
                                type="range" 
                                min="-100" 
                                max="100" 
                                value={activeBook.titlePageTitleX || 0}
                                onChange={e => updateActiveBookConfig('titlePageTitleX', Number(e.target.value))}
                                style={{ width: '100%', height: '3px', cursor: 'pointer' }}
                              />
                            </div>
                          </div>

                          {/* Subtitle Styling */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '2px solid var(--primary)', paddingLeft: '8px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-main)' }}>Untertitel</span>
                            
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <label style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Ausrichtung</label>
                                <select 
                                  value={activeBook.titlePageSubtitleAlign || 'center'}
                                  onChange={e => updateActiveBookConfig('titlePageSubtitleAlign', e.target.value)}
                                  style={{ padding: '4px 6px', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '10px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
                                >
                                  <option value="center">Zentriert</option>
                                  <option value="left">Links</option>
                                  <option value="right">Rechts</option>
                                </select>
                              </div>
                              
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <label style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Schriftart</label>
                                <select 
                                  value={activeBook.titlePageSubtitleFont || 'times'}
                                  onChange={e => updateActiveBookConfig('titlePageSubtitleFont', e.target.value)}
                                  style={{ padding: '4px 6px', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '10px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
                                >
                                  {COVER_FONTS.map(f => (
                                    <option key={f.value} value={f.value}>{f.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--text-main)' }}>
                                <span>Größe ({activeBook.titlePageSubtitleSize || 12} pt)</span>
                                <button 
                                  onClick={() => updateActiveBookConfig('titlePageSubtitleSize', 12)}
                                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '8.5px', padding: 0 }}
                                >Reset</button>
                              </div>
                              <input 
                                type="range" 
                                min="8" 
                                max="32" 
                                value={activeBook.titlePageSubtitleSize || 12}
                                onChange={e => updateActiveBookConfig('titlePageSubtitleSize', Number(e.target.value))}
                                style={{ width: '100%', height: '3px', cursor: 'pointer' }}
                              />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--text-main)' }}>
                                <span>Verschiebung X ({activeBook.titlePageSubtitleX || 0} pt)</span>
                                <button 
                                  onClick={() => updateActiveBookConfig('titlePageSubtitleX', 0)}
                                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '8.5px', padding: 0 }}
                                >Reset</button>
                              </div>
                              <input 
                                type="range" 
                                min="-100" 
                                max="100" 
                                value={activeBook.titlePageSubtitleX || 0}
                                onChange={e => updateActiveBookConfig('titlePageSubtitleX', Number(e.target.value))}
                                style={{ width: '100%', height: '3px', cursor: 'pointer' }}
                              />
                            </div>
                          </div>

                          {/* Author Styling */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '2px solid var(--primary)', paddingLeft: '8px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-main)' }}>Autorenname</span>
                            
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <label style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Ausrichtung</label>
                                <select 
                                  value={activeBook.titlePageAuthorAlign || 'center'}
                                  onChange={e => updateActiveBookConfig('titlePageAuthorAlign', e.target.value)}
                                  style={{ padding: '4px 6px', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '10px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
                                >
                                  <option value="center">Zentriert</option>
                                  <option value="left">Links</option>
                                  <option value="right">Rechts</option>
                                </select>
                              </div>
                              
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <label style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Schriftart</label>
                                <select 
                                  value={activeBook.titlePageAuthorFont || 'times'}
                                  onChange={e => updateActiveBookConfig('titlePageAuthorFont', e.target.value)}
                                  style={{ padding: '4px 6px', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '10px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
                                >
                                  {COVER_FONTS.map(f => (
                                    <option key={f.value} value={f.value}>{f.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--text-main)' }}>
                                <span>Größe ({activeBook.titlePageAuthorSize || 14} pt)</span>
                                <button 
                                  onClick={() => updateActiveBookConfig('titlePageAuthorSize', 14)}
                                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '8.5px', padding: 0 }}
                                >Reset</button>
                              </div>
                              <input 
                                type="range" 
                                min="8" 
                                max="32" 
                                value={activeBook.titlePageAuthorSize || 14}
                                onChange={e => updateActiveBookConfig('titlePageAuthorSize', Number(e.target.value))}
                                style={{ width: '100%', height: '3px', cursor: 'pointer' }}
                              />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--text-main)' }}>
                                <span>Verschiebung X ({activeBook.titlePageAuthorX || 0} pt)</span>
                                <button 
                                  onClick={() => updateActiveBookConfig('titlePageAuthorX', 0)}
                                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '8.5px', padding: 0 }}
                                >Reset</button>
                              </div>
                              <input 
                                type="range" 
                                min="-100" 
                                max="100" 
                                value={activeBook.titlePageAuthorX || 0}
                                onChange={e => updateActiveBookConfig('titlePageAuthorX', Number(e.target.value))}
                                style={{ width: '100%', height: '3px', cursor: 'pointer' }}
                              />
                            </div>
                          </div>

                          {/* Publisher Styling */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '2px solid var(--primary)', paddingLeft: '8px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-main)' }}>Herausgeber / Verlag</span>
                            
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <label style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Ausrichtung</label>
                                <select 
                                  value={activeBook.titlePagePublisherAlign || 'center'}
                                  onChange={e => updateActiveBookConfig('titlePagePublisherAlign', e.target.value)}
                                  style={{ padding: '4px 6px', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '10px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
                                >
                                  <option value="center">Zentriert</option>
                                  <option value="left">Links</option>
                                  <option value="right">Rechts</option>
                                </select>
                              </div>
                              
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <label style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Schriftart</label>
                                <select 
                                  value={activeBook.titlePagePublisherFont || 'times'}
                                  onChange={e => updateActiveBookConfig('titlePagePublisherFont', e.target.value)}
                                  style={{ padding: '4px 6px', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '10px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
                                >
                                  {COVER_FONTS.map(f => (
                                    <option key={f.value} value={f.value}>{f.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--text-main)' }}>
                                <span>Größe ({activeBook.titlePagePublisherSize || 10} pt)</span>
                                <button 
                                  onClick={() => updateActiveBookConfig('titlePagePublisherSize', 10)}
                                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '8.5px', padding: 0 }}
                                >Reset</button>
                              </div>
                              <input 
                                type="range" 
                                min="8" 
                                max="24" 
                                value={activeBook.titlePagePublisherSize || 10}
                                onChange={e => updateActiveBookConfig('titlePagePublisherSize', Number(e.target.value))}
                                style={{ width: '100%', height: '3px', cursor: 'pointer' }}
                              />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--text-main)' }}>
                                <span>Verschiebung X ({activeBook.titlePagePublisherX || 0} pt)</span>
                                <button 
                                  onClick={() => updateActiveBookConfig('titlePagePublisherX', 0)}
                                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '8.5px', padding: 0 }}
                                >Reset</button>
                              </div>
                              <input 
                                type="range" 
                                min="-100" 
                                max="100" 
                                value={activeBook.titlePagePublisherX || 0}
                                onChange={e => updateActiveBookConfig('titlePagePublisherX', Number(e.target.value))}
                                style={{ width: '100%', height: '3px', cursor: 'pointer' }}
                              />
                            </div>
                          </div>

                        </div>
                      </details>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px dashed var(--border-color)', paddingTop: '10px' }}>
                      <label style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)' }}>Zielgruppe für KI-Untertitel (optional)</label>
                      <input 
                        type="text" 
                        value={titlePageTargetAudience}
                        onChange={e => setTitlePageTargetAudience(e.target.value)}
                        placeholder="z.B. Einsteiger, Fortgeschrittene, Kinder..."
                        style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '11.5px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none' }}
                      />
                    </div>

                    <button
                      onClick={handleGenerateTitlePageOptions}
                      className="btn btn-primary"
                      style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
                      disabled={isGeneratingTitleOptions || !activeBook.title}
                    >
                      {isGeneratingTitleOptions ? (
                        <>
                          <Loader2 className="spinner" style={{ width: '12px', height: '12px' }} />
                          Vorschläge werden generiert...
                        </>
                      ) : (
                        <span>🪄 KI-Untertitel & Verlagsvorschläge</span>
                      )}
                    </button>

                    {titlePageOptions && titlePageOptions.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px' }}>
                        {titlePageOptions.map((opt, idx) => (
                          <div 
                            key={idx}
                            onClick={() => {
                              updateActiveBookConfig('subtitle', opt.untertitel);
                              updateActiveBookConfig('publisherLine', opt.verlagszeile);
                            }}
                            className="btn"
                            style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'start', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'var(--bg-main)', cursor: 'pointer', textAlign: 'left', width: '100%', boxSizing: 'border-box' }}
                          >
                            <span style={{ fontSize: '8px', fontWeight: 'bold', backgroundColor: 'var(--primary-glow)', color: 'var(--primary)', padding: '1px 4px', borderRadius: '3px' }}>
                              Variante {opt.variante}: {opt.variante === 'A' ? 'Sachlich' : opt.variante === 'B' ? 'Emotional' : 'Dringlich'}
                            </span>
                            <div style={{ fontSize: '10.5px', fontWeight: 'bold', color: 'var(--text-main)', whiteSpace: 'normal', wordBreak: 'break-word' }}>{opt.untertitel}</div>
                            <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Durch: {opt.verlagszeile}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <p style={{ fontSize: '9.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                      Jede Änderung wird sofort live in der rechten Buchvorschau auf dem Titelblatt gerendert.
                    </p>
                  </div>
                ) : (selectedPage === 'toc' || (typeof selectedPage === 'string' && selectedPage.startsWith('toc'))) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, padding: '16px 20px', border: '1px dashed var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-card)' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>Inhaltsverzeichnis (TOC)</h3>
                    <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                      Das Inhaltsverzeichnis wird vollautomatisch generiert. Jedes Kapitel beginnt auf einer ungeraden (rechten) Seite im gedruckten Buch.
                    </p>
                    <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                      In der rechten Vorschau siehst du den genauen aktuellen Buchsatz der Gliederung mit den korrekten lückenlosen Seitenzahlen.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
                      <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>Layout & Typografie</h4>
                      
                      {/* Font Family Selection */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>Schriftart</label>
                        <select
                          value={activeBook.tocFontFamily || ''}
                          onChange={e => updateActiveBookConfig('tocFontFamily', e.target.value)}
                          className="form-select"
                          style={{ width: '100%', padding: '6px', fontSize: '11px', borderRadius: '4px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                        >
                          <option value="">(Wie Buchtext: {(COVER_FONTS.find(f => f.value === activeBook.fontFamily) || { label: activeBook.fontFamily }).label})</option>
                          {COVER_FONTS.map(f => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Font Size Selection */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>
                          <span>Schriftgröße ({activeBook.tocFontSize || 10} pt)</span>
                          <button 
                            onClick={() => updateActiveBookConfig('tocFontSize', 10)}
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '8.5px', padding: 0 }}
                          >Reset</button>
                        </div>
                        <input 
                          type="range" 
                          min="6" 
                          max="18" 
                          step="0.5"
                          value={activeBook.tocFontSize || 10}
                          onChange={e => updateActiveBookConfig('tocFontSize', Number(e.target.value))}
                          style={{ width: '100%', height: '3px', cursor: 'pointer' }}
                        />
                      </div>

                      {/* Spacing Selection */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>
                          <span>Zeilenabstand ({activeBook.tocLineSpacing || 18} pt)</span>
                          <button 
                            onClick={() => updateActiveBookConfig('tocLineSpacing', 18)}
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '8.5px', padding: 0 }}
                          >Reset</button>
                        </div>
                        <input 
                          type="range" 
                          min="12" 
                          max="36" 
                          step="1"
                          value={activeBook.tocLineSpacing || 18}
                          onChange={e => updateActiveBookConfig('tocLineSpacing', Number(e.target.value))}
                          style={{ width: '100%', height: '3px', cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  </div>
                ) : selectedPage !== null ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '6px', 
                      paddingBottom: '8px', 
                      borderBottom: '1px solid var(--border-color)',
                      marginBottom: '2px'
                    }}>
                      <div className="flex-space" style={{ alignItems: 'center', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ 
                            fontSize: '9.5px', 
                            fontWeight: 'bold', 
                            color: 'var(--primary)', 
                            backgroundColor: 'rgba(99, 102, 241, 0.1)', 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em'
                          }}>
                            Seite {selectedPage}
                          </span>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>bearbeiten</span>
                        </div>

                        {/* Segmented controls for Lengthen / Rewrite / Regenerate */}
                        {(activeBook.pagesStatus || {})[selectedPage as number] === 'completed' && (
                          <div style={{ 
                            display: 'flex', 
                            gap: '4px', 
                            padding: '2px', 
                            backgroundColor: 'var(--bg-card)', 
                            borderRadius: '6px', 
                            border: '1px solid var(--border-color)', 
                            alignItems: 'center' 
                          }}>
                            <button 
                              onClick={() => handleLengthenPage(selectedPage as number)}
                              className="btn"
                              style={{ 
                                padding: '2px 8px', 
                                fontSize: '9px', 
                                height: '20px', 
                                borderRadius: '4px',
                                border: 'none', 
                                backgroundColor: 'transparent',
                                color: 'var(--text-main)',
                                cursor: 'pointer',
                                fontWeight: 500,
                                transition: 'background-color 0.15s ease'
                              }}
                              disabled={isGenerating || isPlanning || isGeneratingStyleOptions}
                              onMouseOver={(e) => { if (!isGenerating && !isPlanning && !isGeneratingStyleOptions) e.currentTarget.style.backgroundColor = 'var(--bg-main)'; }}
                              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                              Text verlängern
                            </button>
                            
                            <div style={{ width: '1px', height: '10px', backgroundColor: 'var(--border-color)' }}></div>
                            
                            <button 
                              onClick={() => handleGenerateStyleOptions(selectedPage as number)}
                              className="btn"
                              style={{ 
                                padding: '2px 8px', 
                                fontSize: '9px', 
                                height: '20px', 
                                borderRadius: '4px',
                                border: 'none', 
                                backgroundColor: 'transparent',
                                color: 'var(--text-main)',
                                cursor: 'pointer',
                                fontWeight: 500,
                                transition: 'background-color 0.15s ease'
                              }}
                              disabled={isGenerating || isPlanning || isGeneratingStyleOptions}
                              onMouseOver={(e) => { if (!isGenerating && !isPlanning && !isGeneratingStyleOptions) e.currentTarget.style.backgroundColor = 'var(--bg-main)'; }}
                              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                              {isGeneratingStyleOptions ? 'Stile laden...' : 'Stile umschreiben'}
                            </button>
                            
                            <div style={{ width: '1px', height: '10px', backgroundColor: 'var(--border-color)' }}></div>
                            
                            <button 
                              onClick={() => handleRetryPage(selectedPage as number)}
                              className="btn"
                              style={{ 
                                padding: '2px 8px', 
                                fontSize: '9px', 
                                height: '20px', 
                                borderRadius: '4px',
                                border: 'none', 
                                backgroundColor: 'transparent',
                                color: 'var(--text-main)',
                                cursor: 'pointer',
                                fontWeight: 500,
                                transition: 'background-color 0.15s ease'
                              }}
                              disabled={isGenerating || isPlanning || isGeneratingStyleOptions}
                              onMouseOver={(e) => { if (!isGenerating && !isPlanning && !isGeneratingStyleOptions) e.currentTarget.style.backgroundColor = 'var(--bg-main)'; }}
                              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                              Neu generieren
                            </button>

                            {activeBook.pagesGenerationTime?.[selectedPage as number] && (
                              <>
                                <div style={{ width: '1px', height: '10px', backgroundColor: 'var(--border-color)' }}></div>
                                <span style={{ fontSize: '8.5px', color: 'var(--text-muted)', padding: '0 6px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }} title={`Generierungszeit: ${activeBook.pagesGenerationTime[selectedPage as number]}ms`}>
                                  ⏱ {(activeBook.pagesGenerationTime[selectedPage as number] / 1000).toFixed(1)}s
                                </span>
                              </>
                            )}
                          </div>
                        )}

                        {(activeBook.pagesStatus || {})[selectedPage as number] === 'failed' && (
                          <button 
                            onClick={() => handleRetryPage(selectedPage as number)}
                            className="btn btn-danger"
                            style={{ padding: '2px 8px', fontSize: '9px', height: '20px', display: 'flex', alignItems: 'center', gap: '3px' }}
                          >
                            Neu generieren
                          </button>
                        )}
                      </div>

                      {/* Clean Inline Chapter Title and Focus */}
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(37,99,235,0.07), rgba(29,78,216,0.02))',
                        border: '1px solid rgba(56,189,248,0.2)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        marginTop: '6px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '8.5px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>KAPITEL-ÜBERSCHRIFT</span>
                        </div>
                        <input 
                          type="text"
                          value={editingChapterTitle !== null ? editingChapterTitle : (outline?.pages[(selectedPage as number) - 1]?.chapter_title || '')}
                          placeholder="Kapitelüberschrift eingeben..."
                          onChange={(e) => setEditingChapterTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && editingChapterTitle !== null) {
                              handleSaveChapterTitle(selectedPage as number, editingChapterTitle);
                            }
                          }}
                          className="ex-input-sleek"
                          style={{ width: '100%', fontSize: '13px', fontWeight: '700' }}
                          onBlur={() => {
                            if (editingChapterTitle !== null) {
                              handleSaveChapterTitle(selectedPage as number, editingChapterTitle);
                            }
                          }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                          <span style={{ fontSize: '8.5px', fontWeight: 800, color: '#60a5fa', letterSpacing: '0.08em', textTransform: 'uppercase' }}>SEITEN-FOKUS / IDEEN</span>
                          <textarea 
                            value={editingPageFocus !== null && editingPageFocus.pageNum === selectedPage ? editingPageFocus.text : (outline?.pages[(selectedPage as number) - 1]?.focus || '')}
                            placeholder="Worum soll es auf dieser Seite grob gehen? Schreibe deine Stichpunkte rein..."
                            onChange={(e) => setEditingPageFocus({ pageNum: selectedPage as number, text: e.target.value })}
                            className="ex-input-sleek"
                            style={{ 
                              width: '100%', 
                              fontSize: '11px', 
                              lineHeight: '1.4', 
                              minHeight: '48px',
                              maxHeight: '120px',
                              resize: 'vertical',
                              color: 'var(--text-main)',
                              padding: '6px',
                              border: '1px solid rgba(56,189,248,0.15)'
                            }}
                            onBlur={() => {
                              if (editingPageFocus !== null && editingPageFocus.pageNum === selectedPage) {
                                handleSavePageFocus(editingPageFocus.pageNum, editingPageFocus.text);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      gap: '6px', 
                      padding: '6px 8px', 
                      background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(56,189,248,0.03))', 
                      borderRadius: '8px', 
                      border: '1px solid rgba(56,189,248,0.22)', 
                      alignItems: 'center', 
                      flexWrap: 'wrap',
                      marginBottom: '10px',
                      width: '100%',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}>
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleEditorAIAction('spellcheck')}
                        className="btn"
                        style={{ 
                          padding: '2px 8px', 
                          fontSize: '9px', 
                          height: '20px', 
                          borderRadius: '4px',
                          border: 'none', 
                          backgroundColor: 'transparent',
                          color: 'var(--text-main)',
                          cursor: 'pointer',
                          fontWeight: 500,
                          transition: 'background-color 0.15s ease'
                        }}
                        disabled={isInlineAILoading || isGenerating || isPlanning}
                        onMouseOver={(e) => { if (!isInlineAILoading && !isGenerating && !isPlanning) e.currentTarget.style.backgroundColor = 'var(--bg-main)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        Korrigieren
                      </button>
                      
                      <div style={{ width: '1px', height: '10px', backgroundColor: 'var(--border-color)' }}></div>
                      
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleEditorAIAction('rephrase')}
                        className="btn"
                        style={{ 
                          padding: '2px 8px', 
                          fontSize: '9px', 
                          height: '20px', 
                          borderRadius: '4px',
                          border: 'none', 
                          backgroundColor: 'transparent',
                          color: 'var(--text-main)',
                          cursor: 'pointer',
                          fontWeight: 500,
                          transition: 'background-color 0.15s ease'
                        }}
                        disabled={isInlineAILoading || isGenerating || isPlanning}
                        onMouseOver={(e) => { if (!isInlineAILoading && !isGenerating && !isPlanning) e.currentTarget.style.backgroundColor = 'var(--bg-main)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        Umformulieren
                      </button>
                      
                      <div style={{ width: '1px', height: '10px', backgroundColor: 'var(--border-color)' }}></div>
                      
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleEditorAIAction('emotional')}
                        className="btn"
                        style={{ 
                          padding: '2px 8px', 
                          fontSize: '9px', 
                          height: '20px', 
                          borderRadius: '4px',
                          border: 'none', 
                          backgroundColor: 'transparent',
                          color: 'var(--text-main)',
                          cursor: 'pointer',
                          fontWeight: 500,
                          transition: 'background-color 0.15s ease'
                        }}
                        disabled={isInlineAILoading || isGenerating || isPlanning}
                        onMouseOver={(e) => { if (!isInlineAILoading && !isGenerating && !isPlanning) e.currentTarget.style.backgroundColor = 'var(--bg-main)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        Emotionaler
                      </button>
                      
                      <div style={{ width: '1px', height: '10px', backgroundColor: 'var(--border-color)' }}></div>
                      
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleEditorAIAction('shorten')}
                        className="btn"
                        style={{ 
                          padding: '2px 8px', 
                          fontSize: '9px', 
                          height: '20px', 
                          borderRadius: '4px',
                          border: 'none', 
                          backgroundColor: 'transparent',
                          color: 'var(--text-main)',
                          cursor: 'pointer',
                          fontWeight: 500,
                          transition: 'background-color 0.15s ease'
                        }}
                        disabled={isInlineAILoading || isGenerating || isPlanning}
                        onMouseOver={(e) => { if (!isInlineAILoading && !isGenerating && !isPlanning) e.currentTarget.style.backgroundColor = 'var(--bg-main)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        Kürzen
                      </button>

                      <div style={{ width: '1px', height: '10px', backgroundColor: 'var(--border-color)', margin: '0 4px' }}></div>
                      
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleEditorAIAction('humanize')}
                        className="btn"
                        style={{ 
                          padding: '2px 8px', 
                          fontSize: '9px', 
                          height: '20px', 
                          borderRadius: '4px',
                          border: '1px solid var(--primary)', 
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary)',
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'all 0.15s ease'
                        }}
                        disabled={isInlineAILoading || isGenerating || isPlanning}
                        onMouseOver={(e) => { if (!isInlineAILoading && !isGenerating && !isPlanning) { e.currentTarget.style.backgroundColor = 'var(--primary)'; e.currentTarget.style.color = '#fff'; } }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)'; }}
                        title="Bypass AI-Detection: Schreibt den Text so um, dass er wie von einem Menschen geschrieben wirkt."
                      >
                        <User size={10} style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }} />
                        Vermenschlichen
                      </button>

                      <div style={{ width: '1px', height: '10px', backgroundColor: 'var(--border-color)', margin: '0 4px' }}></div>
                      
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setShowImageInsertModal(true)}
                        className="btn"
                        style={{ 
                          padding: '2px 8px', 
                          fontSize: '9px', 
                          height: '20px', 
                          borderRadius: '4px',
                          border: '1px solid #38bdf8', 
                          backgroundColor: 'rgba(56, 189, 248, 0.1)',
                          color: '#38bdf8',
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                        disabled={isGenerating || isPlanning}
                        title="Bild / Grafik in diese Seite einfügen"
                      >
                        Bild
                      </button>

                      {isInlineAILoading && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px', fontSize: '9px', color: 'var(--primary)' }}>
                          <Loader2 className="spinner" style={{ width: '9px', height: '9px' }} />
                          <span>KI arbeitet...</span>
                        </div>
                      )}
                      
                      <span style={{ fontSize: '8.5px', color: 'var(--text-muted)', marginLeft: 'auto', paddingRight: '4px' }}>
                        Tipp: Text markieren für gezielte Aktionen
                      </span>
                    </div>

                    {(activeBook.pagesStatus || {})[selectedPage as number] === 'generating' ? (
                      <PageGenerationProgress pageNum={selectedPage as number} />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <div style={{ 
                          display: 'flex', 
                          gap: '6px', 
                          padding: '8px 14px', 
                          borderBottom: '1px solid rgba(56,189,248,0.15)',
                          background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
                          color: '#ffffff',
                          alignItems: 'center',
                          borderTopLeftRadius: '10px',
                          borderTopRightRadius: '10px',
                          border: '1px solid rgba(56,189,248,0.2)',
                          borderBottomWidth: 0
                        }}>
                          <button onMouseDown={(e) => e.preventDefault()} onClick={() => {
                            const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement;
                            if(!textarea) return;
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const text = textarea.value;
                            const newText = text.substring(0, start) + '**' + text.substring(start, end) + '**' + text.substring(end);
                            handleEditorChange({ target: { value: newText } } as React.ChangeEvent<HTMLTextAreaElement>);
                            setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + 2, end + 2); }, 0);
                          }} className="btn" style={{ padding: '4px 8px', fontSize: '12px', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#ffffff' }} title="Fett (Strg+B)">B</button>
                          
                          <button onMouseDown={(e) => e.preventDefault()} onClick={() => {
                            const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement;
                            if(!textarea) return;
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const text = textarea.value;
                            const newText = text.substring(0, start) + '*' + text.substring(start, end) + '*' + text.substring(end);
                            handleEditorChange({ target: { value: newText } } as React.ChangeEvent<HTMLTextAreaElement>);
                            setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + 1, end + 1); }, 0);
                          }} className="btn" style={{ padding: '4px 8px', fontSize: '12px', background: 'transparent', border: 'none', cursor: 'pointer', fontStyle: 'italic', color: '#ffffff' }} title="Kursiv (Strg+I)">I</button>
                          
                          <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255,255,255,0.3)', margin: '0 4px' }}></div>
                          
                          <button onMouseDown={(e) => e.preventDefault()} onClick={() => {
                            const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement;
                            if(!textarea) return;
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const text = textarea.value;
                            const newText = text.substring(0, start) + '\n- ' + text.substring(start, end) + text.substring(end);
                            handleEditorChange({ target: { value: newText } } as React.ChangeEvent<HTMLTextAreaElement>);
                            setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + 3, end + 3); }, 0);
                          }} className="btn" style={{ padding: '4px 8px', fontSize: '11px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#ffffff' }} title="Aufzählungsliste">• Liste</button>
                          
                          <button onMouseDown={(e) => e.preventDefault()} onClick={() => {
                            const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement;
                            if(!textarea) return;
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const text = textarea.value;
                            const newText = text.substring(0, start) + '\n\n:::box Tipp\n' + (text.substring(start, end) || 'Dein Text hier...') + '\n:::\n\n' + text.substring(end);
                            handleEditorChange({ target: { value: newText } } as React.ChangeEvent<HTMLTextAreaElement>);
                            setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + 13, end + 13); }, 0);
                          }} className="btn" style={{ padding: '4px 8px', fontSize: '11px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#ffffff' }} title="Info-Box einfügen">
                            [Box]
                          </button>

                          <button onMouseDown={(e) => e.preventDefault()} onClick={() => {
                            const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement;
                            if(!textarea) return;
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const text = textarea.value;
                            const newText = text.substring(0, start) + '\n> ' + (text.substring(start, end) || 'Dein Zitat hier...') + '\n' + text.substring(end);
                            handleEditorChange({ target: { value: newText } } as React.ChangeEvent<HTMLTextAreaElement>);
                            setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + 3, end + 3); }, 0);
                          }} className="btn" style={{ padding: '4px 8px', fontSize: '11px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#ffffff' }} title="Zitat einfügen">
                            "Zitat"
                          </button>

                          <button 
                            onMouseDown={(e) => e.preventDefault()} 
                            onClick={() => setShowImageInsertModal(true)} 
                            className="btn" 
                            style={{ 
                              padding: '4px 8px', 
                              fontSize: '11px', 
                              background: 'transparent', 
                              border: 'none', 
                              cursor: 'pointer', 
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }} 
                            title="Bild / Grafik einfügen"
                          >
                            Bild
                          </button>

                          <button onMouseDown={(e) => e.preventDefault()} onClick={() => {
                            const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement;
                            if(!textarea) return;
                            textarea.focus();
                            document.execCommand('undo');
                          }} className="btn" style={{ padding: '4px 8px', fontSize: '11px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '4px' }} title="Rückgängig (CMD/CTRL + Z)">
                            <Undo style={{ width: '12px', height: '12px' }} />
                          </button>
                        </div>
                        {(activeBook.cmieStatus || {})[selectedPage as number] === 'review_needed' && (
                          <div style={{ padding: '10px 14px', backgroundColor: '#991b1b', color: '#fef2f2', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '4px solid #ef4444' }}>
                            <AlertCircle size={16} style={{ flexShrink: 0 }} />
                            <span>CMIE Schutzsperre: Diese Seite überschreitet die Zitat-Länge (&gt;15 Wörter Ähnlichkeit zu externer Quelle/Quellmaterial). Manuelle Überarbeitung erforderlich!</span>
                          </div>
                        )}
                        {(activeBook.cmieStatus || {})[selectedPage as number] === 'similar' && (
                          <div style={{ padding: '10px 14px', backgroundColor: '#854d0e', color: '#fef9c3', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '4px solid #eab308' }}>
                            <AlertCircle size={16} style={{ flexShrink: 0 }} />
                            <span>CMIE Dopplungs-Hinweis: Die Eröffnung oder Struktur dieser Seite ähnelt einem früheren Kapitel.</span>
                          </div>
                        )}
                        <textarea
                          value={editorText}
                          onChange={handleEditorChange}
                          placeholder="Inhalt wird geladen/generiert. Du kannst auch direkt losschreiben..."
                          className="editor-textarea"
                          style={{ borderTop: 'none', height: '420px', background: '#0f172a', color: '#f8fafc', border: '1px solid rgba(56,189,248,0.2)', borderBottomLeftRadius: '10px', borderBottomRightRadius: '10px', padding: '16px', fontFamily: 'var(--ex-font)', fontSize: '13.5px', lineHeight: '1.7', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="empty-state">
                    <AlignJustify style={{ width: '24px', height: '24px', color: 'var(--border-color)' }} />
                    <span style={{ fontWeight: 'bold' }}>Keine Seite aktiv</span>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', maxWidth: '220px' }}>
                      {outline ? 'Wähle eine Seitennummer im Navigator aus, um sie zu öffnen.' : 'Plane das Buch im linken Panel, um Gliederungskacheln aufzubauen.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Draggable Resizer Bar */}
            <div className="resizer-bar" onMouseDown={startResizingRight} />

            {/* Right Panel: Live Print Preview — Billion Dollar Vibe */}
            <div className="ex-pane" style={{ width: `${rightWidth}px`, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#070d19' }}>
              <div className="ex-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#0f172a', borderBottom: '1px solid rgba(56,189,248,0.2)' }}>
                <div className="ex-wordmark">
                  <div className="ex-wordmark-dot" style={{ background: '#38bdf8', boxShadow: '0 0 10px #38bdf8' }} />
                  <span className="ex-wordmark-text">Layout-Viewer</span>
                </div>
                {activeBook && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <select 
                      value={activeBook.fontFamily}
                      onChange={e => updateActiveBookConfig('fontFamily', e.target.value)}
                      style={{ fontSize: '9px', padding: '1px 4px', height: '18px', width: '90px', border: '1px solid var(--border-color)', borderRadius: '2px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', cursor: 'pointer' }}
                    >
                      <option value="times">Times</option>
                      <option value="helvetica">Helvetica</option>
                      <option value="courier">Courier</option>
                      <option value="arial">Arial</option>
                    </select>

                    <select 
                      value={activeBook.fontSize}
                      onChange={e => updateActiveBookConfig('fontSize', Number(e.target.value))}
                      style={{ fontSize: '9px', padding: '1px 4px', height: '18px', width: '55px', border: '1px solid var(--border-color)', borderRadius: '2px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', cursor: 'pointer' }}
                    >
                      <option value={10}>10pt</option>
                      <option value={11}>11pt</option>
                      <option value={12}>12pt</option>
                      <option value={13}>13pt</option>
                      <option value={14}>14pt</option>
                    </select>

                    <select 
                      value={activeBook.paragraphStyle || 'indent'}
                      onChange={e => updateActiveBookConfig('paragraphStyle', e.target.value)}
                      style={{ fontSize: '9px', padding: '1px 4px', height: '18px', width: '105px', border: '1px solid var(--border-color)', borderRadius: '2px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', cursor: 'pointer' }}
                      title="Globales Absatz-Format"
                    >
                      <option value="indent">Absatz: Einzug</option>
                      <option value="spacing">Absatz: Leerzeile</option>
                      <option value="block">Absatz: Block</option>
                    </select>
                  </div>
                )}
              </div>

              {activeBook && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', padding: '6px 12px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', flexWrap: 'wrap' }}>
                  
                  {/* Initiale Toggle */}
                  <button
                    onClick={() => updateActiveBookConfig('autoChapterDropCaps', activeBook.autoChapterDropCaps === false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 600,
                      border: '1px solid var(--border-color)', cursor: 'pointer',
                      backgroundColor: activeBook.autoChapterDropCaps !== false ? 'var(--primary)' : 'var(--bg-card)',
                      color: activeBook.autoChapterDropCaps !== false ? '#ffffff' : 'var(--text-muted)',
                      transition: 'all 0.2s',
                    }}
                    title="Große Initiale am Kapitelanfang"
                  >
                    <span style={{ fontSize: '12px', fontWeight: 800, fontFamily: 'Georgia, serif', lineHeight: 1 }}>I</span>
                    Initiale {activeBook.autoChapterDropCaps !== false ? 'AN' : 'AUS'}
                  </button>

                  {/* Auto-Grafiken Toggle */}
                  <button
                    onClick={() => updateActiveBookConfig('autoChapterGraphics', !activeBook.autoChapterGraphics)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 600,
                      border: '1px solid var(--border-color)', cursor: 'pointer',
                      backgroundColor: activeBook.autoChapterGraphics ? 'var(--primary)' : 'var(--bg-card)',
                      color: activeBook.autoChapterGraphics ? '#ffffff' : 'var(--text-muted)',
                      transition: 'all 0.2s',
                    }}
                    title="KI generiert selbstständig Platzhalter für passende Buch-Grafiken"
                  >
                    <ImageIcon style={{ width: '11px', height: '11px' }} />
                    Auto-Grafiken {activeBook.autoChapterGraphics ? 'AN' : 'AUS'}
                  </button>

                  {/* Recto Toggle */}
                  <button
                    onClick={() => updateActiveBookConfig('autoChapterRecto', !activeBook.autoChapterRecto)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 600,
                      border: '1px solid var(--border-color)', cursor: 'pointer',
                      backgroundColor: activeBook.autoChapterRecto ? 'var(--primary)' : 'var(--bg-card)',
                      color: activeBook.autoChapterRecto ? '#ffffff' : 'var(--text-muted)',
                      transition: 'all 0.2s',
                    }}
                    title="Kapitel starten immer auf der rechten (Recto) Seite"
                  >
                    <BookOpen style={{ width: '11px', height: '11px' }} />
                    Recto {activeBook.autoChapterRecto ? 'AN' : 'AUS'}
                  </button>

                  {/* Abstand Input */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '2px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 600,
                    border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)'
                  }} title="Zusätzlicher Abstand nach oben am Kapitelanfang">
                    <span>Abstand:</span>
                    <input 
                      type="number" 
                      value={activeBook.chapterTopPadding || 0}
                      onChange={e => updateActiveBookConfig('chapterTopPadding', Number(e.target.value))}
                      style={{ fontSize: '10px', fontWeight: 600, padding: '0', height: '18px', width: '30px', border: 'none', backgroundColor: 'transparent', color: 'var(--text-main)', outline: 'none', textAlign: 'center' }}
                      min={0}
                      max={300}
                    />
                  </div>
                </div>
              )}

              <div className="ex-content" style={{ display: 'flex', flexDirection: 'column', padding: '24px 16px', background: '#060a14', overflowY: 'auto', flex: 1, gap: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
                {activeBook && selectedPage !== null ? (
                  <div className="preview-area" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    {/* Page Actions Toolbar */}
                    {typeof selectedPage === 'number' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', width: `${previewWidth}px`, justifyContent: 'space-between', boxSizing: 'border-box' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <select
                            value={activeBook.pagesParagraphStyle?.[selectedPage] || 'inherit'}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === 'inherit') {
                                setBooks(prev => prev.map(b => {
                                  if (b.id === activeBookId) {
                                    const newStyles = { ...(b.pagesParagraphStyle || {}) };
                                    delete newStyles[selectedPage];
                                    const updatedBook = { ...b, pagesParagraphStyle: newStyles };
                                    const updatedOverflows = recalculateBookOverflows(updatedBook);
                                    return { ...updatedBook, pagesOverflow: updatedOverflows };
                                  }
                                  return b;
                                }));
                              } else {
                                updatePageParagraphStyle(selectedPage, val as any);
                              }
                            }}
                            style={{ fontSize: '9px', padding: '1px 4px', height: '20px', border: '1px solid var(--border-color)', borderRadius: '2px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', cursor: 'pointer' }}
                            title="Absatzformat für diese Seite umformatieren"
                          >
                            <option value="inherit">Format: Global erben</option>
                            <option value="indent">Format: Einzug</option>
                            <option value="spacing">Format: Leerzeile</option>
                            <option value="block">Format: Block</option>
                          </select>
                        </div>

                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => handleGenerateStyleOptions(selectedPage)}
                            className="btn btn-success"
                            style={{ padding: '3px 10px', fontSize: '9.5px', height: '22px', display: 'flex', alignItems: 'center', gap: '4px', borderRadius: '6px', whiteSpace: 'nowrap' }}
                            disabled={isGenerating || isPlanning || isGeneratingStyleOptions || isGeneratingStructureOptions}
                            title="Schreibstil des Textes umschreiben"
                          >
                            {isGeneratingStyleOptions ? (
                              <Loader2 className="spinner" style={{ width: '9px', height: '9px' }} />
                            ) : (
                              <AlignJustify style={{ width: '9px', height: '9px', flexShrink: 0 }} />
                            )}
                            Stil umschreiben
                          </button>

                          <button
                            onClick={() => handleGenerateStructureOptions(selectedPage)}
                            className="btn btn-primary"
                            style={{ padding: '3px 10px', fontSize: '9.5px', height: '22px', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--accent)', borderRadius: '6px', whiteSpace: 'nowrap' }}
                            disabled={isGenerating || isPlanning || isGeneratingStructureOptions || isGeneratingStyleOptions}
                            title="Textstruktur umformatieren (Zwischenüberschriften, Listen, etc.)"
                          >
                            {isGeneratingStructureOptions ? (
                              <Loader2 className="spinner" style={{ width: '9px', height: '9px' }} />
                            ) : (
                              <Layout style={{ width: '9px', height: '9px', flexShrink: 0 }} />
                            )}
                            Umformatieren
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Preview toolbar: Kopfzeile + Kein Zitat + Kapitelüberschriften */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => updateActiveBookConfig('showRunningHeader', activeBook.showRunningHeader === false)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '5px',
                          padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 600,
                          border: '1px solid var(--border-color)', cursor: 'pointer',
                          backgroundColor: activeBook.showRunningHeader !== false ? 'var(--primary)' : 'var(--bg-card)',
                          color: activeBook.showRunningHeader !== false ? '#ffffff' : 'var(--text-muted)',
                          transition: 'all 0.2s',
                        }}
                        title={activeBook.showRunningHeader !== false ? 'Kopfzeile ausblenden' : 'Kopfzeile anzeigen'}
                      >
                        {activeBook.showRunningHeader !== false ? <Eye style={{ width: '11px', height: '11px' }} /> : <EyeOff style={{ width: '11px', height: '11px' }} />}
                        Kopfzeile {activeBook.showRunningHeader !== false ? 'AN' : 'AUS'}
                      </button>
                      <button
                        onClick={() => updateActiveBookConfig('showChapterTitles', activeBook.showChapterTitles === false)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '5px',
                          padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 600,
                          border: '1px solid var(--border-color)', cursor: 'pointer',
                          backgroundColor: activeBook.showChapterTitles !== false ? 'var(--primary)' : 'var(--bg-card)',
                          color: activeBook.showChapterTitles !== false ? '#ffffff' : 'var(--text-muted)',
                          transition: 'all 0.2s',
                        }}
                        title={activeBook.showChapterTitles !== false ? 'Alle Kapitelüberschriften ausblenden' : 'Alle Kapitelüberschriften anzeigen'}
                      >
                        {activeBook.showChapterTitles !== false ? <Eye style={{ width: '11px', height: '11px' }} /> : <EyeOff style={{ width: '11px', height: '11px' }} />}
                        Kapitel {activeBook.showChapterTitles !== false ? 'AN' : 'AUS'}
                      </button>
                      <button
                        onClick={() => updateActiveBookConfig('showPageNumbers', activeBook.showPageNumbers === false)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '5px',
                          padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 600,
                          border: '1px solid var(--border-color)', cursor: 'pointer',
                          backgroundColor: activeBook.showPageNumbers !== false ? 'var(--primary)' : 'var(--bg-card)',
                          color: activeBook.showPageNumbers !== false ? '#ffffff' : 'var(--text-muted)',
                          transition: 'all 0.2s',
                        }}
                        title={activeBook.showPageNumbers !== false ? 'Seitenzahlen ausblenden' : 'Seitenzahlen anzeigen'}
                      >
                        {activeBook.showPageNumbers !== false ? <Eye style={{ width: '11px', height: '11px' }} /> : <EyeOff style={{ width: '11px', height: '11px' }} />}
                        Seitenz. {activeBook.showPageNumbers !== false ? 'AN' : 'AUS'}
                      </button>
                      {typeof selectedPage === 'number' && (
                        <>
                          {isFirstPageOfChapter && (
                            <button
                              onClick={() => {
                                const current = activeBook.pagesHideChapter || [];
                                const next = current.includes(selectedPage)
                                  ? current.filter(n => n !== selectedPage)
                                  : [...current, selectedPage];
                                updateActiveBookConfig('pagesHideChapter', next);
                              }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '5px',
                                padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 600,
                                border: '1px solid var(--border-color)', cursor: 'pointer',
                                backgroundColor: !(activeBook.pagesHideChapter || []).includes(selectedPage) ? 'var(--accent)' : 'var(--bg-card)',
                                color: !(activeBook.pagesHideChapter || []).includes(selectedPage) ? '#ffffff' : 'var(--text-muted)',
                                transition: 'all 0.2s',
                              }}
                              title={!(activeBook.pagesHideChapter || []).includes(selectedPage) ? 'Kapitelüberschrift für diese Seite ausblenden' : 'Kapitelüberschrift für diese Seite anzeigen'}
                            >
                              {!(activeBook.pagesHideChapter || []).includes(selectedPage) ? <Eye style={{ width: '11px', height: '11px' }} /> : <EyeOff style={{ width: '11px', height: '11px' }} />}
                              Kapitel auf S. {selectedPage} {!(activeBook.pagesHideChapter || []).includes(selectedPage) ? 'AN' : 'AUS'}
                            </button>
                          )}
                          {/* Running Header Toggle for current page */}
                          {!isFirstPageOfChapter && (
                            <button
                              onClick={() => {
                                const current = activeBook.pagesHideRunningHeader || [];
                                const next = current.includes(selectedPage)
                                  ? current.filter(n => n !== selectedPage)
                                  : [...current, selectedPage];
                                updateActiveBookConfig('pagesHideRunningHeader', next);
                              }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '5px',
                                padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 600,
                                border: '1px solid var(--border-color)', cursor: 'pointer',
                                backgroundColor: !(activeBook.pagesHideRunningHeader || []).includes(selectedPage) ? 'var(--accent)' : 'var(--bg-card)',
                                color: !(activeBook.pagesHideRunningHeader || []).includes(selectedPage) ? '#ffffff' : 'var(--text-muted)',
                                transition: 'all 0.2s',
                              }}
                              title={!(activeBook.pagesHideRunningHeader || []).includes(selectedPage) ? 'Kopfzeile für diese Seite ausblenden' : 'Kopfzeile für diese Seite anzeigen'}
                            >
                              {!(activeBook.pagesHideRunningHeader || []).includes(selectedPage) ? <Eye style={{ width: '11px', height: '11px' }} /> : <EyeOff style={{ width: '11px', height: '11px' }} />}
                              Kopfzeile auf S. {selectedPage} {!(activeBook.pagesHideRunningHeader || []).includes(selectedPage) ? 'AN' : 'AUS'}
                            </button>
                          )}
                          {/* Initiale (Drop Cap) Toggle for current page */}
                          <button
                            onClick={() => {
                              const current = activeBook.pagesInitial || [];
                              const next = current.includes(selectedPage)
                                ? current.filter(n => n !== selectedPage)
                                : [...current, selectedPage];
                              updateActiveBookConfig('pagesInitial', next);
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '5px',
                              padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 600,
                              border: '1px solid var(--border-color)', cursor: 'pointer',
                              backgroundColor: (activeBook.pagesInitial || []).includes(selectedPage) ? 'var(--primary)' : 'var(--bg-card)',
                              color: (activeBook.pagesInitial || []).includes(selectedPage) ? '#ffffff' : 'var(--text-muted)',
                              transition: 'all 0.2s',
                            }}
                            title={(activeBook.pagesInitial || []).includes(selectedPage) ? 'Initiale (Drop Cap) deaktivieren' : 'Initiale (Drop Cap) aktivieren'}
                          >
                            <span style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'Georgia, serif', lineHeight: 1 }}>I</span>
                            Initiale {(activeBook.pagesInitial || []).includes(selectedPage) ? 'AN' : 'AUS'}
                          </button>
                          <button
                            onClick={() => {
                              const current = activeBook.pagesHideQuotes || [];
                              const next = current.includes(selectedPage)
                                ? current.filter(n => n !== selectedPage)
                                : [...current, selectedPage];
                              updateActiveBookConfig('pagesHideQuotes', next);
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '5px',
                              padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 600,
                              border: '1px solid var(--border-color)', cursor: 'pointer',
                              backgroundColor: (activeBook.pagesHideQuotes || []).includes(selectedPage) ? '#dc2626' : 'var(--bg-card)',
                              color: (activeBook.pagesHideQuotes || []).includes(selectedPage) ? '#ffffff' : 'var(--text-muted)',
                              transition: 'all 0.2s',
                            }}
                            title={(activeBook.pagesHideQuotes || []).includes(selectedPage) ? 'Zitat auf dieser Seite einblenden' : 'Zitat auf dieser Seite ausblenden'}
                          >
                            <span style={{ fontSize: '11px', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700 }}>„“</span>
                            Zitat {(activeBook.pagesHideQuotes || []).includes(selectedPage) ? 'AUS' : 'AN'}
                          </button>
                          
                          {(activeBook.autoChapterGraphics !== false) && (
                            <button
                              onClick={() => {
                                const currentDisabled = activeBook.pagesGraphicDisabled || {};
                                const isCurrentlyDisabled = !!currentDisabled[selectedPage];
                                updateActiveBookConfig('pagesGraphicDisabled', {
                                  ...currentDisabled,
                                  [selectedPage]: !isCurrentlyDisabled
                                });
                              }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '5px',
                                padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 600,
                                border: '1px solid var(--border-color)', cursor: 'pointer',
                                backgroundColor: activeBook.pagesGraphicDisabled?.[selectedPage] ? '#dc2626' : 'var(--bg-card)',
                                color: activeBook.pagesGraphicDisabled?.[selectedPage] ? '#ffffff' : 'var(--text-muted)',
                                transition: 'all 0.2s',
                              }}
                              title={activeBook.pagesGraphicDisabled?.[selectedPage] ? 'Automatische Grafik auf dieser Seite wieder erlauben' : 'Automatische Grafik auf dieser Seite verbieten'}
                            >
                              <ImageIcon style={{ width: '11px', height: '11px' }} />
                              Grafik {activeBook.pagesGraphicDisabled?.[selectedPage] ? 'AUS' : 'AN'}
                            </button>
                          )}
                        </>
                      )}
                      {typeof selectedPage === 'number' && (
                        <button
                          onClick={() => setShowImageInsertModal(true)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 600,
                            border: '1px solid var(--primary)', cursor: 'pointer',
                            backgroundColor: 'transparent',
                            color: 'var(--primary)',
                            transition: 'all 0.2s',
                            marginLeft: 'auto'
                          }}
                          title="Bild / Grafik in diese Seite einfügen"
                        >
                          Bild einfügen
                        </button>
                      )}
                    </div>

                    {selectedPage === 'title' && (() => {
                      const currentCoverField = activeCoverEditField || 'title';
                      const fieldMapFont: Record<string, keyof Book> = { title: 'titlePageTitleFont', subtitle: 'titlePageSubtitleFont', author: 'titlePageAuthorFont', publisher: 'titlePagePublisherFont' };
                      const fieldMapSize: Record<string, keyof Book> = { title: 'titlePageTitleSize', subtitle: 'titlePageSubtitleSize', author: 'titlePageAuthorSize', publisher: 'titlePagePublisherSize' };
                      
                      return (
                        <div style={{
                          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
                          gap: '10px', padding: '10px 14px', backgroundColor: 'var(--bg-card)',
                          border: '1px solid var(--border-color)', borderRadius: '10px', marginBottom: '14px',
                          width: `${previewWidth}px`, boxSizing: 'border-box', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}>
                          {/* Field selector tabs */}
                          <div style={{ display: 'flex', gap: '4px', borderRight: '1px solid var(--border-color)', paddingRight: '8px' }}>
                            {(['title', 'subtitle', 'author', 'publisher'] as const).map(f => {
                              const labels: Record<string, string> = { title: '📖 Titel', subtitle: '💬 Untertitel', author: '✍️ Autor', publisher: '🏢 Verlag' };
                              const isSel = currentCoverField === f;
                              return (
                                <button
                                  key={f}
                                  onClick={() => setActiveCoverEditField(f)}
                                  style={{
                                    padding: '5px 9px', fontSize: '11px', fontWeight: isSel ? 700 : 500,
                                    borderRadius: '6px', border: isSel ? '1px solid var(--primary)' : '1px solid transparent',
                                    backgroundColor: isSel ? 'rgba(59,130,246,0.15)' : 'transparent',
                                    color: isSel ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer',
                                    transition: 'all 0.15s'
                                  }}
                                >
                                  {labels[f]}
                                </button>
                              );
                            })}
                          </div>

                          {/* Font selector */}
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Schrift:</span>
                            <select
                              value={activeBook[fieldMapFont[currentCoverField]] as string || (currentCoverField === 'title' ? 'playfair' : 'times')}
                              onChange={e => updateActiveBookConfig(fieldMapFont[currentCoverField], e.target.value)}
                              style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontWeight: 500 }}
                            >
                              {COVER_FONTS.map(font => <option key={font.value} value={font.value}>{font.label}</option>)}
                            </select>
                          </div>

                          {/* Size range */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Größe:</span>
                            <input
                              type="range"
                              min={currentCoverField === 'title' ? 14 : 8}
                              max={currentCoverField === 'title' ? 72 : 40}
                              value={Number(activeBook[fieldMapSize[currentCoverField]]) || (currentCoverField === 'title' ? 28 : currentCoverField === 'author' ? 14 : 12)}
                              onChange={e => updateActiveBookConfig(fieldMapSize[currentCoverField], Number(e.target.value))}
                              style={{ width: '80px', height: '5px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                            />
                            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-main)', width: '32px' }}>
                              {Number(activeBook[fieldMapSize[currentCoverField]]) || (currentCoverField === 'title' ? 28 : currentCoverField === 'author' ? 14 : 12)}px
                            </span>
                          </div>

                          {/* Reset position button */}
                          <button
                            onClick={() => {
                              const mapX: Record<string, keyof Book> = { title: 'titlePageTitleX', subtitle: 'titlePageSubtitleX', author: 'titlePageAuthorX', publisher: 'titlePagePublisherX' };
                              const mapY: Record<string, keyof Book> = { title: 'titlePageTitleY', subtitle: 'titlePageSubtitleY', author: 'titlePageAuthorY', publisher: 'titlePagePublisherY' };
                              updateActiveBookConfig(mapX[currentCoverField], 0);
                              updateActiveBookConfig(mapY[currentCoverField], 0);
                            }}
                            style={{ padding: '4px 9px', fontSize: '10.5px', fontWeight: 600, borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', cursor: 'pointer' }}
                            title="Position der gewählten Zeile auf Mitte zurücksetzen"
                          >
                            📍 Reset Pos
                          </button>
                        </div>
                      );
                    })()}

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                      {(() => {
                        const renderPageBox = (content: React.ReactNode, partIndex: number) => {
                          const isNewChapter = typeof selectedPage === 'number' && (
                            (selectedPage === 1) ||
                            (outline?.pages[selectedPage - 1]?.chapter_title !== outline?.pages[selectedPage - 2]?.chapter_title)
                          );
                          const isFirstPageOfChapter = typeof selectedPage === 'number' && isNewChapter && partIndex === 0;
                          const globalOff = activeBook.showChapterTitles === false;
                          const pageOff = typeof selectedPage === 'number' && (activeBook.pagesHideChapter || []).includes(selectedPage);
                          const showTitle = isFirstPageOfChapter && !globalOff && !pageOff;

                          return (
                            <div key={partIndex}
                              className={`book-page-preview book-font-${activeBook.fontFamily} ${isOverflowing && partIndex === 0 ? 'overflow-warning' : ''} ${isFirstPageOfChapter ? 'chapter-start' : ''}`} 
                              style={{ 
                                width: `${previewWidth}px`,
                                height: `${previewHeight}px`,
                                paddingTop: `${topMarginPx}px`,
                                paddingBottom: `${bottomMarginPx}px`,
                                paddingLeft: `${(insideMarginPx + outsideMarginPx) / 2}px`,
                                paddingRight: `${(insideMarginPx + outsideMarginPx) / 2}px`,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                position: 'relative',
                                marginBottom: '24px',
                                flexShrink: 0
                              }}
                            >
                              {/* Header Line */}
                              {typeof selectedPage === 'number' && !isFirstPageOfChapter && activeBook.showRunningHeader !== false && !(activeBook.pagesHideRunningHeader || []).includes(selectedPage) ? (
                                <div style={{ fontSize: '5.5px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', borderBottom: '0.5px solid #e2e8f0', paddingBottom: '1px', marginBottom: '4px' }}>
                                  <span 
                                    className="truncate" 
                                    style={{ maxWidth: '100%', outline: 'none', cursor: 'text', padding: '2px', minWidth: '30px', display: 'inline-block' }}
                                    contentEditable={true}
                                    suppressContentEditableWarning={true}
                                    onBlur={e => {
                                      const text = e.currentTarget.innerText.trim();
                                      if (!text) return;
                                      if ((getPreviewPageNumber(partIndex) as number) % 2 === 0) {
                                        updateActiveBookConfig('title', text);
                                      } else {
                                        handleSaveChapterTitle(selectedPage as number, text);
                                      }
                                    }}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
                                    title="Klicken zum Bearbeiten der Kopfzeile"
                                  >
                                    {(getPreviewPageNumber(partIndex) as number) % 2 === 0 ? activeBook.title : (outline?.pages[(selectedPage as number) - 1]?.chapter_title || '')}
                                  </span>
                                </div>
                              ) : (
                                <div style={{ height: '9px', marginBottom: '4px' }}></div>
                              )}

                              {/* Chapter title header */}
                              {typeof selectedPage === 'number' && (
                                <>
                                  {isFirstPageOfChapter && !globalOff && (
                                    <button
                                      onClick={() => {
                                        const current = activeBook.pagesHideChapter || [];
                                        const next = current.includes(selectedPage as number)
                                          ? current.filter((n: number) => n !== selectedPage)
                                          : [...current, selectedPage as number];
                                        updateActiveBookConfig('pagesHideChapter', next);
                                      }}
                                      style={{
                                        position: 'absolute', top: '28px', right: '4px',
                                        fontSize: '7px', padding: '1px 5px', borderRadius: '4px',
                                        border: '1px solid var(--border-color)', cursor: 'pointer',
                                        backgroundColor: pageOff ? '#7c3aed20' : 'transparent',
                                        color: pageOff ? '#a78bfa' : 'var(--text-muted)',
                                        lineHeight: 1.4, zIndex: 2
                                      }}
                                      title={pageOff ? 'Kapitelüberschrift für diese Seite einblenden' : 'Kapitelüberschrift für diese Seite ausblenden'}
                                    >
                                      {pageOff ? '+ Kapitel' : '- Kapitel'}
                                    </button>
                                  )}
                                  {showTitle && (
                                    <>
                                      <h4 
                                        contentEditable={true}
                                        suppressContentEditableWarning={true}
                                        onBlur={(e) => {
                                          const text = e.currentTarget.innerText || '';
                                          handleSaveChapterTitle(selectedPage, text);
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            e.currentTarget.blur();
                                          }
                                        }}
                                        style={{ 
                                          fontSize: '8px', 
                                          fontWeight: 'bold', 
                                          textAlign: 'center', 
                                          marginBottom: '4px', 
                                          borderBottom: '0.5px solid #cbd5e1', 
                                          paddingBottom: '1px', 
                                          color: '#000000',
                                          outline: 'none',
                                          cursor: 'text'
                                        }}
                                        className="preview-editable-header"
                                        title="Klicke zum Bearbeiten des Kapitelnamens"
                                      >
                                        {outline?.pages[selectedPage - 1]?.chapter_title}
                                      </h4>
                                      {activeBook.chapterOrnament && (
                                        <div style={{ textAlign: 'center', fontSize: '9px', marginBottom: '6px', color: '#64748b' }}>
                                          {activeBook.chapterOrnament}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </>
                              )}
                              
                              <div 
                                ref={partIndex === 0 ? previewContentRef : null}
                                className={`preview-content${typeof selectedPage === 'number' && (activeBook?.pagesInitial || []).includes(selectedPage) && partIndex === 0 ? ' has-initial' : ''}`}
                                style={{ 
                                  fontSize: `${previewFontSize}px`,
                                  color: '#1e293b',
                                  lineHeight: '1.5',
                                  textAlign: activeBook.alignment === 'left' ? 'left' : 'justify',
                                  textAlignLast: 'left',
                                  WebkitHyphens: 'auto',
                                  msHyphens: 'auto',
                                  hyphens: 'auto',
                                  overflowY: 'hidden',
                                  paddingRight: '1px',
                                  flex: 1,
                                  cursor: 'text'
                                }}
                              >
                                {content}
                              </div>

                              {typeof selectedPage === 'number' && partIndex === 0 && (activeBook?.pagesGraphic || {})[selectedPage]?.grafik_sinnvoll && (
                                <PreviewGraphicBox
                                  transform={(activeBook.pagesGraphic || {})[selectedPage]}
                                  onChange={newT => {
                                    const curr = (activeBook.pagesGraphic || {})[selectedPage as number] || { grafik_sinnvoll: true };
                                    updateActiveBookConfig('pagesGraphic', {
                                      ...(activeBook.pagesGraphic || {}),
                                      [selectedPage as number]: { ...curr, ...newT }
                                    });
                                  }}
                                  onDelete={() => {
                                    const updated = { ...(activeBook.pagesGraphic || {}) };
                                    delete updated[selectedPage as number];
                                    updateActiveBookConfig('pagesGraphic', updated);
                                    updateActiveBookConfig('pagesGraphicDisabled', {
                                      ...(activeBook.pagesGraphicDisabled || {}),
                                      [selectedPage as number]: true
                                    });
                                  }}
                                >
                                  <SvgGraphicRenderer
                                    decision={(activeBook.pagesGraphic || {})[selectedPage]}
                                    onVariantChange={(newVar) => {
                                      const curr = (activeBook.pagesGraphic || {})[selectedPage as number];
                                      updateActiveBookConfig('pagesGraphic', {
                                        ...(activeBook.pagesGraphic || {}),
                                        [selectedPage as number]: { ...curr, selectedVariant: newVar }
                                      });
                                    }}
                                    onUpdateDecision={(upd) => {
                                      const curr = (activeBook.pagesGraphic || {})[selectedPage as number];
                                      updateActiveBookConfig('pagesGraphic', {
                                        ...(activeBook.pagesGraphic || {}),
                                        [selectedPage as number]: { ...curr, ...upd }
                                      });
                                    }}
                                    onRegenerate={() => handleRegeneratePageGraphic(selectedPage as number)}
                                  />
                                </PreviewGraphicBox>
                              )}

                              {/* Footer page numbers (centered) */}
                              <div style={{ fontSize: '5.5px', fontWeight: 'bold', color: '#94a3b8', marginTop: '4px', textAlign: 'center', visibility: (activeBook.showPageNumbers !== false && (typeof selectedPage === 'number' || (typeof selectedPage === 'string' && selectedPage.startsWith('toc_')))) ? 'visible' : 'hidden' }}>
                                {typeof selectedPage === 'number' ? getPreviewPageNumber(partIndex) : toRoman(2 + parseInt((selectedPage as string).split('_')[1] || '0', 10))}
                              </div>
                            </div>
                          );
                        };

                        if (selectedPage === 'title' || (typeof selectedPage === 'string' && selectedPage.startsWith('toc'))) {
                          return renderPageBox(renderPreviewContent(), 0);
                        } else if (typeof selectedPage === 'number') {
                          const pageText = (activeBook.pagesText || {})[selectedPage] || '';
                          const parts = pageText.split(/\r?\n\s*-{3,}\s*(?:\r?\n|$)/);
                          if (parts.length === 0 || (parts.length === 1 && !parts[0])) {
                            return renderPageBox(renderPartPreviewContent('', 0), 0);
                          }
                          return parts.map((part, idx) => renderPageBox(renderPartPreviewContent(part, idx), idx));
                        }
                        return null;
                      })()}
                    </div>

                      {typeof selectedPage === 'number' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                          <button
                            onClick={() => handleRetryPage(selectedPage as number)}
                            className="btn btn-primary"
                            style={{
                              padding: '6px 18px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              backgroundColor: 'var(--primary)',
                              borderColor: 'var(--primary)',
                              borderRadius: '6px',
                              boxShadow: '0 2px 8px rgba(11, 87, 208, 0.25)',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              width: '100%',
                              justifyContent: 'center'
                            }}
                            disabled={isGenerating || isPlanning || isGeneratingStyleOptions || isGeneratingStructureOptions}
                            title="Generiert den Inhalt dieser Seite komplett neu basierend auf der Gliederung"
                          >
                            <RotateCw style={{ width: '13px', height: '13px' }} /> {!(activeBook.pagesText || {})[selectedPage as number] ? 'Diese einzelne Seite generieren' : 'Seite neu generieren'}
                          </button>
                          
                          {(activeBook?.autoChapterGraphics !== false) && (
                            <label style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '10px',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '2px 4px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(255,255,255,0.03)'
                            }}>
                              <input
                                type="checkbox"
                                checked={!!activeBook?.pagesGraphicDisabled?.[selectedPage as number]}
                                onChange={(e) => {
                                  updateActiveBookConfig('pagesGraphicDisabled', {
                                    ...(activeBook?.pagesGraphicDisabled || {}),
                                    [selectedPage as number]: e.target.checked
                                  });
                                }}
                                style={{ margin: 0, cursor: 'pointer' }}
                              />
                              Ohne Grafik generieren (Nur Text)
                            </label>
                          )}
                        </div>
                      )}
                    </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <BookOpen style={{ width: '24px', height: '24px', color: 'var(--border-color)', marginBottom: '6px' }} />
                    <p style={{ fontSize: '10px', fontStyle: 'italic' }}>Keine Buchseite aktiv für Layout-Simulation.</p>
                  </div>
                )}

                {isOverflowing && (
                  <div style={{ fontSize: '9.5px', fontWeight: 'bold', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '5px 8px', borderRadius: '3px', marginBottom: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <AlertCircle style={{ width: '12px', height: '12px', flexShrink: 0 }} />
                    <span>Seite läuft über! Der Text wird im PDF abgeschnitten.</span>
                  </div>
                )}

                <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.4', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                  * Symmetrische Buchränder: Perfekte Zentrierung auf allen Seiten für optimalen KDP-Druck & E-Books.
                </div>
              </div>
            </div>

            <GilInsightsPanel
              isOpen={showGilInsights}
              onClose={() => setShowGilInsights(false)}
              bookId={activeBook.id}
              niche={activeBook.marketNiche || 'Allgemein'}
              currentStyle={activeBook.writingStyle || 'Sachbuch / Informativ'}
              refreshKey={gilRefreshKey}
            />

          </div>
            )
          )
        )}
        </>
        )}

      </div>
      {/* Floating Style Options Modal */}
      {styleOptions && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh', 
            backgroundColor: 'rgba(0, 0, 0, 0.5)', 
            backdropFilter: 'blur(10px) saturate(180%)',
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            zIndex: 1000
          }}
          onClick={() => setStyleOptions(null)}
        >
          <div 
            style={{ 
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '4px', 
              padding: '24px', 
              width: '850px', 
              maxWidth: '90vw',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlignJustify style={{ width: '16px', height: '16px', color: 'var(--primary)' }} />
                <span style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text-main)' }}>Alternative Stil-Entwürfe (Seite {selectedPage})</span>
              </div>
              <button 
                onClick={() => setStyleOptions(null)} 
                className="btn"
                style={{ padding: '4px 10px', fontSize: '10px' }}
              >
                Abbrechen
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
              {/* Option 1 */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', padding: '16px', backgroundColor: 'var(--input-bg)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '8px' }}>1. {styleOptions.style_1_name}</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: '1.4', fontStyle: 'italic', maxLines: 15, overflow: 'hidden' }}>
                    {styleOptions.version_1}
                  </div>
                </div>
                <button 
                  onClick={() => handleApplyStyleOption(styleOptions.version_1)}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '6px' }}
                >
                  Stil anwenden
                </button>
              </div>

              {/* Option 2 */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', padding: '16px', backgroundColor: 'var(--input-bg)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 'bold', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '8px' }}>2. {styleOptions.style_2_name}</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: '1.4', fontStyle: 'italic', maxLines: 15, overflow: 'hidden' }}>
                    {styleOptions.version_2}
                  </div>
                </div>
                <button 
                  onClick={() => handleApplyStyleOption(styleOptions.version_2)}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '6px' }}
                >
                  Stil anwenden
                </button>
              </div>

              {/* Option 3 */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', padding: '16px', backgroundColor: 'var(--input-bg)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 'bold', color: 'var(--success)', textTransform: 'uppercase', marginBottom: '8px' }}>3. {styleOptions.style_3_name}</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: '1.4', fontStyle: 'italic', maxLines: 15, overflow: 'hidden' }}>
                    {styleOptions.version_3}
                  </div>
                </div>
                <button 
                  onClick={() => handleApplyStyleOption(styleOptions.version_3)}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '6px' }}
                >
                  Stil anwenden
                </button>
              </div>
            </div>
            
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', lineHeight: '1.3', borderTop: '1px dashed var(--border-color)', paddingTop: '10px' }}>
              * Hinweis: Beim Anwenden eines Stils prüft das System automatisch auf Seitenüberlauf und kürzt den Text falls nötig sauber an der letzten passenden Satzgrenze.
            </div>
          </div>
        </div>
      )}

      {/* Floating Structure Options Modal */}
      {structureOptions && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh', 
            backgroundColor: 'rgba(0, 0, 0, 0.5)', 
            backdropFilter: 'blur(10px) saturate(180%)',
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            zIndex: 1000
          }}
          onClick={() => setStructureOptions(null)}
        >
          <div 
            style={{ 
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '4px', 
              padding: '24px', 
              width: '850px', 
              maxWidth: '90vw',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layout style={{ width: '16px', height: '16px', color: 'var(--accent)' }} />
                <span style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text-main)' }}>
                  Alternative Struktur-Gliederungen (Seite {selectedPage}) {isUsingAISyntax ? '(KI-optimiert)' : '(Lokale Vorschau)'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={handleGenerateStructureOptionsAI}
                  className="btn btn-primary"
                  style={{ padding: '4px 12px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }}
                  disabled={isGeneratingStructureOptions}
                  title="Textstruktur mit KI verfeinern"
                >
                  {isGeneratingStructureOptions ? (
                    <Loader2 className="spinner" style={{ width: '10px', height: '10px' }} />
                  ) : (
                    <Sparkles style={{ width: '10px', height: '10px' }} />
                  )}
                  <span>{isUsingAISyntax ? 'Erneut mit KI generieren' : 'Mit KI verfeinern'}</span>
                </button>
                <button 
                  onClick={() => {
                    setStructureOptions(null);
                    setIsUsingAISyntax(false);
                  }} 
                  className="btn"
                  style={{ padding: '4px 10px', fontSize: '10px' }}
                >
                  Abbrechen
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
              {/* Option 1 */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', padding: '16px', backgroundColor: 'var(--input-bg)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '8px' }}>1. Mit Zwischenüberschriften</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: '1.4', fontStyle: 'italic', maxLines: 15, overflow: 'hidden', whiteSpace: 'pre-line' }}>
                    {structureOptions.version_1}
                  </div>
                </div>
                <button 
                  onClick={() => handleApplyStructureOption(structureOptions.version_1)}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '6px' }}
                >
                  Struktur anwenden
                </button>
              </div>

              {/* Option 2 */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', padding: '16px', backgroundColor: 'var(--input-bg)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 'bold', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '8px' }}>2. Listen & Stichpunkte</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: '1.4', fontStyle: 'italic', maxLines: 15, overflow: 'hidden', whiteSpace: 'pre-line' }}>
                    {structureOptions.version_2}
                  </div>
                </div>
                <button 
                  onClick={() => handleApplyStructureOption(structureOptions.version_2)}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '6px' }}
                >
                  Struktur anwenden
                </button>
              </div>

              {/* Option 3 */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', padding: '16px', backgroundColor: 'var(--input-bg)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 'bold', color: 'var(--success)', textTransform: 'uppercase', marginBottom: '8px' }}>3. Kurze Abschnitte</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: '1.4', fontStyle: 'italic', maxLines: 15, overflow: 'hidden', whiteSpace: 'pre-line' }}>
                    {structureOptions.version_3}
                  </div>
                </div>
                <button 
                  onClick={() => handleApplyStructureOption(structureOptions.version_3)}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '6px' }}
                >
                  Struktur anwenden
                </button>
              </div>
            </div>
            
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', lineHeight: '1.3', borderTop: '1px dashed var(--border-color)', paddingTop: '10px' }}>
              * Hinweis: Beim Anwenden einer Gliederung prüft das System automatisch auf Seitenüberlauf und kürzt den Text falls nötig sauber an der letzten passenden Satzgrenze.
            </div>
          </div>
        </div>
      )}

      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        theme={theme}
        onThemeChange={setTheme}
        groqKeys={groqKeysInput}
        onGroqKeysChange={handleGroqKeysChange}
        geminiKeys={geminiKeysInput}
        onGeminiKeysChange={handleGeminiKeysChange}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        groqConnected={groqConnected}
        geminiConnected={geminiConnected}
        userEmail={currentUser?.email}
        userId={currentUser?.uid}
      />
      <div 
        id="book24-measurer" 
        className="preview-content"
        style={{ 
          position: 'absolute', 
          visibility: 'hidden', 
          pointerEvents: 'none', 
          top: '-9999px', 
          left: '-9999px' 
        }} 
      />

      {/* Translation Warning Dialog */}
      {showTranslationWarning && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          backgroundColor: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'var(--sidebar-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '28px 32px',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
            display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Sparkles style={{ width: '16px', height: '16px', color: 'var(--primary)' }} />
              </div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>Buch ins Englische übersetzen</h3>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Um dein deutsches Originalprojekt zu schützen, wird automatisch eine Kopie erstellt und diese ins Englische übersetzt. Dein deutsches Original bleibt vollständig unverändert erhalten.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <button
                onClick={() => handleTranslateToEnglish()}
                className="btn btn-primary"
                style={{
                  padding: '10px 18px', fontSize: '13px', fontWeight: 600,
                  backgroundColor: 'var(--primary)', color: '#fff', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Copy style={{ width: '14px', height: '14px' }} /> Kopie erstellen & übersetzen
              </button>
              <button
                onClick={() => setShowTranslationWarning(false)}
                className="btn"
                style={{
                  padding: '8px 18px', fontSize: '13px',
                  backgroundColor: 'transparent', border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)', marginTop: '4px',
                  cursor: 'pointer'
                }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Box Design Edit Modal */}
      {activeBook && activeStyleEditNum !== null && (() => {
        const key = (activeStyleEditNum === 1 ? 'box1Design' : activeStyleEditNum === 2 ? 'box2Design' : 'box3Design') as keyof Book;
        const design = (activeBook[key] as BoxDesign) || (activeStyleEditNum === 1 ? DEFAULT_BOX1_DESIGN : activeStyleEditNum === 2 ? DEFAULT_BOX2_DESIGN : DEFAULT_BOX3_DESIGN);
        const updateField = (field: string, val: any) => {
          updateActiveBookConfig(key, { ...design, [field]: val });
        };

        return (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }} onClick={() => setActiveStyleEditNum(null)}>
            <div style={{
              backgroundColor: 'var(--sidebar-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '420px',
              width: '90%',
              boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
              display: 'flex', flexDirection: 'column', gap: '16px'
            }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>Stileinstellungen für Box {activeStyleEditNum}</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Hintergrundfarbe</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input 
                      type="color" 
                      value={design.backgroundColor || '#f8fafc'} 
                      onChange={e => updateField('backgroundColor', e.target.value)} 
                      style={{ width: '28px', height: '24px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    />
                    <input 
                      type="text" 
                      value={design.backgroundColor || '#f8fafc'} 
                      onChange={e => updateField('backgroundColor', e.target.value)} 
                      style={{ flex: 1, fontSize: '11px', padding: '2px 6px', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Rahmenfarbe</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input 
                      type="color" 
                      value={design.borderColor || '#cbd5e1'} 
                      onChange={e => updateField('borderColor', e.target.value)} 
                      style={{ width: '28px', height: '24px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    />
                    <input 
                      type="text" 
                      value={design.borderColor || '#cbd5e1'} 
                      onChange={e => updateField('borderColor', e.target.value)} 
                      style={{ flex: 1, fontSize: '11px', padding: '2px 6px', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Textfarbe</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input 
                      type="color" 
                      value={design.textColor || '#0f172a'} 
                      onChange={e => updateField('textColor', e.target.value)} 
                      style={{ width: '28px', height: '24px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    />
                    <input 
                      type="text" 
                      value={design.textColor || '#0f172a'} 
                      onChange={e => updateField('textColor', e.target.value)} 
                      style={{ flex: 1, fontSize: '11px', padding: '2px 6px', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Rahmenstil</label>
                  <select 
                    value={design.borderStyle || 'solid'} 
                    onChange={e => updateField('borderStyle', e.target.value)} 
                    style={{ width: '100%', fontSize: '11px', padding: '4px 6px', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
                  >
                    <option value="solid">Durchgezogen (solid)</option>
                    <option value="dashed">Gestrichelt (dashed)</option>
                    <option value="dotted">Gepunktet (dotted)</option>
                    <option value="none">Kein Rahmen (none)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Rahmendicke ({design.borderThickness || 1}px)</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="10" 
                    value={design.borderThickness || 0} 
                    onChange={e => updateField('borderThickness', Number(e.target.value))} 
                    style={{ width: '100%', accentColor: 'var(--primary)' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Eckenabrundung ({design.borderRadius || 4}px)</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="30" 
                    value={design.borderRadius || 0} 
                    onChange={e => updateField('borderRadius', Number(e.target.value))} 
                    style={{ width: '100%', accentColor: 'var(--primary)' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Schriftstil</label>
                <select 
                  value={design.fontStyle || 'normal'} 
                  onChange={e => updateField('fontStyle', e.target.value)} 
                  style={{ width: '100%', fontSize: '11px', padding: '4px 6px', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
                >
                  <option value="normal">Standard (Normal)</option>
                  <option value="italic">Kursiv (Italic)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  onClick={() => setActiveStyleEditNum(null)}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '8px', fontSize: '12px', fontWeight: 600, backgroundColor: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer' }}
                >
                  Fertig
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Image Insert Modal */}
      {showImageInsertModal && activeBook && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          backgroundColor: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setShowImageInsertModal(false)}>
          <ImageInsertModalInner
 
            onClose={() => setShowImageInsertModal(false)}
            onInstantInsert={(imageId, base64, tag) => {
              if (typeof selectedPage === 'number') {
                const currText = (activeBook.pagesText || {})[selectedPage] || '';
                const newText = currText ? (currText + '\n\n' + tag) : tag;
                const newImages = { ...(activeBook.images || {}), [imageId]: base64 };
                const newPagesText = { ...(activeBook.pagesText || {}), [selectedPage]: newText };
                
                setBooks(prev => prev.map(b => {
                  if (b.id === activeBook.id) {
                    const updated = { ...b, images: newImages, pagesText: newPagesText };
                    return { ...updated, pagesOverflow: recalculateBookOverflows(updated) };
                  }
                  return b;
                }));
                setEditorText(newText);
              } else {
                alert("Bitte wähle zuerst eine Buchseite im Navigator aus!");
              }
              setShowImageInsertModal(false);
            }}
          />
        </div>
      )}
      
      {/* Maintenance Overlay */}
      {maintenanceInfo.active && (!currentUser || (currentUser.email ?? '').toLowerCase() !== (import.meta.env.VITE_OWNER_EMAIL || '').toLowerCase()) && (
        <MaintenanceOverlay message={maintenanceInfo.message} endsAt={maintenanceInfo.endsAt} />
      )}
    </div>
    </>
  );
}

// Clean generated book page text of any LLM-introduced headers, meta tags or double empty lines
function cleanPageText(text: string): string {
  if (!text) return '';
  const lines = text.split('\n');
  const cleanLines = lines
    .map(line => line.trim()) // Trim leading and trailing spaces from each paragraph line
    .filter(line => {
      if (!line) return true; // preserve empty lines for paragraph separation (cleaned later)
      
      // Remove markdown headers
      if (line.startsWith('#')) return false;
      
      const lower = line.toLowerCase();
      
      // Remove typical LLM prompt reflections & metadata
      if (lower.startsWith('**fokus') || 
          lower.startsWith('**focus') || 
          lower.startsWith('**kapitel') || 
          lower.startsWith('**chapter') || 
          lower.startsWith('**seite') || 
          lower.startsWith('**page')) {
        return false;
      }
      
      if (lower.startsWith('fokus:') || 
          lower.startsWith('focus:') || 
          lower.startsWith('kapitel:') || 
          lower.startsWith('chapter:') || 
          lower.startsWith('seite:') || 
          lower.startsWith('page:')) {
        return false;
      }

      // Remove conversational introduction lines
      if (lower.startsWith('hier ist') || 
          lower.startsWith('gern schreibe') || 
          lower.startsWith('gerne schreibe') || 
          lower.startsWith('text für seite') || 
          (lower.startsWith('seite ') && lower.includes(':')) || 
          lower.startsWith('here is') || 
          lower.startsWith('sure, here')) {
        if (line.length < 80) {
          return false;
        }
      }
      
      return true;
    });

  // Re-join and clean consecutive newlines (max 2)
  return cleanLines.join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Local helper to restructure text instantly on the client side
function generateStructureVariationsLocal(text: string): { version_1: string; version_2: string; version_3: string } {
  const paragraphs = text.split('\n').map(p => p.trim()).filter(Boolean);
  
  // 1. Version 1: Mit Zwischenüberschriften (Subheadings)
  let version1 = '';
  const cleanParas = paragraphs.map(p => p.replace(/^\*\*|\*\*$/g, '').replace(/^###\s+/g, '').replace(/^[-*•]\s+/g, '').trim());
  
  if (cleanParas.length <= 1) {
    const sentences = text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
    if (sentences.length > 4) {
      const mid = Math.floor(sentences.length / 2);
      const part1 = sentences.slice(0, mid).join(' ');
      const part2 = sentences.slice(mid).join(' ');
      
      const words = part2.split(/\s+/).slice(0, 4).join(' ').replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
      const headerTitle = words ? `**Fokus: ${words}**` : '**Hintergrund & Vertiefung**';
      version1 = `${part1}\n\n${headerTitle}\n${part2}`;
    } else {
      version1 = `**Fokus: Einleitung**\n${text}`;
    }
  } else {
    const result: string[] = [];
    cleanParas.forEach((p, idx) => {
      if (idx === 0) {
        result.push(p);
      } else {
        const words = p.split(/\s+/).slice(0, 4).join(' ').replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
        const headerTitle = words ? `**Fokus: ${words}**` : '**Vertiefende Betrachtung**';
        result.push(headerTitle);
        result.push(p);
      }
    });
    version1 = result.join('\n\n');
  }

  // 2. Version 2: Listen & Stichpunkte (List & Bullets)
  let version2 = '';
  if (cleanParas.length > 0) {
    const firstPara = cleanParas[0];
    const sentences = firstPara.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
    if (sentences.length >= 3) {
      const intro = sentences[0];
      const bulletItems = sentences.slice(1).map(s => `- ${s}`);
      version2 = `${intro}\n${bulletItems.join('\n')}`;
      if (cleanParas.length > 1) {
        version2 += '\n\n' + cleanParas.slice(1).join('\n\n');
      }
    } else if (cleanParas.length > 1) {
      const secondPara = cleanParas[1];
      const secondSentences = secondPara.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
      const bullets = secondSentences.map(s => `- ${s}`);
      version2 = `${firstPara}\n\n${bullets.join('\n')}`;
      if (cleanParas.length > 2) {
        version2 += '\n\n' + cleanParas.slice(2).join('\n\n');
      }
    } else {
      const sentences = text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
      version2 = sentences.map(s => `- ${s}`).join('\n');
    }
  } else {
    version2 = text;
  }

  // 3. Version 3: Kurze Abschnitte (Short Paragraphs)
  const allSentences = text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
  const groupedParas: string[] = [];
  for (let i = 0; i < allSentences.length; i += 2) {
    const chunk = allSentences.slice(i, i + 2).join(' ');
    groupedParas.push(chunk);
  }
  const version3 = groupedParas.join('\n\n');

  return { version_1: version1, version_2: version2, version_3: version3 };
}

interface ImageInsertModalInnerProps {
  onClose: () => void;
  onInstantInsert: (imageId: string, base64: string, tag: string) => void;
}

function ImageInsertModalInner({ onClose, onInstantInsert }: ImageInsertModalInnerProps) {
  const [floatVal, setFloatVal] = useState<'none' | 'left' | 'right'>('none');
  const [widthVal, setWidthVal] = useState<number>(85);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawBase64 = event.target?.result as string;
      if (!rawBase64) return;
      const img = new Image();
      img.onload = () => {
        let w = img.width; let h = img.height;
        const maxDim = 1200;
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
          else { w = Math.round((w * maxDim) / h); h = maxDim; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
          const newId = `img_${Date.now()}`;
          const tag = `:::custom_image ${newId} float:${floatVal} width:${widthVal}`;
          onInstantInsert(newId, compressedBase64, tag);
        }
      };
      img.src = rawBase64;
    };
    reader.readAsDataURL(file);
  };

  const handleTriggerPicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={{
      backgroundColor: '#0f172a',
      border: '1px solid #38bdf8',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '420px',
      width: '95%',
      boxShadow: '0 20px 40px rgba(0,0,0,0.7)',
      display: 'flex', flexDirection: 'column', gap: '16px',
      color: '#fff'
    }} onClick={e => e.stopPropagation()}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#38bdf8' }}>Bild vom Schreibtisch einfügen</h3>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Klicke in die Box, um deine Bilddatei auszuwählen:</label>
        
        <div 
          onClick={handleTriggerPicker}
          style={{ 
            padding: '28px 16px', 
            border: '2px dashed #38bdf8', 
            borderRadius: '10px', 
            background: 'rgba(56,189,248,0.05)', 
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <span style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 700, display: 'block' }}>
            📁 Datei auswählen (Schreibtisch / PC)
          </span>
          <span style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
            Wird beim Auswählen sofort auf der aktuellen Seite eingefügt
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#1e293b', padding: '12px', borderRadius: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Text-Umfluss:</label>
          <select 
            value={floatVal} 
            onChange={e => setFloatVal(e.target.value as any)} 
            style={{ width: '100%', fontSize: '12px', padding: '6px', border: '1px solid #475569', borderRadius: '6px', backgroundColor: '#0f172a', color: '#fff' }}
          >
            <option value="none">Zentriert (Eigene Zeile)</option>
            <option value="left">Links umflossen</option>
            <option value="right">Rechts umflossen</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Größe: {widthVal}%</label>
          <input 
            type="range" 
            min="25" 
            max="100" 
            value={widthVal} 
            onChange={e => setWidthVal(Number(e.target.value))} 
            style={{ width: '100%', accentColor: '#38bdf8', marginTop: '6px' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <button
          onClick={onClose}
          style={{ flex: 1, padding: '10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #475569', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontWeight: 600 }}
        >
          Abbrechen
        </button>
        <button
          onClick={handleTriggerPicker}
          style={{ flex: 1.5, padding: '10px', fontSize: '12px', fontWeight: 700, backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '6px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(56,189,248,0.3)' }}
        >
          Bild auswählen & einfügen
        </button>
      </div>
    </div>
  );
}
