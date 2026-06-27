import { DuplicateGuard } from '../cmie/DuplicateGuard';

export interface GlobalOpening {
  bookId: string;
  chapterNumber: number;
  openingText: string;
}

/**
 * GIL 2.0: GlobalDiversityIndex (Local Mock for pgvector)
 * Stores ALL chapter openings across ALL books in localStorage and 
 * computes Jaccard/Bigram/Cosine similarity to ensure global diversity.
 */
export class GlobalDiversityIndex {
  private static STORAGE_KEY = 'b24studio_global_diversity_index';

  static load(): GlobalOpening[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  static save(data: GlobalOpening[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  static addOpening(bookId: string, chapterNumber: number, openingText: string) {
    const index = this.load();
    index.push({ bookId, chapterNumber, openingText });
    this.save(index);
  }

  static validateAgainstGlobalIndex(currentOpening: string, currentBookId: string): { passed: boolean; reprompt?: string } {
    const index = this.load();
    
    // Filter out openings from the CURRENT book (since DuplicateGuard handles local CMIE)
    const otherBooksOpenings = index.filter(o => o.bookId !== currentBookId);
    
    if (otherBooksOpenings.length === 0) return { passed: true };

    const currOpBigrams = (DuplicateGuard as any).getWordBigrams(currentOpening);

    for (const opening of otherBooksOpenings) {
      const mOpBigrams = (DuplicateGuard as any).getWordBigrams(opening.openingText);
      const overlap = (DuplicateGuard as any).computeBigramOverlap(currOpBigrams, mOpBigrams);
      
      // Strict threshold for GLOBAL similarity
      if (overlap > 0.85) {
        return {
          passed: false,
          reprompt: `\n### [GLOBAL DIVERSITY INDEX WARNUNG]:\nDieser Eröffnungssatz ("${currentOpening.slice(0, 100)}...") ist projektübergreifend zu ähnlich zu einem anderen Buch (Overlap: ${(overlap * 100).toFixed(0)}%). Formuliere einen vollkommen neuen Einstieg!`
        };
      }
    }

    return { passed: true };
  }
}
