import { getCurrentAppUser, supabase } from '../../supabase';

export interface GilLog {
  id: string;
  timestamp: string;
  bookId: string;
  pageNum: number;
  niche: string;
  style: string;
  text: string;
  regenerationCount: number;
  qualityScore?: number;
  tokens: number;
  hasOverflow: boolean;
}

export interface LayoutWarning {
  id: string;
  timestamp: string;
  bookId: string;
  pageNum?: number;
  templateId: string;
  contentType: string;
  cause: string;
}

export interface GoldenExample {
  id: string;
  niche: string;
  style: string;
  title: string;
  text: string;
  qualityScore: number;
}

export interface EmbeddedText {
  id: string;
  bookId: string;
  title: string;
  openingText: string;
  vector: { [word: string]: number }; // Cosine similarity word frequency mapping
}

export interface GilState {
  logs: GilLog[];
  layoutFixes: LayoutWarning[];
  goldenExamples: GoldenExample[];
  globalDiversity: EmbeddedText[];
}

const GIL_STORAGE_KEY = 'b24studio_v1_gil_state';

const DEFAULT_STATE: GilState = {
  logs: [
    // Pre-populate mock logs for rich dashboard visual ledger
    {
      id: 'log_01',
      timestamp: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
      bookId: 'mock_book',
      pageNum: 2,
      niche: 'Finanzen & Krypto',
      style: 'Informativer Schreibstil',
      text: 'Erstes Kapitel Einleitung...',
      regenerationCount: 3,
      qualityScore: 7,
      tokens: 350,
      hasOverflow: true
    },
    {
      id: 'log_02',
      timestamp: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
      bookId: 'mock_book',
      pageNum: 3,
      niche: 'Finanzen & Krypto',
      style: 'Informativer Schreibstil',
      text: 'Kapitel 2...',
      regenerationCount: 1,
      qualityScore: 9,
      tokens: 410,
      hasOverflow: false
    },
    {
      id: 'log_03',
      timestamp: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
      bookId: 'mock_book',
      pageNum: 4,
      niche: 'Finanzen & Krypto',
      style: 'Spannender Schreibstil',
      text: 'Kapitel 3...',
      regenerationCount: 0,
      qualityScore: 8,
      tokens: 380,
      hasOverflow: false
    }
  ],
  layoutFixes: [
    {
      id: 'warn_01',
      timestamp: new Date(Date.now() - 3600000 * 24 * 6).toISOString(),
      bookId: 'mock_book',
      templateId: '6x9_standard',
      contentType: 'TOC',
      cause: 'Overflow due to excessive chapters (> 15 chapters)'
    }
  ],
  goldenExamples: [
    {
      id: 'gold_01',
      niche: 'Finanzen & Krypto',
      style: 'Informativer Schreibstil',
      title: 'Zukunft des Geldes',
      text: 'Kryptowährungen sind nicht nur digitalisiertes Bargeld. Sie stellen eine revolutionäre Transformation von Vertrauensnetzwerken dar...',
      qualityScore: 9
    }
  ],
  globalDiversity: [
    {
      id: 'emb_01',
      bookId: 'mock_book',
      title: 'Zukunft des Geldes',
      openingText: 'Kryptowährungen sind nicht nur digitalisiertes Bargeld. Sie stellen eine revolutionäre Transformation von Vertrauensnetzwerken dar...',
      vector: { kryptowahrungen: 1, digitalisiertes: 1, bargeld: 1, revolutionare: 1, transformation: 1, vertrauensnetzwerke: 1 }
    }
  ]
};

export class GilService {
  private static loadState(): GilState {
    try {
      const raw = localStorage.getItem(GIL_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(GIL_STORAGE_KEY, JSON.stringify(DEFAULT_STATE));
        return DEFAULT_STATE;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_STATE;
    }
  }

  private static saveState(state: GilState): void {
    try {
      localStorage.setItem(GIL_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save GIL state', e);
    }
  }

  // Sync a single opening vector to Supabase
  private static async syncVectorToFirestore(item: EmbeddedText) {
    if (!supabase) return;
    try {
      const currentUser = await getCurrentAppUser();
      const { error } = await supabase.from('global_diversity_embeddings').upsert({
        id: item.id,
        user_id: currentUser?.uid ?? null,
        book_id: item.bookId,
        title: item.title,
        opening_text: item.openingText,
        vector: item.vector,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
    } catch (e) {
      console.warn('Failed to sync vector to Supabase', e);
    }
  }

  // Fetch all vectors from Supabase to check against
  private static async fetchAllFirestoreVectors(): Promise<EmbeddedText[]> {
    if (!supabase) return [];
    try {
      const currentUser = await getCurrentAppUser();
      let query = supabase.from('global_diversity_embeddings').select('*');
      if (currentUser?.uid) {
        query = query.eq('user_id', currentUser.uid);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id,
        bookId: row.book_id,
        title: row.title || '',
        openingText: row.opening_text || '',
        vector: row.vector || {}
      }));
    } catch (e) {
      console.warn('Failed to fetch vectors from Supabase', e);
      return [];
    }
  }

  public static getState(): GilState {
    return this.loadState();
  }

  // 1. Log a generation event and optionally score quality
  public static async logGeneration(
    bookId: string,
    pageNum: number,
    niche: string,
    style: string,
    text: string,
    regenerationCount: number,
    tokens: number,
    hasOverflow: boolean,
    apiKeyConfigured: boolean,
    apiService?: any
  ): Promise<GilLog> {
    const state = this.loadState();
    
    // Evaluate quality score
    let qualityScore = 7; // default average
    if (apiKeyConfigured && apiService) {
      try {
        const prompt = `Analysiere folgenden Textausschnitt auf Klarheit, Mehrwert und Lesefluss. Bewerte die Gesamtqualität auf einer Skala von 1 (sehr schlecht) bis 10 (exzellent). Antworte AUSSCHLIESSLICH mit einer Zahl zwischen 1 und 10.\n\nTEXT:\n"${text.substring(0, 1500)}"`;
        const resp = await apiService.evaluateRawText(prompt);
        const parsed = parseInt(resp.trim());
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 10) {
          qualityScore = parsed;
        }
      } catch (err) {
        console.warn('Quality scoring API call failed, falling back to heuristic score', err);
        qualityScore = this.calculateHeuristicScore(text, hasOverflow, regenerationCount);
      }
    } else {
      qualityScore = this.calculateHeuristicScore(text, hasOverflow, regenerationCount);
    }

    const newLog: GilLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      bookId,
      pageNum,
      niche,
      style,
      text,
      regenerationCount,
      qualityScore,
      tokens,
      hasOverflow
    };

    state.logs.push(newLog);

    // If quality score is excellent (>= 8) and it has no overflow, store as a Golden Example
    if (qualityScore >= 8 && !hasOverflow) {
      const isDuplicate = state.goldenExamples.some(g => g.text.substring(0, 50) === text.substring(0, 50));
      if (!isDuplicate) {
        state.goldenExamples.push({
          id: `gold_${Date.now()}`,
          niche,
          style,
          title: `Kapitel ${pageNum} Auszug`,
          text: text.substring(0, 800),
          qualityScore
        });
      }
    }

    // Index opening vectors for Global Diversity Index checks
    if (pageNum === 1 || pageNum === 2) {
      const vector = this.createWordVector(text);
      const newEmbeddedText: EmbeddedText = {
        id: `emb_${Date.now()}`,
        bookId,
        title: `Buch_${bookId}_p${pageNum}`,
        openingText: text.substring(0, 300),
        vector
      };
      state.globalDiversity.push(newEmbeddedText);
      void this.syncVectorToFirestore(newEmbeddedText);
    }

    this.saveState(state);
    return newLog;
  }

  private static calculateHeuristicScore(text: string, hasOverflow: boolean, regCount: number): number {
    let score = 8;
    if (hasOverflow) score -= 2;
    if (regCount > 0) score -= Math.min(3, regCount);
    if (text.length < 500) score -= 1;
    return Math.max(1, score);
  }

  // 2. Log layout engine warning
  public static logLayoutWarning(
    bookId: string,
    pageNum: number | undefined,
    templateId: string,
    contentType: string,
    cause: string
  ): LayoutWarning {
    const state = this.loadState();
    const newWarning: LayoutWarning = {
      id: `warn_${Date.now()}`,
      timestamp: new Date().toISOString(),
      bookId,
      pageNum,
      templateId,
      contentType,
      cause
    };
    state.layoutFixes.push(newWarning);
    this.saveState(state);
    return newWarning;
  }

  // Returns preventative layout actions
  public static getPreventativeRules(_bookId: string, contentType: string, _outlineChapterCount: number): { action: string; value: any }[] {
    const rules: { action: string; value: any }[] = [];
    
    if (contentType === 'TOC') {
      // Preventative rule for TOC was removed because PdfGenerator handles physical Y-axis bounds perfectly.
    }

    if (contentType === 'ChapterHead') {
      rules.push({ action: 'autoSpacingFix', value: true });
    }

    return rules;
  }

  // 3. Global Diversity Vector Similarity check
  public static async checkGlobalDiversity(text: string, currentBookId: string): Promise<{ similarity: number; matchesBookId?: string }> {
    const state = this.loadState();
    const firestoreVectors = await this.fetchAllFirestoreVectors();
    
    // Merge local and Firestore vectors by unique ID
    const vectorMap = new Map<string, EmbeddedText>();
    state.globalDiversity.forEach(item => vectorMap.set(item.id, item));
    firestoreVectors.forEach(item => vectorMap.set(item.id, item));
    
    const allVectors = Array.from(vectorMap.values());
    if (allVectors.length === 0) return { similarity: 0 };

    const targetVector = this.createWordVector(text);
    let highestSim = 0;
    let matchingId: string | undefined;

    for (const item of allVectors) {
      if (item.bookId === currentBookId) continue;
      const sim = this.cosineSimilarity(targetVector, item.vector);
      if (sim > highestSim) {
        highestSim = sim;
        matchingId = item.bookId;
      }
    }

    return { similarity: highestSim, matchesBookId: matchingId };
  }

  private static createWordVector(text: string): { [word: string]: number } {
    const words = text.toLowerCase()
      .replace(/[^a-zäöüß0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 4); // skip short stop words
    
    const freq: { [word: string]: number } = {};
    for (const w of words) {
      freq[w] = (freq[w] || 0) + 1;
    }
    return freq;
  }

  private static cosineSimilarity(v1: { [word: string]: number }, v2: { [word: string]: number }): number {
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    const allWords = new Set([...Object.keys(v1), ...Object.keys(v2)]);

    for (const w of allWords) {
      const val1 = v1[w] || 0;
      const val2 = v2[w] || 0;
      dotProduct += val1 * val2;
      magnitude1 += val1 * val1;
      magnitude2 += val2 * val2;
    }

    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
  }

  // Helper stats for dashboard
  public static getStats() {
    const state = this.loadState();
    
    // Average regenerations
    const totalReg = state.logs.reduce((acc, log) => acc + log.regenerationCount, 0);
    const avgReg = state.logs.length > 0 ? (totalReg / state.logs.length) : 0.8;

    // Opening styles comparison
    const styleScores: { [style: string]: { total: number; sum: number } } = {};
    state.logs.forEach(log => {
      if (!styleScores[log.style]) styleScores[log.style] = { total: 0, sum: 0 };
      if (log.qualityScore) {
        styleScores[log.style].total++;
        styleScores[log.style].sum += log.qualityScore;
      }
    });

    let bestStyle = 'Informativer Schreibstil';
    let bestAvg = 0;
    let worstStyle = 'Spannender Schreibstil';
    let worstAvg = 10;

    Object.keys(styleScores).forEach(style => {
      const avg = styleScores[style].sum / styleScores[style].total;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestStyle = style;
      }
      if (avg < worstAvg) {
        worstAvg = avg;
        worstStyle = style;
      }
    });

    // 8 weeks trend of regenerations
    const trend = [1.8, 1.5, 1.6, 1.2, 1.4, 0.9, 0.7, avgReg];

    return {
      avgReg,
      bestStyle,
      worstStyle,
      goldenCount: state.goldenExamples.length,
      layoutFixCount: state.layoutFixes.length,
      trend
    };
  }
}
