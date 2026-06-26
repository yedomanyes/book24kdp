import type { ChapterMemory } from '../../types/cmie';
import { EmbeddingService } from './EmbeddingService';

export interface DuplicateValidationResult {
  passed: boolean;
  maxOpeningSimilarity: number;
  maxSummarySimilarity: number;
  similarChapterId?: number;
  similarChapterTitle?: string;
  similarTextSnippet?: string;
  repromptInstruction?: string;
}

export class DuplicateGuard {
  /**
   * Vergleicht Opening (< 0.85) und Summary (< 0.80) gegen alle bisherigen Kapitel.
   * Nutzt sowohl Cosine Similarity als auch N-Gram Bigram-Overlap für maximale Erkennungsschärfe.
   */
  public static validate(
    currentOpening: string,
    currentSummary: string,
    memoryStore?: { [pageNum: number]: ChapterMemory },
    openingThreshold: number = 0.85,
    summaryThreshold: number = 0.80
  ): DuplicateValidationResult {
    if (!memoryStore || Object.keys(memoryStore).length === 0) {
      return { passed: true, maxOpeningSimilarity: 0, maxSummarySimilarity: 0 };
    }

    const currOpVec = EmbeddingService.computeRawVector(currentOpening);
    const currSumVec = EmbeddingService.computeVector(currentSummary);
    const currOpBigrams = this.getWordBigrams(currentOpening);

    let maxOpSim = 0;
    let maxSumSim = 0;
    let failChapter: ChapterMemory | null = null;
    let isOpeningFail = false;

    for (const m of Object.values(memoryStore)) {
      const opVec = EmbeddingService.computeRawVector(m.opening_sentences);
      const sumVec = EmbeddingService.computeVector(m.chapter_summary);
      const mOpBigrams = this.getWordBigrams(m.opening_sentences);

      const opCosine = EmbeddingService.cosineSimilarity(currOpVec, opVec);
      const opNgram = this.computeBigramOverlap(currOpBigrams, mOpBigrams);
      const opSim = Math.max(opCosine, opNgram);

      const sumSim = EmbeddingService.cosineSimilarity(currSumVec, sumVec);

      if (opSim > maxOpSim) maxOpSim = opSim;
      if (sumSim > maxSumSim) maxSumSim = sumSim;

      if (opSim >= openingThreshold) {
        failChapter = m;
        isOpeningFail = true;
      } else if (sumSim >= summaryThreshold && !failChapter) {
        failChapter = m;
      }
    }

    if (failChapter) {
      const snippet = isOpeningFail ? failChapter.opening_sentences : failChapter.chapter_summary;
      const reprompt = `\n### [CMIE DUPLICATE GUARD KORREKTUR-PFLICHT]:\nDer erzeugte Text weist eine zu hohe stilistische oder inhaltliche Ähnlichkeit zu Kapitel ${failChapter.chapter_id} ("${failChapter.chapter_title}") auf. Vermeide insbesondere die Eröffnung bzw. Formulierung "${snippet}". Formuliere den Einstieg aus einer völlig veränderten Perspektive!\n`;

      return {
        passed: false,
        maxOpeningSimilarity: maxOpSim,
        maxSummarySimilarity: maxSumSim,
        similarChapterId: failChapter.chapter_id,
        similarChapterTitle: failChapter.chapter_title,
        similarTextSnippet: snippet,
        repromptInstruction: reprompt
      };
    }

    return {
      passed: true,
      maxOpeningSimilarity: maxOpSim,
      maxSummarySimilarity: maxSumSim
    };
  }

  private static getWordBigrams(text: string): Set<string> {
    const clean = (text || '').toLowerCase().replace(/[^a-zäöüß0-9\s]/g, ' ');
    const words = clean.split(/\s+/).filter(w => w.length > 1);
    const set = new Set<string>();
    for (let i = 0; i < words.length - 1; i++) {
      set.add(words[i] + '_' + words[i+1]);
    }
    return set;
  }

  private static computeBigramOverlap(setA: Set<string>, setB: Set<string>): number {
    if (!setA || !setB || setA.size === 0 || setB.size === 0) return 0;
    let match = 0;
    for (const bg of setA) {
      if (setB.has(bg)) match++;
    }
    const minSize = Math.min(setA.size, setB.size);
    return minSize === 0 ? 0 : match / minSize;
  }
}
