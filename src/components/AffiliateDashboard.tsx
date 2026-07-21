import React, { useMemo, useState } from 'react';
import '../.affiliate-redesign.css';
import { Check, Copy, Link2, LockKeyhole, MousePointerClick, Users, WalletCards, Zap, TrendingUp } from 'lucide-react';

interface AffiliateDashboardProps {
  currentUser?: { email?: string | null } | null;
  language: 'de' | 'en';
}

const cleanSlug = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32);

export const AffiliateDashboard: React.FC<AffiliateDashboardProps> = ({ currentUser, language }) => {
  const isDe = language === 'de';
  const suggestedSlug = useMemo(
    () => cleanSlug((currentUser?.email || '').split('@')[0]) || 'publisher',
    [currentUser?.email],
  );
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
  const totalEarned = (confirmedBuyers * 80).toFixed(2);
  const affiliateSlug = savedSlug || cleanSlug(draftSlug) || suggestedSlug;
  const referralLink = `${window.location.origin}/?ref=${affiliateSlug}`;

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
    <main className="aff-page">
      {/* Hero Commission Banner */}
      <div className="aff-hero">
        <div className="aff-hero-glow" />
        <div className="aff-hero-inner">
          <div className="aff-hero-badge">
            <Zap size={14} />
            {isDe ? 'Partnerprogramm' : 'Partner Program'}
          </div>
          <h1 className="aff-hero-title">
            {isDe ? 'Verdiene ' : 'Earn '}
            <span className="aff-hero-amount">$80</span>
            {isDe ? ' pro Verkauf' : ' per sale'}
          </h1>
          <p className="aff-hero-sub">
            {isDe
              ? 'Eine klare Regel: $80 für jeden bestätigten Kauf über deinen Link. Ohne Mindestvolumen.'
              : 'One clear rule: $80 for every confirmed purchase through your link. No volume targets.'}
          </p>

          {/* Referral Link */}
          <div className="aff-link-row">
            <div className="aff-link-field">
              <Link2 size={14} className="aff-link-icon" />
              <span>{referralLink}</span>
            </div>
            <button type="button" className="aff-copy-btn" onClick={handleCopy}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? (isDe ? 'Kopiert!' : 'Copied!') : (isDe ? 'Link kopieren' : 'Copy link')}
            </button>
          </div>
        </div>
      </div>

      <div className="aff-body">
        {/* Stats Row */}
        <div className="aff-stats-row">
          <div className="aff-stat-card">
            <div className="aff-stat-icon aff-stat-icon--green"><Users size={16} /></div>
            <div className="aff-stat-value">{confirmedBuyers}</div>
            <div className="aff-stat-label">{isDe ? 'Bestätigte Käufer' : 'Confirmed buyers'}</div>
          </div>
          <div className="aff-stat-card">
            <div className="aff-stat-icon aff-stat-icon--blue"><MousePointerClick size={16} /></div>
            <div className="aff-stat-value">{clicks}</div>
            <div className="aff-stat-label">{isDe ? 'Link-Klicks' : 'Link clicks'}</div>
          </div>
          <div className="aff-stat-card">
            <div className="aff-stat-icon aff-stat-icon--cyan"><WalletCards size={16} /></div>
            <div className="aff-stat-value">${totalEarned}</div>
            <div className="aff-stat-label">{isDe ? 'Ausstehende Provision' : 'Pending commission'}</div>
          </div>
          <div className="aff-stat-card">
            <div className="aff-stat-icon aff-stat-icon--purple"><TrendingUp size={16} /></div>
            <div className="aff-stat-value">{confirmedBuyers > 0 ? Math.round((confirmedBuyers / Math.max(clicks, 1)) * 100) : 0}%</div>
            <div className="aff-stat-label">{isDe ? 'Conversion Rate' : 'Conversion rate'}</div>
          </div>
        </div>

        {/* Commission Info + Code Setup Row */}
        <div className="aff-two-col">
          {/* Commission Card */}
          <div className="aff-card">
            <div className="aff-card-head">
              <h2>{isDe ? 'Deine Provision' : 'Your Commission'}</h2>
              <p>{isDe ? 'Einheitlich für alle Partner.' : 'Same flat rate for all partners.'}</p>
            </div>
            <div className="aff-commission-display">
              <div className="aff-commission-amount">$80</div>
              <div className="aff-commission-label">{isDe ? 'Fixprovision pro Kauf' : 'Flat rate per purchase'}</div>
            </div>
            <div className="aff-commission-details">
              <div className="aff-detail-row">
                <span>{isDe ? 'Rückgaben' : 'Returns'}</span>
                <strong>{isDe ? 'Keine Rückerstattung' : 'No refunds'}</strong>
              </div>
              <div className="aff-detail-row">
                <span>{isDe ? 'Mindestbetrag' : 'Minimum payout'}</span>
                <strong>$0</strong>
              </div>
              <div className="aff-detail-row">
                <span>{isDe ? 'Zahlungsart' : 'Payment method'}</span>
                <strong>PayPal / Überweisung</strong>
              </div>
            </div>
          </div>

          {/* Code Setup Card */}
          <div className="aff-card">
            <div className="aff-card-head">
              <h2>{isDe ? 'Dein Affiliate-Code' : 'Your Affiliate Code'}</h2>
              <p>{isDe ? 'Dein persönlicher Referral-Link-Name.' : 'Your personal referral link name.'}</p>
            </div>
            {!savedSlug ? (
              <div className="aff-code-form">
                <label htmlFor="aff-code-input" className="aff-code-label">
                  {isDe ? 'Wähle deinen Code' : 'Choose your code'}
                </label>
                <div className="aff-code-input-wrap">
                  <span className="aff-code-prefix">ref=</span>
                  <input
                    id="aff-code-input"
                    value={draftSlug}
                    onChange={(e) => setDraftSlug(cleanSlug(e.target.value))}
                    placeholder={suggestedSlug}
                    maxLength={32}
                  />
                </div>
                {error && <span className="aff-code-error">{error}</span>}
                <span className="aff-code-hint">
                  {isDe ? `Vorschlag: ${suggestedSlug}` : `Suggestion: ${suggestedSlug}`}
                </span>
                <button type="button" className="aff-code-save-btn" onClick={saveCode}>
                  {isDe ? 'Code festlegen' : 'Set code'}
                </button>
              </div>
            ) : (
              <div className="aff-code-locked-display">
                <div className="aff-code-locked-inner">
                  <LockKeyhole size={15} />
                  <div>
                    <span className="aff-code-locked-label">{isDe ? 'Dein Code' : 'Your code'}</span>
                    <strong className="aff-code-locked-value">{savedSlug}</strong>
                  </div>
                </div>
                <small>{isDe ? 'Einmalig festgelegt und gesperrt.' : 'Set once and locked.'}</small>
              </div>
            )}
          </div>
        </div>

        {/* Performance Chart */}
        <div className="aff-card aff-chart-card">
          <div className="aff-card-head aff-card-head--row">
            <div>
              <h2>{isDe ? 'Performance' : 'Performance'}</h2>
              <p>{isDe ? 'Klicks und Käufe der letzten 7 Tage.' : 'Clicks and purchases over the last 7 days.'}</p>
            </div>
            <div className="aff-chart-legend">
              <span><i className="aff-dot aff-dot--cyan" />{isDe ? 'Klicks' : 'Clicks'}</span>
              <span><i className="aff-dot aff-dot--green" />{isDe ? 'Käufer' : 'Buyers'}</span>
            </div>
          </div>
          <div className="aff-chart-area">
            <svg viewBox="0 0 720 140" className="aff-chart-svg" aria-hidden="true">
              <line x1="0" y1="35" x2="720" y2="35" />
              <line x1="0" y1="70" x2="720" y2="70" />
              <line x1="0" y1="105" x2="720" y2="105" />
              <line x1="0" y1="140" x2="720" y2="140" />
            </svg>
            <div className="aff-chart-empty-label">
              {isDe ? 'Noch keine Daten — teile deinen Link und starte.' : 'No data yet — share your link and get started.'}
            </div>
            <div className="aff-chart-days">
              {(isDe ? ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']).map(d => (
                <span key={d}>{d}</span>
              ))}
            </div>
          </div>
        </div>

        <p className="aff-legal">
          {isDe
            ? 'Fixe $80 pro bestätigtem Kauf. Keine Rückerstattungen. Affiliate-Links bitte transparent kennzeichnen.'
            : 'A fixed $80 per confirmed purchase. No refunds. Please disclose affiliate links transparently.'}
        </p>
      </div>
    </main>
  );
};
