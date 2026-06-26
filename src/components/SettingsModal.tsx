import React, { useState } from 'react';
import { X, Key, Sun, Moon, Cpu, Settings, CheckCircle2, AlertCircle } from 'lucide-react';

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
  groqKeys: string;
  onGroqKeysChange: (value: string) => void;
  geminiKeys: string;
  onGeminiKeysChange: (value: string) => void;
  selectedModel: string;
  onModelChange: (value: string) => void;
  groqConnected: boolean;
  geminiConnected: boolean;
  userEmail?: string | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onClose,
  theme,
  onThemeChange,
  groqKeys,
  onGroqKeysChange,
  geminiKeys,
  onGeminiKeysChange,
  selectedModel,
  onModelChange,
  groqConnected,
  geminiConnected,
  userEmail,
}) => {
  const [tab, setTab] = useState<SettingsTab>('general');

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
                <div className="theme-switch">
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
      <textarea
        className="settings-textarea"
        rows={3}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
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
