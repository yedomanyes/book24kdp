import type { ChapterMemory, CmieConfig, CmiePageStatus } from '../../types/cmie';
import { DEFAULT_CMIE_CONFIG } from '../../types/cmie';
import { BookMemoryStore } from './BookMemoryStore';
import { DuplicateGuard } from './DuplicateGuard';
import { CopyrightGuard, LocalSourcePlagiarismChecker } from './CopyrightGuard';
import { ConsistencyValidator } from './ConsistencyValidator';
import { OutlinePlanner } from './OutlinePlanner';

export class CmieOrchestrator {
  /**
   * Erweitert den Generierungs-Prompt um die CMIE-Schutzschichten
   * (Gedächtnis bisheriger Kapitel, Glossar-Binding und Copyright-Pflichtklausel).
   */
  public static enrichGenerationPrompt(
    cmieStore?: { [pageNum: number]: ChapterMemory },
    cmieGlossary?: { [term: string]: string },
    repromptInstruction?: string
  ): string {
    let enrichment = '';
    
    // 1. Copyright Mandate
    enrichment += CopyrightGuard.MANDATORY_PROMPT_CLAUSE;

    // 2. Memory Context (bereits geschriebene Kapitel)
    enrichment += BookMemoryStore.buildMemoryContextPrompt(cmieStore);

    // 3. Consistency Glossary
    enrichment += ConsistencyValidator.buildGlossaryPrompt(cmieGlossary);

    // 4. Re-prompt bei vorherigem Dopplungs-Verstoß
    if (repromptInstruction) {
      enrichment += repromptInstruction;
    }

    return enrichment;
  }

  /**
   * Verarbeitet eine fertig generierte Seite durch alle CMIE Integritäts-Guards.
   */
  public static async inspectAndStorePage(
    pageNum: number,
    chapterTitle: string,
    generatedText: string,
    extractedSourceText?: string,
    currentStore?: { [pageNum: number]: ChapterMemory },
    _currentStatus?: { [pageNum: number]: CmiePageStatus },
    currentGlossary?: { [term: string]: string },
    config: CmieConfig = DEFAULT_CMIE_CONFIG,
    chapterScope?: string
  ): Promise<{
    passed: boolean;
    pageStatus: CmiePageStatus;
    memory: ChapterMemory;
    updatedGlossary: { [term: string]: string };
    repromptInstruction?: string;
    warningMessage?: string;
  }> {
    // 1. Gedächtnis-Objekt erzeugen
    const memory = BookMemoryStore.createMemory(pageNum, chapterTitle, generatedText, chapterScope);

    // 2. Duplicate Guard Check
    const dupResult = DuplicateGuard.validate(
      memory.opening_sentences,
      memory.chapter_summary,
      currentStore,
      config.openingSimilarityThreshold || 0.85,
      config.summarySimilarityThreshold || 0.80
    );

    if (!dupResult.passed) {
      return {
        passed: false,
        pageStatus: 'similar',
        memory,
        updatedGlossary: currentGlossary || {},
        repromptInstruction: dupResult.repromptInstruction,
        warningMessage: `DOPPLUNGS-WARNUNG (CMIE): Textstruktur zu nah an Kapitel ${dupResult.similarChapterId}!`
      };
    }

    // 3. Copyright Guard Check
    const checker = new LocalSourcePlagiarismChecker(extractedSourceText);
    const copyResult = await CopyrightGuard.inspectChapter(generatedText, checker, config.maxQuoteWords || 15);

    if (!copyResult.passed) {
      return {
        passed: false,
        pageStatus: 'review_needed',
        memory,
        updatedGlossary: currentGlossary || {},
        warningMessage: copyResult.warningMessage
      };
    }

    // 4. Consistency Validator
    const consResult = ConsistencyValidator.updateGlossaryAndCheck(memory, currentGlossary, currentStore);

    return {
      passed: true,
      pageStatus: 'ok',
      memory,
      updatedGlossary: consResult.updatedGlossary,
      warningMessage: consResult.contradictions.length > 0 ? consResult.contradictions.join(' ') : undefined
    };
  }

  /**
   * Validiert eine komplette Gliederung über den OutlinePlanner.
   */
  public static processOutline(outline: any, config: CmieConfig = DEFAULT_CMIE_CONFIG): any {
    if (!outline) return outline;
    const { outline: fixedOutline } = OutlinePlanner.validateAndFixScopes(
      outline, 
      config.scopeSimilarityThreshold || 0.75
    );
    return fixedOutline;
  }
}
