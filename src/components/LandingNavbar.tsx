import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Menu, X, Sun, Moon, Globe } from 'lucide-react';
import './LandingNavbar.css';
import RotatingText from './RotatingText';
import ShinyText from './ShinyText';

interface LandingNavbarProps {
  onLoginClick: () => void;
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  language: 'de' | 'en';
  onLanguageChange: (lang: 'de' | 'en') => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ 
  onLoginClick, 
  theme, 
  setTheme,
  language,
  onLanguageChange
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDe = language === 'de';
  const navItems = [
    { label: isDe ? 'Produkt' : 'Product', target: 'produkt' },
    { label: 'Team', target: 'team' },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="landing-nav-shell">
      <motion.nav
        className={`landing-nav${scrolled ? ' scrolled' : ''} theme-${theme}`}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <button
          type="button"
          className="landing-nav-brand"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <span className="landing-nav-brand-text">
            <span className="brand-title">Book24</span>
            <span className="brand-suffix">Studio</span>
          </span>
        </button>

        {/* Extra Container: Static Text Pill */}
        <div className="landing-nav-promo-badge">
          {isDe ? 'Buch erstellen' : 'Create Book'}
        </div>

        <div className="landing-nav-links">
          {navItems.map(item => (
            <button
              key={item.target}
              type="button"
              className="landing-nav-link"
              onClick={() => scrollTo(item.target)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="landing-nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Language Toggle Button */}
          <button
            type="button"
            className="landing-nav-link"
            onClick={() => onLanguageChange(language === 'de' ? 'en' : 'de')}
            title={isDe ? 'Switch to English' : 'Auf Deutsch wechseln'}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '4px',
              height: '36px', 
              padding: '0 8px',
              fontSize: '11px',
              fontWeight: 700,
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              backgroundColor: 'rgba(255,255,255,0.02)'
            }}
          >
            <Globe size={13} style={{ color: 'var(--text-muted)' }} />
            <span>{language.toUpperCase()}</span>
          </button>

          <button
            type="button"
            className="landing-nav-link"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Whitemode aktivieren' : 'Darkmode aktivieren'}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', padding: 0 }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button type="button" className="landing-nav-cta" onClick={onLoginClick}>
            <ShinyText text={isDe ? 'Anmelden' : 'Sign In'} color="rgba(255, 255, 255, 0.85)" shineColor="#ffffff" speed={2.5} />
          </button>
          <button
            type="button"
            className="landing-nav-menu-btn"
            aria-label={mobileOpen ? 'Menü schließen' : 'Menü öffnen'}
            onClick={() => setMobileOpen(v => !v)}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="landing-nav-mobile"
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="landing-nav-mobile-promo-badge">
              <RotatingText
                texts={isDe ? ['Jetzt starten', 'Buch erstellen'] : ['Start Now', 'Create Book']}
                staggerFrom="last"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-120%" }}
                staggerDuration={0.025}
                splitLevelClassName="overflow-hidden pb-0.5"
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                rotationInterval={2500}
                splitBy="lines"
                auto
                loop
              />
            </div>
            {navItems.map(item => (
              <button
                key={item.target}
                type="button"
                className="landing-nav-mobile-link"
                onClick={() => scrollTo(item.target)}
              >
                {item.label}
                <ArrowRight size={16} />
              </button>
            ))}
            {/* Language switcher in mobile menu */}
            <button
              type="button"
              className="landing-nav-mobile-link"
              onClick={() => onLanguageChange(language === 'de' ? 'en' : 'de')}
              style={{ justifyContent: 'space-between' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={16} />
                {isDe ? 'Sprache: Deutsch' : 'Language: English'}
              </span>
              <span style={{ fontSize: '11px', opacity: 0.6 }}>{isDe ? '→ EN' : '→ DE'}</span>
            </button>
            <button
              type="button"
              className="landing-nav-cta landing-nav-mobile-cta"
              onClick={() => {
                setMobileOpen(false);
                onLoginClick();
              }}
            >
              <ShinyText text={isDe ? 'Anmelden' : 'Sign In'} color="rgba(255, 255, 255, 0.85)" shineColor="#ffffff" speed={2.5} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
