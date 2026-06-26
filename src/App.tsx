import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Play, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Key, 
  FileDown,
  Plus,
  Trash2,
  Moon,
  Sun,
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
  Image as ImageIcon
} from 'lucide-react';
import { GeminiService } from './services/GeminiService';
import type { BookOutline, BookOutlinePage } from './services/GeminiService';
import type { ChapterMemory, CmieConfig, CmiePageStatus } from './types/cmie';
import { CmieOrchestrator } from './services/cmie/CmieOrchestrator';
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
} from './services/StorageService';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Auth } from './components/Auth';

// Run migration once at module load (before any state is initialized)
migrateOldKeys();

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

interface Book {
  id: string;
  title: string;
  subtitle: string;
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
  pagesOverflow?: { [key: number]: boolean };
  showRunningHeader?: boolean;
  showPageNumbers?: boolean;
  noQuotes?: boolean;
  showChapterTitles?: boolean;
  pagesHideChapter?: number[];
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
  
  titlePageSubtitleAlign?: 'left' | 'center' | 'right';
  titlePageSubtitleSize?: number;
  titlePageSubtitleFont?: string;
  titlePageSubtitleX?: number;
  titlePageSubtitleY?: number;

  titlePageAuthorAlign?: 'left' | 'center' | 'right';
  titlePageAuthorSize?: number;
  titlePageAuthorFont?: string;
  titlePageAuthorX?: number;
  titlePageAuthorY?: number;

  titlePagePublisherAlign?: 'left' | 'center' | 'right';
  titlePagePublisherSize?: number;
  titlePagePublisherFont?: string;
  titlePagePublisherX?: number;
  titlePagePublisherY?: number;
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
      date = new Date(); // Fallback
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
  | { type: 'box'; title: string; children: WorkbookBlock[]; styleNum?: number }
  | { type: 'pagebreak' }
  | { type: 'ornament' }
  | { type: 'heading'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'bullet'; text: string }
  | { type: 'image'; prompt: string; width?: number; float?: 'none' | 'left' | 'right' }
  | { type: 'custom_image'; id: string; width?: number; float?: 'none' | 'left' | 'right' };

export const parsePageLines = (rawLines: string[]): WorkbookBlock[] => {
  const blocks: WorkbookBlock[] = [];
  let i = 0;
  while (i < rawLines.length) {
    const raw = rawLines[i];
    const trimmed = raw.trim().replace(/ {2,}/g, ' ');
    if (!trimmed) { i++; continue; }

    // :::box ... :::
    if (/^:::box/i.test(trimmed)) {
      const match = trimmed.match(/^:::box\s*(\d+)?\s*(.*)/i);
      const styleNum = match && match[1] ? parseInt(match[1]) : 1;
      const boxTitle = match && match[2] ? match[2].trim() : '';
      i++;
      const innerLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim() !== ':::') {
        innerLines.push(rawLines[i]);
        i++;
      }
      i++; // skip closing :::
      blocks.push({ type: 'box', title: boxTitle, children: parsePageLines(innerLines), styleNum });
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
    if (trimmed.startsWith('> ')) {
      blocks.push({ type: 'quote', text: trimmed.slice(2) });
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

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousedown', handleGlobalDown);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousedown', handleGlobalDown);
    };
  }, [transform, onChange, liveX, currFloat, isFloated]);

  // Ensure bottom margin is strictly positive (>= 12px) so text NEVER overlaps the image
  const topMargin = Math.max(4, 10 + liveY);
  const botMargin = Math.max(12, 14 - liveY);

  return (
    <div
      ref={boxRef}
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

export default function App() {
  // Firebase Auth states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Sync state with Firebase auth status
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);

        // Clear any cached data from a previous (different) user to prevent data leakage
        const lastUid = localStorage.getItem('b24studio_last_uid');
        if (lastUid && lastUid !== user.uid) {
          // Different user logged in — wipe all local caches
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('b24studio_v1')) keysToRemove.push(k);
          }
          keysToRemove.forEach(k => localStorage.removeItem(k));
        }
        localStorage.setItem('b24studio_last_uid', user.uid);

        // Load accounts from Firestore (source of truth — never use localStorage of another user)
        const cloudAccs = await loadAccountsFromCloud(user.uid);
        if (cloudAccs && cloudAccs.length > 0) {
          setAccounts(cloudAccs);
        }

        // Load books
        const activeAcc = localStorage.getItem(KEYS.activeAccount) || 'default';
        const localBooksStr = localStorage.getItem(KEYS.library(activeAcc));
        let localBooks = null;
        try {
          if (localBooksStr) localBooks = JSON.parse(localBooksStr);
        } catch (e) {}

        const cloudBooks = await loadBooksFromCloud(user.uid);
        
        let finalBooks = cloudBooks;

        // If localBooks exist and have content, we prefer localBooks to prevent data loss on refresh 
        // (because cloud saves are debounced and might have been killed during F5).
        // We do a simple merge: if localBook has more pages or outline, we keep it.
        if (localBooks && localBooks.length > 0) {
          if (!cloudBooks || cloudBooks.length === 0) {
            finalBooks = localBooks;
          } else {
            finalBooks = localBooks.map((localBook: any) => {
              const cloudBook = cloudBooks.find((cb: any) => cb.id === localBook.id);
              if (!cloudBook) return localBook;
              
              // Smart deep merge: always preserve all local images, transforms, and text edits
              return {
                ...cloudBook,
                ...localBook,
                images: { ...(cloudBook.images || {}), ...(localBook.images || {}) },
                imagesTransform: { ...(cloudBook.imagesTransform || {}), ...(localBook.imagesTransform || {}) },
                pagesText: { ...(cloudBook.pagesText || {}), ...(localBook.pagesText || {}) },
                pagesOverflow: { ...(cloudBook.pagesOverflow || {}), ...(localBook.pagesOverflow || {}) }
              };
            });
            // Add any cloud books that aren't in local
            cloudBooks.forEach((cb: any) => {
              if (!finalBooks.find((fb: any) => fb.id === cb.id)) {
                finalBooks.push(cb);
              }
            });
          }
        }

        if (finalBooks && finalBooks.length > 0) {
          // Reset any 'generating' status stuck from previous session
          const cleanBooks = finalBooks.map((b: any) => ({
            ...b,
            pagesStatus: Object.fromEntries(
              Object.entries(b.pagesStatus || {}).map(([k, v]) => [k, v === 'generating' ? 'idle' : v])
            )
          }));
          setBooksState(cleanBooks);
          localStorage.setItem(KEYS.library(activeAcc), JSON.stringify(cleanBooks));
        } else {
          setBooksState([]);
        }
      } else {
        setCurrentUser(null);
        // Do not wipe localStorage on null auth emission (prevents localhost F5 race condition data loss)
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Theme Manager
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem(KEYS.theme) as 'dark' | 'light') || 'dark';
  });

  // Account System
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem(KEYS.accounts);
    return saved ? JSON.parse(saved) : [{ id: 'default', username: 'Haupt-Bibliothekar' }];
  });
  const [activeAccountId, setActiveAccountIdState] = useState<string>(() => {
    return localStorage.getItem(KEYS.activeAccount) || 'default';
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
    return localStorage.getItem('groq_api_keys') || localStorage.getItem('groq_api_key') || '';
  });
  const [geminiKeysInput, setGeminiKeysInput] = useState<string>(() => {
    return localStorage.getItem('gemini_api_keys') || '';
  });
  const [showKeyInput, setShowKeyInput] = useState<boolean>(() => {
    const groqEmpty = !(localStorage.getItem('groq_api_keys') || localStorage.getItem('groq_api_key'));
    const geminiEmpty = !localStorage.getItem('gemini_api_keys');
    return groqEmpty && geminiEmpty;
  });

  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem(KEYS.selectedModel) || 'llama-3.3-70b-versatile';
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
    measurer.style.wordBreak = 'break-word';
    measurer.style.padding = '0';
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
          p.style.margin = '0';
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
          const div = document.createElement('div');
          div.className = 'workbook-box';
          div.style.border = '1.5px dashed #475569';
          div.style.borderRadius = '4px';
          div.style.padding = '10px 10px 8px';
          div.style.margin = '8px 0';
          div.style.position = 'relative';
          
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
    const savedId = localStorage.getItem('b24studio_activeBookId');
    if (savedId) return savedId;
    const activeAcc = localStorage.getItem(KEYS.activeAccount) || 'default';
    const saved = localStorage.getItem(KEYS.library(activeAcc));
    if (saved) {
      const parsed = JSON.parse(saved) as Book[];
      return parsed.length > 0 ? parsed[0].id : null;
    }
    return null;
  });
  const activeBook = books.find(b => b.id === activeBookId) || null;

  // Layout Tab Manager
  const [activeTab, setActiveTab] = useState<'projects' | 'studio' | 'dashboard'>(() => {
    return (localStorage.getItem('b24studio_activeTab') as any) || 'projects';
  });

  // Resizable Panes States
  const [leftWidth, setLeftWidth] = useState<number>(() => {
    const saved = localStorage.getItem('b24studio_left_width');
    return saved ? parseInt(saved, 10) : 270;
  });
  const [rightWidth, setRightWidth] = useState<number>(() => {
    const saved = localStorage.getItem('b24studio_right_width');
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
    const saved = localStorage.getItem('b24studio_selectedPage');
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
    if (activeBookId) localStorage.setItem('b24studio_activeBookId', activeBookId);
    else localStorage.removeItem('b24studio_activeBookId');
  }, [activeBookId]);

  useEffect(() => {
    if (selectedPage !== null) localStorage.setItem('b24studio_selectedPage', JSON.stringify(selectedPage));
    else localStorage.removeItem('b24studio_selectedPage');
  }, [selectedPage]);
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
  const [draggingItem, setDraggingItem] = useState<'emblem' | 'title' | 'subtitle' | 'author' | 'publisher' | null>(null);
  const [hoveredField, setHoveredField] = useState<'title' | 'subtitle' | 'author' | 'publisher' | null>(null);
  const [editingField, setEditingField] = useState<'title' | 'subtitle' | 'author' | 'publisher' | null>(null);
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
        setActiveBookId(parsed[0].id);
      } else {
        setActiveBookId(null);
      }
    } else {
      setBooks([]);
      setActiveBookId(null);
    }
    setSelectedPage('title');
  }, [activeAccountId]);

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
      const noQuoteRule = 'ABSOLUTE REGEL: Verwende KEINE urheberrechtlich geschützten Inhalte oder geschützten Charaktere. Historische Zitate oder Zitate bekannter Persönlichkeiten sind zulässig, sofern sie gemeinfrei/legal sind. Setze Zitate sehr sparsam ein (maximal ein Zitat pro Kapitel). Jedes Zitat MUSS zwingend folgendes Format haben – auf einer eigenen Zeile, eingeleitet mit "> ", dann das Zitat in Anführungszeichen, dann IMMER ein Gedankenstrich und der echte Autor-Name, OHNE AUSNAHME. Beispiele:\n> "Wissen ist Macht." — Francis Bacon\n> "Das Leben ist kurz, die Kunst ist lang." — Hippokrates\nEIN ZITAT OHNE AUTORENANGABE IST VERBOTEN. Format: > "[Zitat]" — [Vorname Nachname]';
      g = g ? `${g}\n${noQuoteRule}` : noQuoteRule;
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
      alert(`Bitte tragen Sie zuerst einen API Key für ${providerName} ein.`);
      setShowKeyInput(true);
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
      alert(`Bitte tragen Sie zuerst einen API Key für ${providerName} ein (oben unter "Keys benötigt" oder "API Keys").`);
      setShowKeyInput(true);
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
          title: 'Fehler',
          message: 'Fehler bei der Inhaltsplanung: ' + (err.message || err),
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
      alert(`Bitte tragen Sie zuerst einen API Key für ${providerName} ein.`);
      setShowKeyInput(true);
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
      alert(`Bitte tragen Sie zuerst einen API Key für ${providerName} ein.`);
      setShowKeyInput(true);
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
      alert(`Bitte zuerst einen API Key für ${providerName} eintragen.`);
      setShowKeyInput(true);
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
      alert(`Bitte zuerst einen API Key für ${providerName} eintragen.`);
      setShowKeyInput(true);
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
      alert(`Bitte tragen Sie zuerst einen API Key für ${providerName} ein (oben unter "Keys benötigt" oder "API Keys").`);
      setShowKeyInput(true);
      return;
    }
    setIsGenerating(true);
    cancelGenerationRef.current = false;
    const service = getServiceInstance();
    const textAccumulator: { [key: number]: string } = {};
    let hasGeneratedAny = false;

    for (let pageNum = 1; pageNum <= currentOutline.target_pages; pageNum++) {
      if (cancelGenerationRef.current) {
        break;
      }
      // Find the absolute latest book state inside the loop
      const currentBook = booksRef.current.find(b => b.id === targetBookId);
      if (!currentBook) break;

      const pagesStatus = currentBook.pagesStatus || {};
      const pagesText = currentBook.pagesText || {};

      // Skip already completed pages but store their text in the context accumulator
      if (pagesStatus[pageNum] === 'completed') {
        textAccumulator[pageNum] = pagesText[pageNum] || '';
        continue;
      }

      if (hasGeneratedAny) {
        const isGroq = !selectedModel.startsWith('gemini-');
        const delayMs = isGroq ? 8500 : 4500;
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      hasGeneratedAny = true;

      setBooks(prev => prev.map(b => {
        if (b.id === targetBookId) {
          return {
            ...b,
            pagesStatus: { ...(b.pagesStatus || {}), [pageNum]: 'generating' }
          };
        }
        return b;
      }));

      try {
        const cmieEnrichment = CmieOrchestrator.enrichGenerationPrompt(
          currentBook.cmieStore,
          currentBook.cmieGlossary,
          currentBook.pagesError?.[pageNum]
        );
        let rawText = await service.generatePage(
          currentOutline,
          pageNum,
          textAccumulator,
          currentBook.writingStyle || 'Sachbuch / Informativ',
          currentBook.pageSize,
          currentBook.fontSize,
          false,
          getEffectiveGuidelines(currentBook),
          currentBook.autoChapterGraphics || false,
          cmieEnrichment
        );
        let text = cleanPageText(rawText);

        // Check overflow and retry/truncate if needed
        const hasOverflow = checkTextOverflow(text, currentBook, pageNum);
        if (hasOverflow) {
          console.log(`Page ${pageNum} overflows. Retrying with shorter generation...`);
          try {
            const retryRawText = await service.generatePage(
              currentOutline,
              pageNum,
              textAccumulator,
              currentBook.writingStyle || 'Sachbuch / Informativ',
              currentBook.pageSize,
              currentBook.fontSize,
              true, // shorterRetry = true
              getEffectiveGuidelines(currentBook),
              currentBook.autoChapterGraphics || false,
              cmieEnrichment
            );
            const retryText = cleanPageText(retryRawText);
            if (checkTextOverflow(retryText, currentBook, pageNum)) {
              console.log(`Page ${pageNum} STILL overflows. Applying truncateToFit fallback...`);
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
        textAccumulator[pageNum] = text;

        if (cancelGenerationRef.current) {
          // Revert current page to idle if we canceled while writing was in-flight
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

        const pageInfo = currentOutline.pages.find(p => p.page_number === pageNum);
        const cmieRes = await CmieOrchestrator.inspectAndStorePage(
          pageNum,
          pageInfo?.chapter_title || `Seite ${pageNum}`,
          text,
          currentBook.extractedSourceText,
          currentBook.cmieStore,
          currentBook.cmieStatus,
          currentBook.cmieGlossary,
          currentBook.cmieConfig,
          (pageInfo as any)?.chapter_scope
        );

        let graphicDecisionSingle: GraphicDecision = { grafik_sinnvoll: false };
        if (currentBook.autoChapterGraphics !== false) {
          try {
            const pagesSinceGraph = NecessityDetector.evaluateDensityPlacement(pageNum, currentBook.pagesGraphic);
            const promptGraph = NecessityDetector.buildAnalysisPrompt(text, pagesSinceGraph, currentOutline?.language || 'de');
            const rawJsonGraph = await service.evaluateRawJson(promptGraph, text);
            graphicDecisionSingle = NecessityDetector.parseAndValidateDecision(rawJsonGraph, text);
          } catch(eG) { console.warn("AGVE Error:", eG); }
        }

        setBooks(prev => prev.map(b => {
          if (b.id === targetBookId) {
            return {
              ...b,
              pagesText: { ...(b.pagesText || {}), [pageNum]: text },
              pagesStatus: { ...(b.pagesStatus || {}), [pageNum]: cmieRes.passed ? 'completed' : 'failed' },
              pagesError: cmieRes.warningMessage ? { ...(b.pagesError || {}), [pageNum]: cmieRes.warningMessage } : (b.pagesError || {}),
              pagesOverflow: { ...(b.pagesOverflow || {}), [pageNum]: finalOverflow },
              cmieStore: { ...(b.cmieStore || {}), [pageNum]: cmieRes.memory },
              cmieStatus: { ...(b.cmieStatus || {}), [pageNum]: cmieRes.pageStatus },
              cmieGlossary: cmieRes.updatedGlossary,
              pagesGraphic: graphicDecisionSingle.grafik_sinnvoll ? { ...(b.pagesGraphic || {}), [pageNum]: graphicDecisionSingle } : (b.pagesGraphic || {})
            };
          }
          return b;
        }));

        setSelectedPage(prev => prev === null ? pageNum : prev);

      } catch (err: any) {
        console.error(`Page ${pageNum} error:`, err);
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
        alert(`Fehler beim Schreiben von Seite ${pageNum}: ${err.message || err}`);
        break; 
      }
    }
    setIsGenerating(false);
  };

  // Retry generating single page
  const handleRetryPage = async (pageNum: number) => {
    if (!hasKeysForModel(selectedModel)) {
      const providerName = selectedModel.startsWith('gemini-') ? 'Google Gemini' : 'Groq';
      alert(`Bitte tragen Sie zuerst einen API Key für ${providerName} ein (oben unter "Keys benötigt" oder "API Keys").`);
      setShowKeyInput(true);
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
      const cmieEnrichmentBulk = CmieOrchestrator.enrichGenerationPrompt(
        currentBook.cmieStore,
        currentBook.cmieGlossary,
        currentBook.pagesError?.[pageNum]
      );
      let rawText = await service.generatePage(
        outline,
        pageNum,
        currentBook.pagesText || {},
        currentBook.writingStyle,
        currentBook.pageSize,
        currentBook.fontSize,
        false,
        getEffectiveGuidelines(currentBook),
        currentBook.autoChapterGraphics || false,
        cmieEnrichmentBulk
      );
      let text = cleanPageText(rawText);

      // Check overflow and retry/truncate if needed
      const hasOverflow = checkTextOverflow(text, currentBook, pageNum);
      if (hasOverflow) {
        console.log(`Page ${pageNum} overflows. Retrying with shorter generation...`);
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
            currentBook.autoChapterGraphics || false,
            cmieEnrichmentBulk
          );
          const retryText = cleanPageText(retryRawText);
          if (checkTextOverflow(retryText, currentBook, pageNum)) {
            console.log(`Page ${pageNum} STILL overflows. Applying truncateToFit fallback...`);
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
      if (currentBook.autoChapterGraphics !== false) {
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
            pagesStatus: { ...(b.pagesStatus || {}), [pageNum]: cmieResBulk.passed ? 'completed' : 'failed' },
            pagesError: cmieResBulk.warningMessage ? { ...(b.pagesError || {}), [pageNum]: cmieResBulk.warningMessage } : (b.pagesError || {}),
            pagesOverflow: { ...(b.pagesOverflow || {}), [pageNum]: finalOverflow },
            cmieStore: { ...(b.cmieStore || {}), [pageNum]: cmieResBulk.memory },
            cmieStatus: { ...(b.cmieStatus || {}), [pageNum]: cmieResBulk.pageStatus },
            cmieGlossary: cmieResBulk.updatedGlossary,
            pagesGraphic: graphicDecisionBulk.grafik_sinnvoll ? { ...(b.pagesGraphic || {}), [pageNum]: graphicDecisionBulk } : (b.pagesGraphic || {})
          };
        }
        return b;
      }));
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
      alert(`Bitte tragen Sie zuerst einen API Key für ${providerName} ein.`);
      setShowKeyInput(true);
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
      alert(`Bitte tragen Sie zuerst einen API Key für ${providerName} ein.`);
      setShowKeyInput(true);
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
      alert(`Bitte tragen Sie zuerst einen API Key für ${providerName} ein.`);
      setShowKeyInput(true);
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
      alert(`Bitte tragen Sie zuerst einen API Key für ${providerName} ein.`);
      setShowKeyInput(true);
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
      alert(`Bitte tragen Sie zuerst einen API Key für ${providerName} ein.`);
      setShowKeyInput(true);
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
      alert(`Bitte tragen Sie zuerst einen API Key für ${providerName} ein.`);
      setShowKeyInput(true);
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
      alert(`Bitte tragen Sie zuerst einen API Key für ${providerName} ein.`);
      setShowKeyInput(true);
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
    if (!activeBook || !activeBook.outline) return;
    try {
      const config: PdfConfig = {
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
        titlePageSubtitleAlign: activeBook.titlePageSubtitleAlign || 'center',
        titlePageSubtitleSize: activeBook.titlePageSubtitleSize || 12,
        titlePageSubtitleFont: activeBook.titlePageSubtitleFont || 'times',
        titlePageSubtitleX: activeBook.titlePageSubtitleX || 0,
        titlePageSubtitleY: activeBook.titlePageSubtitleY || 0,
        titlePageAuthorAlign: activeBook.titlePageAuthorAlign || 'center',
        titlePageAuthorSize: activeBook.titlePageAuthorSize || 14,
        titlePageAuthorFont: activeBook.titlePageAuthorFont || 'times',
        titlePageAuthorX: activeBook.titlePageAuthorX || 0,
        titlePageAuthorY: activeBook.titlePageAuthorY || 0,
        titlePagePublisherAlign: activeBook.titlePagePublisherAlign || 'center',
        titlePagePublisherSize: activeBook.titlePagePublisherSize || 10,
        titlePagePublisherFont: activeBook.titlePagePublisherFont || 'times',
        titlePagePublisherX: activeBook.titlePagePublisherX || 0,
        titlePagePublisherY: activeBook.titlePagePublisherY || 0,
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
            {tocPages.length > 1 && ` (${pageIndex + 1}/${tocPages.length})`}
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
      } else if (draggingItem === 'author') {
        // Author and Publisher are always fixed at the bottom — no dragging
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
          left: '20px',
          right: '20px',
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
                if (e.key === 'Enter' && !e.shiftKey) {
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
                fontWeight: 'bold',
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
                boxSizing: 'border-box'
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
                fontWeight: 'bold',
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
                position: 'relative'
              }}
            >
              {activeBook.title || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>[Titel]</span>}
              {(hoveredField === 'title' || activeCoverEditField === 'title') && (
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
                if (e.key === 'Enter' && !e.shiftKey) {
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
                fontWeight: 'normal',
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
                boxSizing: 'border-box'
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
                fontWeight: 'normal',
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
                position: 'relative'
              }}
            >
              {activeBook.subtitle || '[Untertitel hinzufügen]'}
              {(hoveredField === 'subtitle' || activeCoverEditField === 'subtitle') && (
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
              title="Doppelklick zum Bearbeiten"
              style={{
                fontSize: `${(activeBook.titlePageAuthorSize || 14) * previewScaleY}px`,
                fontFamily: getCssFontFamily(activeBook.titlePageAuthorFont, 'times'),
                color: '#0f172a',
                lineHeight: '1.2',
                cursor: 'text',
                padding: '2px 8px'
              }}
            >
              {activeBook.authorName || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>[Autorenname]</span>}
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
              title="Doppelklick zum Bearbeiten"
              style={{
                fontSize: `${(activeBook.titlePagePublisherSize || 10) * previewScaleY}px`,
                fontFamily: getCssFontFamily(activeBook.titlePagePublisherFont, 'times'),
                color: '#475569',
                lineHeight: '1.2',
                cursor: 'text',
                padding: '2px 8px'
              }}
            >
              {activeBook.publisherLine || publisherLine}
            </div>
          )}
        </div>
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

    const makeEditable = (path: number[]) => ({
      contentEditable: true,
      suppressContentEditableWarning: true,
      onBlur: (e: React.FocusEvent<any>) => {
        const text = e.currentTarget.innerText || '';
        handleBlockTextChange(path, text);
      },
      onKeyDown: (e: React.KeyboardEvent<any>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }
    });

    const renderWbBlock = (block: WorkbookBlock, path: number[]): React.ReactNode => {
      const key = path.join('-');
      switch (block.type) {
        case 'pagebreak':
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '12px 0', width: '100%' }}>
              <div style={{ flex: 1, borderTop: '1px dashed #cbd5e1' }} />
              <span style={{ fontSize: '7px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Seitenumbruch (PDF)</span>
              <div style={{ flex: 1, borderTop: '1px dashed #cbd5e1' }} />
            </div>
          );

        case 'ornament':
          return (
            <p key={key} style={{ textAlign: 'center', fontSize: '10px', margin: '8px 0', color: '#64748b' }}>
              {activeBook.chapterOrnament || '\u2767'}
            </p>
          );

        case 'heading':
          return (
            <p 
              key={key} 
              className="literary-paragraph" 
              style={{ fontWeight: 'bold', marginTop: path[path.length - 1] > 0 ? '0.4em' : '0', margin: '0', padding: '0', lineHeight: '1.5', outline: 'none' }}
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
          const isFloated = floatVal === 'left' || floatVal === 'right';

          return (
            <div 
              key={key} 
              draggable={true}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({ sourcePath: path }));
              }}
              style={{
                margin: isFloated ? '4px 10px' : '16px auto',
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
                width: `${widthVal}%`,
                float: isFloated ? floatVal : undefined,
                clear: isFloated ? undefined : 'both',
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

  if (authLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontFamily: "'Poppins', sans-serif", fontSize: '13px', gap: '8px' }}>
        <Loader2 className="spinner" style={{ width: '18px', height: '18px' }} />
        <span>Lade Book24 Studio...</span>
      </div>
    );
  }

  if (!currentUser) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  return (
    <div className="app-container">

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

        <div className="header-right">
          {/* Navigation Tabs — in header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: '10px' }}>
            <button
              onClick={() => setActiveTab('projects')}
              style={{
                padding: '6px 16px',
                fontSize: '13.5px',
                fontWeight: activeTab === 'projects' ? 600 : 400,
                fontFamily: 'var(--font-display)',
                background: activeTab === 'projects' ? 'var(--primary-glow)' : 'transparent',
                border: '1px solid ' + (activeTab === 'projects' ? 'var(--primary)' : 'transparent'),
                borderRadius: '4px',
                color: activeTab === 'projects' ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Mediathek
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              style={{
                padding: '6px 16px',
                fontSize: '13.5px',
                fontWeight: activeTab === 'dashboard' ? 600 : 400,
                fontFamily: 'var(--font-display)',
                background: activeTab === 'dashboard' ? 'rgba(34,197,94,0.12)' : 'transparent',
                border: '1px solid ' + (activeTab === 'dashboard' ? '#22c55e' : 'transparent'),
                borderRadius: '4px',
                color: activeTab === 'dashboard' ? '#22c55e' : 'var(--text-muted)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('studio')}
              disabled={!activeBook}
              style={{
                padding: '6px 16px',
                fontSize: '13.5px',
                fontWeight: activeTab === 'studio' ? 600 : 400,
                fontFamily: 'var(--font-display)',
                background: activeTab === 'studio' ? 'var(--primary-glow)' : 'transparent',
                border: '1px solid ' + (activeTab === 'studio' ? 'var(--primary)' : 'transparent'),
                borderRadius: '4px',
                color: activeTab === 'studio' ? 'var(--primary)' : (!activeBook ? 'var(--border-color)' : 'var(--text-muted)'),
                cursor: activeBook ? 'pointer' : 'not-allowed',
                whiteSpace: 'nowrap',
              }}
            >
              Schreibstudio
            </button>
          </div>

          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }} />

          {/* Active Account Switcher */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowAccountModal(!showAccountModal)} className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)', fontSize: '13px', fontWeight: 500, color: 'var(--text-main)' }}>
              <span>{(accounts.find(a => a.id === activeAccountId)?.username) || 'Profil'}</span>
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

          {/* Theme Toggle */}
          <button onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')} className="btn">
            {theme === 'dark' ? <Sun style={{ width: '14px', height: '14px', color: 'var(--warning)' }} /> : <Moon style={{ width: '14px', height: '14px', color: 'var(--primary)' }} />}
          </button>

          {/* API Key Connection */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {getActiveKeys('llama-3.3-70b-versatile').length > 0 ? (
              <button 
                onClick={() => setShowKeyInput(true)} 
                className="btn" 
                style={{ 
                  background: 'transparent', 
                  border: '1px solid var(--border-color)', 
                  fontSize: '11.5px', 
                  padding: '4px 8px',
                  height: '28px',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  color: 'var(--text-main)'
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--success)', display: 'inline-block' }} />
                <span>Groq</span>
              </button>
            ) : (
              <button 
                onClick={() => setShowKeyInput(true)} 
                className="btn" 
                style={{ 
                  background: 'transparent', 
                  border: '1px solid var(--error)', 
                  fontSize: '11.5px', 
                  padding: '4px 8px',
                  height: '28px',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  color: 'var(--error)'
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--error)', display: 'inline-block' }} />
                <span>Groq fehlt</span>
              </button>
            )}

            {getActiveKeys('gemini-2.0-flash').length > 0 ? (
              <button 
                onClick={() => setShowKeyInput(true)} 
                className="btn" 
                style={{ 
                  background: 'transparent', 
                  border: '1px solid var(--border-color)', 
                  fontSize: '11.5px', 
                  padding: '4px 8px',
                  height: '28px',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  color: 'var(--text-main)'
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--success)', display: 'inline-block' }} />
                <span>Gemini</span>
              </button>
            ) : (
              <button 
                onClick={() => setShowKeyInput(true)} 
                className="btn" 
                style={{ 
                  background: 'transparent', 
                  border: '1px solid var(--error)', 
                  fontSize: '11.5px', 
                  padding: '4px 8px',
                  height: '28px',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  color: 'var(--error)'
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--error)', display: 'inline-block' }} />
                <span>Gemini fehlt</span>
              </button>
            )}
          </div>

          {/* User Profile & Logout */}
          {currentUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }} />
              {currentUser.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt="Profile" 
                  style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid var(--border-color)', objectFit: 'cover' }} 
                />
              ) : (
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                  {currentUser.displayName ? currentUser.displayName[0] : (currentUser.email ? currentUser.email[0].toUpperCase() : 'U')}
                </div>
              )}
              <button 
                onClick={() => {
                  showConfirm({
                    title: 'Abmelden',
                    message: 'Möchtest du dich wirklich abmelden?',
                    confirmLabel: 'Abmelden',
                    danger: true,
                    onConfirm: () => signOut(auth)
                  });
                }} 
                className="btn btn-danger" 
                style={{ padding: '4px 10px', fontSize: '11px', height: '26px' }}
              >
                Abmelden
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Workspace Area */}
      <div className="workspace-content">
        
        {/* Tab 1: Projects Mediathek Grid view */}
        {activeTab === 'projects' && (
          <div className="mediathek-container">
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
                      <div
                        style={{
                          marginTop: '10px',
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
        )}


        {/* Tab: Dashboard */}
        {activeTab === 'dashboard' && (
          <div style={{ padding: '32px 40px', overflowY: 'auto', height: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column', gap: '32px', background: 'var(--bg-main)' }}>

            {/* TOP BAR */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>KDP Publishing Studio</div>
                <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: 1 }}>Übersicht</h1>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'right' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                <div style={{ marginTop: '2px' }}>{books.filter(b => b.bookStatus === 'uploaded').length} von {books.length} Büchern hochgeladen</div>
              </div>
            </div>

            {/* KPI CARDS */}
            {(() => {
              const total = books.length;
              const uploaded = books.filter(b => b.bookStatus === 'uploaded').length;
              const done = books.filter(b => b.bookStatus === 'done').length;
              const inProgress = books.filter(b => !b.bookStatus || b.bookStatus === 'working').length;
              const totalPagesGenerated = books.reduce((s, b) => s + Object.values(b.pagesStatus || {}).filter((x: string) => x === 'completed').length, 0);
              const thisMonth = books.filter(b => {
                if (!b.uploadedAt) return false;
                const d = new Date(b.uploadedAt);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              }).length;
              const kpis = [
                { value: total,               label: 'Buchprojekte',    sub: 'gesamt',            accent: '#6366f1', bar: total > 0 ? uploaded / total : 0 },
                { value: uploaded,            label: 'Hochgeladen',     sub: 'auf Amazon KDP',    accent: '#22c55e', bar: total > 0 ? uploaded / total : 0 },
                { value: done,                label: 'Fertig',          sub: 'bereit zum Upload', accent: '#3b82f6', bar: total > 0 ? done / total : 0 },
                { value: totalPagesGenerated, label: 'Seiten generiert',sub: 'aller Bücher',      accent: '#a855f7', bar: Math.min(totalPagesGenerated / Math.max(total * 100, 1), 1) },
                { value: inProgress,          label: 'In Bearbeitung',  sub: 'aktive Projekte',   accent: '#f59e0b', bar: total > 0 ? inProgress / total : 0 },
                { value: thisMonth,           label: 'Diesen Monat',    sub: 'hochgeladen',       accent: '#ec4899', bar: uploaded > 0 ? thisMonth / uploaded : 0 },
              ];
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {kpis.map((k, i) => (
                    <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px 26px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: k.accent + '18', filter: 'blur(20px)', pointerEvents: 'none' }} />
                      <div style={{ fontSize: '42px', fontWeight: 900, color: k.accent, lineHeight: 1, letterSpacing: '-0.04em' }}>{k.value.toLocaleString('de-DE')}</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginTop: '8px' }}>{k.label}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{k.sub}</div>
                      <div style={{ marginTop: '16px', height: '3px', background: 'var(--border-color)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: (k.bar * 100) + '%', background: k.accent, borderRadius: '99px', transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* CHART + PIPELINE */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px' }}>
              {/* Bar Chart */}
              {(() => {
                const now = new Date();
                type MonthItem = { label: string; fullLabel: string; count: number };
                const months: MonthItem[] = [];
                for (let i = 11; i >= 0; i--) {
                  const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                  months.push({
                    label: d.toLocaleDateString('de-DE', { month: 'short' }),
                    fullLabel: d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }),
                    count: books.filter(b => {
                      if (!b.uploadedAt) return false;
                      const ud = new Date(b.uploadedAt);
                      return ud.getMonth() === d.getMonth() && ud.getFullYear() === d.getFullYear();
                    }).length,
                  });
                }
                const maxVal = Math.max(...months.map(m => m.count), 1);
                const totalUploaded = months.reduce((s, m) => s + m.count, 0);
                return (
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '26px 28px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '24px' }}>
                      <div>
                        <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)' }}>KDP-Uploads</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Letzte 12 Monate &middot; {totalUploaded} Bücher hochgeladen</div>
                      </div>
                      <div style={{ display: 'flex', gap: '14px', fontSize: '11px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#6366f1', display: 'inline-block' }} />Vergangen
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#22c55e', display: 'inline-block' }} />Aktuell
                        </span>
                      </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '6px', height: '140px' }}>
                      {months.map((m, i) => {
                        const isCurrent = i === months.length - 1;
                        const pct = (m.count / maxVal) * 100;
                        return (
                          <div key={i} title={m.fullLabel + ': ' + m.count + ' Uploads'} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                            {m.count > 0 && <span style={{ fontSize: '10px', fontWeight: 800, color: isCurrent ? '#22c55e' : '#6366f1', lineHeight: 1 }}>{m.count}</span>}
                            <div style={{
                              width: '100%',
                              height: Math.max(pct, m.count > 0 ? 12 : 3) + '%',
                              minHeight: '3px',
                              borderRadius: '5px 5px 3px 3px',
                              background: isCurrent ? 'linear-gradient(180deg,#4ade80,#22c55e)' : m.count > 0 ? 'linear-gradient(180deg,#a5b4fc,#6366f1)' : 'var(--border-color)',
                              transition: 'height 0.5s ease',
                            }} />
                            <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: isCurrent ? 700 : 400 }}>{m.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Pipeline */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '26px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)' }}>Pipeline</div>
                {(['working', 'done', 'uploaded'] as const).map(s => {
                  const cfg = {
                    working:  { label: 'In Bearbeitung', accent: '#f59e0b' },
                    done:     { label: 'Fertig',          accent: '#3b82f6' },
                    uploaded: { label: 'Hochgeladen',     accent: '#22c55e' },
                  }[s];
                  const count = books.filter(b => (b.bookStatus || 'working') === s).length;
                  const pct = books.length > 0 ? Math.round((count / books.length) * 100) : 0;
                  return (
                    <div key={s}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '7px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>{cfg.label}</span>
                        <span style={{ fontSize: '22px', fontWeight: 900, color: cfg.accent, lineHeight: 1 }}>{count}</span>
                      </div>
                      <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: pct + '%', background: cfg.accent, borderRadius: '99px', transition: 'width 0.5s ease' }} />
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{pct}% aller Projekte</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BOOK TABLE */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 155px 100px 100px', padding: '14px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-main)' }}>
                {['Buchprojekt', 'Fortschritt', 'Status', 'Hochgeladen', ''].map((h, i) => (
                  <div key={i} style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</div>
                ))}
              </div>
              {books.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>Noch keine Buchprojekte</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Erstelle dein erstes Buch in der Mediathek</div>
                </div>
              ) : books.map((b, idx) => {
                const status = b.bookStatus || 'working';
                const donePages = Object.values(b.pagesStatus || {}).filter((s: string) => s === 'completed').length;
                const totalPages = b.outline?.target_pages || 0;
                const pct = totalPages > 0 ? Math.round((donePages / totalPages) * 100) : 0;
                const cfg = {
                  working:  { label: 'In Bearbeitung', accent: '#f59e0b' },
                  done:     { label: 'Fertig',          accent: '#3b82f6' },
                  uploaded: { label: 'Hochgeladen',     accent: '#22c55e' },
                }[status];
                return (
                  <div key={b.id} style={{
                    display: 'grid', gridTemplateColumns: '1fr 130px 155px 100px 100px',
                    alignItems: 'center', padding: '16px 24px',
                    borderBottom: idx < books.length - 1 ? '1px solid var(--border-color)' : 'none',
                    transition: 'background 0.12s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-main)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title || 'Unbenanntes Buch'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        <span style={{ padding: '1px 7px', borderRadius: '99px', background: cfg.accent + '18', color: cfg.accent, fontWeight: 600, fontSize: '10px', marginRight: '6px' }}>{cfg.label}</span>
                        {b.language === 'de' ? 'Deutsch' : 'Englisch'} &middot; {totalPages} Seiten
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '5px', background: 'var(--border-color)', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: pct + '%', background: pct === 100 ? '#22c55e' : '#6366f1', borderRadius: '99px', transition: 'width 0.4s' }} />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>{pct}%</span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>{donePages}/{totalPages}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {(['working', 'done', 'uploaded'] as const).map(s => {
                        const sc = ({ working: '#f59e0b', done: '#3b82f6', uploaded: '#22c55e' } as Record<string,string>)[s];
                        const sl = ({ working: 'Arbeit', done: 'Fertig', uploaded: 'Upload' } as Record<string,string>)[s];
                        const isActive = status === s;
                        return (
                          <button key={s}
                            onClick={() => setBooks(prev => prev.map(bk => bk.id === b.id ? { ...bk, bookStatus: s, uploadedAt: s === 'uploaded' ? (bk.uploadedAt || new Date().toISOString()) : bk.uploadedAt } : bk))}
                            style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, border: '1.5px solid ' + (isActive ? sc : 'var(--border-color)'), background: isActive ? sc + '20' : 'transparent', color: isActive ? sc : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s' }}
                          >{sl}</button>
                        );
                      })}
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {b.uploadedAt
                        ? <><div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{new Date(b.uploadedAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}</div><div style={{ fontSize: '11px' }}>{new Date(b.uploadedAt).getFullYear()}</div></>
                        : <span style={{ opacity: 0.4 }}>—</span>
                      }
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <button onClick={() => { setActiveBookId(b.id); setActiveTab('studio'); }}
                        style={{ padding: '7px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                      >Öffnen</button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* Tab 2: Studio Layout Panel Grid */}
        {activeTab === 'studio' && activeBook && (
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
              <div className="pane-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                </div>
                {outline && completedPagesCount > 0 && (
                  <button onClick={handleDownloadPdf} className="btn btn-success" style={{ padding: '2px 8px', fontSize: '9px' }}>
                    <FileDown style={{ width: '11px', height: '11px' }} /> PDF herunterladen
                  </button>
                )}
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
                        disabled={isPlanning || isGenerating || !activeBook.outline}
                        style={{
                          width: '100%',
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: 'rgba(56, 189, 248, 0.08)',
                          color: 'var(--text-main)',
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
                        else if (status === 'completed') statusClass = 'completed';
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
                    <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>Titelblatt konfigurieren</h3>
                    
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
                        <div style={{ color: 'var(--text-muted)', fontSize: '10px', display: 'flex', alignItems: 'baseline', gap: '5px', marginTop: '2px' }}>
                          <span style={{ color: '#60a5fa', fontWeight: '700', fontSize: '8.5px', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>Fokus:</span>
                          <span style={{ lineHeight: '1.4', color: 'var(--text-main)' }}>{outline?.pages[(selectedPage as number) - 1]?.focus}</span>
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
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', minHeight: '220px', gap: '6px', color: 'var(--text-muted)' }}>
                        <Loader2 className="spinner" style={{ width: '20px', height: '20px' }} />
                        <span>Book24 schreibt Seite {selectedPage}...</span>
                      </div>
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
                        onClick={() => updateActiveBookConfig('showRunningHeader', activeBook.showRunningHeader !== false)}
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

                    {selectedPage === 'title' && activeCoverEditField && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '10px 14px',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        marginBottom: '10px',
                        width: `${previewWidth}px`,
                        boxSizing: 'border-box',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-main)', textTransform: 'capitalize' }}>
                          {activeCoverEditField === 'title' ? 'Titel' : activeCoverEditField === 'subtitle' ? 'Untertitel' : activeCoverEditField === 'author' ? 'Autor' : 'Verlag'}:
                        </span>
                        
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <select
                            value={
                              activeCoverEditField === 'title' ? (activeBook.titlePageTitleFont || 'playfair') :
                              activeCoverEditField === 'subtitle' ? (activeBook.titlePageSubtitleFont || 'times') :
                              activeCoverEditField === 'author' ? (activeBook.titlePageAuthorFont || 'times') :
                              (activeBook.titlePagePublisherFont || 'times')
                            }
                            onChange={(e) => {
                              const fieldMap = {
                                title: 'titlePageTitleFont',
                                subtitle: 'titlePageSubtitleFont',
                                author: 'titlePageAuthorFont',
                                publisher: 'titlePagePublisherFont'
                              };
                              updateActiveBookConfig(fieldMap[activeCoverEditField] as keyof Book, e.target.value);
                            }}
                            style={{ fontSize: '11px', padding: '3px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none' }}
                          >
                            {COVER_FONTS.map(f => (
                              <option key={f.value} value={f.value}>{f.label}</option>
                            ))}
                          </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="range"
                            min={activeCoverEditField === 'title' ? 12 : 8}
                            max={activeCoverEditField === 'title' ? 60 : 32}
                            value={
                              activeCoverEditField === 'title' ? (activeBook.titlePageTitleSize || 28) :
                              activeCoverEditField === 'subtitle' ? (activeBook.titlePageSubtitleSize || 12) :
                              activeCoverEditField === 'author' ? (activeBook.titlePageAuthorSize || 14) :
                              (activeBook.titlePagePublisherSize || 10)
                            }
                            onChange={(e) => {
                              const fieldMap = {
                                title: 'titlePageTitleSize',
                                subtitle: 'titlePageSubtitleSize',
                                author: 'titlePageAuthorSize',
                                publisher: 'titlePagePublisherSize'
                              };
                              updateActiveBookConfig(fieldMap[activeCoverEditField] as keyof Book, Number(e.target.value));
                            }}
                            style={{ width: '60px', height: '4px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '10px', color: 'var(--text-main)', width: '22px', textAlign: 'right' }}>
                            {activeCoverEditField === 'title' ? (activeBook.titlePageTitleSize || 28) :
                             activeCoverEditField === 'subtitle' ? (activeBook.titlePageSubtitleSize || 12) :
                             activeCoverEditField === 'author' ? (activeBook.titlePageAuthorSize || 14) :
                             (activeBook.titlePagePublisherSize || 10)}pt
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            if (activeCoverEditField === 'title') {
                              updateActiveBookConfig('titlePageTitleX', 0);
                              updateActiveBookConfig('titlePageTitleY', 0);
                            } else if (activeCoverEditField === 'subtitle') {
                              updateActiveBookConfig('titlePageSubtitleX', 0);
                              updateActiveBookConfig('titlePageSubtitleY', 0);
                            } else if (activeCoverEditField === 'author') {
                              updateActiveBookConfig('titlePageAuthorX', 0);
                              updateActiveBookConfig('titlePageAuthorY', 0);
                            } else if (activeCoverEditField === 'publisher') {
                              updateActiveBookConfig('titlePagePublisherX', 0);
                              updateActiveBookConfig('titlePagePublisherY', 0);
                            }
                          }}
                          style={{
                            padding: '3px 8px',
                            fontSize: '9.5px',
                            fontWeight: '600',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-main)',
                            color: 'var(--text-main)',
                            cursor: 'pointer'
                          }}
                        >
                          Reset
                        </button>
                      </div>
                    )}

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
                              {typeof selectedPage === 'number' && !isFirstPageOfChapter && activeBook.showRunningHeader !== false ? (
                                <div style={{ fontSize: '5.5px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', borderBottom: '0.5px solid #e2e8f0', paddingBottom: '1px', marginBottom: '4px' }}>
                                  <span 
                                    className="truncate" 
                                    style={{ maxWidth: '100%', outline: 'none', cursor: 'text' }}
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
                        <button
                          onClick={() => handleRetryPage(selectedPage as number)}
                          className="btn btn-primary"
                          style={{
                            marginTop: '8px',
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
                          }}
                          disabled={isGenerating || isPlanning || isGeneratingStyleOptions || isGeneratingStructureOptions}
                          title="Generiert den Inhalt dieser Seite komplett neu basierend auf der Gliederung"
                        >
                          <RotateCw style={{ width: '13px', height: '13px' }} /> Seite neu generieren
                        </button>
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

          </div>
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

      {/* Floating API Key Connections Modal (Clean, modern glassmorphism) */}
      {showKeyInput && (
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
          onClick={() => setShowKeyInput(false)}
        >
          <div 
            style={{ 
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '4px', 
              padding: '24px', 
              width: '420px', 
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key style={{ width: '16px', height: '16px', color: 'var(--primary)' }} />
                <span style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text-main)' }}>API-Verbindungen & Keys</span>
              </div>
              <button 
                onClick={() => setShowKeyInput(false)} 
                className="btn"
                style={{ padding: '4px 10px', fontSize: '10px' }}
              >
                Schließen
              </button>
            </div>

            {/* Groq Keys Area */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-main)' }}>Groq API Keys (Llama/Mixtral)</span>
                <a 
                  href="https://console.groq.com/keys" 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ fontSize: '10px', color: 'var(--accent)', textDecoration: 'none' }}
                >
                  Keys erstellen (kostenlos) ➜
                </a>
              </div>
              <textarea 
                rows={3}
                placeholder="gsk_...&#10;(Mehrere Schlüssel durch Komma oder Zeilenumbruch trennen)" 
                value={groqKeysInput}
                onChange={e => {
                  setGroqKeysInput(e.target.value);
                  localStorage.setItem('groq_api_keys', e.target.value);
                }}
                style={{ padding: '8px 12px', fontSize: '11px', backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-main)', resize: 'vertical', width: '100%' }}
              />
            </div>

            {/* Gemini Keys Area */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-main)' }}>Gemini API Keys (Google)</span>
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ fontSize: '10px', color: 'var(--accent)', textDecoration: 'none' }}
                >
                  Keys holen ➜
                </a>
              </div>
              <textarea 
                rows={3}
                placeholder="AIzaSy...&#10;(Mehrere Schlüssel durch Komma oder Zeilenumbruch trennen)" 
                value={geminiKeysInput}
                onChange={e => {
                  setGeminiKeysInput(e.target.value);
                  localStorage.setItem('gemini_api_keys', e.target.value);
                }}
                style={{ padding: '8px 12px', fontSize: '11px', backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-main)', resize: 'vertical', width: '100%' }}
              />
            </div>
            
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.4', borderTop: '1px dashed var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
              * Key-Rotation aktiv: Tritt bei einem API-Key ein Limit (429) auf, rotiert das System automatisch zum nächsten Key des Providers in der Liste.
            </div>
          </div>
        </div>
      )}
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
    </div>
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
