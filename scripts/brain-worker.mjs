#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = process.cwd();
const PUBLIC_BRAIN_DIR = path.join(ROOT, 'public', 'brain');
const RUNTIME_DIR = path.join(ROOT, 'runtime');
const RUNTIME_JSON = path.join(PUBLIC_BRAIN_DIR, 'runtime-status.json');
const CODE_CONTEXT_JSON = path.join(PUBLIC_BRAIN_DIR, 'code-context.json');
const PRIMARY_VAULT = path.join(ROOT, 'vault');
const SECONDARY_VAULT = path.join(ROOT, 'Book24 Studio');
const LOOP_INTERVAL_MS = Number(process.env.BRAIN_WORKER_INTERVAL_MS || 10000);
const STARTED_AT = new Date().toISOString();
const PID = process.pid;
const HOSTNAME = os.hostname();
const PROJECT_NAME = 'Book24 Studio / KDP';
const CONSUMERS = ['Hermes', 'Antigravity'];

const CODE_CONTEXT_DIRS = [
  {
    root: PRIMARY_VAULT,
    indexFile: path.join(PRIMARY_VAULT, 'architecture', 'code-context.md'),
    sectionsDir: path.join(PRIMARY_VAULT, '04-Code-Kontext'),
  },
  {
    root: SECONDARY_VAULT,
    indexFile: path.join(SECONDARY_VAULT, '_System', 'code-context.md'),
    sectionsDir: path.join(SECONDARY_VAULT, '_System', 'Code_Context'),
  },
].filter((entry) => fs.existsSync(entry.root));

const SCAN_DIRS = [
  'src',
  'functions/src',
  'supabase',
  'vault',
  'Book24 Studio',
  'graphify-out',
].filter((entry) => fs.existsSync(path.join(ROOT, entry)));

const SECTION_RULES = [
  {
    id: 'app-shell',
    title: 'App Shell & Studio Flow',
    description: 'Zentrale App-Struktur, Routing-artige Tabs, Screen-Komposition und globaler Studio-Flow.',
    matches: (rel) => rel === 'src/App.tsx' || rel.startsWith('src/components/') || rel.startsWith('src/hooks/'),
  },
  {
    id: 'brain-runtime',
    title: 'Brain Runtime',
    description: 'BrainService, Dashboard, Runtime-Zustand, Obsidian-Sync und Queue-Logik.',
    matches: (rel) => rel.startsWith('src/services/brain/') || rel === 'src/types/brain.ts',
  },
  {
    id: 'cmie-engine',
    title: 'CMIE / Kapitel-Engine',
    description: 'Kapitelwissen, Duplicate-Guards, Orchestrierung und Lernspeicher pro Seite.',
    matches: (rel) => rel.startsWith('src/services/cmie/') || rel === 'src/types/cmie.ts',
  },
  {
    id: 'generation-ai',
    title: 'AI Generation Stack',
    description: 'Gemini-/Prompt-/Content-Generierung und angrenzende Schreiblogik.',
    matches: (rel) => /Gemini|Prompt|Generation|Writer|Content/i.test(rel) && rel.startsWith('src/'),
  },
  {
    id: 'storage-cloud',
    title: 'Storage, Supabase & Cloud',
    description: 'Lokale Persistenz, Supabase-Verbindung, Cloud-Sync und Backend-Definitionen.',
    matches: (rel) => rel === 'src/supabase.ts' || rel.startsWith('src/services/StorageService') || rel.startsWith('functions/src/') || rel.startsWith('supabase/'),
  },
  {
    id: 'project-memory',
    title: 'Vault, Memory & Obsidian Context',
    description: 'Langzeitwissen, Patterns, Logs, Vault-Kontext und Obsidian-Zielstruktur.',
    matches: (rel) => rel.startsWith('vault/') || rel.startsWith('Book24 Studio/'),
  },
  {
    id: 'graph-intelligence',
    title: 'Graph / Code Intelligence',
    description: 'Graphify-Ausgaben und strukturierte Code-Graph-Artefakte für schnellen Überblick.',
    matches: (rel) => rel.startsWith('graphify-out/'),
  },
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function readTextSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function writeText(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

function writeJson(filePath, value) {
  writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function walk(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.git')) continue;
    if (entry.name === 'node_modules') continue;
    if (entry.name === 'dist') continue;
    if (entry.name === 'runtime') continue;
    if (entry.name === '.DS_Store') continue;

    const fullPath = path.join(dirPath, entry.name);
    const relPath = toRelative(fullPath);

    if (entry.isDirectory()) {
      if (relPath.startsWith('graphify-out/') && (entry.name === 'cache' || entry.name === 'obsidian')) {
        continue;
      }
      if (relPath === 'vault/04-Code-Kontext' || relPath === 'Book24 Studio/_System/Code_Context') {
        continue;
      }
      results.push(...walk(fullPath));
      continue;
    }

    if (relPath === 'vault/architecture/code-context.md' || relPath === 'Book24 Studio/_System/code-context.md') {
      continue;
    }

    if (!/\.(ts|tsx|js|jsx|json|sql|md|html)$/i.test(entry.name)) continue;
    results.push(fullPath);
  }

  return results;
}

function toRelative(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

function lineCount(text) {
  if (!text) return 0;
  return text.split(/\r?\n/).length;
}

function extractSymbols(text) {
  const regexes = [
    /export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/g,
    /export\s+class\s+([A-Za-z0-9_]+)/g,
    /export\s+(?:const|let|var)\s+([A-Za-z0-9_]+)/g,
    /export\s+type\s+([A-Za-z0-9_]+)/g,
    /export\s+interface\s+([A-Za-z0-9_]+)/g,
    /(?:const|function)\s+([A-Z][A-Za-z0-9_]+)\s*(?::\s*React\.FC|\()/g,
  ];

  const found = new Set();
  for (const regex of regexes) {
    for (const match of text.matchAll(regex)) {
      const value = match[1]?.trim();
      if (value) found.add(value);
      if (found.size >= 8) break;
    }
    if (found.size >= 8) break;
  }

  return Array.from(found).slice(0, 8);
}

function summarizeFile(relPath, text) {
  const lines = text.split(/\r?\n/);
  const headline = lines.find((line) => line.trim().length > 0 && line.trim().length < 140)?.trim() || '';
  return {
    path: relPath,
    lines: lineCount(text),
    symbols: extractSymbols(text),
    preview: headline.slice(0, 140),
  };
}

function bucketForFile(relPath) {
  for (const section of SECTION_RULES) {
    if (section.matches(relPath)) return section.id;
  }
  return 'misc';
}

function buildSectionEntries() {
  const files = SCAN_DIRS.flatMap((dir) => walk(path.join(ROOT, dir)));
  const sections = new Map();

  for (const rule of SECTION_RULES) {
    sections.set(rule.id, {
      id: rule.id,
      title: rule.title,
      description: rule.description,
      files: [],
    });
  }

  sections.set('misc', {
    id: 'misc',
    title: 'Weitere Dateien',
    description: 'Restliche Dateien, die nicht in eine Kern-Sektion gefallen sind.',
    files: [],
  });

  for (const filePath of files) {
    const relPath = toRelative(filePath);
    const text = readTextSafe(filePath);
    const bucket = bucketForFile(relPath);
    sections.get(bucket).files.push(summarizeFile(relPath, text));
  }

  const ordered = Array.from(sections.values())
    .map((section) => {
      const totalLines = section.files.reduce((sum, file) => sum + file.lines, 0);
      const topFiles = [...section.files]
        .sort((a, b) => b.lines - a.lines)
        .slice(0, 8);
      const symbols = [...new Set(section.files.flatMap((file) => file.symbols))].slice(0, 16);
      return {
        ...section,
        fileCount: section.files.length,
        totalLines,
        topFiles,
        symbols,
      };
    })
    .filter((section) => section.fileCount > 0)
    .sort((a, b) => b.totalLines - a.totalLines);

  return ordered;
}

function buildAntigravityContext() {
  const dataPath = path.join(ROOT, 'Book24 Studio', '.obsidian', 'plugins', 'antigravity-cli-sidebar', 'data.json');
  const data = readJsonSafe(dataPath);
  return {
    configured: Boolean(data),
    command: data?.command || null,
    args: data?.args || null,
    source: fs.existsSync(dataPath) ? toRelative(dataPath) : null,
  };
}

function buildGraphifyContext() {
  const htmlPath = path.join(ROOT, 'graphify-out', 'graph.html');
  const analysisPath = path.join(ROOT, 'graphify-out', '.graphify_analysis.json');
  return {
    available: fs.existsSync(htmlPath) || fs.existsSync(analysisPath),
    graphHtml: fs.existsSync(htmlPath) ? toRelative(htmlPath) : null,
    analysisJson: fs.existsSync(analysisPath) ? toRelative(analysisPath) : null,
  };
}

function rankSectionPriority(section) {
  return Math.round((section.totalLines / 120) + (section.fileCount * 2) + (section.symbols.length * 3));
}

function buildDecisionEngine(sections, antigravity, graphify) {
  const byId = Object.fromEntries(sections.map((section) => [section.id, section]));
  const appShell = byId['app-shell'];
  const brainRuntime = byId['brain-runtime'];
  const projectMemory = byId['project-memory'];

  const thoughts = [
    appShell
      ? `${appShell.title} dominiert aktuell mit ${appShell.totalLines} Zeilen und ist damit der schwerste Produktblock.`
      : 'Kein klarer App-Shell-Block erkannt.',
    brainRuntime
      ? `Das Brain selbst belegt ${brainRuntime.totalLines} Zeilen und hat damit genug Substanz für echte Runtime-Ausbauten.`
      : 'Brain-Runtime-Sektion fehlt im Index.',
    projectMemory
      ? `Vault und Memory liefern ${projectMemory.fileCount} Dateien Kontext für wiederverwendbares Wissen.`
      : 'Der Vault-Kontext ist im Worker kaum sichtbar.',
  ].filter(Boolean);

  const priorities = sections
    .slice()
    .sort((a, b) => rankSectionPriority(b) - rankSectionPriority(a))
    .slice(0, 3)
    .map((section, index) => ({
      id: section.id,
      label: index === 0 ? 'Hauptfokus' : `Fokus ${index + 1}`,
      detail: `${section.title} · ${section.fileCount} Dateien · ${section.totalLines} Zeilen`,
      score: rankSectionPriority(section),
    }));

  const nextActions = [];
  if (appShell && appShell.totalLines > 18000) {
    nextActions.push({
      id: 'split-app-shell',
      label: 'App Shell entlasten',
      detail: 'OwnerPanel/Landing/Studio-Flows weiter entkoppeln, damit Änderungen schneller und sauberer werden.',
      score: 91,
      severity: 'high',
    });
  }
  if (brainRuntime && brainRuntime.totalLines < 2600) {
    nextActions.push({
      id: 'grow-brain-runtime',
      label: 'Brain-Aktionslogik ausbauen',
      detail: 'Mehr echte Decisions, Ziele und ausführbare Empfehlungen in die Brain-Runtime legen.',
      score: 88,
      severity: 'high',
    });
  }
  if (!graphify.available) {
    nextActions.push({
      id: 'restore-graphify',
      label: 'Graphify wiederherstellen',
      detail: 'Code-Graph-Artefakte fehlen aktuell und schwächen die Repo-Orientierung.',
      score: 72,
      severity: 'medium',
    });
  }
  if (!antigravity.configured) {
    nextActions.push({
      id: 'configure-antigravity',
      label: 'Antigravity anbinden',
      detail: 'Der Worker sieht keinen vollständigen Antigravity-Kontext und verschenkt Re-Use-Potenzial.',
      score: 63,
      severity: 'medium',
    });
  }
  if (projectMemory && projectMemory.fileCount > 40) {
    nextActions.push({
      id: 'use-vault-more-hard',
      label: 'Vault-Wissen aggressiver nutzen',
      detail: 'Die große Vault-/Memory-Sektion sollte für Prompts, Alerts und Brain-Feeds stärker ausgespielt werden.',
      score: 66,
      severity: 'low',
    });
  }

  const issues = [];
  if (appShell && appShell.totalLines > 22000) {
    issues.push({
      id: 'app-shell-heavy',
      label: 'App Shell ist zu schwer',
      detail: `${appShell.totalLines} Zeilen in der Shell bremsen Verständnis und machen das Projekt unruhig.`,
      score: 93,
      severity: 'high',
    });
  }
  if (!graphify.available) {
    issues.push({
      id: 'missing-graphify',
      label: 'Graphify fehlt',
      detail: 'Kein Graph-Artefakt gefunden — Architekturblick ist dadurch schwächer.',
      score: 68,
      severity: 'medium',
    });
  }
  if (!antigravity.configured) {
    issues.push({
      id: 'missing-antigravity',
      label: 'Antigravity nicht konfiguriert',
      detail: 'Der schnelle CLI-Kontext für das Projekt ist derzeit nicht vollständig aktiv.',
      score: 57,
      severity: 'medium',
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    thoughts: thoughts.slice(0, 3),
    nextActions: nextActions.slice(0, 4),
    priorities,
    issues: issues.slice(0, 4),
  };
}

function buildIndexMarkdown(payload) {
  let md = '---\n';
  md += `type: "code-context-index"\n`;
  md += `updatedAt: "${payload.lastIndexedAt}"\n`;
  md += `consumers: ["Hermes", "Antigravity"]\n`;
  md += '---\n\n';
  md += '# Code Context Index\n\n';
  md += 'Dieses Dokument wird vom lokalen Brain Worker erzeugt und hält die Codebase in schnelle Kontextblöcke aufgeteilt.\n\n';
  md += '## Für wen\n';
  md += '- Hermes: schnelle Repo-Orientierung vor Änderungen\n';
  md += '- Antigravity: direkte Vault-/Code-Kontext-Blöcke ohne langes Suchen\n\n';
  md += '## Sektionen\n';
  for (const section of payload.sections) {
    md += `- ${section.title} (${section.fileCount} Dateien, ${section.totalLines} Zeilen)\n`;
  }
  md += '\n## Runtime\n';
  md += `- Worker PID: ${payload.worker.pid}\n`;
  md += `- Host: ${payload.worker.hostname}\n`;
  md += `- Letzter Index: ${payload.lastIndexedAt}\n`;
  md += `- Antigravity konfiguriert: ${payload.antigravity.configured ? 'ja' : 'nein'}\n`;
  md += `- Graphify verfügbar: ${payload.graphify.available ? 'ja' : 'nein'}\n`;
  return md;
}

function buildSectionMarkdown(section) {
  let md = '---\n';
  md += `type: "code-context-section"\n`;
  md += `id: "${section.id}"\n`;
  md += `title: "${section.title}"\n`;
  md += `updatedAt: "${new Date().toISOString()}"\n`;
  md += '---\n\n';
  md += `# ${section.title}\n\n`;
  md += `${section.description}\n\n`;
  md += `- Dateien: ${section.fileCount}\n`;
  md += `- Gesamtzeilen: ${section.totalLines}\n\n`;

  if (section.symbols.length > 0) {
    md += '## Wichtige Symbole\n';
    section.symbols.forEach((symbol) => {
      md += `- ${symbol}\n`;
    });
    md += '\n';
  }

  md += '## Top Dateien\n';
  section.topFiles.forEach((file) => {
    const symbols = file.symbols.length > 0 ? ` | Symbole: ${file.symbols.join(', ')}` : '';
    md += `- ${file.path} — ${file.lines} Zeilen${symbols}\n`;
  });
  md += '\n';

  md += '## Vollständige Dateiübersicht\n';
  section.files
    .slice()
    .sort((a, b) => a.path.localeCompare(b.path))
    .forEach((file) => {
      const symbols = file.symbols.length > 0 ? ` | ${file.symbols.join(', ')}` : '';
      md += `- ${file.path} (${file.lines})${symbols}\n`;
    });

  return md;
}

function writeContextMirrors(payload) {
  const indexMd = buildIndexMarkdown(payload);

  for (const target of CODE_CONTEXT_DIRS) {
    writeText(target.indexFile, indexMd);
    ensureDir(target.sectionsDir);
    for (const section of payload.sections) {
      writeText(path.join(target.sectionsDir, `${section.id}.md`), buildSectionMarkdown(section));
    }
  }
}

function buildPayload() {
  const sections = buildSectionEntries();
  const antigravity = buildAntigravityContext();
  const graphify = buildGraphifyContext();
  const lastIndexedAt = new Date().toISOString();
  const decisionEngine = buildDecisionEngine(sections, antigravity, graphify);

  return {
    project: PROJECT_NAME,
    mode: 'local-background-worker',
    status: 'healthy',
    consumers: CONSUMERS,
    lastIndexedAt,
    worker: {
      pid: PID,
      hostname: HOSTNAME,
      startedAt: STARTED_AT,
      intervalMs: LOOP_INTERVAL_MS,
      projectRoot: ROOT,
    },
    antigravity,
    graphify,
    decisionEngine,
    sections,
  };
}

function writeRuntimeStatus(payload) {
  const previous = readJsonSafe(RUNTIME_JSON);
  const runtime = {
    project: PROJECT_NAME,
    mode: 'local-background-worker',
    status: 'healthy',
    consumers: CONSUMERS,
    lastHeartbeatAt: new Date().toISOString(),
    lastIndexedAt: payload.lastIndexedAt,
    worker: payload.worker,
    antigravity: payload.antigravity,
    graphify: payload.graphify,
    decisionEngine: payload.decisionEngine,
    sectionCount: payload.sections.length,
    totalFilesIndexed: payload.sections.reduce((sum, section) => sum + section.fileCount, 0),
    previousHeartbeatAt: previous?.lastHeartbeatAt || null,
    sections: payload.sections.map((section) => ({
      id: section.id,
      title: section.title,
      fileCount: section.fileCount,
      totalLines: section.totalLines,
      topPaths: section.topFiles.slice(0, 3).map((file) => file.path),
    })),
  };

  writeJson(RUNTIME_JSON, runtime);
}

function runIndex() {
  ensureDir(PUBLIC_BRAIN_DIR);
  ensureDir(RUNTIME_DIR);

  const payload = buildPayload();
  const browserPayload = {
    project: payload.project,
    mode: payload.mode,
    status: payload.status,
    consumers: payload.consumers,
    lastIndexedAt: payload.lastIndexedAt,
    worker: payload.worker,
    antigravity: payload.antigravity,
    graphify: payload.graphify,
    decisionEngine: payload.decisionEngine,
    sections: payload.sections.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      fileCount: section.fileCount,
      totalLines: section.totalLines,
      symbols: section.symbols,
      topFiles: section.topFiles,
    })),
  };

  writeJson(CODE_CONTEXT_JSON, browserPayload);
  writeRuntimeStatus(payload);
  writeContextMirrors(payload);
  console.log(`[brain-worker] indexed ${payload.sections.length} sections at ${payload.lastIndexedAt}`);
  return payload;
}

const args = new Set(process.argv.slice(2));
const once = args.has('--once');
const loop = args.has('--loop') || !once;

runIndex();

if (loop && !once) {
  setInterval(() => {
    try {
      runIndex();
    } catch (error) {
      console.error('[brain-worker] reindex failed', error);
    }
  }, LOOP_INTERVAL_MS);
}
