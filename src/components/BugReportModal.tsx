import React, { useState } from 'react';
import { X, Bug, CheckCircle2, Loader2, Clock } from 'lucide-react';
import { supabase } from '../supabase';
import type { AppUser } from '../supabase';

interface Props {
  onClose: () => void;
  theme: 'dark' | 'light';
  isDe: boolean;
  currentUser: AppUser | null;
}

const RATE_LIMIT_KEY = 'bug_report_last_sent';
const RATE_LIMIT_MS = 60_000; // 1 Minute

const CATEGORIES_DE = [
  'PDF / Export Fehler',
  'KI-Generierung',
  'Layout / Design Problem',
  'Login / Authentifizierung',
  'Performance / Laden',
  'Sonstiges',
];

const CATEGORIES_EN = [
  'PDF / Export Error',
  'AI Generation',
  'Layout / Design Issue',
  'Login / Authentication',
  'Performance / Loading',
  'Other',
];

function getRemainingSeconds(): number {
  try {
    const last = localStorage.getItem(RATE_LIMIT_KEY);
    if (!last) return 0;
    const diff = Date.now() - parseInt(last, 10);
    if (diff >= RATE_LIMIT_MS) return 0;
    return Math.ceil((RATE_LIMIT_MS - diff) / 1000);
  } catch {
    return 0;
  }
}

export const BugReportModal: React.FC<Props> = ({ onClose, theme, isDe, currentUser }) => {
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitSecs, setRateLimitSecs] = useState<number>(getRemainingSeconds);

  const categories = isDe ? CATEGORIES_DE : CATEGORIES_EN;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    // Rate limit check
    const remaining = getRemainingSeconds();
    if (remaining > 0) {
      setRateLimitSecs(remaining);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase!
        .from('bug_reports')
        .insert({
          user_id: currentUser?.uid || null,
          user_email: currentUser?.email || null,
          category: category || null,
          title: title.trim() || null,
          description: description.trim(),
          status: 'open',
        });

      if (insertError) throw insertError;

      // Save timestamp for rate limiting
      localStorage.setItem(RATE_LIMIT_KEY, Date.now().toString());
      setSubmitted(true);
    } catch (err: any) {
      setError(isDe
        ? 'Fehler beim Senden. Bitte versuche es erneut.'
        : 'Failed to submit. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const bg = theme === 'dark' ? '#0f172a' : '#fff';
  const border = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const textMain = theme === 'dark' ? '#f4f4f5' : '#0f172a';
  const textMuted = theme === 'dark' ? '#71717a' : '#6b7280';
  const inputBg = theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const inputBorder = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: '10px',
        width: '100%', maxWidth: '480px',
        padding: '28px',
        position: 'relative',
        boxShadow: theme === 'dark'
          ? '0 24px 60px rgba(0,0,0,0.6)'
          : '0 24px 60px rgba(0,0,0,0.12)',
      }}>
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: textMuted, display: 'flex', padding: '4px',
          }}
        >
          <X size={16} />
        </button>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: textMain }}>
              {isDe ? 'Danke für dein Feedback!' : 'Thanks for your feedback!'}
            </h3>
            <p style={{ color: textMuted, fontSize: '14px', margin: '0 0 24px' }}>
              {isDe
                ? 'Wir haben deinen Bericht erhalten und schauen uns das so schnell wie möglich an.'
                : 'We received your report and will look into it as soon as possible.'}
            </p>
            <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', padding: '10px' }}>
              {isDe ? 'Schließen' : 'Close'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: textMain }}>
                {isDe ? 'Bug melden' : 'Report a Bug'}
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: textMuted }}>
                {isDe ? 'Hilf uns Book24 besser zu machen.' : 'Help us make Book24 better.'}
              </p>
            </div>

            {/* Rate limit warning */}
            {rateLimitSecs > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                borderRadius: '6px', padding: '10px 12px', marginBottom: '14px',
              }}>
                <Clock size={13} color="#f59e0b" />
                <span style={{ fontSize: '12px', color: '#f59e0b' }}>
                  {isDe
                    ? `Bitte warte ${rateLimitSecs}s vor dem nächsten Report.`
                    : `Please wait ${rateLimitSecs}s before sending another report.`}
                </span>
              </div>
            )}

            {/* Category */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: textMuted, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {isDe ? 'Kategorie' : 'Category'} <span style={{ color: textMuted }}>(optional)</span>
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px', fontSize: '13px',
                  background: inputBg, border: `1px solid ${inputBorder}`,
                  borderRadius: '6px', color: textMain, outline: 'none',
                }}
              >
                <option value="">{isDe ? 'Kategorie auswählen...' : 'Select category...'}</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: textMuted, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {isDe ? 'Kurztitel' : 'Short Title'} <span style={{ color: textMuted }}>(optional)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={isDe ? 'z.B. PDF Export schlägt fehl bei...' : 'e.g. PDF export fails when...'}
                maxLength={100}
                style={{
                  width: '100%', padding: '9px 12px', fontSize: '13px',
                  background: inputBg, border: `1px solid ${inputBorder}`,
                  borderRadius: '6px', color: textMain, outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: textMuted, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {isDe ? 'Beschreibung' : 'Description'} <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
                rows={5}
                placeholder={isDe
                  ? 'Was ist passiert? Wie können wir den Fehler nachvollziehen?'
                  : 'What happened? How can we reproduce the issue?'}
                style={{
                  width: '100%', padding: '10px 12px', fontSize: '13px',
                  background: inputBg, border: `1px solid ${inputBorder}`,
                  borderRadius: '6px', color: textMain, outline: 'none',
                  resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {error && (
              <p style={{ color: '#ef4444', fontSize: '12px', margin: '-12px 0 14px' }}>{error}</p>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn"
                style={{ flex: 1, padding: '10px', fontSize: '13px' }}
              >
                {isDe ? 'Abbrechen' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={submitting || !description.trim() || rateLimitSecs > 0}
                className="btn btn-danger"
                style={{ flex: 2, padding: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {submitting
                  ? <><Loader2 size={14} className="animate-spin" /> {isDe ? 'Senden...' : 'Sending...'}</>
                  : rateLimitSecs > 0
                    ? <><Clock size={14} /> {rateLimitSecs}s</>
                    : <>{isDe ? 'Bug melden' : 'Report Bug'}</>
                }
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
