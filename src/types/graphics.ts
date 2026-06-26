export type GraphicType = 'tabelle' | 'prozess' | 'timeline' | 'hierarchie';

export type GraphicLayoutVariant = 'horizontal' | 'vertical' | 'radial' | 'cards' | 'compact';

export interface TableConfig {
  spalten: string[];
  zeilen: string[][];
}

export interface ProcessConfig {
  schritte: string[];
}

export interface TimelineItem {
  zeitpunkt: string;
  ereignis: string;
}

export interface TimelineConfig {
  punkte: TimelineItem[];
}

export interface HierarchyConfig {
  ebenen: string[];
}

export interface GraphicDecision {
  grafik_sinnvoll: boolean;
  typ?: GraphicType;
  titel?: string;
  tabelle?: TableConfig;
  prozess?: ProcessConfig;
  timeline?: TimelineConfig;
  hierarchie?: HierarchyConfig;
  
  // UI & Pipeline Meta
  selectedVariant?: GraphicLayoutVariant;
  pipeline?: 'A' | 'B'; // A = SVG Structured Data, B = Image Illustration
  imagePrompt?: string;
  imageUrl?: string;
  scale?: number;
  x?: number;
  y?: number;
  themeColor?: string;
  fontFamily?: string;
  borderRadius?: number;
  preset?: string;
  isRegenerating?: boolean;
}
