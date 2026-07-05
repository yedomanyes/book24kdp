export interface BookOutlinePage {
  page_number: number;
  chapter_title: string;
  chapter_number?: number;
  focus: string;
  key_points: string[];
}

export interface BookOutline {
  title: string;
  subtitle: string;
  language: string;
  target_pages: number;
  pages: BookOutlinePage[];
}

import { LayoutFixDB } from './brain/LayoutFixDB';

export class GeminiService {
  private groqKeys: string[] = [];
  private geminiKeys: string[] = [];
  private deepseekKeys: string[] = [];
  private model: string;
  private static keyBlacklist: { [key: string]: number } = {};

  private static blacklistKey(key: string, durationMs: number = 300000) {
    this.keyBlacklist[key] = Date.now() + durationMs;
    console.warn(`API Key blacklisted für ${durationMs / 1000}s`);
  }

  private static isKeyBlacklisted(key: string): boolean {
    const expires = this.keyBlacklist[key];
    if (!expires) return false;
    if (Date.now() > expires) {
      delete this.keyBlacklist[key];
      return false;
    }
    return true;
  }

  constructor(
    apiKeys: string | { groq?: string[]; gemini?: string[]; deepseek?: string[] } | string[],
    model: string = 'llama-3.3-70b-versatile'
  ) {
    this.model = model;
    if (typeof apiKeys === 'string') {
      const cleanKey = apiKeys.trim();
      if (cleanKey.startsWith('gsk_')) {
        this.groqKeys = [cleanKey];
      } else if (cleanKey) {
        this.geminiKeys = [cleanKey];
      }
    } else if (Array.isArray(apiKeys)) {
      this.groqKeys = apiKeys.filter(Boolean);
    } else if (apiKeys && typeof apiKeys === 'object') {
      this.groqKeys = (apiKeys.groq || []).filter(Boolean);
      this.geminiKeys = (apiKeys.gemini || []).filter(Boolean);
      this.deepseekKeys = (apiKeys.deepseek || []).filter(Boolean);
    }
  }

  private getProvider(): 'groq' | 'gemini' | 'deepseek' {
    if (this.model.startsWith('gemini-')) {
      return 'gemini';
    } else if (this.model.startsWith('deepseek-')) {
      return 'deepseek';
    }
    return 'groq';
  }

  private normalizeOutlinePages(
    pages: BookOutlinePage[],
    expectedCount: number,
    startPageNum: number = 1,
    language: string = 'de'
  ): BookOutlinePage[] {
    const normalized = [...pages];
    normalized.forEach((p, idx) => {
      p.page_number = startPageNum + idx;
    });

    const isDe = language === 'de';

    while (normalized.length < expectedCount) {
      const lastPage = normalized[normalized.length - 1];
      const lastChapterTitle = lastPage ? lastPage.chapter_title : (isDe ? "Einleitung" : "Introduction");
      const pageIndexInChapter = normalized.filter(p => p.chapter_title === lastChapterTitle).length + 1;
      
      const focusTemplates = isDe ? [
        `Detaillierte Vertiefung und Analyse des Themas: "${lastChapterTitle}" (Aspekt ${pageIndexInChapter})`,
        `Praktische Beispiele, Anwendungsfälle und Vergleiche zu: "${lastChapterTitle}"`,
        `Wichtige Kernaspekte, Hintergrundwissen und theoretische Grundlagen zu: "${lastChapterTitle}"`,
        `Häufige Missverständnisse, Fallstricke und Lösungsansätze bezüglich: "${lastChapterTitle}"`,
        `Schritt-für-Schritt-Anleitung, konkrete Übungen und Checklisten für den Leser im Bereich: "${lastChapterTitle}"`
      ] : [
        `Detailed exploration and analysis of the topic: "${lastChapterTitle}" (Aspect ${pageIndexInChapter})`,
        `Practical examples, use cases, and comparisons regarding: "${lastChapterTitle}"`,
        `Key core concepts, background knowledge, and theoretical foundations of: "${lastChapterTitle}"`,
        `Common misconceptions, pitfalls, and solutions regarding: "${lastChapterTitle}"`,
        `Step-by-step instructions, concrete exercises, and checklists for the reader in the area of: "${lastChapterTitle}"`
      ];
      
      const templateIdx = normalized.length % focusTemplates.length;
      
      normalized.push({
        page_number: startPageNum + normalized.length,
        chapter_title: lastChapterTitle,
        focus: focusTemplates[templateIdx],
        key_points: isDe ? [
          `Vertiefung von ${lastChapterTitle} (Teil ${pageIndexInChapter})`,
          `Praktische Relevanz und konkrete Erklärungen`,
          `Tipps zur direkten Umsetzung für den Leser`
        ] : [
          `Exploration of ${lastChapterTitle} (Part ${pageIndexInChapter})`,
          `Practical relevance and concrete explanations`,
          `Tips for direct implementation by the reader`
        ]
      });
    }

    if (normalized.length > expectedCount) {
      normalized.splice(expectedCount);
    }

    return normalized;
  }

  public ensureUniqueAndContiguousChapters(
    pages: BookOutlinePage[],
    language: string
  ): BookOutlinePage[] {
    if (pages.length === 0) return pages;

    const isDe = language === 'de';
    
    // Step 1: Detect all chapter segments as they appear sequentially
    const segments: { title: string; pages: BookOutlinePage[] }[] = [];
    let currentSegment: { title: string; pages: BookOutlinePage[] } | null = null;

    for (const p of pages) {
      const title = (p.chapter_title || '').trim();
      if (!currentSegment || currentSegment.title !== title) {
        currentSegment = { title, pages: [] };
        segments.push(currentSegment);
      }
      currentSegment.pages.push(p);
    }

    // Step 2: Consolidate contiguous segments with the same title
    const consolidatedSegments: { title: string; pages: BookOutlinePage[] }[] = [];
    
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      
      if (consolidatedSegments.length === 0) {
        consolidatedSegments.push(seg);
        continue;
      }
      
      const lastSeg = consolidatedSegments[consolidatedSegments.length - 1];
      
      if (seg.title.trim().toLowerCase() === lastSeg.title.trim().toLowerCase()) {
        lastSeg.pages.push(...seg.pages);
        seg.pages.forEach(p => {
          p.chapter_title = lastSeg.title;
        });
      } else {
        consolidatedSegments.push(seg);
      }
    }

    // Step 2b: Merge segments that are too short to enforce target chapter length (3 to 20 pages per chapter)
    const totalPages = pages.length;
    let minPages = 3;
    if (totalPages >= 150) minPages = 12;
    else if (totalPages >= 100) minPages = 8;
    else if (totalPages >= 50) minPages = 5;

    let mergedSegments = [...consolidatedSegments];
    let hasShortSegments = true;

    while (hasShortSegments && mergedSegments.length > 1) {
      hasShortSegments = false;
      for (let i = 0; i < mergedSegments.length; i++) {
        if (mergedSegments[i].pages.length < minPages) {
          hasShortSegments = true;
          let mergeWithIndex = -1;
          if (i === 0) {
            mergeWithIndex = 1;
          } else if (i === mergedSegments.length - 1) {
            mergeWithIndex = i - 1;
          } else {
            const leftLen = mergedSegments[i - 1].pages.length;
            const rightLen = mergedSegments[i + 1].pages.length;
            mergeWithIndex = leftLen < rightLen ? i - 1 : i + 1;
          }

          const currentSeg = mergedSegments[i];
          const targetSeg = mergedSegments[mergeWithIndex];

          const t1 = currentSeg.title.trim();
          const t2 = targetSeg.title.trim();
          let mergedTitle = t1;
          if (t1 !== t2) {
            if (t1.toLowerCase().includes(t2.toLowerCase())) {
              mergedTitle = t1;
            } else if (t2.toLowerCase().includes(t1.toLowerCase())) {
              mergedTitle = t2;
            } else if (t1.length + t2.length < 45) {
              mergedTitle = i < mergeWithIndex ? `${t1} & ${t2}` : `${t2} & ${t1}`;
            } else {
              mergedTitle = currentSeg.pages.length > targetSeg.pages.length ? t1 : t2;
            }
          }

          const combinedPages = i < mergeWithIndex 
            ? [...currentSeg.pages, ...targetSeg.pages]
            : [...targetSeg.pages, ...currentSeg.pages];
          
          combinedPages.forEach(p => {
            p.chapter_title = mergedTitle;
          });

          targetSeg.title = mergedTitle;
          targetSeg.pages = combinedPages;
          mergedSegments.splice(i, 1);
          break;
        }
      }
    }

    // Step 3: Ensure all remaining chapter titles are completely unique.
    // If a chapter title appears multiple times non-contiguously, we append " - Teil II", " - Teil III", etc.
    const titleCounts: { [title: string]: number } = {};
    
    for (const seg of mergedSegments) {
      const baseTitle = seg.title;
      const normalizedBase = baseTitle.toLowerCase().trim();
      if (!titleCounts[normalizedBase]) {
        titleCounts[normalizedBase] = 1;
      } else {
        titleCounts[normalizedBase]++;
        const suffix = isDe ? ` - Teil ${titleCounts[normalizedBase]}` : ` - Part ${titleCounts[normalizedBase]}`;
        const newTitle = baseTitle + suffix;
        seg.title = newTitle;
        for (const p of seg.pages) {
          p.chapter_title = newTitle;
        }
      }
    }

    // Step 4: Re-flatten pages list in correct page order
    const flattened: BookOutlinePage[] = [];
    for (const seg of mergedSegments) {
      flattened.push(...seg.pages);
    }
    
    flattened.forEach((p, idx) => {
      p.page_number = idx + 1;
    });

    return flattened;
  }

  /**
   * Post-processes an outline to ensure that no two pages within the same chapter
   * have identical or near-identical focus descriptions.
   */
  private diversifyPageFocus(
    pages: BookOutlinePage[],
    language: string
  ): BookOutlinePage[] {
    const isDe = language === 'de';

    const perspectivesEn = [
      'Opening perspective & core concept',
      'Deep-dive analysis & mechanisms',
      'Practical application & real-world examples',
      'Common pitfalls, myths & misconceptions',
      'Step-by-step guide & actionable exercises',
      'Psychological & emotional dimension',
      'Scientific background & evidence',
      'Case study & personal story angle',
      'Comparison & contrast with related topics',
      'Long-term impact & advanced integration'
    ];
    const perspectivesDe = [
      'Einführung & Kernkonzept',
      'Tiefenanalyse & Mechanismen',
      'Praktische Anwendung & Alltagsbeispiele',
      'Häufige Fehler, Mythen & Missverständnisse',
      'Schritt-für-Schritt-Anleitung & Übungen',
      'Psychologische & emotionale Dimension',
      'Wissenschaftlicher Hintergrund & Belege',
      'Fallbeispiel & persönliche Erfahrung',
      'Vergleich & Abgrenzung zu verwandten Themen',
      'Langfristige Wirkung & Vertiefung'
    ];
    const perspectives = isDe ? perspectivesDe : perspectivesEn;

    // Group pages by chapter title to process each chapter independently
    const chapterGroups: Map<string, BookOutlinePage[]> = new Map();
    for (const p of pages) {
      const key = p.chapter_title.trim().toLowerCase();
      if (!chapterGroups.has(key)) chapterGroups.set(key, []);
      chapterGroups.get(key)!.push(p);
    }

    const result = [...pages];

    for (const [, groupPages] of chapterGroups) {
      if (groupPages.length <= 1) continue;

      const seenFocuses: string[] = [];
      for (let i = 0; i < groupPages.length; i++) {
        const page = groupPages[i];
        const normalizedFocus = page.focus.trim().toLowerCase();

        // Check if this focus is too similar to any previously seen one in this chapter
        const isDuplicate = seenFocuses.some(seen => {
          if (seen === normalizedFocus) return true;
          // Rough similarity: more than 60% of significant words overlap
          const wordsA = new Set(seen.split(/\s+/).filter(w => w.length > 4));
          const wordsB = normalizedFocus.split(/\s+/).filter(w => w.length > 4);
          if (wordsA.size === 0 || wordsB.length === 0) return false;
          const overlap = wordsB.filter(w => wordsA.has(w)).length;
          return overlap / Math.max(wordsA.size, wordsB.length) > 0.6;
        });

        if (isDuplicate) {
          const perspIdx = i % perspectives.length;
          const chapterTitle = page.chapter_title;
          const newFocus = isDe
            ? `${perspectives[perspIdx]}: Vertiefung von „${chapterTitle}" – Seite ${i + 1}`
            : `${perspectives[perspIdx]}: deeper dive into "${chapterTitle}" – page ${i + 1}`;
          const originalIdx = result.findIndex(p => p.page_number === page.page_number);
          if (originalIdx !== -1) {
            result[originalIdx] = { ...result[originalIdx], focus: newFocus };
          }
          seenFocuses.push(newFocus.toLowerCase());
        } else {
          seenFocuses.push(normalizedFocus);
        }
      }
    }

    return result;
  }

  private async executeWithKeyRotation(
    provider: 'groq' | 'gemini' | 'deepseek',
    requestFn: (key: string) => Promise<Response>,
    timeoutMs: number = 25000
  ): Promise<any> {
    const keys = provider === 'groq' ? this.groqKeys : provider === 'deepseek' ? this.deepseekKeys : this.geminiKeys;
    if (keys.length === 0) {
      throw new Error(`Keine API-Schlüssel für ${provider.toUpperCase()} konfiguriert.`);
    }

    let lastError: any = null;
    const maxGlobalCycles = 6;

    for (let cycle = 0; cycle < maxGlobalCycles; cycle++) {
      // Filter out blacklisted keys dynamically at the beginning of each cycle
      let keysToTry = keys.filter(k => !GeminiService.isKeyBlacklisted(k));
      if (keysToTry.length === 0) {
        console.warn(`Alle ${provider.toUpperCase()}-Keys sind geblacklistet. Hebe Blacklist temporär auf.`);
        keysToTry = keys;
      }

      for (let i = 0; i < keysToTry.length; i++) {
        const key = keysToTry[i];
        const keyIndexInOriginal = keys.indexOf(key);
        try {
          let timeoutId: any;
          const response = await Promise.race([
            requestFn(key),
            new Promise<never>((_, reject) => {
              timeoutId = setTimeout(() => reject(new Error(`Timeout: API-Anfrage hat länger als ${timeoutMs / 1000} Sekunden gedauert.`)), timeoutMs);
            })
          ]).finally(() => {
            if (timeoutId) clearTimeout(timeoutId);
          });
          
          if (response.status === 413) {
            const errText = await response.text();
            let errorMessage = errText;
            try {
              const parsed = JSON.parse(errText);
              errorMessage = parsed.error?.message || errText;
            } catch (e) {}
            
            // Do NOT rotate keys or wait for 413 (Payload too large). Just throw immediately so the fallback logic can kick in.
            throw new Error(`Key #${keyIndexInOriginal + 1} Fehler (${response.status}): ${errorMessage}`);
          }

          if (response.status === 429 || response.status === 401 || response.status === 403) {
            const errText = await response.text();
            let errorMessage = errText;
            try {
              const parsed = JSON.parse(errText);
              errorMessage = parsed.error?.message || errText;
            } catch (e) {}

            console.warn(`${provider.toUpperCase()} Key #${keyIndexInOriginal + 1} fehlgeschlagen mit Status ${response.status}. Blackliste Key...`);
            GeminiService.blacklistKey(key, 300000); // Blacklist for 5 minutes

            lastError = new Error(`Key #${keyIndexInOriginal + 1} Fehler (${response.status}): ${errorMessage}`);
            continue; // Go to next key immediately!
          }

          if (!response.ok) {
            const errText = await response.text();
            let errorMessage = errText;
            try {
              const parsed = JSON.parse(errText);
              errorMessage = parsed.error?.message || errText;
            } catch (e) {}

            console.warn(`${provider.toUpperCase()} Key #${keyIndexInOriginal + 1} fehlgeschlagen mit Status ${response.status}: ${errorMessage}. Probiere nächsten Key...`);
            lastError = new Error(`Key #${keyIndexInOriginal + 1} Fehler (${response.status}): ${errorMessage}`);
            continue; // Go to next key immediately!
          }

          const data = await response.json();
          return data; // Success!
        } catch (err: any) {
          console.error(`${provider.toUpperCase()} Key #${keyIndexInOriginal + 1} Exception:`, err);
          lastError = err;
          continue; // Go to next key immediately!
        }
      }
      
      // If we cycled through all keys and still failed, wait before next cycle
      if (cycle < maxGlobalCycles - 1) {
        console.log(`${provider.toUpperCase()}: Alle verfügbaren Keys fehlgeschlagen in Zyklus ${cycle + 1}. Warte kurz...`);
        const waitTime = provider === 'groq' ? 15000 : provider === 'deepseek' ? 8000 : 4000;
        await new Promise(r => setTimeout(r, waitTime));
      }
    }

    throw new Error(`Alle verfügbaren ${provider.toUpperCase()}-Schlüssel sind fehlgeschlagen. Letzter Fehler: ${lastError?.message || lastError}`);
  }

  async generateOutline(
    title: string,
    subtitle: string,
    idea: string,
    language: string,
    targetPages: number,
    customGuidelines: string = '',
    onProgress?: (progress: number, message: string) => void,
    onChunkComplete?: (partialPages: BookOutlinePage[]) => void
  ): Promise<BookOutline> {
    const isGroq = this.getProvider() === 'groq';
    let safeIdea = idea || '';
    let safeGuidelines = customGuidelines || '';
    
    // Hard-cap user inputs for Groq's small 6000 TPM limit to prevent crashes
    if (isGroq) {
      if (safeIdea.length > 3000) safeIdea = safeIdea.substring(0, 3000) + '... (Gekürzt aus Kapazitätsgründen)';
      if (safeGuidelines.length > 4500) safeGuidelines = safeGuidelines.substring(0, 4500) + '... (Gekürzt aus Kapazitätsgründen)';
    }

    let prompt = `Du bist ein professioneller Buch-Redakteur. Erstelle ein detailliertes Inhaltsverzeichnis und eine Seiten-Planung für ein neues Buch.
Buchtitel: "${title}"
Untertitel: "${subtitle}"
${safeIdea && safeIdea.trim() ? `Hauptidee/Beschreibung: "${safeIdea}"` : `Hinweis: Es wurde keine Hauptidee eingegeben. Leite das Thema, das Genre und die Gliederung des Buches eigenständig und kreativ aus dem Titel und Untertitel ab. Strebe dabei das bestmögliche, professionellste und spannendste Ergebnis an.`}
Sprache des Buches: "${language === 'de' ? 'Deutsch' : 'ENGLISH (CRITICAL: All generated output MUST be completely in English, including chapter titles and key points!)'}"
Ziel-Seitenzahl: ${targetPages} (Das generierte JSON MUSS exakt ${targetPages} Seiten in der Liste haben, durchnummeriert von 1 bis ${targetPages}).`;

    if (safeGuidelines && safeGuidelines.trim()) {
      prompt += `\n\nFolgende Autoren-Richtlinien und Stil-Vorgaben müssen beim Entwurf der Gliederung und der einzelnen Seiten-Fokuspunkte strikt berücksichtigt werden:\n"${safeGuidelines}"`;
    }

    prompt += `\n\nFür jede einzelne Seite des Buches (von Seite 1 bis Seite ${targetPages}) musst du festlegen, worum es auf dieser Seite geht.

KRITISCHSTE REGEL – SEITEN-FOKUS & UNTERSCHIEDLICHE INHALTE (NIEMALS IGNORIEREN):
Jede einzelne Buchseite MUSS einen vollkommen eigenständigen, glasklaren und unverwechselbaren Fokus ("focus") haben. 
- Wenn mehrere Seiten zum selben Kapitel gehören, ist es STRENGSTENS VERBOTEN, ähnliche oder redundante Schwerpunkte zu setzen.
- Jede Seite muss das Thema progressiv vorantreiben (z.B. Seite 3: 'Psychologischer Auslöser des Verhaltens', Seite 4: 'Erste SOS-Schritte im Alltag', Seite 5: 'Ein konkretes Praxisbeispiel aus der Wirtschaft').
- Es darf unter keinen Umständen im gesamten Buch eine Dopplung von Fokus-Ideen geben. Jede Seite muss neuen Nutzwert oder eine neue Perspektive bieten.

KAPITELLÄNGE – WIE EIN ECHTES BUCH (3 BIS 20 SEITEN PRO KAPITEL):
Ein Kapitel ist ein umfassender Buchabschnitt und geht über mehrere Seiten. Daher MUSS ein Kapitel typischerweise 3 bis 20 Seiten lang sein!
- Mehrere aufeinanderfolgende Seiten (z. B. Seiten 1 bis 10) MÜSSEN exakt denselben Wert im Feld "chapter_title" haben.
- Plane das Buch so, dass es bei z. B. 100 Seiten insgesamt nur ca. 6 bis 10 Kapitel gibt, damit das Inhaltsverzeichnis sauber auf genau 1 Seite passt.
- Erhöhe die Kapitelüberschrift erst, wenn das Thema des vorherigen Kapitels nach mehreren Seiten wirklich komplett abgeschlossen ist.

ANLEITUNG für einzigartige Seiten-Fokuspunkte innerhalb eines Kapitels:
Pro Seite wähle einen anderen Blickwinkel aus dieser Pool (nur was zum Thema PASST und wirklich sinnvoll ist):
Einführung & Kernfrage • Mechanismen & Hintergründe • Praxisbeispiele & Anwendung • Häufige Fehler & Mythen • Schritt-für-Schritt • Psychologie & Emotion • Wissenschaft & Belege • Fallstudie & Erfahrung • Vergleich & Abgrenzung • Langzeitwirkung & Fazit
Wähle NUR die Blickwinkel, die für das konkrete Kapitelthema relevant und sinnvoll sind!

Um einen tiefgehenden Inhalt zu garantieren, plane pro Seite detaillierte stichpunktartige Key Points (in "key_points"), die genau beschreiben, welche Argumente oder Szenen ausgeführt werden sollen.

STRIKTE REGEL FÜR DIE KAPITELTITEL (chapter_title):
- Keine zwei Kapitelüberschriften dürfen dieselbe Satzstruktur verwenden.
- Es ist streng verboten, mehr als 2x im gesamten Buch mit Phrasen wie "Die Rolle von...", "Die Bedeutung von..." oder "Die Bedeutung von... bei..." zu beginnen.
- Du MUSS eine große sprachliche Vielfalt anwenden und bewusst zwischen folgenden Titel-Typen variieren (jeder Typ muss mindestens einmal vorkommen, aber kein Typ mehr als 3x):
  * Direkte Aussage (z. B. "Warum dieses Phänomen unser Leben beeinflusst")
  * Frage (z. B. "Was passiert, wenn der Auslöser verschwindet?")
  * Prozess/Schritt (z. B. "Der erste Tag der Umstellung")
  * Kontrast (z. B. "Kontrolle vs. Kontrollverlust")
  * Praktisch/Anleitung (z. B. "Drei Wege aus der Krise")
  * Persönlich/Fallbezogen (z. B. "Wenn das Umfeld es zuerst merkt")
Prüfe vor dem Generieren: Gibt es zwei Titel, die mit denselben ersten 3 Wörtern beginnen oder dieselbe Struktur "X bei der Y" wiederholen? Falls ja, formuliere sie um.

Antworte ausschließlich im JSON-Format mit folgender Struktur:
{
  "title": "${title}",
  "subtitle": "${subtitle}",
  "language": "${language}",
  "target_pages": ${targetPages},
  "pages": [
    {
      "page_number": 1,
      "chapter_title": "Kapitel-Überschrift (z.B. Einleitung)",
      "focus": "Der exakte, einzigartige Inhaltsschwerpunkt NUR DIESER Seite (darf kein anderes \"focus\"-Feld wiederholen!)",
      "key_points": ["Wichtiger Punkt 1", "Wichtiger Punkt 2", "Wichtiger Punkt 3"]
    },
    ...
  ]
}
Stelle sicher, dass die "pages"-Liste EXAKT ${targetPages} Einträge enthält!`;

    const provider = this.getProvider();
    let data: any;

    if (provider === 'groq' || provider === 'deepseek') {
      const apiUrl = provider === 'groq' 
        ? 'https://api.groq.com/openai/v1/chat/completions' 
        : 'https://api.deepseek.com/chat/completions';
        
      const CHUNK_SIZE = provider === 'groq' ? 10 : 25;
      const allPages: BookOutlinePage[] = [];

      for (let start = 1; start <= targetPages; start += CHUNK_SIZE) {
        const end = Math.min(start + CHUNK_SIZE - 1, targetPages);
        const chunkSize = end - start + 1;

        if (onProgress) {
          const progressPercent = Math.round(((start - 1) / targetPages) * 100);
          onProgress(progressPercent, `Generiere Seiten ${start} bis ${end} von ${targetPages}...`);
        }

        let previousPagesContext = '';
        if (allPages.length > 0) {
          const uniqueChapters = Array.from(new Set(allPages.map(p => p.chapter_title)));
          const lastPages = allPages.slice(-15);
          const lastChapter = allPages[allPages.length - 1].chapter_title;
          
          previousPagesContext = `\n\nBisherige Kapitelstruktur (bereits erstellt):\n` +
            uniqueChapters.map(ch => `- ${ch}`).join('\n') +
            `\n\nDetails der letzten geplanten Seiten:\n` +
            lastPages.map(p => `- Seite ${p.page_number}: Kapitel "${p.chapter_title}" - Fokus: "${p.focus}"`).join('\n') +
            `\n\nSETZE DIESE PLANUNG NAHTLOS FORT. Plane jetzt NUR die Seiten ${start} bis ${end} (${chunkSize} Seiten). Du darfst und sollst das letzte Kapitel ("${lastChapter}") fortsetzen, wenn das Thema noch nicht abgeschlossen ist. Verwende bereits abgeschlossene Kapitelüberschriften oder Fokuspunkte der vorherigen Seiten nicht wieder.\n`;
        }

        const chunkPrompt = `Du bist ein professioneller Buch-Redakteur. Erstelle die Seiten-Planung für folgendes Buch.
Buchtitel: "${title}"
Untertitel: "${subtitle}"
Hauptidee/Beschreibung: "${safeIdea}"
Sprache des Buches: "${language === 'de' ? 'Deutsch' : 'ENGLISH (CRITICAL: All generated output MUST be completely in English, including chapter titles and key points!)'}"
Das Buch hat insgesamt ${targetPages} Seiten. Du planst jetzt NUR die Seiten ${start} bis ${end} (${chunkSize} Seiten).${previousPagesContext}
${safeGuidelines && safeGuidelines.trim() ? `\nAutoren-Richtlinien: "${safeGuidelines}"\n` : ''}
KRITISCHSTE REGEL – SEITEN-FOKUS & EIGENSTÄNDIGKEIT (ABSOLUTE PFLICHT):
Jede einzelne Seite MUSS einen absolut einzigartigen, trennscharfen und unverwechselbaren Fokus haben!
- Wenn mehrere Seiten zum selben Kapitel gehören, ist es STRENGSTENS VERBOTEN, ähnliche oder redundante Aspekte zu wiederholen.
- Es ist EBENFALLS STRENGSTENS VERBOTEN, dass zwei Seiten innerhalb dieser Planung denselben oder einen nahezu identischen Fokus haben.
- Jede Seite MUSS das Thema progressiv fortführen. Stelle sicher, dass KEIN "focus" und KEINE "key_points" einer anderen Seite exakt gleichen. Jede Dopplung im Buch ist verboten!

KAPITELLÄNGE (3 BIS 20 SEITEN PRO KAPITEL):
Ein Kapitel ist ein umfassender Buchabschnitt. Daher muss ein Kapitel typischerweise 8 bis 15 Seiten lang sein! Setze das aktuelle Kapitel über mehrere Seiten fort (auch über Chunk-Grenzen hinweg), bevor du ein neues beginnst, damit das Buch bei ${targetPages} Seiten insgesamt nur ca. 6 bis 10 Kapitel hat und das Inhaltsverzeichnis auf exakt eine Seite passt.

BLICKWINKEL-POOL (nur was zum Thema PASST):
Einführung & Kernfrage • Mechanismen & Hintergründe • Praxisbeispiele & Anwendung • Häufige Fehler & Mythen • Schritt-für-Schritt • Psychologie & Emotion • Wissenschaft & Belege • Fallstudie & Erfahrung • Vergleich & Abgrenzung • Langzeitwirkung & Fazit

STRIKTE REGEL FÜR DIE KAPITELTITEL (chapter_title):
- Keine zwei Kapitelüberschriften dürfen dieselbe Satzstruktur verwenden.
- Es ist streng verboten, mehr als 2x im gesamten Buch mit Phrasen wie "Die Rolle von...", "Die Bedeutung von..." oder "Die Bedeutung von... bei..." zu beginnen.
- Du MUSS eine große sprachliche Vielfalt anwenden und bewusst zwischen folgenden Titel-Typen variieren (jeder Typ muss mindestens einmal vorkommen, aber kein Typ mehr als 3x):
  * Direkte Aussage (z. B. "Warum dieses Phänomen unser Leben beeinflusst")
  * Frage (z. B. "Was passiert, wenn der Auslöser verschwindet?")
  * Prozess/Schritt (z. B. "Der erste Tag der Umstellung")
  * Kontrast (z. B. "Kontrolle vs. Kontrollverlust")
  * Praktisch/Anleitung (z. B. "Drei Wege aus der Krise")
  * Persönlich/Fallbezogen (z. B. "Wenn das Umfeld es zuerst merkt")
Prüfe vor dem Generieren: Gibt es zwei Titel, die mit denselben ersten 3 Wörtern beginnen oder dieselbe Struktur "X bei der Y" wiederholen? Falls ja, formuliere sie um.

Antworte ausschließlich im JSON-Format:
{
  "pages": [
    {
      "page_number": ${start},
      "chapter_title": "Kapitel-Überschrift",
      "focus": "Einzigartiger Inhaltsschwerpunkt NUR dieser Seite (nicht wiederholbar!)",
      "key_points": ["Punkt 1", "Punkt 2", "Punkt 3"]
    },
    ...
  ]
}
Die "pages"-Liste muss EXAKT ${chunkSize} Einträge enthalten, mit page_number von ${start} bis ${end}!`;

        let data: any;
        const tokenLimits = provider === 'groq' ? [1500, 1000, 800, 600] : [2048];
        
        for (let i = 0; i < tokenLimits.length; i++) {
          const tokens = tokenLimits[i];
          try {
            data = await this.executeWithKeyRotation(provider, (key) =>
              fetch(apiUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify({
                  model: this.model,
                  messages: [
                    { role: 'system', content: 'Du bist ein nützlicher Assistent, der ausschließlich im JSON-Format antwortet.' },
                    { role: 'user', content: chunkPrompt }
                  ],
                  ...(this.model !== 'deepseek-reasoner' ? { response_format: { type: 'json_object' } } : {}),
                  temperature: 0.3,
                  max_tokens: tokens
                })
              }),
              45000
            );
            break; // Success
          } catch (err: any) {
            if (i === tokenLimits.length - 1) {
              throw err;
            }
            console.warn(`Groq outline generation failed with max_tokens=${tokens}, retrying with ${tokenLimits[i + 1]}...`);
          }
        }

        const chunkText = data.choices[0].message.content;
        let chunkJson: any;
        try {
          chunkJson = JSON.parse(chunkText);
        } catch (e) {
          throw new Error(`Outline-Chunk ${start}-${end} konnte nicht als JSON geparst werden.`);
        }

        let chunkPages: BookOutlinePage[] = chunkJson.pages || [];
        if (chunkPages.length === 0) {
          throw new Error(`Outline-Chunk ${start}-${end} enthält keine Seiten.`);
        }
        
        chunkPages = this.normalizeOutlinePages(chunkPages, chunkSize, start, language);
        allPages.push(...chunkPages);
        if (onChunkComplete) {
          onChunkComplete([...allPages]);
        }

        // Small delay between chunks to avoid rate limiting
        if (end < targetPages) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      let finalGroqPages = this.ensureUniqueAndContiguousChapters(allPages, language);
      
      const uniqueChs = Array.from(new Set(finalGroqPages.map(p => p.chapter_title)));
      if (uniqueChs.length > 10) {
        if (onProgress) onProgress(95, 'Optimiere Inhaltsverzeichnis...');
        try {
          finalGroqPages = await this.condenseOutline(
            title,
            subtitle,
            idea,
            language,
            finalGroqPages,
            customGuidelines,
            {}
          );
        } catch (e) {
          console.warn('Auto-condense failed, using original outline:', e);
        }
      }

      finalGroqPages = this.diversifyPageFocus(finalGroqPages, language);
      return {
        title,
        subtitle,
        language,
        target_pages: targetPages,
        pages: finalGroqPages
      } as BookOutline;

    } else {
      // Gemini
      if (onProgress) onProgress(50, 'Generiere komplette Buchstruktur (Google Gemini)...');
      data = await this.executeWithKeyRotation('gemini', (key) =>
        fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${key}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }]
              }
            ],
            systemInstruction: {
              parts: [{ text: 'Du bist ein nützlicher Assistent, der ausschließlich im JSON-Format antwortet.' }]
            },
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.3
            }
          })
        }),
        90000
      );
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error(`Gemini hat keine Textantwort zurückgegeben (Sicherheitsblock oder leerer Inhalt).`);
      }
      let jsonText = data.candidates[0].content.parts[0].text.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
      }
      const parsed = JSON.parse(jsonText) as BookOutline;
      parsed.pages = this.normalizeOutlinePages(parsed.pages, targetPages, 1, language);
      parsed.pages = this.ensureUniqueAndContiguousChapters(parsed.pages, language);

      const uniqueChs = Array.from(new Set(parsed.pages.map(p => p.chapter_title)));
      if (uniqueChs.length > 10) {
        if (onProgress) onProgress(95, 'Optimiere Inhaltsverzeichnis...');
        try {
          parsed.pages = await this.condenseOutline(
            title,
            subtitle,
            idea,
            language,
            parsed.pages,
            customGuidelines,
            {}
          );
        } catch (e) {
          console.warn('Auto-condense failed, using original outline:', e);
        }
      }

      parsed.pages = this.diversifyPageFocus(parsed.pages, language);
      return parsed;
    }
  }

  // Public method to generate a specific range of outline pages (used for extending incomplete outlines)
  async generateOutlineChunk(
    title: string,
    subtitle: string,
    idea: string,
    language: string,
    totalPages: number,
    startPage: number,
    endPage: number,
    lastExistingPagesContext: string,
    customGuidelines: string = ''
  ): Promise<BookOutlinePage[]> {
    const chunkSize = endPage - startPage + 1;
    const chunkPrompt = `Du bist ein professioneller Buch-Redakteur. Ergänze die Seiten-Planung für folgendes Buch.
Buchtitel: "${title}"
Untertitel: "${subtitle || ''}"
Hauptidee: "${idea}"
Sprache: "${language === 'de' ? 'Deutsch' : 'ENGLISH (CRITICAL: ALL generated output MUST be completely in English!)'}"
Das Buch hat insgesamt ${totalPages} Seiten. Die Seiten 1 bis ${startPage - 1} wurden bereits geplant.

Die letzten bereits geplanten Seiten waren:
${lastExistingPagesContext}

SETZE NAHTLOS FORT. Plane jetzt NUR die Seiten ${startPage} bis ${endPage} (${chunkSize} Seiten).
KRITISCHSTE REGEL – SEITEN-FOKUS & EIGENSTÄNDIGKEIT (ABSOLUTE PFLICHT):
Jede einzelne Seite MUSS einen absolut einzigartigen, neuen und unverwechselbaren Fokus haben!
- Es ist STRENGSTENS VERBOTEN, Themen, Aspekte oder Fokus-Ideen der bereits geplanten Seiten (Seiten 1 bis ${startPage - 1}) zu wiederholen oder zu doppeln.
- Es ist EBENFALLS STRENGSTENS VERBOTEN, dass zwei oder mehr Seiten innerhalb deiner neuen Planung denselben oder einen nahezu identischen Fokus haben.
- Jede Seite MUSS die Argumentation progressiv weitertreiben. Stelle sicher, dass KEIN "focus" und KEINE "key_points" einer anderen Seite exakt gleichen.
${customGuidelines ? `\nRichtlinien: "${customGuidelines}"\n` : ''}
KAPITELLÄNGE – WIE EIN ECHTES BUCH (3 BIS 20 SEITEN PRO KAPITEL):
Ein Kapitel geht über mehrere Seiten (typischerweise 3 bis 20 Seiten). 
- Mehrere aufeinanderfolgende Seiten MÜSSEN exakt denselben Wert im Feld "chapter_title" haben.
- Wenn das letzte Kapitel auf Seite ${startPage - 1} (in dem Kontext oben) noch nicht abgeschlossen ist, führe es nahtlos fort, indem du denselben "chapter_title" für die ersten Seiten deiner neuen Planung verwendest.
- Erhöhe die Kapitelüberschrift erst, wenn das Thema des vorherigen Kapitels nach mehreren Seiten wirklich komplett abgeschlossen ist.

STRIKTE REGEL FÜR DIE KAPITELTITEL (chapter_title):
- Keine zwei Kapitelüberschriften dürfen dieselbe Satzstruktur verwenden.
- Es ist streng verboten, mehr als 2x im gesamten Buch mit Phrasen wie "Die Rolle von...", "Die Bedeutung von..." oder "Die Bedeutung von... bei..." zu beginnen.
- Du MUSS eine große sprachliche Vielfalt anwenden und bewusst zwischen folgenden Titel-Typen variieren (jeder Typ muss mindestens einmal vorkommen, aber kein Typ mehr als 3x):
  * Direkte Aussage (z. B. "Warum dieses Phänomen unser Leben beeinflusst")
  * Frage (z. B. "Was passiert, wenn der Auslöser verschwindet?")
  * Prozess/Schritt (z. B. "Der erste Tag der Umstellung")
  * Kontrast (z. B. "Kontrolle vs. Kontrollverlust")
  * Praktisch/Anleitung (z. B. "Drei Wege aus der Krise")
  * Persönlich/Fallbezogen (z. B. "Wenn das Umfeld es zuerst merkt")
Prüfe vor dem Generieren: Gibt es zwei Titel, die mit denselben ersten 3 Wörtern beginnen oder dieselbe Struktur "X bei der Y" wiederholen? Falls ja, formuliere sie um.

Antworte ausschließlich im JSON-Format:
{
  "pages": [
    {
      "page_number": ${startPage},
      "chapter_title": "Kapitel-Überschrift",
      "focus": "Inhaltsschwerpunkt dieser Seite",
      "key_points": ["Punkt 1", "Punkt 2", "Punkt 3"]
    }
  ]
}
Die "pages"-Liste muss EXAKT ${chunkSize} Einträge enthalten, mit page_number von ${startPage} bis ${endPage}!`;

    const provider = this.getProvider();

    if (provider === 'groq' || provider === 'deepseek') {
      const apiUrl = provider === 'groq' 
        ? 'https://api.groq.com/openai/v1/chat/completions' 
        : 'https://api.deepseek.com/chat/completions';
        
      const data = await this.executeWithKeyRotation(provider, (key) =>
        fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
          body: JSON.stringify({
            model: this.model,
            messages: [
              { role: 'system', content: 'Du bist ein nützlicher Assistent, der ausschließlich im JSON-Format antwortet.' },
              { role: 'user', content: chunkPrompt }
            ],
            ...(this.model !== 'deepseek-reasoner' ? { response_format: { type: 'json_object' } } : {}),
            temperature: 0.7,
            max_tokens: provider === 'groq' ? 1500 : 2500
          })
        }),
        45000
      );
      const parsed = JSON.parse(data.choices[0].message.content);
      return this.normalizeOutlinePages(parsed.pages || [], chunkSize, startPage, language);
    } else {
      const data = await this.executeWithKeyRotation('gemini', (key) =>
        fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: chunkPrompt }] }],
            systemInstruction: { parts: [{ text: 'Du bist ein nützlicher Assistent, der ausschließlich im JSON-Format antwortet.' }] },
            generationConfig: { responseMimeType: 'application/json', temperature: 0.3 }
          })
        }),
        45000
      );
      let jsonText = data.candidates[0].content.parts[0].text.trim();
      if (jsonText.startsWith('```')) jsonText = jsonText.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(jsonText);
      return this.normalizeOutlinePages(parsed.pages || [], chunkSize, startPage, language);
    }
  }

  getLastSentences(text: string, count: number): string {
    if (!text) return '';
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(Boolean);
    if (sentences.length <= count) return text;
    return sentences.slice(-count).join(' ');
  }

  getRecentPageOpeners(previousPagesText: { [key: number]: string }, pageNumber: number): string[] {
    const openers: string[] = [];
    const startPage = Math.max(1, pageNumber - 10);
    for (let i = startPage; i < pageNumber; i++) {
      const text = (previousPagesText[i] || '').trim();
      if (!text) continue;
      const firstLine = text.split('\n')[0].replace(/^[#*>_\s-]+/, '').trim();
      if (!firstLine) continue;
      const words = firstLine.split(/\s+/).slice(0, 4).join(' ');
      if (words && !openers.includes(words)) {
        openers.push(words);
      }
    }
    return openers;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // OPENING STYLES CATALOGUE
  // Each entry is used exactly once per book (round-robin) so every chapter
  // starts with a different rhetorical technique.
  // ─────────────────────────────────────────────────────────────────────────
  static readonly OPENING_STYLES: Array<{ id: string; name: string; description: string }> = [
    {
      id: 'anecdote',
      name: 'Mini-Anekdote',
      description: 'Starte mit einer kurzen, lebhaften Szene (2-3 Sätze): ein konkreter Moment, eine spezifische Person oder ein Erlebnis, das das Kapitelthema greifbar macht. Dann ein knapper Übergang zum Sachinhalt.'
    },
    {
      id: 'statistic',
      name: 'Überraschende Statistik',
      description: 'Beginne mit einer verblüffenden Zahl oder Forschungserkenntnis (die zum Thema passt), die den Leser aufhorchen lässt. Erkläre dann kurz, was diese Zahl bedeutet.'
    },
    {
      id: 'provocation',
      name: 'Provokative These',
      description: 'Eröffne mit einer bewusst zugespitzten, kontraintuitiven Aussage oder einem scheinbaren Widerspruch, der den Leser sofort zum Nachdenken bringt. Kein Fragezeichen – eine klare Behauptung.'
    },
    {
      id: 'contrast',
      name: 'Kontrast / Paradox',
      description: 'Stelle zwei scheinbar unvereinbare Fakten, Situationen oder Ideen nebeneinander, um eine Spannung zu erzeugen. Das Paradox zieht den Leser in das Thema hinein.'
    },
    {
      id: 'historical',
      name: 'Historischer Moment',
      description: 'Greife einen konkreten historischen Moment oder eine bekannte Person auf, der/die direkt mit dem Kapitelthema zusammenhängt. Datiere ihn präzise ("Im Herbst 1923...") für Authentizität.'
    },
    {
      id: 'metaphor',
      name: 'Erweiterte Metapher',
      description: 'Beginne mit einem starken, unerwarteten Vergleich oder einer Metapher, die das abstrakte Kernkonzept des Kapitels bildhaft erklärt. Führe die Metapher über 2-3 Sätze aus, bevor du zum Sachinhalt wechselst.'
    },
    {
      id: 'problem',
      name: 'Das dringende Problem',
      description: 'Schildere direkt ein konkretes, nachvollziehbares Problem oder eine Frustration, die der typische Leser kennt. Erzeuge emotionale Resonanz, bevor du die Lösung andeutest.'
    },
    {
      id: 'definition',
      name: 'Unerwartete Definition',
      description: 'Beginne damit, ein zentrales Wort oder Konzept völlig neu und überraschend zu definieren – nicht die Lexikon-Definition, sondern eine, die den Leser umdenken lässt.'
    },
    {
      id: 'question_chain',
      name: 'Fragenkette',
      description: 'Stelle 2-3 kurze, prägnante Fragen hintereinander, die alle auf die Kernfrage des Kapitels zulaufen. Dann eine kurze Antwort oder ein Versprechen: "Dieses Kapitel zeigt..."'
    },
    {
      id: 'dialogue',
      name: 'Fiktiver Dialog / Zitat',
      description: 'Starte mit einem einzeiligen Zitat einer realen oder fiktiven Person, das das Kapitelthema perfekt einfängt. Dann kommentiere oder hinterfrage das Zitat direkt.'
    },
  ];

  /**
   * Phase 1: Generate a unique opening paragraph for a chapter.
   * Picks the opening style by index (round-robin), avoiding styles already
   * used in this book session.
   */
  async generateChapterOpening(
    outline: BookOutline,
    chapterTitle: string,
    chapterNumber: number,
    chapterKeyPoints: string[],
    usedStyleIds: string[],
    previousOpenings: string[],
    _writingStyle: string,
    customGuidelines: string = ''

  ): Promise<{ opening: string; styleId: string }> {
    // Pick the next unused style (round-robin)
    const available = GeminiService.OPENING_STYLES.filter(s => !usedStyleIds.includes(s.id));
    const stylePool = available.length > 0 ? available : GeminiService.OPENING_STYLES;
    const style = stylePool[0]; // take the first available

    const lang = outline.language === 'de' ? 'Deutsch' : 'English';

    const previousList = previousOpenings.length > 0
      ? previousOpenings.map((o, i) => `Kapitel ${i + 1} Eröffnung:\n"${o.slice(0, 200)}..."`).join('\n\n')
      : 'Keine bisherigen Kapitelanfänge.';

    const systemPrompt = `[CACHE_CONTROL: EPHEMERAL_START]
Du bist ein professioneller Sachbuchautor. Schreibe ausschließlich auf ${lang}.
Du schreibst NUR den Eröffnungsabsatz (3-5 Sätze) für ein Kapitel.

PFLICHT-STILTECHNIK FÜR DIESEN ABSATZ: ${style.name}
(Beschreibung der Technik: ${style.description})
[CACHE_CONTROL: EPHEMERAL_END]

STRIKT VERBOTEN - vermeide jede strukturelle oder wörtliche Ähnlichkeit zu diesen bereits verwendeten Kapitelanfängen:
${previousList}

Das bedeutet konkret:
- Kein Anfang mit denselben ersten 3 Wörtern wie ein Eintrag oben
- Keine Wiederholung von Satzbaumustern (z.B. wenn oben mehrfach Fragen verwendet wurden, hier KEINE Frage, außer die Technik verlangt es explizit)
- Kein Rückgriff auf dieselben rhetorischen Einstiege ("Stell dir vor...", "Hast du dich jemals gefragt...", "In diesem Kapitel...")
- Kein Markdown (keine ** oder # oder >>)
- Keine Überschrift, kein Meta-Kommentar, keine Einleitung – starte direkt mit dem Absatz

Schreibe ausschließlich den Eröffnungsabsatz.${customGuidelines ? `\n\nAutoren-Stil-Richtlinien: "${customGuidelines}"` : ''}`;

    const userPrompt = `Buch: "${outline.title}" – ${outline.subtitle}
Kapitel ${chapterNumber}: "${chapterTitle}"
Kernpunkte dieses Kapitels: ${chapterKeyPoints.slice(0, 3).join(', ')}

Schreibe jetzt den Eröffnungsabsatz mit der Technik "${style.name}":`;

    const opening = await this.askAI(systemPrompt, userPrompt, false);
    return { opening: opening.trim(), styleId: style.id };
  }

  /**
   * Phase 2: Write the page continuation that follows a fixed opening.
   * The opening is already established – this generates the rest of the page.
   */
  async generatePageContinuation(
    outline: BookOutline,
    pageNumber: number,
    chapterTitle: string,
    chapterKeyPoints: string[],
    generatedOpening: string,
    previousPagesText: { [key: number]: string },
    writingStyle: string,
    pageSize: string = '6x9',
    fontSize: number = 11,
    customGuidelines: string = ''
  ): Promise<string> {
    if (writingStyle === 'Sachbuch / Theorien') {
      const isEn = outline.language !== 'de';
      const theoryRule = isEn
        ? "SPECIAL RULE FOR THIS STYLE ('Sachbuch / Theorien'): Write generally like a normal, well-founded non-fiction book about the facts. BUT occasionally (only sometimes, not always) sprinkle in your own or known theories, hypotheses, or speculations about the topic to make the text more interesting."
        : "SONDERREGEL FÜR DIESEN STIL ('Sachbuch / Theorien'): Schreibe generell wie ein normales, fundiertes Sachbuch über die Fakten. ABER streue teilweise (nur manchmal, nicht immer) eigene oder bekannte Theorien, Hypothesen oder Spekulationen zu dem Thema ein, um den Text interessanter zu gestalten.";
      customGuidelines = customGuidelines ? `${customGuidelines}\n\n${theoryRule}` : theoryRule;
    }

    const lang = outline.language === 'de' ? 'Deutsch (korrekte Rechtschreibung und Grammatik)' : 'ENGLISH (CRITICAL: YOU MUST WRITE THE ENTIRE TEXT IN ENGLISH ONLY!)';

    // Word budget: subtract opening length from page target
    let minWords = 160;
    let maxWords = 210;
    if (pageSize === '5x8') { minWords = fontSize >= 12 ? 130 : 155; maxWords = fontSize >= 12 ? 165 : 190; }
    else if (pageSize === '5.5x8.5') { minWords = fontSize >= 12 ? 160 : 195; maxWords = fontSize >= 12 ? 205 : 240; }
    else if (pageSize === '6x9') { minWords = fontSize >= 12 ? 200 : 245; maxWords = fontSize >= 12 ? 245 : 295; }
    else if (pageSize === '8.5x11') { minWords = fontSize >= 12 ? 390 : 460; maxWords = fontSize >= 12 ? 460 : 530; }
    else if (pageSize === 'a4') { minWords = fontSize >= 12 ? 400 : 480; maxWords = fontSize >= 12 ? 480 : 560; }
    else if (pageSize === 'custom') { minWords = fontSize >= 12 ? 170 : 210; maxWords = fontSize >= 12 ? 210 : 260; }

    // Deduct opening word count from budget
    const openingWordCount = generatedOpening.split(/\s+/).length;
    const continuationMin = Math.max(60, minWords - openingWordCount - 10);
    const continuationMax = Math.max(100, maxWords - openingWordCount);

    let contextPrompt = '';
    if (pageNumber > 1) {
      const prevText = previousPagesText[pageNumber - 1] || '';
      const lastSentences = this.getLastSentences(prevText, 2);
      contextPrompt = `\nLetzter Satz der vorherigen Seite: "${lastSentences}"`;
    }

    const layoutWarnings = LayoutFixDB.getWarningsForPrompt(pageSize, 'chapter_page');
    if (layoutWarnings.length > 0) {
      contextPrompt += `\n\n[WICHTIGES LAYOUT-FEEDBACK (Aus vergangenen Fehlern gelernt)]:\n${layoutWarnings.join('\n')}\n`;
    }

    const systemPrompt = `[CACHE_CONTROL: EPHEMERAL_START]
Du bist ein professioneller Buchautor. Du schreibst im Stil: "${writingStyle}".
Sprache: ${lang}.

Du schreibst die FORTSETZUNG von Kapitel "${chapterTitle}" nach einem bereits feststehenden Eröffnungsabsatz.
[CACHE_CONTROL: EPHEMERAL_END]

Der Eröffnungsabsatz steht bereits fest und darf NICHT verändert oder wiederholt werden:
"${generatedOpening}"

Schreibe den restlichen Kapitelinhalt direkt im Anschluss daran. Achte auf:
- Inhaltliche und stilistische Konsistenz zum Opening
- Klare Struktur entlang dieser Kernpunkte: ${chapterKeyPoints.join(', ')}
- Keine erneute Einleitung oder Zusammenfassung des bereits Gesagten
- Sachlich-praktischer Ton, keine übertriebene Wiederholung von Kapitel-Überschrift oder Thema im Fließtext
- Exakte Länge: ca. ${continuationMin}–${continuationMax} Wörter (Buchdruck-Seitenformat)
- KEINE Markdown-Überschriften (# oder **), keine Sternchen
- Vermeide KI-Floskeln: "Zusammenfassend...", "Es ist wichtig...", "Abschließend...", "Nicht nur..., sondern auch..."
${customGuidelines ? `\nAutoren-Richtlinien: "${customGuidelines}"` : ''}${contextPrompt}

Gib ausschließlich den Fortsetzungstext aus, kein erneutes Opening, keine Überschrift.`;

    const userPrompt = `Buch: "${outline.title}"
Kapitel: "${chapterTitle}"
Kernpunkte: ${chapterKeyPoints.map(kp => `- ${kp}`).join('\n')}

Schreibe jetzt den Fortsetzungstext (${continuationMin}–${continuationMax} Wörter):`;

    const continuation = await this.askAI(systemPrompt, userPrompt, false);
    return continuation.trim();
  }

  async generatePage(

    outline: BookOutline,
    pageNumber: number,
    previousPagesText: { [key: number]: string },
    writingStyle: string,
    pageSize: string = '6x9',
    fontSize: number = 11,
    shorterRetry: boolean = false,
    customGuidelines: string = '',
    autoChapterGraphics: boolean = false,
    cmiePromptEnrichment: string = ''
  ): Promise<string> {
    if (writingStyle === 'Sachbuch / Theorien') {
      const isEn = outline.language !== 'de';
      const theoryRule = isEn
        ? "SPECIAL RULE FOR THIS STYLE ('Sachbuch / Theorien'): Write generally like a normal, well-founded non-fiction book about the facts. BUT occasionally (only sometimes, not always) sprinkle in your own or known theories, hypotheses, or speculations about the topic to make the text more interesting."
        : "SONDERREGEL FÜR DIESEN STIL ('Sachbuch / Theorien'): Schreibe generell wie ein normales, fundiertes Sachbuch über die Fakten. ABER streue teilweise (nur manchmal, nicht immer) eigene oder bekannte Theorien, Hypothesen oder Spekulationen zu dem Thema ein, um den Text interessanter zu gestalten.";
      customGuidelines = customGuidelines ? `${customGuidelines}\n\n${theoryRule}` : theoryRule;
    }

    const currentPageInfo = outline.pages.find(p => p.page_number === pageNumber);
    if (!currentPageInfo) throw new Error(`Seite ${pageNumber} nicht in der Outline gefunden.`);

    let contextPrompt = '';
    if (pageNumber > 1) {
      const prevText = previousPagesText[pageNumber - 1] || '';
      const lastSentences = this.getLastSentences(prevText, 3);
      
      // Um TPM-Limits bei Groq/Gemini zu vermeiden, senden wir nur die letzten ca. 150 Wörter
      // (bzw. 70 Wörter für Groq) der vorherigen Seite anstatt ganzer Seiten.
      const isGroq = this.getProvider() === 'groq';
      const wordLimit = isGroq ? 70 : 150;
      const words = prevText.split(/\s+/);
      const truncatedPrevText = words.length > wordLimit ? '... ' + words.slice(-wordLimit).join(' ') : prevText;

      contextPrompt = `Bisheriger Buchtext zur Wahrung des Flusses:
---
[Vorheriger Text gekürzt]
${truncatedPrevText}
---
Der allerletzte Satz / die letzten Sätze der vorherigen Seite waren:
"${lastSentences}"
Setze den Text absolut nahtlos fort. Der allererste Satz dieser neuen Seite ${pageNumber} MUSS sich grammatikalisch, stilistisch und logisch perfekt an diese Worte anschließen (wie ein einziger fortlaufender Textfluss), OHNE das Thema neu einzuleiten, Konzepte zu wiederholen oder Phrasen der vorherigen Seiten aufzugreifen. Gehe sofort über zum NEUEN Aspekt dieser Seite: "${currentPageInfo.focus}".`;
    }

    // Mathematische Berechnung der optimalen Wortanzahl basierend auf dem Seitenformat und der Schriftgröße,
    // um die Seite optimal zu füllen und gleichzeitig ein Überlaufen (Abschneiden) zu verhindern.
    let minWords = 160;
    let maxWords = 210;

    if (pageSize === '5x8') {
      minWords = fontSize >= 12 ? 145 : 170;
      maxWords = fontSize >= 12 ? 180 : 210;
    } else if (pageSize === '5.5x8.5') {
      minWords = fontSize >= 12 ? 175 : 215;
      maxWords = fontSize >= 12 ? 225 : 265;
    } else if (pageSize === '6x9') {
      minWords = fontSize >= 12 ? 220 : 270;
      maxWords = fontSize >= 12 ? 270 : 325;
    } else if (pageSize === '8.5x11') {
      minWords = fontSize >= 12 ? 430 : 500;
      maxWords = fontSize >= 12 ? 500 : 580;
    } else if (pageSize === 'a4') {
      minWords = fontSize >= 12 ? 440 : 520;
      maxWords = fontSize >= 12 ? 520 : 610;
    } else if (pageSize === 'custom') {
      minWords = fontSize >= 12 ? 190 : 230;
      maxWords = fontSize >= 12 ? 230 : 285;
    }

    const isChapterOpening = pageNumber === 1 || (
      pageNumber > 1 && 
      outline.pages.find(p => p.page_number === pageNumber - 1)?.chapter_title !== currentPageInfo.chapter_title
    );

    const layoutTemplates = [
      "Reines Text-Layout: Teile den Text in 3-4 flüssige Absätze auf. Verwende in diesem Layout KEINE Boxen, Listen oder Schreiblinien, sondern konzentriere dich auf reinen Fließtext.",
      "Hervorhebungs-Layout: Schreibe 1-2 Absätze Fließtext, gefolgt von einer ':::callout [Titel]' Box (für einen wichtigen Tipp oder Experten-Hinweis) und beende die Seite mit 1 weiteren kurzen Absatz.",
      "Aktions-Layout: Beginne mit 1 Absatz Einführung, gefolgt von einer nummerierten Liste (1., 2., 3.) mit Schritten für den Leser, und beende die Seite mit einer ':::action [Titel]' Box, die einen konkreten Aktionsschritt fordert.",
      "Reflexions-Layout: Schreibe 2 tiefgründige Absätze Fließtext und platziere am Ende eine ':::reflection [Titel]' Box mit 2 konkreten Fragen zum Nachdenken für den Leser.",
      "Checklisten-Layout: Beginne die Seite mit 1 Absatz Erklärung und einer Checkliste mit 3 Kontrollkästchen (eingeleitet mit '[ ] ') zum Abhaken.",
      "Notizen-Layout: Schreibe 1-2 informative Absätze Fließtext und füge am Ende der Seite 3-4 gepunktete Schreiblinien (z. B. '........................................................') für persönliche Notizen des Lesers ein.",
      "Tipp- & Notizen-Layout: Schreibe 1-2 informative Absätze, gefolgt von einer ':::callout [Titel]' Box und 2 gepunkteten Schreiblinien.",
      "Umsetzungs-Layout: Schreibe 1 einleitenden Absatz, gefolgt von einer kurzen Checkliste mit 2 Punkten ('[ ] ') und einer ':::action [Titel]' Box mit einem klaren Ziel.",
      "Tabellen-Layout: Schreibe 1 einleitenden Absatz, gefolgt von einer übersichtlichen Markdown-Tabelle mit 2 Spalten (z.B. Konzept vs. Praxis oder Vor- vs. Nachteile). Fülle diese Tabelle ZWINGEND mit 3-4 Zeilen an konkretem, inhaltlichem Text (lass sie nicht leer!). Beende die Seite mit 1 kurzen Absatz.",
      "Doppel-Box-Layout: Beginne mit 1 Absatz Fließtext, platziere eine ':::callout [Hintergrund]' Box, gefolgt von 1 Absatz Übergangstext und einer abschließenden ':::action [Tagesaufgabe]' Box.",
      "Phasen-Layout: Verwende eine nummerierte Liste (1., 2., 3., 4.) für ein Stufenmodell oder eine Schritt-für-Schritt-Entwicklung, gefolgt von einer ':::reflection [Deine Einschätzung]' Box.",
      "Kombinations-Layout: Beginne mit 1 Absatz Fließtext, gefolgt von einer kurzen Checkliste ('[ ] ') mit 3 Elementen, 2 gepunkteten Schreiblinien zum Ergänzen und einer abschließenden ':::callout [Tipp]' Box."
    ];

    const templateIndex = (pageNumber + outline.title.length) % layoutTemplates.length;
    const selectedTemplate = layoutTemplates[templateIndex];

    const noQuotes = customGuidelines.includes('KEINERLEI Zitate') || customGuidelines.includes('Zitate sind in diesem Buch vollständig verboten');

    let systemPrompt = `Du bist ein professioneller Buchautor. Du schreibst im folgenden Stil: "${writingStyle}".
Deine Sprache ist exakt: ${outline.language === 'de' ? 'Deutsch (korrekte Rechtschreibung und Grammatik)' : 'ENGLISH (CRITICAL: YOU MUST WRITE THE ENTIRE TEXT IN ENGLISH ONLY!)'}.
Achte peinlich genau auf folgende Regeln:
1. ${(isChapterOpening && !noQuotes) ? `Zitate sind auf dieser Seite (Beginn eines neuen Kapitels!) als feierlicher Einstieg sehr erwünscht. ABER ACHTUNG: Ein Zitat darf NIEMALS ganz oben am Anfang der Seite stehen! Beginne die Seite IMMER zuerst mit mindestens einem eleganten Absatz Fließtext als Einleitung in das Thema, bevor du weiter unten ein Zitat einfügst. Das Zitat muss gemeinfrei/legal sein, in einer eigenen Zeile stehen, eingeleitet mit "> ", und MUSS am Ende immer eine Autorenangabe enthalten (Format: — Vorname Nachname). Beispiel:
> "Wissen ist Macht." — Francis Bacon
EIN ZITAT OHNE — AUTORENANGABE AM ENDE IST STRENGSTENS VERBOTEN.` : `Es ist dir STRENGSTENS VERBOTEN, Zitate auf dieser Seite zu generieren! Verwende kein Zitat (keine Zeile mit "> "). Zitate sind in diesem Buch vollständig verboten und deaktiviert.`}
${pageNumber === 1 ? '1b. WICHTIG: Dies ist die allererste Seite des Buches! Es gibt absolut keine vorherigen Seiten, keinen bisherigen Buchtext und keinen vorherigen Kontext. Beginne das Buch frisch und eigenständig. Schreibe NIEMALS Phrasen wie "wie bereits erwähnt", "auf den vorigen Seiten", "zuvor haben wir", "im letzten Kapitel" oder ähnliche Verweise auf nicht existierende Vorseiten! Diese wäre absurd, da dies die erste Seite ist.' : ''}
2. KRITISCHES REDUNDANZ-VERBOT: Vermeide absolut jegliche Wiederholungen von Fakten, Beispielen, Formulierungen, Phrasen oder Ideen, die bereits auf den vorherigen Seiten behandelt wurden. Jede Seite muss das Thema progressiv vorantreiben. Plane und schreibe exklusiv über den neuen Fokus dieser Seite und bringe neue Informationen ein, statt bereits Gesagtes neu zu formulieren.
3. Formatiere den Text lesbar durch klare Absätze. Teile den Text unbedingt in mehrere Absätze (durch Zeilenumbrüche getrennt) auf, um das Lesen zu erleichtern! Ein einziger großer Textblock ist verboten. Verwende KEINE Markdown-Überschriften (wie # oder ##) oder Sternchen (wie **fett**). ${noQuotes ? 'Verwende absolut keine Zitate.' : 'Einzige Ausnahme sind Zitate, die mit "> " beginnen.'} Überschriften werden vom Layout-System automatisch eingefügt.
4. Schreibe so viel Text, wie das Thema auf dieser Seite natürlich erfordert — orientiere dich am Richtwert von ca. ${minWords} bis ${maxWords} Wörtern. WICHTIG: Beende den Text NIEMALS mitten im Satz oder mitten in einer Aufzählung; führe jeden Gedanken sauber zu Ende. Wenn ein Layout-Element (z. B. eine Tabelle, eine Box, eine Checkliste, ${noQuotes ? '' : 'ein Zitat, '}eine Liste oder Schreiblinien) die Seite thematisch abschließt, ist es vollkommen in Ordnung, danach nicht mehr weiterzuschreiben — füge dann KEINEN künstlichen Fülltext hinzu. Wenn die Seite hingegen reinen Fließtext enthält und das Thema noch nicht abgeschlossen ist, nutze den Raum und schreibe bis in den unteren Bereich der Seite.
6. Vermeide typische KI-Floskeln und künstliche oder extrem repetitive Übergänge wie 'Zusammenfassend...', 'Es ist wichtig zu betonen...', 'Abschließend...', 'Nicht nur..., sondern auch...'. Es ist dir absolut VERBOTEN, Absätze oder Sätze mehrfach hintereinander mit den exakt selben Wörtern wie "Daher" oder "Deshalb" zu beginnen! Schreibe stattdessen literarisch elegant, extrem abwechslungsreich, mit sauberem Vokabular und organisch fließend.
7. ZWINGENDE LAYOUT-STRUKTUR FÜR DIESE SEITE (Um das Buch abwechslungsreich und visuell einzigartig wie Handarbeit zu gestalten, MUSS diese Seite exakt folgendem Layout folgen):
   👉 "${selectedTemplate}"

   SYNTAX-REGELN FÜR DIE LAYOUT-ELEMENTE:
   - Kontrollkästchen/Checklisten: Am Zeilenanfang "[ ] ". Beispiel: "[ ] Erste Aufgabe"
   - Gepunktete Schreiblinien: Eine Zeile mit nur Punkten (z. B. "........................................................").
   - Boxen: Umschließe den Inhalt mit ":::box [Titel]" (Standard gestrichelt), ":::callout [Titel]" (Wichtiger Hinweis, solide mit dickem Rand) oder ":::reflection [Titel]" (Reflexionsfragen) oder ":::action [Titel]" (Aktionsschritte mit Schatten) und beende mit ":::" auf einer eigenen Zeile. Beispiel:
     :::callout Wichtiger Tipp
     Das ist ein extrem wichtiger Hinweis.
     :::
   - Nummerierte Listen: Beginne Zeilen mit "1. ", "2. " usw.
   - Tabellen: Nutze Markdown-Tabellen ("| Spalte 1 | Spalte 2 |" gefolgt von "| :--- | :--- |").\n\n`;

    if (autoChapterGraphics) {
      systemPrompt += `8. Du darfst optional EINE thematisch extrem gut passende Grafik/Illustration einfügen, falls sie das Verständnis perfekt bereichert. Setze dazu den Platzhalter: [grafik: dein Bild-Prompt auf Englisch]. Füge maximal EIN Bild pro Seite ein und nur dann, wenn es massiven Mehrwert bietet. Wenn du dir unsicher bist, füge keine Grafik ein.\n\n`;
    } else {
      systemPrompt += `8. STRIKTE REGEL: Es ist dir STRENG VERBOTEN, Bilder, Grafiken oder [grafik: ...]-Tags in den Text einzubauen! Ignoriere jegliche Anweisungen zu Grafiken.\n\n`;
    }

    let finalSystemPrompt = systemPrompt;
    if (customGuidelines && customGuidelines.trim()) {
      const isGroq = this.getProvider() === 'groq';
      let guidelines = customGuidelines.trim();
      if (isGroq && guidelines.length > 1500) {
        guidelines = guidelines.substring(0, 1500) + '... (Gekürzt für Groq)';
      }
      finalSystemPrompt += `\n7. Berücksichtige strikt diese Autoren-Richtlinien & Stil-Vorgaben des Nutzers:\n"${guidelines}"`;
    }

    // Varietät-System: Erfassung kürzlich genutzter Satzanfänge zur Erhöhung der Vielfalt
    const recentOpeners = this.getRecentPageOpeners(previousPagesText, pageNumber);
    const isEng2 = outline.language !== 'de';
    finalSystemPrompt += `\n\n8. VERBOTENE SEITEN-ANFÄNGE (Zur Gewährleistung von Varietät):
Der allererste Satz dieser Seite darf keinesfalls mit typischen, monotonen KI-Satzstrukturen oder kürzlich genutzten Anfängen eingeleitet werden.
Folgende Satzanfänge sind für den ALLERERSTEN Satz dieser Seite STRENGSTENS VERBOTEN:
${isEng2 ? `- Phrases starting with "When..." (e.g. "When you...", "When we...")
- Phrases starting with "By..." (e.g. "By doing...", "By using...")
- Phrases starting with "To..." (e.g. "To achieve...", "To understand...")
- Phrases starting with "Therefore", "Thus", "Hence", "Consequently"
- Phrases starting with "In this chapter", "In this section", "As we", "We have seen"` : `- Formulierungen mit "Wenn..." (z. B. "Wenn du...", "Wenn Sie...", "Wenn...")
- Formulierungen mit "Indem..." (z. B. "Indem du...", "Indem Sie...", "Indem...")
- Formulierungen mit "Um..." (z. B. "Um deine...", "Um Ihre...", "Um...")
- Formulierungen mit "Daher...", "Deshalb...", "Folglich..." oder "Somit..."
- Formulierungen mit "In diesem Kapitel", "Wie wir gesehen haben", "Wir haben"`}
${recentOpeners.length > 0 ? recentOpeners.map(op => `- Beginne NICHT mit "${op}..." (bereits verwendet)`).join('\n') : ''}

Achte auf maximale sprachliche Vielfalt! Verwende kreative, abwechslungsreiche und elegante Einleitungen für den ersten Satz. Vermeide konsequent Satzanfang-Wiederholungen innerhalb der Seite!`;

    if (shorterRetry) {
      finalSystemPrompt += `\n\nACHTUNG: Dein vorheriger Entwurf war etwas zu lang und ist über das Buchseiten-Limit hinausgelaufen! Du MUSST diesen Entwurf jetzt um ca. 15% bis 20% kürzen (also ca. ${Math.round(minWords * 0.8)} bis ${Math.round(maxWords * 0.8)} Wörter), damit er exakt auf eine Seite passt, ohne abgeschnitten zu werden. Behalte alle wichtigen Informationen bei, aber schreibe kompakter.`;
    }

    if (cmiePromptEnrichment && cmiePromptEnrichment.trim()) {
      finalSystemPrompt += `\n\n` + cmiePromptEnrichment;
    }

    const userPrompt = `
Buch-Titel: "${outline.title}"
Buch-Untertitel: "${outline.subtitle}"

Aktuelle Seite zum Schreiben: Seite ${pageNumber} von ${outline.target_pages}
Kapitel: "${currentPageInfo.chapter_title}"
Fokus dieser Seite: "${currentPageInfo.focus}"
Wichtige Details, die auf dieser Seite vorkommen MÜSSEN:
${currentPageInfo.key_points.map(kp => `- ${kp}`).join('\n')}

${contextPrompt}

Schreibe jetzt den vollständigen Fließtext für Seite ${pageNumber}. Verwende keine Anmerkungen, keine Einleitung, sondern starte direkt mit dem Buchtext:`;

    const isEng = outline.language !== 'de';
    finalSystemPrompt = this.enforceEnglishOnly(finalSystemPrompt, isEng);
    let finalUserPrompt = this.enforceEnglishOnly(userPrompt, isEng);

    const provider = this.getProvider();
    let data: any;

    if (provider === 'groq') {
      const tokenLimits = [2000, 1500, 1000];
      for (let i = 0; i < tokenLimits.length; i++) {
        const tokens = tokenLimits[i];
        try {
          data = await this.executeWithKeyRotation('groq', (key) => 
            fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
              },
              body: JSON.stringify({
                model: this.model,
                messages: [
                  { role: 'system', content: finalSystemPrompt },
                  { role: 'user', content: finalUserPrompt }
                ],
                temperature: 0.75,
                max_tokens: tokens
              })
            })
          );
          return data.choices[0].message.content.trim();
        } catch (err: any) {
          if (i === tokenLimits.length - 1) {
            throw err;
          }
          console.warn(`Groq page generation failed with max_tokens=${tokens}, retrying with ${tokenLimits[i + 1]}...`);
        }
      }
      throw new Error('Groq page generation failed all fallback attempts.');
    } else {
      // Gemini
      data = await this.executeWithKeyRotation('gemini', async (key) => {
        const body: any = {
          contents: [
            {
              role: 'user',
              parts: [{ text: finalUserPrompt }]
            }
          ],
          systemInstruction: {
            parts: [{ text: finalSystemPrompt }]
          },
          generationConfig: {
            temperature: 0.65
          }
        };

        return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${key}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });
      });
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error(`Gemini hat keine Textantwort für Seite ${pageNumber} zurückgegeben.`);
      }
      return data.candidates[0].content.parts[0].text.trim();
    }
  }

  async lengthenPage(
    outline: BookOutline,
    pageNumber: number,
    currentText: string,
    previousPagesText: { [key: number]: string },
    writingStyle: string,
    pageSize: string = '6x9',
    fontSize: number = 11,
    customGuidelines: string = ''
  ): Promise<string> {
    if (writingStyle === 'Sachbuch / Theorien') {
      const isEn = outline.language !== 'de';
      const theoryRule = isEn
        ? "SPECIAL RULE FOR THIS STYLE ('Sachbuch / Theorien'): Write generally like a normal, well-founded non-fiction book about the facts. BUT occasionally (only sometimes, not always) sprinkle in your own or known theories, hypotheses, or speculations about the topic to make the text more interesting."
        : "SONDERREGEL FÜR DIESEN STIL ('Sachbuch / Theorien'): Schreibe generell wie ein normales, fundiertes Sachbuch über die Fakten. ABER streue teilweise (nur manchmal, nicht immer) eigene oder bekannte Theorien, Hypothesen oder Spekulationen zu dem Thema ein, um den Text interessanter zu gestalten.";
      customGuidelines = customGuidelines ? `${customGuidelines}\n\n${theoryRule}` : theoryRule;
    }

    const currentPageInfo = outline.pages.find(p => p.page_number === pageNumber);
    if (!currentPageInfo) throw new Error(`Seite ${pageNumber} nicht in der Outline gefunden.`);

    let contextPrompt = '';
    if (pageNumber > 1) {
      const prevText = previousPagesText[pageNumber - 1] || '';
      const lastSentences = this.getLastSentences(prevText, 2);
      contextPrompt = `Bisheriger Buchtext zur Wahrung des Flusses und Vermeidung von Wiederholungen:
---
${pageNumber > 2 ? `SEITE ${pageNumber - 2}:\n${previousPagesText[pageNumber - 2] || ''}\n\n` : ''}
SEITE ${pageNumber - 1}:\n${prevText}
---
Der allerletzte Satz der vorherigen Seite war: "${lastSentences}"
Stelle sicher, dass die Fortsetzung nahtlos bleibt.`;
    }

    let minWords = 160;
    let maxWords = 210;

    if (pageSize === '5x8') {
      minWords = fontSize >= 12 ? 130 : 155;
      maxWords = fontSize >= 12 ? 165 : 190;
    } else if (pageSize === '5.5x8.5') {
      minWords = fontSize >= 12 ? 160 : 195;
      maxWords = fontSize >= 12 ? 205 : 240;
    } else if (pageSize === '6x9') {
      minWords = fontSize >= 12 ? 200 : 245;
      maxWords = fontSize >= 12 ? 245 : 295;
    } else if (pageSize === '8.5x11') {
      minWords = fontSize >= 12 ? 390 : 460;
      maxWords = fontSize >= 12 ? 460 : 530;
    } else if (pageSize === 'a4') {
      minWords = fontSize >= 12 ? 400 : 480;
      maxWords = fontSize >= 12 ? 480 : 560;
    } else if (pageSize === 'custom') {
      minWords = fontSize >= 12 ? 170 : 210;
      maxWords = fontSize >= 12 ? 210 : 260;
    }

    const systemPrompt = `Du bist ein professioneller Buchautor. Du schreibst im folgenden Stil: "${writingStyle}".
Deine Sprache ist exakt: ${outline.language === 'de' ? 'Deutsch (korrekte Rechtschreibung und Grammatik)' : 'ENGLISH (CRITICAL: YOU MUST WRITE THE ENTIRE TEXT IN ENGLISH ONLY!)'}.
Deine Aufgabe ist es, den übergebenen Text einer Buchseite inhaltlich zu verlängern und detaillierter auszuformulieren, ohne die Kernaussage oder das Thema zu verändern.
Schreibe ausführlicher, schmücke Sätze aus, bringe tiefergehende Erklärungen oder Beschreibungen ein, damit der Text länger wird und die Seite voll ausfüllt.

Achte peinlich genau auf folgende Regeln:
1. Verwende KEINE Markdown-Überschriften oder Sternchen.
2. Generiere exakt die Länge für eine Buchseite (ca. ${minWords} bis ${maxWords} Wörter). Der Text darf nicht überlaufen.
3. Beende den Text nicht mitten im Satz, sondern führe den Gedanken auf dieser Seite sauber zu Ende.
4. Starte direkt mit dem neuen, verlängerten Text der Seite, ohne Buchtitel, Kapitel-Überschrift oder Anmerkungen am Anfang.
5. Vermeide typische KI-Floskeln und künstliche Übergänge wie 'Zusammenfassend...', 'Es ist wichtig zu betonen...', 'Abschließend...', etc. Schreibe organisch, literarisch hochwertig und fließend.
6. Falls die Seite Arbeitsbuch-, Übungs- oder Journal-Elemente enthalten soll (z. B. Checklisten, Schreiblinien, Boxen oder Tabellen):
   - Für leere Kontrollkästchen/Checklisten schreibe am Zeilenanfang "[ ] ".
   - Für gepunktete Schreiblinien zum Ausfüllen schreibe eine Zeile mit nur Punkten (z. B. "........................................................").
   - Für graue Boxen/Infokästen/Performance Prompts umschließe den Inhalt mit ":::box [Titel]" am Anfang und ":::" am Ende auf jeweils einer eigenen Zeile.
   - Für tabellarische Übersichten oder Raster nutze die Markdown-Tabellen-Syntax (z. B. "| Spalte 1 | Spalte 2 |" gefolgt von der Trennlinie "| :--- | :--- |").
   - Wenn eine Grafik, Zeichnung oder Illustration den Inhalt veranschaulichen soll, füge an dieser Stelle auf einer eigenen Zeile ein Bild-Tag ein. Format: "[grafik: Detaillierte Beschreibung der Grafik]".`;

    let finalSystemPrompt = systemPrompt;
    if (customGuidelines && customGuidelines.trim()) {
      finalSystemPrompt += `\n6. Berücksichtige strikt diese Autoren-Richtlinien & Stil-Vorgaben des Nutzers:\n"${customGuidelines.trim()}"`;
    }

    const userPrompt = `
Buch-Titel: "${outline.title}"
Kapitel: "${currentPageInfo.chapter_title}"
Fokus dieser Seite: "${currentPageInfo.focus}"

Aktueller Text auf Seite ${pageNumber}:
---
${currentText}
---

${contextPrompt}

Schreibe jetzt den vollständigen, verlängerten Fließtext für Seite ${pageNumber} (Zielwortanzahl: ca. ${minWords} bis ${maxWords} Wörter). Starte direkt mit dem Buchtext:`;

    const isEng = outline.language !== 'de';
    finalSystemPrompt = this.enforceEnglishOnly(finalSystemPrompt, isEng);
    let finalUserPrompt = this.enforceEnglishOnly(userPrompt, isEng);

    const provider = this.getProvider();
    let data: any;

    if (provider === 'groq') {
      data = await this.executeWithKeyRotation('groq', (key) => 
        fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              { role: 'system', content: finalSystemPrompt },
              { role: 'user', content: finalUserPrompt }
            ],
            temperature: 0.65,
            max_tokens: 1000
          })
        })
      );
      return data.choices[0].message.content.trim();
    } else {
      // Gemini
      data = await this.executeWithKeyRotation('gemini', async (key) => {
        const body: any = {
          contents: [
            {
              role: 'user',
              parts: [{ text: finalUserPrompt }]
            }
          ],
          systemInstruction: {
            parts: [{ text: finalSystemPrompt }]
          },
          generationConfig: {
            temperature: 0.65
          }
        };

        return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${key}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });
      });
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error(`Gemini hat keine Textantwort für Seite ${pageNumber} zurückgegeben.`);
      }
      return data.candidates[0].content.parts[0].text.trim();
    }
  }

  async generateStyleVariations(
    outline: BookOutline,
    pageNumber: number,
    currentText: string,
    writingStyle: string,
    pageSize: string = '6x9',
    fontSize: number = 11
  ): Promise<{ 
    version_1: string; style_1_name: string;
    version_2: string; style_2_name: string;
    version_3: string; style_3_name: string;
  }> {
    const currentPageInfo = outline.pages.find(p => p.page_number === pageNumber);
    if (!currentPageInfo) throw new Error(`Seite ${pageNumber} nicht in der Outline gefunden.`);

    let minWords = 160;
    let maxWords = 210;

    if (pageSize === '5x8') {
      minWords = fontSize >= 12 ? 130 : 155;
      maxWords = fontSize >= 12 ? 165 : 190;
    } else if (pageSize === '5.5x8.5') {
      minWords = fontSize >= 12 ? 160 : 195;
      maxWords = fontSize >= 12 ? 205 : 240;
    } else if (pageSize === '6x9') {
      minWords = fontSize >= 12 ? 200 : 245;
      maxWords = fontSize >= 12 ? 245 : 295;
    } else if (pageSize === '8.5x11') {
      minWords = fontSize >= 12 ? 390 : 460;
      maxWords = fontSize >= 12 ? 460 : 530;
    } else if (pageSize === 'a4') {
      minWords = fontSize >= 12 ? 400 : 480;
      maxWords = fontSize >= 12 ? 480 : 560;
    } else if (pageSize === 'custom') {
      minWords = fontSize >= 12 ? 170 : 210;
      maxWords = fontSize >= 12 ? 210 : 260;
    }

    const stylePool = [
      { name: "Spannend & Bildhaft", desc: "Dramatisch, emotional, lebendig, mit starken Metaphern und hoher Spannung." },
      { name: "Fokussiert & Direkt", desc: "Klar, präzise, faktenbasiert, schnörkellos und direkt verständlich." },
      { name: "Klassisch Literarisch", desc: "Klassische Novel-Prosa, eleganter Lesefluss, kunstvolle Satzstrukturen wie bei J.K. Rowling." },
      { name: "Humorvoll & Unterhaltsam", desc: "Humorvoll, leichtfüßig, unterhaltsam, mit einer Prise Witz, Charme und Ironie." },
      { name: "Poetisch & Philosophisch", desc: "Poetisch, tiefgründig, philosophisch, regt zum Nachdenken an, melodischer Lesefluss." },
      { name: "Modern & Nahbar", desc: "Nahbar, modern, locker, wie ein persönliches Gespräch unter Freunden." },
      { name: "Wissenschaftlich & Analytisch", desc: "Fachlich, präzise, objektiv, strukturiert, mit analytischer Tiefe." },
      { name: "Minimalistisch & Kraftvoll", desc: "Minimalistisch, extrem verdichtet, kurze prägnante Sätze mit maximaler Aussagekraft pro Wort." }
    ];

    // Shuffle and pick 3 styles randomly
    const shuffled = [...stylePool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);

    const systemPrompt = `Du bist ein professioneller Buchautor. Du schreibst im grundlegenden Buchstil: "${writingStyle}" und antwortest ausschließlich im JSON-Format.
Deine Aufgabe ist es, für die übergebene Buchseite exakt drei unterschiedliche stilistische Versionen des Fließtextes zu entwerfen.
Die Kernaussage, Details und der Bezug zum Kapitel müssen in allen Versionen identisch bleiben, aber die Formulierung und der Stil sollen sich unterscheiden:

Version 1 (${selected[0].name}): ${selected[0].desc}
Version 2 (${selected[1].name}): ${selected[1].desc}
Version 3 (${selected[2].name}): ${selected[2].desc}

Achte peinlich genau auf folgende Regeln:
1. Verwende in den Texten KEINE Markdown-Überschriften oder Sternchen.
2. Jede Version muss exakt die Länge für eine Buchseite haben (ca. ${minWords} bis ${maxWords} Wörter). Sie dürfen die Seite nicht überschreiten.
3. Beende die Texte nicht mitten im Satz, sondern führe den Gedanken sauber zu Ende.
4. Antworte AUSSCHLIESSLICH im JSON-Format mit folgender Struktur:
{
  "style_1_name": "${selected[0].name}",
  "version_1": "Text für Version 1...",
  "style_2_name": "${selected[1].name}",
  "version_2": "Text für Version 2...",
  "style_3_name": "${selected[2].name}",
  "version_3": "Text für Version 3..."
}`;

    const userPrompt = `
Buch-Titel: "${outline.title}"
Kapitel: "${currentPageInfo.chapter_title}"
Fokus dieser Seite: "${currentPageInfo.focus}"

Aktueller Text auf Seite ${pageNumber}:
---
${currentText}
---

Entwirf jetzt drei unterschiedliche Stil-Versionen (version_1, version_2, version_3) für diese Seite im JSON-Format:`;

    const provider = this.getProvider();
    let data: any;
    let resultJson: any;

    if (provider === 'groq') {
      data = await this.executeWithKeyRotation('groq', (key) => 
        fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            ...(this.model !== 'deepseek-reasoner' ? { response_format: { type: 'json_object' } } : {}),
            temperature: 0.8,
            max_tokens: 1000
          })
        })
      );
      const text = data.choices[0].message.content;
      resultJson = JSON.parse(text);
    } else {
      // Gemini
      data = await this.executeWithKeyRotation('gemini', (key) => 
        fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${key}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: userPrompt }]
              }
            ],
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.8
            }
          })
        })
      );
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error(`Gemini hat keine Textantwort für Seite ${pageNumber} zurückgegeben.`);
      }
      let jsonText = data.candidates[0].content.parts[0].text.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
      }
      resultJson = JSON.parse(jsonText);
    }

    return {
      style_1_name: resultJson.style_1_name || selected[0].name,
      version_1: resultJson.version_1 || '',
      style_2_name: resultJson.style_2_name || selected[1].name,
      version_2: resultJson.version_2 || '',
      style_3_name: resultJson.style_3_name || selected[2].name,
      version_3: resultJson.version_3 || ''
    };
  }

  async generateStructureVariations(
    outline: BookOutline,
    pageNumber: number,
    currentText: string,
    pageSize: string = '6x9',
    fontSize: number = 11
  ): Promise<{ version_1: string; version_2: string; version_3: string }> {
    const currentPageInfo = outline.pages.find(p => p.page_number === pageNumber);
    if (!currentPageInfo) throw new Error(`Seite ${pageNumber} nicht in der Outline gefunden.`);

    let minWords = 140;
    let maxWords = 190;

    if (pageSize === '5x8') {
      minWords = fontSize >= 12 ? 110 : 130;
      maxWords = fontSize >= 12 ? 145 : 170;
    } else if (pageSize === '5.5x8.5') {
      minWords = fontSize >= 12 ? 140 : 170;
      maxWords = fontSize >= 12 ? 180 : 210;
    } else if (pageSize === '6x9') {
      minWords = fontSize >= 12 ? 180 : 210;
      maxWords = fontSize >= 12 ? 220 : 260;
    } else if (pageSize === '8.5x11') {
      minWords = fontSize >= 12 ? 350 : 410;
      maxWords = fontSize >= 12 ? 410 : 475;
    } else if (pageSize === 'a4') {
      minWords = fontSize >= 12 ? 360 : 430;
      maxWords = fontSize >= 12 ? 430 : 500;
    } else if (pageSize === 'custom') {
      minWords = fontSize >= 12 ? 150 : 180;
      maxWords = fontSize >= 12 ? 180 : 230;
    }

    const systemPrompt = `Du bist ein professioneller Buchgestalter und Lektor. Deine Aufgabe ist es, den übergebenen Text für die Buchseite in drei unterschiedliche strukturelle Darstellungsformen (Layout-Gliederungen) umzuwandeln.
Die Kernaussage und der inhaltliche Kern müssen komplett identisch bleiben, aber die visuelle Struktur des Textes soll sich grundlegend unterscheiden:

Version 1 (Mit Zwischenüberschriften): Untergliedere den Text durch 2 bis 3 kurze, fettgedruckte Zwischenüberschriften (Form: **Überschrift** auf einer eigenen Zeile), um den Lesefluss thematisch zu gliedern.
Version 2 (Listen & Stichpunkte): Formatiere den Text so um, dass ein Teil des Fließtextes in eine übersichtliche Aufzählung (mit Standard-Minus-Spiegelstrichen, z. B. "- Stichpunkt 1") umgewandelt wird.
Version 3 (Kurze Abschnitte): Unterteile den Text in sehr kurze, knackige Absätze (jeweils nur 1 bis maximal 2 Sätze pro Absatz), um ein schnelles und leichtes Lesen zu ermöglichen.

Achte peinlich genau auf folgende Regeln:
1. Verwende in den Texten KEINE Markdown-Hauptüberschriften (# oder ##) oder Kursivschrift-Sterne (*).
2. Da Zwischenüberschriften und Listen zusätzlichen vertikalen Platz auf der Buchseite einnehmen, halte den Text kompakt (ca. ${minWords} bis ${maxWords} Wörter).
3. Beende die Texte nicht mitten im Satz, sondern führe den Gedanken sauber zu Ende.
4. Antworte AUSSCHLIESSLICH im JSON-Format mit folgender Struktur:
{
  "version_1": "Text für Version 1 (Mit Zwischenüberschriften)...",
  "version_2": "Text für Version 2 (Listen & Stichpunkte)...",
  "version_3": "Text für Version 3 (Kurze Abschnitte)..."
}`;

    const userPrompt = `
Buch-Titel: "${outline.title}"
Kapitel: "${currentPageInfo.chapter_title}"
Fokus dieser Seite: "${currentPageInfo.focus}"

Aktueller Text auf Seite ${pageNumber}:
---
${currentText}
---

Entwirf jetzt drei unterschiedliche Struktur-Varianten (version_1, version_2, version_3) für diese Seite im JSON-Format:`;

    const provider = this.getProvider();
    let data: any;

    if (provider === 'groq') {
      data = await this.executeWithKeyRotation('groq', (key) => 
        fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            ...(this.model !== 'deepseek-reasoner' ? { response_format: { type: 'json_object' } } : {}),
            temperature: 0.75,
            max_tokens: 1000
          })
        })
      );
      const text = data.choices[0].message.content;
      return JSON.parse(text);
    } else {
      // Gemini
      data = await this.executeWithKeyRotation('gemini', (key) => 
        fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${key}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: userPrompt }]
              }
            ],
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.75
            }
          })
        })
      );
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error(`Gemini hat keine Textantwort für Seite ${pageNumber} zurückgegeben.`);
      }
      let jsonText = data.candidates[0].content.parts[0].text.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
      }
      return JSON.parse(jsonText);
    }
  }

  private enforceEnglishOnly(prompt: string, isEnglish: boolean): string {
    if (!isEnglish || !prompt) return prompt;

    let p = prompt;
    p = p.replace(/Du bist ein professioneller/gi, "You are an elite professional");
    p = p.replace(/Sprache des Buches:/gi, "Book Language:");
    p = p.replace(/Sprache:/gi, "Language:");
    p = p.replace(/Buchtitel:/gi, "Book Title:");
    p = p.replace(/Untertitel:/gi, "Subtitle:");
    p = p.replace(/Ziel-Seitenzahl:/gi, "Target Page Count:");
    p = p.replace(/STRIKTE REGEL/gi, "STRICT RULE");
    p = p.replace(/VERBOTENE SEITEN-ANFÄNGE/gi, "FORBIDDEN PAGE OPENERS");
    p = p.replace(/Kapitel-Überschrift \(z\.B\. Einleitung\)/gi, "Chapter Title (e.g. Introduction)");
    p = p.replace(/Der exakte Inhaltsschwerpunkt dieser einzelnen Seite/gi, "The exact content focus of this page");
    p = p.replace(/Wichtiger Punkt/gi, "Key Point");
    p = p.replace(/Einleitung/gi, "Introduction");
    p = p.replace(/Kapitel/gi, "Chapter");

    return `### CRITICAL SYSTEM OVERRIDE: 100% NATIVE ENGLISH MODE ###
YOU ARE AN ELITE NATIVE ENGLISH AUTHOR, NEW YORK TIMES BESTSELLER, AND PUBLISHING DIRECTOR.
THE USER IS CREATING AN ENGLISH BOOK. DO NOT GENERATE ANY GERMAN WORDS OR GERMAN PHRASES AT ALL!
EVERY SINGLE WORD OF YOUR OUTPUT (CHAPTER TITLES, SUBTITLES, BULLET POINTS, FOCUS DESCRIPTIONS, KEY POINTS, QUOTES, AND BODY TEXT) MUST BE 100% IN NATIVE, FLAWLESS ENGLISH.
IF YOU ARE GENERATING JSON, ALL STRING VALUES INSIDE THE JSON MUST BE IN ENGLISH ONLY.

ORIGINAL PROMPT SPECIFICATION:
` + p + `\n\n### CRITICAL OVERRIDE ###\nIGNORE ANY INSTRUCTIONS ABOVE THAT ARE WRITTEN IN GERMAN. YOU MUST WRITE 100% IN NATIVE ENGLISH. NO GERMAN ALLOWED!`;
  }

  private async askAI(rawSys: string, rawUsr: string, jsonFormat: boolean = false, timeoutMs: number = 25000): Promise<string> {
    const isEng = rawSys.includes('ENGLISH') || rawSys.includes('English') || rawUsr.includes('ENGLISH') || rawUsr.includes('English') || rawSys.includes('Englisch') || rawUsr.includes('Englisch');
    const systemPrompt = this.enforceEnglishOnly(rawSys, isEng);
    const userPrompt = this.enforceEnglishOnly(rawUsr, isEng);
    const provider = this.getProvider();
    if (provider === 'groq') {
      let data: any;
      const tokenLimits = [1500, 1000, 800, 500];
      for (let i = 0; i < tokenLimits.length; i++) {
        const tokens = tokenLimits[i];
        try {
          data = await this.executeWithKeyRotation('groq', (key) =>
            fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
              },
              body: JSON.stringify({
                model: this.model,
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userPrompt }
                ],
                ...(jsonFormat && this.model !== 'deepseek-reasoner' ? { response_format: { type: 'json_object' } } : {}),
                temperature: 0.7,
                max_tokens: tokens
              })
            }),
            timeoutMs
          );
          break;
        } catch (err: any) {
          if (i === tokenLimits.length - 1) throw err;
        }
      }
      const rawText = data.choices[0].message.content;
      return jsonFormat ? rawText : rawText.replace(/^\s*-{3,}\s*$/gm, '');
    } else if (provider === 'deepseek') {
      const data = await this.executeWithKeyRotation('deepseek', (key) =>
        fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            ...(jsonFormat && this.model !== 'deepseek-reasoner' ? { response_format: { type: 'json_object' } } : {}),
            temperature: 0.7
          })
        }),
        timeoutMs
      );
      const rawText = data.choices[0].message.content;
      return jsonFormat ? rawText : rawText.replace(/^\s*-{3,}\s*$/gm, '');
    } else {
      const data = await this.executeWithKeyRotation('gemini', async (key) => {
        const body: any = {
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }]
            }
          ],
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            ...(jsonFormat ? { responseMimeType: 'application/json' } : {}),
            temperature: 0.7
          }
        };

        return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${key}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });
      },
      timeoutMs
      );
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error('Keine Antwort von der KI erhalten.');
      }
      const rawText = data.candidates[0].content.parts[0].text;
      return jsonFormat ? rawText : rawText.replace(/^\s*-{3,}\s*$/gm, '');
    }
  }

  async evaluateRawText(prompt: string): Promise<string> {
    return this.askAI("Bewerte den Text kurz.", prompt, false);
  }

  async generateAmazonDescription(title: string, subtitle: string, idea: string, language: string): Promise<string> {
    const systemPrompt = `Du bist ein professioneller Buch-Marketing-Experte für Amazon KDP. Konvertiere die Buchidee in eine ansprechende, verkaufsstarke Buchbeschreibung für die Amazon-Produktseite.
Verwende ausschließlich valides Amazon-HTML (erlaubte Tags sind: <b>, <i>, <u>, <p>, <br>, <ul>, <li>, <h1>, <h2>, <h3>). Verwende keine anderen HTML-Tags. Stelle sicher, dass die Beschreibung Absätze, fette Überschriften (mit <h2> oder <b>) und Bullet-Points (mit <ul> und <li>) enthält, um die Lesbarkeit zu maximieren. Schreibe auf ${language === 'de' ? 'Deutsch' : 'ENGLISH (CRITICAL: ENTIRE OUTPUT MUST BE ENGLISH)'}.
Falls keine Buchbeschreibung/Idee vorliegt, leite eine passende, verkaufsstarke Beschreibung komplett kreativ aus dem Titel und Untertitel ab.`;
    const userPrompt = `Titel: "${title}"\nUntertitel: "${subtitle}"\nBeschreibung/Idee: "${idea || '(Keine Idee angegeben, bitte komplett aus Titel/Unter-titel herleiten)'}"`;
    return (await this.askAI(systemPrompt, userPrompt, false)).trim();
  }

  async generateKdpKeywords(title: string, subtitle: string, idea: string, language: string): Promise<string[]> {
    const systemPrompt = `Du bist ein Amazon SEO Experte. Analysiere das folgende Buchprojekt und generiere genau 7 hochrelevante, spezifische Suchbegriffe (Keywords) auf ${language === 'de' ? 'Deutsch' : 'ENGLISH (MUST BE ENGLISH KEYWORDS ONLY)'} für den KDP-Algorithmus, um die Auffindbarkeit zu maximieren. Jedes Keyword kann ein einzelnes Wort oder eine kurze Phrase sein.
Falls keine Beschreibung/Idee vorliegt, leite die Keywords kreativ aus dem Titel und Untertitel ab.
Antworte ausschließlich im JSON-Format mit folgender Struktur: { "keywords": ["keyword 1", "keyword 2", ...] }.`;
    const userPrompt = `Titel: "${title}"\nUntertitel: "${subtitle}"\nBeschreibung/Idee: "${idea || '(Keine Idee angegeben, bitte komplett aus Titel/Unter-titel herleiten)'}"`;
    const responseText = await this.askAI(systemPrompt, userPrompt, true);
    try {
      let jsonText = responseText.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
      }
      const data = JSON.parse(jsonText);
      return Array.isArray(data.keywords) ? data.keywords.slice(0, 7) : [];
    } catch (e) {
      console.error("Failed to parse keywords JSON", e);
      return [];
    }
  }

  async generateKdpCategories(title: string, subtitle: string, idea: string, language: string): Promise<string[]> {
    const systemPrompt = `Du bist ein KDP-Verlagsassistent. Analysiere das folgende Buchprojekt und schlage 3 bis 5 passende Buchkategorien auf ${language === 'de' ? 'Deutsch' : 'ENGLISH (MUST BE ENGLISH CATEGORIES ONLY)'} (Klassifikationen wie Belletristik, Sachbuch, Ratgeber, etc., im KDP-Kategoriebaum-Stil) vor.
Falls keine Beschreibung/Idee vorliegt, leite die Kategorien kreativ aus dem Titel und Untertitel ab.
Antworte ausschließlich im JSON-Format mit folgender Struktur: { "categories": ["kategorie 1", "kategorie 2", ...] }.`;
    const userPrompt = `Titel: "${title}"\nUntertitel: "${subtitle}"\nBeschreibung/Idee: "${idea || '(Keine Idee angegeben, bitte komplett aus Titel/Unter-titel herleiten)'}"`;
    const responseText = await this.askAI(systemPrompt, userPrompt, true);
    try {
      let jsonText = responseText.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
      }
      const data = JSON.parse(jsonText);
      return Array.isArray(data.categories) ? data.categories : [];
    } catch (e) {
      console.error("Failed to parse categories JSON", e);
      return [];
    }
  }

  async rephraseText(text: string): Promise<string> {
    const systemPrompt = `Du bist ein professioneller Lektor. Formuliere den folgenden Text um, um den Lesefluss zu verbessern und Wiederholungen zu vermeiden. Behalte die ursprüngliche Bedeutung, den Ton und die Formatierung (wie Absätze, Zitate oder Aufzählungen) bei. Antworte ausschließlich mit dem überarbeiteten Text, ohne Einleitung, Kommentar oder Anführungszeichen.`;
    return (await this.askAI(systemPrompt, text, false)).trim();
  }

  async makeTextEmotional(text: string): Promise<string> {
    const systemPrompt = `Du bist ein kreativer Autor. Mache den folgenden Text emotional ansprechender, lebendiger und packender, während du die Kernaussage und Formatierung beibehältst. Antworte ausschließlich mit dem überarbeiteten Text, ohne Einleitung, Kommentar oder Anführungszeichen.`;
    return (await this.askAI(systemPrompt, text, false)).trim();
  }

  async shortenText(text: string, context?: { language?: string, chapterTitle?: string, pageFocus?: string, keyPoints?: string[], customGuidelines?: string }): Promise<string> {
    const langStr = context?.language === 'en' ? 'ENGLISH' : 'Deutsch';
    const systemPrompt = `Du bist ein professioneller Redakteur. Kürze den folgenden Text prägnant, um Platz zu sparen und Überlauf zu verhindern.
Die wichtigsten Details und Kernaussagen müssen erhalten bleiben.

Kontext zum Kapitel:
Titel: ${context?.chapterTitle || 'Unbekannt'}
Fokus: ${context?.pageFocus || 'Unbekannt'}
Wichtige Punkte: ${context?.keyPoints?.join(', ') || 'Keine'}

${context?.customGuidelines ? `RICHTLINIEN:\n${context.customGuidelines}\n` : ''}

Sprache der Antwort: ${langStr}
Antworte ausschließlich mit dem überarbeiteten Text, ohne Einleitung, Kommentar oder Anführungszeichen.`;
    return (await this.askAI(systemPrompt, text, false)).trim();
  }

  async spellcheckText(text: string): Promise<string> {
    const systemPrompt = `Du bist ein professioneller Korrektor. Korrigiere alle Rechtschreib-, Grammatik- und Zeichensetzungsfehler im folgenden Text. Nimm keine inhaltlichen oder stilistischen Änderungen vor, es sei denn, sie sind grammatikalisch falsch. Behalte die ursprüngliche Formatierung bei. Antworte ausschließlich mit dem korrigierten Text, ohne Einleitung, Kommentar oder Anführungszeichen.`;
    return (await this.askAI(systemPrompt, text, false)).trim();
  }

  async humanizeText(text: string): Promise<string> {
    const systemPrompt = `Du bist ein extrem fähiger Autor, der exakt wie ein Mensch schreibt. Deine Aufgabe ist es, diesen Text umzuschreiben, um JEDE KI-Erkennung (ZeroGPT etc.) zu umgehen. Verwende abwechslungsreichen Satzbau, streue subtil natürliche Ungenauigkeiten ein, benutze dynamische Rhythmen (kurze Sätze abwechselnd mit langen). VERMEIDE TYPISCHE KI-MUSTER WIE: 'Zusammenfassend lässt sich sagen', 'Es ist wichtig zu betonen', 'Tauchen wir ein'. Mach den Text locker, professionell und 100% menschlich. Behalte Absätze und Markdown-Tags (wie **bold** oder :::box) intakt. Antworte ausschließlich mit dem überarbeiteten Text, ohne Einleitung, Kommentar oder Anführungszeichen.`;
    return (await this.askAI(systemPrompt, text, false)).trim();
  }

  async evaluateRawJson(systemPrompt: string, userPrompt: string): Promise<string> {
    return (await this.askAI(systemPrompt, userPrompt, true)).trim();
  }

  async generateTitlePageOptions(
    title: string,
    plot: string,
    targetAudience: string,
    language: string = 'de'
  ): Promise<{ variante: 'A' | 'B' | 'C'; untertitel: string; verlagszeile: string }[]> {
    const systemPrompt = `Du erstellst Titelseiten-Text für ein Sachbuch.

Buchtitel: "${title}"
Thema/Plot: "${plot || '(Kein Thema angegeben, bitte aus Titel ableiten)'}"
Zielgruppe: ${targetAudience || 'KDP Leser'}

Generiere GENAU 3 unterschiedliche Varianten für die Titelseite. Jede Variante besteht aus:
1. Untertitel (max. 12 Wörter, prägnant, verkaufsstark)
2. Eine kurze "Veröffentlicht durch"-Zeile (max. 4 Wörter, z.B. Verlagsname-Stil)

Die 3 Varianten müssen sich klar unterscheiden im Ton:
- Variante A: Sachlich-autoritativ (wie ein Ratgeber von einem Experten)
- Variante B: Emotional-versprechend (Transformation/Ergebnis im Fokus)
- Variante C: Direkt-dringlich (Problem/Lösung zugespitzt)

Die Sprache der Ausgabe muss ${language === 'de' ? 'Deutsch' : 'ENGLISH (MUST BE ENGLISH)'} sein.

Antworte AUSSCHLIESSLICH als JSON-Array:
[
  {"variante": "A", "untertitel": "...", "verlagszeile": "..."},
  {"variante": "B", "untertitel": "...", "verlagszeile": "..."},
  {"variante": "C", "untertitel": "...", "verlagszeile": "..."}
]`;
    const userPrompt = `Generiere jetzt die 3 Varianten für das Buch "${title}".`;
    const responseText = await this.askAI(systemPrompt, userPrompt, true);
    try {
      let jsonText = responseText.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
      }
      const data = JSON.parse(jsonText);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("Failed to parse title page options JSON", e);
      return [];
    }
  }

  async condenseOutline(
    title: string,
    subtitle: string,
    idea: string,
    language: string,
    currentPages: BookOutlinePage[],
    guidelines: string = '',
    pagesText: { [key: number]: string } = {}
  ): Promise<BookOutlinePage[]> {

    // --- Step 1: collect unique chapters in order ---
    const uniqueChapters: { title: string, pageFocuses: string[], snippets: string[] }[] = [];
    
    for (const p of currentPages) {
      let chapterObj = uniqueChapters.find(c => c.title === p.chapter_title);
      if (!chapterObj) {
        chapterObj = { title: p.chapter_title, pageFocuses: [], snippets: [] };
        uniqueChapters.push(chapterObj);
      }
      chapterObj.pageFocuses.push(`S.${p.page_number} (${p.focus})`);
      
      const pText = pagesText[p.page_number];
      if (pText && pText.trim().length > 0) {
        // Grab first ~100 chars of text to give AI a sense of what's inside (keeps prompt small/fast)
        const plainText = pText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (plainText) {
          chapterObj.snippets.push(`S.${p.page_number}: ${plainText.substring(0, 100)}...`);
        }
      }
    }
    const numOriginal = uniqueChapters.length;

    // Target: We want the TOC to fit on exactly 1 page.
    // Each chapter should have a healthy length of 3 to 20 pages.
    const totalPages = currentPages.length;
    const targetChapters = Math.max(3, Math.min(8, Math.min(numOriginal, Math.round(totalPages / 12))));

    const lang = language === 'de' ? 'Deutsch' : 'ENGLISH (CRITICAL: ALL TITLES MUST BE IN ENGLISH)';

  const systemPrompt = `Du bist ein professioneller Bucheditor. Das Buch heißt "${title}" (${subtitle}), Thema: "${idea}".
Du bekommst eine Liste der aktuellen Kapitel mit ihren Fokuspunkten und kurzen Textausschnitten.
DEINE AUFGABE: Fasse diese ${numOriginal} Kapitel in exakt ${targetChapters} neue Oberkapitel zusammen.
Das Ziel ist es, dass das Inhaltsverzeichnis übersichtlich ist, auf exakt EINE Seite passt und jedes Kapitel eine gesunde Länge von 3 bis 20 Seiten hat.

${guidelines ? `ZIELGRUPPE & RICHTLINIEN:\n${guidelines}\n` : ''}
Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt dieses Formats – kein Markdown, kein Kommentar:
{
  "chapters": [
    {
      "new_chapter_title": "Name des neuen Kapitels (${lang})",
      "new_focus": "Kurze Zusammenfassung was dieses Kapitel abdeckt (${lang})",
      "original_chapters": ["Exakter Kapiteltitel 1", "Exakter Kapiteltitel 2", ...]
    }
  ]
}
Regeln:
- Jedes original_chapters-Element muss EXAKT einem titel aus der Eingabeliste entsprechen.
- Jeder original-Titel muss in genau einer Gruppe vorkommen.
- Die Gruppen MÜSSEN aus direkt aufeinanderfolgenden Kapiteln (in der exakten Reihenfolge der Eingabeliste) bestehen. Es ist strengstens verboten, nicht-aufeinanderfolgende Kapitel zusammenzufassen!
- Jedes neu erstellte Kapitel MUSS eine Länge von 3 bis 20 Seiten umfassen.
- Erstelle EXAKT ${targetChapters} Kapitel-Gruppen in deiner Antwort.`;

    const userPrompt = `Aktuelle Kapitel (in Reihenfolge):\n\n${uniqueChapters.map((c, i) => {
      let pString = `${i + 1}. TITEL: ${c.title}\n   SEITEN & FOKUS-INFOS:\n   - ${c.pageFocuses.join('\n   - ')}`;
      if (c.snippets.length > 0) {
        pString += `\n   TEXT-AUSSCHNITTE: ${c.snippets.join(' | ')}`;
      }
      return pString;
    }).join('\n\n')}`;

    try {
      const response = await this.askAI(systemPrompt, userPrompt, true);
      let jsonText = response.trim();
      const match = jsonText.match(/\{[\s\S]*\}/);
      if (match) {
        jsonText = match[0];
      }
      const parsedData = JSON.parse(jsonText);
      
      let mergeMap: any[] = [];
      if (Array.isArray(parsedData)) {
        mergeMap = parsedData;
      } else if (parsedData && typeof parsedData === 'object') {
        if (Array.isArray(parsedData.chapters)) {
          mergeMap = parsedData.chapters;
        } else {
          const firstArray = Object.values(parsedData).find(Array.isArray);
          if (firstArray) mergeMap = firstArray;
        }
      }

      if (!Array.isArray(mergeMap) || mergeMap.length === 0) {
        return currentPages;
      }

      // --- Step 2: build a lookup from old chapter title → new chapter info ---
      const remapTitle: { [normalizedOld: string]: string } = {};
      const remapFocus: { [normalizedOld: string]: string } = {};

      const normalize = (s: string) => (s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

      const getSimilarityScore = (s1: string, s2: string): number => {
        const norm1 = normalize(s1);
        const norm2 = normalize(s2);
        if (norm1 === norm2) return 1.0;
        if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.8;
        
        // Simple Jaccard similarity index based on character bigrams
        const getBigrams = (str: string) => {
          const bigrams = new Set<string>();
          for (let i = 0; i < str.length - 1; i++) {
            bigrams.add(str.slice(i, i + 2));
          }
          return bigrams;
        };
        const b1 = getBigrams(norm1);
        const b2 = getBigrams(norm2);
        const intersection = new Set([...b1].filter(x => b2.has(x)));
        const union = new Set([...b1, ...b2]);
        if (union.size === 0) return 0;
        return intersection.size / union.size;
      };

      for (const group of mergeMap) {
        if (!group || typeof group !== 'object') continue;
        
        const newTitle = group.new_chapter_title || group.title || group.new_title || '';
        const newFocus = group.new_focus || group.focus || '';
        let originalChapters = group.original_chapters || group.original || group.chapters || [];
        
        if (typeof originalChapters === 'string') {
          originalChapters = [originalChapters];
        }

        if (Array.isArray(originalChapters)) {
          for (const orig of originalChapters) {
            if (orig && typeof orig === 'string') {
              let bestMatch = '';
              let highestScore = 0;
              
              for (const ch of uniqueChapters) {
                const score = getSimilarityScore(orig, ch.title);
                if (score > highestScore) {
                  highestScore = score;
                  bestMatch = ch.title;
                }
              }
              
              if (highestScore > 0.4) {
                const normMatch = normalize(bestMatch);
                remapTitle[normMatch] = newTitle;
                remapFocus[normMatch] = newFocus;
              }
            }
          }
        }
      }

      // Sequential gap filling fallback
      let lastKnownTitle = '';
      for (let i = 0; i < uniqueChapters.length; i++) {
        const norm = normalize(uniqueChapters[i].title);
        if (remapTitle[norm]) {
          lastKnownTitle = remapTitle[norm];
        } else if (lastKnownTitle) {
          remapTitle[norm] = lastKnownTitle;
        }
      }
      
      let nextKnownTitle = '';
      for (let i = uniqueChapters.length - 1; i >= 0; i--) {
        const norm = normalize(uniqueChapters[i].title);
        if (remapTitle[norm]) {
          nextKnownTitle = remapTitle[norm];
        } else if (nextKnownTitle) {
          remapTitle[norm] = nextKnownTitle;
        }
      }

      // --- Step 3: apply remapping to every page ---
      const remapped: BookOutlinePage[] = currentPages.map(p => {
        const normTitle = normalize(p.chapter_title);
        const newTitle = remapTitle[normTitle] ?? p.chapter_title;
        return {
          ...p,
          chapter_title: newTitle,
        };
      });

      return this.ensureUniqueAndContiguousChapters(remapped, language);
    } catch (e) {
      console.error('Failed to condense outline', e);
      return this.ensureUniqueAndContiguousChapters(currentPages, language);
    }
  }

  /**
   * Reads the actual generated pages content and uses AI to recreate chapter titles and assignments
   * for the Table of Contents, matching the flow of topics in the pages.
   */
  async regenerateChaptersFromPages(
    outline: BookOutline,
    pagesText: { [key: number]: string },
    guidelines: string = ''
  ): Promise<BookOutlinePage[]> {
    // 1. Gather all pages that have text
    const pagesWithText = Object.entries(pagesText)
      .map(([num, text]) => ({ number: Number(num), text }))
      .filter(p => p.number > 0 && p.text.trim().length > 0)
      .sort((a, b) => a.number - b.number);

    if (pagesWithText.length === 0) {
      throw new Error('Kein Seiteninhalt vorhanden zum Analysieren.');
    }

    // Calculate a dynamic snippet size to guarantee the total prompt size is tiny (staying well within the 6000 TPM limit)
    const maxSnippetLength = Math.max(30, Math.floor(3000 / pagesWithText.length));

    // 2. Prepare text content representation for the prompt (compacted to fit context limit safely)
    const contentSummary = pagesWithText.map(p => {
      const cleanText = p.text.replace(/\s+/g, ' ').trim();
      
      // Extract headings (e.g. # Chapter, ## Section) to give AI high-quality structure context
      const lines = p.text.split('\n').map(l => l.trim());
      const headings = lines.filter(l => l.startsWith('#')).join(' | ');
      
      // Dynamic compact text part
      const textPart = cleanText.length > maxSnippetLength 
        ? `${cleanText.slice(0, maxSnippetLength)}...` 
        : cleanText;
      
      const summary = headings ? `[Überschriften: ${headings}] ${textPart}` : textPart;
      return `[Seite ${p.number}]: "${summary}"`;
    }).join('\n');

    const systemPrompt = `Du bist ein erfahrener Buch-Redakteur. Deine Aufgabe ist es, das Inhaltsverzeichnis (die Kapitel) eines Buches komplett neu zu strukturieren und zu benennen.
Dazu liest du Ausschnitte/Inhalte aller Seiten des Buches durch.

${guidelines ? `ZIELGRUPPE & RICHTLINIEN:\n${guidelines}\n` : ''}
Analysiere den inhaltlichen Fluss der Seiten und teile das Buch in sinnvolle Kapitel ein.
Ziele:
1. Erstelle aussagekräftige, professionelle Kapitelnamen (keine langweiligen Standardtitel, sondern ansprechend).
2. Gruppiere aufeinanderfolgende Seiten logisch in Kapitel.
3. Behalte die exakte Seitenstruktur bei (das Buch hat weiterhin dieselbe Gesamtzahl an Seiten).
4. Gib eine JSON-Struktur zurück, die die neuen Kapitel und deren Seitenbereiche definiert.

WICHTIG: Antworte AUSSCHLIESSLICH im folgenden JSON-Format (kein Markdown-Wrapper, kein Kommentar vor oder nach dem JSON):
{
  "chapters": [
    {
      "chapter_number": 1,
      "chapter_title": "Kapitelüberschrift 1",
      "start_page": 1,
      "end_page": 4
    },
    {
      "chapter_number": 2,
      "chapter_title": "Kapitelüberschrift 2",
      "start_page": 5,
      "end_page": 8
    }
  ]
}`;

    const userPrompt = `Buchtitel: "${outline.title}"
Untertitel: "${outline.subtitle || ''}"
Sprache des Buches: ${outline.language === 'de' ? 'Deutsch' : 'Englisch'}

Hier sind die Textinhalte aller Seiten des Buches:
${contentSummary}

Erstelle daraus das optimierte Inhaltsverzeichnis. Jedes Kapitel MUSS mindestens 1 Seite enthalten. Alle Seiten von Seite 1 bis Seite ${pagesWithText[pagesWithText.length - 1].number} müssen lückenlos abgedeckt sein.`;

    try {
      const responseText = await this.askAI(systemPrompt, userPrompt, true, 90000);
      let jsonText = responseText.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
      }
      const data = JSON.parse(jsonText);

      if (!data.chapters || !Array.isArray(data.chapters)) {
        throw new Error('Ungültiges Antwortformat von der KI.');
      }

      // Re-map the active outline pages based on these chapter boundaries
      const newPages = outline.pages.map(p => ({ ...p }));
      
      data.chapters.forEach((ch: any) => {
        const start = Number(ch.start_page);
        const end = Number(ch.end_page);
        const title = ch.chapter_title;
        const num = Number(ch.chapter_number);

        for (let i = 0; i < newPages.length; i++) {
          const p = newPages[i];
          if (p.page_number >= start && p.page_number <= end) {
            newPages[i].chapter_number = num;
            newPages[i].chapter_title = title;
          }
        }
      });

      return this.ensureUniqueAndContiguousChapters(newPages, outline.language);
    } catch (err) {
      console.error('Failed to regenerate chapters from pages content:', err);
      throw err;
    }
  }

  async translateText(text: string, targetLang: 'de' | 'en'): Promise<string> {
    const src = targetLang === 'de' ? 'English' : 'German';
    const tgt = targetLang === 'de' ? 'German' : 'English';
    const systemPrompt = `You are a professional book translator. Translate the following text from ${src} to ${tgt}. Ensure the tone is natural, professional, and captures the original meaning. Retain any styling elements (like markdown bolding, lists, headings, html tags) exactly as they are. Antworte ausschließlich mit der Übersetzung, ohne Einleitung, Meta-Kommentar oder zusätzliche Formatierung.`;
    return (await this.askAI(systemPrompt, text, false)).trim();
  }

  async translateOutline(pages: BookOutlinePage[], targetLang: 'de' | 'en'): Promise<BookOutlinePage[]> {
    const src = targetLang === 'de' ? 'English' : 'German';
    const tgt = targetLang === 'de' ? 'German' : 'English';
    const systemPrompt = `Du bist ein professioneller Buchübersetzer. Übersetze alle Textinhalte der folgenden Buchgliederung von ${src} ins ${tgt}e.
Übersetze ausschließlich die Werte für "chapter_title", "focus" und "key_points". Lass "page_number" und alle JSON-Schlüssel unverändert.
Antworte AUSSCHLIESSLICH mit dem übersetzten JSON-Array. Verwende keine zusätzlichen Erklärungen, Markdown-Tags oder Kommentare.`;

    const userPrompt = JSON.stringify(pages, null, 2);
    try {
      const response = await this.askAI(systemPrompt, userPrompt, true);
      let jsonText = response.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
      }
      const translated = JSON.parse(jsonText);
      if (Array.isArray(translated)) {
        return translated;
      }
      throw new Error("Antwort ist kein JSON-Array");
    } catch (err) {
      console.warn("Batch outline translation failed, falling back to page-by-page translation:", err);
      const result: BookOutlinePage[] = [];
      const delayMs = this.getProvider() === 'groq' ? 2500 : 4500;
      for (const page of pages) {
        await new Promise(r => setTimeout(r, delayMs));
        const translatedTitle = await this.translateText(page.chapter_title, targetLang);
        const translatedFocus = await this.translateText(page.focus, targetLang);
        const translatedPoints = await Promise.all(
          page.key_points.map(pt => this.translateText(pt, targetLang))
        );
        result.push({
          page_number: page.page_number,
          chapter_title: translatedTitle,
          focus: translatedFocus,
          key_points: translatedPoints
        });
      }
      return result;
    }
  }

  async translateToEnglish(text: string): Promise<string> {
    return this.translateText(text, 'en');
  }

  async translateOutlinePages(
    pages: BookOutlinePage[]
  ): Promise<BookOutlinePage[]> {
    return this.translateOutline(pages, 'en');
  }

  /**
   * GIL 2.0: QualityScorer
   * Bewertet den generierten Text auf einer Skala von 1-10 basierend auf Klarheit, Lesefluss und Mehrwert.
   */
  async scoreChapterQuality(text: string): Promise<number> {
    const systemPrompt = `Du bist ein strenger Lektor. Bewerte den folgenden Text auf einer Skala von 1 bis 10.
Kriterien:
- Klarheit (Ist der Text verständlich?)
- Lesefluss (Ist der Satzbau abwechslungsreich und fließend?)
- Mehrwert (Bietet der Text echte Informationen oder nur Füllwörter?)

Antworte AUSSCHLIESSLICH mit einer Zahl zwischen 1 und 10. Keine anderen Zeichen.`;
    
    const userPrompt = `Bewerte diesen Text:\n\n${text.substring(0, 2000)}`;
    
    try {
      const result = await this.askAI(systemPrompt, userPrompt, false);
      const score = parseInt(result.trim(), 10);
      if (!isNaN(score) && score >= 1 && score <= 10) return score;
      return 5; // Default/Fallback
    } catch (e) {
      console.error('QualityScorer failed:', e);
      return 5;
    }
  }
}

