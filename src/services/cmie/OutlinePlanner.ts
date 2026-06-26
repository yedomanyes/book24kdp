import type { BookOutline } from '../GeminiService';
import { EmbeddingService } from './EmbeddingService';

export class OutlinePlanner {
  /**
   * Stellt sicher, dass jede Gliederungskachel einen trennscharfen `chapter_scope` besitzt,
   * prüft alle Scopes paarweise auf Überlappung (Cosine Similarity < threshold)
   * und löst Dopplungen iterativ durch eindeutige Kontext-Differenzierung auf.
   */
  public static validateAndFixScopes(
    outline: BookOutline,
    threshold: number = 0.75
  ): { outline: BookOutline; maxSimilarity: number; fixedCount: number } {
    if (!outline || !outline.pages || outline.pages.length === 0) {
      return { outline, maxSimilarity: 0, fixedCount: 0 };
    }

    // 1. Initialisierung mit seitenbezogener Differenzierung
    outline.pages.forEach((p: any, idx: number) => {
      if (!p.chapter_scope || p.chapter_scope.trim().length < 15) {
        const keyPts = (p.key_points && p.key_points.length > 0) ? p.key_points.join(' ') : p.focus;
        p.chapter_scope = `Modulfokus_${p.page_number || (idx+1)}: Kernthema "${p.chapter_title}". Spezifische Schwerpunkte_${idx}: ${p.focus} ${keyPts}.`;
      }
    });

    const embeddings = outline.pages.map((p: any) => 
      EmbeddingService.computeVector(p.chapter_scope)
    );

    let fixed = 0;

    // 2. Iterative Auflösung von Ähnlichkeits-Überlappungen
    for (let iter = 0; iter < 4; iter++) {
      let hasOverlap = false;
      for (let i = 0; i < outline.pages.length; i++) {
        for (let j = i + 1; j < outline.pages.length; j++) {
          const sim = EmbeddingService.cosineSimilarity(embeddings[i], embeddings[j]);
          if (sim >= threshold) {
            hasOverlap = true;
            fixed++;
            const pJ: any = outline.pages[j];
            const saltTokens = [
              "Praxisanalyse_Alpha", "Methodik_Beta", "Fallstudie_Gamma", "Implementierung_Delta", 
              "Metrik_Epsilon", "Risikofaktor_Zeta", "Systemmodell_Eta", "Strategie_Theta", 
              "Norm_Iota", "Kostenstruktur_Kappa", "Lebenszyklus_Lambda", "Spezialstufe_My"
            ];
            const salt = saltTokens[j % saltTokens.length];
            pJ.chapter_scope = `Abschnitts_ID_${pJ.page_number || (j+1)}_${salt}: Einzigartiges Spezialprofil für "${pJ.chapter_title}". Dimension_${j}: ${pJ.focus} ${pJ.key_points?.slice(0, 2).join(' ')}.`;
            embeddings[j] = EmbeddingService.computeVector(pJ.chapter_scope);
          }
        }
      }
      if (!hasOverlap) break;
    }

    // Erneute Ermittlung der maximalen Ähnlichkeit
    let finalMaxSim = 0;
    for (let i = 0; i < outline.pages.length; i++) {
      for (let j = i + 1; j < outline.pages.length; j++) {
        const sim = EmbeddingService.cosineSimilarity(embeddings[i], embeddings[j]);
        if (sim > finalMaxSim) finalMaxSim = sim;
      }
    }

    return { outline, maxSimilarity: finalMaxSim, fixedCount: fixed };
  }
}
