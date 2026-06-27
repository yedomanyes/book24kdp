import type { ChapterMemory } from '../../types/cmie';
import { EmbeddingService } from './EmbeddingService';

export class BookMemoryStore {
  /**
   * Extrahiert strukturiert die Gedächtnisdaten aus einem generierten Kapitel.
   */
  public static createMemory(
    chapterId: number,
    chapterTitle: string,
    chapterText: string,
    chapterScope?: string
  ): ChapterMemory {
    // 1. Bereinigen und in Sätze aufteilen
    const cleanText = (chapterText || '').replace(/\r\n/g, '\n');
    const sentences = cleanText
      .replace(/\n+/g, ' ')
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 12 && !s.startsWith('#') && !s.startsWith(':::'));
    
    // 2. Opening sentences (erste 1-2 Sätze)
    const opening_sentences = sentences.slice(0, 2).join(' ').trim() || (chapterText || '').slice(0, 150);

    // 3. Chapter summary (3 Sätze: Anfang, Mitte, Ende)
    let summarySents: string[] = [];
    if (sentences.length <= 3) {
      summarySents = sentences;
    } else {
      const midIdx = Math.floor(sentences.length / 2);
      summarySents = [sentences[0], sentences[midIdx], sentences[sentences.length - 1]];
    }
    const chapter_summary = summarySents.join(' ').trim() || opening_sentences;

    // 4. Key facts (Kernaussagen mit Signalwörtern)
    const factKeywords = ['ist', 'sind', 'bedeutet', 'zeigt', 'wichtig', 'entscheidend', 'beispielsweise', 'prozent', 'jahr', 'führen', 'grund', 'daher'];
    const key_facts = sentences
      .filter(s => factKeywords.some(k => s.toLowerCase().includes(k)))
      .slice(0, 5);

    // 5. Key terms (Fachbegriffe / substantivische Eigennamen im Satz)
    const termMatches = cleanText.match(/(?<=\s)[A-ZÄÖÜ][a-zäöüß]+(?:-[A-ZÄÖÜ][a-zäöüß]+)?/g) || [];
    const stopWords = new Set([
      'Der', 'Die', 'Das', 'Ein', 'Eine', 'Und', 'Oder', 'Aber', 'Wenn', 'Dann', 'Weil', 
      'Diese', 'Dieser', 'Dieses', 'Auch', 'Man', 'Es', 'Sie', 'Wir', 'Im', 'Am', 'Zum', 
      'Zur', 'Von', 'Bei', 'Mit', 'Nach', 'Über', 'Unter', 'Vor', 'Durch', 'Kapitel', 'Teil', 
      'Buch', 'Seite', 'Hier', 'Dabei', 'Daher', 'Darüber', 'Heraus', 'Allerdings'
    ]);
    
    const uniqueTerms = Array.from(new Set(termMatches)).filter(t => !stopWords.has(t) && t.length > 3);
    const key_terms = uniqueTerms.slice(0, 15);

    // 6. Embedding Vector (für Similarity Checks)
    const embeddingContext = `${chapterTitle} ${chapterScope || ''} ${opening_sentences} ${chapter_summary}`;
    const embedding_vector = EmbeddingService.computeVector(embeddingContext);

    return {
      chapter_id: chapterId,
      chapter_title: chapterTitle,
      chapter_summary,
      opening_sentences,
      key_facts: key_facts.length > 0 ? key_facts : sentences.slice(0, 3),
      key_terms,
      embedding_vector,
      chapter_scope: chapterScope
    };
  }
  /**
   * Erzeugt den systemseitigen Kontext-Prompt für das CMIE-Gedächtnis.
   */
  public static buildMemoryContextPrompt(store?: { [pageNum: number]: ChapterMemory }, isGroq: boolean = false): string {
    if (!store) return '';
    let memories = Object.values(store).sort((a, b) => a.chapter_id - b.chapter_id);
    // Limit to the last 4-5 pages (2 pages for Groq to prevent blowing up the Groq 6000 TPM limit)
    const limit = isGroq ? 2 : 5;
    if (memories.length > limit) {
      memories = memories.slice(-limit);
    }
    if (memories.length === 0) return '';

    let prompt = `\n### [CMIE] CONTENT MEMORY ENGINE (Letzte ${memories.length} generierte Seiten):\n`;
    memories.forEach(m => {
      prompt += `[Kapitel ${m.chapter_id}: ${m.chapter_title}]\n`;
      if (m.chapter_scope) prompt += `  - Scope: ${m.chapter_scope}\n`;
      prompt += `  - Einstieg: "${m.opening_sentences}"\n`;
      prompt += `  - Kernaussagen: ${m.chapter_summary}\n`;
      if (m.key_terms && m.key_terms.length > 0) {
        prompt += `  - Etablierte Begriffe: ${m.key_terms.slice(0, 6).join(', ')}\n`;
      }
    });
    prompt += `\nSTRIKTE ANWEISUNG: Du musst inhaltliche Wiederholungen zu den obigen Kapiteln strikt vermeiden. Beginne das neue Kapitel mit einer völlig andersartigen Satzstruktur als die bisherigen Einstiege!\n`;

    return prompt;
  }
}
