import { jsPDF } from 'jspdf';
import type { BookOutline } from '../services/GeminiService';

export interface PdfConfig {
  title?: string;
  subtitle?: string;
  fontFamily: 'times' | 'helvetica' | 'courier' | 'arial' | 'playfair' | 'inter';
  fontSize: number; // in pt
  lineHeightMultiplier: number;
  pageSize: string; // "5x8" | "5.5x8.5" | "6x9" | "8.5x11" | "custom" | "a4"
  customWidth?: number; // width in inches
  customHeight?: number; // height in inches
  paragraphStyle?: 'indent' | 'spacing' | 'block';
  pagesParagraphStyle?: { [key: number]: 'indent' | 'spacing' | 'block' };
  alignment?: 'justify' | 'left';
  chapterOrnament?: string;
  showRunningHeader?: boolean;
  showPageNumbers?: boolean;           // toggle page number footer
  showChapterTitles?: boolean;         // global chapter heading toggle
  pagesHideChapter?: number[];         // per-page chapter heading hide list
  pagesInitial?: number[];             // pages that get a drop cap / Initiale
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
  
  chapterTopPadding?: number;
  autoChapterDropCaps?: boolean;
  autoChapterRecto?: boolean;
  images?: { [id: string]: string };
  box1Design?: BoxDesign;
  box2Design?: BoxDesign;
  box3Design?: BoxDesign;
}

export interface BoxDesign {
  backgroundColor: string;
  borderColor: string;
  borderThickness: number;
  borderRadius: number;
  textColor: string;
  fontStyle: 'normal' | 'italic';
  borderStyle: 'solid' | 'dashed' | 'dotted';
}

export function generateBookPdf(
  outline: BookOutline,
  pagesText: { [key: number]: string },
  config: PdfConfig
): Blob {
  // Determine page dimensions in inches
  let widthInches = 6;
  let heightInches = 9;

  if (config.pageSize === '5x8') {
    widthInches = 5;
    heightInches = 8;
  } else if (config.pageSize === '5.5x8.5') {
    widthInches = 5.5;
    heightInches = 8.5;
  } else if (config.pageSize === '6x9') {
    widthInches = 6;
    heightInches = 9;
  } else if (config.pageSize === '8.5x11') {
    widthInches = 8.5;
    heightInches = 11;
  } else if (config.pageSize === 'custom' && config.customWidth && config.customHeight) {
    widthInches = config.customWidth;
    heightInches = config.customHeight;
  }

  // Convert to points (1 inch = 72 points)
  let pageFormat = [widthInches * 72, heightInches * 72];
  let pageSettings: any = { format: pageFormat, unit: 'pt', orientation: 'p' };
  
  if (config.pageSize === 'a4') {
    pageFormat = [595.28, 841.89]; // A4 standard points
    pageSettings = { format: 'a4', unit: 'pt', orientation: 'p' };
  }

  const doc = new jsPDF(pageSettings);
  const { fontFamily: rawFontFamily, fontSize, lineHeightMultiplier } = config;
  const fontFamily = rawFontFamily === 'arial' || rawFontFamily === 'inter'
    ? 'helvetica'
    : rawFontFamily === 'playfair'
      ? 'times'
      : rawFontFamily;

  // Helper: parse hex color or rgba to [R, G, B] decimals
  function parseHexColor(hex: string): [number, number, number] {
    let cleanHex = hex.replace('#', '');
    if (cleanHex.startsWith('rgba')) {
      const parts = cleanHex.match(/\d+/g);
      if (parts && parts.length >= 3) {
        return [parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2])];
      }
      return [255, 255, 255];
    }
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(c => c + c).join('');
    }
    if (cleanHex.length !== 6) return [0, 0, 0];
    const num = parseInt(cleanHex, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }

  // Helper: resolve box design with default settings
  function getBoxDesign(boxStyle: number): BoxDesign {
    const defaults: { [key: number]: BoxDesign } = {
      1: {
        backgroundColor: 'transparent',
        borderColor: '#475569',
        borderThickness: 1.5,
        borderRadius: 4,
        textColor: '#475569',
        fontStyle: 'normal',
        borderStyle: 'dashed'
      },
      2: {
        backgroundColor: 'rgba(241, 245, 249, 0.4)',
        borderColor: '#475569',
        borderThickness: 2,
        borderRadius: 8,
        textColor: '#475569',
        fontStyle: 'italic',
        borderStyle: 'solid'
      },
      3: {
        backgroundColor: '#f8fafc',
        borderColor: '#94a3b8',
        borderThickness: 1,
        borderRadius: 0,
        textColor: '#64748b',
        fontStyle: 'normal',
        borderStyle: 'dotted'
      }
    };

    const styleNum = boxStyle === 2 || boxStyle === 3 ? boxStyle : 1;
    const custom = styleNum === 1 ? config.box1Design :
                   styleNum === 2 ? config.box2Design :
                   config.box3Design;

    return {
      ...defaults[styleNum],
      ...(custom || {})
    };
  }

  // Helper: resolve typography font key to jsPDF-compatible font family
  function resolvePdfFont(key?: string): string {
    if (!key) return fontFamily;
    const k = key.toLowerCase();
    
    // Sans-serif fonts map to helvetica
    if (['arial', 'inter', 'montserrat', 'poppins', 'oswald', 'helvetica'].includes(k)) {
      return 'helvetica';
    }
    
    // Monospace maps to courier
    if (['courier'].includes(k)) {
      return 'courier';
    }
    
    // Default serif fonts (including playfair, garamond, etc.) map to times
    return 'times';
  }
  const pageWidth = pageFormat[0];
  const pageHeight = pageFormat[1];

  // Symmetric margins: base 45pt
  const topMargin = 54;
  const bottomMargin = 54;
  const outsideMargin = 45; 
  
  // Dynamic inside margin (Bundsteg-Kompensation / Gutter) based on actual outline pages
  let insideMargin = 45;
  const totalBookPages = outline.pages.length;
  if (totalBookPages > 500) {
    insideMargin = 72; // +27pt gutter (0.375") for huge books
  } else if (totalBookPages > 300) {
    insideMargin = 63; // +18pt gutter (0.25") for thick books
  } else if (totalBookPages > 150) {
    insideMargin = 54; // +9pt gutter (0.125") for medium books
  }
  
  const writableWidth = pageWidth - insideMargin - outsideMargin;

  const fontStyleRegular = 'normal';
  const fontStyleBold = 'bold';
  const fontStyleItalic = 'italic';

  // Match live preview and real book printing:
  // odd physical pages are recto/right pages (gutter/inside on the left),
  // even physical pages are verso/left pages (outside on the left, gutter on the right).
  function getLeftMarginX(pdfPageNum: number): number {
    return pdfPageNum % 2 === 0 ? outsideMargin : insideMargin;
  }

  // --- 1. TITLE PAGE ---
  // Premium double borders
  if (config.titlePageShowBorders !== false) {
    doc.setLineWidth(1.5);
    doc.setDrawColor(60); // Neutral dark gray
    doc.rect(24, 24, pageWidth - 48, pageHeight - 48);
    doc.setLineWidth(0.5);
    doc.rect(28, 28, pageWidth - 56, pageHeight - 56);
  }

  // --- Helper: compute X for text alignment + custom offset ---
  function getTitleElemX(align: 'left' | 'center' | 'right', offsetPt: number, leftM: number): number {
    if (align === 'left') return leftM + offsetPt;
    if (align === 'right') return pageWidth - outsideMargin + offsetPt;
    return pageWidth / 2 + offsetPt; // center
  }

  // Render Title
  const titleFont = resolvePdfFont(config.titlePageTitleFont);
  const titleAlign: 'left' | 'center' | 'right' = config.titlePageTitleAlign || 'center';
  const titleSize = config.titlePageTitleSize || (pageWidth < 400 ? 22 : 28);
  const titleOffsetPt = Number(config.titlePageTitleX || 0);
  const titleUserOffsetY = Number(config.titlePageTitleY || 0);
  doc.setFont(titleFont, fontStyleBold);
  doc.setFontSize(titleSize);
  const titleLines = doc.splitTextToSize(config.title || outline.title || '', writableWidth);

  // Dynamic Y starting position based on title layout
  const layout = config.titlePageLayout || 'centered';
  const titleBaseY = (layout === 'top_centered' ? pageHeight * 0.14 : pageHeight * 0.25);
  // Apply user Y-offset to titleBaseY so title stays on page
  let titleY = titleBaseY + titleUserOffsetY;
  // Clamp: never render above top margin
  titleY = Math.max(topMargin + titleSize, titleY);

  titleLines.forEach((line: string) => {
    const tx = getTitleElemX(titleAlign, titleOffsetPt, insideMargin);
    doc.text(line, tx, titleY, { align: titleAlign, baseline: 'top' });
    titleY += titleSize * 1.2;
  });

  // Subtitle: positioned below the last title line, then shifted by its own Y offset
  const subtitleUserOffsetY = Number(config.titlePageSubtitleY || 0);
  let subtitleY = titleY + 12 + subtitleUserOffsetY;
  const finalSubtitle = config.subtitle || outline.subtitle;
  if (finalSubtitle) {
    const subtitleFont = resolvePdfFont(config.titlePageSubtitleFont);
    const subtitleAlign: 'left' | 'center' | 'right' = config.titlePageSubtitleAlign || 'center';
    const subtitleSize = config.titlePageSubtitleSize || 12;
    const subtitleOffsetPt = Number(config.titlePageSubtitleX || 0);
    doc.setFont(subtitleFont, fontStyleItalic);
    doc.setFontSize(subtitleSize);
    const subtitleLines = doc.splitTextToSize(finalSubtitle, writableWidth);
    subtitleLines.forEach((line: string) => {
      const sx = getTitleElemX(subtitleAlign, subtitleOffsetPt, insideMargin);
      doc.text(line, sx, subtitleY, { align: subtitleAlign, baseline: 'top' });
      subtitleY += subtitleSize * 1.4;
    });
  }

  // Render Author + Publisher — always stacked at bottom center, matching preview
  const authorSize = config.titlePageAuthorSize || 14;
  const pubSize = config.titlePagePublisherSize || 10;
  const bottomAnchor = 40; // pt from page bottom (matches preview: 40 * previewScaleY)
  const pubY = pageHeight - bottomAnchor - pubSize;
  const authorY = pubY - 8 - authorSize;

  if (config.authorName) {
    const authorFont = resolvePdfFont(config.titlePageAuthorFont);
    doc.setFont(authorFont, fontStyleRegular);
    doc.setFontSize(authorSize);
    doc.text(config.authorName, pageWidth / 2, authorY, { align: 'center', baseline: 'top' });
  }

  if (config.publisherLine) {
    const pubFont = resolvePdfFont(config.titlePagePublisherFont);
    doc.setFont(pubFont, fontStyleRegular);
    doc.setFontSize(pubSize);
    doc.setTextColor(80);
    doc.text(config.publisherLine, pageWidth / 2, pubY, { align: 'center', baseline: 'top' });
  }

  // Render Emblem or Custom Image
  // Place it between the title block and the author, using the configured offset.
  const scale = Number(config.titlePageImageScale !== undefined ? config.titlePageImageScale : 60);
  const shiftX = Number(config.titlePageImageX !== undefined ? config.titlePageImageX : 0);
  const shiftY = Number(config.titlePageImageY !== undefined ? config.titlePageImageY : 0);

  // Base emblem Y: below the subtitle block (or default center position), clamped so image doesn't overlap text
  const layoutFraction = layout === 'top_centered' ? 0.45 : 0.58;
  const defaultEmblemY = pageHeight * layoutFraction;
  // Strictly match the HTML preview which uses the layoutFraction without auto-pushing.
  // The user can manually adjust overlapping using shiftY.
  const baseEmblemY = defaultEmblemY + shiftY;
  const emblemY = baseEmblemY;
  const emblemSize = scale;
  const emblemX = (pageWidth - emblemSize) / 2 + shiftX;

  if (config.titlePageEmblem === 'custom' && config.titlePageImage) {
    try {
      // Draw a solid white background rectangle for transparent PNGs
      doc.setFillColor(255, 255, 255);
      doc.rect(emblemX, emblemY - emblemSize/2, emblemSize, emblemSize, 'F');
      
      const format = config.titlePageImage.toLowerCase().includes('image/png') || config.titlePageImage.toLowerCase().includes('.png') ? 'PNG' : 'JPEG';
      doc.addImage(config.titlePageImage, format, emblemX, emblemY - emblemSize/2, emblemSize, emblemSize);
    } catch (e) {
      console.warn("Failed to add image to PDF", e);
      drawGeometricEmblem(doc, pageWidth / 2 + shiftX, emblemY, emblemSize);
    }
  } else if (config.titlePageEmblem) {
    const cx = pageWidth / 2 + shiftX;
    const cy = emblemY;
    const size = emblemSize;

    if (config.titlePageEmblem === 'geometric') {
      drawGeometricEmblem(doc, cx, cy, size);
    } else if (config.titlePageEmblem === 'floral') {
      drawFloralEmblem(doc, cx, cy, size);
    } else if (config.titlePageEmblem === 'star') {
      drawStarEmblem(doc, cx, cy, size);
    } else if (config.titlePageEmblem === 'book') {
      drawBookEmblem(doc, cx, cy, size);
    }
  }



  doc.setTextColor(0);

  // --- PRE-CALCULATE PAGE PHYSICAL PLACEMENTS ---
  const splitPageText = (text: string): string[] => {
    if (!text) return [''];
    return text.split(/\r?\n\s*-{3,}\s*(?:\r?\n|$)/);
  };

  // 1. Collect all chapter start pages
  const chapterStarts: { [title: string]: number } = {};
  for (let i = 1; i <= outline.pages.length; i++) {
    const pageInfo = outline.pages.find(p => p.page_number === i);
    const isFirstPageOfChapter = pageInfo ? outline.pages.find(p => p.chapter_title === pageInfo.chapter_title)?.page_number === i : false;
    if (isFirstPageOfChapter && pageInfo) {
      chapterStarts[pageInfo.chapter_title] = i;
    }
  }

  // 2. Calculate number of pages the TOC will occupy
  let tocPagesCount = 0;
  if (config.generateTOC !== false) {
    tocPagesCount = 1;
    let simY = topMargin + 36;
    const tocSpacing = config.tocLineSpacing || 18;
    Object.keys(chapterStarts).forEach(() => {
      if (simY + tocSpacing > pageHeight - bottomMargin) {
        tocPagesCount++;
        simY = topMargin + 36;
      }
      simY += tocSpacing;
    });
  }

  // 3. Map pages to physical pages and printed page numbers
  const firstContentPhysicalPage = config.generateTOC === false ? 2 : (2 + tocPagesCount);
  let currentPhysicalPage = firstContentPhysicalPage;

  const pagePhysicalMap: { [pageNum: number]: number } = {};
  const pageContentNumberMap: { [pageNum: number]: number } = {};
  const chapterToPageMap: { [title: string]: number } = {};

  for (let i = 1; i <= outline.pages.length; i++) {
    const pageInfo = outline.pages.find(p => p.page_number === i);
    const isFirstPageOfChapter = pageInfo ? outline.pages.find(p => p.chapter_title === pageInfo.chapter_title)?.page_number === i : false;
    
    if (isFirstPageOfChapter && pageInfo) {
      if (config.autoChapterRecto && currentPhysicalPage % 2 === 0) {
        currentPhysicalPage++;
      }
      // Printed page number relative to content start
      const printedPageNum = currentPhysicalPage - (firstContentPhysicalPage - 1);
      chapterToPageMap[pageInfo.chapter_title] = printedPageNum;
    }
    
    pagePhysicalMap[i] = currentPhysicalPage;
    pageContentNumberMap[i] = currentPhysicalPage - (firstContentPhysicalPage - 1);
    
    const pageText = pagesText[i] || '';
    const partsCount = splitPageText(pageText).length;
    currentPhysicalPage += partsCount;
  }

  // --- 2. TABLE OF CONTENTS (Render only if enabled) ---
  let pdfPageCounter = 1; // page 1 is title page
  
  if (config.generateTOC !== false) {
    const chaptersList = Object.entries(chapterToPageMap);
    const totalTOCPagesCount = tocPagesCount;
    
    const tocFont = resolvePdfFont(config.tocFontFamily || config.fontFamily);
    const baseFontSize = config.tocFontSize || 10;
    const headerFontSize = baseFontSize + 4;
    const tocSpacing = config.tocLineSpacing || 18;

    doc.addPage();
    pdfPageCounter++; // now at page 2
    
    let currentTOCPageIndex = 1;
    doc.setFont(tocFont, fontStyleBold);
    doc.setFontSize(headerFontSize);
    doc.setTextColor(0);
    let tocX = getLeftMarginX(pdfPageCounter);
    const getTOCHeader = (idx: number) => {
      const suffix = totalTOCPagesCount > 1 ? ` (${idx}/${totalTOCPagesCount})` : '';
      return (outline.language === 'de' ? 'Inhaltsverzeichnis' : 'Table of Contents') + suffix;
    };
    doc.text(getTOCHeader(currentTOCPageIndex), tocX, topMargin + 10);
    
    let tocY = topMargin + 36;

    chaptersList.forEach(([chapterTitle, pageNum]) => {
      doc.setTextColor(0);
      doc.setFont(tocFont, fontStyleBold);
      doc.setFontSize(baseFontSize);
      
      const maxTitleWidth = writableWidth - 35; // reserve 35pt for space + page number
      const textWidth = doc.getTextWidth(chapterTitle);
      let fontSize = baseFontSize;
      if (textWidth > maxTitleWidth) {
        fontSize = Math.max(6.5, (maxTitleWidth / textWidth) * baseFontSize);
      }
      doc.setFontSize(fontSize);

      // Overflow check
      if (tocY + tocSpacing > pageHeight - bottomMargin) {
        // Draw footer (Roman numeral) for the current TOC page
        doc.setFont(tocFont, fontStyleRegular);
        doc.setFontSize(9);
        doc.setTextColor(100);
        const roman = toRoman(pdfPageCounter);
        doc.text(roman, pageWidth / 2, pageHeight - bottomMargin + 20, { align: 'center' });
        
        // Add new page
        doc.addPage();
        pdfPageCounter++;
        currentTOCPageIndex++;
        
        // Write header
        doc.setTextColor(0);
        doc.setFont(tocFont, fontStyleBold);
        doc.setFontSize(headerFontSize);
        tocX = getLeftMarginX(pdfPageCounter);
        doc.text(getTOCHeader(currentTOCPageIndex), tocX, topMargin + 10);
        
        tocY = topMargin + 36;
      }

      // Render the single line
      doc.setTextColor(0);
      doc.setFont(tocFont, fontStyleBold);
      doc.setFontSize(fontSize);
      doc.text(chapterTitle, tocX, tocY);
      
      const lineWidth = doc.getTextWidth(chapterTitle);
      const dotsWidth = writableWidth - lineWidth - 20;
      
      doc.setFont(tocFont, fontStyleRegular);
      doc.setFontSize(fontSize);
      if (dotsWidth >= 8) {
        const dotString = '.'.repeat(Math.floor(dotsWidth / doc.getTextWidth('.')));
        doc.text(dotString, tocX + lineWidth + 4, tocY);
      }
      
      doc.setFont(tocFont, fontStyleBold);
      doc.text(pageNum.toString(), tocX + writableWidth - 5, tocY, { align: 'right' });
      tocY += tocSpacing;
    });

    // Draw footer for the last TOC page
    doc.setFont(tocFont, fontStyleRegular);
    doc.setFontSize(9);
    doc.setTextColor(100);
    const roman = toRoman(pdfPageCounter);
    doc.text(roman, pageWidth / 2, pageHeight - bottomMargin + 20, { align: 'center' });
  }

  // --- 3. CONTENT PAGES ---
  for (let i = 1; i <= outline.pages.length; i++) {
    const targetPhysicalPage = pagePhysicalMap[i];
    
    // Add blank pages if we skipped physical page numbers (recto alignment)
    while (pdfPageCounter < targetPhysicalPage - 1) {
      doc.addPage();
      pdfPageCounter++;
      // Blank page is left completely empty (no header/footer)
    }

    const pageInfo = outline.pages.find(p => p.page_number === i);
    const pageText = pagesText[i] || (outline.language === 'de' ? '[Inhalt wird geladen...]' : '[Content loading...]');
    const parts = splitPageText(pageText);

    parts.forEach((partText, partIndex) => {
      doc.addPage();
      pdfPageCounter++;

      const pageX = getLeftMarginX(pdfPageCounter);
      let contentY = topMargin;
      let activeFloat: { float: 'left' | 'right'; width: number; height: number; bottomY: number } | null = null;

      const isFirstPageOfChapter = pageInfo ? outline.pages.find(p => p.chapter_title === pageInfo.chapter_title)?.page_number === i : false;
      const isFirstPartOfPage = partIndex === 0;

      // Header formatting (skip on first page of a chapter, and only on the first part of that page)
      if (!(isFirstPageOfChapter && isFirstPartOfPage) && config.showRunningHeader !== false) {
        doc.setFont(fontFamily, fontStyleItalic);
        doc.setFontSize(8);
        doc.setTextColor(120);
        const headerText = pdfPageCounter % 2 === 0 ? outline.title : (pageInfo?.chapter_title || '');
        const headerAlign = pdfPageCounter % 2 === 0 ? 'left' : 'right';
        const headerX = pdfPageCounter % 2 === 0 ? pageX : pageX + writableWidth;
        doc.text(headerText, headerX, topMargin - 15, { align: headerAlign });
        
        // Header divider line
        doc.setDrawColor(220);
        doc.setLineWidth(0.5);
        doc.line(pageX, topMargin - 10, pageX + writableWidth, topMargin - 10);
      }

      doc.setTextColor(0);

      // Render chapter title only on the first page of the chapter
      const chapterGlobalOff = config.showChapterTitles === false;
      const chapterPageOff = (config.pagesHideChapter || []).includes(i);
      if (isFirstPageOfChapter && isFirstPartOfPage && pageInfo && !chapterGlobalOff && !chapterPageOff) {
        const padding = config.chapterTopPadding !== undefined ? config.chapterTopPadding : 0;
        contentY += padding;

        doc.setFont(fontFamily, fontStyleBold);
        doc.setFontSize(14);
        const capLines = doc.splitTextToSize(pageInfo.chapter_title, writableWidth);
        capLines.forEach((line: string) => {
          doc.text(line, pageX, contentY + 12);
          contentY += 18;
        });
        contentY += 12;

        if (config.chapterOrnament) {
          doc.setFont(fontFamily, fontStyleRegular);
          doc.setFontSize(14);
          doc.setTextColor(100);
          doc.text(config.chapterOrnament, pageX + writableWidth / 2, contentY, { align: 'center' });
          contentY += 20;
        }
      }

      // ── Block Parser & PDF Drawing ──────────────────────────────────
      type PdfBlock =
        | { kind: 'paragraph'; text: string }
        | { kind: 'checkbox'; text: string; checked: boolean }
        | { kind: 'dotted_line' }
        | { kind: 'table'; headers: string[]; rows: string[][] }
        | { kind: 'box'; title: string; children: PdfBlock[]; boxStyle?: number }
        | { kind: 'pagebreak' }
        | { kind: 'ornament' }
        | { kind: 'heading'; text: string }
        | { kind: 'quote'; text: string }
        | { kind: 'bullet'; text: string }
        | { kind: 'image'; text: string; float?: 'left' | 'right' | 'none'; width?: number }
        | { kind: 'custom_image'; id: string; float: 'left' | 'right' | 'none'; width: number };

      function parseBookLines(rawLines: string[]): PdfBlock[] {
        const blks: PdfBlock[] = [];
        let bi = 0;
        while (bi < rawLines.length) {
          const raw = rawLines[bi];
          const tr = raw.trim().replace(/ {2,}/g, ' ');
          if (!tr) { bi++; continue; }

          // [grafik: ...] or [image: ...]
          if (/^\[(grafik|image):\s*(.*)\]$/i.test(tr)) {
            const isCustom = /^\[image:\s*(.*)\]$/i.test(tr);
            const content = tr.match(/^\[(?:image|grafik):\s*(.*?)\]$/i)?.[1] || '';
            const parts = content.split('|').map(p => p.trim());
            const imageIdOrPrompt = parts[0];
            
            let float: 'left' | 'right' | 'none' = 'none';
            let width = 50;
            
            for (let pIdx = 1; pIdx < parts.length; pIdx++) {
              const attr = parts[pIdx].toLowerCase();
              if (attr.startsWith('float:')) {
                const val = attr.split(':')[1].trim();
                if (val === 'left' || val === 'right' || val === 'none') {
                  float = val as any;
                }
              } else if (attr.startsWith('width:')) {
                const val = parseInt(attr.split(':')[1].trim(), 10);
                if (!isNaN(val)) {
                  width = val;
                }
              }
            }
            
            if (isCustom && imageIdOrPrompt.startsWith('img_')) {
              blks.push({ kind: 'custom_image', id: imageIdOrPrompt, float, width });
            } else {
              blks.push({ kind: 'image', text: imageIdOrPrompt, float, width });
            }
            bi++; continue;
          }

          // :::box
          if (/^:::box([123]?)/i.test(tr)) {
            const tm = tr.match(/^:::box([123]?)\s*(.*)/i);
            const boxStyle = tm && tm[1] ? parseInt(tm[1], 10) : 1;
            const boxTitle = tm ? tm[2].trim() : '';
            bi++;
            const inner: string[] = [];
            while (bi < rawLines.length && rawLines[bi].trim() !== ':::') {
              inner.push(rawLines[bi]); bi++;
            }
            bi++; // skip :::
            blks.push({ kind: 'box', title: boxTitle, children: parseBookLines(inner), boxStyle });
            continue;
          }

          // Markdown table
          if (tr.startsWith('|')) {
            const tLines: string[] = [];
            while (bi < rawLines.length && rawLines[bi].trim().startsWith('|')) {
              tLines.push(rawLines[bi].trim()); bi++;
            }
            const cells = (ln: string) => ln.split('|').map(c => c.trim()).filter((_c, ci2, a) => ci2 > 0 && ci2 < a.length - 1);
            const headers = cells(tLines[0] || '');
            const rows = tLines.slice(2).filter(l => !/^[\|\s\-:]+$/.test(l)).map(l => cells(l));
            if (headers.length > 0) blks.push({ kind: 'table', headers, rows });
            continue;
          }

          // Checkbox
          if (/^\[[ xX]\] /.test(tr)) {
            const checked = /^\[[xX]\] /.test(tr);
            const cbText = tr.replace(/^\[[xX ]\] /, '').trim();
            blks.push({ kind: 'checkbox', text: cbText, checked });
            bi++; continue;
          }

          // Dotted line
          if (/^[._]{6,}$/.test(tr.replace(/\s/g, ''))) {
            blks.push({ kind: 'dotted_line' });
            bi++; continue;
          }

          // Page break
          if (tr === '---' || /^-{3,}$/.test(tr)) {
            blks.push({ kind: 'pagebreak' });
            bi++; continue;
          }

          // Ornament
          if (tr === '***' || tr === '* * *') {
            blks.push({ kind: 'ornament' });
            bi++; continue;
          }

          // Heading
          if ((tr.startsWith('**') && tr.endsWith('**')) || tr.startsWith('### ')) {
            const hText = tr.startsWith('### ') ? tr.slice(4) : tr.slice(2, -2);
            blks.push({ kind: 'heading', text: hText });
            bi++; continue;
          }

          // Quote
          if (tr.startsWith('> ')) {
            blks.push({ kind: 'quote', text: tr.slice(2) });
            bi++; continue;
          }

          // Bullet
          if (tr.startsWith('- ') || tr.startsWith('* ') || tr.startsWith('• ')) {
            const bText = tr.startsWith('• ') ? tr.slice(2) : tr.slice(2);
            blks.push({ kind: 'bullet', text: bText });
            bi++; continue;
          }

          blks.push({ kind: 'paragraph', text: tr });
          bi++;
        }
        return blks;
      }

      // Calculate the natural height a block will consume (in pt) without drawing it
      function measureBlock(block: PdfBlock, drawWidth: number): number {
        const lh = fontSize * lineHeightMultiplier;
        switch (block.kind) {
          case 'dotted_line': return lh;
          case 'pagebreak': return 0;
          case 'ornament': return 20;
          case 'heading': {
            doc.setFont(fontFamily, fontStyleBold);
            doc.setFontSize(fontSize);
            return doc.splitTextToSize(block.text.replace(/\*\*/g, ''), drawWidth).length * lh + fontSize * 0.4;
          }
          case 'quote': {
            doc.setFont(fontFamily, fontStyleItalic);
            doc.setFontSize(fontSize);
            return doc.splitTextToSize(block.text.replace(/\*\*/g, ''), drawWidth - 30).length * lh + fontSize * 1.6;
          }
          case 'bullet': {
            doc.setFont(fontFamily, fontStyleRegular);
            doc.setFontSize(fontSize);
            return doc.splitTextToSize('• ' + block.text.replace(/\*\*/g, ''), drawWidth - 10).length * lh;
          }
          case 'checkbox': {
            doc.setFont(fontFamily, fontStyleRegular);
            doc.setFontSize(fontSize);
            return doc.splitTextToSize(block.text.replace(/\*\*/g, ''), drawWidth - 16).length * lh;
          }
          case 'paragraph': {
            doc.setFont(fontFamily, fontStyleRegular);
            doc.setFontSize(fontSize);
            return doc.splitTextToSize(block.text.replace(/\*\*/g, ''), drawWidth).length * lh;
          }
          case 'image': {
            const floatVal = block.float !== undefined ? block.float : 'none';
            if (floatVal === 'none') {
              return 115;
            }
            return 0;
          }
          case 'custom_image': {
            const imgWidth = drawWidth * (block.width / 100);
            const imgHeight = imgWidth * 0.75;
            if (block.float === 'none') {
              return imgHeight + 15;
            }
            return 0;
          }
          case 'table': {
            const colW = drawWidth / Math.max(block.headers.length, 1);
            doc.setFont(fontFamily, fontStyleRegular);
            doc.setFontSize(fontSize * 0.9);
            let totalH = lh + 4; // header row
            for (const row of block.rows) {
              let maxCellLines = 1;
              for (const cell of row) {
                const cLines = doc.splitTextToSize(cell, colW - 6).length;
                if (cLines > maxCellLines) maxCellLines = cLines;
              }
              totalH += maxCellLines * lh * 0.9 + 6;
            }
            return totalH + 4;
          }
          case 'box': {
            const innerW = drawWidth - 24; // 12pt indent each side
            let totalH = 16; // top title area
            for (const child of block.children) {
              totalH += measureBlock(child, innerW) + 4;
            }
            return totalH + 10;
          }
          default: return lh;
        }
      }

      // Draw a single block and advance contentY
      function drawPdfBlock(
        block: PdfBlock,
        blockX: number,
        drawWidth: number,
        pageStyle: string,
        isDropCapPage: boolean,
        dropCapDone: { v: boolean },
        blockIdx: number,
        prevBlock: PdfBlock | null,
        parentDesign?: BoxDesign
      ): void {
        const lh = fontSize * lineHeightMultiplier;

        switch (block.kind) {
          case 'pagebreak':
            return; // handled by splitting logic already

          case 'ornament': {
            doc.setFont(fontFamily, fontStyleRegular);
            doc.setFontSize(14);
            doc.setTextColor(100);
            doc.text(config.chapterOrnament || '❦', blockX + drawWidth / 2, contentY, { align: 'center' });
            contentY += 20;
            doc.setTextColor(0);
            return;
          }

          case 'heading': {
            const txt = block.text.replace(/\*\*/g, '');
            doc.setFont(fontFamily, fontStyleBold);
            doc.setFontSize(fontSize);
            doc.setTextColor(0);
            const hLines = doc.splitTextToSize(txt, drawWidth);
            hLines.forEach((ln: string) => {
              doc.text(ln, blockX, contentY);
              contentY += lh;
            });
            contentY += fontSize * 0.4;
            return;
          }

          case 'quote': {
            const txt = block.text.replace(/\*\*/g, '');
            const isInfobox = pageStyle === 'spacing';
            contentY += fontSize * 0.8;
            doc.setFont(fontFamily, fontStyleItalic);
            doc.setFontSize(fontSize);
            doc.setTextColor(80);
            const qWidth = drawWidth - (isInfobox ? 20 : 30);
            const qLines = doc.splitTextToSize(txt, qWidth);
            if (isInfobox && qLines.length > 0) {
              const boxH = qLines.length * lh + 12;
              doc.setFillColor(245, 245, 245);
              doc.rect(blockX, contentY - fontSize * 0.5 - 4, drawWidth, boxH, 'F');
              doc.setDrawColor(80, 80, 80);
              doc.setLineWidth(2.5);
              doc.line(blockX, contentY - fontSize * 0.5 - 4, blockX, contentY - fontSize * 0.5 - 4 + boxH);
            }
            qLines.forEach((ln: string, li: number) => {
              const qX = isInfobox ? blockX + 10 : blockX + 15;
              const isLast = li === qLines.length - 1;
              const qAlign = config.alignment === 'left' || isLast
                ? { align: 'left' as const }
                : { align: 'justify' as const, maxWidth: qWidth };
              doc.text(ln, qX, contentY, qAlign);
              contentY += lh;
            });
            if (isInfobox) contentY += 8;
            contentY += fontSize * 0.8;
            doc.setTextColor(0);
            doc.setFont(fontFamily, fontStyleRegular);
            return;
          }

          case 'bullet': {
            const txt = '• ' + block.text.replace(/\*\*/g, '');
            doc.setFont(fontFamily, fontStyleRegular);
            doc.setFontSize(fontSize);
            doc.setTextColor(0);
            const bLines = doc.splitTextToSize(txt, drawWidth - 10);
            bLines.forEach((ln: string, li: number) => {
              const isLast = li === bLines.length - 1;
              const bAlign = config.alignment === 'left' || isLast
                ? { align: 'left' as const }
                : { align: 'justify' as const, maxWidth: drawWidth - 10 };
              doc.text(ln, blockX + 10, contentY, bAlign);
              contentY += lh;
            });
            return;
          }

          case 'checkbox': {
            const boxSize = fontSize * 0.85;
            const boxY = contentY - fontSize * 0.75;
            // Draw the checkbox square
            doc.setDrawColor(30);
            doc.setLineWidth(0.8);
            doc.rect(blockX, boxY, boxSize, boxSize);
            if (block.checked) {
              doc.setFont(fontFamily, fontStyleBold);
              doc.setFontSize(fontSize * 0.75);
              doc.text('✓', blockX + 1, boxY + boxSize * 0.85);
            }
            // Draw label text
            const cbLabel = block.text.replace(/\*\*/g, '');
            doc.setFont(fontFamily, fontStyleRegular);
            doc.setFontSize(fontSize);
            doc.setTextColor(0);
            const cbLines = doc.splitTextToSize(cbLabel, drawWidth - boxSize - 5);
            cbLines.forEach((ln: string) => {
              doc.text(ln, blockX + boxSize + 5, contentY);
              contentY += lh;
            });
            if (cbLines.length === 0) contentY += lh;
            return;
          }

          case 'dotted_line': {
            const lineY = contentY - fontSize * 0.25;
            doc.setDrawColor(150);
            doc.setLineWidth(0.5);
            doc.setLineDashPattern([1, 2], 0);
            doc.line(blockX, lineY, blockX + drawWidth, lineY);
            doc.setLineDashPattern([], 0);
            contentY += lh;
            return;
          }

          case 'table': {
            const colCount = Math.max(block.headers.length, 1);
            const colW = drawWidth / colCount;
            const cellPad = 4;
            const tableFontSize = fontSize * 0.9;
            const tableLH = tableFontSize * lineHeightMultiplier;

            doc.setLineWidth(0.4);
            doc.setDrawColor(180);

            // Draw header row
            doc.setFont(fontFamily, fontStyleBold);
            doc.setFontSize(tableFontSize);
            doc.setFillColor(240, 240, 240);
            doc.rect(blockX, contentY - tableFontSize * 0.75, drawWidth, tableLH + cellPad * 2, 'FD');

            block.headers.forEach((h, ci) => {
              const hLines = doc.splitTextToSize(h, colW - cellPad * 2);
              hLines.forEach((ln: string, li: number) => {
                doc.text(ln, blockX + ci * colW + cellPad, contentY + li * tableLH - tableFontSize * 0.1);
              });
            });
            contentY += tableLH + cellPad * 2;

            // Draw data rows
            doc.setFont(fontFamily, fontStyleRegular);
            for (const row of block.rows) {
              let maxLines = 1;
              const rowCellLines: string[][] = [];
              row.forEach((cell, ci) => {
                if (ci < colCount) {
                  const cLines = doc.splitTextToSize(cell, colW - cellPad * 2);
                  rowCellLines.push(cLines);
                  if (cLines.length > maxLines) maxLines = cLines.length;
                }
              });
              const rowH = maxLines * tableLH + cellPad * 2;
              doc.rect(blockX, contentY - tableFontSize * 0.75, drawWidth, rowH, 'D');
              rowCellLines.forEach((cLines, ci) => {
                cLines.forEach((ln: string, li: number) => {
                  doc.text(ln, blockX + ci * colW + cellPad, contentY + li * tableLH - tableFontSize * 0.1);
                });
                // Draw vertical dividers
                if (ci < colCount - 1) {
                  doc.line(blockX + (ci + 1) * colW, contentY - tableFontSize * 0.75,
                    blockX + (ci + 1) * colW, contentY - tableFontSize * 0.75 + rowH);
                }
              });
              contentY += rowH;
            }
            contentY += 4;
            doc.setTextColor(0);
            return;
          }

          case 'box': {
            // Margin above the box container
            contentY += 12;

            const design = getBoxDesign(block.boxStyle || 1);
            const borderRGB = parseHexColor(design.borderColor);
            const isTransparent = design.backgroundColor === 'transparent';
            const bgRGB = parseHexColor(isTransparent ? '#ffffff' : design.backgroundColor);

            const innerW = drawWidth - 24;
            const innerX = blockX + 12;
            const boxH = measureBlock(block, drawWidth);
            const boxY = contentY - fontSize * 0.75;

            // Fill / Draw colors
            doc.setDrawColor(borderRGB[0], borderRGB[1], borderRGB[2]);
            if (!isTransparent) {
              doc.setFillColor(bgRGB[0], bgRGB[1], bgRGB[2]);
            }
            doc.setLineWidth(design.borderThickness);
            
            // Set dash pattern
            if (design.borderStyle === 'dashed') {
              doc.setLineDashPattern([3, 2], 0);
            } else if (design.borderStyle === 'dotted') {
              doc.setLineDashPattern([1, 1.5], 0);
            } else {
              doc.setLineDashPattern([], 0);
            }

            const drawStyle = isTransparent ? 'S' : 'FD';
            const rx = design.borderRadius;
            const ry = design.borderRadius;
            
            if (rx > 0) {
              doc.roundedRect(boxY < 0 ? 0 : blockX, boxY < 0 ? 0 : boxY, drawWidth, boxH, rx, ry, drawStyle);
            } else {
              doc.rect(boxY < 0 ? 0 : blockX, boxY < 0 ? 0 : boxY, drawWidth, boxH, drawStyle);
            }
            
            // Restore dash pattern & line width
            doc.setLineDashPattern([], 0);
            doc.setLineWidth(0.5);

            // Draw background and text for the title
            if (block.title) {
              doc.setFont(fontFamily, fontStyleBold);
              doc.setFontSize(fontSize * 0.78);
              const titleW = doc.getTextWidth(block.title.toUpperCase()) + 8;
              const titleX = blockX + (drawWidth - titleW) / 2;
              
              if (isTransparent) {
                doc.setFillColor(255, 255, 255);
              } else {
                doc.setFillColor(bgRGB[0], bgRGB[1], bgRGB[2]);
              }
              doc.rect(titleX - 2, boxY - 2, titleW + 4, fontSize * 0.78 + 2, 'F');
              doc.setTextColor(borderRGB[0], borderRGB[1], borderRGB[2]);
              doc.text(block.title.toUpperCase(), titleX + 2, boxY + fontSize * 0.6);
            }
            doc.setTextColor(0);

            contentY += block.title ? fontSize * 0.9 + 8 : 8;

            block.children.forEach((child, childIdx) => {
              drawPdfBlock(child, innerX, innerW, pageStyle, false, { v: true }, childIdx, childIdx > 0 ? block.children[childIdx - 1] : null, design);
              contentY += 4; // gap between box children matches measureBlock!
            });

            // Align contentY perfectly to the bottom boundary of the box
            contentY = boxY + boxH;

            // Margin below the box container
            contentY += 16;
            return;
          }

          case 'paragraph': {
            const txt = block.text.replace(/\*\*/g, '');
            const pStyle = parentDesign?.fontStyle === 'italic' ? fontStyleItalic : fontStyleRegular;
            doc.setFont(fontFamily, pStyle);
            doc.setFontSize(fontSize);
            if (parentDesign) {
              const rgb = parseHexColor(parentDesign.textColor);
              doc.setTextColor(rgb[0], rgb[1], rgb[2]);
            } else {
              doc.setTextColor(0);
            }

            // Drop Cap
            if (isDropCapPage && !dropCapDone.v && txt.length > 1) {
              dropCapDone.v = true;
              const dropChar = txt[0];
              const restText = txt.slice(1);
              const dropCapSize = fontSize * 2.85;

              doc.setFont(fontFamily, fontStyleBold);
              doc.setFontSize(dropCapSize);

              const capHeight = fontSize * 0.68;
              const dropCapCapHeight = dropCapSize * 0.68;
              const dropCapY = (contentY - capHeight) + dropCapCapHeight;
              doc.text(dropChar, blockX, dropCapY);

              const dropCharWidth = doc.getTextWidth(dropChar) + 5.5;
              doc.setFont(fontFamily, pStyle);
              doc.setFontSize(fontSize);

              const dropCapLinesCount = 2;
              const narrowWidth = drawWidth - dropCharWidth;
              let remaining = restText;
              const finalLines: { text: string; rx: number; width: number }[] = [];

              for (let ll = 0; ll < dropCapLinesCount; ll++) {
                if (!remaining.trim()) break;
                const split = doc.splitTextToSize(remaining, narrowWidth);
                const lineText = split[0];
                if (lineText) {
                  finalLines.push({ text: lineText, rx: blockX + dropCharWidth, width: narrowWidth });
                  remaining = remaining.startsWith(lineText)
                    ? remaining.substring(lineText.length).trim()
                    : remaining.substring(remaining.indexOf(lineText) + lineText.length).trim();
                }
              }
              if (remaining.trim()) {
                doc.splitTextToSize(remaining, drawWidth).forEach((lt: string) => {
                  finalLines.push({ text: lt, rx: blockX, width: drawWidth });
                });
              }

              finalLines.forEach((item, lIdx) => {
                const isLast = lIdx === finalLines.length - 1;
                const aOpt: any = (lIdx < dropCapLinesCount || config.alignment === 'left')
                  ? { align: 'left' }
                  : isLast ? { align: 'left' } : { align: 'justify', maxWidth: item.width };
                doc.text(item.text, item.rx, contentY + lIdx * lh, aOpt);
              });

              contentY += Math.max(lh * 2, finalLines.length * lh);
              doc.setFont(fontFamily, fontStyleRegular);
              doc.setTextColor(0);
              return;
            }

            if (pageStyle === 'spacing') contentY += fontSize * 0.8;

            const hasIndent = pageStyle === 'indent' && blockIdx > 0 && prevBlock?.kind !== 'heading' && prevBlock?.kind !== 'ornament';
            const indentWidth = hasIndent ? 1.5 * fontSize : 0;

            if (activeFloat && contentY < activeFloat.bottomY) {
              let remainingText = txt;
              let isFirstLineOfParagraph = true;
              while (remainingText.length > 0) {
                const hasActiveFloat = activeFloat && contentY < activeFloat.bottomY;
                let currentWidth = hasActiveFloat ? drawWidth - activeFloat.width - 10 : drawWidth;
                let currentX = hasActiveFloat 
                  ? (activeFloat.float === 'left' ? blockX + activeFloat.width + 10 : blockX)
                  : blockX;
                
                // Apply indent to the very first line of the paragraph
                if (isFirstLineOfParagraph && indentWidth > 0) {
                  currentWidth -= indentWidth;
                  currentX += indentWidth;
                }
                
                const lines = doc.splitTextToSize(remainingText, currentWidth);
                const lineText = lines[0];
                if (!lineText) break;
                
                const isLastLine = lines.length <= 1 || !remainingText.substring(lineText.length).trim();
                const aOpt = config.alignment === 'left' || isLastLine
                  ? { align: 'left' as const }
                  : { align: 'justify' as const, maxWidth: currentWidth };
                  
                doc.text(lineText, currentX, contentY, aOpt);
                contentY += lh;
                
                remainingText = remainingText.substring(lineText.length).trim();
                isFirstLineOfParagraph = false;
              }
              doc.setFont(fontFamily, fontStyleRegular);
              doc.setTextColor(0);
              return;
            }

            // Normal text block drawing (with indent capability)
            let remainingText = txt;
            let isFirstLineOfParagraph = true;
            while (remainingText.length > 0) {
              let currentWidth = drawWidth;
              let currentX = blockX;
              
              if (isFirstLineOfParagraph && indentWidth > 0) {
                currentWidth -= indentWidth;
                currentX += indentWidth;
              }
              
              const lines = doc.splitTextToSize(remainingText, currentWidth);
              const lineText = lines[0];
              if (!lineText) break;
              
              const isLastLine = lines.length <= 1 || !remainingText.substring(lineText.length).trim();
              const aOpt = config.alignment === 'left' || isLastLine
                ? { align: 'left' as const }
                : { align: 'justify' as const, maxWidth: currentWidth };
                
              doc.text(lineText, currentX, contentY, aOpt);
              contentY += lh;
              
              remainingText = remainingText.substring(lineText.length).trim();
              isFirstLineOfParagraph = false;
            }
            doc.setFont(fontFamily, fontStyleRegular);
            doc.setTextColor(0);
            return;
          }

          case 'image': {
            const widthVal = block.width !== undefined ? block.width : 85;
            const floatVal = block.float !== undefined ? block.float : 'none';

            const boxW = drawWidth * (widthVal / 100);
            const boxH = 95;
            const boxX = floatVal === 'left' ? blockX : floatVal === 'right' ? blockX + drawWidth - boxW : blockX + (drawWidth - boxW) / 2;
            const boxY = contentY + 5;
            
            if (floatVal === 'none') {
              // Draw grey dashed background box
              doc.setFillColor(250, 250, 250);
              doc.setDrawColor(180);
              doc.setLineWidth(0.6);
              doc.setLineDashPattern([2, 2], 0);
              doc.rect(boxX, boxY, boxW, boxH, 'FD');
              doc.setLineDashPattern([], 0); // reset
              
              // Draw visual indicator / icon placeholder
              doc.setFont(fontFamily, fontStyleBold);
              doc.setFontSize(fontSize * 0.8);
              doc.setTextColor(140);
              doc.text('[ KI-ILLUSTRATION PLATZHALTER ]', boxX + boxW / 2, boxY + boxH / 2 - 2, { align: 'center' });
              
              doc.setFont(fontFamily, fontStyleRegular);
              doc.setFontSize(fontSize * 0.65);
              doc.setTextColor(160);
              doc.text('(Bild wird in Phase 3 hier generiert)', boxX + boxW / 2, boxY + boxH / 2 + 10, { align: 'center' });
              
              // Draw Caption beneath
              contentY += boxH + 12;
              doc.setFont(fontFamily, fontStyleItalic);
              doc.setFontSize(fontSize * 0.75);
              doc.setTextColor(100);
              const captionText = `Abb.: ${block.text}`;
              const capLines = doc.splitTextToSize(captionText, drawWidth * 0.9);
              capLines.forEach((line: string) => {
                doc.text(line, blockX + drawWidth / 2, contentY, { align: 'center' });
                contentY += fontSize * 0.9;
              });
              contentY += 12; // gap below
            } else {
              // floated left or right placeholder
              doc.setFillColor(250, 250, 250);
              doc.setDrawColor(180);
              doc.setLineWidth(0.6);
              doc.setLineDashPattern([2, 2], 0);
              doc.rect(boxX, contentY, boxW, 80, 'FD');
              doc.setLineDashPattern([], 0);

              doc.setFont(fontFamily, fontStyleBold);
              doc.setFontSize(fontSize * 0.6);
              doc.setTextColor(140);
              doc.text('[ KI-GRAFIK ]', boxX + boxW / 2, contentY + 35, { align: 'center' });

              doc.setFont(fontFamily, fontStyleRegular);
              doc.setFontSize(fontSize);
              doc.setTextColor(0);

              activeFloat = {
                float: floatVal,
                width: boxW,
                height: 80,
                bottomY: contentY + 80 + 8
              };
            }
            
            doc.setFont(fontFamily, fontStyleRegular);
            doc.setFontSize(fontSize);
            doc.setTextColor(0);
            return;
          }

          case 'custom_image': {
            const imgWidth = drawWidth * (block.width / 100);
            const imgHeight = imgWidth * 0.75;
            
            const imgSrc = config.images?.[block.id] || '';
            if (!imgSrc) {
              const boxX = block.float === 'left' ? blockX : block.float === 'right' ? blockX + drawWidth - imgWidth : blockX + (drawWidth - imgWidth) / 2;
              doc.setFillColor(250, 240, 240);
              doc.setDrawColor(220, 100, 100);
              doc.setLineWidth(0.5);
              doc.rect(boxX, contentY, imgWidth, imgHeight, 'FD');
              doc.setFont(fontFamily, fontStyleRegular);
              doc.setFontSize(8);
              doc.setTextColor(150, 50, 50);
              doc.text(`[Bild fehlt: ${block.id}]`, boxX + imgWidth / 2, contentY + imgHeight / 2, { align: 'center' });
              
              if (block.float === 'none') {
                contentY += imgHeight + 15;
              }
              return;
            }

            const imgX = block.float === 'left' 
              ? blockX 
              : block.float === 'right' 
                ? blockX + drawWidth - imgWidth 
                : blockX + (drawWidth - imgWidth) / 2;
            
            if (block.float === 'none') {
              try {
                doc.addImage(imgSrc, 'JPEG', imgX, contentY, imgWidth, imgHeight);
              } catch (e) {
                doc.rect(imgX, contentY, imgWidth, imgHeight);
              }
              contentY += imgHeight + 12;
            } else {
              try {
                doc.addImage(imgSrc, 'JPEG', imgX, contentY, imgWidth, imgHeight);
              } catch (e) {
                doc.rect(imgX, contentY, imgWidth, imgHeight);
              }
              activeFloat = {
                float: block.float,
                width: imgWidth,
                height: imgHeight,
                bottomY: contentY + imgHeight + 8
              };
            }
            return;
          }

          default:
            return;
        }
      }

      // ── Render all blocks on this page part ─────────────────────────────
      doc.setFont(fontFamily, fontStyleRegular);
      doc.setFontSize(fontSize);

      const pageStyle = config.pagesParagraphStyle?.[i] || config.paragraphStyle || 'indent';
      const showInitialOnPage = (config.pagesInitial || []).includes(i) || (config.autoChapterDropCaps === true && isFirstPageOfChapter);
      const isDropCapPage = Boolean(showInitialOnPage && partIndex === 0);
      const dropCapDone = { v: false };

      const rawParas = partText.split('\n');
      const pageBlocks = parseBookLines(rawParas);

      pageBlocks.forEach((block, blockIdx) => {
        const prevBlock = blockIdx > 0 ? pageBlocks[blockIdx - 1] : null;
        drawPdfBlock(block, pageX, writableWidth, pageStyle, isDropCapPage, dropCapDone, blockIdx, prevBlock);
      });



      // Footer page numbers (centered)
      if (config.showPageNumbers !== false) {
        doc.setFont(fontFamily, fontStyleRegular);
        doc.setFontSize(9);
        doc.setTextColor(100);
        const footerX = pageWidth / 2;
        const arabicPageNum = pageContentNumberMap[i] + partIndex;
        doc.text(arabicPageNum.toString(), footerX, pageHeight - bottomMargin + 20, { align: 'center' });
      }
    });
  }

  return doc.output('blob');
}

function toRoman(num: number): string {
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
}

function drawGeometricEmblem(doc: jsPDF, cx: number, cy: number, size: number) {
  doc.setLineWidth(1);
  doc.setDrawColor(80);
  const r = size / 2;
  doc.circle(cx, cy, r);
  doc.circle(cx, cy, r - 6);
  doc.line(cx, cy - (r - 6), cx + (r - 6), cy);
  doc.line(cx + (r - 6), cy, cx, cy + (r - 6));
  doc.line(cx, cy + (r - 6), cx - (r - 6), cy);
  doc.line(cx - (r - 6), cy, cx, cy - (r - 6));
  doc.setFillColor(80, 80, 80);
  doc.circle(cx, cy, 2, 'F');
}

function drawFloralEmblem(doc: jsPDF, cx: number, cy: number, size: number) {
  doc.setLineWidth(1);
  doc.setDrawColor(80);
  const r = size / 4;
  doc.circle(cx - r/2, cy, r);
  doc.circle(cx + r/2, cy, r);
  doc.circle(cx, cy - r/2, r);
  doc.circle(cx, cy + r/2, r);
  doc.setFillColor(80, 80, 80);
  doc.circle(cx, cy, 3, 'F');
  doc.circle(cx, cy, size / 2);
}

function drawStarEmblem(doc: jsPDF, cx: number, cy: number, size: number) {
  doc.setLineWidth(1);
  doc.setDrawColor(80);
  const r = size / 2;
  doc.line(cx, cy - r, cx, cy + r);
  doc.line(cx - r, cy, cx + r, cy);
  const rd = r * 0.7;
  doc.line(cx - rd, cy - rd, cx + rd, cy + rd);
  doc.line(cx - rd, cy + rd, cx + rd, cy - rd);
  
  doc.line(cx, cy - r, cx + r*0.15, cy);
  doc.line(cx, cy - r, cx - r*0.15, cy);
  doc.line(cx, cy + r, cx + r*0.15, cy);
  doc.line(cx, cy + r, cx - r*0.15, cy);
  doc.line(cx - r, cy, cx, cy - r*0.15);
  doc.line(cx - r, cy, cx, cy + r*0.15);
  doc.line(cx + r, cy, cx, cy - r*0.15);
  doc.line(cx + r, cy, cx, cy + r*0.15);
}

function drawBookEmblem(doc: jsPDF, cx: number, cy: number, size: number) {
  doc.setLineWidth(1);
  doc.setDrawColor(80);
  const w = size * 0.8;
  const h = size * 0.6;
  const x = cx - w / 2;
  const y = cy - h / 2;
  
  doc.line(cx, y, cx, y + h);
  doc.line(cx, y, x, y + h * 0.1);
  doc.line(x, y + h * 0.1, x, y + h * 0.9);
  doc.line(x, y + h * 0.9, cx, y + h);
  
  doc.line(cx, y, cx + w/2, y + h * 0.1);
  doc.line(cx + w/2, y + h * 0.1, cx + w/2, y + h * 0.9);
  doc.line(cx + w/2, y + h * 0.9, cx, y + h);
  
  doc.line(cx - 4, y + 8, x + 4, y + h * 0.1 + 8);
  doc.line(cx - 4, y + 16, x + 4, y + h * 0.1 + 16);
  doc.line(cx - 4, y + 24, x + 4, y + h * 0.1 + 24);

  doc.line(cx + 4, y + 8, cx + w/2 - 4, y + h * 0.1 + 8);
  doc.line(cx + 4, y + 16, cx + w/2 - 4, y + h * 0.1 + 16);
  doc.line(cx + 4, y + 24, cx + w/2 - 4, y + h * 0.1 + 24);
}
