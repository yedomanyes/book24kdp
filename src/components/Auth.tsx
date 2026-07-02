import React, { useState } from 'react';
import { X, Mail, Lock } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { logActivity } from '../lib/activity';

interface AuthProps {
  onAuthSuccess: () => void;
  onClose?: () => void;
  language?: 'de' | 'en';
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess, onClose, language = 'de' }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isDe = language === 'de';

  // Meta-style clean aesthetics (Enterprise Look)
  const theme = {
    bg: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.4)',
    panelBorder: '#dadce0',
    textMain: '#202124',
    textMuted: '#5f6368',
    inputBorder: '#dadce0',
    inputFocus: '#1a73e8',
    primaryBtn: '#1a73e8',
    primaryBtnHover: '#1557b0',
    googleBtnBorder: '#dadce0',
    googleBtnBg: '#ffffff',
    googleBtnHover: '#f8f9fa',
    errorBg: '#fce8e6',
    errorText: '#d93025'
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!supabase || !isSupabaseConfigured()) {
      setError(isDe ? 'Systemkonfigurationsfehler. Bitte überprüfe die Umgebungsvariablen.' : 'System configuration error. Please check environment variables.');
      setLoading(false);
      return;
    }

    try {
      if (activeTab === 'login') {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;
        await logActivity('Login', isDe ? 'Nutzer hat sich eingeloggt (Email/Passwort).' : 'User logged in (Email/Password).');
        onAuthSuccess();
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (signUpError) throw signUpError;
        
        await logActivity('Registration', isDe ? 'Neuer Nutzer hat sich registriert.' : 'New user registered.');
        onAuthSuccess();
      }
    } catch (err: any) {
      console.error(err);
      let friendlyMsg = err?.message || (isDe ? 'Authentifizierung fehlgeschlagen.' : 'Authentication failed.');
      if (err?.message?.includes('Invalid login credentials')) {
        friendlyMsg = isDe ? 'Ungültige E-Mail-Adresse oder Passwort.' : 'Invalid email or password.';
      } else if (err?.message?.includes('User already registered')) {
        friendlyMsg = isDe ? 'Diese E-Mail-Adresse ist bereits registriert.' : 'This email is already registered.';
      } else if (err?.message?.includes('Password should be at least')) {
        friendlyMsg = isDe ? 'Das Passwort muss mindestens 6 Zeichen lang sein.' : 'Password must be at least 6 characters.';
      }
      setError(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);

    if (!supabase || !isSupabaseConfigured()) {
      setError(isDe ? 'Systemkonfigurationsfehler.' : 'System configuration error.');
      setLoading(false);
      return;
    }

    try {
      const redirectUrl = window.location.origin.replace(/\/$/, '');
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        },
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      console.error(err);
      setError(err?.message || (isDe ? 'Google-Login fehlgeschlagen. Bitte versuche es erneut.' : 'Google sign-in failed. Please try again.'));
      setLoading(false);
    }
  };

  if (!isSupabaseConfigured()) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', backgroundColor: '#f0f2f5', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', padding: '24px', boxSizing: 'border-box', position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
        <div style={{ backgroundColor: theme.bg, borderRadius: '8px', border: `1px solid ${theme.panelBorder}`, width: '100%', maxWidth: '450px', padding: '32px', color: theme.textMain, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: 600 }}>{isDe ? 'Systemkonfiguration erforderlich' : 'System Setup Required'}</h2>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, color: theme.textMuted }}>
            {isDe ? 'Supabase ist nicht konfiguriert. Bitte hinterlege VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY in deiner .env.local Datei.' : 'Supabase is not configured. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', backgroundColor: onClose ? theme.overlay : '#f0f2f5', backdropFilter: onClose ? 'none' : 'none', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', padding: '24px', boxSizing: 'border-box', position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
      <div style={{ position: 'relative', backgroundColor: theme.bg, borderRadius: '8px', border: onClose ? `1px solid ${theme.panelBorder}` : 'none', width: '100%', maxWidth: '400px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', boxSizing: 'border-box' }}>
        <div style={{ padding: '32px 40px', position: 'relative' }}>
        {onClose && (
          <button 
            onClick={onClose}
            style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, padding: '4px' }}
          >
            <X size={20} />
          </button>
        )}

            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 600, color: theme.textMain, letterSpacing: '-0.01em' }}>Book24 Workspace</h2>
              <p style={{ margin: 0, fontSize: '14px', color: theme.textMuted }}>{isDe ? 'Melde dich an, um fortzufahren' : 'Sign in to continue to your dashboard'}</p>
            </div>

            <button
              onClick={handleGoogleAuth}
              disabled={loading}
              style={{ width: '100%', padding: '10px 16px', fontSize: '14px', fontWeight: 500, backgroundColor: theme.googleBtnBg, border: `1px solid ${theme.googleBtnBorder}`, borderRadius: '6px', color: theme.textMain, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '24px', transition: 'background-color 0.2s', boxSizing: 'border-box' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme.googleBtnHover}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = theme.googleBtnBg}
            >
              <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.1.8-2.1 2.77v2.3h3.25c1.9-1.75 3-4.33 3-6.92z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.89-3.02c-1.08.72-2.48 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.85v3.12C3.83 20.25 7.6 24 12 24z"/>
                <path fill="#FBBC05" d="M5.27 14.27c-.25-.72-.39-1.5-.39-2.27s.14-1.55.39-2.27V6.6H1.85C1 8.27.5 10.09.5 12s.5 3.73 1.35 5.4l3.42-3.13z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.96 1.19 15.24 0 12 0 7.6 0 3.83 3.75 1.85 7.65l3.42 3.13c.95-2.85 3.6-4.96 6.73-4.96z"/>
              </svg>
              {isDe ? 'Weiter mit Google' : 'Continue with Google'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: theme.textMuted, fontSize: '12px', marginBottom: '24px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: theme.panelBorder }}></div>
              <span style={{ fontWeight: 500 }}>{isDe ? 'ODER E-MAIL' : 'OR EMAIL'}</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: theme.panelBorder }}></div>
            </div>

            <div style={{ display: 'flex', borderBottom: `1px solid ${theme.panelBorder}`, marginBottom: '24px' }}>
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setError(null); }}
                style={{ flex: 1, padding: '10px', fontSize: '14px', fontWeight: activeTab === 'login' ? 600 : 400, color: activeTab === 'login' ? theme.primaryBtn : theme.textMuted, border: 'none', borderBottom: activeTab === 'login' ? `2px solid ${theme.primaryBtn}` : '2px solid transparent', backgroundColor: 'transparent', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                {isDe ? 'Einloggen' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setError(null); }}
                style={{ flex: 1, padding: '10px', fontSize: '14px', fontWeight: activeTab === 'register' ? 600 : 400, color: activeTab === 'register' ? theme.primaryBtn : theme.textMuted, border: 'none', borderBottom: activeTab === 'register' ? `2px solid ${theme.primaryBtn}` : '2px solid transparent', backgroundColor: 'transparent', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                {isDe ? 'Registrieren' : 'Register'}
              </button>
            </div>

            <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: theme.textMain }}>{isDe ? 'E-Mail Adresse' : 'Email Address'}</label>
                <div style={{ position: 'relative', width: '100%', boxSizing: 'border-box' }}>
                  <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: theme.textMuted }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={isDe ? 'name@firma.de' : 'name@company.com'}
                    style={{ padding: '10px 12px 10px 36px', fontSize: '14px', backgroundColor: '#fff', border: `1px solid ${theme.inputBorder}`, borderRadius: '6px', color: theme.textMain, width: '100%', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s' }}
                    onFocus={(e) => e.target.style.borderColor = theme.inputFocus}
                    onBlur={(e) => e.target.style.borderColor = theme.inputBorder}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: theme.textMain }}>{isDe ? 'Passwort' : 'Password'}</label>
                <div style={{ position: 'relative', width: '100%', boxSizing: 'border-box' }}>
                  <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: theme.textMuted }} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ padding: '10px 12px 10px 36px', fontSize: '14px', backgroundColor: '#fff', border: `1px solid ${theme.inputBorder}`, borderRadius: '6px', color: theme.textMain, width: '100%', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s' }}
                    onFocus={(e) => e.target.style.borderColor = theme.inputFocus}
                    onBlur={(e) => e.target.style.borderColor = theme.inputBorder}
                  />
                </div>
              </div>

              {error && (
                <div style={{ color: theme.errorText, fontSize: '13px', lineHeight: '1.4', backgroundColor: theme.errorBg, padding: '12px', borderRadius: '6px', border: `1px solid rgba(217, 48, 37, 0.2)` }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 600, backgroundColor: theme.primaryBtn, border: 'none', borderRadius: '6px', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px', transition: 'background-color 0.2s', boxSizing: 'border-box' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme.primaryBtnHover}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = theme.primaryBtn}
              >
                {loading ? (
                  <span>{isDe ? 'Wird geladen...' : 'Loading...'}</span>
                ) : (
                  <span style={{ color: '#ffffff' }}>
                    {activeTab === 'login' ? (isDe ? 'Jetzt einloggen' : 'Sign In Now') : (isDe ? 'Konto erstellen' : 'Create Account')}
                  </span>
                )}
              </button>
            </form>

        </div>
      </div>
    </div>
  );
};

export default Auth;
