# Graph Report - .  (2026-06-27)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 434 nodes · 711 edges · 39 communities (24 shown, 15 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ad289450`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]

## God Nodes (most connected - your core abstractions)
1. `GeminiService` - 34 edges
2. `ChapterMemory` - 20 edges
3. `BrainState` - 18 edges
4. `compilerOptions` - 17 edges
5. `compilerOptions` - 16 edges
6. `BrainBookInput` - 16 edges
7. `compilerOptions` - 16 edges
8. `slugify()` - 14 edges
9. `BrainService` - 14 edges
10. `ObsidianSyncService` - 13 edges

## Surprising Connections (you probably didn't know these)
- `Book` --references--> `CmiePageStatus`  [EXTRACTED]
  src/App.tsx → src/types/cmie.ts
- `Book` --references--> `GraphicDecision`  [EXTRACTED]
  src/App.tsx → src/types/graphics.ts
- `formatBookMetaMd()` --calls--> `slugify()`  [EXTRACTED]
  src/services/brain/ObsidianSyncService.ts → src/services/brain/BrainService.ts
- `formatChapterMd()` --calls--> `slugify()`  [EXTRACTED]
  src/services/brain/ObsidianSyncService.ts → src/services/brain/BrainService.ts
- `BrainBookInput` --references--> `ChapterMemory`  [EXTRACTED]
  src/types/brain.ts → src/types/cmie.ts

## Import Cycles
- None detected.

## Communities (39 total, 15 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (16): BookMemoryStore, CmieOrchestrator, ConsistencyValidator, CopyrightGuard, LocalSourcePlagiarismChecker, PlagiarismCheckerInterface, DuplicateGuard, DuplicateValidationResult (+8 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (20): ClickSparkProps, Spark, LandingBadPagePreview(), LandingBookPagePreview(), LandingNavbar(), LandingNavbarProps, NAV_ITEMS, FAQS (+12 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (33): dependencies, firebase, framer-motion, @google/generative-ai, jspdf, lucide-react, ogl, react (+25 more)

### Community 4 - "Community 4"
Cohesion: 0.26
Nodes (15): BRAIN_KEY(), BrainService, estimateTokens(), nicheKeyword(), pushEvent(), slugify(), upsertNiche(), upsertPattern() (+7 more)

### Community 5 - "Community 5"
Cohesion: 0.19
Nodes (14): DirHandle, ensureDir(), formatBookMetaMd(), formatChapterMd(), formatNicheMd(), formatPatternsMd(), formatSystemMd(), loadHandle() (+6 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (21): author, dependencies, axios, cors, dotenv, express, firebase-admin, firebase-functions (+13 more)

### Community 7 - "Community 7"
Cohesion: 0.10
Nodes (11): Account, BoxDesign, COVER_FONTS, DEFAULT_BOX1_DESIGN, DEFAULT_BOX2_DESIGN, DEFAULT_BOX3_DESIGN, ImageInsertModalInnerProps, NAV_TAB_PARTICLE_COLORS (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.15
Nodes (11): NecessityDetector, SvgGraphicRenderer(), SvgGraphicRendererProps, GraphicDecision, GraphicLayoutVariant, GraphicType, HierarchyConfig, ProcessConfig (+3 more)

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 11 - "Community 11"
Cohesion: 0.12
Nodes (16): compilerOptions, declaration, declarationMap, exactOptionalPropertyTypes, isolatedModules, jsx, module, moduleDetection (+8 more)

### Community 12 - "Community 12"
Cohesion: 0.13
Nodes (11): BackupData, createBackup(), deleteBookFromCloud(), downloadBackup(), KEYS, LEGACY_PREFIXES, loadAccountsFromCloud(), loadBooksFromCloud() (+3 more)

### Community 13 - "Community 13"
Cohesion: 0.19
Nodes (9): actionBtnStyle(), BRAIN_REGIONS, BrainDashboard(), BrainDashboardProps, EVENT_LABELS, EventRow(), formatTime(), panelStyle (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.23
Nodes (11): config, outline, pdfBlob, BoxDesign, drawBookEmblem(), drawFloralEmblem(), drawGeometricEmblem(), drawStarEmblem() (+3 more)

### Community 15 - "Community 15"
Cohesion: 0.31
Nodes (7): NicheFinderDashboard(), NicheFinderDashboardProps, Competitor, delay(), NicheMetrics, NicheResult, searchNiche()

### Community 16 - "Community 16"
Cohesion: 0.32
Nodes (5): Auth(), AuthProps, config, INLINE_CONFIG, isFirebaseConfigured()

### Community 17 - "Community 17"
Cohesion: 0.25
Nodes (4): AI_MODEL_OPTIONS, SettingsModal(), SettingsModalProps, SettingsTab

### Community 19 - "Community 19"
Cohesion: 0.50
Nodes (3): BRAIN_ALLOWED_EMAILS, hasBrainAccess(), App()

## Knowledge Gaps
- **176 isolated node(s):** `name`, `version`, `description`, `main`, `test` (+171 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GeminiService` connect `Community 3` to `Community 0`, `Community 7`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `ChapterMemory` connect `Community 0` to `Community 4`, `Community 5`, `Community 7`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `ObsidianSyncService` connect `Community 5` to `Community 4`, `Community 13`, `Community 7`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _176 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09178743961352658 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06554621848739496 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.058823529411764705 - nodes in this community are weakly interconnected._