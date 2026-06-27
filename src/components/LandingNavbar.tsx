import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Menu, X, Sun, Moon } from 'lucide-react';
import './LandingNavbar.css';
import RotatingText from './RotatingText';

const NAV_ITEMS = [
  { label: 'Produkt', target: 'produkt' },
  { label: 'Team', target: 'team' },
] as const;

interface LandingNavbarProps {
  onLoginClick: () => void;
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ onLoginClick, theme, setTheme }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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

        {/* Extra Container: Rotating Text Pill */}
        <div className="landing-nav-promo-badge">
          <RotatingText
            texts={['Jetzt starten', 'Buch erstellen']}
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

        <div className="landing-nav-links">
          {NAV_ITEMS.map(item => (
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

        <div className="landing-nav-actions">
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
            Anmelden
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
                texts={['Jetzt starten', 'Buch erstellen']}
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
            {NAV_ITEMS.map(item => (
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
            <button
              type="button"
              className="landing-nav-cta landing-nav-mobile-cta"
              onClick={() => {
                setMobileOpen(false);
                onLoginClick();
              }}
            >
              Anmelden
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
