import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ChevronDown, ArrowRight } from 'lucide-react';
import ShinyText from './ShinyText';
import ProfileCard from './ProfileCard';


import ClickSpark from './ClickSpark';
import { CosmicBackground } from './CosmicBackground';
import { LandingNavbar } from './LandingNavbar';

import { LegalDocumentPage } from './LegalModal';
import type { LegalPage } from './LegalModal';
import './LandingPage.css';

const PROFILE_ICON_PATTERN = '/profile-icon-pattern.svg';

const TEAM = [
  {
    name: 'Yedo',
    title: 'Developer',
    avatarUrl: '/yigit.png',
    iconUrl: PROFILE_ICON_PATTERN,
    behindGlowColor: 'rgba(167, 139, 250, 0.67)',
    innerGradient: 'linear-gradient(145deg,#4c1d958c 0%,#818cf844 100%)',
    avatarScale: 1.0,
  },
];




const getFaqs = (isDe: boolean) => [
  {
    q: isDe ? 'Gehören mir die Rechte an den generierten Büchern?' : 'Do I own the rights to the books I generate?',
    a: isDe ? 'Ja. Alle generierten Inhalte, Texte und Layouts gehören zu 100% dir. Du kannst sie uneingeschränkt auf Amazon KDP oder anderen Plattformen unter deinem Namen veröffentlichen und monetarisieren.' : 'You receive the rights to use and publish the content you create with BookLab Studio, subject to applicable laws and third-party AI provider terms. You are responsible for reviewing the output before publishing it.'
  },
  {
    q: isDe ? 'Wird der Preis in Zukunft steigen?' : 'Will the price increase in the future?',
    a: isDe ? 'Ja! Wir entwickeln BookLab Studio kontinuierlich weiter. Mit jedem großen Update kommen neue, mächtige Funktionen hinzu. Daher wird der Preis des Produkts stetig steigen. Wer sich den Zugang jetzt sichert, erhält alle künftigen Erweiterungen kostenlos – ohne Aufpreis!' : 'Yes! We are continuously developing BookLab Studio. With every major update, new powerful features are added. Therefore, the price of the product will steadily increase. Those who secure access now will receive all future expansions for free - at no extra cost!'
  },
  {
    q: isDe ? 'Benötige ich Vorkenntnisse im Buch-Layouting?' : 'Do I need prior book formatting experience?',
    a: isDe ? 'Nein, überhaupt nicht. Die Plattform übernimmt das komplette Design, die Ränder und die Schriftformatierung automatisch nach offiziellen Amazon KDP-Druckstandards (z.B. 6x9 Zoll Taschenbuchformat).' : 'No. BookLab Studio helps handle layout, margins, and typography according to common Amazon KDP print requirements, including formats such as 6 × 9 inch paperbacks.'
  },
  {
    q: isDe ? 'Gibt es versteckte monatliche Gebühren?' : 'Are there any hidden monthly fees?',
    a: isDe ? 'Nein. Mit dem Studio-Pass sicherst du dir einen lebenslangen Zugang zu allen Kernfunktionen. Keine Abos, keine versteckten Kosten.' : 'No. The Studio Pass gives you lifetime access to all core features. No subscriptions, no hidden costs.'
  },
  {
    q: isDe ? 'Darf ich mehrere Accounts mit verschiedenen E-Mails kaufen, um die Keys später teurer weiterzuverkaufen?' : 'Can I buy multiple accounts or resell license keys?',
    a: isDe
      ? 'Ja, das ist vollständig erlaubt! Sobald du einen Key einlöst, ist er an dein Konto gebunden und funktioniert nur auf einem Gerät gleichzeitig. Doch uneingelöste Keys können niemals ablaufen – du kannst sie also jederzeit weiterverkaufen. Da der Preis mit jedem Update steigt, lohnt es sich, sich jetzt mehrere Keys zu sichern und sie später zum aktuellen Marktpreis weiterzugeben.'
      : 'License keys are intended for the original purchaser and may only be used according to the applicable license terms. Please contact support before purchasing multiple licenses or transferring access.'
  },
];

interface LandingPageProps {
  onLoginClick: () => void;
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  language: 'de' | 'en';
  onLanguageChange: (lang: 'de' | 'en') => void;
}

const getLegalPageFromUrl = (): LegalPage => {
  if (typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get('legal');
  return value === 'impressum' || value === 'datenschutz' || value === 'terms' || value === 'privacy' ? value : null;
};

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, theme, setTheme, language, onLanguageChange }) => {
  const isDe = language === 'de';



  const [openFaq, setOpenFaq] = React.useState<number | null>(null);
  const [legalPage, setLegalPage] = React.useState<LegalPage>(() => getLegalPageFromUrl());
  const [showStickyCta, setShowStickyCta] = React.useState(false);
  const [stickyCtaDismissed, setStickyCtaDismissed] = React.useState(false);
  const [emailInput, setEmailInput] = React.useState('');
  const [emailSubmitted, setEmailSubmitted] = React.useState(false);
  const [cookieConsent, setCookieConsent] = React.useState<boolean>(() => {
    try {
      const val = localStorage.getItem('cookie-consent');
      return val === 'true' || val === 'false';
    } catch (e) {
      return false;
    }
  });

  React.useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScroll = window.scrollY;
          setShowStickyCta(prev => {
            if (currentScroll > 750) return true;
            if (currentScroll < 550) return false;
            return prev;
          });
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    const handlePopState = () => setLegalPage(getLegalPageFromUrl());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openLegalPage = (page: Exclude<LegalPage, null>) => {
    const url = new URL(window.location.href);
    url.searchParams.set('legal', page);
    window.history.pushState({ legal: page }, '', url);
    setLegalPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeLegalPage = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('legal');
    window.history.pushState({}, '', url.pathname + url.hash);
    setLegalPage(null);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq((prev: number | null) => prev === index ? null : index);
  };

  if (legalPage) {
    return (
      <LegalDocumentPage
        page={legalPage}
        onBack={closeLegalPage}
        onNavigate={(page) => openLegalPage(page)}
        theme={theme}
      />
    );
  }

  return (
    <ClickSpark
      sparkColor={theme === 'dark' ? '#ffffff' : '#0a0a0a'}
      sparkSize={10}
      sparkRadius={15}
      sparkCount={8}
      duration={400}
    >
    <div className={`booklab-landing theme-${theme}`} style={{
      minHeight: '100vh',
      backgroundColor: theme === 'dark' ? '#0a0a0a' : '#f8f9fa',
      color: theme === 'dark' ? '#ffffff' : '#111827',
      fontFamily: "'Inter', sans-serif",
      overflowX: 'hidden',
      position: 'relative',
      transition: 'background-color 0.3s ease, color 0.3s ease'
    }}>
      {/* Dark-space background: small pixel stars and planets softly pull toward the cursor. */}
      {theme === 'dark' ? (
        <CosmicBackground active />
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
      <main className="landing-hero" style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '140px', paddingBottom: '0px', textAlign: 'center', padding: '140px 24px 0px' }}>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={{ 
            fontSize: 'clamp(28px, 6.8vw, 92px)', 
            fontWeight: 900, 
            lineHeight: 1.02, 
            letterSpacing: '-0.05em', 
            maxWidth: '1000px', 
            margin: '0 0 24px 0',
            fontFamily: "'Poppins', sans-serif",
            textTransform: 'uppercase'
          }}
        >
          {isDe ? (
            <>
              <span className="hero-title-line" style={{ display: 'inline-block' }}>In <span className="slogan-accent">3 Minuten</span></span> <br/>
              <span>zum perfekten Buch.</span>
            </>
          ) : (
            <>
              <span className="hero-title-line" style={{ display: 'inline-block' }}>Your book in <span className="slogan-accent">3 minutes</span></span> <br/>
              <span>ready to publish.</span>
            </>
          )}
        </motion.h1>



        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}
        >
          <button 
            className="landing-primary-cta"
            onClick={() => window.location.href = 'https://booklabstudio.gumroad.com/l/booklabstudio'}
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
              <ShinyText text={isDe ? 'Studio-Pass sichern' : 'Get Lifetime Access'} color="rgba(255, 255, 255, 0.85)" shineColor="#ffffff" speed={2.5} />
            </span>
            <ArrowRight size={18} strokeWidth={2.5} color="#ffffff" />
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
          style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
        >
          {/* Stars & Avatars Side-by-Side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '2px' }}>
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="1">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {[
                'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&h=128&q=80',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&h=128&q=80',
                'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=128&h=128&q=80',
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&h=128&q=80'
              ].map((src, idx) => (
                <img key={idx} src={src} alt={`User ${idx + 1}`} style={{ width: '24px', height: '24px', borderRadius: '50%', border: theme === 'dark' ? '2px solid #0a0a0a' : '2px solid #ffffff', marginLeft: idx > 0 ? '-8px' : '0px', objectFit: 'cover', boxShadow: '0 4px 10px rgba(0,0,0,0.15)', zIndex: 4 - idx }} />
              ))}
            </div>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#a3a3a3' : '#4b5563', lineHeight: 1.3, textAlign: 'center' }}>
            {isDe ? <>Bereits <strong style={{ color: theme === 'dark' ? '#fff' : '#1a1a1a', fontWeight: 800 }}>1.350+</strong> Bücher erfolgreich veröffentlicht</> : <><strong style={{ color: theme === 'dark' ? '#fff' : '#1a1a1a', fontWeight: 800 }}>1,350+</strong> books successfully published</>}
          </span>
        </motion.div>

        {/* Infinite Book Cover Marquee */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          style={{
            width: '100%',
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
            maskImage: 'linear-gradient(to right, transparent, white 12%, white 88%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, white 12%, white 88%, transparent)',
            margin: '24px auto 0',
          }}
        >
          <style>{`
            @keyframes marquee-scroll {
              0%   { transform: translateX(0); }
              100% { transform: translateX(-33.3333%); }
            }
            .marquee-track {
              display: flex;
              gap: 18px;
              width: max-content;
              animation: marquee-scroll 45s linear infinite;
              will-change: transform;
            }
          `}</style>
          <div className="marquee-track">
            {[
              { src: '/cover1.jpg', rev: 854 },
              { src: '/cover2.jpg', rev: 139 },
              { src: '/cover4.jpg', rev: 712 },
              { src: '/cover4_kopie.jpg', rev: 1120 },
              { src: '/cover5.jpg', rev: 1504 },
              { src: '/cover6.jpg', rev: 680 },
              { src: '/cover88.jpg', rev: 888 },
              { src: '/cover99.jpg', rev: 999 },
              { src: '/cover100.jpg', rev: 1000 },
              { src: '/cover111.jpg', rev: 1111 },
              { src: '/cover333.jpg', rev: 3333 },
              { src: '/cover1222.jpg', rev: 1222 },
              // duplicate 1 for seamless loop
              { src: '/cover1.jpg', rev: 854 },
              { src: '/cover2.jpg', rev: 139 },
              { src: '/cover4.jpg', rev: 712 },
              { src: '/cover4_kopie.jpg', rev: 1120 },
              { src: '/cover5.jpg', rev: 1504 },
              { src: '/cover6.jpg', rev: 680 },
              { src: '/cover88.jpg', rev: 888 },
              { src: '/cover99.jpg', rev: 999 },
              { src: '/cover100.jpg', rev: 1000 },
              { src: '/cover111.jpg', rev: 1111 },
              { src: '/cover333.jpg', rev: 3333 },
              { src: '/cover1222.jpg', rev: 1222 },
              // duplicate 2 for seamless loop
              { src: '/cover1.jpg', rev: 854 },
              { src: '/cover2.jpg', rev: 139 },
              { src: '/cover4.jpg', rev: 712 },
              { src: '/cover4_kopie.jpg', rev: 1120 },
              { src: '/cover5.jpg', rev: 1504 },
              { src: '/cover6.jpg', rev: 680 },
              { src: '/cover88.jpg', rev: 888 },
              { src: '/cover99.jpg', rev: 999 },
              { src: '/cover100.jpg', rev: 1000 },
              { src: '/cover111.jpg', rev: 1111 },
              { src: '/cover333.jpg', rev: 3333 },
              { src: '/cover1222.jpg', rev: 1222 },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  position: 'relative',
                  height: '200px',
                  width: '134px',
                  flexShrink: 0,
                  borderRadius: '6px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: theme === 'dark' ? '0 10px 28px rgba(0,0,0,0.55)' : '0 10px 28px rgba(0,0,0,0.18)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                  e.currentTarget.style.boxShadow = theme === 'dark' ? '0 15px 30px rgba(0,0,0,0.65)' : '0 15px 30px rgba(0,0,0,0.22)';
                  const overlay = e.currentTarget.querySelector('.cov-ov') as HTMLDivElement;
                  if (overlay) overlay.style.opacity = '1';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = theme === 'dark' ? '0 10px 28px rgba(0,0,0,0.55)' : '0 10px 28px rgba(0,0,0,0.18)';
                  const overlay = e.currentTarget.querySelector('.cov-ov') as HTMLDivElement;
                  if (overlay) overlay.style.opacity = '0';
                }}
              >
                <img
                  src={item.src}
                  alt={`Book cover`}
                  style={{ width: '134px', height: '200px', objectFit: 'cover', display: 'block' }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
                {/* Always-visible royalty badge at bottom */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)',
                  padding: '24px 8px 10px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px'
                }}>
                  <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                    {isDe ? 'Tantiemen' : 'Royalties'}
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#4ade80', letterSpacing: '-0.02em' }}>
                    {isDe
                      ? item.rev.toLocaleString('de-DE') + ' €'
                      : '$' + Math.round(item.rev * 1.1).toLocaleString('en-US')}
                  </span>
                </div>
                {/* Hover overlay pulse */}
                <div className="cov-ov" style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(22,207,224,0.08)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                  pointerEvents: 'none'
                }} />
              </div>
            ))}
          </div>
        </motion.div>
      </main>
   
      {/* Email Subscription Section */}
      <section className="landing-subscribe-section" style={{ position: 'relative', zIndex: 10, padding: '60px 24px', maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: '#ffffff',
            border: '2px solid #0f172a',
            boxShadow: '5px 5px 0px #16cfe0',
            borderRadius: '8px',
            padding: '36px 28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}
          whileHover={{ y: -2, x: -2, boxShadow: '7px 7px 0px #16cfe0' }}
        >
          {/* Match the sticky Lifetime Pass reminder exactly. */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', width: '100%', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
              <img
                src="/logokdpbook24studio.png"
                alt="BookLab Logo"
                style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '4px', flexShrink: 0 }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#1f2937', letterSpacing: '-0.02em' }}>
                  BookLab Studio Lifetime Pass
                </span>
                <span style={{ fontSize: '11.5px', fontWeight: 500, color: '#4b5563' }}>
                  {isDe ? 'Lebenslanger Zugriff · Alle künftigen Updates' : 'Lifetime Access · All Future Updates'}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px', lineHeight: 1 }}>
              <span style={{ textDecoration: 'line-through', opacity: 0.6, color: '#9ca3af', fontSize: '11px', fontWeight: 600 }}>300$</span>
              <span style={{ fontWeight: 800, color: '#10b981', fontSize: '18px', letterSpacing: '-0.03em' }}>199$</span>
            </div>
          </div>

          {emailSubmitted ? (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                background: '#ecfdf5',
                border: '1.5px solid #10b981',
                color: '#065f46',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '13.5px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Check size={16} strokeWidth={3} style={{ flexShrink: 0 }} />
              {isDe ? 'Erfolgreich eingetragen!' : 'Successfully subscribed!'}
            </motion.div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const email = emailInput.trim().toLowerCase();
                if (!email) return;
                try {
                  const response = await fetch('/api/waitlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                  });
                  if (!response.ok) throw new Error('Waitlist request failed');
                  setEmailSubmitted(true);
                } catch {
                  window.alert(isDe ? 'Die Anmeldung ist gerade nicht verfügbar. Bitte versuche es gleich noch einmal.' : 'Signup is temporarily unavailable. Please try again shortly.');
                }
              }}
              style={{
                display: 'flex',
                width: '100%',
                maxWidth: '480px',
                gap: '10px',
                flexWrap: 'wrap'
              }}
            >
              <input
                type="email"
                required
                placeholder={isDe ? 'Deine E-Mail-Adresse' : 'Your email address'}
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '220px',
                  background: '#f9fafb',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  fontSize: '13.5px',
                  color: '#1f2937',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  fontFamily: "'Inter', sans-serif"
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#16cfe0'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
              />
              <button
                type="submit"
                style={{
                  background: '#16cfe0',
                  color: '#031b23',
                  border: '1px solid rgba(206, 255, 255, .82)',
                  borderBottom: '3px solid #087f98',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(17, 202, 226, 0.22)',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#35e5f2';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(17, 202, 226, 0.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#16cfe0';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(17, 202, 226, 0.22)';
                }}
              >
                <ShinyText text={isDe ? 'Abonnieren' : 'Subscribe'} color="#031b23" shineColor="#ffffff" speed={2.5} />
              </button>
            </form>
          )}
        </motion.div>
      </section>



      {/* Team / Leadership */}
      <section id="team" className="landing-team-section" style={{ position: 'relative', zIndex: 10, padding: '40px 24px 100px', maxWidth: '800px', margin: '0 auto', scrollMarginTop: '100px', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center', marginBottom: '40px' }}
        >
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 12px', color: theme === 'dark' ? '#fff' : '#1a1a2e' }}>
            {isDe ? 'Der Gründer hinter BookLab Studio' : 'The Founder behind BookLab Studio'}
          </h2>
        </motion.div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '32px',
          width: '100%',
        }}>
          {TEAM.map((member) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              style={{ width: '100%', maxWidth: '320px' }}
            >
              <ProfileCard
                className="landing-team"
                name={member.name}
                title={member.title === 'Developer' ? (isDe ? 'Gründer' : 'Founder') : member.title}
                avatarUrl={member.avatarUrl}
                avatarSymbol={undefined}
                iconUrl={member.iconUrl}
                showUserInfo={false}
                enableTilt
                enableMobileTilt={false}
                behindGlowEnabled
                behindGlowColor={member.behindGlowColor}
                innerGradient={member.innerGradient}
                avatarScale={member.avatarScale}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ Sektion */}
      <section id="faq" className="landing-faq-section" style={{ position: 'relative', zIndex: 10, padding: '80px 24px', maxWidth: '800px', margin: '0 auto', scrollMarginTop: '100px' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center', marginBottom: '16px' }}
        >
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 12px', color: theme === 'dark' ? '#fff' : '#1a1a1a' }}>
            {isDe ? 'Häufig gestellte Fragen' : 'Frequently Asked Questions'}
          </h2>
          <p style={{ color: theme === 'dark' ? '#a3a3a3' : '#666', fontSize: '16px', margin: '0 auto', lineHeight: 1.6, maxWidth: '560px' }}>
            {isDe ? 'Alles, was du über BookLab Studio und die Veröffentlichung wissen musst.' : 'Everything you need to know about BookLab Studio and publishing.'}
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
      <section className="landing-final-cta" style={{
        position: 'relative',
        padding: '100px 24px',
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center',
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
          background: 'radial-gradient(ellipse at center, rgba(22, 207, 224, 0.12) 0%, rgba(11, 87, 208, 0.03) 40%, transparent 70%)',
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
            {isDe ? 'Bereit für deinen KDP-Erfolg?' : 'Ready to build your next KDP book?'}
          </h2>
          <p style={{ color: theme === 'dark' ? '#a3a3a3' : '#666', fontSize: '20px', margin: '0 auto 56px auto', lineHeight: 1.6, maxWidth: '640px' }}>
            {isDe ? 'Erhalte sofortigen, lebenslangen Zugriff auf den Schreibwerkzeug Generator. Keine monatlichen Kosten.' : 'Get instant lifetime access to BookLab Studio and build your next KDP book from one focused workspace.'}
          </p>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
            {/* Primary Button */}
            <button 
              className="landing-primary-cta landing-final-primary-cta"
              onClick={() => window.location.href = 'https://booklabstudio.gumroad.com/l/booklabstudio'}
              style={{
                background: '#16cfe0',
                border: '1px solid rgba(206, 255, 255, .82)',
                borderBottom: '4px solid #087f98',
                padding: '14px 36px 16px 36px',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 8px 30px rgba(17, 202, 226, .3), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: 'translateY(0)',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => { 
                e.currentTarget.style.transform = 'translateY(-2px)'; 
                e.currentTarget.style.background = '#35e5f2';
                e.currentTarget.style.borderBottom = '5px solid #0a9bb7';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(17, 202, 226, .45), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
              }}
              onMouseLeave={(e) => { 
                e.currentTarget.style.transform = 'translateY(0)'; 
                e.currentTarget.style.background = '#16cfe0';
                e.currentTarget.style.borderBottom = '4px solid #087f98';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(17, 202, 226, .3), inset 0 1px 0 rgba(255, 255, 255, 0.4)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(2px)';
                e.currentTarget.style.borderBottom = '1px solid #087f98';
                e.currentTarget.style.boxShadow = '0 4px 10px rgba(17, 202, 226, .15), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderBottom = '5px solid #0a9bb7';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(17, 202, 226, .45), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
              }}
            >
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#031b23', letterSpacing: '-0.01em' }}>
                <ShinyText text={isDe ? 'Jetzt Erstellen' : 'Get Lifetime Access'} color="#031b23" shineColor="#ffffff" speed={2.5} />
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(3, 27, 35, 0.15)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(3, 27, 35, 0.12)' }}>
                <span style={{ fontSize: '13px', textDecoration: 'line-through', color: 'rgba(3, 27, 35, 0.5)' }}>300$</span>
                <span style={{ fontSize: '16px', fontWeight: 900, color: '#031b23' }}>199$</span>
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
              BookLab <span style={{ fontWeight: 300, color: theme === 'dark' ? '#ffffff' : '#111827' }}>Studio</span>
            </span>
            <p style={{ color: theme === 'dark' ? '#9ca3af' : '#4b5563', fontSize: '13.5px', lineHeight: 1.6, margin: 0 }}>
              {isDe 
                ? 'Die führende All-in-One Plattform für Amazon KDP Publisher. Gestalte Bestseller in Rekordzeit mit hochentwickelter KI.' 
                : 'The leading all-in-one platform for Amazon KDP publishers. Create bestsellers in record time with advanced AI.'}
            </p>

          </div>

          {/* Navigation Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ color: theme === 'dark' ? '#ffffff' : '#111827', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
              {isDe ? 'Navigation' : 'Navigation'}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li>
                <a href="#faq" style={{ color: theme === 'dark' ? '#737373' : '#666', textDecoration: 'none', fontSize: '13.5px', transition: 'color 0.2s' }}
                   onMouseEnter={e => e.currentTarget.style.color = theme === 'dark' ? '#fff' : '#000'}
                   onMouseLeave={e => e.currentTarget.style.color = theme === 'dark' ? '#737373' : '#666'}>
                  FAQ
                </a>
              </li>
              <li>
                <a href="#team" style={{ color: theme === 'dark' ? '#737373' : '#666', textDecoration: 'none', fontSize: '13.5px', transition: 'color 0.2s' }}
                   onMouseEnter={e => e.currentTarget.style.color = theme === 'dark' ? '#fff' : '#000'}
                   onMouseLeave={e => e.currentTarget.style.color = theme === 'dark' ? '#737373' : '#666'}>
                  {isDe ? 'Entwickler' : 'Developer'}
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
                <button onClick={() => openLegalPage('impressum')} style={{ background: 'none', border: 'none', padding: 0, color: theme === 'dark' ? '#737373' : '#666', fontSize: '13.5px', cursor: 'pointer', textAlign: 'left', transition: 'color 0.2s' }}
                   onMouseEnter={e => e.currentTarget.style.color = theme === 'dark' ? '#fff' : '#000'}
                   onMouseLeave={e => e.currentTarget.style.color = theme === 'dark' ? '#737373' : '#666'}>
                  Legal Notice
                </button>
              </li>
              <li>
                <button onClick={() => openLegalPage('datenschutz')} style={{ background: 'none', border: 'none', padding: 0, color: theme === 'dark' ? '#737373' : '#666', fontSize: '13.5px', cursor: 'pointer', textAlign: 'left', transition: 'color 0.2s' }}
                   onMouseEnter={e => e.currentTarget.style.color = theme === 'dark' ? '#fff' : '#000'}
                   onMouseLeave={e => e.currentTarget.style.color = theme === 'dark' ? '#737373' : '#666'}>
                  Privacy Notice
                </button>
              </li>
              <li>
                <button onClick={() => openLegalPage('privacy')} style={{ background: 'none', border: 'none', padding: 0, color: theme === 'dark' ? '#737373' : '#666', fontSize: '13.5px', cursor: 'pointer', textAlign: 'left', transition: 'color 0.2s' }}
                   onMouseEnter={e => e.currentTarget.style.color = theme === 'dark' ? '#fff' : '#000'}
                   onMouseLeave={e => e.currentTarget.style.color = theme === 'dark' ? '#737373' : '#666'}>
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => openLegalPage('terms')} style={{ background: 'none', border: 'none', padding: 0, color: theme === 'dark' ? '#737373' : '#666', fontSize: '13.5px', cursor: 'pointer', textAlign: 'left', transition: 'color 0.2s' }}
                   onMouseEnter={e => e.currentTarget.style.color = theme === 'dark' ? '#fff' : '#000'}
                   onMouseLeave={e => e.currentTarget.style.color = theme === 'dark' ? '#737373' : '#666'}>
                  Terms of Service
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
            &copy; {new Date().getFullYear()} BookLab Studio. {isDe ? 'Alle Rechte vorbehalten.' : 'All rights reserved.'}
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: theme === 'dark' ? '#525252' : '#888' }}>
              Built with ♥ for KDP publishers.
            </span>
          </div>
        </div>
      </footer>

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
                  background: '#2563eb',
                  border: 'none',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '8px 16px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                }}
              >
                {isDe ? 'Akzeptieren' : 'Accept'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Sticky Bottom CTA Bar */}
      <AnimatePresence>
        {showStickyCta && !stickyCtaDismissed && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={`sticky-cta-banner theme-${theme}`}
            style={{
              background: '#ffffff',
              border: '2px solid #0f172a',
              boxShadow: '5px 5px 0px #16cfe0',
              borderRadius: '8px',
            }}
            whileHover={{ y: -2, x: -2, boxShadow: '7px 7px 0px #16cfe0' }}
          >
            <div className="sticky-cta-banner-text-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {/* Logo Favicon */}
              <img 
                src="/logokdpbook24studio.png" 
                alt="BookLab Logo" 
                style={{
                  width: '32px',
                  height: '32px',
                  objectFit: 'contain',
                  borderRadius: '4px',
                  flexShrink: 0
                }} 
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                <span className="sticky-cta-banner-title" style={{ fontSize: '14px', fontWeight: 800, color: '#1f2937', letterSpacing: '-0.02em' }}>
                  BookLab Studio Lifetime Pass
                </span>
                <span className="sticky-cta-banner-desc" style={{ fontSize: '11.5px', fontWeight: 500, color: '#4b5563' }}>
                  {isDe ? 'Lebenslanger Zugriff · Alle künftigen Updates' : 'Lifetime Access · All Future Updates'}
                </span>
              </div>
            </div>

            <div className="sticky-cta-banner-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px', lineHeight: 1 }}>
                <span style={{ textDecoration: 'line-through', opacity: 0.6, color: '#9ca3af', fontSize: '11px', fontWeight: 600 }}>300$</span>
                <span style={{ fontWeight: 800, color: '#10b981', fontSize: '18px', letterSpacing: '-0.03em' }}>199$</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => window.location.href = 'https://booklabstudio.gumroad.com/l/booklabstudio'}
                  style={{
                    background: '#16cfe0',
                    color: '#031b23',
                    border: '1px solid rgba(206, 255, 255, .82)',
                    borderBottom: '3px solid #087f98',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(17, 202, 226, 0.22)',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#35e5f2';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(17, 202, 226, 0.3)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#16cfe0';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(17, 202, 226, 0.22)';
                  }}
                >
                  <ShinyText text={isDe ? 'Jetzt sichern' : 'Get Access'} color="#031b23" shineColor="#ffffff" speed={2.5} />
                </button>

                <button
                  onClick={() => setStickyCtaDismissed(true)}
                  title={isDe ? 'Schließen' : 'Close'}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#1f2937';
                    e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = '#9ca3af';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </ClickSpark>
  );
};
