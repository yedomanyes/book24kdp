import React, { useEffect, useMemo, useState } from 'react';
import {
  Brain,
  Zap,
  TrendingUp,
  BookOpen,
  Activity,
  FolderOpen,
  RefreshCw,
  Link2,
  Unlink,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { BrainService } from '../services/brain/BrainService';
import { ObsidianSyncService } from '../services/brain/ObsidianSyncService';
import type { BrainEvent, BrainState } from '../types/brain';
import type { BrainBookInput } from '../types/brain';

interface BrainDashboardProps {
  accountId: string;
  books: BrainBookInput[];
  refreshKey: number;
  onBrainUpdate?: () => void;
}

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  page_learned: { label: 'Seite gelernt', color: '#60a5fa' },
  outline_planned: { label: 'Gliederung', color: '#818cf8' },
  book_tracked: { label: 'Buch', color: '#34d399' },
  niche_updated: { label: 'Nische', color: '#22c55e' },
  pattern_success: { label: 'Erfolg', color: '#fbbf24' },
  pattern_avoid: { label: 'Vermeiden', color: '#f87171' },
  brain_rebuilt: { label: 'Rebuild', color: '#a78bfa' },
  obsidian_sync: { label: 'Obsidian', color: '#c084fc' },
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('de-DE', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export const BrainDashboard: React.FC<BrainDashboardProps> = ({
  accountId,
  books,
  refreshKey,
  onBrainUpdate,
}) => {
  const [state, setState] = useState<BrainState>(() => BrainService.getState(accountId));
  const [obsidianBusy, setObsidianBusy] = useState(false);
  const [rebuildBusy, setRebuildBusy] = useState(false);

  useEffect(() => {
    void ObsidianSyncService.init().then(() => {
      setState(BrainService.getState(accountId));
    });
  }, [accountId, refreshKey]);

  const niches = useMemo(
    () => Object.values(state.niches).sort((a, b) => b.pagesGenerated - a.pagesGenerated),
    [state.niches]
  );

  const handleConnectObsidian = async () => {
    setObsidianBusy(true);
    const ok = await ObsidianSyncService.connectVault();
    if (ok) {
      const files = await ObsidianSyncService.syncFullState(state, books);
      BrainService.markObsidianSync(accountId, files);
      onBrainUpdate?.();
    }
    setObsidianBusy(false);
  };

  const handleDisconnectObsidian = async () => {
    await ObsidianSyncService.disconnectVault();
    setState(BrainService.getState(accountId));
  };

  const handleRebuild = async () => {
    setRebuildBusy(true);
    BrainService.rebuildFromLibrary(accountId, books);
    onBrainUpdate?.();
    setRebuildBusy(false);
  };

  const handleForceSync = async () => {
    if (!ObsidianSyncService.isConnected()) return;
    setObsidianBusy(true);
    const files = await ObsidianSyncService.syncFullState(state, books);
    BrainService.markObsidianSync(accountId, files);
    onBrainUpdate?.();
    setObsidianBusy(false);
  };

  return (
    <div style={{
      padding: '32px 40px',
      overflowY: 'auto',
      height: 'calc(100vh - 110px)',
      background: 'var(--bg-main)',
      width: '100%',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Second Brain
            </div>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Brain style={{ width: '32px', height: '32px', color: '#a78bfa' }} />
              Book24 Brain
            </h1>
            <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: '14px', maxWidth: '560px' }}>
              Lernt automatisch aus jeder generierten Seite. Wissen wird komprimiert, Tokens sinken, Nischen werden schlauer.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handleRebuild}
              disabled={rebuildBusy}
              style={actionBtnStyle('transparent', 'var(--border-color)', 'var(--text-main)')}
            >
              <RefreshCw style={{ width: '14px', height: '14px', animation: rebuildBusy ? 'spin 1s linear infinite' : undefined }} />
              Aus Mediathek aufbauen
            </button>
            {ObsidianSyncService.isConnected() ? (
              <>
                <button onClick={handleForceSync} disabled={obsidianBusy} style={actionBtnStyle('rgba(167,139,250,0.12)', '#a78bfa', '#c4b5fd')}>
                  <Link2 style={{ width: '14px', height: '14px' }} />
                  Obsidian sync
                </button>
                <button onClick={handleDisconnectObsidian} style={actionBtnStyle('transparent', 'var(--border-color)', 'var(--text-muted)')}>
                  <Unlink style={{ width: '14px', height: '14px' }} />
                  Trennen
                </button>
              </>
            ) : (
              <button onClick={handleConnectObsidian} disabled={obsidianBusy} style={actionBtnStyle('linear-gradient(135deg, #7c3aed, #6d28d9)', 'transparent', '#fff')}>
                <FolderOpen style={{ width: '14px', height: '14px' }} />
                Obsidian Vault verbinden
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          <StatCard icon={<Activity style={{ width: 18, height: 18 }} />} label="Seiten gelernt" value={state.totalPagesLearned} accent="#60a5fa" />
          <StatCard icon={<BookOpen style={{ width: 18, height: 18 }} />} label="Bücher im Brain" value={state.totalBooksTracked} accent="#34d399" />
          <StatCard icon={<TrendingUp style={{ width: 18, height: 18 }} />} label="Nischen-Profile" value={Object.keys(state.niches).length} accent="#22c55e" />
          <StatCard icon={<Zap style={{ width: 18, height: 18 }} />} label="Ø Tokens/Seite" value={state.avgTokensPerPage || '—'} accent="#fbbf24" sub={state.tokenSamples > 0 ? `${state.tokenSamples} Samples` : undefined} />
          <StatCard icon={<Sparkles style={{ width: 18, height: 18 }} />} label="Brain-Events" value={state.totalEvents} accent="#a78bfa" />
          <StatCard
            icon={<FolderOpen style={{ width: 18, height: 18 }} />}
            label="Obsidian"
            value={ObsidianSyncService.isConnected() ? 'Live' : 'Offline'}
            accent={ObsidianSyncService.isConnected() ? '#c084fc' : 'var(--text-muted)'}
            sub={state.obsidianLastSync ? `Sync: ${formatTime(state.obsidianLastSync)}` : undefined}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="brain-grid">

          {/* Live Feed */}
          <section style={panelStyle}>
            <h2 style={sectionTitleStyle}>
              <Activity style={{ width: '18px', height: '18px', color: '#60a5fa' }} />
              Live — so lernt das Brain
            </h2>
            {state.events.length === 0 ? (
              <EmptyHint text="Noch keine Events. Generiere eine Seite — das Brain startet automatisch." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
                {state.events.slice(0, 25).map((evt) => (
                  <EventRow key={evt.id} event={evt} />
                ))}
              </div>
            )}
          </section>

          {/* Nischen */}
          <section style={panelStyle}>
            <h2 style={sectionTitleStyle}>
              <TrendingUp style={{ width: '18px', height: '18px', color: '#22c55e' }} />
              Nischen-Wissen
            </h2>
            {niches.length === 0 ? (
              <EmptyHint text="Nischen-Profile entstehen automatisch aus deinen Büchern." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {niches.slice(0, 8).map(n => (
                  <div key={n.slug} style={{
                    padding: '14px 16px',
                    background: 'var(--bg-main)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>{n.keyword}</span>
                      {n.avgMarketScore > 0 && (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.12)', padding: '2px 8px', borderRadius: '99px' }}>
                          Score {n.avgMarketScore}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span>{n.booksCount} Bücher</span>
                      <span>{n.pagesGenerated} Seiten</span>
                      <span>Ø {n.avgTokensPerPage} Tok.</span>
                    </div>
                    {n.successPatterns.length > 0 && (
                      <div style={{ marginTop: '8px', fontSize: '11px', color: '#86efac' }}>
                        ✓ {n.successPatterns[0]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Patterns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="brain-grid">
          <PatternPanel
            title="Erfolgreiche Patterns"
            icon={<CheckCircle2 style={{ width: '18px', height: '18px', color: '#fbbf24' }} />}
            items={state.patterns.success}
            emptyText="Entstehen bei guten CMIE-Runs und Markt-Scores ≥ 70."
            color="#fbbf24"
          />
          <PatternPanel
            title="Vermeiden (Anti-Patterns)"
            icon={<AlertTriangle style={{ width: '18px', height: '18px', color: '#f87171' }} />}
            items={state.patterns.avoid}
            emptyText="CMIE erkennt Duplikate — das Brain merkt sich das."
            color="#f87171"
          />
        </div>

        {/* How it works */}
        <section style={{ ...panelStyle, background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(96,165,250,0.04))', borderColor: 'rgba(167,139,250,0.25)' }}>
          <h2 style={sectionTitleStyle}>
            <Brain style={{ width: '18px', height: '18px', color: '#a78bfa' }} />
            Automatischer Lern-Loop
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {[
              { step: '1', title: 'Seite generiert', desc: 'CMIE extrahiert Summary, Begriffe, Patterns' },
              { step: '2', title: 'Brain komprimiert', desc: 'Nischen-Profil + Token-Stats werden aktualisiert' },
              { step: '3', title: 'Obsidian spiegelt', desc: 'MD-Dateien im Vault (wenn verbunden)' },
              { step: '4', title: 'Nächstes Buch', desc: 'Brain-Kontext spart Tokens & verbessert Qualität' },
            ].map(s => (
              <div key={s.step} style={{ padding: '16px', background: 'rgba(0,0,0,0.15)', borderRadius: '10px' }}>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#a78bfa', marginBottom: '6px' }}>{s.step}</div>
                <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px', color: 'var(--text-main)' }}>{s.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .brain-grid { grid-template-columns: 1fr !important; }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

function StatCard({ icon, label, value, accent, sub }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: string;
  sub?: string;
}) {
  return (
    <div style={{
      padding: '18px 20px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: '14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      <div style={{ color: accent, opacity: 0.9, width: 18, height: 18 }}>{icon}</div>
      <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

function EventRow({ event }: { event: BrainEvent }) {
  const meta = EVENT_LABELS[event.type] || { label: event.type, color: 'var(--text-muted)' };
  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      padding: '10px 12px',
      background: 'var(--bg-main)',
      borderRadius: '8px',
      border: '1px solid var(--border-color)',
      alignItems: 'flex-start',
    }}>
      <span style={{
        fontSize: '9px', fontWeight: 800, textTransform: 'uppercase',
        color: meta.color, background: `${meta.color}18`,
        padding: '3px 7px', borderRadius: '4px', flexShrink: 0, marginTop: '2px',
      }}>
        {meta.label}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-main)' }}>{event.message}</div>
        {event.detail && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.detail}
          </div>
        )}
      </div>
      <span style={{ fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0 }}>{formatTime(event.timestamp)}</span>
    </div>
  );
}

function PatternPanel({ title, icon, items, emptyText, color }: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  emptyText: string;
  color: string;
}) {
  return (
    <section style={panelStyle}>
      <h2 style={sectionTitleStyle}>{icon}{title}</h2>
      {items.length === 0 ? (
        <EmptyHint text={emptyText} />
      ) : (
        <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.slice(0, 12).map((item, i) => (
            <li key={i} style={{ fontSize: '12px', color: 'var(--text-main)', lineHeight: 1.5 }}>
              <span style={{ color }}>●</span>{' '}{item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6, padding: '20px 0', textAlign: 'center' }}>
      {text}
    </p>
  );
}

const panelStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: '16px',
  padding: '24px',
};

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 16px',
  fontSize: '16px',
  fontWeight: 700,
  color: 'var(--text-main)',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

function actionBtnStyle(bg: string, border: string, color: string): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: 600,
    background: bg,
    border: border === 'transparent' ? 'none' : `1px solid ${border}`,
    borderRadius: '8px',
    color,
    cursor: 'pointer',
  };
}

export default BrainDashboard;
