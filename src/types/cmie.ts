export type CmiePageStatus = 'ok' | 'similar' | 'copyright_warn' | 'review_needed';

export interface ChapterMemory {
  chapter_id: number;
  chapter_title: string;
  chapter_summary: string;       // 3 Sätze, automatisch erzeugt
  opening_sentences: string;     // erste 1-2 Sätze
  key_facts: string[];           // Liste extrahierter Kernaussagen/Fakten des Kapitels
  key_terms: string[];           // Fachbegriffe/Eigennamen, die definiert/verwendet wurden
  embedding_vector: number[];    // TF-IDF / N-Gram Vektor für Similarity-Checks
  chapter_scope?: string;        // 2-3 Sätze Was abgedeckt wird & Was explizit NICHT
}

export interface CmieConfig {
  enabled: boolean;
  scopeSimilarityThreshold: number;   // Standard: 0.75
  openingSimilarityThreshold: number; // Standard: 0.85
  summarySimilarityThreshold: number; // Standard: 0.80
  maxQuoteWords: number;              // Standard: 15
}

export const DEFAULT_CMIE_CONFIG: CmieConfig = {
  enabled: true,
  scopeSimilarityThreshold: 0.75,
  openingSimilarityThreshold: 0.85,
  summarySimilarityThreshold: 0.80,
  maxQuoteWords: 15
};
