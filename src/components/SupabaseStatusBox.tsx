import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppUser } from '../supabase';
import { Activity, CheckCircle2, Cloud, Database, Loader2, RefreshCw, User as UserIcon, XCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabase';

type Props = {
  currentUser: AppUser | null;
  accountId: string;
  theme: 'light' | 'dark';
  refreshKey?: number;
};

type StatusState = {
  loading: boolean;
  supabaseConnected: boolean;
  cloudBooks: number;
  brainStateFound: boolean;
  queueTotal: number;
  queuePending: number;
  queueSynced: number;
  error: string | null;
  checkedAt: string | null;
};

const initialState: StatusState = {
  loading: false,
  supabaseConnected: false,
  cloudBooks: 0,
  brainStateFound: false,
  queueTotal: 0,
  queuePending: 0,
  queueSynced: 0,
  error: null,
  checkedAt: null,
};

const compact = (value: string | null | undefined, start = 8, end = 6) => {
  if (!value) return '—';
  if (value.length <= start + end + 1) return value;
  return `${value.slice(0, start)}…${value.slice(-end)}`;
};

const formatTime = (value: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
};

export const SupabaseStatusBox: React.FC<Props> = ({ currentUser, accountId, theme, refreshKey = 0 }) => {
  const [status, setStatus] = useState<StatusState>(initialState);

  const isDark = theme === 'dark';

  const palette = useMemo(() => ({
    panel: isDark ? 'rgba(8, 12, 18, 0.82)' : 'rgba(255, 255, 255, 0.88)',
    border: isDark ? 'rgba(96, 165, 250, 0.16)' : 'rgba(148, 163, 184, 0.35)',
    strong: isDark ? '#f8fafc' : '#0f172a',
    muted: isDark ? '#9fb0c9' : '#475569',
    soft: isDark ? '#7f8ea3' : '#64748b',
    chip: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(248, 250, 252, 0.95)',
    okBg: isDark ? 'rgba(22, 163, 74, 0.16)' : '#dcfce7',
    okText: isDark ? '#86efac' : '#166534',
    badBg: isDark ? 'rgba(127, 29, 29, 0.22)' : '#fee2e2',
    badText: isDark ? '#fca5a5' : '#991b1b',
    neutralBg: isDark ? 'rgba(59, 130, 246, 0.14)' : '#eff6ff',
    neutralText: isDark ? '#93c5fd' : '#1d4ed8',
  }), [isDark]);

  const refreshStatus = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) {
      setStatus({
        ...initialState,
        error: 'Supabase nicht konfiguriert',
        checkedAt: new Date().toISOString(),
      });
      return;
    }

    if (!currentUser?.uid) {
      setStatus({
        ...initialState,
        error: 'Kein User eingeloggt',
        checkedAt: new Date().toISOString(),
      });
      return;
    }

    setStatus((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const uid = currentUser.uid;
      
      const { count: booksCount } = await supabase.from('books')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', uid)
        .eq('account_id', accountId);

      const { data: queueData } = await supabase.from('queue_items')
        .select('synced_to_obsidian')
        .eq('user_id', uid)
        .eq('account_id', accountId);

      const { count: brainStateCount } = await supabase.from('brain_states')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', uid)
        .eq('account_id', accountId);

      const queueDocs = queueData || [];
      const queuePending = queueDocs.filter(q => q.synced_to_obsidian === false).length;
      const queueSynced = queueDocs.filter(q => q.synced_to_obsidian === true).length;
      const queueTotal = queueDocs.length;

      setStatus({
        loading: false,
        supabaseConnected: true,
        cloudBooks: booksCount || 0,
        brainStateFound: (brainStateCount || 0) > 0,
        queueTotal,
        queuePending,
        queueSynced,
        error: null,
        checkedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Supabase status check failed:', error);
      setStatus({
        ...initialState,
        loading: false,
        error: error instanceof Error ? error.message : 'Supabase-Check fehlgeschlagen',
        checkedAt: new Date().toISOString(),
      });
    }
  }, [accountId, currentUser]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus, refreshKey]);

  const statusPill = (label: string, ok: boolean, icon: React.ReactNode) => (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 8px',
        borderRadius: '999px',
        background: ok ? palette.okBg : palette.badBg,
        color: ok ? palette.okText : palette.badText,
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.01em',
      }}
    >
      {icon}
      {label}
    </div>
  );

  const metricCard = (label: string, value: string | number, accent: string) => (
    <div
      style={{
        minWidth: '92px',
        padding: '8px 9px',
        borderRadius: '10px',
        background: palette.chip,
        border: `1px solid ${palette.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      <span style={{ fontSize: '10px', color: palette.soft, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      <span style={{ fontSize: '15px', fontWeight: 800, color: accent }}>{value}</span>
    </div>
  );

  const authOk = !!currentUser;
  const dbOk = status.supabaseConnected && !status.error;

  return (
    <div
      style={{
        width: 'min(420px, calc(100vw - 40px))',
        padding: '12px',
        borderRadius: '16px',
        background: palette.panel,
        border: `1px solid ${palette.border}`,
        backdropFilter: 'blur(18px)',
        boxShadow: isDark ? '0 18px 50px rgba(0, 0, 0, 0.28)' : '0 18px 50px rgba(15, 23, 42, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: palette.neutralBg, color: palette.neutralText }}>
            <Cloud style={{ width: '15px', height: '15px' }} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: palette.strong }}>Supabase Live Status</div>
            <div style={{ fontSize: '10px', color: palette.soft }}>Account: {accountId || 'default'}</div>
          </div>
        </div>

        <button
          onClick={() => void refreshStatus()}
          disabled={status.loading}
          style={{
            border: `1px solid ${palette.border}`,
            background: palette.chip,
            color: palette.muted,
            borderRadius: '10px',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: status.loading ? 'wait' : 'pointer',
          }}
          title="Supabase Status neu laden"
        >
          {status.loading ? <Loader2 style={{ width: '15px', height: '15px' }} /> : <RefreshCw style={{ width: '15px', height: '15px' }} />}
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {statusPill('Auth verbunden', authOk, authOk ? <CheckCircle2 style={{ width: '13px', height: '13px' }} /> : <XCircle style={{ width: '13px', height: '13px' }} />)}
        {statusPill('Supabase DB ok', dbOk, dbOk ? <Database style={{ width: '13px', height: '13px' }} /> : <XCircle style={{ width: '13px', height: '13px' }} />)}
        {statusPill(`Brain-State ${status.brainStateFound ? 'gefunden' : 'fehlt'}`, status.brainStateFound, status.brainStateFound ? <Activity style={{ width: '13px', height: '13px' }} /> : <XCircle style={{ width: '13px', height: '13px' }} />)}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {metricCard('Cloud-Bücher', status.cloudBooks, palette.strong)}
        {metricCard('Queue gesamt', status.queueTotal, palette.strong)}
        {metricCard('Queue offen', status.queuePending, status.queuePending > 0 ? '#f59e0b' : palette.okText)}
        {metricCard('Queue synced', status.queueSynced, palette.okText)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: palette.muted, fontSize: '11px' }}>
          <UserIcon style={{ width: '13px', height: '13px' }} />
          <span>{currentUser?.email || 'Nicht eingeloggt'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: palette.soft, fontSize: '10px', fontFamily: 'monospace' }}>
          <span>UID:</span>
          <span>{compact(currentUser?.uid)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', color: palette.soft, fontSize: '10px' }}>
          <span>Zuletzt geprüft: {formatTime(status.checkedAt)}</span>
          {status.loading && <span>prüfe…</span>}
        </div>
      </div>

      {status.error && (
        <div
          style={{
            padding: '8px 10px',
            borderRadius: '10px',
            background: palette.badBg,
            color: palette.badText,
            fontSize: '11px',
            lineHeight: 1.45,
          }}
        >
          {status.error}
        </div>
      )}
    </div>
  );
};
