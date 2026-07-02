import React from 'react';
import { Search, RefreshCw, Sparkles, Star } from 'lucide-react';
import { type NicheResult } from '../services/NicheService';

interface NicheFinderDashboardProps {
  nicheQuery: string;
  setNicheQuery: (val: string) => void;
  isSearchingNiche: boolean;
  handleSearchNiche: () => void;
  nicheResult: NicheResult | null;
  nicheAnalysisLoading: boolean;
  handleAnalyzeNicheAI: () => void;
}

export const NicheFinderDashboard: React.FC<NicheFinderDashboardProps> = ({
  nicheQuery,
  setNicheQuery,
  isSearchingNiche,
  handleSearchNiche,
  nicheResult,
  nicheAnalysisLoading,
  handleAnalyzeNicheAI
}) => {
  return (
    <div className="niche-dashboard-container">
      {/* Search Bar */}
      <div className="niche-search-row">
        <div style={{ flex: 1, position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', width: '20px', height: '20px' }} />
          <input 
            type="text" 
            placeholder="Nische oder Keyword suchen (z.B. 'Malbuch Erwachsene')..." 
            value={nicheQuery}
            onChange={(e) => setNicheQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchNiche()}
            style={{
              width: '100%',
              padding: '16px 16px 16px 48px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              color: 'var(--text-main)',
              fontSize: '16px',
              outline: 'none'
            }}
          />
        </div>
        <button 
          onClick={handleSearchNiche}
          disabled={isSearchingNiche || !nicheQuery.trim()}
          style={{
            background: 'var(--primary-main)',
            color: '#fff',
            border: 'none',
            padding: '0 32px',
            height: '54px',
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '16px',
            cursor: (isSearchingNiche || !nicheQuery.trim()) ? 'not-allowed' : 'pointer',
            opacity: (isSearchingNiche || !nicheQuery.trim()) ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {isSearchingNiche ? 'Analysiere...' : 'Suchen'}
        </button>
      </div>

      {isSearchingNiche && (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ fontWeight: 600 }}>Durchsuche Amazon Katalog...</div>
          <div style={{ fontSize: '13px', opacity: 0.7 }}>BSR, Preise und Konkurrenz werden ermittelt</div>
        </div>
      )}

      {!isSearchingNiche && nicheResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.5s ease-out' }}>
          
          {/* KPI Cards */}
          <div className="niche-kpis-grid">
            {[
              { label: "Nischen-Score", value: `${nicheResult.metrics.nicheScore}/100`, color: nicheResult.metrics.nicheScore > 70 ? "#22c55e" : "#f59e0b" },
              { label: "Suchvolumen (mtl.)", value: nicheResult.metrics.searchVolume.toLocaleString('de-DE'), color: "var(--text-main)" },
              { label: "Ø BSR (Top 10)", value: nicheResult.metrics.averageBsr.toLocaleString('de-DE'), color: "var(--text-main)" },
              { label: "Konkurrenz", value: nicheResult.metrics.competition.toLocaleString('de-DE'), color: "var(--text-main)" }
            ].map((kpi, i) => (
              <div key={i} style={{ background: 'var(--bg-elevated)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* AI Analysis Section */}
          <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontWeight: 700 }}>
                <Sparkles style={{ width: '18px', height: '18px' }} /> KI Nischen-Analyse
              </div>
              {!nicheResult.aiAnalysis && (
                <button 
                  onClick={handleAnalyzeNicheAI}
                  disabled={nicheAnalysisLoading}
                  style={{
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: nicheAnalysisLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {nicheAnalysisLoading ? 'Analysiere...' : 'Marktlücke finden'}
                </button>
              )}
            </div>
            {nicheResult.aiAnalysis ? (
              <div style={{ color: 'var(--text-main)', lineHeight: 1.6, fontSize: '15px', whiteSpace: 'pre-wrap' }}>
                {nicheResult.aiAnalysis}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                Lass unsere KI diese Metriken auswerten, um verborgene Marktlücken und den perfekten Buchtitel zu finden.
              </div>
            )}
          </div>

          {/* Competitors Table */}
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-main)' }}>Top Konkurrenten</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Titel</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Autor</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>BSR</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Preis</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Bewertungen</th>
                  </tr>
                </thead>
                <tbody>
                  {nicheResult.topCompetitors.map((comp, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '16px', fontWeight: 500, color: 'var(--text-main)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{comp.title}</td>
                      <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{comp.author}</td>
                      <td style={{ padding: '16px', color: 'var(--text-main)', fontWeight: 600 }}>#{Math.floor(comp.bsr).toLocaleString('de-DE')}</td>
                      <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{comp.price.toFixed(2)} €</td>
                      <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Star style={{ width: '12px', height: '12px', color: '#f59e0b', fill: '#f59e0b' }} />
                          <span>{comp.rating.toFixed(1)} ({comp.reviews})</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
