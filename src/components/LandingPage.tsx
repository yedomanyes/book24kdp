import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, TrendingUp, Layers, ChevronRight, Zap } from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#ffffff',
      fontFamily: "'Inter', sans-serif",
      overflowX: 'hidden',
      position: 'relative'
    }}>
      {/* Background Gradients */}
      <div style={{ position: 'fixed', top: '-10%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }} />

      {/* Navbar */}
      <nav style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 48px', borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(34,197,94,0.4)' }}>
            <BookOpen style={{ color: '#fff', width: '20px', height: '20px' }} />
          </div>
          <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.03em' }}>Book24 <span style={{ color: '#22c55e' }}>Studio</span></span>
        </div>
        <button 
          onClick={onLoginClick}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '10px 24px',
            borderRadius: '99px',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
        >
          Anmelden
        </button>
      </nav>

      {/* Hero Section */}
      <main style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '120px', paddingBottom: '100px', textAlign: 'center', padding: '120px 24px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', padding: '6px 16px', borderRadius: '99px', marginBottom: '24px' }}
        >
          <Sparkles style={{ width: '14px', height: '14px', color: '#4ade80' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#4ade80', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Das KDP Publishing System</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontSize: 'clamp(48px, 6vw, 84px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.04em', maxWidth: '1000px', margin: '0 0 24px 0' }}
        >
          Skaliere dein Business <br/>
          mit <span style={{ background: 'linear-gradient(135deg, #4ade80, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Künstlicher Intelligenz</span>
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
              background: '#22c55e',
              border: 'none',
              padding: '16px 32px',
              borderRadius: '99px',
              color: '#000',
              fontWeight: 800,
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 0 30px rgba(34,197,94,0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 40px rgba(34,197,94,0.6)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(34,197,94,0.4)'; }}
          >
            Jetzt kostenlos starten <ChevronRight style={{ width: '18px', height: '18px' }} />
          </button>
        </motion.div>
      </main>

      {/* Features Grid */}
      <section style={{ position: 'relative', zIndex: 10, padding: '80px 24px 120px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          
          {[
            { icon: <TrendingUp />, title: "Nischen-Finder", desc: "Analysiere profitable Nischen, Suchvolumen und Konkurrenz auf Amazon in Echtzeit.", color: "#6366f1" },
            { icon: <Zap />, title: "KI Buch-Generierung", desc: "Lass die KI hochwertigen, literarischen Content schreiben – strukturiert und ready to publish.", color: "#f59e0b" },
            { icon: <Layers />, title: "Automatisches Layout", desc: "Professioneller PDF-Export (KDP kompatibel) inklusive automatisch eingefügten KI-Grafiken.", color: "#ec4899" }
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
  );
};
