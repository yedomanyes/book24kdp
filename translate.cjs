const fs = require('fs');

const file = 'src/components/LandingPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Insert isDe declaration right after LandingPageProps
content = content.replace(
  'export default function LandingPage({ onLoginClick, userHasValidLicense }: LandingPageProps) {',
  `export default function LandingPage({ onLoginClick, userHasValidLicense }: LandingPageProps) {\n  const isDe = typeof navigator !== 'undefined' ? navigator.language.startsWith('de') : true;`
);

// We also need isDe outside for ROADMAP_PHASES and FAQS, actually it's better to pass isDe to them or just move them inside the component!
// Let's move FAQS and ROADMAP_PHASES into the component or make them functions.
// Let's make them functions!
content = content.replace(
  `const ROADMAP_PHASES = [`,
  `const getRoadmapPhases = (isDe: boolean) => [`
);
content = content.replace(
  `const FAQS = [`,
  `const getFaqs = (isDe: boolean) => [`
);

// We need to fix the syntax for the arrays that were converted to functions
content = content.replace(
  /active: false,\n  }\n\];/g,
  `active: false,\n  }\n];`
);

content = content.replace(
  /a: 'Nein\. Mit dem Studio-Pass sicherst du dir einen lebenslangen Zugang zu allen Kernfunktionen\. Keine Abos, keine versteckten Kosten\.'\n  }\n\];/g,
  `a: isDe ? 'Nein. Mit dem Studio-Pass sicherst du dir einen lebenslangen Zugang zu allen Kernfunktionen. Keine Abos, keine versteckten Kosten.' : 'No. The Studio Pass gives you lifetime access to all core features. No subscriptions, no hidden costs.'\n  }\n];`
);

// Now the actual strings.
const dict = {
  "'Aktuell'": "isDe ? 'Aktuell' : 'Current'",
  "'In Entwicklung'": "isDe ? 'In Entwicklung' : 'In Development'",
  "'Geplant'": "isDe ? 'Geplant' : 'Planned'",
  "'Vision'": "isDe ? 'Vision' : 'Vision'",
  
  "'Das Fundament: Hochwertige KI-Textgenerierung, Formatierung und KDP-Ready PDF-Exporte.'": "isDe ? 'Das Fundament: Hochwertige KI-Textgenerierung, Formatierung und KDP-Ready PDF-Exporte.' : 'The Foundation: High-quality AI text generation, formatting, and KDP-ready PDF exports.'",
  "'Komplexe Layout-Engines, Formatvorlagen und tiefe KDP-Nischenanalyse live.'": "isDe ? 'Komplexe Layout-Engines, Formatvorlagen und tiefe KDP-Nischenanalyse live.' : 'Complex layout engines, formatting templates, and deep KDP niche analysis live.'",
  "'Vollständige Automatisierung von Manuskript-Erstellung und Kapitel-Strukturierung.'": "isDe ? 'Vollständige Automatisierung von Manuskript-Erstellung und Kapitel-Strukturierung.' : 'Full automation of manuscript creation and chapter structuring.'",
  "'Multi-Language-Support für globale Märkte und fortgeschrittene Cover-Generierung.'": "isDe ? 'Multi-Language-Support für globale Märkte und fortgeschrittene Cover-Generierung.' : 'Multi-language support for global markets and advanced cover generation.'",
  "'Das ultimative System. Keine Grenzen. Wer jetzt einsteigt, hat all das bereits inklusive.'": "isDe ? 'Das ultimative System. Keine Grenzen. Wer jetzt einsteigt, hat all das bereits inklusive.' : 'The ultimate system. No limits. Those who join now have all of this included.'",

  "'Gehören mir die Rechte an den generierten Büchern?'": "isDe ? 'Gehören mir die Rechte an den generierten Büchern?' : 'Do I own the rights to the generated books?'",
  "'Ja. Alle generierten Inhalte, Texte und Layouts gehören zu 100% dir. Du kannst sie uneingeschränkt auf Amazon KDP oder anderen Plattformen unter deinem Namen veröffentlichen und monetarisieren.'": "isDe ? 'Ja. Alle generierten Inhalte, Texte und Layouts gehören zu 100% dir. Du kannst sie uneingeschränkt auf Amazon KDP oder anderen Plattformen unter deinem Namen veröffentlichen und monetarisieren.' : 'Yes. All generated content, text, and layouts belong 100% to you. You can publish and monetize them on Amazon KDP or other platforms under your name without restrictions.'",
  
  "'Wird der Preis in Zukunft steigen?'": "isDe ? 'Wird der Preis in Zukunft steigen?' : 'Will the price increase in the future?'",
  "'Ja! Wir entwickeln Book24 Studio kontinuierlich weiter. Mit jedem großen Update kommen neue, mächtige Funktionen hinzu. Daher wird der Preis des Produkts stetig steigen. Wer sich den Zugang jetzt sichert, erhält alle künftigen Erweiterungen kostenlos – ohne Aufpreis!'": "isDe ? 'Ja! Wir entwickeln Book24 Studio kontinuierlich weiter. Mit jedem großen Update kommen neue, mächtige Funktionen hinzu. Daher wird der Preis des Produkts stetig steigen. Wer sich den Zugang jetzt sichert, erhält alle künftigen Erweiterungen kostenlos – ohne Aufpreis!' : 'Yes! We are continuously developing Book24 Studio. With every major update, new powerful features are added. Therefore, the price of the product will steadily increase. Those who secure access now will receive all future expansions for free - at no extra cost!'",
  
  "'Benötige ich Vorkenntnisse im Buch-Layouting?'": "isDe ? 'Benötige ich Vorkenntnisse im Buch-Layouting?' : 'Do I need prior knowledge in book layouting?'",
  "'Nein, überhaupt nicht. Die Plattform übernimmt das komplette Design, die Ränder und die Schriftformatierung automatisch nach offiziellen Amazon KDP-Druckstandards (z.B. 6x9 Zoll Taschenbuchformat).'": "isDe ? 'Nein, überhaupt nicht. Die Plattform übernimmt das komplette Design, die Ränder und die Schriftformatierung automatisch nach offiziellen Amazon KDP-Druckstandards (z.B. 6x9 Zoll Taschenbuchformat).' : 'No, not at all. The platform automatically handles the complete design, margins, and font formatting according to official Amazon KDP print standards (e.g. 6x9 inches paperback format).'",
  
  "'Gibt es versteckte monatliche Gebühren?'": "isDe ? 'Gibt es versteckte monatliche Gebühren?' : 'Are there any hidden monthly fees?'",

  "ROADMAP_PHASES.map": "getRoadmapPhases(isDe).map",
  "FAQS.map": "getFaqs(isDe).map",
  
  "Jetzt Zugang Sichern": "{isDe ? 'Jetzt Zugang Sichern' : 'Secure Access Now'}",
  "Zum Studio": "{isDe ? 'Zum Studio' : 'Go to Studio'}",
  "Exklusiver Zugang": "{isDe ? 'Exklusiver Zugang' : 'Exclusive Access'}",
  "Generiere dein KDP-Buch in wenigen Minuten": "{isDe ? 'Generiere dein KDP-Buch in wenigen Minuten' : 'Generate your KDP book in minutes'}",
  "Die professionelle KI-Suite für Amazon KDP Publisher.": "{isDe ? 'Die professionelle KI-Suite für Amazon KDP Publisher.' : 'The professional AI suite for Amazon KDP Publishers.'}",
  "Egal ob Sachbuch oder Roman – generiere komplette Manuskripte": "{isDe ? 'Egal ob Sachbuch oder Roman – generiere komplette Manuskripte' : 'Whether non-fiction or fiction – generate complete manuscripts'}",
  "Zum Studio &rarr;": "{isDe ? 'Zum Studio &rarr;' : 'Go to Studio &rarr;'}",
  "Jetzt Kaufen &rarr;": "{isDe ? 'Jetzt Kaufen &rarr;' : 'Buy Now &rarr;'}",
  "Studio Vorschau": "{isDe ? 'Studio Vorschau' : 'Studio Preview'}",
  "Echte Ergebnisse. Echtes Layout.": "{isDe ? 'Echte Ergebnisse. Echtes Layout.' : 'Real Results. Real Layout.'}",
  "So sehen die exportierten KDP-Bücher aus unserem System aus.": "{isDe ? 'So sehen die exportierten KDP-Bücher aus unserem System aus.' : 'This is what the exported KDP books from our system look like.'}",
  "Das Team dahinter": "{isDe ? 'Das Team dahinter' : 'The team behind it'}",
  "Von KDP-Publishern für KDP-Publisher.": "{isDe ? 'Von KDP-Publishern für KDP-Publisher.' : 'By KDP Publishers for KDP Publishers.'}",
  "Die Masterplan Roadmap": "{isDe ? 'Die Masterplan Roadmap' : 'The Masterplan Roadmap'}",
  "Wir bauen das KDP Monopol.": "{isDe ? 'Wir bauen das KDP Monopol.' : 'We are building the KDP Monopoly.'}",
  "Häufig gestellte Fragen": "{isDe ? 'Häufig gestellte Fragen' : 'Frequently Asked Questions'}",
  "Alles was du wissen musst.": "{isDe ? 'Alles was du wissen musst.' : 'Everything you need to know.'}",
  "Bereit für dein erstes Buch?": "{isDe ? 'Bereit für dein erstes Buch?' : 'Ready for your first book?'}",
  "Der Zugang ist limitiert.": "{isDe ? 'Der Zugang ist limitiert.' : 'Access is limited.'}",
  "Erhalte das komplette Feature-Set": "{isDe ? 'Erhalte das komplette Feature-Set' : 'Get the complete feature set'}",
  "Lebenslanger Zugang (Einmalzahlung)": "{isDe ? 'Lebenslanger Zugang (Einmalzahlung)' : 'Lifetime Access (One-time payment)'}",
  "Kommerzielle Rechte an allen Büchern": "{isDe ? 'Kommerzielle Rechte an allen Büchern' : 'Commercial rights to all books'}",
  "Unbegrenzte KDP Nischen-Analysen": "{isDe ? 'Unbegrenzte KDP Nischen-Analysen' : 'Unlimited KDP Niche Analyses'}",
  "1-Klick KDP Print-Ready PDF Export": "{isDe ? '1-Klick KDP Print-Ready PDF Export' : '1-Click KDP Print-Ready PDF Export'}",
  "1-Klick ePub Export": "{isDe ? '1-Klick ePub Export' : '1-Click ePub Export'}",
  "Fortgeschrittener Layout & Design Editor": "{isDe ? 'Fortgeschrittener Layout & Design Editor' : 'Advanced Layout & Design Editor'}",
  "Alle kommenden Feature-Updates (Phase 2-5)": "{isDe ? 'Alle kommenden Feature-Updates (Phase 2-5)' : 'All upcoming feature updates (Phase 2-5)'}",
  "Jetzt kaufen": "{isDe ? 'Jetzt kaufen' : 'Buy now'}",
  "Bestehendes Login": "{isDe ? 'Bestehendes Login' : 'Existing Login'}",
  "Features, die den Unterschied machen.": "{isDe ? 'Features, die den Unterschied machen.' : 'Features that make the difference.'}",
  "Der unfaire Vorteil für KDP.": "{isDe ? 'Der unfaire Vorteil für KDP.' : 'The unfair advantage for KDP.'}",

  // Feature titles and descriptions
  "Tiefgehende Nischenanalyse": "{isDe ? 'Tiefgehende Nischenanalyse' : 'Deep Niche Analysis'}",
  "Finde in Sekunden profitable Nischen": "{isDe ? 'Finde in Sekunden profitable Nischen' : 'Find profitable niches in seconds'}",
  "Wir analysieren Suchvolumen, Konkurrenz und Trenderwartungen in Echtzeit.": "{isDe ? 'Wir analysieren Suchvolumen, Konkurrenz und Trenderwartungen in Echtzeit.' : 'We analyze search volume, competition, and trend expectations in real-time.'}",
  
  "1-Klick KDP Export": "{isDe ? '1-Klick KDP Export' : '1-Click KDP Export'}",
  "Perfekt formatierte PDFs für Amazon": "{isDe ? 'Perfekt formatierte PDFs für Amazon' : 'Perfectly formatted PDFs for Amazon'}",
  "Vergiss Word oder InDesign. Unser Export liefert 100% KDP-konforme PDFs inkl. Beschnitt und Rändern.": "{isDe ? 'Vergiss Word oder InDesign. Unser Export liefert 100% KDP-konforme PDFs inkl. Beschnitt und Rändern.' : 'Forget Word or InDesign. Our export delivers 100% KDP-compliant PDFs including bleed and margins.'}",
  
  "Pro-Level KI Engine": "{isDe ? 'Pro-Level KI Engine' : 'Pro-Level AI Engine'}",
  "Bessere Texte, weniger Aufwand": "{isDe ? 'Bessere Texte, weniger Aufwand' : 'Better text, less effort'}",
  "Unsere spezialisierte KI schreibt nicht nur, sie strukturiert und formatiert Bücher, die sich wie Bestseller lesen.": "{isDe ? 'Unsere spezialisierte KI schreibt nicht nur, sie strukturiert und formatiert Bücher, die sich wie Bestseller lesen.' : 'Our specialized AI doesn\\'t just write, it structures and formats books that read like bestsellers.'}"
};

for (const [key, value] of Object.entries(dict)) {
  // Use simple replace with global modifier for plain text (in JSX)
  if (key.includes("'")) {
    // Exact match for JS strings
    content = content.replace(new RegExp(key, 'g'), value);
  } else {
    // JSX Text replace
    content = content.replace(new RegExp(key, 'g'), value);
  }
}

// Special case for the 3 minutes text
content = content.replace(
  />\s*Aufgrund der enormen Nachfrage\s*<\//g,
  `>{isDe ? "Aufgrund der enormen Nachfrage" : "Due to huge demand"}</`
);

content = content.replace(
  />\s*Wir garantieren dir den vollen Zugang nur für die nächsten:\s*<\//g,
  `>{isDe ? "Wir garantieren dir den vollen Zugang nur für die nächsten:" : "We guarantee full access only for the next:"}</`
);

fs.writeFileSync(file, content);
console.log('Translated LandingPage.tsx');
