import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ChevronDown, Search, Frown } from 'lucide-react';
import ShinyText from './ShinyText';
import ProfileCard from './ProfileCard';
import TiltedCard from './TiltedCard';
import { LandingBadPagePreview, LandingBookPagePreview } from './LandingContentPreview';

import LiquidEther from './LiquidEther';
import ClickSpark from './ClickSpark';
import { LandingNavbar } from './LandingNavbar';
import KdpCalculator from './KdpCalculator';
import { LegalModal } from './LegalModal';
import type { LegalPage } from './LegalModal';

const PROFILE_ICON_PATTERN = '/profile-icon-pattern.svg';

const TEAM = [
  {
    name: 'Renzo',
    title: 'Head Of Marketing',
    avatarUrl: '/MannAkim.png',
    iconUrl: PROFILE_ICON_PATTERN,
    behindGlowColor: 'rgba(125, 190, 255, 0.67)',
    innerGradient: 'linear-gradient(145deg,#60496e8c 0%,#71C4FF44 100%)',
    avatarScale: 1.35,
  },
  {
    name: 'Yedo',
    title: 'CTO',
    avatarUrl: '/yigit.png',
    iconUrl: PROFILE_ICON_PATTERN,
    behindGlowColor: 'rgba(167, 139, 250, 0.67)',
    innerGradient: 'linear-gradient(145deg,#4c1d958c 0%,#818cf844 100%)',
  },
];

const CARD_SIZE = '280px';

const getRoadmapPhases = (isDe: boolean) => [
  {
    phase: 'Phase 01',
    title: 'Core Engine & KDP-Ready Export',
    price: '199$',
    badge: 'LIVE',
    features: isDe
      ? ['Optimierte Textgenerierung', 'Druckfertiger PDF-Export (6x9)', 'Dynamische Kapitelstrukturen', 'Unbegrenzte Bucherstellung']
      : ['Optimized Text Generation', 'Print-ready PDF Export (6x9)', 'Dynamic Chapter Structures', 'Unlimited Book Creation'],
    desc: isDe ? 'Das Fundament der Plattform ist live und einsatzbereit.' : 'The platform core is live and ready for deployment.',
    active: true,
  },
  {
    phase: 'Phase 02',
    title: 'Advanced Layouts & Deep Research',
    price: '300$',
    badge: isDe ? 'AKTIV' : 'ACTIVE',
    features: isDe
      ? ['KDP Nischen-Analyse', 'Cover-Design Engine', 'Erweiterte Layout-Templates', 'Deep Research Modus']
      : ['KDP Niche Analysis', 'Cover Design Engine', 'Advanced Layout Templates', 'Deep Research Mode'],
    desc: isDe ? 'Nischenpotenziale analysieren und Buchcover visuell gestalten.' : 'Analyze niche potentials and visually design book covers.',
    active: false,
  },
  {
    phase: 'Phase 03',
    title: 'Automation & Bulk Creation',
    price: '500$',
    badge: 'PLANNED',
    features: isDe
      ? ['Batch-Buchgenerierung', 'Direkter KDP-Upload-Assistent', 'Automatische Keyword-Optimierung', 'Bulk Metadata Management']
      : ['Batch Book Generation', 'Direct KDP Upload Assistant', 'Automated Keyword Optimization', 'Bulk Metadata Management'],
    desc: isDe ? 'Erstellung und Export mehrerer Manuskripte in einem Schritt.' : 'Generate and export multiple manuscripts in a single run.',
    active: false,
  },
  {
    phase: 'Phase 04',
    title: 'Global Localization',
    price: '1000$',
    badge: 'PLANNED',
    features: isDe
      ? ['Automatisierte Übersetzung (20+ Sprachen)', 'Globale Marktanalysen', 'Regionale KDP-Layout-Profile', 'Publisher Dashboard']
      : ['Automated Translation (20+ Languages)', 'Global Market Analysis', 'Regional KDP Layout Profiles', 'Publisher Dashboard'],
    desc: isDe ? 'Lokalisierung und Skalierung von Buchprojekten weltweit.' : 'Localize and scale book projects for international markets.',
    active: false,
  },
  {
    phase: 'Phase 05',
    title: 'The Publisher Enterprise',
    price: '2000$',
    badge: 'VISION',
    features: isDe
      ? ['Kollaborativer Editor', 'Team-Rollen-Verwaltung', 'API-Zugang & Automatisierung', 'Enterprise Support']
      : ['Collaborative Editor', 'Team Role Management', 'API Access & Automation', 'Enterprise Support'],
    desc: isDe ? 'Die vollumfängliche Plattform für professionelle Publisher.' : 'The comprehensive suite for professional publishing houses.',
    active: false,
  }
];

const getFaqs = (isDe: boolean) => [
  {
    q: 'Gehören mir die Rechte an den generierten Büchern?',
    a: isDe ? 'Ja. Alle generierten Inhalte, Texte und Layouts gehören zu 100% dir. Du kannst sie uneingeschränkt auf Amazon KDP oder anderen Plattformen unter deinem Namen veröffentlichen und monetarisieren.' : 'Yes. All generated content, text, and layouts belong 100% to you. You can publish and monetize them on Amazon KDP or other platforms under your name without restrictions.'
  },
  {
    q: 'Wird der Preis in Zukunft steigen?',
    a: isDe ? 'Ja! Wir entwickeln Book24 Studio kontinuierlich weiter. Mit jedem großen Update kommen neue, mächtige Funktionen hinzu. Daher wird der Preis des Produkts stetig steigen. Wer sich den Zugang jetzt sichert, erhält alle künftigen Erweiterungen kostenlos – ohne Aufpreis!' : 'Yes! We are continuously developing Book24 Studio. With every major update, new powerful features are added. Therefore, the price of the product will steadily increase. Those who secure access now will receive all future expansions for free - at no extra cost!'
  },
  {
    q: 'Benötige ich Vorkenntnisse im Buch-Layouting?',
    a: 'Nein, überhaupt nicht. Die Plattform übernimmt das komplette Design, die Ränder und die Schriftformatierung automatisch nach offiziellen Amazon KDP-Druckstandards (z.B. 6x9 Zoll Taschenbuchformat).'
  },
  {
    q: 'Gibt es versteckte monatliche Gebühren?',
    a: isDe ? 'Nein. Mit dem Studio-Pass sicherst du dir einen lebenslangen Zugang zu allen Kernfunktionen. Keine Abos, keine versteckten Kosten.' : 'No. The Studio Pass gives you lifetime access to all core features. No subscriptions, no hidden costs.'
  },
  {
    q: isDe ? 'Darf ich mehrere Accounts mit verschiedenen E-Mails kaufen, um die Keys später teurer weiterzuverkaufen?' : 'Am I allowed to buy multiple accounts with different emails to resell the keys later at a higher price?',
    a: isDe
      ? 'Ja, das ist vollständig erlaubt! Sobald du einen Key einlöst, ist er an dein Konto gebunden und funktioniert nur auf einem Gerät gleichzeitig. Doch uneingelöste Keys können niemals ablaufen – du kannst sie also jederzeit weiterverkaufen. Da der Preis mit jedem Update steigt, lohnt es sich, sich jetzt mehrere Keys zu sichern und sie später zum aktuellen Marktpreis weiterzugeben.'
      : 'Yes, that is completely allowed! Once you redeem a key, it is linked to your account and only works on one device at a time. However, unredeemed keys never expire — so you can resell them at any time. Since the price increases with every update, it makes sense to secure multiple keys now and resell them later at the current market price.'
  },
];

interface LandingPageProps {
  onLoginClick: () => void;
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  language: 'de' | 'en';
  onLanguageChange: (lang: 'de' | 'en') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, theme, setTheme, language, onLanguageChange }) => {
  const isDe = language === 'de';

  const covers = [
    { src: '/cover1.jpg', revenueEur: 854.81 },
    { src: '/cover2.jpg', revenueEur: 139.06 },
    { src: '/nahrungsluegecover.jpg', revenueEur: 326.00 },
    { src: '/cover4.jpg', revenueEur: 89.98 }
  ];

  const formatRevenue = (valEur: number) => {
    if (isDe) {
      return valEur.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
    } else {
      const valUsd = valEur * 1.10;
      return '$' + valUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  };
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);
  const [legalPage, setLegalPage] = React.useState<LegalPage>(null);
  const [cookieConsent, setCookieConsent] = React.useState<boolean>(() => {
    try {
      const val = localStorage.getItem('cookie-consent');
      return val === 'true' || val === 'false';
    } catch (e) {
      return false;
    }
  });

  const toggleFaq = (index: number) => {
    setOpenFaq((prev: number | null) => prev === index ? null : index);
  };

  return (
    <ClickSpark
      sparkColor={theme === 'dark' ? '#ffffff' : '#0a0a0a'}
      sparkSize={10}
      sparkRadius={15}
      sparkCount={8}
      duration={400}
    >
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme === 'dark' ? '#0a0a0a' : '#f8f9fa',
      color: theme === 'dark' ? '#ffffff' : '#111827',
      fontFamily: "'Inter', sans-serif",
      overflowX: 'hidden',
      position: 'relative',
      transition: 'background-color 0.3s ease, color 0.3s ease'
    }}>
      {/* Background */}
      {theme === 'dark' ? (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0,
          height: '900px', 
          zIndex: 0, 
          pointerEvents: 'none', 
          overflow: 'hidden',
          maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
        }}>
          <LiquidEther
            colors={[ '#5227FF', '#FF9FFC', '#B497CF' ]}
            mouseForce={20}
            cursorSize={100}
            isViscous={true}
            viscous={30}
            iterationsViscous={32}
            iterationsPoisson={32}
            resolution={0.5}
            isBounce={false}
            autoDemo={true}
            autoSpeed={0.5}
            autoIntensity={2.2}
            takeoverDuration={0.25}
            autoResumeDelay={3000}
            autoRampDuration={0.6}
            style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
          />
        </div>
      ) : (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          zIndex: 0, 
          pointerEvents: 'none', 
          background: 'linear-gradient(to bottom, #fcfbfa 0%, #f4efe6 100%)' 
        }} />
      )}

      {/* Navbar */}
      <LandingNavbar onLoginClick={onLoginClick} theme={theme} setTheme={setTheme} language={language} onLanguageChange={onLanguageChange} />

      {/* Hero Section */}
      <main style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '140px', paddingBottom: '100px', textAlign: 'center', padding: '140px 24px 100px' }}>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={{ 
            fontSize: 'clamp(46px, 6.5vw, 92px)', 
            fontWeight: 900, 
            lineHeight: 1.02, 
            letterSpacing: '-0.05em', 
            maxWidth: '1000px', 
            margin: '0 0 24px 0',
            fontFamily: "'Poppins', sans-serif",
            textTransform: 'uppercase'
          }}
        >
          {isDe ? <>Ein echtes Buch <br/> in <span className="slogan-accent">3 Minuten</span></> : <>A real book <br/> in <span className="slogan-accent">3 Minutes</span></>}
        </motion.h1>



        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}
        >
          <button 
            onClick={() => window.location.href = 'https://book24studio.gumroad.com/l/howtbr'}
            style={{
              background: theme === 'dark'
                ? 'linear-gradient(180deg, #0b57d0 0%, #0842a0 100%)'
                : 'linear-gradient(180deg, #1e1e24 0%, #0c0c0e 100%)',
              border: theme === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.2)'
                : '1px solid rgba(255, 255, 255, 0.15)',
              borderBottom: theme === 'dark'
                ? '4px solid #063078'
                : '4px solid rgba(255, 255, 255, 0.35)',
              padding: '14px 36px 16px 36px',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: theme === 'dark'
                ? '0 8px 30px rgba(11, 87, 208, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                : '0 8px 30px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
              transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: 'translateY(0)',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => { 
              e.currentTarget.style.transform = 'translateY(-2px)'; 
              e.currentTarget.style.borderBottom = theme === 'dark'
                ? '5px solid #0a4fbe'
                : '5px solid rgba(255, 255, 255, 0.45)';
              e.currentTarget.style.boxShadow = theme === 'dark'
                ? '0 12px 40px rgba(11, 87, 208, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                : '0 12px 40px rgba(255, 255, 255, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.35)';
              e.currentTarget.style.filter = 'brightness(1.2)';
            }}
            onMouseLeave={(e) => { 
              e.currentTarget.style.transform = 'translateY(0)'; 
              e.currentTarget.style.borderBottom = theme === 'dark'
                ? '4px solid #063078'
                : '4px solid rgba(255, 255, 255, 0.35)';
              e.currentTarget.style.boxShadow = theme === 'dark'
                ? '0 8px 30px rgba(11, 87, 208, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                : '0 8px 30px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.25)';
              e.currentTarget.style.filter = 'brightness(1)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(2px)';
              e.currentTarget.style.borderBottom = theme === 'dark'
                ? '1px solid #063078'
                : '1px solid rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.boxShadow = theme === 'dark'
                ? '0 4px 10px rgba(11, 87, 208, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                : '0 4px 10px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderBottom = theme === 'dark'
                ? '5px solid #0a4fbe'
                : '5px solid rgba(255, 255, 255, 0.45)';
              e.currentTarget.style.boxShadow = theme === 'dark'
                ? '0 12px 40px rgba(11, 87, 208, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                : '0 12px 40px rgba(255, 255, 255, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.35)';
            }}
          >
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
              <ShinyText text={isDe ? 'Jetzt Erstellen' : 'Create Now'} color="rgba(255, 255, 255, 0.85)" shineColor="#ffffff" speed={2.5} />
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(0, 0, 0, 0.25)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
              <span style={{ fontSize: '13px', textDecoration: 'line-through', color: 'rgba(255, 255, 255, 0.7)' }}>300$</span>
              <span style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff' }}>199$</span>
            </div>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          style={{ 
            marginTop: '32px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px', 
            background: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', 
            padding: '12px 24px', 
            borderRadius: '100px', 
            border: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
            boxShadow: theme === 'dark' ? '0 10px 30px rgba(0,0,0,0.2)' : '0 10px 30px rgba(0,0,0,0.02)'
          }}
        >
          {/* Overlapping Avatars */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {[
              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&h=128&q=80',
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&h=128&q=80',
              'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=128&h=128&q=80',
              'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&h=128&q=80'
            ].map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt={`User ${idx + 1}`}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: theme === 'dark' ? '2px solid #0a0a0a' : '2px solid #ffffff',
                  marginLeft: idx > 0 ? '-10px' : '0px',
                  objectFit: 'cover',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                  zIndex: 4 - idx
                }}
              />
            ))}
          </div>

          {/* Stars & Text */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px', textAlign: 'left' }}>
            <div style={{ display: 'flex', gap: '2px' }}>
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="1">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#a3a3a3' : '#4b5563', lineHeight: 1.2 }}>
              {isDe ? <>Bereits <strong style={{ color: theme === 'dark' ? '#fff' : '#1a1a1a', fontWeight: 800 }}>1.350+</strong> Bücher erfolgreich veröffentlicht</> : <><strong style={{ color: theme === 'dark' ? '#fff' : '#1a1a1a', fontWeight: 800 }}>1,350+</strong> books successfully published</>}
            </span>
          </div>
        </motion.div>

        {/* Cover Preview Mini */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          style={{ marginTop: '32px', display: 'flex', gap: '16px', justifyContent: 'center' }}
        >
          {covers.map((item, i) => {

            return (
              <div 
                key={i}
                style={{ position: 'relative', height: '180px', width: '120px', borderRadius: '4px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.3s ease', transform: 'translateY(0px)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-10px)';
                  const overlay = e.currentTarget.querySelector('.cover-overlay') as HTMLDivElement;
                  if (overlay) overlay.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0px)';
                  const overlay = e.currentTarget.querySelector('.cover-overlay') as HTMLDivElement;
                  if (overlay) overlay.style.opacity = '0';
                }}
              >
                <img 
                  src={item.src} 
                  alt={`Cover ${i+1}`}
                  style={{ 
                    height: '180px', 
                    width: '120px', 
                    boxShadow: theme === 'dark' ? '0 8px 24px rgba(0,0,0,0.6)' : '0 8px 24px rgba(0,0,0,0.15)',
                    border: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                    objectFit: 'cover',
                    display: 'block'
                  }} 
                />
                <div 
                  className="cover-overlay"
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: '60px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.95), transparent)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    color: 'white',
                    textAlign: 'center',
                    paddingBottom: '8px'
                  }}
                >
                  <div style={{ fontSize: '10px', opacity: 0.9, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isDe ? 'Tantiemen' : 'Royalties'}</div>
                  <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#4ade80' }}>{formatRevenue(item.revenueEur)}</div>
                </div>
              </div>
            );
          })}
        </motion.div>
      </main>

      {/* AI Slop Problem Section */}
      <section style={{ 
        background: '#ffffff', 
        color: '#1a1a1a', 
        padding: '100px 24px', 
        position: 'relative', 
        zIndex: 10,
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: '60px' }}
          >
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.02em', margin: '0', color: '#1a1a1a' }}>
              {isDe ? 'Du kennst das:' : 'You know this:'}
            </h2>
          </motion.div>
          
          <div className="slop-comparison-container">
            {/* Left Column */}
            <div className="slop-col slop-left">
              {(isDe ? [
                'Verzerrte KI-Bilder & minderwertige Cover',
                'Formatierungsfehler & zerschossenes Layout',
                'Roboterhafte Texte voller ChatGPT-Phrasen'
              ] : [
                'Distorted AI images & low-quality covers',
                'Formatting errors & broken layouts',
                'Robotic text full of ChatGPT phrases'
              ]).map((text, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="slop-tag"
                >
                  <div className="slop-icon">
                    <Frown size={14} />
                  </div>
                  <span>{text}</span>
                </motion.div>
              ))}
            </div>
            
            {/* Center Image Placeholder */}
            <div className="slop-center">
              <div className="slop-circle-bg">
                <div className="slop-circle-inner">
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#9ca3af' }}>
                    <Search size={32} />
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>KI-SLOP</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="slop-col slop-right">
              {(isDe ? [
                'Unlogische Handlungsstränge & Fehler',
                'KDP-Fehler & gesperrte Amazon-Accounts',
                'Frustrierte Kunden & schlechte Rezensionen'
              ] : [
                'Illogical plot lines & errors',
                'KDP errors & suspended Amazon accounts',
                'Frustrated customers & bad reviews'
              ]).map((text, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="slop-tag"
                >
                  <div className="slop-icon">
                    <Frown size={14} />
                  </div>
                  <span>{text}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Calculator Section (Hook) */}
      <section id="rechner" style={{ position: 'relative', zIndex: 10, padding: '20px 24px 48px', maxWidth: '1100px', margin: '0 auto', scrollMarginTop: '100px' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center', marginBottom: '40px' }}
        >
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0', color: theme === 'dark' ? '#fff' : '#1a1a1a' }}>
            {isDe ? 'Das könntest DU sein!' : 'This could be YOU!'}
          </h2>
        </motion.div>
        
        <div style={{ background: '#0a0a0a', borderRadius: '24px', border: '1px solid #262626', overflow: 'hidden', boxShadow: theme === 'dark' ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}>
          <KdpCalculator theme="dark" language={language} />
        </div>
      </section>

      {/* Pain & Agitation Section */}
      <section style={{ position: 'relative', zIndex: 10, padding: '80px 24px', maxWidth: '900px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center' }}
        >
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 40px', color: theme === 'dark' ? '#fff' : '#1a1a1a' }}>
            {isDe ? 'KDP war bisher ein Albtraum.' : 'KDP used to be a nightmare.'}
          </h2>
          
          <div style={{ 
            background: theme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
            border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: theme === 'dark' ? '0 20px 40px -10px rgba(0,0,0,0.5)' : '0 20px 40px -10px rgba(0,0,0,0.05)'
          }}>
            {/* Headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)' }}>
              <div style={{ padding: '24px', textAlign: 'center', background: theme === 'dark' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.02)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ef4444', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <X size={20} strokeWidth={3} /> {isDe ? 'Ohne Book24 Studio' : 'Without Book24 Studio'}
                </h3>
              </div>
              <div style={{ padding: '24px', textAlign: 'center', background: theme === 'dark' ? 'rgba(34, 197, 94, 0.05)' : 'rgba(34, 197, 94, 0.02)', position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '1px', background: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#22c55e', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Check size={20} strokeWidth={3} /> {isDe ? 'Mit Book24 Studio' : 'With Book24 Studio'}
                </h3>
              </div>
            </div>

            {/* Rows */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {(isDe ? [
                { bad: 'Stundenlanges Scrollen durch Amazon ohne verlässliche Daten', good: 'Profitable Nischen in Sekunden durch KI-Analyse finden' },
                { bad: 'Hunderte Euros für Ghostwriter & wochenlanges Warten', good: 'Hochwertige Bücher in 3 Minuten generieren lassen' },
                { bad: 'Kaputte Ränder und ständige KDP-Fehlermeldungen', good: 'Perfektes Print-Layout per Klick (KDP-kompatibel)' },
                { bad: 'Teure Designer bezahlen oder stundenlanger Canva-Frust', good: 'Professionelle, verkaufspsychologische Cover sofort erstellt' }
              ] : [
                { bad: 'Hours of scrolling Amazon without reliable data', good: 'Find profitable niches in seconds with AI analysis' },
                { bad: 'Hundreds of dollars for ghostwriters & weeks of waiting', good: 'Generate high-quality books in 3 minutes' },
                { bad: 'Broken margins and constant KDP error messages', good: 'Perfect print layout with one click (KDP-compatible)' },
                { bad: 'Pay expensive designers or hours of Canva frustration', good: 'Professional, sales-optimized covers created instantly' }
              ]).map((row, i, arr) => (
                <div key={i} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  borderBottom: i < arr.length - 1 ? (theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)') : 'none',
                  background: i % 2 === 0 ? 'transparent' : (theme === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)')
                }}>
                  {/* Bad */}
                  <div style={{ padding: '24px', display: 'flex', alignItems: 'flex-start', gap: '16px', color: theme === 'dark' ? '#a3a3a3' : '#666', fontSize: '15px', lineHeight: 1.6 }}>
                    <X size={18} strokeWidth={2.5} color="#ef4444" style={{ flexShrink: 0, marginTop: '3px', opacity: 0.8 }} />
                    <span style={{ fontWeight: 500 }}>{row.bad}</span>
                  </div>
                  {/* Good */}
                  <div style={{ padding: '24px', display: 'flex', alignItems: 'flex-start', gap: '16px', color: theme === 'dark' ? '#e5e5e5' : '#1a1a1a', fontSize: '15px', lineHeight: 1.6, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '1px', background: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }} />
                    <Check size={18} strokeWidth={3} color="#22c55e" style={{ flexShrink: 0, marginTop: '3px' }} />
                    <span style={{ fontWeight: 600 }}>{row.good}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* AI Content Showcase — Tilted Cards */}
      <section id="produkt" style={{ position: 'relative', zIndex: 10, padding: '40px 24px 80px', maxWidth: '1200px', margin: '0 auto', scrollMarginTop: '100px' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center', marginBottom: '48px' }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: theme === 'dark' ? '#737373' : '#666', marginBottom: '10px' }}>
            {isDe ? 'So sieht dein Buch aus' : 'See what your book looks like'}
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 12px', color: theme === 'dark' ? '#fff' : '#1a1a1a' }}>
            {isDe ? 'KI-Content, der wie ein echtes Buch wirkt' : 'AI content that reads like a real book'}
          </h2>
          <p style={{ color: '#a3a3a3', fontSize: '16px', margin: '0 auto', lineHeight: 1.6, maxWidth: '560px' }}>
            {isDe ? 'Roher KI-Text vs. professionelles Buchlayout — der Unterschied auf einen Blick.' : 'Raw AI text vs. professional book layout — the difference at a glance.'}
          </p>
        </motion.div>

        <div className="landing-showcase-grid">
          <motion.div
            className="landing-showcase-card-wrap left"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <TiltedCard
              captionText="Roher KI-Output"
              containerHeight={CARD_SIZE}
              containerWidth={CARD_SIZE}
              imageHeight={CARD_SIZE}
              imageWidth={CARD_SIZE}
              rotateAmplitude={12}
              scaleOnHover={1.06}
              showMobileWarning={false}
              showTooltip
              displayOverlayContent
              overlayContent={
                <span className="landing-compare-badge bad" aria-label="So nicht">
                  <X size={20} strokeWidth={3} />
                </span>
              }
            >
              <LandingBadPagePreview />
            </TiltedCard>
            <span className="landing-compare-label bad">{isDe ? 'So nicht' : 'Not like this'}</span>
          </motion.div>

          <motion.div
            className="landing-showcase-card-wrap right"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <TiltedCard
              captionText="Book24 Studio · KDP-ready"
              containerHeight={CARD_SIZE}
              containerWidth={CARD_SIZE}
              imageHeight={CARD_SIZE}
              imageWidth={CARD_SIZE}
              rotateAmplitude={14}
              scaleOnHover={1.08}
              showMobileWarning={false}
              showTooltip
              displayOverlayContent
              overlayContent={
                <span className="landing-compare-badge good" aria-label="So soll es sein">
                  <Check size={20} strokeWidth={3} />
                </span>
              }
            >
              <LandingBookPagePreview />
            </TiltedCard>
            <span className="landing-compare-label good">{isDe ? 'So soll es sein' : 'This is the way'}</span>
          </motion.div>
        </div>
      </section>




      {/* Roadmap / Plan Section */}
      <section id="roadmap" style={{ position: 'relative', zIndex: 10, padding: '120px 0 80px', overflow: 'hidden' }}>

        {/* Ambient glow */}
        <div style={{ position: 'absolute', top: '30%', left: '20%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(124, 58, 237, 0.04) 0%, transparent 65%)', pointerEvents: 'none', filter: 'blur(60px)' }} />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center', marginBottom: '80px', padding: '0 24px', position: 'relative' }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: theme === 'dark' ? '#a78bfa' : '#6d28d9', marginBottom: '16px' }}>
            {isDe ? 'PROJEKTPLAN' : 'PROJECT TIMELINE'}
          </div>
          <h2 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 16px', color: theme === 'dark' ? '#fff' : '#0f172a', lineHeight: 1.1 }}>
            Book24 Roadmap
          </h2>
          <p style={{ fontSize: '16px', color: theme === 'dark' ? '#a1a1aa' : '#4b5563', maxWidth: '480px', margin: '0 auto', lineHeight: 1.5 }}>
            {isDe ? 'Langfristige Wertsteigerung durch kontinuierliche Systemerweiterungen.' : 'Long-term value creation through continuous system expansions.'}
          </p>
        </motion.div>

        {/* Cards — horizontal scrollable on mobile, grid on desktop */}
        <div className="rm2-grid">
          {getRoadmapPhases(isDe).map((phase, i) => {
            const isActive = phase.active;
            const colorSets = [
              { glow: '#8b5cf6', accent: '#a78bfa', border: 'rgba(139,92,246,0.2)', bg: 'rgba(139,92,246,0.02)' },
              { glow: '#3b82f6', accent: '#60a5fa', border: 'rgba(59,130,246,0.15)', bg: 'rgba(59,130,246,0.01)' },
              { glow: '#06b6d4', accent: '#22d3ee', border: 'rgba(6,182,212,0.15)', bg: 'rgba(6,182,212,0.01)' },
              { glow: '#10b981', accent: '#34d399', border: 'rgba(16,185,129,0.15)', bg: 'rgba(16,185,129,0.01)' },
              { glow: '#f59e0b', accent: '#fbbf24', border: 'rgba(245,158,11,0.15)', bg: 'rgba(245,158,11,0.01)' },
            ][i];
            return (
              <motion.div
                key={phase.phase}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className={`rm2-card ${isActive ? 'active' : ''} ${theme === 'dark' ? 'dark' : 'light'}`}
                style={{ ['--c-glow' as any]: colorSets.glow, ['--c-accent' as any]: colorSets.accent, ['--c-border' as any]: colorSets.border, ['--c-bg' as any]: colorSets.bg }}
              >
                {/* Accent line top */}
                {isActive && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, #7c3aed, ${colorSets.glow})` }} />
                )}

                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', position: 'relative' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 600, color: theme === 'dark' ? '#71717a' : '#9ca3af', letterSpacing: '0.1em' }}>
                    {phase.phase}
                  </span>
                  <span className={`rm2-badge ${isActive ? 'live' : 'soon'}`} style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '3px' }}>
                    {phase.badge}
                  </span>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 8px', color: theme === 'dark' ? '#fff' : '#0f172a', lineHeight: 1.3, position: 'relative' }}>
                  {phase.title}
                </h3>

                {/* Tagline */}
                <p style={{ fontSize: '13px', margin: '0 0 24px', color: theme === 'dark' ? '#71717a' : '#6b7280', lineHeight: 1.4, position: 'relative' }}>
                  {phase.desc}
                </p>

                {/* Feature checklist */}
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                  {phase.features.map((f: string) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: theme === 'dark' ? '#a1a1aa' : '#374151', lineHeight: 1.4 }}>
                      <span style={{ color: theme === 'dark' ? '#52525b' : '#d1d5db', flexShrink: 0, fontSize: '10px', marginTop: '1px' }}>
                        —
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Price */}
                <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, position: 'relative' }}>
                  <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: theme === 'dark' ? '#52525b' : '#9ca3af', marginBottom: '4px' }}>
                    {isDe ? 'WERT-INDIKATOR' : 'VALUE INDICATOR'}
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '-0.04em', color: theme === 'dark' ? '#fff' : '#0f172a', lineHeight: 1 }}>
                    {phase.price}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA below */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ textAlign: 'center', marginTop: '48px', padding: '0 24px' }}
        >
          <p style={{ fontSize: '12.5px', color: theme === 'dark' ? '#52525b' : '#9ca3af', letterSpacing: '0.02em' }}>
            {isDe ? 'Hinweis: Early-Access-Passinhaber erhalten alle System-Erweiterungen ohne zusätzliche Zuzahlung.' : 'Note: Early Access Pass holders receive all future extensions with no additional cost.'}
          </p>
        </motion.div>
      </section>


      {/* Team / Leadership */}
      <section id="team" style={{ position: 'relative', zIndex: 10, padding: '40px 24px 100px', maxWidth: '900px', margin: '0 auto', scrollMarginTop: '100px' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center', marginBottom: '48px' }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#737373', marginBottom: '10px' }}>
            Leadership
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 12px', color: theme === 'dark' ? '#fff' : '#1a1a2e' }}>
            {isDe ? 'Das Team hinter Book24 Studio' : 'The Team behind Book24 Studio'}
          </h2>

        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '40px',
          alignItems: 'start',
          justifyItems: 'center',
        }}>
          {TEAM.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.65, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              style={{ width: '100%', maxWidth: '320px' }}
            >
              <ProfileCard
                className="landing-team"
                name={member.name}
                title={member.title}
                avatarUrl={member.avatarUrl}
                avatarSymbol={undefined}
                iconUrl={member.iconUrl}
                showUserInfo={false}
                enableTilt
                enableMobileTilt={false}
                behindGlowEnabled
                behindGlowColor={member.behindGlowColor}
                innerGradient={member.innerGradient}
                avatarScale={'avatarScale' in member ? member.avatarScale : 1}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ Sektion */}
      <section id="faq" style={{ position: 'relative', zIndex: 10, padding: '80px 24px', maxWidth: '800px', margin: '0 auto', scrollMarginTop: '100px' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center', marginBottom: '16px' }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: theme === 'dark' ? '#737373' : '#666', marginBottom: '10px' }}>
            Support & Details
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 12px', color: theme === 'dark' ? '#fff' : '#1a1a1a' }}>
            {isDe ? 'Häufig gestellte Fragen' : 'Frequently Asked Questions'}
          </h2>
          <p style={{ color: theme === 'dark' ? '#a3a3a3' : '#666', fontSize: '16px', margin: '0 auto', lineHeight: 1.6, maxWidth: '560px' }}>
            {isDe ? 'Alles, was du über Book24 Studio und die Veröffentlichung wissen musst.' : 'Everything you need to know about Book24 Studio and publishing.'}
          </p>
        </motion.div>

        <div className={`faq-container ${theme === 'dark' ? 'dark' : 'light'}`}>
          {getFaqs(isDe).map((item, idx) => {
            const isActive = openFaq === idx;
            return (
              <div key={idx} className={`faq-item ${isActive ? 'active' : ''}`}>
                <button className="faq-question" onClick={() => toggleFaq(idx)}>
                  <span>{item.q}</span>
                  <ChevronDown className="faq-chevron" size={20} />
                </button>
                <div className="faq-answer-wrapper">
                  <div className="faq-answer">
                    {item.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Final CTA Section */}
      <section style={{
        position: 'relative',
        padding: '140px 24px',
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center',
        marginBottom: '60px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Massive Background glow without container */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '1000px',
          height: '600px',
          background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.05) 40%, transparent 70%)',
          zIndex: 0,
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ 
            fontSize: 'clamp(40px, 8vw, 64px)', 
            fontWeight: 900, 
            letterSpacing: '-0.04em', 
            margin: '0 0 24px 0', 
            color: theme === 'dark' ? '#ffffff' : '#1a1a1a',
            display: 'inline-block'
          }}>
            {isDe ? 'Bereit für deinen KDP-Erfolg?' : 'Ready for your KDP success?'}
          </h2>
          <p style={{ color: '#a3a3a3', fontSize: '20px', margin: '0 auto 56px auto', lineHeight: 1.6, maxWidth: '640px' }}>
            {isDe ? 'Erhalte sofortigen, lebenslangen Zugriff auf den Schreibwerkzeug Generator. Keine monatlichen Kosten.' : 'Get instant, lifetime access to the Book Writing Generator. No monthly fees.'}
          </p>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
            {/* Primary Button */}
            <button 
              onClick={() => window.location.href = 'https://book24studio.gumroad.com/l/howtbr'}
              style={{
                background: theme === 'dark'
                  ? 'linear-gradient(180deg, #0b57d0 0%, #0842a0 100%)'
                  : 'linear-gradient(180deg, #1e1e24 0%, #0c0c0e 100%)',
                border: theme === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.2)'
                  : '1px solid rgba(255, 255, 255, 0.15)',
                borderBottom: theme === 'dark'
                  ? '4px solid #063078'
                  : '4px solid rgba(255, 255, 255, 0.35)',
                padding: '14px 36px 16px 36px',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: theme === 'dark'
                  ? '0 8px 30px rgba(11, 87, 208, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                  : '0 8px 30px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
                transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: 'translateY(0)',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => { 
                e.currentTarget.style.transform = 'translateY(-2px)'; 
                e.currentTarget.style.borderBottom = theme === 'dark'
                  ? '5px solid #0a4fbe'
                  : '5px solid rgba(255, 255, 255, 0.45)';
                e.currentTarget.style.boxShadow = theme === 'dark'
                  ? '0 12px 40px rgba(11, 87, 208, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                  : '0 12px 40px rgba(255, 255, 255, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.35)';
                e.currentTarget.style.filter = 'brightness(1.2)';
              }}
              onMouseLeave={(e) => { 
                e.currentTarget.style.transform = 'translateY(0)'; 
                e.currentTarget.style.borderBottom = theme === 'dark'
                  ? '4px solid #063078'
                  : '4px solid rgba(255, 255, 255, 0.35)';
                e.currentTarget.style.boxShadow = theme === 'dark'
                  ? '0 8px 30px rgba(11, 87, 208, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                  : '0 8px 30px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.filter = 'brightness(1)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(2px)';
                e.currentTarget.style.borderBottom = theme === 'dark'
                  ? '1px solid #063078'
                  : '1px solid rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.boxShadow = theme === 'dark'
                  ? '0 4px 10px rgba(11, 87, 208, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                  : '0 4px 10px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderBottom = theme === 'dark'
                  ? '5px solid #0a4fbe'
                  : '5px solid rgba(255, 255, 255, 0.45)';
                e.currentTarget.style.boxShadow = theme === 'dark'
                  ? '0 12px 40px rgba(11, 87, 208, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                  : '0 12px 40px rgba(255, 255, 255, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.35)';
              }}
            >
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                <ShinyText text={isDe ? 'Jetzt Erstellen' : 'Create Now'} color="rgba(255, 255, 255, 0.85)" shineColor="#ffffff" speed={2.5} />
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(0, 0, 0, 0.25)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                <span style={{ fontSize: '13px', textDecoration: 'line-through', color: 'rgba(255, 255, 255, 0.7)' }}>300$</span>
                <span style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff' }}>199$</span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: theme === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
        background: theme === 'dark' 
          ? 'linear-gradient(to bottom, rgba(10, 10, 10, 0.8), rgba(7, 7, 8, 0.95))' 
          : 'linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(248, 249, 250, 0.95))',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '80px 24px 48px',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Subtle top glow line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '10%',
          right: '10%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.15), rgba(129, 140, 248, 0.15), transparent)',
        }} />

        <div style={{
          maxWidth: '1120px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '40px',
          marginBottom: '64px',
          textAlign: 'left',
        }}>
          {/* Brand Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: '220px' }}>
            <span style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.03em', color: theme === 'dark' ? '#ffffff' : '#111827' }}>
              Book24 <span style={{ fontWeight: 300, color: theme === 'dark' ? '#ffffff' : '#111827' }}>Studio</span>
            </span>
            <p style={{ color: theme === 'dark' ? '#9ca3af' : '#4b5563', fontSize: '13.5px', lineHeight: 1.6, margin: 0 }}>
              {isDe 
                ? 'Die führende All-in-One Plattform für Amazon KDP Publisher. Gestalte Bestseller in Rekordzeit mit hochentwickelter KI.' 
                : 'The leading all-in-one platform for Amazon KDP publishers. Create bestsellers in record time with advanced AI.'}
            </p>

          </div>

          {/* Product Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ color: theme === 'dark' ? '#ffffff' : '#111827', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
              {isDe ? 'Produkt' : 'Product'}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li>
                <a href="#produkt" style={{ color: theme === 'dark' ? '#737373' : '#666', textDecoration: 'none', fontSize: '13.5px', transition: 'color 0.2s' }}
                   onMouseEnter={e => e.currentTarget.style.color = theme === 'dark' ? '#fff' : '#000'}
                   onMouseLeave={e => e.currentTarget.style.color = theme === 'dark' ? '#737373' : '#666'}>
                  {isDe ? 'Schreibstudio' : 'Writing Studio'}
                </a>
              </li>
              <li>
                <a href="#rechner" style={{ color: theme === 'dark' ? '#737373' : '#666', textDecoration: 'none', fontSize: '13.5px', transition: 'color 0.2s' }}
                   onMouseEnter={e => e.currentTarget.style.color = theme === 'dark' ? '#fff' : '#000'}
                   onMouseLeave={e => e.currentTarget.style.color = theme === 'dark' ? '#737373' : '#666'}>
                  {isDe ? 'KDP Rechner' : 'KDP Calculator'}
                </a>
              </li>
              <li>
                <a href="#faq" style={{ color: theme === 'dark' ? '#737373' : '#666', textDecoration: 'none', fontSize: '13.5px', transition: 'color 0.2s' }}
                   onMouseEnter={e => e.currentTarget.style.color = theme === 'dark' ? '#fff' : '#000'}
                   onMouseLeave={e => e.currentTarget.style.color = theme === 'dark' ? '#737373' : '#666'}>
                  {isDe ? 'Häufige Fragen' : 'FAQs'}
                </a>
              </li>
              <li>
                <a href="#roadmap" style={{ color: theme === 'dark' ? '#737373' : '#666', textDecoration: 'none', fontSize: '13.5px', transition: 'color 0.2s' }}
                   onMouseEnter={e => e.currentTarget.style.color = theme === 'dark' ? '#fff' : '#000'}
                   onMouseLeave={e => e.currentTarget.style.color = theme === 'dark' ? '#737373' : '#666'}>
                  Roadmap
                </a>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ color: theme === 'dark' ? '#ffffff' : '#111827', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
              {isDe ? 'Ressourcen' : 'Resources'}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li>
                <a href="mailto:support@book24.studio" style={{ color: theme === 'dark' ? '#737373' : '#666', textDecoration: 'none', fontSize: '13.5px', transition: 'color 0.2s' }}
                   onMouseEnter={e => e.currentTarget.style.color = theme === 'dark' ? '#fff' : '#000'}
                   onMouseLeave={e => e.currentTarget.style.color = theme === 'dark' ? '#737373' : '#666'}>
                  {isDe ? 'Support' : 'Support'}
                </a>
              </li>
              <li>
                <a href="#team" style={{ color: theme === 'dark' ? '#737373' : '#666', textDecoration: 'none', fontSize: '13.5px', transition: 'color 0.2s' }}
                   onMouseEnter={e => e.currentTarget.style.color = theme === 'dark' ? '#fff' : '#000'}
                   onMouseLeave={e => e.currentTarget.style.color = theme === 'dark' ? '#737373' : '#666'}>
                  {isDe ? 'Über uns' : 'About us'}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ color: theme === 'dark' ? '#ffffff' : '#111827', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
              {isDe ? 'Rechtliches' : 'Legal'}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li>
                <button onClick={() => setLegalPage('impressum')} style={{ background: 'none', border: 'none', padding: 0, color: theme === 'dark' ? '#737373' : '#666', fontSize: '13.5px', cursor: 'pointer', textAlign: 'left', transition: 'color 0.2s' }}
                   onMouseEnter={e => e.currentTarget.style.color = theme === 'dark' ? '#fff' : '#000'}
                   onMouseLeave={e => e.currentTarget.style.color = theme === 'dark' ? '#737373' : '#666'}>
                  Impressum
                </button>
              </li>
              <li>
                <button onClick={() => setLegalPage('datenschutz')} style={{ background: 'none', border: 'none', padding: 0, color: theme === 'dark' ? '#737373' : '#666', fontSize: '13.5px', cursor: 'pointer', textAlign: 'left', transition: 'color 0.2s' }}
                   onMouseEnter={e => e.currentTarget.style.color = theme === 'dark' ? '#fff' : '#000'}
                   onMouseLeave={e => e.currentTarget.style.color = theme === 'dark' ? '#737373' : '#666'}>
                  Datenschutzerklärung
                </button>
              </li>
              <li>
                <button onClick={() => setLegalPage('privacy')} style={{ background: 'none', border: 'none', padding: 0, color: theme === 'dark' ? '#737373' : '#666', fontSize: '13.5px', cursor: 'pointer', textAlign: 'left', transition: 'color 0.2s' }}
                   onMouseEnter={e => e.currentTarget.style.color = theme === 'dark' ? '#fff' : '#000'}
                   onMouseLeave={e => e.currentTarget.style.color = theme === 'dark' ? '#737373' : '#666'}>
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => setLegalPage('terms')} style={{ background: 'none', border: 'none', padding: 0, color: theme === 'dark' ? '#737373' : '#666', fontSize: '13.5px', cursor: 'pointer', textAlign: 'left', transition: 'color 0.2s' }}
                   onMouseEnter={e => e.currentTarget.style.color = theme === 'dark' ? '#fff' : '#000'}
                   onMouseLeave={e => e.currentTarget.style.color = theme === 'dark' ? '#737373' : '#666'}>
                  AGB / Terms
                </button>
              </li>
            </ul>
          </div>


        </div>

        {/* Bottom bar */}
        <div style={{
          maxWidth: '1120px',
          margin: '0 auto',
          paddingTop: '32px',
          borderTop: theme === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          fontSize: '13px',
          color: theme === 'dark' ? '#737373' : '#666',
        }}>
          <div>
            &copy; {new Date().getFullYear()} Book24 Studio. {isDe ? 'Alle Rechte vorbehalten.' : 'All rights reserved.'}
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: theme === 'dark' ? '#525252' : '#888' }}>
              Built with ♥ for KDP publishers.
            </span>
          </div>
        </div>
      </footer>

      <LegalModal page={legalPage} onClose={() => setLegalPage(null)} theme={theme} />

      {/* Cookie Consent Banner */}
      <AnimatePresence>
        {!cookieConsent && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              bottom: '24px',
              left: '24px',
              right: '24px',
              maxWidth: '720px',
              margin: '0 auto',
              background: theme === 'dark' ? 'rgba(15, 15, 15, 0.85)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
              padding: '16px 24px',
              borderRadius: '16px',
              zIndex: 9999,
              boxShadow: theme === 'dark' ? '0 20px 40px rgba(0, 0, 0, 0.4)' : '0 20px 40px rgba(0, 0, 0, 0.08)',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '24px',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1', minWidth: '280px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: theme === 'dark' ? '#fff' : '#1a1a1a' }}>
                {isDe ? 'Cookie-Hinweis' : 'Cookie Notice'}
              </h4>
              <p style={{ fontSize: '13px', lineHeight: 1.5, margin: 0, color: theme === 'dark' ? '#a3a3a3' : '#666' }}>
                {isDe ? 'Wir nutzen Cookies, um unsere Website optimal zu gestalten. Mit dem Klick auf "Akzeptieren" stimmst du der Verwendung zu.' : 'We use cookies to optimize our website. By clicking "Accept" you agree to their use.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexShrink: 0 }}>
              <button
                onClick={() => {
                  try {
                    localStorage.setItem('cookie-consent', 'false');
                  } catch (e) {}
                  setCookieConsent(true);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: theme === 'dark' ? '#a3a3a3' : '#666',
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '8px 16px',
                  cursor: 'pointer',
                  borderRadius: '8px'
                }}
              >
                {isDe ? 'Ablehnen' : 'Decline'}
              </button>
              <button
                onClick={() => {
                  try {
                    localStorage.setItem('cookie-consent', 'true');
                  } catch (e) {}
                  setCookieConsent(true);
                }}
                style={{
                  background: '#ea580c',
                  border: 'none',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '8px 16px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(234, 88, 12, 0.2)'
                }}
              >
                {isDe ? 'Akzeptieren' : 'Accept'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </ClickSpark>
  );
};
