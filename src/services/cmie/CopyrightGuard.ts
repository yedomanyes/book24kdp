export interface PlagiarismCheckerInterface {
  checkExactMatch(text: string, maxWords: number): Promise<{ isInfringing: boolean; matchedSnippet?: string; source?: string }>;
}

/**
 * Lokale Standard-Implementierung des Plagiats-Check Interfaces.
 * Prüft den generierten Text gegen Projekt-Quellen (`extractedSourceText`) oder definierte Quellmaterialien.
 */
export class LocalSourcePlagiarismChecker implements PlagiarismCheckerInterface {
  private knownSourceText: string;

  constructor(sourceText?: string) {
    this.knownSourceText = (sourceText || '').toLowerCase().replace(/\s+/g, ' ');
  }

  public async checkExactMatch(text: string, maxWords: number = 15): Promise<{ isInfringing: boolean; matchedSnippet?: string; source?: string }> {
    if (!text || !this.knownSourceText || this.knownSourceText.length < 30) {
      return { isInfringing: false };
    }

    const clean = text.toLowerCase().replace(/[^a-zäöüß0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const words = clean.split(' ').filter(Boolean);

    if (words.length < maxWords) return { isInfringing: false };

    // Sliding Window Check über exakte n-Wort Abschnitte
    for (let i = 0; i <= words.length - maxWords; i++) {
      const windowSnippet = words.slice(i, i + maxWords).join(' ');
      if (windowSnippet.length > 40 && this.knownSourceText.includes(windowSnippet)) {
        return {
          isInfringing: true,
          matchedSnippet: words.slice(i, i + maxWords).join(' '),
          source: "Projekt Quellmaterial / Externe Referenzquelle"
        };
      }
    }

    return { isInfringing: false };
  }
}

export class CopyrightGuard {
  /**
   * Verpflichtende Schutzklausel zur Verstärkung des Generierungs-Prompts.
   */
  public static readonly MANDATORY_PROMPT_CLAUSE = `\n### [CMIE COPYRIGHT & PLAGIATSSCHUTZ-PFLICHT]:\nFormuliere alle Fakten und Konzepte vollständig in eigenen Worten. Übernimm niemals Satzstrukturen oder charakteristische Formulierungen aus bekannten Quellen zu diesem Thema. Wörtliche Zitate von mehr als 10 aufeinanderfolgenden Wörtern sind strengstens untersagt!\n`;

  /**
   * Prüft vor dem Speichern, ob ein zusammenhängender Textabschnitt > maxWords exakt einer bekannten Quelle entspricht.
   * Bei Verstoß: Harte Sicherheitsgrenze -> Status 'review_needed'.
   */
  public static async inspectChapter(
    chapterText: string,
    checker: PlagiarismCheckerInterface,
    maxWords: number = 15
  ): Promise<{ passed: boolean; statusOverride?: 'review_needed'; warningMessage?: string }> {
    const result = await checker.checkExactMatch(chapterText, maxWords);
    if (result.isInfringing) {
      return {
        passed: false,
        statusOverride: 'review_needed',
        warningMessage: `URHEBERRECHTS-WARNUNG (CMIE CopyrightGuard): Ein zusammenhängender Textblock entspricht über ${maxWords} Wörter exakt einer bekannten Quelle ("...${result.matchedSnippet}..."). Veröffentlichung blockiert – Status auf 'review_needed' gesetzt!`
      };
    }
    return { passed: true };
  }
}
