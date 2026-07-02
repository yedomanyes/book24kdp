# Graph Report - KDP  (2026-07-02)

## Corpus Check
- 112 files · ~181,170 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1651 nodes · 3603 edges · 115 communities (87 shown, 28 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 58 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9251a728`
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
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 100|Community 100]]
- [[_COMMUNITY_Community 101|Community 101]]
- [[_COMMUNITY_Community 102|Community 102]]
- [[_COMMUNITY_Community 103|Community 103]]
- [[_COMMUNITY_Community 105|Community 105]]
- [[_COMMUNITY_Community 115|Community 115]]
- [[_COMMUNITY_Community 116|Community 116]]
- [[_COMMUNITY_Community 117|Community 117]]
- [[_COMMUNITY_Community 118|Community 118]]
- [[_COMMUNITY_Community 119|Community 119]]
- [[_COMMUNITY_Community 123|Community 123]]
- [[_COMMUNITY_Community 124|Community 124]]
- [[_COMMUNITY_Community 125|Community 125]]
- [[_COMMUNITY_Community 127|Community 127]]
- [[_COMMUNITY_Community 128|Community 128]]
- [[_COMMUNITY_Community 129|Community 129]]
- [[_COMMUNITY_Community 130|Community 130]]
- [[_COMMUNITY_Community 135|Community 135]]

## God Nodes (most connected - your core abstractions)
1. `constructor()` - 95 edges
2. `fire()` - 79 edges
3. `get()` - 74 edges
4. `push()` - 67 edges
5. `GeminiService` - 40 edges
6. `createRow()` - 33 edges
7. `clear()` - 30 edges
8. `add()` - 23 edges
9. `open()` - 23 edges
10. `l()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `syncUserProfile()` --calls--> `doc`  [INFERRED]
  src/services/userProfileService.ts → test_jspdf.js
- `SupabaseStatusBox()` --calls--> `MetricCard()`  [INFERRED]
  src/components/SupabaseStatusBox.tsx → src/components/OwnerPanel.tsx
- `SupabaseStatusBox()` --calls--> `StatusPill()`  [INFERRED]
  src/components/SupabaseStatusBox.tsx → src/components/SettingsModal.tsx
- `KdpCalculator()` --calls--> `formatCurrency()`  [INFERRED]
  src/components/KdpCalculator.tsx → src/lib/utils.js
- `BrainDashboardProps` --references--> `AppUser`  [EXTRACTED]
  src/components/BrainDashboard.tsx → src/supabase.ts

## Import Cycles
- None detected.

## Communities (115 total, 28 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.01
Nodes (17): addRefreshCallback(), alternate(), _applyScrollModifier(), _batchedMemoryCleanup(), cleanupMemory(), compositionupdate(), consumeWheelEvent(), init() (+9 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (51): BRAIN_KEY(), BrainService, estimateTokens(), getNicheColor(), NEON_COLORS, nicheKeyword(), pushEvent(), slugify() (+43 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (16): GlobalDiversityIndex, GlobalOpening, BookMemoryStore, CmieOrchestrator, ConsistencyValidator, CopyrightGuard, LocalSourcePlagiarismChecker, PlagiarismCheckerInterface (+8 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (38): addEncoding(), addProtocol(), ca(), _computeKeybinding(), _computeKeyCodeChord(), constructor(), eo(), fromCharData() (+30 more)

### Community 5 - "Community 5"
Cohesion: 0.28
Nodes (9): _flushCleanupDeleted(), _flushCleanupInserted(), forEachByKey(), forEachDecorationAtCell(), getDecorationsAtCell(), getKeyIterator(), _insert(), _search() (+1 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (20): createRow(), getBgColor(), getBgColorMode(), getFgColor(), getFgColorMode(), getNoBgTrimmedLength(), getUnderlineColor(), getUnderlineColorMode() (+12 more)

### Community 8 - "Community 8"
Cohesion: 0.06
Nodes (36): dependencies, class-variance-authority, clsx, cobe, embla-carousel-react, framer-motion, @google/generative-ai, gsap (+28 more)

### Community 9 - "Community 9"
Cohesion: 0.14
Nodes (19): activateNormalBuffer(), _cancelCallback(), clear(), clearAllMarkers(), cursorBackwardTab(), enqueue(), fit(), _getCorrectBufferLength() (+11 more)

### Community 10 - "Community 10"
Cohesion: 0.20
Nodes (25): deleteChars(), deleteColumns(), deleteLines(), _eraseAttrData(), eraseChars(), _eraseInBufferLine(), eraseInDisplay(), eraseInLine() (+17 more)

### Community 11 - "Community 11"
Cohesion: 0.06
Nodes (21): LayoutWarning, LicensePrompt(), LicensePromptProps, BRAIN_ALLOWED_EMAILS, hasBrainAccess(), BookOutline, BookOutlinePage, Account (+13 more)

### Community 12 - "Community 12"
Cohesion: 0.05
Nodes (57): activeProtocol(), activeVersion(), bell(), compositionend(), cursorForwardTab(), debug(), _deliver(), _deliverQueue() (+49 more)

### Community 13 - "Community 13"
Cohesion: 0.19
Nodes (14): bufferRows(), clearTextureAtlas(), _fireOnCanvasResize(), flush(), _fullRefresh(), handleCharSizeChanged(), handleDevicePixelRatioChange(), _handleIntersectionChange() (+6 more)

### Community 14 - "Community 14"
Cohesion: 0.36
Nodes (10): appendChild(), _createAccessibilityTreeNode(), _createArrow(), _createSelectionElement(), _handleBoundaryFocus(), handleResize(), handleSelectionChanged(), pop() (+2 more)

### Community 15 - "Community 15"
Cohesion: 0.06
Nodes (46): _arrowPointerDown(), cancel(), cancelAndSet(), check(), delegatePointerDown(), delegateScrollFromMouseWheelEvent(), delegateVerticalScrollbarPointerDown(), dispatchEvent() (+38 more)

### Community 16 - "Community 16"
Cohesion: 0.09
Nodes (21): author, dependencies, axios, cors, dotenv, express, firebase-admin, firebase-functions (+13 more)

### Community 17 - "Community 17"
Cohesion: 0.25
Nodes (8): bl(), _handleChar(), _handleTab(), _remove(), setIconName(), setTitle(), shift(), windowOptions()

### Community 18 - "Community 18"
Cohesion: 0.14
Nodes (17): clearMarkers(), copyFrom(), getBg(), _getCyclicIndex(), getFg(), getJoinedCharacters(), _getJoinedRanges(), maxLength() (+9 more)

### Community 19 - "Community 19"
Cohesion: 0.13
Nodes (24): clearSelection(), _dragScroll(), _fireEventIfSelectionChanged(), _fireOnSelectionChange(), focus(), getCurrentScrollPosition(), getScrollPosition(), getSelection() (+16 more)

### Community 20 - "Community 20"
Cohesion: 0.13
Nodes (15): Aa(), acceptScrollDimensions(), as(), createScrollEvent(), equals(), _initAnimation(), _initAnimations(), ka() (+7 more)

### Community 21 - "Community 21"
Cohesion: 0.33
Nodes (7): _addStyle(), _applyMinimumContrast(), getColor(), _getContrastCache(), isDim(), setAttribute(), setColor()

### Community 22 - "Community 22"
Cohesion: 0.29
Nodes (7): _alignRowWidth(), _announceCharacters(), handleBlur(), handleFocus(), _refreshRowDimensions(), _refreshRowsDimensions(), renderRows()

### Community 23 - "Community 23"
Cohesion: 0.15
Nodes (11): NecessityDetector, SvgGraphicRenderer(), SvgGraphicRendererProps, GraphicDecision, GraphicLayoutVariant, GraphicType, HierarchyConfig, ProcessConfig (+3 more)

### Community 24 - "Community 24"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 25 - "Community 25"
Cohesion: 0.50
Nodes (5): _createElement(), _doRefreshDecorations(), _refreshStyle(), _refreshXPosition(), _renderDecoration()

### Community 26 - "Community 26"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 27 - "Community 27"
Cohesion: 0.21
Nodes (13): _askForLink(), backspace(), Bs(), _checkLinkProviderResult(), get(), getCss(), getDisposableData(), getLine() (+5 more)

### Community 28 - "Community 28"
Cohesion: 0.15
Nodes (19): add(), C(), clearAndLeak(), compositionstart(), deleteAndLeak(), f(), fr(), has() (+11 more)

### Community 29 - "Community 29"
Cohesion: 0.05
Nodes (57): _applyVisibilitySetting(), beginHide(), beginReveal(), _computeValues(), _createSlider(), ensureVisibility(), getArrowSize(), getRectangleLargeSize() (+49 more)

### Community 30 - "Community 30"
Cohesion: 0.20
Nodes (7): GilInsightsPanel(), GilInsightsPanelProps, labelContainerStyle, labelStyle, ledgerRowStyle, subLabelStyle, valueContainerStyle

### Community 31 - "Community 31"
Cohesion: 0.12
Nodes (16): compilerOptions, declaration, declarationMap, exactOptionalPropertyTypes, isolatedModules, jsx, module, moduleDetection (+8 more)

### Community 32 - "Community 32"
Cohesion: 0.19
Nodes (18): _bindKeys(), buffer(), event(), _initGlobal(), l(), onblur(), onchange(), onclick() (+10 more)

### Community 33 - "Community 33"
Cohesion: 0.24
Nodes (9): formatDate(), OwnerPanel(), OwnerUserRow, Props, getOwnerEmailClient(), isOwnerEmail(), isOwnerRoute(), OWNER_ROUTES (+1 more)

### Community 34 - "Community 34"
Cohesion: 0.14
Nodes (14): BackupData, createBackup(), deleteBookFromCloud(), downloadBackup(), forcePushBooksToCloud(), getActiveAccountId(), KEYS, LEGACY_PREFIXES (+6 more)

### Community 35 - "Community 35"
Cohesion: 0.50
Nodes (4): areSelectionValuesReversed(), finalSelectionEnd(), finalSelectionStart(), _selectToWordAt()

### Community 36 - "Community 36"
Cohesion: 0.29
Nodes (7): decode(), fill(), isProtected(), markAllDirty(), requestStatusString(), screenAlignmentPattern(), setDefault()

### Community 37 - "Community 37"
Cohesion: 0.13
Nodes (15): addCsiHandler(), addDcsHandler(), addEscHandler(), addOscHandler(), clearCsiHandler(), clearDcsHandler(), clearEscHandler(), clearHandler() (+7 more)

### Community 38 - "Community 38"
Cohesion: 0.09
Nodes (36): a(), activate(), Ci(), _clearCurrentLink(), _createLinkUnderlineEvent(), Ec(), el(), Fi() (+28 more)

### Community 39 - "Community 39"
Cohesion: 0.29
Nodes (10): getAdminApp(), getAdminAuth(), getAdminDb(), parseServiceAccount(), getBearerToken(), isOwner(), requireOwner(), applyFilters() (+2 more)

### Community 40 - "Community 40"
Cohesion: 0.50
Nodes (4): _enableWindowsWrappingHeuristics(), _handleWindowsPtyOptionChange(), onLineFeed(), _setup()

### Community 41 - "Community 41"
Cohesion: 0.08
Nodes (37): activateAltBuffer(), addDigit(), addParam(), addSubParam(), charAttributes(), clearRange(), clone(), combine() (+29 more)

### Community 42 - "Community 42"
Cohesion: 0.20
Nodes (7): BrainDashboardProps, BugReportModal(), CATEGORIES_DE, CATEGORIES_EN, Props, syncUserProfile(), AppUser

### Community 44 - "Community 44"
Cohesion: 0.17
Nodes (13): bindMouse(), createInstance(), _createRenderer(), disable(), enable(), _handleScreenReaderModeOptionChange(), hasRenderer(), onCursorMove() (+5 more)

### Community 46 - "Community 46"
Cohesion: 0.14
Nodes (14): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, @types/node, @types/react (+6 more)

### Community 47 - "Community 47"
Cohesion: 0.34
Nodes (14): Al(), copyCellsFrom(), deleteCells(), getTrimmedLength(), getWidth(), hasContent(), insertCells(), print() (+6 more)

### Community 48 - "Community 48"
Cohesion: 0.23
Nodes (11): config, outline, pdfBlob, BoxDesign, drawBookEmblem(), drawFloralEmblem(), drawGeometricEmblem(), drawStarEmblem() (+3 more)

### Community 49 - "Community 49"
Cohesion: 0.20
Nodes (12): accept(), acceptStandardWheelEvent(), _computeScore(), getWindowId(), getZoomFactor(), getZoomLevel(), _isAlmostInt(), isFullscreen() (+4 more)

### Community 50 - "Community 50"
Cohesion: 0.17
Nodes (12): addDecoration(), _addLineToZone(), _lineAdjacentToZone(), _lineIntersectsZone(), _refreshCanvasDimensions(), _refreshColorZonePadding(), _refreshDecorations(), _refreshDrawConstants() (+4 more)

### Community 51 - "Community 51"
Cohesion: 0.08
Nodes (30): co(), create(), d(), e(), findLastMonotonous(), Fl(), h2(), i() (+22 more)

### Community 53 - "Community 53"
Cohesion: 0.32
Nodes (8): cc(), charProperties(), createPropertyValue(), extractShouldJoin(), extractWidth(), getStringCellWidth(), repeatPrecedingCharacter(), wcwidth()

### Community 54 - "Community 54"
Cohesion: 0.08
Nodes (25): [(ao = Symbol.iterator, lo = Symbol.toStringTag, ao)](), Cn(), computeLeakingDisposables(), decorations(), emit(), entries(), execute(), _flushDeleted() (+17 more)

### Community 55 - "Community 55"
Cohesion: 0.24
Nodes (9): actionTypes, dispatch(), genId(), listeners, memoryState, React, reducer(), toast() (+1 more)

### Community 56 - "Community 56"
Cohesion: 0.33
Nodes (4): CloudQueueService, doc, { jsPDF }, lines

### Community 57 - "Community 57"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, lint, preview, type (+1 more)

### Community 58 - "Community 58"
Cohesion: 0.09
Nodes (24): charPosAbsolute(), cursorBackward(), cursorCharAbsolute(), cursorDown(), cursorForward(), cursorNextLine(), cursorPosition(), cursorPrecedingLine() (+16 more)

### Community 59 - "Community 59"
Cohesion: 0.22
Nodes (8): author, authorUrl, description, id, isDesktopOnly, minAppVersion, name, version

### Community 60 - "Community 60"
Cohesion: 0.31
Nodes (7): NicheFinderDashboard(), NicheFinderDashboardProps, Competitor, delay(), NicheMetrics, NicheResult, searchNiche()

### Community 62 - "Community 62"
Cohesion: 0.25
Nodes (8): _checkProposedApi(), deregister(), deregisterCharacterJoiner(), markers(), registerCharacterJoiner(), registerDecoration(), unicode(), _verifyPositiveIntegers()

### Community 64 - "Community 64"
Cohesion: 0.21
Nodes (10): AI_MODEL_OPTIONS, SettingsModal(), SettingsModalProps, SettingsTab, LanguageContext, LanguageContextValue, LanguageProvider(), Language (+2 more)

### Community 65 - "Community 65"
Cohesion: 0.12
Nodes (15): Auth(), AuthProps, DEFAULT_STATE, EmbeddedText, GilLog, GilState, GoldenExample, LayoutWarning (+7 more)

### Community 67 - "Community 67"
Cohesion: 0.29
Nodes (7): digest(), Ia(), ko(), rs(), _step(), wi(), _wrapUp()

### Community 68 - "Community 68"
Cohesion: 0.22
Nodes (4): LegalModal(), LegalModalProps, LegalPage, s

### Community 69 - "Community 69"
Cohesion: 0.28
Nodes (8): MetricCard(), StatusPill(), compact(), formatTime(), initialState, Props, StatusState, SupabaseStatusBox()

### Community 70 - "Community 70"
Cohesion: 0.32
Nodes (8): delete(), dispose(), _handleBufferActivate(), kill(), markAsDisposed(), onClose(), pr(), _removeDecoration()

### Community 71 - "Community 71"
Cohesion: 0.52
Nodes (6): Ea(), je(), ns(), Po(), Sa(), Ta()

### Community 72 - "Community 72"
Cohesion: 0.33
Nodes (5): ToastActionElement, ToasterToast, ToastItem, ToastOptions, ToastType

### Community 73 - "Community 73"
Cohesion: 0.25
Nodes (5): LandingNavbar(), LandingNavbarProps, RotatingText, RotatingTextProps, RotatingTextRef

### Community 74 - "Community 74"
Cohesion: 0.25
Nodes (3): ANIMATION_CONFIG, ProfileCard, ProfileCardProps

### Community 80 - "Community 80"
Cohesion: 0.40
Nodes (5): addListener(), _setDprAndFireIfDiffers(), setWindow(), _setWindowResizeListener(), _updateDpr()

### Community 84 - "Community 84"
Cohesion: 0.15
Nodes (17): addCodepointToCell(), Ce(), _convertViewportColToCharacterIndex(), getAsCharData(), getCell(), getChars(), getCode(), getCodePoint() (+9 more)

### Community 87 - "Community 87"
Cohesion: 0.31
Nodes (7): getFaqs(), getRoadmapPhases(), LandingPage(), LandingPageProps, TEAM, LiquidEther(), LiquidEtherProps

### Community 116 - "Community 116"
Cohesion: 0.40
Nodes (6): addTarget(), Gn(), ignoreGesture(), ignoreTarget(), isTouchDevice(), markAsSingleton()

### Community 118 - "Community 118"
Cohesion: 0.50
Nodes (3): KdpCalculator(), KdpCalculatorProps, formatCurrency()

### Community 123 - "Community 123"
Cohesion: 0.50
Nodes (5): addLineToLink(), addMarker(), _getEntryIdKey(), registerLink(), registerMarker()

### Community 124 - "Community 124"
Cohesion: 0.67
Nodes (3): _handleLinkHover(), _handleLinkLeave(), _setCellUnderline()

### Community 125 - "Community 125"
Cohesion: 0.50
Nodes (4): Ao(), is(), Lo(), update()

### Community 127 - "Community 127"
Cohesion: 0.50
Nodes (4): ll(), _reflow(), _reflowLarger(), _reflowLargerAdjustViewport()

### Community 129 - "Community 129"
Cohesion: 0.09
Nodes (25): _addMouseDownListeners(), _areCoordsInSelection(), _getMouseBufferCoords(), getWrappedRangeForLine(), _handleDoubleClick(), _handleIncrementalClick(), handleMouseDown(), _handleSingleClick() (+17 more)

### Community 135 - "Community 135"
Cohesion: 0.12
Nodes (14): Ba(), _clearLiveRegion(), emitOne(), _handleKey(), identToString(), Ne(), O, Oa() (+6 more)

## Knowledge Gaps
- **263 isolated node(s):** `NAV_TABS`, `NavTabId`, `NAV_TAB_PARTICLE_COLORS`, `COVER_FONTS`, `BoxDesign` (+258 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GeminiService` connect `Community 7` to `Community 11`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `O` connect `Community 135` to `Community 0`, `Community 54`, `Community 71`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Why does `Ke` connect `Community 51` to `Community 0`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `constructor()` (e.g. with `l()` and `pa()`) actually correct?**
  _`constructor()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `NAV_TABS`, `NavTabId`, `NAV_TAB_PARTICLE_COLORS` to the rest of the system?**
  _263 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.01246084232509572 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06540447504302926 - nodes in this community are weakly interconnected._