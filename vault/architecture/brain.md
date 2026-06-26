# Second Brain & Obsidian Sync

Das **Second Brain** ist das zentrale Lernsystem von Book24 Studio. Es sorgt dafür, dass die KI über mehrere Buchprojekte hinweg lernt und intelligenter wird.

## Core Services

### 1. BrainService (`src/services/brain/BrainService.ts`)
- Hört auf Events im gesamten System (z.B. erfolgreiche Buchgenerierung, abgewiesene Doppelungen, manuelle Anpassungen).
- Baut ein Profil pro Nische auf:
  - BSR (Best Sellers Rank) Trends.
  - Erfolgreiche Schreibmuster (Success Patterns).
  - Zu vermeidende Formulierungen oder Themen (Anti-Patterns).
- Schlägt diese Patterns bei zukünftigen Generierungen in derselben Nische vor.

### 2. ObsidianSyncService (`src/services/brain/ObsidianSyncService.ts`)
- Spiegelt den Status des Brains in einen lokalen Markdown-Vault.
- Ermöglicht dem Benutzer, das erlernte Wissen der KI direkt in Obsidian zu durchsuchen, zu editieren und zu erweitern.
- Synchronisiert:
  - **Nischen-Profile** (`niche-*.md`)
  - **Erfolgsmuster** (`patterns.md`)
  - **System-Status** (`system.md`)
  - **Projekt-Metadaten** (`project-*.md`)
