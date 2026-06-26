import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Layers, ChevronRight, Zap } from 'lucide-react';
import ShinyText from './ShinyText';

import Aurora from './Aurora';

import ClickSpark from './ClickSpark';

interface LandingPageProps {
  onLoginClick: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  return (
    <ClickSpark
      sparkColor="#ffffff"
      sparkSize={10}
      sparkRadius={15}
      sparkCount={8}
      duration={400}
    >
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#ffffff',
      fontFamily: "'Inter', sans-serif",
      overflowX: 'hidden',
      position: 'relative'
    }}>
      {/* Background Aurora */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' }}>
        <Aurora
          colorStops={["#4722de","#128ff0","#121aa7"]}
          amplitude={0.4}
          blend={0.4}
        />
      </div>

      {/* Navbar Wrapper */}
      <div style={{ position: 'relative', zIndex: 10, padding: '24px', display: 'flex', justifyContent: 'center' }}>
        <nav style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '12px 24px', 
          background: 'rgba(255, 255, 255, 0.02)', 
          border: '1px solid rgba(255, 255, 255, 0.08)', 
          borderRadius: '99px', 
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          width: '100%',
          maxWidth: '1000px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.04em', color: '#ffffff' }}>
              Book24 Studio
            </span>
          </div>
          <button 
            onClick={onLoginClick}
            style={{
              background: 'linear-gradient(to bottom, #3b82f6, #2563eb)',
              border: 'none',
              borderBottom: '3px solid #1d4ed8',
              padding: '10px 24px',
              borderRadius: '99px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 8px 24px rgba(59,130,246,0.5), inset 0 2px 4px rgba(255,255,255,0.3)',
              transform: 'translateY(0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: 0
            }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(59,130,246,0.6), inset 0 2px 4px rgba(255,255,255,0.3)'; }}
            onMouseDown={(e) => { e.currentTarget.style.filter = 'brightness(0.9)'; e.currentTarget.style.transform = 'translateY(3px)'; e.currentTarget.style.borderBottomWidth = '0px'; e.currentTarget.style.marginBottom = '3px'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(59,130,246,0.4), inset 0 2px 4px rgba(255,255,255,0.1)'; }}
            onMouseUp={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderBottomWidth = '3px'; e.currentTarget.style.marginBottom = '0px'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(59,130,246,0.6), inset 0 2px 4px rgba(255,255,255,0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderBottomWidth = '3px'; e.currentTarget.style.marginBottom = '0px'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(59,130,246,0.5), inset 0 2px 4px rgba(255,255,255,0.3)'; }}
          >
            <span style={{ fontSize: '15px', fontWeight: 800 }}>
              <ShinyText text="Anmelden" disabled={false} speed={3} color="rgba(255,255,255,0.7)" shineColor="#ffffff" />
            </span>
          </button>
        </nav>
      </div>

      {/* Hero Section */}
      <main style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '120px', paddingBottom: '100px', textAlign: 'center', padding: '120px 24px' }}>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontSize: 'clamp(48px, 6vw, 84px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.04em', maxWidth: '1000px', margin: '0 0 24px 0' }}
        >
          Skaliere dein Business <br/>
          mit <span style={{ background: 'linear-gradient(135deg, #60a5fa, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Künstlicher Intelligenz</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontSize: '18px', color: '#a3a3a3', maxWidth: '600px', margin: '0 0 48px 0', lineHeight: 1.6 }}
        >
          Von der Nischen-Recherche bis zum druckfertigen PDF. Book24 Studio ist die All-in-One Plattform für professionelle Amazon KDP Publisher.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}
        >
          <button 
            onClick={onLoginClick}
            style={{
              background: 'linear-gradient(to bottom, #3b82f6, #2563eb)',
              border: 'none',
              borderBottom: '4px solid #1d4ed8',
              padding: '16px 32px',
              borderRadius: '99px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 10px 30px rgba(59,130,246,0.5), inset 0 2px 4px rgba(255,255,255,0.3)',
              transition: 'all 0.15s ease',
              transform: 'translateY(0)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(59,130,246,0.6), inset 0 2px 4px rgba(255,255,255,0.3)'; }}
            onMouseDown={(e) => { e.currentTarget.style.filter = 'brightness(0.9)'; e.currentTarget.style.transform = 'translateY(4px)'; e.currentTarget.style.borderBottomWidth = '0px'; e.currentTarget.style.marginBottom = '4px'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(59,130,246,0.4), inset 0 2px 4px rgba(255,255,255,0.1)'; }}
            onMouseUp={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderBottomWidth = '4px'; e.currentTarget.style.marginBottom = '0px'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(59,130,246,0.6), inset 0 2px 4px rgba(255,255,255,0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderBottomWidth = '4px'; e.currentTarget.style.marginBottom = '0px'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(59,130,246,0.5), inset 0 2px 4px rgba(255,255,255,0.3)'; }}
          >
            <span style={{ fontSize: '18px', fontWeight: 800 }}>
              <ShinyText text="Jetzt Erstellen" disabled={false} speed={3} color="rgba(255,255,255,0.7)" shineColor="#ffffff" />
            </span>
            <ChevronRight style={{ width: '20px', height: '20px', color: '#fff' }} />
          </button>
        </motion.div>
      </main>

      {/* Features Grid */}
      <section style={{ position: 'relative', zIndex: 10, padding: '80px 24px 120px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          
          {[
            { icon: <TrendingUp />, title: "Nischen-Finder", desc: "Analysiere profitable Nischen, Suchvolumen und Konkurrenz auf Amazon in Echtzeit.", color: "#60a5fa" },
            { icon: <Zap />, title: "KI Buch-Generierung", desc: "Lass die KI hochwertigen, literarischen Content schreiben – strukturiert und ready to publish.", color: "#818cf8" },
            { icon: <Layers />, title: "Automatisches Layout", desc: "Professioneller PDF-Export (KDP kompatibel) inklusive automatisch eingefügten KI-Grafiken.", color: "#38bdf8" }
          ].map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '24px',
                padding: '40px',
                backdropFilter: 'blur(20px)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${feat.color}20`, color: feat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                {feat.icon}
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: '#fff' }}>{feat.title}</h3>
              <p style={{ color: '#a3a3a3', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>
                {feat.desc}
              </p>
            </motion.div>
          ))}
          
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '40px', textAlign: 'center', color: '#737373', fontSize: '13px' }}>
        &copy; {new Date().getFullYear()} Book24 Studio. All rights reserved.
      </footer>
    </div>
    </ClickSpark>
  );
};
