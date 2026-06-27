import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderKey, Link2, Unlink, Activity } from 'lucide-react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';
import { BrainService, getNicheColor, slugify } from '../services/brain/BrainService';
import { ObsidianSyncService } from '../services/brain/ObsidianSyncService';
import { CloudQueueService } from '../services/brain/CloudQueueService';
import Aurora from './Aurora';
import type { BrainState, BrainBookInput } from '../types/brain';

interface BrainDashboardProps {
  accountId: string;
  books: BrainBookInput[];
  refreshKey: number;
  onBrainUpdate: () => void;
  theme: 'light' | 'dark';
}

const NEON_COLORS = [
  '#ec4899', '#22d3ee', '#a78bfa', '#fbbf24', 
  '#10b981', '#ef4444', '#3b82f6', '#f97316',
];

export const BrainDashboard: React.FC<BrainDashboardProps> = ({
  accountId,
  books,
  refreshKey,
  onBrainUpdate,
  theme,
}) => {
  const [state, setState] = useState<BrainState>(() => BrainService.getState(accountId));
  const [obsidianBusy, setObsidianBusy] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const fgRef = useRef<any>(null);

  useEffect(() => {
    void ObsidianSyncService.init().then(() => {
      setState(BrainService.getState(accountId));
    });
  }, [accountId, refreshKey]);

  const handleConnectObsidian = async () => {
    setObsidianBusy(true);
    const ok = await ObsidianSyncService.connectVault();
    if (ok) {
      const files = await ObsidianSyncService.syncFullState(state, books);
      BrainService.markObsidianSync(accountId, files);
      await CloudQueueService.processQueue(accountId);
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
    const files = await ObsidianSyncService.syncFullState(state, books);
    BrainService.markObsidianSync(accountId, files);
    await CloudQueueService.processQueue(accountId);
    onBrainUpdate?.();
    setObsidianBusy(false);
  };

  // Generate Graph Data
  const graphData = useMemo(() => {
    const nodes: any[] = [];
    const links: any[] = [];
    const categories: Record<string, string[]> = {};
    Object.values(state.niches).forEach(niche => {
      const lower = niche.keyword.toLowerCase();
      let cat = 'ALLGEMEINES WISSEN';
      if (/hund|tier|katz|pferd/i.test(lower)) cat = 'FACHGEBIET: TIERWELT';
      else if (/ernährung|diät|gesund|abnehmen|fitness|sport|vegan/i.test(lower)) cat = 'FACHGEBIET: GESUNDHEIT';
      else if (/finanz|geld|krypto|business|aktien|invest/i.test(lower)) cat = 'FACHGEBIET: BUSINESS';
      else if (/liebe|beziehung|dating|sex|ehe/i.test(lower)) cat = 'FACHGEBIET: BEZIEHUNGEN';
      else if (/mindset|psycho|gewohnheit|erfolg|fokus/i.test(lower)) cat = 'FACHGEBIET: PSYCHOLOGIE';
      else if (/kinder|erziehung|baby|schwanger/i.test(lower)) cat = 'FACHGEBIET: FAMILIE';
      else if (/kochbuch|rezepte|backen|grillen/i.test(lower)) cat = 'FACHGEBIET: KULINARIK';
      else if (/roman|krimi|thriller|fantasy|sci-fi/i.test(lower)) cat = 'FACHGEBIET: FICTION';
      else if (/malbuch|rätsel|kinderbuch/i.test(lower)) cat = 'FACHGEBIET: LOW CONTENT';
      
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(niche.slug);
    });

    // 1. Dynamic Core Regions (Macro Categories)
    Object.keys(categories).forEach((catName, index) => {
      const color = NEON_COLORS[index % NEON_COLORS.length];
      nodes.push({
        id: `core-${catName}`,
        name: catName,
        color: color,
        val: 30, // Big macro nodes
        type: 'core',
        label: `ZENTRUM:\n${catName}`,
      });
    });

    // 2. Niches connected to Core Regions
    Object.values(state.niches).forEach((niche) => {
      const nicheId = `niche-${niche.slug}`;
      const color = getNicheColor(niche.keyword);
      nodes.push({
        id: nicheId,
        name: niche.keyword,
        color,
        val: 15 + Math.min(niche.pagesGenerated / 20, 15),
        type: 'niche',
        label: `SYNAPSE:\n${niche.keyword.toUpperCase()}`,
      });

      // Find the macro category for this niche to link it
      const catEntry = Object.entries(categories).find(([_, slugs]) => slugs.includes(niche.slug));
      if (catEntry) {
        links.push({ source: `core-${catEntry[0]}`, target: nicheId, value: 5 });
      }
    });

    // 3. Books connected to Niches
    books.forEach((book) => {
      const color = getNicheColor(book.marketNiche || book.title);
      const nicheSlug = slugify(book.marketNiche || book.title);
      const nicheId = `niche-${nicheSlug}`;

      // Ensure the niche exists in graph (fallback)
      if (!nodes.find((n) => n.id === nicheId)) {
        nodes.push({ id: nicheId, name: book.marketNiche || book.title, color, val: 12, type: 'niche', label: `SYNAPSE\n${book.title.slice(0, 10)}` });
        links.push({ source: `core-ALLGEMEINES WISSEN`, target: nicheId, value: 2 });
      }

      const bookId = `book-${book.id}`;
      nodes.push({ id: bookId, name: book.title, color, val: 8, type: 'book', label: `BOOK\n${book.title.slice(0,20)}...` });
      links.push({ source: nicheId, target: bookId, value: 1.5 });

      // Connect pages/chapters to book
      if (book.cmieStore) {
        Object.entries(book.cmieStore).forEach(([page, mem]) => {
          const pageId = `page-${book.id}-${page}`;
          nodes.push({ id: pageId, name: `Chap ${page}: ${mem.chapter_title}`, color, val: 3, type: 'page' });
          links.push({ source: bookId, target: pageId, value: 1 });
        });
      }
    });

    return { nodes, links };
  }, [books, state]);

  const initialCameraSet = useRef(false);

  // Adjust camera to look at center and tighten forces
  useEffect(() => {
    if (fgRef.current) {
      if (!initialCameraSet.current) {
        try {
          const saved = localStorage.getItem('brainCameraPos');
          if (saved) {
            fgRef.current.cameraPosition(JSON.parse(saved));
          } else {
            fgRef.current.cameraPosition({ x: 0, y: 0, z: 120 });
          }
        } catch(e) {
          fgRef.current.cameraPosition({ x: 0, y: 0, z: 120 });
        }
        initialCameraSet.current = true;
      }
      
      // Adjust spacing - make things have a bit more distance
      fgRef.current.d3Force('charge').strength(-100); // Higher negative value = more repulsion
      fgRef.current.d3Force('link').distance((link: any) => {
        if (link.source?.type === 'core' && link.target?.type === 'niche') return 60;
        if (link.target?.type === 'book') return 40;
        return 20;
      });
    }
  }, [graphData]);

  // Save camera position every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (fgRef.current && initialCameraSet.current) {
        try {
          const pos = fgRef.current.cameraPosition();
          localStorage.setItem('brainCameraPos', JSON.stringify(pos));
        } catch(e) {}
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Animation loop for pulsing nodes
  const animatedNodesRef = useRef<any[]>([]);
  
  useEffect(() => {
    let frameId: number;
    const animate = () => {
      const time = Date.now() * 0.003;
      animatedNodesRef.current.forEach((n: any) => {
        // pulse opacity between 0.3 and 0.8
        const pulse = Math.sin(time + n.phase) * 0.5 + 0.5; 
        if (n.auraMat) {
          n.auraMat.opacity = 0.3 + pulse * 0.5;
        }
        if (n.coreMat) {
          n.coreMat.opacity = 0.8 + pulse * 0.2;
        }
      });
      frameId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 56px)', background: theme === 'light' ? '#f4f4f5' : '#000005', overflow: 'hidden' }}>
      {/* Absolute Header with Obsidian controls */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, display: 'flex', gap: '8px' }}>
        {ObsidianSyncService.isConnected() ? (
          <>
            <button onClick={handleForceSync} disabled={obsidianBusy} style={actionBtnStyle('rgba(96,165,250,0.15)', '#60a5fa', '#93c5fd')}>
              <Link2 style={{ width: '14px', height: '14px' }} />
              Obsidian Sync
            </button>
            <button onClick={handleDisconnectObsidian} style={actionBtnStyle('rgba(255,255,255,0.05)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.6)')}>
              <Unlink style={{ width: '14px', height: '14px' }} />
              Trennen
            </button>
          </>
        ) : (
          <button onClick={handleConnectObsidian} style={actionBtnStyle('rgba(255,255,255,0.05)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.6)')}>
            <FolderKey style={{ width: '14px', height: '14px' }} />
            Obsidian Vault verbinden
          </button>
        )}
      </div>

      {/* Info Panel Hover */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              width: '320px',
              padding: '20px',
              background: theme === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(10,10,15,0.7)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${selectedNode.color}40`,
              borderRadius: '16px',
              color: theme === 'light' ? '#000' : '#fff',
              zIndex: 20,
              boxShadow: `0 8px 32px 0 ${selectedNode.color}20`,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: selectedNode.color, boxShadow: `0 0 10px ${selectedNode.color}` }} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, fontFamily: 'monospace' }}>
                {selectedNode.type.toUpperCase()}_NODE
              </h3>
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, borderBottom: `1px solid ${selectedNode.color}30`, paddingBottom: '12px' }}>
              {selectedNode.name}
            </div>
            
            <div style={{ fontSize: '12px', opacity: 0.7, fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>ID: {selectedNode.id}</div>
              <div>SIGNAL_STRENGTH: {(selectedNode.val * 10).toFixed(1)}%</div>
              {selectedNode.type === 'niche' && <div>CONNECTION_TYPE: Market Logic</div>}
              {selectedNode.type === 'book' && <div>CONNECTION_TYPE: Context Memory</div>}
              {selectedNode.type === 'page' && <div>CONNECTION_TYPE: Raw Token Data</div>}
              {selectedNode.type === 'core' && <div>CONNECTION_TYPE: Global State</div>}
              {selectedNode.type === 'synapse' && <div>CONNECTION_TYPE: Pattern Logic</div>}
            </div>

            <div style={{
              marginTop: '8px',
              padding: '8px',
              background: `${selectedNode.color}15`,
              borderRadius: '8px',
              fontSize: '11px',
              color: selectedNode.color,
              fontFamily: 'monospace'
            }}>
              <Activity style={{ width: 12, height: 12, display: 'inline', marginRight: 4 }} />
              Active processing...
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ width: '100%', height: '100%', cursor: 'move' }}>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {theme === 'light' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
            <Aurora
              colorStops={["#e0e0e0","#ffffff","#ffffff"]}
              amplitude={1}
              blend={0.5}
            />
          </div>
        )}
        <ForceGraph3D
          ref={fgRef}
          graphData={graphData}
          onNodeClick={(node) => setSelectedNode(node)}
          nodeLabel={() => ''} // Disabled native tooltips in favor of custom panel
          nodeColor="color"
          nodeRelSize={4}
          nodeResolution={32}
          backgroundColor="rgba(0,0,0,0)"
          enableNodeDrag={false}
          nodeThreeObject={(node: any) => {
            if (node.type === 'synapse' || node.type === 'page') {
              // Glowing sphere
              const material = new THREE.MeshBasicMaterial({ color: node.color, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
              const sphere = new THREE.Mesh(new THREE.SphereGeometry(node.val), material);
              animatedNodesRef.current.push({ auraMat: material, phase: Math.random() * Math.PI * 2 });
              return sphere;
            }

            const group = new THREE.Group();

            // Inner glowing core
            const coreMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 1 });
            const core = new THREE.Mesh(new THREE.SphereGeometry(node.val * 0.4, 32, 32), coreMat);
            
            // Outer glow aura
            const auraMat = new THREE.MeshBasicMaterial({ color: node.color, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending });
            const aura = new THREE.Mesh(new THREE.SphereGeometry(node.val * 1.5, 32, 32), auraMat);
            
            animatedNodesRef.current.push({ coreMat, auraMat, phase: Math.random() * Math.PI * 2 });

            group.add(core);
            group.add(aura);

            if (node.label) {
              const sprite = new SpriteText(node.label);
              sprite.color = node.color;
              sprite.textHeight = node.type === 'core' ? 6 : 4;
              sprite.fontFace = 'monospace';
              sprite.fontWeight = 'bold';
              sprite.backgroundColor = 'rgba(0,0,0,0.8)';
              sprite.borderColor = node.color;
              sprite.borderWidth = 0.5;
              sprite.borderRadius = 2;
              sprite.padding = 3;
              sprite.position.set(0, node.val + 10, 0);
              group.add(sprite);
            }

            return group;
          }}
          linkColor={(link: any) => {
            const isCore = link.source?.type === 'core' || link.target?.type === 'core';
            const isNiche = link.source?.type === 'niche' || link.target?.type === 'niche';
            if (isCore || isNiche) {
              return link.source?.color || link.target?.color || 'rgba(255,255,255,0.5)';
            }
            return theme === 'light' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)';
          }}
          linkOpacity={0.6}
          linkWidth={(link: any) => (link.value ? link.value * 2 : 1)}
          linkDirectionalParticles={(link: any) => {
            if (link.source?.type === 'core' || link.target?.type === 'core') return 5;
            if (link.target?.type === 'niche' || link.source?.type === 'niche') return 3;
            return 2;
          }}
          linkDirectionalParticleWidth={(link: any) => (link.source?.type === 'core' || link.target?.type === 'core' ? 3 : 2)}
          linkDirectionalParticleColor={(link: any) => link.source?.color || link.target?.color || '#ffffff'}
          linkDirectionalParticleSpeed={(link: any) => link.value ? 0.015 * link.value : 0.01}
          d3VelocityDecay={0.2}
          cooldownTicks={100}
        />
      </div>
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
    fontWeight: 600,
    background: bg,
    border: border === 'transparent' ? 'none' : `1px solid ${border}`,
    borderRadius: '8px',
    color,
    cursor: 'pointer',
    backdropFilter: 'blur(10px)',
  };
}

export default BrainDashboard;
