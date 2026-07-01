import React, { useState, useEffect } from 'react';
import { X, Key, Sun, Moon, Cpu, Settings, CheckCircle2, AlertCircle, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { supabase } from '../supabase';

export const AI_MODEL_OPTIONS = [
  { group: 'Groq API', models: [
    { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B — Top Qualität' },
    { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B — Schnell' },
    { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
  ]},
  { group: 'Google Gemini', models: [
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  ]},
];

type SettingsTab = 'general' | 'api' | 'model';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  onThemeChange: (theme: 'dark' | 'light') => void;
  language?: 'de' | 'en';
  onLanguageChange?: (lang: 'de' | 'en') => void;
  groqKeys: string;
  onGroqKeysChange: (value: string) => void;
  geminiKeys: string;
  onGeminiKeysChange: (value: string) => void;
  selectedModel: string;
  onModelChange: (value: string) => void;
  groqConnected: boolean;
  geminiConnected: boolean;
  userEmail?: string | null;
  userId?: string | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onClose,
  theme,
  onThemeChange,
  language = 'de',
  onLanguageChange,
  groqKeys,
  onGroqKeysChange,
  geminiKeys,
  onGeminiKeysChange,
  selectedModel,
  onModelChange,
  groqConnected,
  geminiConnected,
  userEmail,
  userId,
}) => {
  const [tab, setTab] = useState<SettingsTab>('general');
  const [username, setUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showUserId, setShowUserId] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load username
  useEffect(() => {
    if (!open || !userId || !supabase) return;
    const loadProfile = async () => {
      try {
        const { data } = await supabase!
          .from('profiles')
          .select('username')
          .eq('id', userId)
          .single();
        if (data && 'username' in data && data.username) {
          setUsername(data.username);
        } else {
          setUsername('');
        }
      } catch (e) {
        console.error('Failed to load profile:', e);
      }
    };
    loadProfile();
  }, [open, userId]);

  // Save username
  const handleSaveUsername = async () => {
    if (!userId || !supabase) return;
    
    const trimmed = username.trim();
    if (trimmed.length > 0 && trimmed.length < 3) {
      setSaveMessage('Fehler: Der Name muss mindestens 3 Zeichen lang sein.');
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);
    try {
      const { error } = await supabase!
        .from('profiles')
        .update({ username: trimmed === '' ? null : trimmed })
        .eq('id', userId);
      if (error) throw error;
      setSaveMessage('Name erfolgreich gespeichert!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (e: any) {
      console.error(e);
      let errMsg = 'Speichern fehlgeschlagen';
      if (e.message && (e.message.includes('unique_username') || e.message.includes('duplicate key'))) {
        errMsg = 'Dieser Benutzername ist bereits vergeben.';
      } else if (e.code === '23505') {
        errMsg = 'Dieser Benutzername ist bereits vergeben.';
      } else {
        errMsg = e.message || errMsg;
      }
      setSaveMessage(`Fehler: ${errMsg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyId = () => {
    if (!userId) return;
    navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open) return null;

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'Allgemein', icon: <Settings style={{ width: 14, height: 14 }} /> },
    { id: 'api', label: 'API Keys', icon: <Key style={{ width: 14, height: 14 }} /> },
    { id: 'model', label: 'KI-Modell', icon: <Cpu style={{ width: 14, height: 14 }} /> },
  ];

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <div>
            <h2 className="settings-title">Einstellungen</h2>
            {userEmail && <p className="settings-subtitle">{userEmail}</p>}
          </div>
          <button type="button" className="settings-close" onClick={onClose} aria-label="Schließen">
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div className="settings-body">
          <nav className="settings-nav">
            {tabs.map(t => (
              <button
                key={t.id}
                type="button"
                className={`settings-nav-btn${tab === t.id ? ' active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.icon}
                {t.label}
                {t.id === 'api' && (!groqConnected || !geminiConnected) && (
                  <span className="settings-nav-dot" />
                )}
              </button>
            ))}
          </nav>

          <div className="settings-content">
            {tab === 'general' && (
              <>
                <SectionTitle>Erscheinungsbild</SectionTitle>
                <p className="settings-hint">Wähle zwischen hellem und dunklem Interface.</p>
                <div className="theme-switch" style={{ marginBottom: '24px' }}>
                  <button
                    type="button"
                    className={`theme-switch-btn${theme === 'light' ? ' active' : ''}`}
                    onClick={() => onThemeChange('light')}
                  >
                    <Sun style={{ width: 16, height: 16 }} />
                    Hell
                  </button>
                  <button
                    type="button"
                    className={`theme-switch-btn${theme === 'dark' ? ' active' : ''}`}
                    onClick={() => onThemeChange('dark')}
                  >
                    <Moon style={{ width: 16, height: 16 }} />
                    Dunkel
                  </button>
                </div>

                <SectionTitle>Sprache / Language</SectionTitle>
                <p className="settings-hint">Wähle die Sprache der Benutzeroberfläche.</p>
                <div className="theme-switch" style={{ marginBottom: '24px' }}>
                  <button
                    type="button"
                    className={`theme-switch-btn${language === 'de' ? ' active' : ''}`}
                    onClick={() => onLanguageChange?.('de')}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    🇩🇪 Deutsch
                  </button>
                  <button
                    type="button"
                    className={`theme-switch-btn${language === 'en' ? ' active' : ''}`}
                    onClick={() => onLanguageChange?.('en')}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    🇬🇧 English
                  </button>
                </div>

                <SectionTitle>Profilname</SectionTitle>
                <p className="settings-hint">Ändere deinen Namen, der in der Bibliothek angezeigt wird.</p>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-main)',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                    placeholder="Dein Profilname"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveUsername}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 600,
                      backgroundColor: 'var(--primary)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    {isSaving ? 'Speichert...' : 'Speichern'}
                  </button>
                </div>
                {saveMessage && (
                  <p style={{
                    margin: '0 0 24px 0',
                    fontSize: '12px',
                    color: saveMessage.includes('Fehler') ? '#dc2626' : '#10b981',
                    fontWeight: 500
                  }}>
                    {saveMessage}
                  </p>
                )}

                <div style={{ height: '16px' }} />

                <SectionTitle>Benutzer-ID (UUID)</SectionTitle>
                <p className="settings-hint">Deine eindeutige System-Identifikationsnummer.</p>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  backgroundColor: theme === 'dark' ? '#0f172a' : '#f1f5f9', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '6px', 
                  padding: '8px 12px', 
                  marginBottom: '16px' 
                }}>
                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: 'var(--text-main)',
                    flex: 1,
                    letterSpacing: '0.02em',
                    wordBreak: 'break-all',
                    userSelect: showUserId ? 'all' : 'none'
                  }}>
                    {showUserId ? userId : '••••••••-••••-••••-••••-••••••••••••'}
                  </span>
                  
                  <button
                    type="button"
                    onClick={() => setShowUserId(!showUserId)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', display: 'flex', alignItems: 'center' }}
                    title={showUserId ? 'Verbergen' : 'Anzeigen'}
                  >
                    {showUserId ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyId}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', display: 'flex', alignItems: 'center' }}
                    title="Kopieren"
                  >
                    {copied ? <Check size={16} style={{ color: '#10b981' }} /> : <Copy size={16} />}
                  </button>
                </div>
              </>
            )}

            {tab === 'api' && (
              <>
                <SectionTitle>API-Verbindungen</SectionTitle>
                <p className="settings-hint">
                  Keys werden lokal im Browser gespeichert. Bei Rate-Limits rotiert das System automatisch zum nächsten Key.
                </p>

                <ApiKeyBlock
                  label="Groq API Keys"
                  hint="Llama / Mixtral — kostenlos"
                  link="https://console.groq.com/keys"
                  linkLabel="Keys erstellen"
                  placeholder="gsk_...&#10;(Mehrere Keys durch Komma oder Zeilenumbruch)"
                  value={groqKeys}
                  onChange={onGroqKeysChange}
                  connected={groqConnected}
                />

                <ApiKeyBlock
                  label="Gemini API Keys"
                  hint="Google AI Studio"
                  link="https://aistudio.google.com/app/apikey"
                  linkLabel="Keys holen"
                  placeholder="AIzaSy...&#10;(Mehrere Keys durch Komma oder Zeilenumbruch)"
                  value={geminiKeys}
                  onChange={onGeminiKeysChange}
                  connected={geminiConnected}
                />
              </>
            )}

            {tab === 'model' && (
              <>
                <SectionTitle>KI-Modell</SectionTitle>
                <p className="settings-hint">Standardmodell für Planung, Schreiben und Marketing.</p>
                <label className="settings-label">Aktives Modell</label>
                <select
                  className="settings-select"
                  value={selectedModel}
                  onChange={e => onModelChange(e.target.value)}
                >
                  {AI_MODEL_OPTIONS.map(g => (
                    <optgroup key={g.group} label={g.group}>
                      {g.models.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <div className="settings-status-row">
                  <StatusPill ok={groqConnected} label="Groq" />
                  <StatusPill ok={geminiConnected} label="Gemini" />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="settings-section-title">{children}</h3>;
}

function ApiKeyBlock({
  label, hint, link, linkLabel, placeholder, value, onChange, connected,
}: {
  label: string;
  hint: string;
  link: string;
  linkLabel: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  connected: boolean;
}) {
  const [newKey, setNewKey] = useState('');
  const keys = value.split(/[\n,]+/).map(k => k.trim()).filter(Boolean);

  const updateKey = (index: number, newKeyVal: string) => {
    const newKeys = [...keys];
    newKeys[index] = newKeyVal;
    onChange(newKeys.filter(Boolean).join(','));
  };

  const removeKey = (index: number) => {
    const newKeys = [...keys];
    newKeys.splice(index, 1);
    onChange(newKeys.join(','));
  };

  const handleAddKey = () => {
    if (newKey.trim()) {
      onChange([...keys, newKey.trim()].join(','));
      setNewKey('');
    }
  };

  return (
    <div className="settings-api-block">
      <div className="settings-api-head">
        <div>
          <span className="settings-label">{label}</span>
          <span className="settings-api-hint">{hint}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {connected ? (
            <span className="settings-badge ok"><CheckCircle2 style={{ width: 12, height: 12 }} /> Verbunden</span>
          ) : (
            <span className="settings-badge warn"><AlertCircle style={{ width: 12, height: 12 }} /> Fehlt</span>
          )}
          <a href={link} target="_blank" rel="noreferrer" className="settings-link">{linkLabel} →</a>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
        {keys.map((key, index) => (
          <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', width: '20px' }}>#{index + 1}</span>
            <input
              type="text"
              className="settings-textarea"
              style={{ padding: '6px 10px', height: '32px', margin: 0, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              placeholder={placeholder.split('\n')[0]}
              value={key}
              onChange={e => updateKey(index, e.target.value)}
            />
            <button 
              onClick={() => removeKey(index)}
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Key entfernen"
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', width: '20px' }}>#{keys.length + 1}</span>
          <input
            type="text"
            className="settings-textarea"
            style={{ padding: '6px 10px', height: '32px', margin: 0, flex: 1 }}
            placeholder="Neuen API Key hier einfügen..."
            value={newKey}
            onChange={e => setNewKey(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddKey();
              }
            }}
          />
          <button
            onClick={handleAddKey}
            style={{
              padding: '0 12px',
              height: '32px',
              backgroundColor: 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Hinzufügen
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Das System rotiert bei Pausen automatisch durch die Liste!
        </span>
      </div>
    </div>
  );
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`settings-badge${ok ? ' ok' : ' warn'}`}>
      {ok ? <CheckCircle2 style={{ width: 12, height: 12 }} /> : <AlertCircle style={{ width: 12, height: 12 }} />}
      {label} {ok ? 'bereit' : 'Key fehlt'}
    </span>
  );
}

export default SettingsModal;
