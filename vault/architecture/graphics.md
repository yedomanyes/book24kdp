# Visual Content Planner & SvgGraphicRenderer

Dieses Subsystem analysiert den generierten Text während des Schreibprozesses und entscheidet, wann und wo Grafiken, Tabellen oder Mindmaps eingefügt werden müssen, um den Lesefluss von Sachbüchern zu verbessern.

## Core Services

### 1. NecessityDetector (`src/services/graphics/NecessityDetector.ts`)
- Analysiert den Textabsatz semantisch auf Informationsdichte.
- Erkennt Signalwörter und Strukturen, die sich besser visuell darstellen lassen (z.B. Vergleiche, Schritt-für-Schritt-Anleitungen, hierarchische Strukturen).
- Bestimmt den optimalen Grafiktyp (Tabelle, Ablaufdiagramm, Mindmap, Infografik).

### 2. SvgGraphicRenderer (`src/services/graphics/SvgGraphicRenderer.tsx`)
- Generiert direkt KDP-druckfähige, hochauflösende SVGs auf Basis der strukturierten Daten des `NecessityDetector`.
- Unterstützt:
  - **Tabellen**: Strukturierte Vergleiche.
  - **Ablaufdiagramme**: Visualisierung von Prozessen und Schritten.
  - **Mindmaps / Konzepte**: Hierarchische Verbindungen.
- Die SVGs werden nahtlos in das HTML/PDF-Dokument eingebettet, sodass sie beim PDF-Export perfekt gerendert werden.
