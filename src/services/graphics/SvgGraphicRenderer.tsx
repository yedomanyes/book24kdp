import React from 'react';
import type { GraphicDecision, GraphicLayoutVariant } from '../../types/graphics';
import { Layers, ArrowRight, ArrowDown, Sparkles, Loader2 } from 'lucide-react';

interface SvgGraphicRendererProps {
  decision: GraphicDecision;
  onVariantChange?: (variant: GraphicLayoutVariant) => void;
  onUpdateDecision?: (updates: Partial<GraphicDecision>) => void;
  onRegenerate?: () => void;
  onRegenerateImage?: () => void;
}

export const SvgGraphicRenderer: React.FC<SvgGraphicRendererProps> = ({
  decision,
  onVariantChange,
  onUpdateDecision,
  onRegenerate,
  onRegenerateImage
}) => {
  if (!decision || !decision.grafik_sinnvoll) return null;

  if (decision.isRegenerating) {
    return (
      <div style={{ margin: '24px 0', padding: '36px 20px', textAlign: 'center', background: '#0f172a', border: '1px dashed #38bdf8', borderRadius: '14px', color: '#38bdf8' }}>
        <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 12px auto' }} />
        <div style={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}>KI generiert Grafik & Inhalte neu...</div>
        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Analyse des Kapiteltexts läuft</div>
      </div>
    );
  }

  const { typ, titel, selectedVariant = 'horizontal', pipeline = 'A' } = decision;
  const themeColor = decision.themeColor || '#38bdf8';
  const fontFamily = decision.fontFamily || "'Plus Jakarta Sans', system-ui, sans-serif";
  const borderRadius = decision.borderRadius !== undefined ? decision.borderRadius : 14;
  const preset = decision.preset || 'modern';

  // Pipeline B: Echte Bild-Illustration
  if (pipeline === 'B') {
    return (
      <div style={{
        margin: '20px 0',
        padding: '16px',
        backgroundColor: '#0f172a',
        border: `1px solid ${themeColor}`,
        borderRadius: `${borderRadius}px`,
        boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        fontFamily
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: themeColor, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            🎨 Illustration (Pipeline B)
          </span>
          {onRegenerateImage && (
            <button
              onClick={onRegenerateImage}
              style={{
                padding: '4px 10px', fontSize: '10px', fontWeight: 700,
                background: 'rgba(56,189,248,0.15)', color: themeColor,
                border: `1px solid ${themeColor}`, borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              🔄 Neu generieren
            </button>
          )}
        </div>
        {decision.imageUrl ? (
          <img src={decision.imageUrl} alt={titel || 'Kapitel-Illustration'} style={{ width: '100%', borderRadius: '8px', objectFit: 'cover' }} />
        ) : (
          <div style={{ padding: '40px 20px', textAlign: 'center', border: `1px dashed ${themeColor}`, borderRadius: '8px', color: '#94a3b8', fontSize: '12px' }}>
            ⏳ Bild wird über API illustriert...<br/>
            <span style={{ fontSize: '10px', color: '#64748b' }}>Prompt: {decision.imagePrompt}</span>
          </div>
        )}
      </div>
    );
  }

  // Pipeline A: Structured SVG Data Graphics
  const nextVariant = (): GraphicLayoutVariant => {
    const variants: GraphicLayoutVariant[] = ['horizontal', 'vertical', 'cards'];
    const idx = variants.indexOf(selectedVariant);
    return variants[(idx + 1) % variants.length];
  };

  return (
    <div style={{
      margin: '24px 0',
      padding: '20px',
      background: preset === 'clean' ? '#0f172a' : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      border: `1.5px solid ${themeColor}`,
      borderRadius: `${borderRadius}px`,
      boxShadow: '0 10px 35px rgba(0,0,0,0.3)',
      fontFamily,
      color: '#f8fafc',
      position: 'relative'
    }}>
      {/* Design Toolbar (Sleek Presets & Customization) */}
      {onUpdateDecision && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px',
          marginBottom: '16px', padding: '7px 10px', background: 'rgba(0,0,0,0.35)',
          borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '10.5px'
        }}>
          <span style={{ color: '#94a3b8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3, fontSize: '9.5px' }}>
            <Sparkles size={11} color={themeColor} /> Stil:
          </span>
          {(['modern', 'eckig', 'rund', 'clean'] as const).map(p => (
            <button
              key={p}
              onMouseDown={e => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                const br = p === 'eckig' ? 0 : (p === 'rund' ? 24 : 14);
                onUpdateDecision({ preset: p, borderRadius: br });
              }}
              style={{
                background: preset === p ? themeColor : 'rgba(255,255,255,0.06)',
                color: preset === p ? (themeColor === '#f59e0b' || themeColor === '#38bdf8' || themeColor === '#10b981' ? '#0f172a' : '#fff') : '#cbd5e1',
                border: 'none', borderRadius: '4px', padding: '2px 7px', cursor: 'pointer', fontWeight: 700, fontSize: '9px', textTransform: 'capitalize'
              }}
            >
              {p}
            </button>
          ))}

          <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.12)', margin: '0 2px' }} />

          <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: '9.5px' }}>Farbe:</span>
          {(['#38bdf8', '#2563eb', '#10b981', '#a855f7', '#f59e0b', '#ef4444'] as const).map(c => (
            <button
              key={c}
              onMouseDown={e => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onUpdateDecision({ themeColor: c }); }}
              style={{
                width: 14, height: 14, borderRadius: '50%', background: c,
                border: themeColor === c ? '2px solid #fff' : 'none', cursor: 'pointer',
                boxShadow: themeColor === c ? `0 0 8px ${c}` : 'none'
              }}
              title={c}
            />
          ))}

          <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.12)', margin: '0 2px' }} />

          <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: '9.5px' }}>Schrift:</span>
          <select
            value={fontFamily}
            onMouseDown={e => e.stopPropagation()}
            onChange={e => { e.stopPropagation(); onUpdateDecision({ fontFamily: e.target.value }); }}
            style={{ background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, fontSize: '9px', padding: '1px 4px', outline: 'none' }}
          >
            <option value="'Plus Jakarta Sans', system-ui, sans-serif">Standard (Jakarta)</option>
            <option value="'Inter', system-ui, sans-serif">Inter Modern</option>
            <option value="Georgia, serif">Georgia (Klassisch)</option>
            <option value="'Courier New', monospace">Monospace</option>
          </select>

          <div style={{ flex: 1 }} />

          {onRegenerate && (
            <button
              onMouseDown={e => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
              style={{
                background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', color: '#fff',
                border: `1px solid ${themeColor}`, borderRadius: 5, padding: '2px 8px',
                cursor: 'pointer', fontWeight: 800, fontSize: '9px', display: 'flex', alignItems: 'center', gap: 4,
                boxShadow: '0 2px 8px rgba(37,99,235,0.4)'
              }}
              title="Analysiert den Text neu und generiert frische SVG Strukturen"
            >
              🔄 Neu generieren
            </button>
          )}
        </div>
      )}

      {/* Header Title Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={16} color={themeColor} />
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.02em' }}>
            {titel || 'Visuelle Gliederungsübersicht'}
          </span>
        </div>
        
        {typ !== 'tabelle' && onVariantChange && (
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onVariantChange(nextVariant()); }}
            style={{
              padding: '4px 10px', fontSize: '9.5px', fontWeight: 700,
              background: 'rgba(255,255,255,0.07)',
              color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '6px', cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: '4px'
            }}
          >
            📐 Layout: {selectedVariant.toUpperCase()}
          </button>
        )}
      </div>

      {/* RENDERER: TABELLE */}
      {typ === 'tabelle' && decision.tabelle && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: themeColor === '#38bdf8' ? '#1e3a8a' : themeColor, color: '#ffffff', textAlign: 'left' }}>
                {decision.tabelle.spalten.map((sp, idx) => (
                  <th key={idx} style={{ padding: '10px 14px', fontWeight: 700, borderBottom: `2px solid ${themeColor}` }}>{sp}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {decision.tabelle.zeilen.map((reihe, rIdx) => (
                <tr key={rIdx} style={{ backgroundColor: rIdx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {reihe.map((zelle, zIdx) => (
                     <td key={zIdx} style={{ padding: '9px 14px', color: zIdx === 0 ? themeColor : '#e2e8f0', fontWeight: zIdx === 0 ? 600 : 400 }}>{zelle}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* RENDERER: PROZESS / FLOW */}
      {typ === 'prozess' && decision.prozess && (
        <div style={{
          display: 'flex',
          flexDirection: selectedVariant === 'vertical' ? 'column' : selectedVariant === 'cards' ? 'row' : 'row',
          flexWrap: selectedVariant === 'cards' ? 'wrap' : 'nowrap',
          gap: '12px',
          alignItems: selectedVariant === 'vertical' ? 'stretch' : 'center',
          overflowX: selectedVariant === 'horizontal' ? 'auto' : 'visible',
          padding: '8px 0'
        }}>
          {decision.prozess.schritte.map((schritt, idx) => (
            <React.Fragment key={idx}>
              <div style={{
                flex: selectedVariant === 'horizontal' ? '1 0 160px' : selectedVariant === 'cards' ? '1 1 calc(50% - 12px)' : '1',
                padding: '14px',
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${themeColor}`,
                borderRadius: `${Math.max(4, borderRadius - 4)}px`,
                position: 'relative',
                boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
              }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: themeColor, marginBottom: '6px' }}>SCHRITT 0{idx + 1}</div>
                <div style={{ fontSize: '12px', color: '#ffffff', lineHeight: '1.4' }}>{schritt}</div>
              </div>

              {idx < (decision.prozess?.schritte.length || 0) - 1 && selectedVariant !== 'cards' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: themeColor, flexShrink: 0 }}>
                  {selectedVariant === 'vertical' ? <ArrowDown size={20} /> : <ArrowRight size={20} />}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* RENDERER: TIMELINE */}
      {typ === 'timeline' && decision.timeline && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '12px', borderLeft: `2px solid ${themeColor}`, marginLeft: '8px' }}>
          {decision.timeline.punkte.map((pkt, idx) => (
            <div key={idx} style={{ position: 'relative', paddingLeft: '16px' }}>
              <div style={{ position: 'absolute', left: '-19px', top: '2px', width: '12px', height: '12px', borderRadius: '50%', background: themeColor, border: '3px solid #0f172a', boxShadow: `0 0 10px ${themeColor}` }} />
              <span style={{ fontSize: '10.5px', fontWeight: 800, color: themeColor, background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px' }}>{pkt.zeitpunkt}</span>
              <div style={{ fontSize: '12.5px', color: '#f8fafc', marginTop: '6px', lineHeight: '1.4' }}>{pkt.ereignis}</div>
            </div>
          ))}
        </div>
      )}

      {/* RENDERER: HIERARCHIE */}
      {typ === 'hierarchie' && decision.hierarchie && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '10px 0' }}>
          {decision.hierarchie.ebenen.map((ebene, idx) => (
            <React.Fragment key={idx}>
              <div style={{
                padding: '12px 24px',
                background: idx === 0 ? themeColor : 'rgba(255,255,255,0.05)',
                border: `1px solid ${themeColor}`,
                borderRadius: `${Math.max(4, borderRadius - 4)}px`,
                fontWeight: idx === 0 ? 800 : 600,
                fontSize: idx === 0 ? '13px' : '12px',
                color: idx === 0 && (themeColor === '#f59e0b' || themeColor === '#38bdf8' || themeColor === '#10b981') ? '#0f172a' : '#ffffff',
                textAlign: 'center',
                boxShadow: idx === 0 ? `0 4px 20px ${themeColor}66` : undefined
              }}>
                {ebene}
              </div>
              {idx < (decision.hierarchie?.ebenen.length || 0) - 1 && (
                <div style={{ width: '2px', height: '16px', background: themeColor }} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
