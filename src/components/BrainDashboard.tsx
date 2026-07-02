import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderKey, Link2, Unlink, Activity, Zap, Waves, Cpu } from 'lucide-react';
import type { AppUser } from '../supabase';
import { BrainService, getNicheColor, slugify } from '../services/brain/BrainService';
import { ObsidianSyncService } from '../services/brain/ObsidianSyncService';
import { CloudQueueService } from '../services/brain/CloudQueueService';
import type { BrainState, BrainBookInput } from '../types/brain';
import { SupabaseStatusBox } from './SupabaseStatusBox';

interface BrainDashboardProps {
  accountId: string;
  books: BrainBookInput[];
  refreshKey: number;
  onBrainUpdate: () => void;
  theme: 'light' | 'dark';
  currentUser: AppUser | null;
}

type BrainNode = {
  id: string;
  name: string;
  color: string;
  val: number;
  type: 'brain-core' | 'core' | 'niche' | 'book' | 'page';
  label: string;
  layer: 0 | 1 | 2 | 3;
  lane: number;
};

type BrainLink = {
  source: string;
  target: string;
  value: number;
  color: string;
};

const NEON_COLORS = ['#5eead4', '#60a5fa', '#818cf8', '#22d3ee', '#38bdf8', '#c084fc', '#f0abfc', '#67e8f9'];
const VIEWBOX_W = 1600;
const VIEWBOX_H = 920;
const LEFT_PAD = 120;
const RIGHT_PAD = 1220;
const LAYER_Y = [430, 210, 430, 680] as const;

export const BrainDashboard: React.FC<BrainDashboardProps> = ({
  accountId,
  books,
  refreshKey,
  onBrainUpdate,
  theme,
  currentUser,
}) => {
  const [state, setState] = useState<BrainState>(() => BrainService.getState(accountId));
  const [obsidianBusy, setObsidianBusy] = useState(false);
  const [selectedNode, setSelectedNode] = useState<BrainNode | null>(null);

  const isDark = theme === 'dark';

  useEffect(() => {
    void ObsidianSyncService.init().then(() => {
      setState(BrainService.getState(accountId));
    });
  }, [accountId, refreshKey]);

  const handleConnectObsidian = async () => {
    setObsidianBusy(true);
    const ok = await ObsidianSyncService.connectVault();
    if (ok) {
      const files = await ObsidianSyncService.syncFullState(state, books, accountId);
      await CloudQueueService.processQueue(accountId);
      BrainService.markObsidianSync(accountId, files);
      setState(BrainService.getState(accountId));
      onBrainUpdate?.();
    }
    setObsidianBusy(false);
  };

  const handleDisconnectObsidian = async () => {
    await ObsidianSyncService.disconnectVault();
    setState(BrainService.getState(accountId));
  };

  const handleForceSync = async () => {
    if (!ObsidianSyncService.isConnected()) return;
    setObsidianBusy(true);
    const files = await ObsidianSyncService.syncFullState(state, books, accountId);
    await CloudQueueService.processQueue(accountId);
    BrainService.markObsidianSync(accountId, files);
    setState(BrainService.getState(accountId));
    onBrainUpdate?.();
    setObsidianBusy(false);
  };

  const graphData = useMemo(() => {
    const nodes: BrainNode[] = [];
    const links: BrainLink[] = [];
    const categories: Record<string, string[]> = {};

    Object.values(state.niches).forEach((niche) => {
      const lower = niche.keyword.toLowerCase();
      let cat = 'GLOBAL BRAIN';
      if (/hund|tier|katz|pferd/i.test(lower)) cat = 'TIERWELT';
      else if (/ernährung|diät|gesund|abnehmen|fitness|sport|vegan/i.test(lower)) cat = 'GESUNDHEIT';
      else if (/finanz|geld|krypto|business|aktien|invest/i.test(lower)) cat = 'BUSINESS';
      else if (/liebe|beziehung|dating|sex|ehe/i.test(lower)) cat = 'BEZIEHUNGEN';
      else if (/mindset|psycho|gewohnheit|erfolg|fokus/i.test(lower)) cat = 'PSYCHOLOGIE';
      else if (/kinder|erziehung|baby|schwanger/i.test(lower)) cat = 'FAMILIE';
      else if (/kochbuch|rezepte|backen|grillen/i.test(lower)) cat = 'KULINARIK';
      else if (/roman|krimi|thriller|fantasy|sci-fi/i.test(lower)) cat = 'FICTION';
      else if (/malbuch|rätsel|kinderbuch/i.test(lower)) cat = 'LOW CONTENT';

      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(niche.slug);
    });

    nodes.push({
      id: 'brain-core',
      name: 'JARVIS CORE',
      color: '#67e8f9',
      val: 34,
      type: 'brain-core',
      label: 'JARVIS CORE',
      layer: 0,
      lane: 0,
    });

    Object.keys(categories).forEach((catName, index) => {
      const color = NEON_COLORS[index % NEON_COLORS.length];
      const id = `core-${catName}`;
      nodes.push({
        id,
        name: catName,
        color,
        val: 18,
        type: 'core',
        label: catName,
        layer: 1,
        lane: index,
      });
      links.push({ source: 'brain-core', target: id, value: 4.8, color });
    });

    Object.values(state.niches).forEach((niche, index) => {
      const nicheId = `niche-${niche.slug}`;
      const color = getNicheColor(niche.keyword);
      nodes.push({
        id: nicheId,
        name: niche.keyword,
        color,
        val: 10 + Math.min(niche.pagesGenerated / 15, 8),
        type: 'niche',
        label: niche.keyword.length > 22 ? `${niche.keyword.slice(0, 22)}…` : niche.keyword,
        layer: 2,
        lane: index,
      });

      const catEntry = Object.entries(categories).find(([, slugs]) => slugs.includes(niche.slug));
      if (catEntry) {
        links.push({ source: `core-${catEntry[0]}`, target: nicheId, value: 3.2, color });
      }
    });

    books.forEach((book, bookIndex) => {
      const color = getNicheColor(book.marketNiche || book.title);
      const nicheSlug = slugify(book.marketNiche || book.title);
      const nicheId = `niche-${nicheSlug}`;

      if (!nodes.find((node) => node.id === nicheId)) {
        nodes.push({
          id: nicheId,
          name: book.marketNiche || book.title,
          color,
          val: 10,
          type: 'niche',
          label: book.title.slice(0, 22),
          layer: 2,
          lane: nodes.filter((node) => node.layer === 2).length,
        });
        links.push({ source: 'brain-core', target: nicheId, value: 2.5, color });
      }

      const bookId = `book-${book.id}`;
      nodes.push({
        id: bookId,
        name: book.title,
        color,
        val: 6,
        type: 'book',
        label: book.title.length > 18 ? `${book.title.slice(0, 18)}…` : book.title,
        layer: 3,
        lane: bookIndex,
      });
      links.push({ source: nicheId, target: bookId, value: 1.6, color });

      if (book.cmieStore) {
        Object.entries(book.cmieStore).slice(0, 3).forEach(([page], pageIndex) => {
          const pageId = `page-${book.id}-${page}`;
          nodes.push({
            id: pageId,
            name: `Kapitel ${page}`,
            color,
            val: 3.2,
            type: 'page',
            label: `${Number(page)}`,
            layer: 3,
            lane: books.length + bookIndex * 4 + pageIndex,
          });
          links.push({ source: bookId, target: pageId, value: 0.8, color });
        });
      }
    });

    return { nodes, links };
  }, [books, state]);

  const nodePositions = useMemo(() => {
    const entries = new Map<string, BrainNode & { x: number; y: number; w: number; h: number; pulseDelay: number }>();
    const layers: Record<number, BrainNode[]> = { 0: [], 1: [], 2: [], 3: [] };
    graphData.nodes.forEach((node) => layers[node.layer].push(node));

    Object.entries(layers).forEach(([layerKey, layerNodes]) => {
      const layer = Number(layerKey) as 0 | 1 | 2 | 3;
      if (layer === 0) {
        const core = layerNodes[0];
        if (!core) return;
        entries.set(core.id, {
          ...core,
          x: 820,
          y: LAYER_Y[0],
          w: 230,
          h: 110,
          pulseDelay: 0,
        });
        return;
      }

      const total = Math.max(layerNodes.length, 1);
      const span = RIGHT_PAD - LEFT_PAD;
      layerNodes.forEach((node, index) => {
        const x = total === 1 ? 820 : LEFT_PAD + (index / Math.max(total - 1, 1)) * span;
        const y = LAYER_Y[layer] + (layer === 3 ? ((index % 2) * 34 - 17) : 0);
        const w = node.type === 'core' ? 152 : node.type === 'niche' ? 132 : node.type === 'book' ? 110 : 34;
        const h = node.type === 'core' ? 48 : node.type === 'niche' ? 42 : node.type === 'book' ? 36 : 20;
        entries.set(node.id, {
          ...node,
          x,
          y,
          w,
          h,
          pulseDelay: index * 0.15,
        });
      });
    });

    return entries;
  }, [graphData]);

  const renderedLinks = useMemo(() => {
    return graphData.links
      .map((link, index) => {
        const source = nodePositions.get(link.source);
        const target = nodePositions.get(link.target);
        if (!source || !target) return null;
        const startX = source.x;
        const startY = source.y + source.h / 2;
        const endX = target.x;
        const endY = target.y - target.h / 2;
        const midY = (startY + endY) / 2;

        return {
          id: `${link.source}-${link.target}-${index}`,
          path: `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`,
          color: link.color,
          width: source.type === 'brain-core' || target.type === 'brain-core' ? 2.6 : Math.max(1, link.value * 0.8),
          delay: index * 0.15,
        };
      })
      .filter(Boolean) as Array<{ id: string; path: string; color: string; width: number; delay: number }>;
  }, [graphData.links, nodePositions]);

  const neuralStats = useMemo(() => {
    const activeNiches = Object.keys(state.niches).length;
    return {
      waves: activeNiches + books.length,
      links: graphData.links.length,
      pulse: state.totalEvents,
    };
  }, [books.length, graphData.links.length, state.niches, state.totalEvents]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 56px)',
        background: isDark
          ? 'linear-gradient(180deg, #020617 0%, #06111f 42%, #020617 100%)'
          : '#f4f5f7',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
        {theme === 'light' ? (
          <div style={{ position: 'absolute', inset: 0, background: '#f4f5f7' }} />
        ) : (
          <>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(34,211,238,0.04), rgba(2,6,23,0) 24%), linear-gradient(90deg, rgba(96,165,250,0.06), transparent 25%, transparent 75%, rgba(96,165,250,0.06))' }} />
            <div style={{ position: 'absolute', inset: 0, opacity: 0.18, backgroundImage: 'linear-gradient(rgba(125,211,252,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(125,211,252,0.04) 1px, transparent 1px)', backgroundSize: '120px 120px' }} />
          </>
        )}
      </div>

      <div style={{ position: 'absolute', top: 18, left: 18, zIndex: 10, display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {ObsidianSyncService.isConnected() ? (
            <>
              <button onClick={handleForceSync} disabled={obsidianBusy} style={actionBtnStyle('rgba(56,189,248,0.14)', 'rgba(56,189,248,0.28)', '#bae6fd')}>
                <Link2 style={{ width: '14px', height: '14px' }} />
                Auto Vault Sync
              </button>
              <button onClick={handleDisconnectObsidian} style={actionBtnStyle('rgba(15,23,42,0.65)', 'rgba(148,163,184,0.20)', 'rgba(226,232,240,0.82)')}>
                <Unlink style={{ width: '14px', height: '14px' }} />
                Trennen
              </button>
            </>
          ) : (
            <button onClick={handleConnectObsidian} style={actionBtnStyle('rgba(15,23,42,0.65)', 'rgba(148,163,184,0.20)', 'rgba(226,232,240,0.82)')}>
              <FolderKey style={{ width: '14px', height: '14px' }} />
              Obsidian Vault verbinden
            </button>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(88px, 1fr))',
            gap: '8px',
            width: 'min(420px, calc(100vw - 40px))',
          }}
        >
          <MiniSignalCard icon={<Zap style={{ width: 14, height: 14 }} />} label="Pulse" value={String(neuralStats.pulse)} />
          <MiniSignalCard icon={<Waves style={{ width: 14, height: 14 }} />} label="Wellen" value={String(neuralStats.waves)} />
          <MiniSignalCard icon={<Cpu style={{ width: 14, height: 14 }} />} label="Synapsen" value={String(neuralStats.links)} />
        </div>

        <SupabaseStatusBox
          currentUser={currentUser}
          accountId={accountId}
          theme={theme}
          refreshKey={refreshKey}
        />
      </div>

      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, x: 18 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.96, x: 18 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              width: '320px',
              padding: '18px',
              background: isDark ? 'rgba(3, 7, 18, 0.84)' : 'rgba(255,255,255,0.80)',
              backdropFilter: 'blur(22px)',
              border: `1px solid ${selectedNode.color}45`,
              borderRadius: '18px',
              color: isDark ? '#f8fafc' : '#0f172a',
              zIndex: 20,
              boxShadow: `0 25px 80px ${selectedNode.color}20`,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 12, height: 12, borderRadius: '999px', background: selectedNode.color, boxShadow: `0 0 18px ${selectedNode.color}` }} />
              <div>
                <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.75 }}>
                  {selectedNode.type.replace('-', ' ')}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{selectedNode.name}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '8px' }}>
              <SignalStat title="Strength" value={`${Math.round(selectedNode.val * 10)}%`} color={selectedNode.color} />
              <SignalStat title="Node ID" value={selectedNode.id} color="#cbd5e1" small />
            </div>

            <div style={{ fontSize: 12, lineHeight: 1.55, color: isDark ? '#cbd5e1' : '#334155' }}>
              {selectedNode.type === 'brain-core' && 'Zentrale Front-Ansicht für Goal, Progress, Summary und den gesamten Wissensfluss.'}
              {selectedNode.type === 'core' && 'Themen-Ebene: ordnet große Bereiche und verteilt Signale nach unten.'}
              {selectedNode.type === 'niche' && 'Nischen-Ebene: hier landen Marktlogik, Learnings und wiederverwendbare Muster.'}
              {selectedNode.type === 'book' && 'Buch-Ebene: verbindet konkrete Projekte mit dem Brain-Kontext.'}
              {selectedNode.type === 'page' && 'Mini-Impuls aus einer einzelnen Seite oder einem Kapitel.'}
            </div>

            <div
              style={{
                marginTop: '4px',
                padding: '10px 12px',
                background: `${selectedNode.color}14`,
                borderRadius: '12px',
                fontSize: '11px',
                color: selectedNode.color,
                fontFamily: 'monospace',
              }}
            >
              <Activity style={{ width: 12, height: 12, display: 'inline', marginRight: 6 }} />
              Flat neural flow active
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ position: 'absolute', inset: 0, zIndex: 1, padding: '20px 18px 18px 18px' }}>
        <svg
          viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
          style={{ width: '100%', height: '100%', display: 'block' }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="flowLine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="0" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[1, 2, 3].map((layer) => (
            <g key={`layer-${layer}`} opacity={0.55}>
              <line x1={90} y1={LAYER_Y[layer as 1 | 2 | 3]} x2={1510} y2={LAYER_Y[layer as 1 | 2 | 3]} stroke="url(#flowLine)" strokeWidth={1.2} />
            </g>
          ))}

          <text x={95} y={190} fill="#7dd3fc" fontSize="12" fontWeight="800" letterSpacing="0.25em">THEMES</text>
          <text x={95} y={410} fill="#7dd3fc" fontSize="12" fontWeight="800" letterSpacing="0.25em">BRAIN / NICHES</text>
          <text x={95} y={660} fill="#7dd3fc" fontSize="12" fontWeight="800" letterSpacing="0.25em">PROJECTS / CHAPTERS</text>

          {renderedLinks.map((link) => (
            <g key={link.id}>
              <path d={link.path} fill="none" stroke={`${link.color}18`} strokeWidth={link.width + 5} filter="url(#softGlow)" />
              <path d={link.path} fill="none" stroke={link.color} strokeOpacity={0.42} strokeWidth={link.width} strokeLinecap="round" />
              <motion.circle r="3.4" fill={link.color} filter="url(#softGlow)">
                <animateMotion dur="4.2s" begin={`${link.delay}s`} repeatCount="indefinite" path={link.path} />
              </motion.circle>
            </g>
          ))}

          {[...nodePositions.values()].map((node) => {
            const isCore = node.type === 'brain-core';
            const isPage = node.type === 'page';
            const x = node.x - node.w / 2;
            const y = node.y - node.h / 2;

            return (
              <g key={node.id} onClick={() => setSelectedNode(node)} style={{ cursor: 'pointer' }}>
                <motion.rect
                  x={x}
                  y={y}
                  width={node.w}
                  height={node.h}
                  rx={isCore ? 28 : isPage ? 10 : 18}
                  fill={`${node.color}20`}
                  stroke={`${node.color}66`}
                  strokeWidth={isCore ? 2.2 : 1.2}
                  filter="url(#softGlow)"
                  animate={{ opacity: [0.72, 1, 0.72] }}
                  transition={{ duration: isCore ? 2.4 : 2.0, repeat: Infinity, ease: 'easeInOut', delay: node.pulseDelay }}
                />
                <motion.rect
                  x={x + 4}
                  y={y + 4}
                  width={Math.max(node.w - 8, 14)}
                  height={Math.max(node.h - 8, 10)}
                  rx={isCore ? 24 : isPage ? 8 : 14}
                  fill={isCore ? 'rgba(8, 47, 73, 0.82)' : 'rgba(2, 6, 23, 0.80)'}
                  stroke={`${node.color}33`}
                  strokeWidth={1}
                />
                {isCore ? (
                  <>
                    <text x={node.x} y={node.y - 8} textAnchor="middle" fill="#d8f8ff" fontSize="22" fontWeight="900" letterSpacing="0.22em">
                      JARVIS
                    </text>
                    <text x={node.x} y={node.y + 20} textAnchor="middle" fill="#7dd3fc" fontSize="14" fontWeight="800" letterSpacing="0.30em">
                      CORE
                    </text>
                  </>
                ) : (
                  <text x={node.x} y={node.y + 4} textAnchor="middle" fill={isPage ? node.color : '#e2e8f0'} fontSize={isPage ? 11 : 12} fontWeight="800" letterSpacing="0.08em">
                    {isPage ? node.label : node.label.toUpperCase()}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

function actionBtnStyle(bg: string, border: string, color: string): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: 700,
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: '10px',
    color,
    cursor: 'pointer',
    backdropFilter: 'blur(14px)',
    boxShadow: '0 12px 30px rgba(2, 6, 23, 0.18)',
  };
}

const MiniSignalCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 12px',
      borderRadius: '14px',
      background: 'rgba(2, 6, 23, 0.66)',
      border: '1px solid rgba(125, 211, 252, 0.14)',
      backdropFilter: 'blur(18px)',
      color: '#e0f2fe',
      boxShadow: '0 18px 40px rgba(2, 6, 23, 0.24)',
    }}
  >
    <div style={{ width: 28, height: 28, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14, 165, 233, 0.12)', color: '#7dd3fc' }}>{icon}</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94a3b8' }}>{label}</span>
      <span style={{ fontSize: '16px', fontWeight: 800 }}>{value}</span>
    </div>
  </div>
);

const SignalStat: React.FC<{ title: string; value: string; color: string; small?: boolean }> = ({ title, value, color, small = false }) => (
  <div
    style={{
      padding: '10px 12px',
      borderRadius: '12px',
      background: 'rgba(15, 23, 42, 0.54)',
      border: '1px solid rgba(125, 211, 252, 0.12)',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      minWidth: 0,
    }}
  >
    <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8' }}>{title}</span>
    <span style={{ fontSize: small ? 11 : 14, fontWeight: 700, color, wordBreak: 'break-word' }}>{value}</span>
  </div>
);

export default BrainDashboard;
