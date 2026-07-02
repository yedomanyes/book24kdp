
import PixelSnow from './PixelSnow';
import Grainient from './Grainient';

interface MaintenanceViewProps {
  name: string;
  theme: 'dark' | 'light';
  onBack: () => void;
}

export default function MaintenanceView({ name, theme, onBack }: MaintenanceViewProps) {
  const isDark = theme === 'dark';

  // Flat theme styling
  const t = {
    bg: isDark ? '#0b0f19' : '#f8f9fc',
    cardBg: isDark ? '#111827' : '#ffffff',
    border: isDark ? '#1f2937' : '#e5e7eb',
    textMain: isDark ? '#f9fafb' : '#111827',
    textMuted: isDark ? '#9ca3af' : '#6b7280',
    primary: '#1a73e8',
    primaryHover: '#1557b0',
    strokeColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
  };

  // Initials for the outline background text
  const getInitials = (str: string) => {
    return str
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      minHeight: 'calc(100vh - 70px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.bg,
      overflow: 'hidden',
      fontFamily: "'Outfit', sans-serif",
      padding: '24px',
      boxSizing: 'border-box'
    }}>
      {/* Background Animation */}
      {isDark ? (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          <PixelSnow
            minFlakeSize={1.25}
            pixelResolution={120}
            speed={1.6}
            density={0.25}
            direction={110}
            brightness={3}
            depthFade={2}
            farPlane={21}
            gamma={0.4545}
            variant="round"
          />
        </div>
      ) : (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          <Grainient
            color1="#ffffff"
            color2="#e5e7eb"
            color3="#d1d5db"
            timeSpeed={0.25}
            colorBalance={0}
            warpStrength={1}
            warpFrequency={5}
            warpSpeed={2}
            warpAmplitude={50}
            blendAngle={0}
            blendSoftness={0.05}
            rotationAmount={500}
            noiseScale={2}
            grainAmount={0.08}
            grainScale={2}
            grainAnimated={false}
            contrast={1.5}
            gamma={1}
            saturation={1}
            centerX={0}
            centerY={0}
            zoom={0.9}
          />
        </div>
      )}

      {/* Solid Flat Card Container */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        backgroundColor: t.cardBg,
        border: `1px solid ${t.border}`,
        borderRadius: '16px',
        padding: '48px 40px',
        maxWidth: '480px',
        width: '100%',
        boxShadow: isDark ? '0 20px 50px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.06)',
        boxSizing: 'border-box',
        overflow: 'hidden',
        textAlign: 'left'
      }}>
        {/* Decorative Outline Text at Top Left */}
        <div style={{
          position: 'absolute',
          left: '20px',
          top: '-10px',
          fontSize: '120px',
          fontWeight: 900,
          lineHeight: 1,
          color: 'transparent',
          WebkitTextStroke: `1.5px ${t.strokeColor}`,
          pointerEvents: 'none',
          zIndex: 0,
          userSelect: 'none'
        }}>
          {getInitials(name) || 'W.A.'}
        </div>

        {/* Content Box */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{
            margin: '0 0 12px 0',
            fontSize: '28px',
            fontWeight: 700,
            color: t.textMain,
            letterSpacing: '-0.5px'
          }}>
            Wartungsarbeiten
          </h2>
          
          <p style={{
            margin: '0 0 32px 0',
            fontSize: '15px',
            lineHeight: '1.6',
            color: t.textMuted
          }}>
            Das Modul <strong>{name}</strong> wird aktuell überarbeitet, um dir neue Features und eine verbesserte Performance zu bieten. Bitte versuche es später noch einmal.
          </p>

          <button
            onClick={onBack}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 600,
              backgroundColor: t.primary,
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(26,115,232,0.2)'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = t.primaryHover}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = t.primary}
          >
            Zurück zur Mediathek
          </button>
        </div>
      </div>
    </div>
  );
}
