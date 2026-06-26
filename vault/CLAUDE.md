# Book24 Studio - Agent & Project Context

Willkommen bei **Book24 Studio**, der All-in-One Plattform für professionelle Amazon KDP (Kindle Direct Publishing) Publisher. Dieses Dokument dient als Einstiegspunkt für KI-Agenten, um den Projektkontext, die Systemarchitektur und Entwicklungsrichtlinien sofort zu verstehen.

---

## 1. Was ist Book24 Studio?
Book24 Studio automatisiert die Erstellung von hochwertigen, druckfertigen Sachbüchern mithilfe modernster KI-Modelle. Die Plattform umfasst Nischenrecherche, Inhaltsstrukturierung, iterative Textgenerierung, automatisierte Formatierung und Design-Rendering.

### Kern-Komponenten der Architektur:
1. **Groq/Gemini Content-Engine (`src/services/GeminiService.ts`)**:
   - Schnittstelle zu LLMs (Gemini Flash/Pro, Groq-Modelle) für extrem schnelle Outline- und Textgenerierung.
2. **CMIE Memory-System (Continuous Memory & Iterative Enhancement)**:
   - Verwaltet im Ordner `src/services/cmie/`.
   - **`CmieOrchestrator`**: Steuert den Generierungsfluss von Kapiteln.
   - **`BookMemoryStore`**: Speichert Kontext, Fakten und gelernte Patterns über Generierungsschritte hinweg.
   - **`DuplicateGuard` & `CopyrightGuard`**: Verhindern Plagiate und inhaltliche Doppelungen.
   - **`ConsistencyValidator`**: Sichert den roten Faden und sprachliche Kohärenz.
3. **Job-Queue System**:
   - Verwaltet die Hintergrundgenerierung von Buchprojekten, da Bucherstellung zeitintensiv ist.
4. **Layout & Graphics Engine**:
   - **`SvgGraphicRenderer`** und **`NecessityDetector`** steuern die automatische Generierung von visuellen Schaubildern (z.B. Tabellen, Mindmaps, Diagramme) passend zum Buchkontext.
   - Integriertes PDF-Exportmodul zur Generierung von KDP-konformen Rändern und Layouts.
5. **Second Brain / Obsidian Sync (`src/services/brain/`)**:
   - **`BrainService`**: Lernt aus jeder generierten Seite (Erfolgsmuster, Anti-Patterns).
   - **`ObsidianSyncService`**: Synchronisiert gelerntes Wissen und Metadaten in einen lokalen Obsidian-Vault.

---

## 2. Entwicklungsrichtlinien für Sessions

### Start einer Session:
1. Lies dieses Dokument (`vault/CLAUDE.md`).
2. Lies die letzten 3 Einträge im Session-Log-Ordner (`vault/logs/`).

### Ende einer Session:
1. Aktualisiere den Wissensgraphen mit `graphify .` und `graphify cluster-only .`.
2. Exportiere den aktuellen Stand für Obsidian mit `graphify export obsidian`.
3. Schreibe einen neuen Log-Eintrag in `vault/logs/YYYY-MM-DD_session.md` mit:
   - Was wurde gebaut/verändert?
   - Welche wichtigen Architekturentscheidungen wurden getroffen?
   - Welche Aufgaben bleiben offen?

### Build & Test-Kommandos:
- Projekt kompilieren: `npm run build`
- Firebase-Regeln testen: `npm run test` (falls eingerichtet)
