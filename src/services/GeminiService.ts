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

export class GeminiService {
  private groqKeys: string[] = [];
  private geminiKeys: string[] = [];
  private model: string;

  constructor(
    apiKeys: string | { groq?: string[]; gemini?: string[] } | string[],
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
    }
  }

  private getProvider(): 'groq' | 'gemini' {
    if (this.model.startsWith('gemini-')) {
      return 'gemini';
    }
    return 'groq';
  }

  private async executeWithKeyRotation(
    provider: 'groq' | 'gemini',
    requestFn: (key: string) => Promise<Response>
  ): Promise<any> {
    const keys = provider === 'groq' ? this.groqKeys : this.geminiKeys;
    if (keys.length === 0) {
      throw new Error(`Keine API-Schlüssel für ${provider.toUpperCase()} konfiguriert.`);
    }

    let lastError: any = null;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      let attempts = 0;
      const maxAttempts = 5;

      while (attempts < maxAttempts) {
        try {
          const response = await requestFn(key);
          
          // Handle 429 Rate Limit
          if (response.status === 429) {
            attempts++;
            if (attempts < maxAttempts) {
              // Groq enforces per-minute token limits – wait longer before retry
              const waitTime = provider === 'groq' ? attempts * 15000 : attempts * 5000;
              console.warn(`${provider.toUpperCase()} Key #${i + 1} hat ein Rate Limit erreicht (429). Warte ${waitTime / 1000}s vor erneutem Versuch (Versuch ${attempts} von ${maxAttempts - 1})...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }
            console.warn(`${provider.toUpperCase()} Key #${i + 1} hat nach ${maxAttempts} Versuchen immer noch ein Rate Limit (429). Probiere nächsten Key...`);
            lastError = new Error(`Key #${i + 1} ausgelastet (429).`);
            break; // Break attempt loop, move to next key
          }

          if (!response.ok) {
            const errText = await response.text();
            let errorMessage = errText;
            try {
              const parsed = JSON.parse(errText);
              errorMessage = parsed.error?.message || errText;
            } catch (e) {}

            const lowerMsg = errorMessage.toLowerCase();
            if (
              lowerMsg.includes('rate limit') || 
              lowerMsg.includes('quota') || 
              lowerMsg.includes('exceeded') || 
              lowerMsg.includes('429') ||
              lowerMsg.includes('tpm') ||
              lowerMsg.includes('tokens per minute') ||
              lowerMsg.includes('too large') ||
              lowerMsg.includes('reduce your message size')
            ) {
              attempts++;
              if (attempts < maxAttempts) {
                const waitTime = provider === 'groq' ? attempts * 15000 : attempts * 5000;
                console.warn(`${provider.toUpperCase()} Key #${i + 1} Quoten-, Rate- oder TPM-Limit überschritten. Warte ${waitTime / 1000}s vor erneutem Versuch...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
              }
              console.warn(`${provider.toUpperCase()} Key #${i + 1} Limit überschritten. Probiere nächsten Key...`);
              lastError = new Error(`Key #${i + 1} Limit überschritten: ${errorMessage}`);
              break;
            }

            throw new Error(errorMessage);
          }

          const data = await response.json();
          return data; // Success!
        } catch (err: any) {
          console.error(`${provider.toUpperCase()} Key #${i + 1} Fehler (Versuch ${attempts + 1}):`, err);
          lastError = err;
          attempts++;
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          break;
        }
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
    onProgress?: (progress: number, message: string) => void
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
Sprache des Buches: "${language === 'de' ? 'Deutsch' : 'Englisch'}"
Ziel-Seitenzahl: ${targetPages} (Das generierte JSON MUSS exakt ${targetPages} Seiten in der Liste haben, durchnummeriert von 1 bis ${targetPages}).`;

    if (safeGuidelines && safeGuidelines.trim()) {
      prompt += `\n\nFolgende Autoren-Richtlinien und Stil-Vorgaben müssen beim Entwurf der Gliederung und der einzelnen Seiten-Fokuspunkte strikt berücksichtigt werden:\n"${safeGuidelines}"`;
    }

    prompt += `\n\nFür jede einzelne Seite des Buches (von Seite 1 bis Seite ${targetPages}) musst du festlegen, worum es auf dieser Seite geht. Jede Seite sollte einen klaren Fokus haben, damit es keine Dopplungen gibt und das Buch logisch aufgebaut ist. Um einen tiefgehenden Inhalt zu garantieren, plane pro Seite detaillierte stichpunktartige Key Points (in "key_points"), die genau beschreiben, welche Argumente oder Szenen ausgeführt werden sollen.

STRIKTE REGEL FÜR DIE KAPITELTITEL (chapter_title):
- Keine zwei Kapitelüberschriften dürfen dieselbe Satzstruktur verwenden.
- Es ist streng verboten, mehr als 2x im gesamten Buch mit Phrasen wie "Die Rolle von...", "Die Bedeutung von..." oder "Die Bedeutung von... bei..." zu beginnen.
- Du MUSS eine große sprachliche Vielfalt anwenden und bewusst zwischen folgenden Titel-Typen variieren (jeder Typ muss mindestens einmal vorkommen, aber kein Typ mehr als 3x):
  * Direkte Aussage (z. B. "Warum Glücksspiel das Gehirn umprogrammiert")
  * Frage (z. B. "Was passiert, wenn der Kick verschwindet?")
  * Prozess/Schritt (z. B. "Der erste Tag ohne Wette")
  * Kontrast (z. B. "Kontrolle vs. Kontrollverlust")
  * Praktisch/Anleitung (z. B. "Drei Wege aus der Spirale")
  * Persönlich/Fallbezogen (z. B. "Wenn die Familie es zuerst merkt")
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
      "focus": "Der exakte Inhaltsschwerpunkt dieser einzelnen Seite",
      "key_points": ["Wichtiger Punkt 1", "Wichtiger Punkt 2", "Wichtiger Punkt 3"]
    },
    ...
  ]
}
Stelle sicher, dass die "pages"-Liste EXAKT ${targetPages} Einträge enthält!`;

    const provider = this.getProvider();
    let data: any;

    if (provider === 'groq') {
      // Groq has a ~4096 token output limit which truncates large outlines.
      // We split into chunks of 25 pages and merge the results.
      const CHUNK_SIZE = 25;
      const allPages: BookOutlinePage[] = [];

      for (let start = 1; start <= targetPages; start += CHUNK_SIZE) {
        const end = Math.min(start + CHUNK_SIZE - 1, targetPages);
        const chunkSize = end - start + 1;

        if (onProgress) {
          const progressPercent = Math.round(((start - 1) / targetPages) * 100);
          onProgress(progressPercent, `Generiere Seiten ${start} bis ${end} von ${targetPages}...`);
        }

        const chunkPrompt = `Du bist ein professioneller Buch-Redakteur. Erstelle die Seiten-Planung für folgendes Buch.
Buchtitel: "${title}"
Untertitel: "${subtitle}"
Hauptidee/Beschreibung: "${safeIdea}"
Sprache des Buches: "${language === 'de' ? 'Deutsch' : 'Englisch'}"
Das Buch hat insgesamt ${targetPages} Seiten. Du planst jetzt NUR die Seiten ${start} bis ${end} (${chunkSize} Seiten).
${safeGuidelines && safeGuidelines.trim() ? `\nAutoren-Richtlinien: "${safeGuidelines}"\n` : ''}

STRIKTE REGEL FÜR DIE KAPITELTITEL (chapter_title):
- Keine zwei Kapitelüberschriften dürfen dieselbe Satzstruktur verwenden.
- Es ist streng verboten, mehr als 2x im gesamten Buch mit Phrasen wie "Die Rolle von...", "Die Bedeutung von..." oder "Die Bedeutung von... bei..." zu beginnen.
- Du MUSS eine große sprachliche Vielfalt anwenden und bewusst zwischen folgenden Titel-Typen variieren (jeder Typ muss mindestens einmal vorkommen, aber kein Typ mehr als 3x):
  * Direkte Aussage (z. B. "Warum Glücksspiel das Gehirn umprogrammiert")
  * Frage (z. B. "Was passiert, wenn der Kick verschwindet?")
  * Prozess/Schritt (z. B. "Der erste Tag ohne Wette")
  * Kontrast (z. B. "Kontrolle vs. Kontrollverlust")
  * Praktisch/Anleitung (z. B. "Drei Wege aus der Spirale")
  * Persönlich/Fallbezogen (z. B. "Wenn die Familie es zuerst merkt")
Prüfe vor dem Generieren: Gibt es zwei Titel, die mit denselben ersten 3 Wörtern beginnen oder dieselbe Struktur "X bei der Y" wiederholen? Falls ja, formuliere sie um.

Antworte ausschließlich im JSON-Format:
{
  "pages": [
    {
      "page_number": ${start},
      "chapter_title": "Kapitel-Überschrift",
      "focus": "Inhaltsschwerpunkt dieser Seite",
      "key_points": ["Punkt 1", "Punkt 2", "Punkt 3"]
    },
    ...
  ]
}
Die "pages"-Liste muss EXAKT ${chunkSize} Einträge enthalten, mit page_number von ${start} bis ${end}!`;

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
                { role: 'system', content: 'Du bist ein nützlicher Assistent, der ausschließlich im JSON-Format antwortet.' },
                { role: 'user', content: chunkPrompt }
              ],
              response_format: { type: 'json_object' },
              temperature: 0.3,
              max_tokens: 2048
            })
          })
        );

        const chunkText = data.choices[0].message.content;
        let chunkJson: any;
        try {
          chunkJson = JSON.parse(chunkText);
        } catch (e) {
          throw new Error(`Outline-Chunk ${start}-${end} konnte nicht als JSON geparst werden.`);
        }

        const chunkPages: BookOutlinePage[] = chunkJson.pages || [];
        if (chunkPages.length === 0) {
          throw new Error(`Outline-Chunk ${start}-${end} enthält keine Seiten.`);
        }
        allPages.push(...chunkPages);

        // Small delay between chunks to avoid rate limiting
        if (end < targetPages) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      return {
        title,
        subtitle,
        language,
        target_pages: targetPages,
        pages: allPages
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
        })
      );
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error(`Gemini hat keine Textantwort zurückgegeben (Sicherheitsblock oder leerer Inhalt).`);
      }
      let jsonText = data.candidates[0].content.parts[0].text.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
      }
      return JSON.parse(jsonText) as BookOutline;
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
Sprache: "${language === 'de' ? 'Deutsch' : 'Englisch'}"
Das Buch hat insgesamt ${totalPages} Seiten. Die Seiten 1 bis ${startPage - 1} wurden bereits geplant.

Die letzten bereits geplanten Seiten waren:
${lastExistingPagesContext}

SETZE NAHTLOS FORT. Plane jetzt NUR die Seiten ${startPage} bis ${endPage} (${chunkSize} Seiten).
VERMEIDE Wiederholungen oder Dopplungen der bereits geplanten Inhalte.
${customGuidelines ? `\nRichtlinien: "${customGuidelines}"\n` : ''}

STRIKTE REGEL FÜR DIE KAPITELTITEL (chapter_title):
- Keine zwei Kapitelüberschriften dürfen dieselbe Satzstruktur verwenden.
- Es ist streng verboten, mehr als 2x im gesamten Buch mit Phrasen wie "Die Rolle von...", "Die Bedeutung von..." oder "Die Bedeutung von... bei..." zu beginnen.
- Du MUSS eine große sprachliche Vielfalt anwenden und bewusst zwischen folgenden Titel-Typen variieren (jeder Typ muss mindestens einmal vorkommen, aber kein Typ mehr als 3x):
  * Direkte Aussage (z. B. "Warum Glücksspiel das Gehirn umprogrammiert")
  * Frage (z. B. "Was passiert, wenn der Kick verschwindet?")
  * Prozess/Schritt (z. B. "Der erste Tag ohne Wette")
  * Kontrast (z. B. "Kontrolle vs. Kontrollverlust")
  * Praktisch/Anleitung (z. B. "Drei Wege aus der Spirale")
  * Persönlich/Fallbezogen (z. B. "Wenn die Familie es zuerst merkt")
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

    if (provider === 'groq') {
      const data = await this.executeWithKeyRotation('groq', (key) =>
        fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
          body: JSON.stringify({
            model: this.model,
            messages: [
              { role: 'system', content: 'Du bist ein nützlicher Assistent, der ausschließlich im JSON-Format antwortet.' },
              { role: 'user', content: chunkPrompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: 2048
          })
        })
      );
      const parsed = JSON.parse(data.choices[0].message.content);
      return parsed.pages || [];
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
        })
      );
      let jsonText = data.candidates[0].content.parts[0].text.trim();
      if (jsonText.startsWith('```')) jsonText = jsonText.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(jsonText);
      return parsed.pages || [];
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

    const systemPrompt = `Du bist ein professioneller Sachbuchautor. Schreibe ausschließlich auf ${lang}.
Du schreibst NUR den Eröffnungsabsatz (3-5 Sätze) für ein Kapitel.

PFLICHT-STILTECHNIK FÜR DIESEN ABSATZ: ${style.name}
(Beschreibung der Technik: ${style.description})

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
    const lang = outline.language === 'de' ? 'Deutsch (korrekte Rechtschreibung und Grammatik)' : 'Englisch';

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

    const systemPrompt = `Du bist ein professioneller Buchautor. Du schreibst im Stil: "${writingStyle}".
Sprache: ${lang}.

Du schreibst die FORTSETZUNG von Kapitel "${chapterTitle}" nach einem bereits feststehenden Eröffnungsabsatz.

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
    customGuidelines: string = ''
  ): Promise<string> {
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
Der allerletzte Satz / die letzten Sätze der vorherigen Seite waren:
"${lastSentences}"
Setze den Text absolut nahtlos fort. Der allererste Satz dieser neuen Seite ${pageNumber} MUSS grammatikalisch und logisch an diesen Gedanken anknüpfen, ohne ein neues Kapitel einzuleiten oder das Thema abrupt zu wechseln.`;
    }

    // Mathematische Berechnung der optimalen Wortanzahl basierend auf dem Seitenformat und der Schriftgröße,
    // um die Seite optimal zu füllen und gleichzeitig ein Überlaufen (Abschneiden) zu verhindern.
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
Deine Sprache ist exakt: ${outline.language === 'de' ? 'Deutsch (korrekte Rechtschreibung und Grammatik)' : 'Englisch'}.
Achte peinlich genau auf folgende Regeln:
1. Verwende KEINE urheberrechtlich geschützten Inhalte oder geschützten Charaktere. Historische Zitate oder Zitate bekannter Persönlichkeiten sind zulässig, sofern sie gemeinfrei/legal sind. Setze Zitate sehr sparsam ein (maximal ein Zitat pro Kapitel). Jedes Zitat MUSS in einer eigenen Zeile stehen, eingeleitet mit "> ", und MUSS am Ende immer eine Autorenangabe enthalten (Format: — Vorname Nachname). Beispiele:
> "Wissen ist Macht." — Francis Bacon
> "Das Leben ist kurz, die Kunst ist lang." — Hippokrates
EIN ZITAT OHNE — AUTORENANGABE AM ENDE IST VERBOTEN.
2. Vermeide jegliche Wiederholungen von Fakten, Ausdrücken oder Ideen, die bereits auf den vorherigen Seiten stehen.
3. Formatiere den Text lesbar. Verwende Absätze. Verwende KEINE Markdown-Überschriften (wie # oder ##) oder Sternchen (wie **fett**). Einzige Ausnahme sind Zitate, die mit "> " beginnen. Überschriften werden vom Layout-System automatisch eingefügt.
4. Generiere exakt die Länge für eine Buchseite (ca. ${minWords} bis ${maxWords} Wörter). Es ist EXTREM WICHTIG, dass du die Seite visuell fast vollständig mit Text ausfüllst. Schreibe lieber etwas mehr als zu wenig, aber bleibe knapp unter dem Limit, um Überläufe im KDP-Buchdruck zu vermeiden. Beende den Text nicht mitten im Satz, sondern führe den Gedanken auf dieser Seite zu Ende.
6. Vermeide typische KI-Floskeln und künstliche Übergänge wie 'Zusammenfassend lässt sich sagen...', 'Es ist wichtig zu betonen...', 'Abschließend...', 'Nicht nur..., sondern auch...', 'Ein weiterer wichtiger Aspekt...', 'Dies zeigt/verdeutlicht...', 'Es bleibt abzuwarten...'. Schreibe stattdessen literarisch elegant, abwechslungsreich und organisch fließend.
7. Falls die Seite Arbeitsbuch-, Übungs- oder Journal-Elemente enthalten soll (z. B. Checklisten, Schreiblinien, Boxen oder Tabellen):
   - Für leere Kontrollkästchen/Checklisten schreibe am Zeilenanfang "[ ] ". Beispiel: "[ ] Erste Aufgabe"
   - Für gepunktete Schreiblinien zum Ausfüllen schreibe eine Zeile mit nur Punkten (z. B. "........................................................").
   - Für graue Boxen/Infokästen/Performance Prompts umschließe den Inhalt mit ":::box [Titel]" am Anfang und ":::" am Ende auf jeweils einer eigenen Zeile. Beispiel:
     :::box Performance Prompts
     1. Erste Frage: ...
     :::
   - Für tabellarische Übersichten oder Raster nutze die Markdown-Tabellen-Syntax (z. B. "| Spalte 1 | Spalte 2 |" gefolgt von der Trennlinie "| :--- | :--- |").
   - Wenn eine Grafik, Zeichnung oder Illustration den Inhalt veranschaulichen soll, füge an dieser Stelle auf einer eigenen Zeile ein Bild-Tag ein. Format: "[grafik: Detaillierte Beschreibung der Grafik, z. B. Ein alter Messingkompass auf Seekarte]". Nutze dies sehr sparsam (maximal eine Grafik pro Kapitel).`;

    let finalSystemPrompt = systemPrompt;
    if (customGuidelines && customGuidelines.trim()) {
      finalSystemPrompt += `\n7. Berücksichtige strikt diese Autoren-Richtlinien & Stil-Vorgaben des Nutzers:\n"${customGuidelines.trim()}"`;
    }

    // Varietät-System: Erfassung kürzlich genutzter Satzanfänge zur Erhöhung der Vielfalt
    const recentOpeners = this.getRecentPageOpeners(previousPagesText, pageNumber);
    finalSystemPrompt += `\n\n8. VERBOTENE SEITEN-ANFÄNGE (Zur Gewährleistung von Varietät):
Der allererste Satz dieser Seite darf keinesfalls mit typischen, monotonen KI-Satzstrukturen oder kürzlich genutzten Anfängen eingeleitet werden.
Folgende Satzanfänge sind für den ALLERERSTEN Satz dieser Seite STRENGSTENS VERBOTEN:
- Formulierungen mit "Wenn..." (z. B. "Wenn du...", "Wenn Sie...", "Wenn...")
- Formulierungen mit "Indem..." (z. B. "Indem du...", "Indem Sie...", "Indem...")
- Formulierungen mit "Um..." (z. B. "Um deine...", "Um Ihre...", "Um...")
${recentOpeners.length > 0 ? recentOpeners.map(op => `- "${op}..."`).join('\n') : ''}

Achte auf maximale sprachliche Vielfalt! Verwende kreative, abwechslungsreiche und elegante Einleitungen für den ersten Satz.`;

    if (shorterRetry) {
      finalSystemPrompt += `\n\nACHTUNG: Dein vorheriger Entwurf war etwas zu lang und ist über das Buchseiten-Limit hinausgelaufen! Du MUSST diesen Entwurf jetzt um ca. 15% bis 20% kürzen (also ca. ${Math.round(minWords * 0.8)} bis ${Math.round(maxWords * 0.8)} Wörter), damit er exakt auf eine Seite passt, ohne abgeschnitten zu werden. Behalte alle wichtigen Informationen bei, aber schreibe kompakter.`;
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
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.75,
            max_tokens: 1500
          })
        })
      );
      return data.choices[0].message.content.trim();
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
              parts: [{ text: finalSystemPrompt }]
            },
            generationConfig: {
              temperature: 0.65
            }
          })
        })
      );
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
Deine Sprache ist exakt: ${outline.language === 'de' ? 'Deutsch (korrekte Rechtschreibung und Grammatik)' : 'Englisch'}.
Deine Aufgabe ist es, den übergebenen Text einer Buchseite inhaltlich zu verlängern und detaillierter auszuformulieren, ohne die Kernaussage oder das Thema zu verändern.
Schreibe ausführlicher, schmücke Sätze aus, bringe tiefergehende Erklärungen oder Beschreibungen ein, damit der Text länger wird und die Seite voll ausfüllt.

Achte peinlich genau auf folgende Regeln:
1. Verwende KEINE Markdown-Überschriften oder Sternchen.
2. Generiere exakt die Länge für eine Buchseite (ca. ${minWords} bis ${maxWords} Wörter). Der Text darf nicht überlaufen.
3. Beende den Text nicht mitten im Satz, sondern führe den Gedanken auf dieser Seite sauber zu Ende.
4. Starte direkt mit dem neuen, verlängerten Text der Seite, ohne Buchtitel, Kapitel-Überschriften oder Anmerkungen am Anfang.
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
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.65,
            max_tokens: 1500
          })
        })
      );
      return data.choices[0].message.content.trim();
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
              parts: [{ text: finalSystemPrompt }]
            },
            generationConfig: {
              temperature: 0.65
            }
          })
        })
      );
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
            response_format: { type: 'json_object' },
            temperature: 0.8,
            max_tokens: 2000
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
            response_format: { type: 'json_object' },
            temperature: 0.75,
            max_tokens: 1500
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

  private async askAI(systemPrompt: string, userPrompt: string, jsonFormat: boolean = false): Promise<string> {
    const provider = this.getProvider();
    if (provider === 'groq') {
      const data = await this.executeWithKeyRotation('groq', (key) =>
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
            ...(jsonFormat ? { response_format: { type: 'json_object' } } : {}),
            temperature: 0.7
          })
        })
      );
      return data.choices[0].message.content;
    } else {
      const data = await this.executeWithKeyRotation('gemini', (key) =>
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
              ...(jsonFormat ? { responseMimeType: 'application/json' } : {}),
              temperature: 0.7
            }
          })
        })
      );
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error('Keine Antwort von der KI erhalten.');
      }
      return data.candidates[0].content.parts[0].text;
    }
  }

  async generateAmazonDescription(title: string, subtitle: string, idea: string, language: string): Promise<string> {
    const systemPrompt = `Du bist ein professioneller Buch-Marketing-Experte für Amazon KDP. Konvertiere die Buchidee in eine ansprechende, verkaufsstarke Buchbeschreibung für die Amazon-Produktseite.
Verwende ausschließlich valides Amazon-HTML (erlaubte Tags sind: <b>, <i>, <u>, <p>, <br>, <ul>, <li>, <h1>, <h2>, <h3>). Verwende keine anderen HTML-Tags. Stelle sicher, dass die Beschreibung Absätze, fette Überschriften (mit <h2> oder <b>) und Bullet-Points (mit <ul> und <li>) enthält, um die Lesbarkeit zu maximieren. Schreibe auf ${language === 'de' ? 'Deutsch' : 'Englisch'}.
Falls keine Buchbeschreibung/Idee vorliegt, leite eine passende, verkaufsstarke Beschreibung komplett kreativ aus dem Titel und Untertitel ab.`;
    const userPrompt = `Titel: "${title}"\nUntertitel: "${subtitle}"\nBeschreibung/Idee: "${idea || '(Keine Idee angegeben, bitte komplett aus Titel/Untertitel herleiten)'}"`;
    return (await this.askAI(systemPrompt, userPrompt, false)).trim();
  }

  async generateKdpKeywords(title: string, subtitle: string, idea: string, language: string): Promise<string[]> {
    const systemPrompt = `Du bist ein Amazon SEO Experte. Analysiere das folgende Buchprojekt und generiere genau 7 hochrelevante, spezifische Suchbegriffe (Keywords) auf ${language === 'de' ? 'Deutsch' : 'Englisch'} für den KDP-Algorithmus, um die Auffindbarkeit zu maximieren. Jedes Keyword kann ein einzelnes Wort oder eine kurze Phrase sein.
Falls keine Beschreibung/Idee vorliegt, leite die Keywords kreativ aus dem Titel und Untertitel ab.
Antworte ausschließlich im JSON-Format mit folgender Struktur: { "keywords": ["keyword 1", "keyword 2", ...] }.`;
    const userPrompt = `Titel: "${title}"\nUntertitel: "${subtitle}"\nBeschreibung/Idee: "${idea || '(Keine Idee angegeben, bitte komplett aus Titel/Untertitel herleiten)'}"`;
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
    const systemPrompt = `Du bist ein KDP-Verlagsassistent. Analysiere das folgende Buchprojekt und schlage 3 bis 5 passende Buchkategorien auf ${language === 'de' ? 'Deutsch' : 'Englisch'} (Klassifikationen wie Belletristik, Sachbuch, Ratgeber, etc., im KDP-Kategoriebaum-Stil) vor.
Falls keine Beschreibung/Idee vorliegt, leite die Kategorien kreativ aus dem Titel und Untertitel ab.
Antworte ausschließlich im JSON-Format mit folgender Struktur: { "categories": ["kategorie 1", "kategorie 2", ...] }.`;
    const userPrompt = `Titel: "${title}"\nUntertitel: "${subtitle}"\nBeschreibung/Idee: "${idea || '(Keine Idee angegeben, bitte komplett aus Titel/Untertitel herleiten)'}"`;
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

  async shortenText(text: string): Promise<string> {
    const systemPrompt = `Du bist ein Redakteur. Kürze den folgenden Text prägnant, um Platz zu sparen und Überlauf zu verhindern, während die wichtigsten Details und Kernaussagen erhalten bleiben. Antworte ausschließlich mit dem überarbeiteten Text, ohne Einleitung, Kommentar oder Anführungszeichen.`;
    return (await this.askAI(systemPrompt, text, false)).trim();
  }

  async spellcheckText(text: string): Promise<string> {
    const systemPrompt = `Du bist ein professioneller Korrektor. Korrigiere alle Rechtschreib-, Grammatik- und Zeichensetzungsfehler im folgenden Text. Nimm keine inhaltlichen oder stilistischen Änderungen vor, es sei denn, sie sind grammatikalisch falsch. Behalte die ursprüngliche Formatierung bei. Antworte ausschließlich mit dem korrigierten Text, ohne Einleitung, Kommentar oder Anführungszeichen.`;
    return (await this.askAI(systemPrompt, text, false)).trim();
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

Die Sprache der Ausgabe muss ${language === 'de' ? 'Deutsch' : 'Englisch'} sein.

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
    currentPages: BookOutlinePage[]
  ): Promise<BookOutlinePage[]> {

    // --- Step 1: collect unique chapters in order ---
    const uniqueChapters: string[] = [];
    for (const p of currentPages) {
      if (!uniqueChapters.includes(p.chapter_title)) {
        uniqueChapters.push(p.chapter_title);
      }
    }
    const numOriginal = uniqueChapters.length;

    // Target: roughly 1/3 of the original chapters, between 3 and 12
    const targetChapters = Math.max(3, Math.min(12, Math.round(numOriginal / 3)));

    const lang = language === 'de' ? 'Deutsch' : 'English';

    const systemPrompt = `Du bist ein professioneller Bucheditor. Das Buch heißt "${title}" (${subtitle}), Thema: "${idea}".
Du bekommst eine nummerierte Liste der aktuellen Kapitel. Fasse diese in ca. ${targetChapters} breitere Oberkapitel zusammen.
Antworte AUSSCHLIESSLICH mit einem validen JSON-Array dieses Formats – kein Markdown, kein Kommentar:
[
  {
    "new_chapter_title": "Name des neuen Kapitels (${lang})",
    "new_focus": "Kurze Zusammenfassung was dieses Kapitel abdeckt (${lang})",
    "original_chapters": ["Exakter Kapiteltitel 1", "Exakter Kapiteltitel 2", ...]
  },
  ...
]
Regeln:
- Jedes original_chapters-Element muss EXAKT einem Titel aus der Eingabeliste entsprechen.
- Jeder original-Titel muss in genau einer Gruppe vorkommen.
- Die Gruppen sollen inhaltlich zusammengehörige Kapitel vereinen.
- Gib so viele Gruppen zurück wie nötig (Ziel: ~${targetChapters}).`;

    const userPrompt = `Aktuelle Kapitel (in Reihenfolge):\n${uniqueChapters.map((t, i) => `${i + 1}. ${t}`).join('\n')}`;

    try {
      const response = await this.askAI(systemPrompt, userPrompt, true);
      let jsonText = response.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
      }
      const mergeMap: Array<{ new_chapter_title: string; new_focus: string; original_chapters: string[] }> = JSON.parse(jsonText);

      if (!Array.isArray(mergeMap) || mergeMap.length === 0) {
        return currentPages;
      }

      // --- Step 2: build a lookup from old chapter title → new chapter info ---
      const remapTitle: { [old: string]: string } = {};
      const remapFocus: { [old: string]: string } = {};
      for (const group of mergeMap) {
        for (const orig of group.original_chapters) {
          remapTitle[orig] = group.new_chapter_title;
          remapFocus[orig] = group.new_focus;
        }
      }

      // --- Step 3: apply remapping to every page ---
      const remapped: BookOutlinePage[] = currentPages.map(p => {
        const newTitle = remapTitle[p.chapter_title] ?? p.chapter_title;
        const newFocus = remapFocus[p.chapter_title] ?? p.focus;
        return {
          ...p,
          chapter_title: newTitle,
          focus: newFocus,
        };
      });

      return remapped;
    } catch (e) {
      console.error('Failed to condense outline', e);
      return currentPages;
    }
  }

  /**
   * Reads the actual generated pages content and uses AI to recreate chapter titles and assignments
   * for the Table of Contents, matching the flow of topics in the pages.
   */
  async regenerateChaptersFromPages(
    outline: BookOutline,
    pagesText: { [key: number]: string }
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
      const responseText = await this.askAI(systemPrompt, userPrompt, true);
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

      return newPages;
    } catch (err) {
      console.error('Failed to regenerate chapters from pages content:', err);
      throw err;
    }
  }

  async translateToEnglish(text: string): Promise<string> {
    const systemPrompt = `You are a professional book translator. Translate the following text from German to English. Ensure the tone is natural, professional, and captures the original meaning. Retain any styling elements (like markdown bolding, lists, headings) exactly as they are. Antworte ausschließlich mit der Übersetzung, ohne Einleitung, Meta-Kommentar oder zusätzliche Formatierung.`;
    return (await this.askAI(systemPrompt, text, false)).trim();
  }

  async translateOutlinePages(
    pages: BookOutlinePage[]
  ): Promise<BookOutlinePage[]> {
    const systemPrompt = `Du bist ein professioneller Buchübersetzer. Übersetze alle Textinhalte der folgenden Buchgliederung von Deutsch ins Englische.
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
      // Fallback: translate page-by-page manually with delay
      const result: BookOutlinePage[] = [];
      const delayMs = this.getProvider() === 'groq' ? 2500 : 4500;
      for (const page of pages) {
        // Wait to prevent rate limit
        await new Promise(r => setTimeout(r, delayMs));
        const translatedTitle = await this.translateToEnglish(page.chapter_title);
        const translatedFocus = await this.translateToEnglish(page.focus);
        const translatedPoints = await Promise.all(
          page.key_points.map(pt => this.translateToEnglish(pt))
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
}

