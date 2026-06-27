import React, { useEffect, useState, useRef } from 'react';
import { TrendingUp, X, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { GilService } from '../services/gil/GilService';

interface GilInsightsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  niche: string;
  currentStyle: string;
  refreshKey: number;
}

// Custom Tally Marks Component with Count-Up Animation
const TallyMarks: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // Check user preference for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    const duration = 700; // ms
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out quad
      const easeProgress = progress * (2 - progress);
      setDisplayValue(easeProgress * value);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [value]);

  const roundedValue = Math.round(displayValue);

  // Helper to render groups of 5 and remaining tallies in SVG
  const renderTallyGroups = () => {
    const fullGroups = Math.floor(roundedValue / 5);
    const remainder = roundedValue % 5;
    const groups = [];

    // Draw full groups of 5
    for (let i = 0; i < fullGroups; i++) {
      groups.push(
        <svg key={`group-${i}`} width="36" height="24" style={{ marginRight: '6px' }}>
          {/* Vertical lines */}
          <line x1="6" y1="4" x2="6" y2="20" stroke="#B23A2E" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="12" y1="4" x2="12" y2="20" stroke="#B23A2E" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="18" y1="4" x2="18" y2="20" stroke="#B23A2E" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="24" y1="4" x2="24" y2="20" stroke="#B23A2E" strokeWidth="2.5" strokeLinecap="round" />
          {/* Slash line */}
          <line x1="2" y1="18" x2="28" y2="6" stroke="#B23A2E" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    }

    // Draw remaining tallies
    if (remainder > 0) {
      const lines = [];
      for (let j = 0; j < remainder; j++) {
        const x = 6 + j * 6;
        lines.push(
          <line key={`rem-${j}`} x1={x} y1="4" x2={x} y2="20" stroke="#B23A2E" strokeWidth="2.5" strokeLinecap="round" />
        );
      }
      groups.push(
        <svg key="remainder" width={6 + remainder * 6} height="24">
          {lines}
        </svg>
      );
    }

    if (roundedValue === 0) {
      return <span style={{ color: '#8C8A82', fontSize: '12px', fontFamily: "'IBM Plex Mono', monospace" }}>Keine</span>;
    }

    return <div style={{ display: 'flex', alignItems: 'center' }}>{groups}</div>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
      {renderTallyGroups()}
      <span style={{ fontSize: '11px', color: '#B23A2E', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>
        {value.toFixed(1)} / Buch
      </span>
    </div>
  );
};

// SVG Sparkline Component
const Sparkline: React.FC<{ data: number[] }> = ({ data }) => {
  if (!data || data.length < 2) return null;

  const width = 160;
  const height = 30;
  const padding = 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    // Invert Y axis for screen space coords (max is at top, which is Y=padding)
    const y = padding + (1 - (val - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} style={{ background: 'transparent' }}>
      <polyline
        fill="none"
        stroke="#2F7A6B"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {/* Draw dot on the last node */}
      {data.length > 0 && (() => {
        const lastX = padding + (width - padding * 2);
        const lastY = padding + (1 - (data[data.length - 1] - min) / range) * (height - padding * 2);
        return <circle cx={lastX} cy={lastY} r="3" fill="#2F7A6B" />;
      })()}
    </svg>
  );
};

export const GilInsightsPanel: React.FC<GilInsightsPanelProps> = ({
  isOpen,
  onClose,
  bookId,
  refreshKey
}) => {
  const [stats, setStats] = useState(() => GilService.getStats());
  const [showTrend, setShowTrend] = useState(false);

  useEffect(() => {
    setStats(GilService.getStats());
  }, [bookId, refreshKey, isOpen]);

  if (!isOpen) return null;

  const diffReg = 1.2 - stats.avgReg; // Mock prior period comparison (1.2)
  const isBetter = diffReg >= 0;

  return (
    <div 
      className="gil-insights-panel"
      style={{
        width: '300px',
        flexShrink: 0,
        background: '#15151D',
        color: '#EDE6D6',
        borderLeft: '1px solid rgba(140, 138, 130, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', sans-serif",
        height: '100%',
        boxSizing: 'border-box',
        zIndex: 15,
        position: 'relative'
      }}
    >
      {/* Header */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '16px 20px', 
          borderBottom: '1px solid rgba(140, 138, 130, 0.2)',
          background: 'rgba(255, 255, 255, 0.02)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp style={{ width: '16px', height: '16px', color: '#C9963E' }} />
          <h2 
            style={{ 
              margin: 0, 
              fontSize: '18px', 
              fontWeight: 700, 
              fontFamily: "'Fraunces', serif",
              color: '#EDE6D6',
              letterSpacing: '-0.01em'
            }}
          >
            GIL Ledger Insights
          </h2>
        </div>
        <button 
          onClick={onClose}
          aria-label="Schließen"
          className="gil-insights-btn-focus"
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            color: '#8C8A82', 
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '4px',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#EDE6D6'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#8C8A82'}
        >
          <X style={{ width: '16px', height: '16px' }} />
        </button>
      </div>

      {/* Ledger Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
        
        {/* Sektion 1: Regenerierungen */}
        <div style={ledgerRowStyle}>
          <div style={labelContainerStyle}>
            <span style={labelStyle}>Ø REGENERIERUNGEN</span>
            <span style={subLabelStyle}>Aktuelle Periode</span>
          </div>
          <div style={valueContainerStyle}>
            <TallyMarks value={stats.avgReg} />
          </div>
        </div>

        <div style={ledgerRowStyle}>
          <div style={labelContainerStyle}>
            <span style={labelStyle}>TREND (VORPERIODE)</span>
            <span style={subLabelStyle}>Vergleich zu 1.2/Buch</span>
          </div>
          <div style={{ ...valueContainerStyle, flexDirection: 'row', gap: '6px', alignItems: 'center' }}>
            <span 
              style={{ 
                fontFamily: "'IBM Plex Mono', monospace", 
                fontSize: '14px', 
                fontWeight: 700,
                color: isBetter ? '#2F7A6B' : '#B23A2E' 
              }}
            >
              {isBetter ? '↓' : '↑'} {Math.abs(diffReg).toFixed(1)}
            </span>
            <span style={{ fontSize: '11px', color: '#8C8A82' }}>Regen.</span>
          </div>
        </div>

        {/* Sektion 2: Styles */}
        <div style={ledgerRowStyle}>
          <div style={labelContainerStyle}>
            <span style={labelStyle}>STÄRKSTER SCHREIBSTIL</span>
            <span style={subLabelStyle}>Nach QualityScorer</span>
          </div>
          <div style={{ ...valueContainerStyle, alignItems: 'flex-end' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#2F7A6B', textAlign: 'right' }}>
              {stats.bestStyle}
            </span>
          </div>
        </div>

        <div style={ledgerRowStyle}>
          <div style={labelContainerStyle}>
            <span style={labelStyle}>SCHWÄCHSTER SCHREIBSTIL</span>
            <span style={subLabelStyle}>Nach QualityScorer</span>
          </div>
          <div style={{ ...valueContainerStyle, alignItems: 'flex-end' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#B23A2E', textAlign: 'right' }}>
              {stats.worstStyle}
            </span>
          </div>
        </div>

        {/* Sektion 3: Golden Examples */}
        <div style={ledgerRowStyle}>
          <div style={labelContainerStyle}>
            <span style={labelStyle}>GOLDEN EXAMPLES</span>
            <span style={subLabelStyle}>Qualitätssicherung gesamt</span>
          </div>
          <div style={{ ...valueContainerStyle, flexDirection: 'row', gap: '6px', alignItems: 'baseline' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: '#C9963E' }}>
              {stats.goldenCount}
            </span>
            <span style={{ fontSize: '11px', color: '#8C8A82' }}>Stk.</span>
          </div>
        </div>

        {/* Sektion 4: Layout-Fixes */}
        <div style={ledgerRowStyle}>
          <div style={labelContainerStyle}>
            <span style={labelStyle}>LAYOUT FIXES DB</span>
            <span style={subLabelStyle}>Automatisch gelernt</span>
          </div>
          <div style={{ ...valueContainerStyle, flexDirection: 'row', gap: '6px', alignItems: 'baseline' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: '#EDE6D6' }}>
              {stats.layoutFixCount}
            </span>
            <span style={{ fontSize: '11px', color: '#8C8A82' }}>Fixes</span>
          </div>
        </div>

        {/* Expandable Section: Trend Sparkline */}
        <div style={{ marginTop: '32px' }}>
          <button
            onClick={() => setShowTrend(!showTrend)}
            className="gil-insights-btn-focus"
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(140, 138, 130, 0.2)',
              borderRadius: '4px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#EDE6D6',
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            <span>Verlauf (Letzte 8 Wochen)</span>
            {showTrend ? <ChevronUp style={{ width: '14px', height: '14px' }} /> : <ChevronDown style={{ width: '14px', height: '14px' }} />}
          </button>

          {showTrend && (
            <div 
              style={{
                marginTop: '12px',
                padding: '16px 14px',
                background: 'rgba(255, 255, 255, 0.01)',
                border: '1px solid rgba(140, 138, 130, 0.1)',
                borderRadius: '4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <Sparkline data={stats.trend} />
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '10px', color: '#8C8A82' }}>
                <span>Woche -8</span>
                <span>Woche 0</span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Footer Info Box */}
      <div 
        style={{ 
          padding: '16px 20px', 
          borderTop: '1px solid rgba(140, 138, 130, 0.2)',
          background: 'rgba(255,255,255,0.01)'
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <AlertTriangle style={{ width: '13px', height: '13px', color: '#C9963E', flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '11px', color: '#8C8A82', margin: 0, lineHeight: 1.4 }}>
            GIL optimiert Prompts und Layouts kontinuierlich. Cache und Vektoren werden projektübergreifend synchronisiert.
          </p>
        </div>
      </div>
    </div>
  );
};

// Styling Object definitions
const ledgerRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  padding: '14px 0',
  borderBottom: '1px solid rgba(140, 138, 130, 0.2)'
};

const labelContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  maxWidth: '60%'
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#8C8A82',
  letterSpacing: '0.04em'
};

const subLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#8C8A82',
  opacity: 0.6
};

const valueContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  maxWidth: '40%'
};
