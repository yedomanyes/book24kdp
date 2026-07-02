import React from 'react';
import './LandingContentPreview.css';

export const LandingBadPagePreview: React.FC = () => (
  <div className="landing-mock-page landing-mock-bad">
    <p className="landing-mock-bad-heading"># Kapitel 3: Deep Work</p>
    <p className="landing-mock-bad-text">
      In diesem Kapitel werden wir über Deep Work sprechen. Deep Work ist ein wichtiges Konzept.
      Viele Menschen haben Probleme mit Ablenkungen. Hier sind einige Tipps: 1. Handy weg 2. Timer
      nutzen 3. Ruhigen Ort finden. Deep Work bedeutet konzentriertes Arbeiten ohne Unterbrechung.
      Studien zeigen dass Multitasking ineffizient ist. Zusammenfassend ist Deep Work sehr wichtig
      für Produktivität und sollte jeder ausprobieren!!!
    </p>
    <p className="landing-mock-bad-text">
      **Wichtig:** Achte auf deine Umgebung und eliminiere Ablenkungen wo möglich.
    </p>
    <p className="landing-mock-bad-meta">[Kein Layout · Kein Blocksatz · Keine Kapitelstruktur]</p>
  </div>
);

export const LandingBookPagePreview: React.FC = () => (
  <div className="landing-mock-page book-font-playfair">
    <div className="landing-mock-header">
      <span>Produktivität meistern</span>
    </div>
    <h4 className="landing-mock-chapter">Kapitel 3 · Deep Work</h4>
    <div className="landing-mock-body preview-content">
      <p className="literary-paragraph landing-mock-dropcap">
        <span className="drop-cap-letter">D</span>
        ie Kunst des Fokus beginnt nicht mit mehr Disziplin, sondern mit klaren
        Systemen. BookLab Studio strukturiert jedes Kapitel automatisch — von der
        Gliederung bis zum literarischen Fluss.
      </p>
      <p className="literary-paragraph">
        KI-generierte Absätze folgen professioneller Typografie: Blocksatz,
        Einzüge und Drop Caps — exakt wie in deinem Schreibstudio.
      </p>
      <div className="landing-mock-graphic">
        <div className="landing-mock-graphic-title">Fokus-Matrix</div>
        <div className="landing-mock-graphic-bars">
          <span style={{ width: '78%' }} />
          <span style={{ width: '62%' }} />
          <span style={{ width: '91%' }} />
        </div>
      </div>
    </div>
    <div className="landing-mock-footer">24</div>
  </div>
);

export const LandingTitlePagePreview: React.FC = () => (
  <div className="landing-mock-page landing-mock-title book-font-playfair">
    <div className="landing-mock-title-border landing-mock-title-border-outer" />
    <div className="landing-mock-title-border landing-mock-title-border-inner" />
    <div className="landing-mock-title-content">
      <div className="landing-mock-emblem">✦</div>
      <h3 className="landing-mock-book-title">Produktivität meistern</h3>
      <p className="landing-mock-book-subtitle">Der KDP-Leitfaden für skalierbare Bücher</p>
      <p className="landing-mock-book-author">von BookLab Studio</p>
      <div className="landing-mock-publisher">Veröffentlicht via Amazon KDP</div>
    </div>
  </div>
);
