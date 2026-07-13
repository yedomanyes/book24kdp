import React, { useMemo, useState } from 'react';
import { BarChart3, Check, Copy, Link2, LockKeyhole, MousePointerClick, Users, WalletCards } from 'lucide-react';

interface AffiliateDashboardProps {
  currentUser?: { email?: string | null } | null;
  language: 'de' | 'en';
}

const cleanSlug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32);

export const AffiliateDashboard: React.FC<AffiliateDashboardProps> = ({ currentUser, language }) => {
  const isDe = language === 'de';
  const suggestedSlug = useMemo(() => cleanSlug((currentUser?.email || '').split('@')[0]) || 'publisher', [currentUser?.email]);
  const storageKey = `booklab-affiliate-code:${currentUser?.email || 'publisher'}`;
  const [savedSlug, setSavedSlug] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(storageKey);
  });
  const [draftSlug, setDraftSlug] = useState(suggestedSlug);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const confirmedBuyers = 0;
  const clicks = 0;
  const conversion = 0;
  const affiliateSlug = savedSlug || cleanSlug(draftSlug) || suggestedSlug;
  const referralLink = `${window.location.origin}/?ref=${affiliateSlug}`;
  const currentTier = confirmedBuyers >= 10 ? '50%' : '30%';
  const progress = Math.min(confirmedBuyers / 10, 1) * 100;

  const saveCode = () => {
    const next = cleanSlug(draftSlug);
    if (next.length < 3) {
      setError(isDe ? 'Bitte mindestens 3 Zeichen verwenden.' : 'Use at least 3 characters.');
      return;
    }
    window.localStorage.setItem(storageKey, next);
    setSavedSlug(next);
    setError('');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="affiliate-workspace-page">
      <div className="affiliate-workspace-inner">
        <header className="affiliate-workspace-header">
          <div>
            <h1>Affiliate Center</h1>
          </div>
          <div className="affiliate-current-rate">
            <div className="affiliate-rate-ring"><span>{currentTier}</span></div>
            <div className="affiliate-rate-copy">
              <span>{isDe ? 'Aktuelle Provision' : 'Current commission'}</span>
              <strong>{isDe ? 'Starter-Stufe' : 'Starter tier'}</strong>
              <small>{isDe ? '50% ab 10 Käufern' : '50% after 10 buyers'}</small>
            </div>
          </div>
        </header>

        <section className="affiliate-setup-panel">
          <div className="affiliate-setup-copy">
            <span className="affiliate-panel-kicker">01 / {isDe ? 'EINRICHTUNG' : 'SETUP'}</span>
            <h2>{isDe ? 'Dein persönlicher Affiliate-Code' : 'Your personal affiliate code'}</h2>
            <p>{isDe ? 'Wähle den Namen, der in deinem Referral-Link angezeigt wird. Du kannst ihn nur einmal festlegen.' : 'Choose the name shown in your referral link. You can set it only once.'}</p>
          </div>
          {!savedSlug ? (
            <div className="affiliate-code-form">
              <label htmlFor="affiliate-code">{isDe ? 'Affiliate-Code' : 'Affiliate code'}</label>
              <div className="affiliate-code-input-row">
                <span className="affiliate-code-prefix">ref=</span>
                <input id="affiliate-code" value={draftSlug} onChange={(event) => setDraftSlug(cleanSlug(event.target.value))} placeholder={suggestedSlug} maxLength={32} />
                <button type="button" onClick={saveCode}>{isDe ? 'Code festlegen' : 'Set code'}</button>
              </div>
              <span className="affiliate-suggestion">{isDe ? `Vorgeschlagen: ${suggestedSlug}` : `Suggested: ${suggestedSlug}`}</span>
              {error && <span className="affiliate-form-error">{error}</span>}
            </div>
          ) : (
            <div className="affiliate-code-locked">
              <div><LockKeyhole size={14} /><span>{isDe ? 'Dein Code' : 'Your code'}</span><strong>{savedSlug}</strong></div>
              <small>{isDe ? 'Einmalig festgelegt' : 'Set once and locked'}</small>
            </div>
          )}
        </section>

        <section className="affiliate-link-panel">
          <div className="affiliate-panel-label"><Link2 size={14} /> {isDe ? 'Dein Referral-Link' : 'Your referral link'}</div>
          <div className="affiliate-link-field"><span>{referralLink}</span><button type="button" onClick={handleCopy}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? (isDe ? 'Kopiert' : 'Copied') : (isDe ? 'Kopieren' : 'Copy')}</button></div>
          <p className="affiliate-panel-note">{isDe ? 'Teile diesen Link in deinen Videos, Posts oder deiner Community.' : 'Share this link in your videos, posts, or community.'}</p>
        </section>

        <section className="affiliate-metrics-grid">
          <div className="affiliate-stat-panel"><div className="affiliate-panel-label"><Users size={14} /> {isDe ? 'Bestätigte Käufer' : 'Confirmed buyers'}</div><strong>{confirmedBuyers}</strong><span>{isDe ? 'Noch keine Käufe' : 'No purchases yet'}</span></div>
          <div className="affiliate-stat-panel"><div className="affiliate-panel-label"><MousePointerClick size={14} /> {isDe ? 'Link-Klicks' : 'Link clicks'}</div><strong>{clicks}</strong><span>{isDe ? 'Letzte 30 Tage' : 'Last 30 days'}</span></div>
          <div className="affiliate-stat-panel"><div className="affiliate-panel-label"><WalletCards size={14} /> {isDe ? 'Offene Provision' : 'Pending commission'}</div><strong>$0.00</strong><span>{isDe ? 'Nach Rückerstattungsfrist' : 'After refund window'}</span></div>
          <div className="affiliate-stat-panel affiliate-conversion-panel"><div className="affiliate-panel-label"><BarChart3 size={14} /> {isDe ? 'Conversion Rate' : 'Conversion rate'}</div><div className="affiliate-donut" style={{ '--value': `${conversion}%` } as React.CSSProperties}><b>{conversion}%</b></div><span>{isDe ? 'Klicks zu Käufern' : 'Clicks to buyers'}</span></div>
        </section>

        <section className="affiliate-analytics-grid">
          <div className="affiliate-chart-panel">
            <div className="affiliate-section-heading">
              <div><h2>{isDe ? 'Performance' : 'Performance'}</h2><p>{isDe ? 'Klicks und bestätigte Käufe der letzten 7 Tage.' : 'Clicks and confirmed purchases over the last 7 days.'}</p></div>
              <span className="affiliate-chart-period">7 TAGE</span>
            </div>
            <div className="affiliate-chart-legend"><span><i className="affiliate-legend-clicks" />{isDe ? 'Klicks' : 'Clicks'}</span><span><i className="affiliate-legend-buyers" />{isDe ? 'Käufer' : 'Buyers'}</span></div>
            <div className="affiliate-empty-chart">
              <svg className="affiliate-chart-svg" viewBox="0 0 720 180" role="img" aria-label={isDe ? 'Affiliate Performance Chart' : 'Affiliate performance chart'}>
                <line x1="16" y1="24" x2="704" y2="24" /><line x1="16" y1="68" x2="704" y2="68" /><line x1="16" y1="112" x2="704" y2="112" /><line x1="16" y1="156" x2="704" y2="156" />
                <path className="affiliate-chart-baseline" d="M16 156 L704 156" />
              </svg>
              <div className="affiliate-chart-labels"><span>Mo</span><span>Di</span><span>Mi</span><span>Do</span><span>Fr</span><span>Sa</span><span>So</span></div>
              <em>{isDe ? 'Deine ersten Daten erscheinen hier.' : 'Your first data will appear here.'}</em>
            </div>
          </div>
          <div className="affiliate-tier-panel"><div className="affiliate-section-heading"><div><h2>{isDe ? 'Provisionen' : 'Commission tiers'}</h2><p>{isDe ? 'Dein Fortschritt zur nächsten Stufe.' : 'Your progress to the next tier.'}</p></div><span>{confirmedBuyers} / 10</span></div><div className="affiliate-progress-track"><div style={{ width: `${progress}%` }} /></div><div className="affiliate-tier-row active"><div><b>30%</b><span>{isDe ? 'Start-Provision' : 'Starting commission'}</span></div><em>{isDe ? 'Aktiv' : 'Active'}</em></div><div className="affiliate-tier-row"><div><b>50%</b><span>{isDe ? 'Ab 10 Käufern' : 'After 10 buyers'}</span></div><em>{confirmedBuyers >= 10 ? (isDe ? 'Freigeschaltet' : 'Unlocked') : (isDe ? 'Noch gesperrt' : 'Locked')}</em></div></div>
        </section>
        <p className="affiliate-legal-note">{isDe ? 'Auszahlungen erfolgen nach Ablauf der Rückerstattungsfrist. Bitte kennzeichne Affiliate-Links transparent.' : 'Payouts are released after the refund window. Please disclose affiliate links transparently.'}</p>
      </div>
    </main>
  );
};
