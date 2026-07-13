/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import './CoverEditor.css';

// ─────────────────────────────────────────────────────────────────────────────
// SVGs & PREMIUM ICONS
// ─────────────────────────────────────────────────────────────────────────────

const CloseIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const BookIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
  </svg>
);

const TemplateIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"></path>
    <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"></path>
  </svg>
);

const SaveIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
    <polyline points="17 21 17 13 7 13 7 21"></polyline>
    <polyline points="7 3 7 8 15 8"></polyline>
  </svg>
);

const DownloadIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const SelectIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 3 3 16 9 13 18 18 20 16 12 11 18 10 3 3"></polygon>
  </svg>
);

const TextIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 7 4 4 20 4 20 7"></polyline>
    <line x1="9" y1="20" x2="15" y2="20"></line>
    <line x1="12" y1="4" x2="12" y2="20"></line>
  </svg>
);

const ImageIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21 15 16 10 5 21"></polyline>
  </svg>
);

const RectIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"></rect>
  </svg>
);

const UndoIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7v6h6"></path>
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>
  </svg>
);

const RedoIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 7v6h-6"></path>
    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"></path>
  </svg>
);

const TrashIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS & TYPES
// ─────────────────────────────────────────────────────────────────────────────

const BLEED_PT = 9;   // 0.125" × 72 — KDP standard bleed
const SAFE_PT  = 18;  // 0.25" × 72  — KDP safe zone from trim edge

const PAGE_SIZES: Record<string, [number, number]> = {
  '5x8':    [5, 8],
  '5.5x8.5':[5.5, 8.5],
  '6x9':    [6, 9],
  '8.5x11': [8.5, 11],
  'a4':     [8.27, 11.69],
  'custom': [6, 9],
};

interface CoverEditorProps {
  theme: 'dark' | 'light';
  activeBook?: {
    title?: string;
    pageSize?: string;
    outline?: { pages?: any[] };
    coverDesign?: string; // JSON of saved canvas state
    customWidth?: number;
    customHeight?: number;
  } | null;
  onSaveCoverDesign?: (json: string) => void;
  onClose?: () => void;
}

interface LayerItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  objRef: any;
}

interface ObjProps {
  x: number; y: number; w: number; h: number;
  angle: number; opacity: number;
  text?: string; fontSize?: number; fontFamily?: string;
  bold?: boolean; italic?: boolean; underline?: boolean;
  textAlign?: string; fill?: string; charSpacing?: number;
  rectFill?: string; stroke?: string; strokeWidth?: number;
  scaleX?: number; scaleY?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

const TEMPLATES = [
  { id:'dark_thriller', name:'Dark Thriller',  bg1:'#050505', bg2:'#1a0505', titleColor:'#ffffff', subtitleColor:'#cc2222', authorColor:'#888888', titleFont:'Impact',           bodyFont:'Georgia' },
  { id:'business_pro',  name:'Business Pro',   bg1:'#0f2044', bg2:'#1e3a6e', titleColor:'#ffffff', subtitleColor:'#90b8e8', authorColor:'#c0d4ec', titleFont:'Arial',            bodyFont:'Arial' },
  { id:'self_help',     name:'Self Help',      bg1:'#ff5f1f', bg2:'#ffb300', titleColor:'#ffffff', subtitleColor:'#fff3d0', authorColor:'#ffe0a0', titleFont:'Arial',            bodyFont:'Arial' },
  { id:'romance',       name:'Romance',        bg1:'#1e0a26', bg2:'#5c2060', titleColor:'#f8d8ee', subtitleColor:'#d4a0c0', authorColor:'#b07898', titleFont:'Georgia',          bodyFont:'Georgia' },
  { id:'minimal',       name:'Minimal',        bg1:'#f5f5f5', bg2:'#ffffff', titleColor:'#111111', subtitleColor:'#444444', authorColor:'#666666', titleFont:'Helvetica Neue',   bodyFont:'Helvetica Neue' },
  { id:'fantasy',       name:'Fantasy',        bg1:'#060614', bg2:'#14143a', titleColor:'#d4aa30', subtitleColor:'#8080cc', authorColor:'#6060aa', titleFont:'Times New Roman',  bodyFont:'Times New Roman' },
  { id:'academic',      name:'Academic',       bg1:'#142240', bg2:'#142240', titleColor:'#ffffff', subtitleColor:'#bcd4f0', authorColor:'#90b0d8', titleFont:'Times New Roman',  bodyFont:'Times New Roman' },
  { id:'vibrant',       name:'Vibrant',        bg1:'#5b21b6', bg2:'#db2777', titleColor:'#ffffff', subtitleColor:'#f0d0ff', authorColor:'#e0c0f8', titleFont:'Arial',            bodyFont:'Arial' },
];

const FONTS = [
  'Arial','Helvetica Neue','Georgia','Times New Roman','Verdana',
  'Impact','Trebuchet MS','Courier New',
  'Bebas Neue','Oswald','Montserrat','Playfair Display','Raleway',
  'Lato','Open Sans','Roboto','Merriweather','Cinzel','IM Fell English','Poppins',
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: derive canvas dimensions from book config
// ─────────────────────────────────────────────────────────────────────────────

function calcDims(pageSize: string, totalPages: number, customW?: number, customH?: number) {
  const [wIn, hIn] = PAGE_SIZES[pageSize] || [6, 9];
  const fW = (pageSize === 'custom' ? (customW || 6) : wIn);
  const fH = (pageSize === 'custom' ? (customH || 9) : hIn);
  const spineIn = Math.max(0.0625, totalPages * 0.0025); // min 0.0625" for integrity
  const spineW = spineIn * 72;
  const frontW = fW * 72;
  const frontH = fH * 72;
  const backW  = frontW;
  const totalW = BLEED_PT + backW + spineW + frontW + BLEED_PT;
  const totalH = BLEED_PT + frontH + BLEED_PT;

  // Zone X boundaries (in canvas px = pt at 72dpi)
  const backLeft   = BLEED_PT;
  const spineLeft  = BLEED_PT + backW;
  const frontLeft  = spineLeft + spineW;
  const contentTop = BLEED_PT;

  return { totalW, totalH, frontW, frontH, backW, spineW, backLeft, spineLeft, frontLeft, contentTop, spineIn };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function CoverEditor({ activeBook, onSaveCoverDesign, onClose }: CoverEditorProps) {
  const canvasElRef  = useRef<HTMLCanvasElement>(null);
  const fabricRef    = useRef<any>(null);
  const selectedRef  = useRef<any>(null);
  const dimsRef      = useRef<ReturnType<typeof calcDims> | null>(null);
  const undoStack    = useRef<string[]>([]);
  const redoStack    = useRef<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [zoom, setZoom]           = useState(0.55);
  const [activeTool, setActiveTool] = useState<string>('select');
  const [layers, setLayers]       = useState<LayerItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [props, setProps]         = useState<ObjProps | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);

  const pageSize   = activeBook?.pageSize   || '6x9';
  const totalPages = activeBook?.outline?.pages?.length || 200;
  const title      = activeBook?.title || 'Buchtitel';
  const dims       = calcDims(pageSize, totalPages, activeBook?.customWidth, activeBook?.customHeight);
  dimsRef.current  = dims;

  // ── SYNC LAYERS ─────────────────────────────────────────────────────────────
  const syncLayers = useCallback((fc: any) => {
    const objs: LayerItem[] = [];
    (fc.getObjects() as any[])
      .filter(o => o.data?.role !== 'zone-bg')
      .reverse()
      .forEach(o => {
        const t = o.type || 'object';
        const isText = t === 'i-text' || t === 'text';
        const isImg = t === 'image';
        const icon = isText ? TextIcon : isImg ? ImageIcon : RectIcon;
        objs.push({ id: o.data?.id || Math.random().toString(), name: o.data?.name || t, icon, objRef: o });
      });
    setLayers(objs);
  }, []);

  // ── HISTORY ──────────────────────────────────────────────────────────────────
  const saveHistory = useCallback((fc: any) => {
    const json = JSON.stringify(fc.toJSON(['data']));
    undoStack.current.push(json);
    if (undoStack.current.length > 40) undoStack.current.shift();
    redoStack.current = [];
  }, []);

  // ── INIT FABRIC CANVAS ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasElRef.current) return;
    let fc: any;

    (async () => {
      const fab = await import('fabric');

      fc = new fab.Canvas(canvasElRef.current!, {
        width: dims.totalW,
        height: dims.totalH,
        backgroundColor: '#808080',
        preserveObjectStacking: true,
        selection: true,
        stopContextMenu: true,
      });

      fabricRef.current = fc;

      // Draw static zone markers via after:render hook
      fc.on('after:render', () => drawZoneOverlay(fc, dims));

      // Selection events
      const syncSelection = (e: any) => {
        const obj = e?.selected?.[0] ?? fc.getActiveObject();
        if (!obj || obj.data?.role === 'zone-bg') { setSelectedId(null); setProps(null); selectedRef.current = null; return; }
        selectedRef.current = obj;
        setSelectedId(obj.data?.id || '');
        setProps(extractProps(obj));
      };
      fc.on('selection:created', syncSelection);
      fc.on('selection:updated', syncSelection);
      fc.on('selection:cleared', () => { setSelectedId(null); setProps(null); selectedRef.current = null; });
      fc.on('object:modified', (e: any) => { if (e.target) setProps(extractProps(e.target)); syncLayers(fc); saveHistory(fc); });
      fc.on('object:added',   () => syncLayers(fc));
      fc.on('object:removed', () => syncLayers(fc));

      // Draw zone backgrounds
      addZoneBackgrounds(fab, fc, dims);

      // Load saved design or apply default template
      if (activeBook?.coverDesign) {
        try {
          await fc.loadFromJSON(JSON.parse(activeBook.coverDesign));
          fc.renderAll();
        } catch {
          applyTemplate(fab, fc, dims, TEMPLATES[0], title);
        }
      } else {
        applyTemplate(fab, fc, dims, TEMPLATES[0], title);
      }

      fc.renderAll();
      syncLayers(fc);
      setCanvasReady(true);
    })();

    return () => { try { fc?.dispose(); } catch {} fabricRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const undo = useCallback(async () => {
    const fc = fabricRef.current;
    if (!fc || undoStack.current.length === 0) return;
    const current = JSON.stringify(fc.toJSON(['data']));
    redoStack.current.push(current);
    const prev = undoStack.current.pop()!;
    await fc.loadFromJSON(JSON.parse(prev));
    fc.renderAll();
    syncLayers(fc);
  }, [syncLayers]);

  const redo = useCallback(async () => {
    const fc = fabricRef.current;
    if (!fc || redoStack.current.length === 0) return;
    const current = JSON.stringify(fc.toJSON(['data']));
    undoStack.current.push(current);
    const next = redoStack.current.pop()!;
    await fc.loadFromJSON(JSON.parse(next));
    fc.renderAll();
    syncLayers(fc);
  }, [syncLayers]);

  // ── DELETE SELECTED ─────────────────────────────────────────────────────────
  const deleteSelected = useCallback(() => {
    const fc = fabricRef.current;
    const obj = selectedRef.current;
    if (!fc || !obj) return;
    fc.remove(obj);
    selectedRef.current = null;
    setSelectedId(null); setProps(null);
    fc.renderAll();
    syncLayers(fc);
    saveHistory(fc);
  }, [syncLayers, saveHistory]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [deleteSelected, undo, redo]);

  // ── ADD TEXT ───────────────────────────────────────────────────────────────
  const addText = useCallback(async () => {
    const fc = fabricRef.current;
    const d = dimsRef.current;
    if (!fc || !d) return;
    const fab = await import('fabric');
    const id = 'text_' + Date.now();
    const obj = new fab.IText('Neuer Text', {
      left: d.frontLeft + 20, top: d.contentTop + 60,
      fontSize: 28, fontFamily: 'Georgia',
      fill: '#ffffff', fontWeight: 'normal',
      textAlign: 'center',
      data: { id, name: 'Text', role: 'user' },
    } as any);
    fc.add(obj);
    fc.setActiveObject(obj);
    fc.renderAll();
    saveHistory(fc);
    setActiveTool('select');
  }, [saveHistory]);

  // ── ADD RECT ───────────────────────────────────────────────────────────────
  const addRect = useCallback(async () => {
    const fc = fabricRef.current;
    const d = dimsRef.current;
    if (!fc || !d) return;
    const fab = await import('fabric');
    const id = 'rect_' + Date.now();
    const obj = new fab.Rect({
      left: d.frontLeft + 40, top: d.contentTop + 100,
      width: 120, height: 80,
      fill: '#4f46e5', stroke: 'transparent', strokeWidth: 0,
      rx: 6, ry: 6,
      data: { id, name: 'Form', role: 'user' },
    } as any);
    fc.add(obj);
    fc.setActiveObject(obj);
    fc.renderAll();
    saveHistory(fc);
    setActiveTool('select');
  }, [saveHistory]);

  // ── ADD IMAGE ──────────────────────────────────────────────────────────────
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricRef.current) return;
    const fc = fabricRef.current;
    const d = dimsRef.current!;
    const fab = await import('fabric');

    const url = URL.createObjectURL(file);
    const imgEl = new Image();
    imgEl.onload = () => {
      const id = 'img_' + Date.now();
      const fImg = new fab.FabricImage(imgEl, {
        left: d.frontLeft + 10, top: d.contentTop + 10,
        data: { id, name: file.name.split('.')[0], role: 'user' },
      } as any);
      const scale = Math.min((d.frontW - 20) / imgEl.width, (d.frontH - 20) / imgEl.height);
      fImg.scale(scale);
      fc.add(fImg);
      fc.setActiveObject(fImg);
      fc.renderAll();
      saveHistory(fc);
      URL.revokeObjectURL(url);
    };
    imgEl.src = url;
    e.target.value = '';
    setActiveTool('select');
  }, [saveHistory]);

  // ── UPDATE PROPERTY ────────────────────────────────────────────────────────
  const updateProp = useCallback((key: string, value: any) => {
    const fc = fabricRef.current;
    const obj = selectedRef.current;
    if (!fc || !obj) return;

    const fabricKey: Record<string, string> = {
      x: 'left', y: 'top', w: 'width', h: 'height',
      angle: 'angle', opacity: 'opacity',
      fontSize: 'fontSize', fontFamily: 'fontFamily',
      textAlign: 'textAlign', fill: 'fill',
      charSpacing: 'charSpacing',
      bold: 'fontWeight', italic: 'fontStyle', underline: 'underline',
      rectFill: 'fill', stroke: 'stroke', strokeWidth: 'strokeWidth',
    };

    if (key === 'bold') {
      obj.set('fontWeight', value ? 'bold' : 'normal');
    } else if (key === 'italic') {
      obj.set('fontStyle', value ? 'italic' : 'normal');
    } else if (key === 'w' || key === 'h') {
      if (obj.type === 'rect' || obj.type === 'circle') {
        obj.set(key === 'w' ? 'width' : 'height', Number(value));
      } else {
        const orig = key === 'w' ? obj.getScaledWidth() : obj.getScaledHeight();
        const newVal = Number(value);
        if (orig > 0) {
          const scale = newVal / (key === 'w' ? (obj.width || 1) : (obj.height || 1));
          obj.set(key === 'w' ? 'scaleX' : 'scaleY', scale);
        }
      }
    } else {
      const fk = fabricKey[key] || key;
      obj.set(fk, value);
    }

    obj.setCoords?.();
    fc.renderAll();
    setProps(prev => prev ? { ...prev, [key]: value } : null);
  }, []);

  // ── APPLY TEMPLATE ─────────────────────────────────────────────────────────
  const handleApplyTemplate = useCallback(async (tpl: typeof TEMPLATES[0]) => {
    const fc = fabricRef.current;
    const d = dimsRef.current;
    if (!fc || !d) return;
    const fab = await import('fabric');

    const toRemove = (fc.getObjects() as any[]).filter(o => o.data?.role !== 'zone-bg');
    toRemove.forEach(o => fc.remove(o));

    (fc.getObjects() as any[])
      .filter(o => o.data?.role === 'zone-bg')
      .forEach(o => {
        const zone = o.data?.zone;
        if (zone === 'front' || zone === 'back' || zone === 'spine') {
          if (tpl.bg2 && tpl.bg1 !== tpl.bg2) {
            const grad = new fab.Gradient({
              type: 'linear',
              coords: { x1: 0, y1: 0, x2: 0, y2: o.height || 1 },
              colorStops: [
                { offset: 0, color: tpl.bg1 },
                { offset: 1, color: tpl.bg2 },
              ],
            } as any);
            o.set('fill', grad);
          } else {
            o.set('fill', tpl.bg1);
          }
        }
      });

    const fL = d.frontLeft; const cT = d.contentTop; const fW = d.frontW; const fH = d.frontH;

    const titleObj = new fab.IText(title.toUpperCase(), {
      left: fL + fW / 2, top: cT + fH * 0.18,
      originX: 'center', originY: 'center',
      fontSize: Math.min(52, fW / title.length * 1.3),
      fontFamily: tpl.titleFont,
      fontWeight: 'bold',
      fill: tpl.titleColor,
      textAlign: 'center',
      width: fW - 40,
      data: { id: 'title_' + Date.now(), name: 'Titel', role: 'user' },
    } as any);

    const subObj = new fab.IText('Untertitel des Buches', {
      left: fL + fW / 2, top: cT + fH * 0.32,
      originX: 'center', originY: 'center',
      fontSize: 18, fontFamily: tpl.bodyFont,
      fill: tpl.subtitleColor, textAlign: 'center',
      width: fW - 60,
      data: { id: 'subtitle_' + Date.now(), name: 'Untertitel', role: 'user' },
    } as any);

    const lineObj = new fab.Rect({
      left: fL + fW / 2, top: cT + fH * 0.38,
      originX: 'center', originY: 'center',
      width: fW * 0.4, height: 2,
      fill: tpl.subtitleColor, opacity: 0.6,
      selectable: true, evented: true,
      data: { id: 'divider_' + Date.now(), name: 'Linie', role: 'user' },
    } as any);

    const authorObj = new fab.IText('Von Autor Name', {
      left: fL + fW / 2, top: cT + fH * 0.88,
      originX: 'center', originY: 'center',
      fontSize: 16, fontFamily: tpl.bodyFont,
      fill: tpl.authorColor, textAlign: 'center',
      fontStyle: 'italic' as any,
      width: fW - 60,
      data: { id: 'author_' + Date.now(), name: 'Autor', role: 'user' },
    } as any);

    const backDesc = new fab.IText('Beschreibung des Buches auf der Rückseite.\nHier steht der Klappentext.', {
      left: d.backLeft + d.backW / 2, top: cT + fH * 0.3,
      originX: 'center', originY: 'center',
      fontSize: 14, fontFamily: tpl.bodyFont,
      fill: tpl.authorColor, textAlign: 'center',
      width: d.backW - 40,
      data: { id: 'back_text_' + Date.now(), name: 'Rückseite Text', role: 'user' },
    } as any);

    if (d.spineIn >= 0.25) {
      const spineTitle = new fab.IText(title, {
        left: d.spineLeft + d.spineW / 2,
        top: cT + fH / 2,
        originX: 'center', originY: 'center',
        angle: -90,
        fontSize: Math.min(14, d.spineW * 0.55),
        fontFamily: tpl.titleFont,
        fontWeight: 'bold',
        fill: tpl.titleColor,
        data: { id: 'spine_title_' + Date.now(), name: 'Spine Titel', role: 'user' },
      } as any);
      fc.add(spineTitle);
    }

    fc.add(titleObj, subObj, lineObj, authorObj, backDesc);
    fc.renderAll();
    syncLayers(fc);
    saveHistory(fc);
    setShowTemplates(false);
  }, [title, syncLayers, saveHistory]);

  // ── EXPORT PNG ──────────────────────────────────────────────────────────────
  const exportPNG = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    fc.discardActiveObject();
    fc.renderAll();
    const dataURL = fc.toDataURL({ format: 'png', multiplier: 300 / 72 } as any);
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `${title || 'cover'}_300dpi.png`;
    a.click();
  }, [title]);

  // ── SAVE ───────────────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc || !onSaveCoverDesign) return;
    const json = JSON.stringify(fc.toJSON(['data']));
    onSaveCoverDesign(json);
  }, [onSaveCoverDesign]);

  // ── BRING FORWARD / SEND BACK ───────────────────────────────────────────────
  const bringForward = () => {
    const fc = fabricRef.current;
    const obj = selectedRef.current;
    if (!fc || !obj) return;
    fc.bringObjectForward(obj);
    fc.renderAll();
    syncLayers(fc);
  };
  const sendBackward = () => {
    const fc = fabricRef.current;
    const obj = selectedRef.current;
    if (!fc || !obj) return;
    fc.sendObjectBackwards(obj);
    fc.renderAll();
    syncLayers(fc);
  };

  // ── TOOL CLICK ──────────────────────────────────────────────────────────────
  const handleToolClick = (tool: string) => {
    const fc = fabricRef.current;
    setActiveTool(tool);
    if (!fc) return;

    if (tool === 'text') { addText(); return; }
    if (tool === 'rect') { addRect(); return; }
    if (tool === 'image') { fileInputRef.current?.click(); return; }

    if (tool === 'select') {
      fc.isDrawingMode = false;
      fc.selection = true;
    }
  };

  // ── RENDER PROPS PANEL ──────────────────────────────────────────────────────
  const renderPropsPanel = () => {
    if (!props || !selectedRef.current) {
      return (
        <div className="ce-no-selection">
          <div style={{ display: 'flex', justifyContent: 'center', opacity: 0.25, marginBottom: '8px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><circle cx="12" cy="12" r="3"/></svg>
          </div>
          <p>Klicke auf ein Element um seine Eigenschaften zu bearbeiten.</p>
        </div>
      );
    }

    const isText = ['i-text', 'text', 'itext'].includes(selectedRef.current?.type || '');
    const isShape = selectedRef.current?.type === 'rect' || selectedRef.current?.type === 'circle';

    return (
      <>
        {/* Position & Size */}
        <div className="ce-panel-section">
          <div className="ce-panel-title">Position & Größe</div>
          <div className="ce-input-row">
            <div className="ce-field">
              <label>X</label>
              <input className="ce-input" type="number" value={Math.round(props.x)} onChange={e => updateProp('x', Number(e.target.value))} />
            </div>
            <div className="ce-field">
              <label>Y</label>
              <input className="ce-input" type="number" value={Math.round(props.y)} onChange={e => updateProp('y', Number(e.target.value))} />
            </div>
          </div>
          <div className="ce-input-row">
            <div className="ce-field">
              <label>B (px)</label>
              <input className="ce-input" type="number" value={Math.round(props.w)} onChange={e => updateProp('w', Number(e.target.value))} />
            </div>
            <div className="ce-field">
              <label>H (px)</label>
              <input className="ce-input" type="number" value={Math.round(props.h)} onChange={e => updateProp('h', Number(e.target.value))} />
            </div>
          </div>
          <div className="ce-input-row">
            <div className="ce-field">
              <label>Rotation °</label>
              <input className="ce-input" type="number" value={Math.round(props.angle)} onChange={e => updateProp('angle', Number(e.target.value))} />
            </div>
            <div className="ce-field">
              <label>Deckkraft</label>
              <input className="ce-input" type="number" min={0} max={1} step={0.05} value={props.opacity.toFixed(2)} onChange={e => updateProp('opacity', Number(e.target.value))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button className="ce-btn ce-btn-ghost" style={{ flex: 1, fontSize: 12, padding: '5px 8px' }} onClick={bringForward}>▲ Nach vorne</button>
            <button className="ce-btn ce-btn-ghost" style={{ flex: 1, fontSize: 12, padding: '5px 8px' }} onClick={sendBackward}>▼ Nach hinten</button>
          </div>
          <button className="ce-btn ce-btn-ghost" style={{ width: '100%', marginTop: 6, fontSize: 12, color: '#f87171', borderColor: '#7f1d1d' }} onClick={deleteSelected}>🗑 Element löschen</button>
        </div>

        {/* Text Properties */}
        {isText && (
          <div className="ce-panel-section">
            <div className="ce-panel-title">Text</div>
            <div className="ce-field">
              <label>Schriftart</label>
              <select className="ce-input" value={props.fontFamily || 'Georgia'} onChange={e => updateProp('fontFamily', e.target.value)}>
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="ce-input-row">
              <div className="ce-field">
                <label>Größe (pt)</label>
                <input className="ce-input" type="number" min={6} max={200} value={props.fontSize || 24} onChange={e => updateProp('fontSize', Number(e.target.value))} />
              </div>
              <div className="ce-field">
                <label>Abstand</label>
                <input className="ce-input" type="number" min={-200} max={800} value={props.charSpacing || 0} onChange={e => updateProp('charSpacing', Number(e.target.value))} />
              </div>
            </div>
            <div className="ce-field">
              <label>Stil</label>
              <div className="ce-font-btn-row">
                <button className={`ce-font-btn ${props.bold ? 'active' : ''}`} style={{ fontWeight: 'bold' }} onClick={() => updateProp('bold', !props.bold)}>B</button>
                <button className={`ce-font-btn ${props.italic ? 'active' : ''}`} style={{ fontStyle: 'italic' }} onClick={() => updateProp('italic', !props.italic)}>I</button>
                <button className={`ce-font-btn ${props.underline ? 'active' : ''}`} style={{ textDecoration: 'underline' }} onClick={() => updateProp('underline', !props.underline)}>U</button>
                <button className={`ce-font-btn ${props.textAlign === 'left' ? 'active' : ''}`} onClick={() => updateProp('textAlign', 'left')}>≡L</button>
                <button className={`ce-font-btn ${props.textAlign === 'center' ? 'active' : ''}`} onClick={() => updateProp('textAlign', 'center')}>≡C</button>
                <button className={`ce-font-btn ${props.textAlign === 'right' ? 'active' : ''}`} onClick={() => updateProp('textAlign', 'right')}>≡R</button>
              </div>
            </div>
            <div className="ce-field">
              <label>Textfarbe</label>
              <div className="ce-color-row">
                <div className="ce-color-swatch">
                  <input type="color" value={props.fill || '#ffffff'} onChange={e => updateProp('fill', e.target.value)} />
                </div>
                <input className="ce-input" value={props.fill || '#ffffff'} onChange={e => updateProp('fill', e.target.value)} placeholder="#ffffff" />
              </div>
            </div>
          </div>
        )}

        {/* Shape Properties */}
        {isShape && (
          <div className="ce-panel-section">
            <div className="ce-panel-title">Form</div>
            <div className="ce-field">
              <label>Füllfarbe</label>
              <div className="ce-color-row">
                <div className="ce-color-swatch">
                  <input type="color" value={(props.rectFill as string) || '#4f46e5'} onChange={e => updateProp('rectFill', e.target.value)} />
                </div>
                <input className="ce-input" value={(props.rectFill as string) || '#4f46e5'} onChange={e => updateProp('rectFill', e.target.value)} />
              </div>
            </div>
            <div className="ce-input-row">
              <div className="ce-field">
                <label>Rahmen</label>
                <div className="ce-color-swatch" style={{ width: '100%' }}>
                  <input type="color" value={(props.stroke as string) || '#000000'} onChange={e => updateProp('stroke', e.target.value)} />
                </div>
              </div>
              <div className="ce-field">
                <label>Stärke</label>
                <input className="ce-input" type="number" min={0} max={20} value={props.strokeWidth || 0} onChange={e => updateProp('strokeWidth', Number(e.target.value))} />
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const { spineIn } = dims;
  const spineWarnVisible = spineIn < 0.25;

  // ── JSX ──────────────────────────────────────────────────────────────────────
  return (
    <div className={`cover-editor ${onClose ? 'ce-overlay' : ''}`}>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />

      {/* ── HEADER ─────────────────────────────── */}
      <div className="ce-header">
        {onClose && (
          <button
            className="ce-zoom-btn"
            onClick={onClose}
            title="Schließen"
            style={{ marginRight: 8, padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {CloseIcon}
          </button>
        )}
        {BookIcon}
        <span className="ce-header-title">Cover Editor</span>
        <div className="ce-header-spine-info">
          Spine: {(spineIn * 25.4).toFixed(1)}mm ({totalPages} Seiten)
          {spineWarnVisible && <span style={{ color: '#f87171', marginLeft: 6 }}>⚠ zu schmal für Text</span>}
        </div>

        <div className="ce-header-spacer" />

        {/* Zoom */}
        <div className="ce-zoom-group">
          <button className="ce-zoom-btn" onClick={() => setZoom(z => Math.max(0.15, z - 0.1))}>−</button>
          <span className="ce-zoom-label">{Math.round(zoom * 100)}%</span>
          <button className="ce-zoom-btn" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>+</button>
          <button className="ce-zoom-btn" title="Fit" onClick={() => setZoom(0.55)} style={{ fontSize: 12, fontWeight: 700 }}>⊡</button>
        </div>

        <button className="ce-btn ce-btn-ghost" onClick={() => setShowTemplates(true)}>
          {TemplateIcon} Templates
        </button>
        {onSaveCoverDesign && (
          <button className="ce-btn ce-btn-ghost" onClick={handleSave}>
            {SaveIcon} Speichern
          </button>
        )}
        <button className="ce-btn ce-btn-success" onClick={exportPNG}>
          {DownloadIcon} PNG Export (300 DPI)
        </button>
      </div>

      {/* ── BODY ─────────────────────────────────── */}
      <div className="ce-body">

        {/* ── LEFT TOOLBAR ─────────────── */}
        <div className="ce-toolbar">
          <button data-tip="Auswahl" className={`ce-tool-btn ${activeTool === 'select' ? 'active' : ''}`} onClick={() => handleToolClick('select')}>{SelectIcon}</button>
          <button data-tip="Text" className={`ce-tool-btn ${activeTool === 'text' ? 'active' : ''}`} onClick={() => handleToolClick('text')}>{TextIcon}</button>
          <button data-tip="Bild hochladen" className={`ce-tool-btn ${activeTool === 'image' ? 'active' : ''}`} onClick={() => handleToolClick('image')}>{ImageIcon}</button>
          <button data-tip="Rechteck" className={`ce-tool-btn ${activeTool === 'rect' ? 'active' : ''}`} onClick={() => handleToolClick('rect')}>{RectIcon}</button>
          <div className="ce-tool-sep" />
          <button data-tip="Rückgängig" className="ce-tool-btn" onClick={undo}>{UndoIcon}</button>
          <button data-tip="Wiederholen" className="ce-tool-btn" onClick={redo}>{RedoIcon}</button>
          <button data-tip="Löschen" className="ce-tool-btn" onClick={deleteSelected} style={{ color: '#f87171' }}>{TrashIcon}</button>
        </div>

        {/* ── CANVAS AREA ─────────────── */}
        <div className="ce-canvas-area">
          <div className="ce-canvas-wrap"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', willChange: 'transform' }}
          >
            <canvas ref={canvasElRef} />
            {!canvasReady && (
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'#0f172a', color:'#64748b', fontSize:14 }}>
                Canvas wird initialisiert…
              </div>
            )}
            {/* Zone labels below canvas */}
            <div style={{ display:'flex', position:'absolute', top: dims.totalH + 4, left: 0, width: dims.totalW, pointerEvents:'none' }}>
              <div style={{ width: dims.backW, textAlign:'center', marginLeft: BLEED_PT, fontSize:10, color:'#475569', fontWeight:600, letterSpacing:1, textTransform:'uppercase' }}>Rückseite</div>
              <div style={{ width: dims.spineW, textAlign:'center', fontSize:10, color:'#475569', fontWeight:600, letterSpacing:1, textTransform:'uppercase' }}>Spine</div>
              <div style={{ width: dims.frontW, textAlign:'center', fontSize:10, color:'#475569', fontWeight:600, letterSpacing:1, textTransform:'uppercase' }}>Vorderseite</div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ─────────────── */}
        <div className="ce-panel">
          {renderPropsPanel()}
          {/* Book info at bottom */}
          <div className="ce-panel-section" style={{ marginTop: 'auto' }}>
            <div className="ce-panel-title">Cover-Info</div>
            <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.7 }}>
              <div>Buchgröße: <span style={{ color:'#94a3b8' }}>{pageSize}</span></div>
              <div>Seiten: <span style={{ color:'#94a3b8' }}>{totalPages}</span></div>
              <div>Bleed: <span style={{ color:'#94a3b8' }}>3 mm (KDP Standard)</span></div>
              <div>Gesamt: <span style={{ color:'#94a3b8' }}>{(dims.totalW / 72 * 25.4).toFixed(0)} × {(dims.totalH / 72 * 25.4).toFixed(0)} mm</span></div>
              <div style={{ marginTop: 8, color: '#ef4444', fontSize: 10 }}>🔴 Rote Linie = Bleed/Schnitt</div>
              <div style={{ color: '#eab308', fontSize: 10 }}>🟡 Gelb gestrichelt = Safe Zone</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── LAYERS ─────────────────────────────── */}
      <div className="ce-layers">
        <span className="ce-layers-label">Ebenen</span>
        {layers.length === 0 && <span style={{ color: '#334155', fontSize: 12, marginLeft: 8 }}>Noch keine Elemente</span>}
        {layers.map(layer => (
          <div
            key={layer.id}
            className={`ce-layer-item ${selectedId === layer.id ? 'active' : ''}`}
            onClick={() => {
              const fc = fabricRef.current;
              if (!fc) return;
              fc.setActiveObject(layer.objRef);
              fc.renderAll();
              setSelectedId(layer.id);
              setProps(extractProps(layer.objRef));
              selectedRef.current = layer.objRef;
            }}
          >
            <span className="ce-layer-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, color: '#94a3b8' }}>
              {layer.icon}
            </span>
            <span className="ce-layer-name" style={{ marginLeft: 4 }}>{layer.name}</span>
            <button className="ce-layer-del" onClick={e => {
              e.stopPropagation();
              const fc = fabricRef.current;
              if (!fc) return;
              fc.remove(layer.objRef);
              fc.renderAll();
              syncLayers(fc);
              saveHistory(fc);
            }}>×</button>
          </div>
        ))}
      </div>

      {/* ── TEMPLATES MODAL ────────────────────── */}
      {showTemplates && (
        <div className="ce-modal-overlay" onClick={() => setShowTemplates(false)}>
          <div className="ce-modal" onClick={e => e.stopPropagation()}>
            <div className="ce-modal-header">
              <h2>Templates wählen</h2>
              <button className="ce-modal-close" onClick={() => setShowTemplates(false)}>{CloseIcon}</button>
            </div>
            <div className="ce-template-grid">
              {TEMPLATES.map(tpl => (
                <div
                  key={tpl.id}
                  className="ce-template-card"
                  onClick={() => handleApplyTemplate(tpl)}
                >
                  <div
                    className="ce-template-preview"
                    style={{ background: `linear-gradient(160deg, ${tpl.bg1}, ${tpl.bg2})` }}
                  >
                    <div className="ce-template-preview-title" style={{ color: tpl.titleColor, fontFamily: tpl.titleFont, fontWeight: 700 }}>
                      TITEL
                    </div>
                    <div className="ce-template-preview-author" style={{ color: tpl.authorColor, fontFamily: tpl.bodyFont }}>
                      Von Autor
                    </div>
                  </div>
                  <div className="ce-template-name">{tpl.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function addZoneBackgrounds(fab: any, fc: any, dims: ReturnType<typeof calcDims>) {
  const { totalH, frontW: _frontW, backW, spineW, backLeft, spineLeft, frontLeft, contentTop } = dims;
  const h = totalH - BLEED_PT * 2;

  const makeZoneBg = (zone: string, left: number, w: number) => new fab.Rect({
    left, top: contentTop, width: w, height: h,
    fill: zone === 'spine' ? '#1a1a1a' : '#111111',
    selectable: false, evented: false, hoverCursor: 'default',
    data: { role: 'zone-bg', zone },
  });

  fc.add(makeZoneBg('back', backLeft, backW));
  fc.add(makeZoneBg('spine', spineLeft, spineW));
  fc.add(makeZoneBg('front', frontLeft, dims.frontW));

  const bleedColor = '#1e293b';
  const bleedRects = [
    new fab.Rect({ left: 0, top: 0, width: BLEED_PT, height: totalH, fill: bleedColor, selectable: false, evented: false, hoverCursor: 'default', data: { role: 'zone-bg', zone: 'bleed' } }),
    new fab.Rect({ left: dims.totalW - BLEED_PT, top: 0, width: BLEED_PT, height: totalH, fill: bleedColor, selectable: false, evented: false, hoverCursor: 'default', data: { role: 'zone-bg', zone: 'bleed' } }),
    new fab.Rect({ left: 0, top: 0, width: dims.totalW, height: BLEED_PT, fill: bleedColor, selectable: false, evented: false, hoverCursor: 'default', data: { role: 'zone-bg', zone: 'bleed' } }),
    new fab.Rect({ left: 0, top: totalH - BLEED_PT, width: dims.totalW, height: BLEED_PT, fill: bleedColor, selectable: false, evented: false, hoverCursor: 'default', data: { role: 'zone-bg', zone: 'bleed' } }),
  ];
  bleedRects.forEach(r => fc.add(r));
}

function drawZoneOverlay(fc: any, dims: ReturnType<typeof calcDims>) {
  const ctx: CanvasRenderingContext2D = fc.getContext ? fc.getContext() : fc.lowerCanvasEl?.getContext('2d');
  if (!ctx) return;
  const { totalW, totalH, frontW, backW, spineW, backLeft, spineLeft, frontLeft, contentTop } = dims;
  const contentH = totalH - BLEED_PT * 2;

  ctx.save();

  ctx.strokeStyle = 'rgba(220, 38, 38, 0.85)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);
  ctx.strokeRect(BLEED_PT + 0.75, BLEED_PT + 0.75, totalW - BLEED_PT * 2 - 1.5, contentH - 1.5);

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);
  ctx.beginPath(); ctx.moveTo(spineLeft, contentTop); ctx.lineTo(spineLeft, contentTop + contentH); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(spineLeft + spineW, contentTop); ctx.lineTo(spineLeft + spineW, contentTop + contentH); ctx.stroke();

  ctx.strokeStyle = 'rgba(234, 179, 8, 0.6)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(frontLeft + SAFE_PT, contentTop + SAFE_PT, frontW - SAFE_PT * 2, contentH - SAFE_PT * 2);
  ctx.strokeRect(backLeft + SAFE_PT, contentTop + SAFE_PT, backW - SAFE_PT * 2, contentH - SAFE_PT * 2);

  ctx.setLineDash([]);
  ctx.restore();
}

function extractProps(obj: any): ObjProps {
  const t = obj.type || '';
  const isText = ['i-text', 'text', 'itext'].includes(t);
  const isShape = t === 'rect' || t === 'circle';
  return {
    x: Math.round(obj.left || 0),
    y: Math.round(obj.top || 0),
    w: Math.round(obj.getScaledWidth?.() ?? obj.width ?? 0),
    h: Math.round(obj.getScaledHeight?.() ?? obj.height ?? 0),
    angle: Math.round(obj.angle || 0),
    opacity: typeof obj.opacity === 'number' ? obj.opacity : 1,
    text: isText ? obj.text : undefined,
    fontSize: isText ? obj.fontSize : undefined,
    fontFamily: isText ? obj.fontFamily : undefined,
    bold: obj.fontWeight === 'bold',
    italic: obj.fontStyle === 'italic',
    underline: !!obj.underline,
    textAlign: obj.textAlign || 'left',
    fill: isText ? (typeof obj.fill === 'string' ? obj.fill : '#ffffff') : undefined,
    charSpacing: obj.charSpacing || 0,
    rectFill: isShape ? (typeof obj.fill === 'string' ? obj.fill : '#4f46e5') : undefined,
    stroke: obj.stroke || undefined,
    strokeWidth: obj.strokeWidth || 0,
    scaleX: obj.scaleX, scaleY: obj.scaleY,
  };
}

function applyTemplate(fab: any, fc: any, dims: ReturnType<typeof calcDims>, tpl: typeof TEMPLATES[0], bookTitle: string) {
  const { frontW, frontH, backW, spineW, backLeft, spineLeft, frontLeft, contentTop, spineIn } = dims;

  (fc.getObjects() as any[])
    .filter((o: any) => o.data?.role === 'zone-bg' && (o.data.zone === 'front' || o.data.zone === 'back' || o.data.zone === 'spine'))
    .forEach((o: any) => {
      if (tpl.bg1 !== tpl.bg2) {
        const grad = new fab.Gradient({
          type: 'linear',
          coords: { x1: 0, y1: 0, x2: 0, y2: o.height || 1 },
          colorStops: [{ offset: 0, color: tpl.bg1 }, { offset: 1, color: tpl.bg2 }],
        });
        o.set('fill', grad);
      } else {
        o.set('fill', tpl.bg1);
      }
    });

  const safeTitle = bookTitle || 'Buchtitel';
  const titleFontSize = Math.max(20, Math.min(56, frontW / Math.max(safeTitle.length, 5) * 1.4));

  const makeIText = (text: string, opts: any) => new fab.IText(text, { ...opts, data: { id: opts.data?.id || ('el_' + Date.now() + Math.random()), name: opts.data?.name || 'Text', role: 'user' } });

  fc.add(makeIText(safeTitle.toUpperCase(), {
    left: frontLeft + frontW / 2, top: contentTop + frontH * 0.2,
    originX: 'center', originY: 'center',
    fontSize: titleFontSize, fontFamily: tpl.titleFont, fontWeight: 'bold',
    fill: tpl.titleColor, textAlign: 'center', width: frontW - 40,
    data: { id: 'title', name: 'Titel' },
  }));

  fc.add(makeIText('Dein Untertitel', {
    left: frontLeft + frontW / 2, top: contentTop + frontH * 0.35,
    originX: 'center', originY: 'center',
    fontSize: 16, fontFamily: tpl.bodyFont,
    fill: tpl.subtitleColor, textAlign: 'center', width: frontW - 60,
    data: { id: 'subtitle', name: 'Untertitel' },
  }));

  fc.add(new fab.Rect({
    left: frontLeft + frontW / 2, top: contentTop + frontH * 0.43,
    originX: 'center', width: frontW * 0.4, height: 2,
    fill: tpl.subtitleColor, opacity: 0.5, selectable: true, evented: true,
    data: { id: 'divider', name: 'Linie', role: 'user' },
  }));

  fc.add(makeIText('Von Autor Name', {
    left: frontLeft + frontW / 2, top: contentTop + frontH * 0.88,
    originX: 'center', originY: 'center',
    fontSize: 15, fontFamily: tpl.bodyFont, fontStyle: 'italic',
    fill: tpl.authorColor, textAlign: 'center',
    data: { id: 'author', name: 'Autor' },
  }));

  fc.add(makeIText('Füge hier deinen Klappentext ein.\n\nWas erwartet den Leser?\nWas lernt er?\nWarum ist dieses Buch besonders?', {
    left: backLeft + backW / 2, top: contentTop + frontH * 0.3,
    originX: 'center', originY: 'center',
    fontSize: 13, fontFamily: tpl.bodyFont, lineHeight: 1.5,
    fill: tpl.subtitleColor, textAlign: 'center', width: backW - 50,
    data: { id: 'back_desc', name: 'Klappentext' },
  }));

  fc.add(makeIText(safeTitle, {
    left: backLeft + backW / 2, top: contentTop + frontH * 0.08,
    originX: 'center', originY: 'center',
    fontSize: 20, fontFamily: tpl.titleFont, fontWeight: 'bold',
    fill: tpl.titleColor, textAlign: 'center',
    data: { id: 'back_title', name: 'Rücktitel' },
  }));

  if (spineIn >= 0.25) {
    fc.add(makeIText(safeTitle, {
      left: spineLeft + spineW / 2, top: contentTop + frontH / 2,
      originX: 'center', originY: 'center', angle: -90,
      fontSize: Math.min(12, spineW * 0.55), fontFamily: tpl.titleFont, fontWeight: 'bold',
      fill: tpl.titleColor,
      data: { id: 'spine_title', name: 'Spine Titel' },
    }));
  }
}
