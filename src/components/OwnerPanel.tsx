import { useCallback, useEffect, useState, useMemo } from 'react';
import type { AppUser } from '../supabase';
import { supabase } from '../supabase';
import {
  X, Crown, ChevronRight, ShieldAlert, PauseCircle, Settings, RefreshCw, AlertTriangle, Search, KeyRound, Calendar, Clock, BookOpen, Activity, Sliders, TerminalSquare, Wrench, Grid2X2, Bug
} from 'lucide-react';
import { isOwnerEmail } from '../lib/owner';

type OwnerUserRow = {
  id: string;
  email: string | null;
  name: string | null;
  status: string | null;
  plan: string | null;
  license_key: string | null;
  gumroad_product_id: string | null;
  activated_at: string | null;
  created_at: string | null;
  last_login_at: string | null;
  stats: {
    total_books: number;
    completed_books: number;
    estimated_gen_time_mins: number;
    niches: string[];
  };
};

type Props = {
  currentUser: AppUser | null;
  theme: 'dark' | 'light';
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export function OwnerPanel({ currentUser, theme }: Props) {
  const [users, setUsers] = useState<OwnerUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  
  // Modal state
  const [selectedUser, setSelectedUser] = useState<OwnerUserRow | null>(null);
  const [selectedUserBooks, setSelectedUserBooks] = useState<any[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceEndsAtInput, setMaintenanceEndsAtInput] = useState('');
  const [maintenanceMessage, setMaintenanceMessage] = useState('Book24 Studio wird gerade gewartet. Bitte versuche es später wieder.');

  const [gumroadPermalink, setGumroadPermalink] = useState('');
  const [isSavingGumroad, setIsSavingGumroad] = useState(false);

  const [customKeys, setCustomKeys] = useState<any[]>([]);
  const [showCustomKeysModal, setShowCustomKeysModal] = useState(false);
  const [newCustomKey, setNewCustomKey] = useState('');
  const [newKeyMaxUses, setNewKeyMaxUses] = useState<number | ''>(1);
  const [newKeyExpiresAt, setNewKeyExpiresAt] = useState('');

  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [ownerToolbarTab, setOwnerToolbarTab] = useState<'console' | 'keys' | 'modules' | 'maintenance' | 'sync' | 'reports'>('console');
  const [showConsoleModal, setShowConsoleModal] = useState(false);
  const [denseView, setDenseView] = useState(false);
  const [activeModules, setActiveModules] = useState<Record<string, any>>({ brain: true, dashboard: true, calculator: true, studio: true });
  const [showModulesModal, setShowModulesModal] = useState(false);
  const [newUserToasts, setNewUserToasts] = useState<Array<{ id: number; email: string }>>([]);
  const toastIdRef = { current: 0 };
  const [transferTargetEmail, setTransferTargetEmail] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferResult, setTransferResult] = useState<string | null>(null);
  const [bugReports, setBugReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedUser) {
      setSelectedUserBooks([]);
      return;
    }
    const fetchBooks = async () => {
      setLoadingBooks(true);
      try {
        const { data, error } = await supabase!.rpc('admin_get_user_books', { target_user_id: selectedUser.id });
        if (error) throw error;
        setSelectedUserBooks(data || []);
      } catch (err) {
        console.error('Error fetching user books:', err);
      } finally {
        setLoadingBooks(false);
      }
    };
    fetchBooks();
  }, [selectedUser?.id]);


  const loadData = useCallback(async (isRefresh = false) => {
    if (!currentUser || !currentUser.email) return;
    if (!isOwnerEmail(currentUser.email)) {
      setError('Nicht autorisiert.');
      setLoading(false);
      return;
    }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      if (!supabase) throw new Error('Supabase client is not initialized');
      
      let mmResult = false;
      try {
        const { data: mmData } = await supabase.rpc('get_maintenance_mode');
        if (mmData && typeof mmData === 'object') {
          mmResult = Boolean(mmData.active);
        } else {
          mmResult = Boolean(mmData);
        }
      } catch (err) {
        // ignore
      }
      setMaintenanceMode(mmResult);

      // Fetch gumroad permalink
      const { data: gData } = await supabase.rpc('get_gumroad_permalink');
      if (gData) {
        setGumroadPermalink(gData);
      }

      const { data, error: rpcError } = await supabase.rpc('get_owner_dashboard_data', {
        owner_email_param: currentUser.email
      });

      if (rpcError) throw rpcError;
      const baseUsers = Array.isArray(data) ? data : [];
      
      // Live stats: use admin RPC to get accurate, real-time book counts for all users
      try {
        const { data: allStats } = await supabase
          .rpc('admin_get_all_books_stats', { owner_email_param: currentUser.email });
        
        if (allStats && typeof allStats === 'object') {
          const enrichedUsers = baseUsers.map((u: any) => {
            const s = (allStats as any)[u.id];
            if (!s) return u;
            return {
              ...u,
              stats: {
                ...u.stats,
                total_books: s.total || 0,
                completed_books: s.completed || 0,
                estimated_gen_time_mins: s.gen_mins || 0,
                niches: s.niches || [],
              }
            };
          });
          setUsers(enrichedUsers);
        } else {
          setUsers(baseUsers);
        }
      } catch {
        // Fallback: use base data from RPC (stats may be stale)
        setUsers(baseUsers);
      }

      try {
        const { data: ckData } = await supabase.rpc('admin_get_custom_licenses');
        if (ckData) {
          setCustomKeys(Array.isArray(ckData) ? ckData : []);
        }
      } catch (err) {
        // ignore
      }

      try {
        const { data: modData } = await supabase.rpc('get_system_modules');
        if (modData && typeof modData === 'object') {
          setActiveModules(modData);
        }
      } catch (err) {
        // ignore
      }

      try {
        const { data: logsData } = await supabase.rpc('admin_get_activity_logs');
        if (logsData) {
          setActivityLogs(Array.isArray(logsData) ? logsData : []);
        }
      } catch (err) {
        // ignore if not setup yet
      }
    } catch (err: any) {
      console.error('OwnerPanel fetch error:', err);
      if (err.message && err.message.includes('relation "public.books" does not exist')) {
         setError('Die Datenbanktabellen fehlen! Bitte führe den SQL-Code im Supabase SQL Editor aus.');
      } else {
         setError(err.message || 'Fehler beim Laden der Admin-Daten.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();

    // Supabase Realtime Subscription for Users and Books
    if (!supabase) return;
    
    const profilesSub = supabase.channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        loadData(true);
        // Show a live toast when a brand-new user registers
        if (payload.eventType === 'INSERT') {
          const email = payload.new?.email || 'Unbekannte E-Mail';
          const toastId = ++toastIdRef.current;
          setNewUserToasts(prev => [...prev, { id: toastId, email }]);
          // Auto-dismiss after 6 seconds
          setTimeout(() => {
            setNewUserToasts(prev => prev.filter(t => t.id !== toastId));
          }, 6000);
        }
      }).subscribe();
      
    const booksSub = supabase.channel('books-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, () => {
        loadData(true);
      }).subscribe();

    const activitySub = supabase.channel('activity-logs-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, (payload) => {
        setActivityLogs(prev => {
          const newLogs = [payload.new, ...prev];
          return newLogs.slice(0, 50);
        });
      }).subscribe();

    return () => {
      profilesSub.unsubscribe();
      booksSub.unsubscribe();
      activitySub.unsubscribe();
    };
  }, [loadData]);

  // Derived metrics
  const totalUsers = users.length;
  const totalProUsers = users.filter(u => u.plan === 'pro').length;
  const totalStaffUsers = users.filter(u => u.plan === 'staff').length;
  const totalBooks = users.reduce((acc, u) => acc + (u.stats?.total_books || 0), 0);
  const totalCompleted = users.reduce((acc, u) => acc + (u.stats?.completed_books || 0), 0);
  const totalTime = users.reduce((acc, u) => acc + (u.stats?.estimated_gen_time_mins || 0), 0);

  // Search filtering
  const filteredUsers = useMemo(() => {
    const s = search.toLowerCase();
    if (!s) return users;
    return users.filter(u => 
      (u.email || '').toLowerCase().includes(s) || 
      (u.name || '').toLowerCase().includes(s) ||
      u.id.toLowerCase().includes(s)
    );
  }, [users, search]);



  // Action Handlers
  const saveGumroadPermalink = async () => {
    setIsSavingGumroad(true);
    await handleAction(async () => {
      const { error } = await supabase!.rpc('admin_set_gumroad_permalink', { permalink: gumroadPermalink });
      if (!error) alert('Gumroad Permalink gespeichert!');
      return { error };
    });
    setIsSavingGumroad(false);
  };

  const handleAction = async (actionFn: () => Promise<{error: any}>) => {
    if (!supabase) return;
    setIsProcessing(true);
    try {
      const { error } = await actionFn();
      if (error) throw error;
      await loadData();
      if (selectedUser) {
        // Modal update needs to refresh from new users list
        // handled nicely because loadData() updates users array, 
        // but since we want it instant we can just close modal or let users list update it
      }
    } catch (err: any) {
      alert(`Fehler: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const setPlan = (id: string, plan: string) => handleAction(async () => await supabase!.rpc('admin_update_user_plan', { target_user_id: id, new_plan: plan }));
  const setStatus = (id: string, status: string) => handleAction(async () => await supabase!.rpc('admin_update_user_status', { target_user_id: id, new_status: status }));

  const transferBooksToUser = async () => {
    if (!supabase || !selectedUser || !transferTargetEmail.trim()) return;
    setIsTransferring(true);
    setTransferResult(null);
    try {
      // Find target user by email in our users list
      const targetUser = users.find(u => (u.email || '').toLowerCase() === transferTargetEmail.trim().toLowerCase());
      if (!targetUser) {
        setTransferResult('❌ Kein User mit dieser E-Mail gefunden.');
        return;
      }
      if (targetUser.id === selectedUser.id) {
        setTransferResult('❌ Quelle und Ziel sind derselbe User.');
        return;
      }
      // Transfer all books from selectedUser to targetUser via direct DB update
      const { error } = await supabase
        .from('books')
        .update({ user_id: targetUser.id })
        .eq('user_id', selectedUser.id);
      if (error) throw error;
      setTransferResult(`✅ Alle Bücher von "${selectedUser.email}" wurden an "${targetUser.email}" übertragen!`);
      setTransferTargetEmail('');
      await loadData(true);
    } catch (err: any) {
      setTransferResult(`❌ Fehler: ${err.message}`);
    } finally {
      setIsTransferring(false);
    }
  };
  
  const toggleMaintenance = () => {
    if (maintenanceMode) {
      // Direct turn off for now, or we could open modal to edit
      handleAction(async () => await supabase!.rpc('admin_set_maintenance_mode', { is_active: false, ends_at_str: null, custom_message: null }));
    } else {
      // Open modal to turn on
      setMaintenanceEndsAtInput('');
      setMaintenanceMessage('Book24 Studio wird gerade gewartet. Bitte versuche es später wieder.');
      setShowMaintenanceModal(true);
    }
  };

  const confirmMaintenanceOn = (hasTimer: boolean) => {
    let endsAt = null;
    if (hasTimer) {
      if (!maintenanceEndsAtInput) {
        alert('Bitte ein Datum und eine Uhrzeit auswählen.');
        return;
      }
      endsAt = new Date(maintenanceEndsAtInput).toISOString();
    }
    setShowMaintenanceModal(false);
    handleAction(async () => await supabase!.rpc('admin_set_maintenance_mode', { is_active: true, ends_at_str: endsAt, custom_message: maintenanceMessage }));
  };

  const createCustomKey = async () => {
    if (!newCustomKey.trim()) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase!.rpc('admin_create_custom_license', { 
        p_key: newCustomKey.trim().toUpperCase(),
        p_max_uses: newKeyMaxUses === '' ? null : newKeyMaxUses,
        p_expires_at: newKeyExpiresAt ? new Date(newKeyExpiresAt).toISOString() : null
      });
      if (error) throw error;
      setNewCustomKey('');
      setNewKeyMaxUses(1);
      setNewKeyExpiresAt('');
      await loadData();
    } catch (err: any) {
      alert(`Fehler: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteCustomKey = async (key: string) => {
    if (!window.confirm(`Möchtest du den Key ${key} wirklich löschen? Der Nutzer verliert sofort den Zugriff!`)) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase!.rpc('admin_delete_custom_license', { p_key: key });
      if (error) throw error;
      await loadData();
    } catch (err: any) {
      alert(`Fehler: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const changeModuleStatus = async (modKey: string, newStatus: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase!.rpc('admin_set_module_status', { module: modKey, status: newStatus });
      if (error) throw error;
      setActiveModules(prev => ({ ...prev, [modKey]: newStatus }));
    } catch (err: any) {
      console.error(err);
      alert('Fehler beim Umschalten des Moduls: ' + (err.message || ''));
    } finally {
      setIsProcessing(false);
    }
  };


  // Dynamic Theme Palette
  const t = theme === 'dark' ? {
    bg: '#0a0a0a', cardBg: '#141414', border: '#262626', textMain: '#f5f5f5', textMuted: '#a3a3a3', textFaint: '#525252',
    primary: '#C9963E', headerBg: '#0f0f0f', rowHover: '#1f1f1f', chartLine: '#C9963E', chartBar: '#2563eb'
  } : {
    bg: '#f8f9fa', cardBg: '#ffffff', border: '#e5e7eb', textMain: '#111827', textMuted: '#6b7280', textFaint: '#9ca3af',
    primary: '#1a73e8', headerBg: '#f9fafb', rowHover: '#f3f4f6', chartLine: '#1a73e8', chartBar: '#6366f1'
  };

  return (
    <div style={{ width: '100%', minHeight: '100%', padding: '16px 18px 28px', boxSizing: 'border-box', backgroundColor: t.bg, fontFamily: 'Inter, system-ui, sans-serif', color: t.textMain }}>
      
      {/* 🔔 Live New-User Toast Notifications */}
      <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'none' }}>
        {newUserToasts.map(toast => (
          <div
            key={toast.id}
            style={{
              background: 'linear-gradient(135deg, #052e16 0%, #064e3b 100%)',
              border: '1px solid #16a34a',
              borderRadius: '12px',
              padding: '14px 18px',
              minWidth: '280px',
              maxWidth: '360px',
              boxShadow: '0 0 24px rgba(22,163,74,0.45), 0 8px 32px rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              pointerEvents: 'auto',
              animation: 'slideInFromRight 0.35s cubic-bezier(0.16,1,0.3,1)',
            }}
            onClick={() => setNewUserToasts(prev => prev.filter(t => t.id !== toast.id))}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #16a34a, #4ade80)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '18px' }}>
              👤
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#4ade80', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '2px' }}>Neuer Account!</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', wordBreak: 'break-all' }}>{toast.email}</div>
              <div style={{ fontSize: '11px', color: '#6ee7b7', marginTop: '2px' }}>Hat sich gerade registriert ✓</div>
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes slideInFromRight { from { opacity: 0; transform: translateX(80px); } to { opacity: 1; transform: translateX(0); } }`}</style>
      
      {/* Header Area */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', gap: '14px' }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: t.textMain, textAlign: 'center' }}>Book24 Admin</h1>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', padding: '8px', borderRadius: '14px', backgroundColor: t.cardBg, border: `1px solid ${t.border}`, boxShadow: theme === 'dark' ? '0 10px 30px rgba(0,0,0,0.22)' : '0 10px 24px rgba(15,23,42,0.06)' }}>
            <OwnerToolbarButton
              active={ownerToolbarTab === 'console'}
              icon={<TerminalSquare size={14} />}
              label="Live Konsole"
              isDark={theme === 'dark'}
              onClick={() => {
                setOwnerToolbarTab('console');
                setShowConsoleModal(true);
              }}
            />
            <OwnerToolbarButton
              active={ownerToolbarTab === 'sync'}
              icon={<RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />}
              label="Neu laden"
              isDark={theme === 'dark'}
              onClick={() => {
                setOwnerToolbarTab('sync');
                void loadData(true);
              }}
              disabled={loading || refreshing || isProcessing}
            />
            <OwnerToolbarButton
              active={ownerToolbarTab === 'keys'}
              icon={<KeyRound size={14} />}
              label="Custom Keys"
              isDark={theme === 'dark'}
              onClick={() => {
                setOwnerToolbarTab('keys');
                setShowCustomKeysModal(true);
              }}
            />
            <OwnerToolbarButton
              active={ownerToolbarTab === 'modules'}
              icon={<Sliders size={14} />}
              label="Module"
              isDark={theme === 'dark'}
              onClick={() => {
                setOwnerToolbarTab('modules');
                setShowModulesModal(true);
              }}
            />
            <OwnerToolbarButton
              active={ownerToolbarTab === 'maintenance'}
              icon={<Wrench size={14} />}
              label={maintenanceMode ? 'Wartung AN' : 'Wartung AUS'}
              isDark={theme === 'dark'}
              onClick={() => {
                setOwnerToolbarTab('maintenance');
                toggleMaintenance();
              }}
              disabled={isProcessing}
            />
            <OwnerToolbarButton
              active={ownerToolbarTab === 'reports'}
              icon={<Bug size={14} />}
              label="Bug Reports"
              isDark={theme === 'dark'}
              onClick={async () => {
                setOwnerToolbarTab('reports');
                setLoadingReports(true);
                setReportsError(null);
                try {
                  const { data, error } = await supabase!.rpc('admin_get_bug_reports');
                  if (error) throw error;
                  setBugReports(data || []);
                } catch (err: any) {
                  setReportsError(err.message || 'Fehler beim Laden.');
                } finally {
                  setLoadingReports(false);
                }
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{ fontSize: '11px', color: t.textFaint, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Gumroad Link</span>
            <span style={{ fontSize: '13px', color: t.textFaint, fontWeight: 500 }}>Gumroad Permalink:</span>
            <input 
              type="text" 
              value={gumroadPermalink}
              onChange={e => setGumroadPermalink(e.target.value)}
              placeholder="z.B. book24studio"
              style={{ width: '140px', padding: '6px 10px', fontSize: '13px', borderRadius: '6px', border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, outline: 'none' }}
            />
            <button 
              onClick={saveGumroadPermalink}
              disabled={isSavingGumroad}
              style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 600, backgroundColor: t.textMain, color: t.bg, border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              {isSavingGumroad ? '...' : 'Speichern'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: theme === 'dark' ? '#3b1c1c' : '#fce8e6', color: theme === 'dark' ? '#ff6b6b' : '#d93025', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', border: theme === 'dark' ? '1px solid #5c2b2b' : '1px solid rgba(217,48,37,0.2)' }}>
          <AlertTriangle size={18} />
          <span style={{ fontSize: '13px', fontWeight: 500 }}>{error}</span>
        </div>
      )}

      {/* COMPACT Top Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(138px, 1fr))', gap: '8px', marginBottom: '24px' }}>
        <MetricCard t={t} title="Gesamtnutzer" value={totalUsers.toString()} compact />
        <MetricCard t={t} title="Pro-Nutzer (Paid)" value={totalProUsers.toString()} compact />
        <MetricCard t={t} title="Staff (Team)" value={totalStaffUsers.toString()} compact />
        <MetricCard t={t} title="Bücher angefangen" value={totalBooks.toString()} compact />
        <MetricCard t={t} title="Abgeschlossen" value={totalCompleted.toString()} compact />
        <MetricCard t={t} title="Gen-Zeit gesamt" value={`${Math.round(totalTime / 60)}h ${totalTime % 60}m`} compact />
      </div>

      {/* User Table First */}
      <div style={{ backgroundColor: t.cardBg, borderRadius: '6px', border: `1px solid ${t.border}`, overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <form 
            style={{ position: 'relative', flex: 1, maxWidth: '520px', display: 'flex', gap: '8px' }}
            onSubmit={(e) => {
              e.preventDefault();
              const s = search.trim();
              if (!s) return;
              
              if (filteredUsers.length === 1) {
                setSelectedUser(filteredUsers[0]);
              } else if (filteredUsers.length > 1) {
                const exactMatch = filteredUsers.find(u => u.id === s || u.email === s);
                if (exactMatch) setSelectedUser(exactMatch);
              }
            }}
          >
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} color={t.textMuted} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Suche nach Name, Email oder ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '7px 8px 7px 34px', borderRadius: '6px', border: `1px solid ${t.border}`, boxSizing: 'border-box', fontSize: '12px', outline: 'none', backgroundColor: t.bg, color: t.textMain }}
              />
            </div>
            <button
              type="submit"
              style={{ padding: '7px 12px', backgroundColor: t.textMain, color: t.bg, border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}
            >
              Suchen
            </button>
            <button
              type="button"
              onClick={() => setDenseView(prev => !prev)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '7px 11px', backgroundColor: denseView ? t.textMain : t.headerBg, color: denseView ? t.bg : t.textMain, border: `1px solid ${t.border}`, borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}
              title={denseView ? 'Normale Nutzerhöhe aktivieren' : 'Nutzer-Container noch kleiner machen'}
            >
              <Grid2X2 size={14} />
              {denseView ? 'Normalhöhe' : 'Noch kleiner'}
            </button>
          </form>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: denseView ? '11px' : '12px' }}>
            <thead>
              <tr style={{ backgroundColor: t.headerBg, borderBottom: `1px solid ${t.border}` }}>
                <th style={{ padding: denseView ? '7px 10px' : '8px 12px', fontWeight: 600, color: t.textMuted, fontSize: denseView ? '9px' : '10px', textTransform: 'uppercase' }}>Nutzer</th>
                <th style={{ padding: denseView ? '7px 10px' : '8px 12px', fontWeight: 600, color: t.textMuted, fontSize: denseView ? '9px' : '10px', textTransform: 'uppercase' }}>Plan & Status</th>
                <th style={{ padding: denseView ? '7px 10px' : '8px 12px', fontWeight: 600, color: t.textMuted, fontSize: denseView ? '9px' : '10px', textTransform: 'uppercase' }}>Erstellt am</th>
                <th style={{ padding: denseView ? '7px 10px' : '8px 12px', fontWeight: 600, color: t.textMuted, fontSize: denseView ? '9px' : '10px', textTransform: 'uppercase' }}>Bücher</th>
                <th style={{ padding: denseView ? '7px 10px' : '8px 12px', fontWeight: 600, color: t.textMuted, fontSize: denseView ? '9px' : '10px', textTransform: 'uppercase' }}></th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && loading && !refreshing ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: t.textMuted }}>Daten werden geladen...</td>
                </tr>
              ) : filteredUsers.length === 0 && !loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: t.textMuted }}>Keine Nutzer gefunden.</td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr 
                    key={user.id} 
                    onClick={() => {
                      const updated = users.find(u => u.id === user.id);
                      if (updated) setSelectedUser(updated);
                    }}
                    style={{ borderBottom: `1px solid ${t.border}`, transition: 'background-color 0.1s', cursor: 'pointer', opacity: user.status !== 'active' ? 0.6 : 1 }} 
                    onMouseOver={e => e.currentTarget.style.backgroundColor = t.rowHover} 
                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: denseView ? '7px 10px' : '9px 12px' }}>
                      <div style={{ fontWeight: 500, color: t.textMain, marginBottom: denseView ? '1px' : '2px', fontSize: denseView ? '11px' : '12px' }}>{user.name || 'Ohne Name'}</div>
                      {isOwnerEmail(user.email) ? (
                        <div style={{ color: '#ef4444', fontSize: denseView ? '10px' : '11px', marginBottom: denseView ? '2px' : '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {user.email} 
                          <span style={{ fontSize: denseView ? '8px' : '9px', backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: denseView ? '1px 5px' : '2px 6px', borderRadius: '12px', letterSpacing: '0.5px' }}>OWNER</span>
                        </div>
                      ) : (
                        <div style={{ color: t.textMuted, fontSize: denseView ? '10px' : '11px', marginBottom: denseView ? '2px' : '4px' }}>{user.email}</div>
                      )}
                      <div style={{ color: t.textFaint, fontSize: denseView ? '9px' : '10px', fontFamily: 'monospace' }}>ID: {user.id}</div>
                      {user.license_key && (
                        <div style={{ color: t.primary, fontSize: denseView ? '9px' : '10px', fontFamily: 'monospace', marginTop: denseView ? '2px' : '3px', fontWeight: 500 }}>
                          Key: {user.license_key}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: denseView ? '7px 10px' : '9px 12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: denseView ? '4px' : '6px', alignItems: 'flex-start' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: denseView ? '1px 7px' : '2px 8px', backgroundColor: user.plan === 'pro' ? (theme === 'dark' ? 'rgba(234, 179, 8, 0.15)' : '#fef08a') : user.plan === 'staff' ? (theme === 'dark' ? 'rgba(147, 51, 234, 0.15)' : '#e9d5ff') : t.headerBg, color: user.plan === 'pro' ? '#ca8a04' : user.plan === 'staff' ? '#9333ea' : t.textMuted, borderRadius: '12px', fontSize: denseView ? '10px' : '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                          {user.plan === 'pro' && <Crown size={denseView ? 9 : 10} />}
                          {user.plan === 'staff' && <Crown size={denseView ? 9 : 10} />}
                          {user.plan || 'Free'}
                        </div>
                        {user.status !== 'active' && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: denseView ? '1px 7px' : '2px 8px', backgroundColor: 'rgba(220, 38, 38, 0.15)', color: '#dc2626', borderRadius: '12px', fontSize: denseView ? '10px' : '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                            <ShieldAlert size={denseView ? 9 : 10} /> {user.status}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: denseView ? '7px 10px' : '9px 12px', color: t.textMuted, fontSize: denseView ? '10px' : '11px' }}>
                      {formatDate(user.created_at)}
                    </td>
                    <td style={{ padding: denseView ? '7px 10px' : '9px 12px' }}>
                      <div style={{ fontWeight: 500, color: t.textMain, fontSize: denseView ? '11px' : '12px' }}>{user.stats?.total_books || 0}</div>
                    </td>
                    <td style={{ padding: denseView ? '7px 10px' : '9px 12px', textAlign: 'right' }}>
                      <ChevronRight size={denseView ? 14 : 16} color={t.textMuted} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Console Modal */}
      {showConsoleModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.68)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setShowConsoleModal(false)}>
          <div
            style={{ width: '100%', maxWidth: '920px', backgroundColor: '#000000', border: '1px solid #1f2937', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.55)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #111827', backgroundColor: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ffffff', fontSize: '13px', fontWeight: 700 }}>
                <TerminalSquare size={15} />
                Live Konsole
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', animation: 'pulse 2s infinite' }}></div>
                  <div style={{ color: '#ffffff', fontSize: '11px', fontWeight: 700 }}>LIVE</div>
                </div>
                <button onClick={() => setShowConsoleModal(false)} style={{ background: 'transparent', border: '1px solid #1f2937', color: '#ffffff', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} />
                </button>
              </div>
            </div>
            <div style={{ padding: '16px 18px', maxHeight: '70vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#000000' }}>
              {activityLogs.length === 0 ? (
                <div style={{ color: '#ffffff', fontSize: '12px' }}>Warte auf Aktivitäten...</div>
              ) : (
                activityLogs.map(log => {
                  const time = new Date(log.created_at).toLocaleTimeString('de-DE');
                  let message = '';

                  if (log.action_type === 'LOGIN') {
                    message = `[${time}] ${log.user_email || 'Unknown'} hat sich eingeloggt.`;
                  } else if (log.action_type === 'BOOK_CREATED') {
                    const title = log.details?.title || 'Unbekanntes Buch';
                    const niche = log.details?.niche || 'Ohne Nische';
                    message = `[${time}] ${log.user_email || 'Unknown'} generiert neues Buch: "${title}" (${niche})`;
                  } else {
                    message = `[${time}] ${log.action_type} - ${log.user_email}`;
                  }

                  return (
                    <div key={log.id} style={{ fontSize: '12px', color: '#ffffff', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      <span style={{ color: '#ffffff' }}>{'>'}</span> {message}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setSelectedUser(null)}>
          <div 
            style={{ 
              backgroundColor: t.bg, 
              borderRadius: '16px', 
              width: '100%', 
              maxWidth: '520px', 
              border: `1px solid ${t.border}`, 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', 
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #1a73e8, #8ab4f8)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, boxShadow: '0 4px 12px rgba(26, 115, 232, 0.3)' }}>
                  {(selectedUser.name?.[0] || selectedUser.email?.[0] || '?').toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '20px', color: t.textMain, letterSpacing: '-0.5px' }}>{selectedUser.name || 'Kein Name angegeben'}</div>
                  {isOwnerEmail(selectedUser.email) ? (
                    <div style={{ fontSize: '14px', color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                      {selectedUser.email}
                      <span style={{ fontSize: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '12px', letterSpacing: '0.5px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>OWNER</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: '14px', color: t.textMuted, marginTop: '2px' }}>{selectedUser.email}</div>
                  )}
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} style={{ background: '#f1f3f4', border: 'none', color: '#5f6368', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '0 24px 24px 24px', maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', paddingBottom: '24px', borderBottom: `1px solid ${t.border}`, marginBottom: '24px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: t.textMuted, fontWeight: 500, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} /> Account erstellt
                  </div>
                  <div style={{ fontSize: '15px', color: t.textMain, fontWeight: 600 }}>{formatDate(selectedUser.created_at)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: t.textMuted, fontWeight: 500, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} /> Letzter Login
                  </div>
                  <div style={{ fontSize: '15px', color: t.textMain, fontWeight: 600 }}>{formatDate(selectedUser.last_login_at)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: t.textMuted, fontWeight: 500, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={14} /> Bücher generiert
                  </div>
                  <div style={{ fontSize: '16px', color: t.textMain, fontWeight: 600 }}>
                    {selectedUser.stats?.total_books || 0}
                    <span style={{ fontSize: '13px', fontWeight: 500, color: t.textMuted, marginLeft: '6px' }}>({selectedUser.stats?.completed_books || 0} fertig)</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: t.textMuted, fontWeight: 500, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity size={14} /> KI Gen-Zeit
                  </div>
                  <div style={{ fontSize: '16px', color: t.textMain, fontWeight: 600 }}>
                    {Math.round((selectedUser.stats?.estimated_gen_time_mins || 0) / 60)}h {(selectedUser.stats?.estimated_gen_time_mins || 0) % 60}m
                  </div>
                </div>
              </div>

              {/* License Key Section */}
              <div style={{ paddingBottom: '20px', borderBottom: `1px solid ${t.border}`, marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: t.textMuted, fontWeight: 500, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <KeyRound size={12} color="#1a73e8" /> Genutzter Lizenzschlüssel (Gumroad / Custom)
                </div>
                <div style={{ fontSize: '14px', color: t.textMain, fontWeight: 600, fontFamily: 'monospace', backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', padding: '8px 12px', borderRadius: '6px', display: 'inline-block', border: `1px solid ${t.border}` }}>
                  {selectedUser.license_key || 'Kein Lizenzschlüssel hinterlegt (Standard-Plan)'}
                </div>
              </div>

              {/* Niches Section */}
              {selectedUser.stats?.niches && selectedUser.stats.niches.length > 0 && (
                <div style={{ paddingBottom: '24px', borderBottom: `1px solid ${t.border}`, marginBottom: '24px' }}>
                  <div style={{ fontSize: '13px', color: t.textMuted, fontWeight: 500, marginBottom: '12px' }}>Aktivste Nischen</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedUser.stats.niches.map((niche: any, i: number) => (
                      <span key={i} style={{ padding: '4px 0', fontSize: '14px', color: t.textMain, fontWeight: 500 }}>
                        {niche.niche} <span style={{ color: t.textMuted, marginLeft: '4px' }}>({niche.count})</span>
                        {i < selectedUser.stats.niches.length - 1 && <span style={{ color: t.border, margin: '0 8px' }}>•</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {/* Books Details Section */}
              <div style={{ paddingBottom: '24px', borderBottom: `1px solid ${t.border}`, marginBottom: '24px' }}>
                <div style={{ fontSize: '13px', color: t.textMuted, fontWeight: 500, marginBottom: '12px' }}>Generierte Bücher (Details)</div>
                {loadingBooks ? (
                  <div style={{ fontSize: '14px', color: t.textMuted }}>Lade Bücher...</div>
                ) : selectedUserBooks.length === 0 ? (
                  <div style={{ fontSize: '14px', color: t.textMuted }}>Keine Bücher gefunden.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {selectedUserBooks.map((book: any) => (
                      <div key={book.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontWeight: 600, fontSize: '15px', color: t.textMain }}>{book.title || 'Ohne Titel'}</div>
                        {book.subtitle && <div style={{ fontSize: '13px', color: t.textMuted }}>{book.subtitle}</div>}
                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: t.textMuted, marginTop: '4px', alignItems: 'center' }}>
                          <span>{book.niche || '—'}</span>
                          <span>Autor: {book.author || '—'}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: book.status === 'completed' ? '#10b981' : t.textMuted }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: book.status === 'completed' ? '#10b981' : t.border }}></div>
                            {book.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Plan Controls */}
              <div style={{ paddingBottom: '24px', borderBottom: `1px solid ${t.border}`, marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: t.textMain, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Crown size={16} color={selectedUser.plan === 'pro' ? "#ca8a04" : selectedUser.plan === 'staff' ? "#9333ea" : t.textMuted} /> 
                      Plan: <span style={{ textTransform: 'uppercase', color: selectedUser.plan === 'pro' ? "#ca8a04" : selectedUser.plan === 'staff' ? "#9333ea" : t.textMain }}>{selectedUser.plan || 'FREE'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {selectedUser.plan !== 'free' && selectedUser.plan && (
                      <button onClick={() => setPlan(selectedUser.id, 'free')} disabled={isProcessing} style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 500, backgroundColor: 'transparent', color: t.textMuted, border: `1px solid ${t.border}`, borderRadius: '6px', cursor: 'pointer' }}>Free</button>
                    )}
                    {selectedUser.plan !== 'pro' && (
                      <button onClick={() => setPlan(selectedUser.id, 'pro')} disabled={isProcessing} style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 500, backgroundColor: 'transparent', color: '#ca8a04', border: '1px solid rgba(202, 138, 4, 0.3)', borderRadius: '6px', cursor: 'pointer' }}>Pro</button>
                    )}
                    {selectedUser.plan !== 'staff' && (
                      <button onClick={() => setPlan(selectedUser.id, 'staff')} disabled={isProcessing} style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 500, backgroundColor: 'transparent', color: '#9333ea', border: '1px solid rgba(147, 51, 234, 0.3)', borderRadius: '6px', cursor: 'pointer' }}>Staff</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Book Transfer Section */}
              <div style={{ paddingBottom: '20px', borderBottom: `1px solid ${t.border}`, marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: t.textMain, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📦 Bücher übertragen
                </div>
                <p style={{ fontSize: '12px', color: t.textMuted, margin: '0 0 10px' }}>
                  Alle Bücher von <strong>{selectedUser.email}</strong> auf einen anderen Account verschieben:
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="email"
                    value={transferTargetEmail}
                    onChange={e => { setTransferTargetEmail(e.target.value); setTransferResult(null); }}
                    placeholder="Ziel-E-Mail des Empfängers..."
                    style={{ flex: 1, padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: `1px solid ${t.border}`, background: t.cardBg, color: t.textMain, outline: 'none' }}
                  />
                  <button
                    onClick={transferBooksToUser}
                    disabled={isTransferring || !transferTargetEmail.trim()}
                    style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 600, borderRadius: '6px', border: 'none', background: isTransferring ? t.cardBg : 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', cursor: isTransferring ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {isTransferring ? '...' : '📤 Übertragen'}
                  </button>
                </div>
                {transferResult && (
                  <div style={{ marginTop: '8px', fontSize: '13px', color: transferResult.startsWith('✅') ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                    {transferResult}
                  </div>
                )}
              </div>

              {/* Danger Zone */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#e11d48', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={16} /> Status: <span style={{textTransform: 'uppercase'}}>{selectedUser.status || 'active'}</span>
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  {selectedUser.status === 'banned' || selectedUser.status === 'frozen' ? (
                    <button onClick={() => setStatus(selectedUser.id, 'active')} disabled={isProcessing} style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 500, backgroundColor: 'transparent', color: t.textMain, border: `1px solid ${t.border}`, borderRadius: '6px', cursor: 'pointer' }}>Entsperren (Aktivieren)</button>
                  ) : (
                    <>
                      <button onClick={() => setStatus(selectedUser.id, 'frozen')} disabled={isProcessing} style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 500, backgroundColor: 'transparent', color: '#ea580c', border: '1px solid rgba(234, 88, 12, 0.3)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <PauseCircle size={14} /> Freeze
                      </button>
                      <button onClick={() => setStatus(selectedUser.id, 'banned')} disabled={isProcessing} style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 500, backgroundColor: 'transparent', color: '#e11d48', border: '1px solid rgba(225, 29, 72, 0.3)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldAlert size={14} /> Bannen
                      </button>
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Custom Keys Modal */}
      {showCustomKeysModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: t.bg, borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${t.border}`, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, backgroundColor: t.bg, zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <KeyRound size={20} color="#1a73e8" />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: t.textMain }}>Custom Keys</h3>
              </div>
              <button onClick={() => setShowCustomKeysModal(false)} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', display: 'flex' }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: '24px' }}>
              <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: t.textMuted, lineHeight: 1.5 }}>
                Erstelle eigene Lizenzschlüssel (z.B. für dein Team oder Tester). Diese Keys funktionieren anstelle von Gumroad. 
                <br/><strong style={{ color: t.textMain }}>Achtung:</strong> Wenn du einen Key löschst, verliert der Nutzer sofort den Pro-Zugang.
              </p>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX"
                    value={newCustomKey}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                      const formatted = raw.match(/.{1,8}/g)?.join('-') || '';
                      setNewCustomKey(formatted.substring(0, 35));
                    }}
                    style={{ flex: '1 1 200px', minWidth: '200px', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '14px', backgroundColor: t.cardBg, color: t.textMain, outline: 'none', fontFamily: 'monospace' }}
                  />
                  <input
                    type="number"
                    placeholder="Nutzungen (leer = endlos)"
                    value={newKeyMaxUses}
                    min="1"
                    onChange={e => setNewKeyMaxUses(e.target.value === '' ? '' : parseInt(e.target.value))}
                    style={{ flex: '1 1 180px', minWidth: '180px', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '14px', backgroundColor: t.cardBg, color: t.textMain, outline: 'none' }}
                  />
                  <input
                    type="date"
                    value={newKeyExpiresAt}
                    onChange={e => setNewKeyExpiresAt(e.target.value)}
                    style={{ flex: '1 1 150px', minWidth: '150px', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '14px', backgroundColor: t.cardBg, color: t.textMain, outline: 'none' }}
                  />
                  <button
                    onClick={createCustomKey}
                    disabled={isProcessing || !newCustomKey.trim()}
                    style={{ flex: '1 1 100px', minWidth: '120px', padding: '10px 20px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: isProcessing || !newCustomKey.trim() ? 'default' : 'pointer', opacity: isProcessing || !newCustomKey.trim() ? 0.6 : 1 }}
                  >
                    Generieren
                  </button>
                </div>
              </div>

              <div style={{ backgroundColor: t.cardBg, borderRadius: '8px', border: `1px solid ${t.border}`, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: t.headerBg, borderBottom: `1px solid ${t.border}` }}>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: t.textMuted }}>Key</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: t.textMuted }}>Details</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: t.textMuted }}>Genutzt von</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: t.textMuted, textAlign: 'right' }}>Aktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customKeys.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: t.textMuted }}>Keine Custom Keys vorhanden.</td>
                      </tr>
                    ) : (
                      customKeys.map(k => (
                        <tr key={k.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: t.textMain, fontFamily: 'monospace' }}>
                            {k.key}
                            <div style={{ fontSize: '11px', color: t.textMuted, fontWeight: 400, marginTop: '2px' }}>
                              Erstellt: {formatDate(k.created_at)}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', color: t.textMuted }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div>
                                Nutzungen: <span style={{ color: t.textMain }}>{k.current_uses || 0} / {k.max_uses || '∞'}</span>
                              </div>
                              <div>
                                Gültig bis: <span style={{ color: t.textMain }}>{k.expires_at ? formatDate(k.expires_at) : 'Dauerhaft'}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', color: k.used_by_emails ? t.textMain : t.textFaint }}>
                            {k.used_by_emails ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {k.used_by_emails.split(',').map((email: string, i: number) => (
                                  <div key={i} style={{ fontSize: '12px', wordBreak: 'break-all' }}>{email.trim()}</div>
                                ))}
                              </div>
                            ) : (
                              '— Unbenutzt —'
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <button
                              onClick={() => deleteCustomKey(k.key)}
                              disabled={isProcessing}
                              style={{ padding: '6px 12px', backgroundColor: 'transparent', color: '#dc2626', border: '1px solid rgba(220, 38, 38, 0.3)', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Löschen
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Module toggles Modal */}
      {showModulesModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: t.bg, borderRadius: '12px', width: '100%', maxWidth: '500px', border: `1px solid ${t.border}`, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sliders size={20} color="#10b981" />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: t.textMain }}>Module verwalten</h3>
              </div>
              <button onClick={() => setShowModulesModal(false)} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', display: 'flex' }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: t.textMuted, lineHeight: 1.5 }}>
                Schalte Module global für alle Standard-Nutzer ein oder aus. Als Admin siehst du diese Tabs weiterhin permanent.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                {[
                  { id: 'brain', label: 'Das Brain' },
                  { id: 'dashboard', label: 'Nischenfinder' },
                  { id: 'calculator', label: 'KDP Rechner' },
                  { id: 'studio', label: 'Buch Studio' }
                ].map(mod => {
                  const currentStatus = activeModules[mod.id] || 'active';
                  return (
                    <div key={mod.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', backgroundColor: t.headerBg, borderRadius: '8px', border: `1px solid ${t.border}` }}>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: t.textMain }}>{mod.label}</span>
                      <div style={{ display: 'flex', gap: '4px', backgroundColor: theme === 'dark' ? '#0a0a0a' : '#f3f4f6', padding: '2px', borderRadius: '6px', border: `1px solid ${t.border}` }}>
                        {[
                          { value: 'active', label: 'AN', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
                          { value: 'maintenance', label: 'Wartung', color: '#d97706', bg: 'rgba(217, 119, 6, 0.15)' },
                          { value: 'hidden', label: 'AUS', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' }
                        ].map(opt => {
                          const isSelected = currentStatus === opt.value || (opt.value === 'active' && currentStatus === true) || (opt.value === 'hidden' && currentStatus === false);
                          return (
                            <button
                              key={opt.value}
                              onClick={() => changeModuleStatus(mod.id, opt.value)}
                              disabled={isProcessing}
                              style={{
                                padding: '5px 10px',
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: isSelected ? opt.bg : 'transparent',
                                color: isSelected ? opt.color : t.textMuted,
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bug Reports Section */}
      {ownerToolbarTab === 'reports' && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bug size={16} color="#ef4444" />
              <span style={{ fontSize: '15px', fontWeight: 700, color: t.textMain }}>Bug Reports</span>
              <span style={{ fontSize: '11px', color: t.textMuted, background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '99px', padding: '2px 8px' }}>
                {bugReports.length}
              </span>
            </div>
            <button
              onClick={async () => {
                setLoadingReports(true);
                try {
                  const { data, error } = await supabase!.rpc('admin_get_bug_reports');
                  if (!error) {
                    setBugReports(data || []);
                  }
                } finally { setLoadingReports(false); }
              }}
              style={{ fontSize: '12px', color: t.textMuted, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RefreshCw size={12} style={{ animation: loadingReports ? 'spin 1s linear infinite' : 'none' }} />
              Neu laden
            </button>
          </div>

          {reportsError && (
            <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px' }}>{reportsError}</div>
          )}

          {loadingReports ? (
            <div style={{ textAlign: 'center', padding: '40px', color: t.textMuted, fontSize: '13px' }}>Lade Reports...</div>
          ) : bugReports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: t.textMuted, fontSize: '13px' }}>Keine Bug Reports vorhanden.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {bugReports.map((report: any) => (
                <div
                  key={report.id}
                  style={{
                    background: t.cardBg,
                    border: `1px solid ${t.border}`,
                    borderRadius: '8px',
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {report.category && (
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#f97316', background: 'rgba(249,115,22,0.1)', borderRadius: '4px', padding: '2px 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {report.category}
                        </span>
                      )}
                      <span style={{ fontSize: '13px', fontWeight: 600, color: t.textMain }}>
                        {report.title || 'Kein Titel'}
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', color: t.textMuted, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                      {report.created_at ? new Date(report.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: t.textMuted, margin: '0 0 8px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {report.description}
                  </p>
                  <div style={{ fontSize: '11px', color: t.textFaint }}>
                    {report.user_email || 'Anonym'} {report.user_id ? `· ${report.user_id.slice(0, 8)}…` : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Maintenance Modal */}
      {showMaintenanceModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setShowMaintenanceModal(false)}>
          <div 
            style={{ backgroundColor: t.cardBg, borderRadius: '12px', width: '100%', maxWidth: '400px', border: `1px solid ${t.border}`, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: t.bg }}>
              <div style={{ fontWeight: 600, fontSize: '16px', color: t.textMain, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={18} color="#dc2626" /> Wartungsmodus aktivieren
              </div>
              <button onClick={() => setShowMaintenanceModal(false)} style={{ background: 'transparent', border: 'none', color: t.textMuted, cursor: 'pointer', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <p style={{ fontSize: '13px', color: t.textMuted, marginBottom: '20px', lineHeight: '1.5' }}>
                Wenn der Wartungsmodus aktiv ist, haben nur noch Administratoren (Du) Zugriff auf das Studio. Alle anderen Nutzer werden ausgesperrt.
              </p>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: t.textMain, marginBottom: '8px' }}>Angezeigte Nachricht</label>
                <textarea 
                  value={maintenanceMessage}
                  onChange={e => setMaintenanceMessage(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: t.textMain, marginBottom: '8px' }}>Automatischer Timer (Optional)</label>
                <input 
                  type="datetime-local" 
                  value={maintenanceEndsAtInput}
                  onChange={e => setMaintenanceEndsAtInput(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
                <div style={{ fontSize: '11px', color: t.textFaint, marginTop: '6px' }}>
                  Wähle ein Datum, wann das System automatisch wieder freigeschaltet werden soll.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                <button 
                  onClick={() => confirmMaintenanceOn(false)}
                  style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: 600, backgroundColor: t.bg, color: t.textMain, border: `1px solid ${t.border}`, borderRadius: '6px', cursor: 'pointer' }}
                >
                  Unbefristet aktivieren
                </button>
                <button 
                  onClick={() => confirmMaintenanceOn(true)}
                  style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: 600, backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Mit Timer aktivieren
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .55; transform: scale(1.18); } }
      `}</style>
    </div>
  );
}

function MetricCard({ t, title, value, compact = false }: { t: any, title: string, value: string, compact?: boolean }) {
  return (
    <div style={{ backgroundColor: t.cardBg, border: `1px solid ${t.border}`, borderRadius: compact ? '6px' : '8px', padding: compact ? '10px 12px' : '16px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: t.textMuted, marginBottom: compact ? '4px' : '8px', fontSize: compact ? '11px' : '12px', fontWeight: 500 }}>
        {title}
      </div>
      <div style={{ fontSize: compact ? '18px' : '22px', fontWeight: 600, color: t.textMain }}>{value}</div>
    </div>
  );
}

function OwnerToolbarButton({
  active,
  icon,
  label,
  onClick,
  disabled = false,
  isDark = true,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  isDark?: boolean;
}) {
  const activeBg     = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)';
  const inactiveBg   = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const hoverBg      = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)';
  const activeBorder = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)';
  const inactiveBorder=isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)';
  const activeColor  = isDark ? '#ffffff'                : '#111827';
  const inactiveColor= isDark ? '#94a3b8'                : '#6b7280';
  const hoverColor   = isDark ? '#e2e8f0'                : '#374151';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '7px',
        padding: '9px 14px',
        fontSize: '12px',
        fontWeight: 600,
        borderRadius: '8px',
        border: `1px solid ${active ? activeBorder : inactiveBorder}`,
        background: active ? activeBg : inactiveBg,
        color: active ? activeColor : inactiveColor,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={e => {
        if (!disabled && !active) {
          (e.currentTarget as HTMLButtonElement).style.background = hoverBg;
          (e.currentTarget as HTMLButtonElement).style.color = hoverColor;
        }
      }}
      onMouseLeave={e => {
        if (!disabled && !active) {
          (e.currentTarget as HTMLButtonElement).style.background = inactiveBg;
          (e.currentTarget as HTMLButtonElement).style.color = inactiveColor;
        }
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
