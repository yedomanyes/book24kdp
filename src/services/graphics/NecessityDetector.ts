import type { GraphicDecision } from '../../types/graphics';

export class NecessityDetector {
  /**
   * Erzeugt den strikten JSON-Prompt zur Analyse von KDP-Kapiteltexten.
   */
  public static buildAnalysisPrompt(chapterText: string, pagesSinceLastGraphic: number, language: string = 'de'): string {
    let strictnessHint = "";
    if (pagesSinceLastGraphic <= 2) {
      strictnessHint = "\nHINWEIS ZUR DICHTE: Es wurde erst vor kurzem eine Grafik platziert. Sei SEHR STRENG. Antworte nur dann mit true, wenn eine Tabelle oder ein Ablaufdiagramm für das Verständnis absolut unverzichtbar ist!";
    } else if (pagesSinceLastGraphic >= 7) {
      strictnessHint = "\nHINWEIS ZUR DICHTE: Seit vielen Seiten gab es keine Visualisierung. Sei GROSSZÜGIGER. Wenn der Text auch nur leichte Phasen oder Vergleiche aufweist, wähle eine Grafik!";
    }

    const langRule = language === 'en'
      ? "\nCRITICAL LANGUAGE REQUIREMENT: The chapter text is in ENGLISH. ALL generated text inside the JSON (titel, spalten, zeilen, schritte, punkte, ereignis, ebenen) MUST BE WRITTEN IN ENGLISH ONLY! DO NOT USE GERMAN WORDS AT ALL!"
      : "\nSPRACH-REGEL: Der Kapiteltext ist auf DEUTSCH. Alle Inhalte der JSON-Antwort müssen auf Deutsch formuliert sein.";

    return `Du analysierst einen Kapitelabschnitt und entscheidest, ob eine visuelle Grafik sinnvoll ist.

KAPITELTEXT:
"${chapterText}"

SCHRITT 1 – Prüfe: Enthält dieser Text eine der folgenden Strukturen?
a) Vergleich zwischen 2+ Konzepten/Optionen mit gemeinsamen Eigenschaften
b) Eine klare Abfolge von Schritten oder Phasen
c) Einen zeitlichen Verlauf
d) Eine Hierarchie oder Über-/Unterordnung von Konzepten

Falls NEIN auf alle vier: Antworte ausschließlich mit {"grafik_sinnvoll": false}

Falls JA: Antworte als JSON in folgendem Format (wähle den passenden "typ"):

Für Vergleichstabelle:
{
  "grafik_sinnvoll": true,
  "typ": "tabelle",
  "titel": "...",
  "spalten": ["...", "..."],
  "zeilen": [["...", "..."], ["...", "..."]]
}

Für Prozess-/Flow-Diagramm:
{
  "grafik_sinnvoll": true,
  "typ": "prozess",
  "titel": "...",
  "schritte": ["Schritt 1 Text", "Schritt 2 Text", "Schritt 3 Text"]
}

Für Timeline:
{
  "grafik_sinnvoll": true,
  "typ": "timeline",
  "titel": "...",
  "punkte": [{"zeitpunkt": "...", "ereignis": "..."}]
}

Für Hierarchie:
{
  "grafik_sinnvoll": true,
  "typ": "hierarchie",
  "titel": "...",
  "ebenen": ["Oberste Ebene", "Mittlere Ebene", "Unterste Ebene"]
}
${strictnessHint}${langRule}

WICHTIG: Erfinde keine Fakten/Zahlen, die nicht im Kapiteltext stehen. Nutze ausschließlich Informationen, die im Text bereits vorkommen – die Grafik visualisiert nur, was schon da steht, sie fügt nichts Neues hinzu. Antworte ausschließlich mit gültigem JSON!`;
  }

  /**
   * Parst die LLM JSON-Antwort und validiert sie gegen Halluzinationen.
   */
  public static parseAndValidateDecision(jsonStr: string, _chapterText: string): GraphicDecision {
    if (!jsonStr || !jsonStr.trim()) {
      return { grafik_sinnvoll: false };
    }

    try {
      const cleanJson = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed: GraphicDecision = JSON.parse(cleanJson);

      if (!parsed.grafik_sinnvoll) {
        return { grafik_sinnvoll: false };
      }

      // Normalisiere Top-Level Felder der KI-Antwort
      const pAny = parsed as any;
      if (parsed.typ === 'tabelle') {
        parsed.tabelle = parsed.tabelle || { spalten: pAny.spalten, zeilen: pAny.zeilen };
        if (!parsed.tabelle?.spalten || !parsed.tabelle?.zeilen || parsed.tabelle.zeilen.length === 0) {
          return { grafik_sinnvoll: false };
        }
      } else if (parsed.typ === 'prozess') {
        parsed.prozess = parsed.prozess || { schritte: pAny.schritte };
        if (!parsed.prozess?.schritte || parsed.prozess.schritte.length < 2) {
          return { grafik_sinnvoll: false };
        }
      } else if (parsed.typ === 'timeline') {
        parsed.timeline = parsed.timeline || { punkte: pAny.punkte };
        if (!parsed.timeline?.punkte || parsed.timeline.punkte.length === 0) {
          return { grafik_sinnvoll: false };
        }
      } else if (parsed.typ === 'hierarchie') {
        parsed.hierarchie = parsed.hierarchie || { ebenen: pAny.ebenen };
        if (!parsed.hierarchie?.ebenen || parsed.hierarchie.ebenen.length < 2) {
          return { grafik_sinnvoll: false };
        }
      }

      return {
        ...parsed,
        selectedVariant: parsed.typ === 'prozess' ? 'horizontal' : undefined,
        pipeline: 'A'
      };
    } catch (err) {
      console.warn("NecessityDetector JSON Parse Fehler:", err);
      return { grafik_sinnvoll: false };
    }
  }

  /**
   * Simuliert oder führt die Dichteprüfung autonom durch.
   */
  public static evaluateDensityPlacement(
    pageNum: number,
    pagesGraphic: { [num: number]: GraphicDecision } = {}
  ): number {
    const graphicPageNums = Object.keys(pagesGraphic)
      .map(Number)
      .filter(n => pagesGraphic[n]?.grafik_sinnvoll && n < pageNum);

    if (graphicPageNums.length === 0) {
      return pageNum; // Seiten seit Start
    }

    const lastGraphicPage = Math.max(...graphicPageNums);
    return pageNum - lastGraphicPage;
  }
}
