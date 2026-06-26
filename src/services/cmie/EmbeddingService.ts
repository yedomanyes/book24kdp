export class EmbeddingService {
  private static readonly STOP_WORDS = new Set([
    'der', 'die', 'das', 'ein', 'eine', 'einer', 'eines', 'einem', 'einen', 'und', 'oder', 'aber', 
    'wenn', 'dann', 'weil', 'diese', 'dieser', 'dieses', 'diesem', 'diesen', 'auch', 'man', 'es', 
    'sie', 'wir', 'ich', 'er', 'im', 'am', 'zum', 'zur', 'von', 'bei', 'mit', 'nach', 'über', 
    'unter', 'vor', 'durch', 'für', 'auf', 'ist', 'sind', 'war', 'waren', 'wird', 'werden', 
    'hat', 'haben', 'hatte', 'behandelt', 'abgrenzung', 'explizit', 'nicht', 'kapitel', 'seite', 
    'fokus', 'inhalt', 'themenfeld', 'deckt', 'aus', 'einer', 'sowie', 'dass', 'dem', 'den', 'des'
  ]);

  /**
   * Erzeugt einen 512-dimensionalen Vektor ohne Stoppwörter (perfekt für Themen & Scopes).
   */
  public static computeVector(text: string): number[] {
    if (!text || !text.trim()) return new Array(512).fill(0);

    const clean = text.toLowerCase().replace(/[^a-zäöüß0-9\s_]/g, ' ');
    const rawWords = clean.split(/\s+/).filter(w => w.length > 1);
    const words = rawWords.filter(w => !this.STOP_WORDS.has(w));
    
    if (words.length === 0) return this.computeRawVector(text);

    const dim = 512;
    const vec = new Array(dim).fill(0);

    for (let i = 0; i < words.length; i++) {
      const h1 = this.hashString(words[i]) % dim;
      vec[h1] += 1.0;

      if (i < words.length - 1) {
        const bigram = words[i] + '_' + words[i+1];
        const h2 = this.hashString(bigram) % dim;
        vec[h2] += 1.5;
      }
    }

    return this.normalize(vec);
  }

  /**
   * Erzeugt einen Vektor INKLUSIVE Stoppwörter & Trigramme (perfekt für Satzstruktur & Openings).
   */
  public static computeRawVector(text: string): number[] {
    if (!text || !text.trim()) return new Array(512).fill(0);

    const clean = text.toLowerCase().replace(/[^a-zäöüß0-9\s]/g, ' ');
    const words = clean.split(/\s+/).filter(w => w.length > 1);
    
    const dim = 512;
    const vec = new Array(dim).fill(0);

    for (let i = 0; i < words.length; i++) {
      const h1 = this.hashString(words[i]) % dim;
      vec[h1] += 1.0;

      if (i < words.length - 1) {
        const bigram = words[i] + '_' + words[i+1];
        const h2 = this.hashString(bigram) % dim;
        vec[h2] += 1.8;
      }
    }

    // Trigramme für Phrasen-Syntax
    for (let i = 0; i < clean.length - 3; i += 2) {
      const tri = clean.substring(i, i + 3);
      if (tri.trim().length === 3) {
        const h3 = this.hashString(tri) % dim;
        vec[h3] += 0.5;
      }
    }

    return this.normalize(vec);
  }

  private static normalize(vec: number[]): number[] {
    let sumSq = 0;
    for (let v of vec) sumSq += v * v;
    const norm = Math.sqrt(sumSq);
    if (norm === 0) return vec;
    return vec.map(v => v / norm);
  }

  private static hashString(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return Math.abs(hash);
  }

  public static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length === 0 || vecA.length !== vecB.length) return 0;
    let dot = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
    }
    return Math.max(0, Math.min(1.0, dot));
  }
}
