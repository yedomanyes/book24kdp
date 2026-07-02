

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
      <p style={s.p}>Angaben gemäß § 5 TMG</p>

      <h2 style={s.h2(dark)}>Anbieter</h2>
      <p style={s.p}>
        Book24 Studio<br />
        E-Mail: support@book24.studio
      </p>

      <h2 style={s.h2(dark)}>Haftungsausschluss</h2>
      <p style={s.p}>
        Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte
        externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber
        verantwortlich.
      </p>

      <h2 style={s.h2(dark)}>Keine Rechtsberatung</h2>
      <p style={s.p}>
        Die auf dieser Plattform bereitgestellten Informationen und KI-generierten Inhalte stellen
        keine Rechts-, Steuer- oder sonstige professionelle Beratung dar. Für individuelle Fragen
        empfehlen wir die Konsultation eines qualifizierten Fachmanns.
      </p>

      <h2 style={s.h2(dark)}>Urheberrecht</h2>
      <p style={s.p}>
        Book24 Studio ist ein KI-gestütztes Werkzeug zur Buchgenerierung. Wir übernehmen
        ausdrücklich keine Garantie dafür, dass die generierten Inhalte urheberrechtsfrei sind.
        Die Verantwortung für die Prüfung und Einhaltung von Urheberrechten liegt vollständig
        beim Nutzer.
      </p>
    </>
  );
}

function DatenschutzContent({ dark }: { dark: boolean }) {
  return (
    <>
      <p style={s.p}>
        Der Schutz Ihrer persönlichen Daten ist uns wichtig. Diese Datenschutzerklärung informiert
        Sie über Art, Umfang und Zweck der Verarbeitung personenbezogener Daten auf unserer Plattform.
      </p>

      <h2 style={s.h2(dark)}>Verantwortliche Stelle</h2>
      <p style={s.p}>Book24 Studio · support@book24.studio</p>

      <h2 style={s.h2(dark)}>Erhobene Daten</h2>
      <p style={s.p}>
        Wir erfassen nur die für den Betrieb notwendigen Daten:
        E-Mail-Adresse, Anmeldedatum, generierte Buchdaten sowie technische Nutzungsdaten (IP, Browser).
      </p>

      <h2 style={s.h2(dark)}>Zweck der Verarbeitung</h2>
      <p style={s.p}>
        Ihre Daten werden ausschließlich zur Bereitstellung und Verbesserung der Plattform,
        zur Accountverwaltung sowie zur Kommunikation bei Support-Anfragen verwendet.
      </p>

      <h2 style={s.h2(dark)}>Speicherdauer</h2>
      <p style={s.p}>
        Daten werden so lange gespeichert, wie Ihr Account aktiv ist oder es zur Erfüllung
        rechtlicher Pflichten erforderlich ist.
      </p>

      <h2 style={s.h2(dark)}>Drittanbieter</h2>
      <p style={s.p}>
        Wir nutzen Supabase (Datenbankhosting), Google Firebase Authentication sowie
        Vercel (Hosting). Diese Anbieter verarbeiten Daten gemäß ihrer eigenen Datenschutzrichtlinien.
        Die KI-Generierung erfolgt über die Google Gemini API.
      </p>

      <h2 style={s.h2(dark)}>Ihre Rechte</h2>
      <p style={s.p}>
        Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung
        Ihrer Daten. Wenden Sie sich dazu an: support@book24.studio
      </p>

      <h2 style={s.h2(dark)}>Cookies</h2>
      <p style={s.p}>
        Wir verwenden technisch notwendige Cookies und lokalen Browserspeicher (localStorage)
        zur Sitzungsverwaltung und Einstellungsspeicherung. Tracking-Cookies werden nicht eingesetzt.
      </p>
    </>
  );
}

function TermsContent({ dark }: { dark: boolean }) {
  return (
    <>
      <div style={s.warn(dark)}>
        ⚠️ Durch die Nutzung von Book24 Studio stimmen Sie diesen Nutzungsbedingungen zu.
        Bitte lesen Sie diese sorgfältig durch.
      </div>

      <h2 style={s.h2(dark)}>1. Leistungsumfang</h2>
      <p style={s.p}>
        Book24 Studio ist eine KI-gestützte Plattform zur automatisierten Erstellung von
        Buchinhalten für Amazon KDP und ähnliche Plattformen. Die Plattform wird "wie sie ist"
        bereitgestellt, ohne Gewährleistung der ununterbrochenen Verfügbarkeit oder Fehlerfreiheit.
      </p>

      <h2 style={s.h2(dark)}>2. Haftungsausschluss — Urheberrecht</h2>
      <p style={s.p}>
        Book24 Studio generiert Inhalte mittels KI-Technologie. Wir übernehmen <strong>keinerlei
        Garantie oder Haftung</strong> dafür, dass die generierten Inhalte (Texte, Bilder, Layouts)
        vollständig frei von Urheberrechten Dritter sind. Die vollständige Verantwortung für
        die Prüfung, Nutzung und Veröffentlichung der generierten Inhalte liegt beim Nutzer.
      </p>

      <h2 style={s.h2(dark)}>3. Haftungsausschluss — Plattform-Sanktionen</h2>
      <p style={s.p}>
        Book24 Studio trägt keine Verantwortung und haftet nicht für Maßnahmen Dritter gegen
        den Nutzer, einschließlich — aber nicht beschränkt auf — Sperrungen, Verwarnungen,
        Banns oder rechtliche Schritte durch Amazon KDP, andere Vertriebsplattformen, Behörden
        oder Dritte. Dies gilt auch für Maßnahmen, die sich aus der Nutzung der über unsere
        Plattform generierten Inhalte ergeben.
      </p>

      <h2 style={s.h2(dark)}>4. Nutzerpflichten</h2>
      <p style={s.p}>
        Der Nutzer verpflichtet sich, die Plattform ausschließlich für rechtmäßige Zwecke zu
        nutzen. Es ist verboten, die Plattform zur Erstellung von Inhalten zu verwenden, die
        gegen geltendes Recht verstoßen, andere Personen verleumden oder in Rechte Dritter eingreifen.
      </p>

      <h2 style={s.h2(dark)}>5. Keine Erfolgsgarantie</h2>
      <p style={s.p}>
        Wir geben keine Garantie hinsichtlich der Qualität, Marktfähigkeit, Verkaufserfolge
        oder Veröffentlichbarkeit der generierten Inhalte auf externen Plattformen.
      </p>

      <h2 style={s.h2(dark)}>6. Lizenzschlüssel & Zugang</h2>
      <p style={s.p}>
        Der Zugang zur Plattform erfordert einen gültigen Lizenzschlüssel. Lizenzschlüssel
        sind nicht übertragbar und dürfen nur auf dem Account des ursprünglichen Käufers verwendet
        werden. Eine Rückerstattung nach Einlösung des Schlüssels ist ausgeschlossen.
      </p>

      <h2 style={s.h2(dark)}>7. Änderungen der Nutzungsbedingungen</h2>
      <p style={s.p}>
        Wir behalten uns vor, diese Nutzungsbedingungen jederzeit zu ändern. Fortgesetzte
        Nutzung der Plattform nach einer Änderung gilt als Zustimmung.
      </p>

      <h2 style={s.h2(dark)}>8. Anwendbares Recht</h2>
      <p style={s.p}>
        Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist, soweit gesetzlich
        zulässig, der Sitz des Anbieters.
      </p>
    </>
  );
}

function PrivacyContent({ dark }: { dark: boolean }) {
  return (
    <>
      <p style={s.p}>
        This Privacy Policy explains how Book24 Studio ("we", "our", "us") collects, uses,
        and protects your personal data when you use our platform.
      </p>

      <h2 style={s.h2(dark)}>1. Data We Collect</h2>
      <p style={s.p}>
        We collect only what is necessary to operate the platform: email address, account creation date,
        generated book data, license key information, and standard technical data (IP address, browser type).
      </p>

      <h2 style={s.h2(dark)}>2. How We Use Your Data</h2>
      <p style={s.p}>
        Your data is used exclusively to: provide and operate the platform, manage your account,
        validate license keys, communicate with you regarding support, and improve our services.
        We do not sell your personal data to third parties.
      </p>

      <h2 style={s.h2(dark)}>3. Third-Party Services</h2>
      <p style={s.p}>
        We use the following third-party services: Supabase (database & auth),
        Google Firebase (authentication), Vercel (hosting), Google Gemini API (AI generation),
        and Gumroad (payments). Each provider processes data according to their own privacy policy.
      </p>

      <h2 style={s.h2(dark)}>4. AI-Generated Content Disclaimer</h2>
      <p style={s.p}>
        Content generated through our AI tools is produced by third-party AI models (Google Gemini).
        We make <strong>no warranty</strong> that generated content is free from copyright claims,
        plagiarism, or other intellectual property issues. Users are solely responsible for reviewing
        and verifying generated content before publication.
      </p>

      <h2 style={s.h2(dark)}>5. No Liability for Platform Bans</h2>
      <p style={s.p}>
        Book24 Studio is not responsible for any bans, account suspensions, legal actions, or
        penalties imposed by Amazon KDP, any distribution platform, government authority, or third
        party as a result of content generated using our platform. Users accept full responsibility
        for compliance with all applicable platform policies and laws.
      </p>

      <h2 style={s.h2(dark)}>6. Data Retention</h2>
      <p style={s.p}>
        We retain your data for as long as your account is active or as required to comply with
        legal obligations. You may request deletion of your account and associated data at any time
        by contacting support@book24.studio.
      </p>

      <h2 style={s.h2(dark)}>7. Your Rights (GDPR)</h2>
      <p style={s.p}>
        If you are located in the EU/EEA, you have the right to access, correct, delete, restrict,
        or object to the processing of your personal data. Contact: support@book24.studio
      </p>

      <h2 style={s.h2(dark)}>8. Security</h2>
      <p style={s.p}>
        We implement reasonable technical and organizational measures to protect your data.
        However, no internet transmission is completely secure, and we cannot guarantee absolute security.
      </p>

      <h2 style={s.h2(dark)}>9. Changes to This Policy</h2>
      <p style={s.p}>
        We may update this Privacy Policy periodically. Continued use of the platform after changes
        constitutes acceptance of the updated policy. Last updated: July 2025.
      </p>
    </>
  );
}

export function LegalModal({ page, onClose, theme }: LegalModalProps) {
  if (!page) return null;
  const dark = theme === 'dark';

  const titles: Record<NonNullable<LegalPage>, string> = {
    impressum: 'Impressum',
    datenschutz: 'Datenschutzerklärung',
    terms: 'Nutzungsbedingungen (AGB)',
    privacy: 'Privacy Policy',
  };

  return (
    <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={s.modal(dark)}>
        <div style={s.header(dark)}>
          <h2 style={s.title(dark)}>{titles[page]}</h2>
          <button style={s.closeBtn(dark)} onClick={onClose}>✕</button>
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

export type { LegalPage };
