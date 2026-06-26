import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase';
import { X, Key, Mail, Lock, LogIn, UserPlus, Globe, HelpCircle } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: () => void;
  onClose?: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess, onClose }) => {
  const [isSetup, setIsSetup] = useState(!isFirebaseConfigured());
  const [firebaseConfigInput, setFirebaseConfigInput] = useState('');
  const [setupError, setSetupError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Parse and save Firebase configuration entered by user
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError(null);

    let configStr = firebaseConfigInput.trim();
    if (!configStr) {
      setSetupError('Bitte füge eine Firebase-Konfiguration ein.');
      return;
    }

    // Try to extract JSON from javascript snippet if they paste the whole script
    if (configStr.includes('const firebaseConfig =')) {
      const match = configStr.match(/const firebaseConfig = ({[\s\S]*?});/);
      if (match && match[1]) {
        configStr = match[1];
      }
    }

    // Clean up typical JS syntax to make it valid JSON
    // e.g. unquoted keys, trailing commas, single quotes
    let cleanJson = configStr
      .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') // Quote keys
      .replace(/'/g, '"') // Replace single quotes with double quotes
      .replace(/,\s*([}\]])/g, '$1'); // Remove trailing commas

    try {
      const parsed = JSON.parse(cleanJson);
      if (!parsed.apiKey || !parsed.projectId || !parsed.appId) {
        setSetupError('Ungültige Konfiguration. Die Felder apiKey, projectId und appId sind zwingend erforderlich.');
        return;
      }

      localStorage.setItem('b24studio_firebase_config', JSON.stringify(parsed));
      // Reload page to re-initialize firebase with the new config
      window.location.reload();
    } catch (err: any) {
      setSetupError(`Ungültiges Format. Bitte kopiere das firebaseConfig-Objekt aus der Firebase Console. Fehler: ${err.message}`);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!auth) {
      setError('Firebase ist nicht korrekt konfiguriert.');
      setLoading(false);
      return;
    }

    try {
      if (activeTab === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onAuthSuccess();
    } catch (err: any) {
      console.error(err);
      let friendlyMsg = err.message;
      if (err.code === 'auth/invalid-credential') {
        friendlyMsg = 'Ungültige E-Mail-Adresse oder falsches Passwort.';
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyMsg = 'Diese E-Mail-Adresse wird bereits verwendet.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMsg = 'Das Passwort muss mindestens 6 Zeichen lang sein.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMsg = 'Ungültiges E-Mail-Format.';
      }
      setError(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);

    if (!auth) {
      setError('Firebase ist nicht korrekt konfiguriert.');
      setLoading(false);
      return;
    }

    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onAuthSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Render Setup Assistant if Firebase is not configured yet
  if (isSetup) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center', fontFamily: "'Poppins', sans-serif", padding: '24px', boxSizing: 'border-box', position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
        <div style={{ backgroundColor: '#1e1f20', borderRadius: '12px', border: '1px solid #2e2f30', width: '100%', maxWidth: '560px', padding: '36px', color: '#e3e3e3', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', boxSizing: 'border-box' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 800, color: '#ffffff' }}>Book24 Studio</h2>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(11, 87, 208, 0.15)', color: '#a8c7fa', padding: '6px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 'bold' }}>
              <Key style={{ width: '14px', height: '14px' }} />
              Firebase Setup benötigt
            </div>
          </div>

          <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#c4c7c5', marginBottom: '24px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px dashed #3c4043' }}>
            <strong style={{ color: '#ffffff', display: 'block', marginBottom: '8px' }}>Schritte zur Einrichtung:</strong>
            <ol style={{ margin: '0', paddingLeft: '20px' }}>
              <li>Gehe zur <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" style={{ color: '#a8c7fa', textDecoration: 'underline' }}>Firebase Console</a> & erstelle ein Projekt.</li>
              <li>Aktiviere **Authentication** (Google & E-Mail/Passwort) im Auth-Menü.</li>
              <li>Erstelle eine **Cloud Firestore** Datenbank im Testmodus.</li>
              <li>Füge eine neue **Web-App** hinzu und kopiere das <code>firebaseConfig</code> Objekt hier unten ein.</li>
            </ol>
          </div>

          <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffffff' }}>Firebase SDK Konfiguration</label>
              <textarea
                rows={7}
                placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "...",\n  projectId: "...",\n  ...\n};`}
                value={firebaseConfigInput}
                onChange={e => setFirebaseConfigInput(e.target.value)}
                style={{ padding: '12px 14px', fontSize: '13px', fontFamily: 'monospace', backgroundColor: '#121212', border: '1px solid #3c4043', borderRadius: '6px', color: '#e3e3e3', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {setupError && (
              <div style={{ color: '#f2b8b5', fontSize: '13px', lineHeight: '1.4', backgroundColor: 'rgba(242, 184, 181, 0.1)', padding: '10px 14px', borderRadius: '6px', border: '1px solid rgba(242, 184, 181, 0.2)' }}>
                {setupError}
              </div>
            )}

            <button
              type="submit"
              style={{ padding: '12px', fontSize: '14px', fontWeight: 'bold', backgroundColor: '#0b57d0', border: 'none', borderRadius: '6px', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background-color 0.2s' }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#0842a0'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = '#0b57d0'}
            >
              <Globe style={{ width: '16px', height: '16px' }} />
              Verbinden & Initialisieren
            </button>
          </form>

        </div>
      </div>
    );
  }

  // Render standard Login/Register page
  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', backgroundColor: onClose ? 'rgba(0,0,0,0.7)' : '#121212', backdropFilter: onClose ? 'blur(10px)' : 'none', alignItems: 'center', justifyContent: 'center', fontFamily: "'Poppins', sans-serif", padding: '24px', boxSizing: 'border-box', position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
      <div style={{ position: 'relative', backgroundColor: '#1e1f20', borderRadius: '12px', border: '1px solid #2e2f30', width: '100%', maxWidth: '420px', padding: '36px', color: '#e3e3e3', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', boxSizing: 'border-box' }}>
        
        {onClose && (
          <button 
            onClick={onClose}
            style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#8e918f', cursor: 'pointer', padding: '4px' }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        )}

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>Book24 Studio</h2>
          <p style={{ margin: '0', fontSize: '13px', color: '#c4c7c5' }}>Erstelle professionelle KDP-Bücher in Minuten</p>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', borderBottom: '1px solid #2e2f30', marginBottom: '24px' }}>
          <button
            onClick={() => { setActiveTab('login'); setError(null); }}
            style={{ flex: 1, padding: '12px', fontSize: '13.5px', fontWeight: activeTab === 'login' ? 'bold' : 'normal', color: activeTab === 'login' ? '#0b57d0' : '#c4c7c5', border: 'none', borderBottom: activeTab === 'login' ? '2px solid #0b57d0' : 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
          >
            Anmelden
          </button>
          <button
            onClick={() => { setActiveTab('register'); setError(null); }}
            style={{ flex: 1, padding: '12px', fontSize: '13.5px', fontWeight: activeTab === 'register' ? 'bold' : 'normal', color: activeTab === 'register' ? '#0b57d0' : '#c4c7c5', border: 'none', borderBottom: activeTab === 'register' ? '2px solid #0b57d0' : 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
          >
            Registrieren
          </button>
        </div>

        {/* Google Sign-in */}
        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 'bold', backgroundColor: '#ffffff', border: '1px solid #dadce0', borderRadius: '100px', color: '#1f1f1f', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px', transition: 'background-color 0.2s', boxSizing: 'border-box' }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8f9fa'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = '#ffffff'}
        >
          <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.1.8-2.1 2.77v2.3h3.25c1.9-1.75 3-4.33 3-6.92z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.89-3.02c-1.08.72-2.48 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.85v3.12C3.83 20.25 7.6 24 12 24z"/>
            <path fill="#FBBC05" d="M5.27 14.27c-.25-.72-.39-1.5-.39-2.27s.14-1.55.39-2.27V6.6H1.85C1 8.27.5 10.09.5 12s.5 3.73 1.35 5.4l3.42-3.13z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.96 1.19 15.24 0 12 0 7.6 0 3.83 3.75 1.85 7.65l3.42 3.13c.95-2.85 3.6-4.96 6.73-4.96z"/>
          </svg>
          Mit Google anmelden
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#8e918f', fontSize: '12px', marginBottom: '24px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#2e2f30' }}></div>
          <span>ODER MIT E-MAIL</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#2e2f30' }}></div>
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: '#c4c7c5' }}>E-Mail-Adresse</label>
            <div style={{ position: 'relative', width: '100%', boxSizing: 'border-box' }}>
              <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#8e918f' }} />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@beispiel.de"
                style={{ padding: '12px 12px 12px 38px', fontSize: '14px', backgroundColor: '#121212', border: '1px solid #3c4043', borderRadius: '6px', color: '#ffffff', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: '#c4c7c5' }}>Passwort</label>
            <div style={{ position: 'relative', width: '100%', boxSizing: 'border-box' }}>
              <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#8e918f' }} />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ padding: '12px 12px 12px 38px', fontSize: '14px', backgroundColor: '#121212', border: '1px solid #3c4043', borderRadius: '6px', color: '#ffffff', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {error && (
            <div style={{ color: '#f2b8b5', fontSize: '13px', lineHeight: '1.4', backgroundColor: 'rgba(242, 184, 181, 0.1)', padding: '10px 14px', borderRadius: '6px', border: '1px solid rgba(242, 184, 181, 0.2)' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 'bold', backgroundColor: '#0b57d0', border: 'none', borderRadius: '100px', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px', transition: 'background-color 0.2s', boxSizing: 'border-box' }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#0842a0'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#0b57d0'}
          >
            {loading ? (
              <span>Wird geladen...</span>
            ) : activeTab === 'login' ? (
              <>
                <LogIn style={{ width: '16px', height: '16px' }} />
                Anmelden
              </>
            ) : (
              <>
                <UserPlus style={{ width: '16px', height: '16px' }} />
                Registrieren
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '28px', textAlign: 'center', borderTop: '1px solid #2e2f30', paddingTop: '20px' }}>
          <button 
            onClick={() => setIsSetup(true)}
            style={{ fontSize: '11.5px', color: '#8e918f', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <HelpCircle style={{ width: '12px', height: '12px' }} />
            Firebase Verbindung ändern
          </button>
        </div>
      </div>
    </div>
  );
};
