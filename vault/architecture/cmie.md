# CMIE (Continuous Memory & Iterative Enhancement)

Das **CMIE-System** sorgt dafür, dass generierte Kapitel eines Sachbuchs aufeinander aufbauen, sich nicht wiederholen und eine hohe sprachliche wie fachliche Qualität behalten.

## Core Services

### 1. CmieOrchestrator (`src/services/cmie/CmieOrchestrator.ts`)
Steuert die Pipeline zur Generierung von Buchinhalten:
- Verarbeitet die Buch-Outline (`OutlinePlanner`).
- Generiert Kapitel für Kapitel.
- Reichert die Prompts mit Kontext aus dem `BookMemoryStore` an.
- Führt Validierungen über Wächter-Klassen aus.

### 2. BookMemoryStore (`src/services/cmie/BookMemoryStore.ts`)
Das In-Memory-Wissensgedächtnis für das aktuell generierte Buch.
- Speichert Schlüsselbegriffe, geschriebene Fakten und getroffene Aussagen.
- Verhindert, dass in Kapitel 5 Dinge behauptet werden, die im Widerspruch zu Kapitel 2 stehen.
- Reduziert die Kontextlänge (Token-Ersparnis), indem es nur relevante Fakten-Happen statt des gesamten geschriebenen Buchs an das LLM übergibt.

### 3. Guards & Validatoren
- **DuplicateGuard**: Vergleicht geplante Absätze semantisch mit bereits geschriebenen Inhalten.
- **CopyrightGuard**: Prüft auf potenzielle Plagiate oder markenrechtlich geschützte Phrasen.
- **ConsistencyValidator**: Stellt sicher, dass Stil, Tonalität und Formatierung über alle Kapitel hinweg konsistent bleiben.
