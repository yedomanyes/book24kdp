import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, X, Check } from 'lucide-react';
import ShinyText from './ShinyText';
import ProfileCard from './ProfileCard';
import TiltedCard from './TiltedCard';
import { LandingBadPagePreview, LandingBookPagePreview } from './LandingContentPreview';

import PixelSnow from './PixelSnow';

import ClickSpark from './ClickSpark';
import { LandingNavbar } from './LandingNavbar';

const PROFILE_ICON_PATTERN = '/profile-icon-pattern.svg';

const TEAM = [
  {
    name: 'Akim Gürel',
    title: 'CEO',
    avatarUrl: '/akim.jpg',
    iconUrl: PROFILE_ICON_PATTERN,
    behindGlowColor: 'rgba(125, 190, 255, 0.67)',
    innerGradient: 'linear-gradient(145deg,#60496e8c 0%,#71C4FF44 100%)',
  },
  {
    name: 'Yigit Güner',
    title: 'CTO',
    avatarUrl: '/yigit.jpg',
    iconUrl: PROFILE_ICON_PATTERN,
    behindGlowColor: 'rgba(167, 139, 250, 0.67)',
    innerGradient: 'linear-gradient(145deg,#4c1d958c 0%,#818cf844 100%)',
  },
] as const;

const CARD_SIZE = '280px';

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
      {/* Background Pixel Snow */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' }}>
        <PixelSnow 
          color="#ffffff"
          flakeSize={0.01}
          minFlakeSize={1.25}
          pixelResolution={200}
          speed={1.6}
          density={0.35}
          direction={110}
          brightness={3}
          depthFade={2}
          farPlane={21}
          gamma={0.4545}
          variant="round"
        />
      </div>

      {/* Navbar */}
      <LandingNavbar onLoginClick={onLoginClick} />

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
          Ein echtes Buch <br/>
          in <span style={{ background: 'linear-gradient(135deg, #60a5fa, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>3 Minuten</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontSize: '15px', color: '#8e8e93', maxWidth: '560px', margin: '0 0 48px 0', lineHeight: 1.6 }}
        >
          Finde profitable Nischen, generiere fesselnde Buchinhalte und erstelle druckfertige PDF-Layouts in Rekordzeit. Book24 Studio ist das ultimative All-in-One Tool für professionelle Amazon KDP Publisher.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}
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
              <ShinyText text="Jetzt Erstellen" disabled={false} speed={3} color="#ffffff" shineColor="#ffffff" />
            </span>
            <ChevronRight style={{ width: '20px', height: '20px', color: '#fff' }} />
          </button>

          <button 
            onClick={onLoginClick}
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #d946ef 100%)',
              border: 'none',
              padding: '16px 36px',
              borderRadius: '99px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 10px 30px rgba(217, 70, 239, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.4)',
              transition: 'all 0.2s ease',
              transform: 'translateY(0)',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => { 
              e.currentTarget.style.transform = 'translateY(-2px)'; 
              e.currentTarget.style.boxShadow = '0 14px 40px rgba(217, 70, 239, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.5)';
              e.currentTarget.style.filter = 'brightness(1.1)';
            }}
            onMouseLeave={(e) => { 
              e.currentTarget.style.transform = 'translateY(0)'; 
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(217, 70, 239, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.4)';
              e.currentTarget.style.filter = 'brightness(1)';
            }}
          >
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
              Studio-Pass sichern
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(0, 0, 0, 0.2)', padding: '4px 10px', borderRadius: '99px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <span style={{ fontSize: '13px', textDecoration: 'line-through', color: 'rgba(255, 255, 255, 0.6)' }}>300$</span>
              <span style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff' }}>199$</span>
            </div>
          </button>
        </motion.div>
      </main>

      {/* AI Content Showcase — Tilted Cards */}
      <section id="produkt" style={{ position: 'relative', zIndex: 10, padding: '40px 24px 80px', maxWidth: '1200px', margin: '0 auto', scrollMarginTop: '100px' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center', marginBottom: '48px' }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#737373', marginBottom: '10px' }}>
            So sieht dein Buch aus
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 12px', color: '#fff' }}>
            KI-Content, der wie ein echtes Buch wirkt
          </h2>
          <p style={{ color: '#a3a3a3', fontSize: '16px', margin: '0 auto', lineHeight: 1.6, maxWidth: '560px' }}>
            Roher KI-Text vs. professionelles Buchlayout — der Unterschied auf einen Blick.
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
            <span className="landing-compare-label bad">So nicht</span>
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
            <span className="landing-compare-label good">So soll es sein</span>
          </motion.div>
        </div>
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
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 12px', color: '#fff' }}>
            Das Team hinter Book24 Studio
          </h2>
          <p style={{ color: '#a3a3a3', fontSize: '16px', margin: 0, lineHeight: 1.6 }}>
            Vision, Technologie und KDP-Expertise — aus einer Hand.
          </p>
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
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA / Purchase Section */}
      <section style={{
        position: 'relative',
        zIndex: 10,
        padding: '80px 24px',
        maxWidth: '850px',
        margin: '0 auto',
        textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '24px',
        boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
        marginBottom: '100px',
        overflow: 'hidden',
      }}>
        {/* Subtle background glow */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
          zIndex: 0,
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 16px 0', color: '#fff' }}>
            Bereit für deinen KDP-Erfolg?
          </h2>
          <p style={{ color: '#a3a3a3', fontSize: '18px', margin: '0 auto 40px auto', lineHeight: 1.6, maxWidth: '540px' }}>
            Erhalte sofortigen, lebenslangen Zugriff auf alle KI-Recherche- und Schreibwerkzeuge. Keine monatlichen Kosten.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
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
                <ShinyText text="Jetzt Erstellen" disabled={false} speed={3} color="#ffffff" shineColor="#ffffff" />
              </span>
              <ChevronRight style={{ width: '20px', height: '20px', color: '#fff' }} />
            </button>

            <button 
              onClick={onLoginClick}
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #d946ef 100%)',
                border: 'none',
                padding: '16px 36px',
                borderRadius: '99px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 10px 30px rgba(217, 70, 239, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.4)',
                transition: 'all 0.2s ease',
                transform: 'translateY(0)',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => { 
                e.currentTarget.style.transform = 'translateY(-2px)'; 
                e.currentTarget.style.boxShadow = '0 14px 40px rgba(217, 70, 239, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.5)';
                e.currentTarget.style.filter = 'brightness(1.1)';
              }}
              onMouseLeave={(e) => { 
                e.currentTarget.style.transform = 'translateY(0)'; 
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(217, 70, 239, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.4)';
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                Studio-Pass sichern
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(0, 0, 0, 0.2)', padding: '4px 10px', borderRadius: '99px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                <span style={{ fontSize: '13px', textDecoration: 'line-through', color: 'rgba(255, 255, 255, 0.6)' }}>300$</span>
                <span style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff' }}>199$</span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        backgroundColor: 'rgba(10, 10, 10, 0.6)',
        backdropFilter: 'blur(12px)',
        padding: '80px 24px 40px',
        position: 'relative',
        zIndex: 10,
      }}>
        <div style={{
          maxWidth: '1120px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '48px',
          marginBottom: '60px',
          textAlign: 'left',
        }}>
          {/* Logo & Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', gridColumn: 'span 2' }}>
            <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
              Book24 <span style={{ fontWeight: 300, color: 'rgba(255,255,255,0.6)' }}>Studio</span>
            </span>
            <p style={{ color: '#737373', fontSize: '14px', lineHeight: 1.6, maxWidth: '320px' }}>
              Die führende All-in-One Plattform für Amazon KDP Publisher. Gestalte Bestseller in Rekordzeit mit hochentwickelter KI.
            </p>
          </div>

          {/* Links 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ color: '#ffffff', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Produkt</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><a href="#produkt" style={{ color: '#737373', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#737373'}>Features</a></li>
              <li><a href="#produkt" style={{ color: '#737373', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#737373'}>Buch-Vorschau</a></li>
              <li><button onClick={onLoginClick} style={{ background: 'none', border: 'none', padding: 0, color: '#737373', fontSize: '14px', cursor: 'pointer', textAlign: 'left', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#737373'}>Jetzt Starten</button></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ color: '#ffffff', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Unternehmen</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><a href="#team" style={{ color: '#737373', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#737373'}>Über uns</a></li>
              <li><a href="#team" style={{ color: '#737373', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#737373'}>Leadership</a></li>
              <li><a href="mailto:support@book24.studio" style={{ color: '#737373', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#737373'}>Support</a></li>
            </ul>
          </div>


        </div>

        {/* Copyright */}
        <div style={{
          maxWidth: '1120px',
          margin: '0 auto',
          paddingTop: '32px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          fontSize: '13px',
          color: '#525252',
        }}>
          <div>
            &copy; {new Date().getFullYear()} Book24 Studio. Alle Rechte vorbehalten.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <a href="#" style={{ color: '#525252', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#737373'} onMouseLeave={e => e.currentTarget.style.color = '#525252'}>Datenschutz</a>
            <a href="#" style={{ color: '#525252', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#737373'} onMouseLeave={e => e.currentTarget.style.color = '#525252'}>Impressum</a>
          </div>
        </div>
      </footer>
    </div>
    </ClickSpark>
  );
};
