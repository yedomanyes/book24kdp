import React from 'react';
import type { GraphicDecision, GraphicLayoutVariant } from '../../types/graphics';
import { Layers, ArrowRight, ArrowDown, CheckCircle2 } from 'lucide-react';

interface SvgGraphicRendererProps {
  decision: GraphicDecision;
  onVariantChange?: (variant: GraphicLayoutVariant) => void;
  onRegenerateImage?: () => void;
}

export const SvgGraphicRenderer: React.FC<SvgGraphicRendererProps> = ({
  decision,
  onVariantChange,
  onRegenerateImage
}) => {
  if (!decision || !decision.grafik_sinnvoll) return null;

  const { typ, titel, selectedVariant = 'horizontal', pipeline = 'A' } = decision;

  // Pipeline B: Echte Bild-Illustration
  if (pipeline === 'B') {
    return (
      <div style={{
        margin: '20px 0',
        padding: '16px',
        backgroundColor: '#0f172a',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '12px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            🎨 Illustration (Pipeline B)
          </span>
          {onRegenerateImage && (
            <button
              onClick={onRegenerateImage}
              style={{
                padding: '4px 10px', fontSize: '10px', fontWeight: 700,
                background: 'rgba(56,189,248,0.15)', color: '#38bdf8',
                border: '1px solid rgba(56,189,248,0.4)', borderRadius: '6px',
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
          <div style={{ padding: '40px 20px', textAlign: 'center', border: '1px dashed rgba(56,189,248,0.3)', borderRadius: '8px', color: '#94a3b8', fontSize: '12px' }}>
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
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      border: '1px solid rgba(56, 189, 248, 0.25)',
      borderRadius: '14px',
      boxShadow: '0 10px 35px rgba(0,0,0,0.3)',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      color: '#f8fafc'
    }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={16} color="#38bdf8" />
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.02em' }}>
            {titel || 'Visuelle Gliederungsübersicht'}
          </span>
        </div>
        
        {typ !== 'tabelle' && onVariantChange && (
          <button
            onClick={() => onVariantChange(nextVariant())}
            style={{
              padding: '5px 12px', fontSize: '10px', fontWeight: 700,
              background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
              color: '#ffffff', border: '1px solid rgba(56,189,248,0.4)',
              borderRadius: '8px', cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: '5px', boxShadow: '0 2px 10px rgba(37,99,235,0.3)'
            }}
            title="Wechselt das SVG-Layout rein im Frontend (Zero API Cost)"
          >
            🔄 Layout: {selectedVariant.toUpperCase()}
          </button>
        )}
      </div>

      {/* RENDERER: TABELLE */}
      {typ === 'tabelle' && decision.tabelle && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#1e3a8a', color: '#ffffff', textAlign: 'left' }}>
                {decision.tabelle.spalten.map((sp, idx) => (
                  <th key={idx} style={{ padding: '10px 14px', fontWeight: 700, borderBottom: '2px solid #38bdf8' }}>{sp}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {decision.tabelle.zeilen.map((reihe, rIdx) => (
                <tr key={rIdx} style={{ backgroundColor: rIdx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {reihe.map((zelle, zIdx) => (
                    <td key={zIdx} style={{ padding: '9px 14px', color: zIdx === 0 ? '#38bdf8' : '#e2e8f0', fontWeight: zIdx === 0 ? 600 : 400 }}>{zelle}</td>
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
                background: 'rgba(30, 58, 138, 0.4)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '10px',
                position: 'relative',
                boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
              }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#38bdf8', marginBottom: '6px' }}>SCHRITT 0{idx + 1}</div>
                <div style={{ fontSize: '12px', color: '#ffffff', lineHeight: '1.4' }}>{schritt}</div>
              </div>

              {idx < (decision.prozess?.schritte.length || 0) - 1 && selectedVariant !== 'cards' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', flexShrink: 0 }}>
                  {selectedVariant === 'vertical' ? <ArrowDown size={20} /> : <ArrowRight size={20} />}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* RENDERER: TIMELINE */}
      {typ === 'timeline' && decision.timeline && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '12px', borderLeft: '2px solid rgba(56,189,248,0.4)', marginLeft: '8px' }}>
          {decision.timeline.punkte.map((pkt, idx) => (
            <div key={idx} style={{ position: 'relative', paddingLeft: '16px' }}>
              <div style={{ position: 'absolute', left: '-19px', top: '2px', width: '12px', height: '12px', borderRadius: '50%', background: '#38bdf8', border: '3px solid #0f172a', boxShadow: '0 0 10px #38bdf8' }} />
              <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#38bdf8', background: 'rgba(56,189,248,0.15)', padding: '2px 8px', borderRadius: '4px' }}>{pkt.zeitpunkt}</span>
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
                background: idx === 0 ? 'linear-gradient(135deg, #1e3a8a, #2563eb)' : 'rgba(30, 58, 138, 0.4)',
                border: `1px solid ${idx === 0 ? '#38bdf8' : 'rgba(56,189,248,0.25)'}`,
                borderRadius: '10px',
                fontWeight: idx === 0 ? 800 : 600,
                fontSize: idx === 0 ? '13px' : '12px',
                color: '#ffffff',
                textAlign: 'center',
                boxShadow: idx === 0 ? '0 4px 20px rgba(37,99,235,0.4)' : undefined
              }}>
                {ebene}
              </div>
              {idx < (decision.hierarchie?.ebenen.length || 0) - 1 && (
                <div style={{ width: '2px', height: '16px', background: '#38bdf8' }} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Footer Note */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '16px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '9.5px', color: '#94a3b8' }}>
        <CheckCircle2 size={12} color="#38bdf8" />
        <span>KDP Studio SVG Engine: Visualisiert ausschließlich faktengetreue Buchinhalte ohne Halluzination.</span>
      </div>
    </div>
  );
};
