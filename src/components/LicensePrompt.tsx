import React, { useState, useEffect } from 'react';
import { KeyRound, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';

interface LicensePromptProps {
  onValidLicense: (key: string) => void;
  onCancel?: () => void;
  language?: 'de' | 'en';
}

export const LicensePrompt: React.FC<LicensePromptProps> = ({ onValidLicense, onCancel, language = 'de' }) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const purchaseLink = 'https://book24studio.gumroad.com/l/howtbr';
  const isDe = language === 'de';

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKey.trim()) return;

    setError(null);
    setIsValidating(true);

    try {
      if (!supabase) throw new Error('System error: database not connected.');

      // 1. Try Custom License First
      const { data: isCustomValid } = await supabase.rpc('verify_custom_license', { p_key: licenseKey.trim() });
      if (isCustomValid) {
        // Check if this custom key is already used by another account
        const { data: isUsed } = await supabase.rpc('check_license_key_used', { key_to_check: licenseKey.trim() });
        if (isUsed) {
          throw new Error(isDe ? 'Dieser Lizenzschlüssel wurde bereits für einen anderen Account verwendet!' : 'This license key has already been used for another account!');
        }
        onValidLicense(licenseKey.trim());
        return;
      }

      // If not a custom key, proceed to Gumroad
      const { data: permalink, error: permalinkErr } = await supabase.rpc('get_gumroad_permalink');
      
      if (permalinkErr || !permalink) {
        throw new Error(isDe ? 'System-Konfigurationsfehler: Gumroad Permalink fehlt.' : 'System configuration error: Gumroad permalink missing.');
      }

      // 2. Call Gumroad API
      const res = await fetch('https://api.gumroad.com/v2/licenses/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: permalink,
          license_key: licenseKey.trim()
        })
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(isDe ? 'Dieser Schlüssel existiert nicht oder wurde bereits eingelöst.' : 'This key does not exist or has already been redeemed.');
      }

      if (data.purchase?.refunded || data.purchase?.chargebacked) {
        throw new Error(isDe ? 'Dieser Lizenzschlüssel wurde storniert und ist nicht mehr gültig.' : 'This license key has been refunded/chargebacked and is no longer valid.');
      }

      // 3. Check if used by someone else via our Supabase RPC
      const { data: isUsed, error: usedErr } = await supabase.rpc('check_license_key_used', { key_to_check: licenseKey.trim() });
      
      if (usedErr) {
        throw new Error(isDe ? 'Verbindungsfehler zur Datenbank. Bitte versuche es nochmal.' : 'Database connection error. Please try again.');
      }

      if (isUsed) {
        throw new Error(isDe ? 'Dieser Lizenzschlüssel wurde bereits für einen anderen Account verwendet!' : 'This license key has already been used for another account!');
      }

      // 4. Success!
      onValidLicense(licenseKey.trim());

    } catch (err: any) {
      console.error('License Verification Error:', err);
      setError(err.message || (isDe ? 'Ein unbekannter Fehler ist aufgetreten.' : 'An unknown error occurred.'));
      setCooldown(5); // 5 seconds penalty
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: 800, color: '#202124', letterSpacing: '-0.5px' }}>
        {isDe ? 'Produkt-Key aktivieren' : 'Activate Product Key'}
      </h2>
      <p style={{ margin: '0 0 32px 0', fontSize: '18px', color: '#5f6368', lineHeight: 1.5 }}>
        {isDe ? 'Bitte gib deinen Gumroad-Lizenzschlüssel ein, um fortzufahren. Du findest ihn in deiner Kauf-E-Mail.' : 'Please enter your Gumroad license key to continue. You can find it in your purchase email.'}
      </p>

      {error && (
        <div style={{ backgroundColor: '#fce8e6', color: '#d93025', padding: '12px 16px', borderRadius: '6px', marginBottom: '24px', fontSize: '14px', textAlign: 'left', border: '1px solid rgba(217,48,37,0.2)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ textAlign: 'right', paddingBottom: '4px' }}>
          <a href={purchaseLink} target="_blank" rel="noopener noreferrer" style={{ color: '#1a73e8', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}>
            {isDe ? 'Einmaligen Key kaufen' : 'Buy one-time key'} &rarr;
          </a>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9aa0a6' }}>
            <KeyRound size={18} />
          </div>
          <input
            type="text"
            required
            disabled={cooldown > 0}
            value={licenseKey}
            onChange={(e) => {
              // Remove everything except alphanumeric
              const raw = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
              // Gumroad / new Custom Key format (8-8-8-8)
              const formatted = raw.match(/.{1,8}/g)?.join('-') || '';
              setLicenseKey(formatted.substring(0, 35));
            }}
            placeholder="XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX"
            style={{
              width: '100%',
              padding: '14px 14px 14px 42px',
              borderRadius: '8px',
              border: '1px solid #dadce0',
              fontSize: '15px',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
              fontFamily: 'monospace',
              letterSpacing: '1px'
            }}
            onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
            onBlur={(e) => e.target.style.borderColor = '#dadce0'}
          />
        </div>

        <button
          type="submit"
          disabled={isValidating || !licenseKey.trim() || cooldown > 0}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: (isValidating || !licenseKey.trim() || cooldown > 0) ? '#e8eaed' : '#1a73e8',
            color: (isValidating || !licenseKey.trim() || cooldown > 0) ? '#9aa0a6' : 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: isValidating || !licenseKey.trim() ? 'default' : 'pointer',
            transition: 'background-color 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {isValidating ? (
            <>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              {isDe ? 'Wird geprüft...' : 'Validating...'}
            </>
          ) : cooldown > 0 ? (
            isDe ? `Bitte warten (${cooldown}s)...` : `Please wait (${cooldown}s)...`
          ) : (
            <>
              {isDe ? 'Lizenz prüfen' : 'Verify License'}
              <ArrowRight size={18} />
            </>
          )}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: '#5f6368',
              fontSize: '14px',
              cursor: 'pointer',
              marginTop: '4px'
            }}
          >
            {isDe ? 'Zurück zum Login' : 'Back to Login'}
          </button>
        )}
      </form>
    </div>
  );
};
