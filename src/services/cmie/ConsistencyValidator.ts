import type { ChapterMemory } from '../../types/cmie';

export class ConsistencyValidator {
  /**
   * Aktualisiert das laufende Projekt-Glossar mit den neu etablierten Begriffen des Kapitels
   * und prüft übergreifend auf potenzielle Zahlen- oder Definitions-Widersprüche.
   */
  public static updateGlossaryAndCheck(
    newMemory: ChapterMemory,
    currentGlossary?: { [term: string]: string },
    allMemories?: { [pageNum: number]: ChapterMemory }
  ): { updatedGlossary: { [term: string]: string }; contradictions: string[] } {
    const glossary = { ...(currentGlossary || {}) };
    const contradictions: string[] = [];

    // 1. Etablierte Fachbegriffe ins Glossar eintragen
    newMemory.key_terms.forEach(term => {
      if (!glossary[term]) {
        glossary[term] = `Eingeführt in Kap. ${newMemory.chapter_id} (${newMemory.chapter_title})`;
      }
    });

    // 2. Kernaussagen auf numerische oder inhaltliche Diskrepanzen prüfen
    if (allMemories) {
      Object.values(allMemories).forEach(prev => {
        if (prev.chapter_id === newMemory.chapter_id) return;
        
        newMemory.key_facts.forEach(newFact => {
          const numNew = newFact.match(/\b\d+(?:[.,]\d+)?(?:%| Prozent| Euro| USD)?\b/);
          if (numNew) {
            prev.key_facts.forEach(prevFact => {
              const sigWords = newFact.toLowerCase().split(' ').filter(w => w.length > 5 && prevFact.toLowerCase().includes(w));
              if (sigWords.length >= 2) {
                const numPrev = prevFact.match(/\b\d+(?:[.,]\d+)?(?:%| Prozent| Euro| USD)?\b/);
                if (numPrev && numPrev[0] !== numNew[0]) {
                  contradictions.push(`Inkonsistenz-Warnung bei "${sigWords[0]}": Kap. ${prev.chapter_id} gibt (${numPrev[0]}) an, Kap. ${newMemory.chapter_id} gibt (${numNew[0]}) an.`);
                }
              }
            });
          }
        });
      });
    }

    return { updatedGlossary: glossary, contradictions };
  }

  /**
   * Erzeugt den systemseitigen Glossar-Block für den Generierungs-Prompt.
   */
  public static buildGlossaryPrompt(glossary?: { [term: string]: string }): string {
    if (!glossary || Object.keys(glossary).length === 0) return '';

    let prompt = `\n### [CMIE KONSISTENZ-GLOSSAR] (Strikte Begriffsbinding im Buch):\n`;
    Object.entries(glossary).slice(0, 20).forEach(([term, desc]) => {
      prompt += `- ${term} [${desc}]\n`;
    });
    prompt += `Achte unbedingt darauf, diese Begriffe exakt im selben logischen und fachlichen Kontext wie in den vorherigen Kapiteln einzusetzen!\n`;

    return prompt;
  }
}
