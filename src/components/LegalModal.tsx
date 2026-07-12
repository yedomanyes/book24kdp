
type LegalPage = 'impressum' | 'datenschutz' | 'terms' | 'privacy' | null;

interface LegalModalProps {
  page: LegalPage;
  onClose: () => void;
  theme: 'dark' | 'light';
}

const s = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(8px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  modal: (dark: boolean) => ({
    background: dark ? '#111' : '#fff',
    border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.1)',
    borderRadius: '16px',
    maxWidth: '760px',
    width: '100%',
    maxHeight: '85vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
  }),
  header: (dark: boolean) => ({
    padding: '24px 32px',
    borderBottom: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  }),
  title: (dark: boolean) => ({
    fontSize: '20px',
    fontWeight: 700,
    color: dark ? '#fff' : '#111',
    margin: 0,
  }),
  closeBtn: (dark: boolean) => ({
    background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    border: 'none',
    borderRadius: '8px',
    width: '36px',
    height: '36px',
    cursor: 'pointer',
    fontSize: '18px',
    color: dark ? '#aaa' : '#555',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
  body: (dark: boolean) => ({
    padding: '32px',
    overflowY: 'auto' as const,
    flex: 1,
    color: dark ? '#ccc' : '#444',
    fontSize: '14px',
    lineHeight: '1.8',
  }),
  h2: (dark: boolean) => ({
    fontSize: '16px',
    fontWeight: 700,
    color: dark ? '#fff' : '#111',
    marginTop: '28px',
    marginBottom: '8px',
  }),
  p: { margin: '0 0 12px' },
  warn: (dark: boolean) => ({
    background: dark ? 'rgba(234,179,8,0.1)' : 'rgba(234,179,8,0.08)',
    border: '1px solid rgba(234,179,8,0.3)',
    borderRadius: '8px',
    padding: '12px 16px',
    color: dark ? '#fcd34d' : '#92400e',
    fontSize: '13px',
    marginBottom: '16px',
  }),
};

function ImpressumContent({ dark }: { dark: boolean }) {
  return (
    <>
      <p style={s.p}>Information pursuant to Section 5 of the German Digital Services Act (DDG).</p>

      <h2 style={s.h2(dark)}>Service provider</h2>
      <p style={s.p}>
        Yigit Güner<br />
        Silcherstraße 12<br />
        74405 Gaildorf<br />
        Germany<br />
        E-mail: support@book24.studio
      </p>

      <h2 style={s.h2(dark)}>Editorial responsibility</h2>
      <p style={s.p}>Responsible for the content of this website: Yigit Güner, address as stated above.</p>

      <h2 style={s.h2(dark)}>Disclaimer</h2>
      <p style={s.p}>
        We have carefully reviewed the content of this website. However, we cannot accept liability
        for the content of external links. The operators of linked pages are solely responsible for their content.
      </p>

      <h2 style={s.h2(dark)}>No professional advice</h2>
      <p style={s.p}>
        Information and AI-generated content provided through BookLab Studio do not constitute legal,
        tax, financial, or other professional advice. Please consult a qualified professional for individual questions.
      </p>

      <h2 style={s.h2(dark)}>Copyright and AI-generated content</h2>
      <p style={s.p}>
        BookLab Studio is an AI-assisted book creation tool. We do not guarantee that generated content
        is free from third-party copyright or other intellectual-property claims. Users are responsible for reviewing
        and checking generated content before using or publishing it.
      </p>
    </>
  );
}

function DatenschutzContent({ dark }: { dark: boolean }) {
  return (
    <>
      <p style={s.p}>
        Protecting your personal data matters to us. This privacy notice explains what personal data we process,
        why we process it, and how you can exercise your rights when using BookLab Studio.
      </p>

      <h2 style={s.h2(dark)}>Controller</h2>
      <p style={s.p}>Yigit Güner, Silcherstraße 12, 74405 Gaildorf, Germany · support@book24.studio</p>

      <h2 style={s.h2(dark)}>Data we process</h2>
      <p style={s.p}>
        We process data required to operate the service, including your email address, account and license information,
        generated book data, waitlist submissions, and standard technical data such as IP address and browser information.
      </p>

      <h2 style={s.h2(dark)}>Purpose of processing</h2>
      <p style={s.p}>
        We use data to provide and secure the platform, manage accounts and licenses, store and synchronize books,
        respond to support requests, maintain the waitlist, and improve the service.
      </p>

      <h2 style={s.h2(dark)}>Retention</h2>
      <p style={s.p}>
        We retain data for as long as your account is active or as required by applicable legal obligations.
        You may request deletion of your account and associated data by contacting support@book24.studio.
      </p>

      <h2 style={s.h2(dark)}>Service providers</h2>
      <p style={s.p}>
        We use Supabase for database and authentication services, Google Firebase where applicable for authentication,
        Vercel for hosting, Google Gemini for AI generation, and Gumroad for payments. Each provider processes data
        according to its own privacy documentation and applicable data-processing terms.
      </p>

      <h2 style={s.h2(dark)}>Your GDPR rights</h2>
      <p style={s.p}>
        Subject to applicable law, you may request access, correction, deletion, restriction, or portability of your data,
        and you may object to certain processing. Contact: support@book24.studio.
      </p>

      <h2 style={s.h2(dark)}>Cookies and local storage</h2>
      <p style={s.p}>
        We use technically necessary browser storage, including localStorage, for sessions, preferences, and cookie-consent
        status. We do not intentionally use tracking cookies on this landing page.
      </p>
    </>
  );
}

function TermsContent({ dark }: { dark: boolean }) {
  return (
    <>
      <div style={s.warn(dark)}>
        By using BookLab Studio, you agree to these Terms of Service. Please read them carefully.
      </div>

      <h2 style={s.h2(dark)}>1. Service scope</h2>
      <p style={s.p}>
        BookLab Studio is an AI-assisted platform for researching, structuring, generating, editing, and formatting
        book content for Amazon KDP and similar publishing platforms. The service is provided on an “as is” and
        “as available” basis without a guarantee of uninterrupted availability or error-free operation.
      </p>

      <h2 style={s.h2(dark)}>2. User responsibility and intellectual property</h2>
      <p style={s.p}>
        AI-generated text, images, layouts, and metadata must be reviewed by the user before publication. We make no
        guarantee that generated content is free from copyright, plagiarism, trademark, or other third-party claims.
        The user is responsible for the legality, accuracy, originality, and publication of all exported content.
      </p>

      <h2 style={s.h2(dark)}>3. Platform policies and bans</h2>
      <p style={s.p}>
        BookLab Studio is not responsible for warnings, suspensions, bans, legal actions, or other measures imposed by
        Amazon KDP, another distribution platform, a government authority, or a third party in connection with content
        created or published using the service.
      </p>

      <h2 style={s.h2(dark)}>4. Acceptable use</h2>
      <p style={s.p}>
        You may use the platform only for lawful purposes. You must not use it to create content that violates applicable
        law, infringes third-party rights, defames others, or attempts to circumvent platform or provider restrictions.
      </p>

      <h2 style={s.h2(dark)}>5. No success guarantee</h2>
      <p style={s.p}>
        We do not guarantee the quality, marketability, sales performance, profitability, or acceptance of generated
        content by Amazon KDP or any other platform.
      </p>

      <h2 style={s.h2(dark)}>6. License keys and access</h2>
      <p style={s.p}>
        Access may require a valid license key. License keys may only be used according to the license terms presented
        at purchase. Refunds, access limits, and transfer rules are governed by the applicable purchase and license terms.
      </p>

      <h2 style={s.h2(dark)}>7. Changes</h2>
      <p style={s.p}>We may update these Terms of Service from time to time. Continued use after an update constitutes acceptance of the revised terms.</p>

      <h2 style={s.h2(dark)}>8. Governing law</h2>
      <p style={s.p}>German law applies, subject to mandatory consumer-protection provisions that may apply in your country of residence.</p>
    </>
  );
}

function PrivacyContent({ dark }: { dark: boolean }) {
  return (
    <>
      <p style={s.p}>This Privacy Policy explains how BookLab Studio (“we”, “our”, “us”) collects, uses, and protects your personal data.</p>
      <h2 style={s.h2(dark)}>1. Data we collect</h2>
      <p style={s.p}>We collect only what is necessary to operate the platform: email address, account creation date, generated book data, license information, and standard technical data such as IP address and browser type.</p>
      <h2 style={s.h2(dark)}>2. How we use your data</h2>
      <p style={s.p}>We use your data to operate the platform, manage accounts and licenses, provide support, and improve the service. We do not sell personal data to third parties.</p>
      <h2 style={s.h2(dark)}>3. Third-party services</h2>
      <p style={s.p}>We use Supabase, Google Firebase, Vercel, Google Gemini, and Gumroad. Each provider processes data according to its own privacy documentation.</p>
      <h2 style={s.h2(dark)}>4. AI-generated content</h2>
      <p style={s.p}>Generated content is produced by third-party AI models. We make no warranty that it is free from copyright claims, plagiarism, or other intellectual-property issues.</p>
      <h2 style={s.h2(dark)}>5. Platform bans</h2>
      <p style={s.p}>Users are responsible for compliance with Amazon KDP policies, applicable laws, and the rules of any distribution platform they use.</p>
      <h2 style={s.h2(dark)}>6. Data retention and deletion</h2>
      <p style={s.p}>We retain data while your account is active or as legally required. Contact support@book24.studio to request deletion.</p>
      <h2 style={s.h2(dark)}>7. Your GDPR rights</h2>
      <p style={s.p}>EU/EEA users may request access, correction, deletion, restriction, or objection to processing. Contact: support@book24.studio.</p>
      <h2 style={s.h2(dark)}>8. Security</h2>
      <p style={s.p}>We use reasonable technical and organizational measures to protect your data. No internet transmission can be guaranteed completely secure.</p>
      <h2 style={s.h2(dark)}>9. Updates</h2>
      <p style={s.p}>We may update this policy periodically. The current version is displayed in this modal.</p>
    </>
  );
}

export function LegalModal({ page, onClose, theme }: LegalModalProps) {
  if (!page) return null;
  const dark = theme === 'dark';
  const titles: Record<NonNullable<LegalPage>, string> = {
    impressum: 'Legal Notice',
    datenschutz: 'Privacy Notice',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
  };

  return (
    <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={s.modal(dark)}>
        <div style={s.header(dark)}>
          <h2 style={s.title(dark)}>{titles[page]}</h2>
          <button aria-label="Close" style={s.closeBtn(dark)} onClick={onClose}>✕</button>
        </div>
        <div style={s.body(dark)}>
          {page === 'impressum' && <ImpressumContent dark={dark} />}
          {page === 'datenschutz' && <DatenschutzContent dark={dark} />}
          {page === 'terms' && <TermsContent dark={dark} />}
          {page === 'privacy' && <PrivacyContent dark={dark} />}
        </div>
      </div>
    </div>
  );
}

interface LegalDocumentPageProps {
  page: Exclude<LegalPage, null>;
  onBack: () => void;
  onNavigate: (page: Exclude<LegalPage, null>) => void;
  theme: 'dark' | 'light';
}

export function LegalDocumentPage({ page, onBack, onNavigate, theme }: LegalDocumentPageProps) {
  const dark = theme === 'dark';
  const titles: Record<Exclude<LegalPage, null>, string> = {
    impressum: 'Legal Notice',
    datenschutz: 'Privacy Notice',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
  };
  const navigationItems: Array<{ page: Exclude<LegalPage, null>; label: string }> = [
    { page: 'impressum', label: 'Legal Notice' },
    { page: 'datenschutz', label: 'Privacy Notice' },
    { page: 'privacy', label: 'Privacy Policy' },
    { page: 'terms', label: 'Terms of Service' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: dark ? '#0a0a0a' : '#f8f9fa',
      color: dark ? '#fff' : '#111827',
      padding: '48px 24px 72px',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          marginBottom: '36px',
          minHeight: '44px'
        }}>
          {/* Row for standalone Back Button */}
          <button
            type="button"
            onClick={onBack}
            style={{
              position: 'absolute',
              left: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
              border: 'none',
              color: dark ? '#cbd5e1' : '#475569',
              borderRadius: '9px',
              padding: '9px 16px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'}
          >
            ← Home
          </button>

          {/* Row for Centered Navbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexWrap: 'wrap',
              padding: '6px',
              borderRadius: '14px',
              background: dark ? 'rgba(255,255,255,0.055)' : 'rgba(15,23,42,0.055)',
              border: dark ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(15,23,42,0.1)',
            }}
          >
            {navigationItems.map((item) => {
              const active = item.page === page;
              return (
                <button
                  key={item.page}
                  type="button"
                  onClick={() => onNavigate(item.page)}
                  style={{
                    background: active ? (dark ? '#ffffff' : '#111827') : 'transparent',
                    border: 'none',
                    color: active ? (dark ? '#111827' : '#ffffff') : (dark ? '#aeb9cf' : '#64748b'),
                    borderRadius: '9px',
                    padding: '9px 11px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: active ? 800 : 650,
                    whiteSpace: 'nowrap',
                    transition: 'background 0.2s ease, color 0.2s ease',
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <article style={{
          background: dark ? 'rgba(255,255,255,0.035)' : '#fff',
          border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
          borderRadius: '20px',
          padding: 'clamp(24px, 5vw, 56px)',
          boxShadow: dark ? '0 24px 80px rgba(0,0,0,0.28)' : '0 20px 60px rgba(15,23,42,0.08)',
        }}>
          <h1 style={{
            margin: '0 0 32px',
            fontSize: 'clamp(32px, 6vw, 58px)',
            lineHeight: 1.05,
            letterSpacing: '-0.05em',
            fontWeight: 900,
            color: dark ? '#fff' : '#111827',
          }}>{titles[page]}</h1>
          <div style={s.body(dark)}>
            {page === 'impressum' && <ImpressumContent dark={dark} />}
            {page === 'datenschutz' && <DatenschutzContent dark={dark} />}
            {page === 'terms' && <TermsContent dark={dark} />}
            {page === 'privacy' && <PrivacyContent dark={dark} />}
          </div>
        </article>

        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'block',
            margin: '28px auto 0',
            background: 'transparent',
            border: 'none',
            color: dark ? '#9ca3af' : '#6b7280',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 700,
          }}
        >
          ← Back to home
        </button>
      </div>
    </div>
  );
}

export type { LegalPage };
