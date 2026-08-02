import React, { useState } from 'react';
import { X, Key, Save, Check } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, customApiKey, setCustomApiKey }) {
  const [keyInput, setKeyInput] = useState(customApiKey || '');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setCustomApiKey(keyInput.trim());
    localStorage.setItem('laf_custom_api_key', keyInput.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(5, 7, 15, 0.85)',
      backdropFilter: 'blur(12px)'
    }}>
      <div className="glass-panel" style={{ width: '460px', maxWidth: '90%', padding: '28px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--primary-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key style={{ width: '18px' }} /> LAF AI Engine & Custom API Keys
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X style={{ width: '20px' }} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Custom Reasoning API Key (Optional)
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Paste your Gemini / OpenRouter / Groq API key here"
              style={{
                width: '100%',
                background: 'rgba(7, 9, 19, 0.8)',
                border: '1px solid var(--border-glow)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                color: '#fff',
                outline: 'none',
                fontSize: '0.9rem'
              }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
              Leave blank to use LAF high-speed default neural cluster.
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
            <button type="button" onClick={onClose} className="btn-cyber" style={{ border: '1px solid var(--border-color)' }}>
              Cancel
            </button>
            <button type="submit" className="btn-cyber btn-cyber-solid">
              {saved ? <><Check style={{ width: '16px' }} /> Saved!</> : <><Save style={{ width: '16px' }} /> Save Configuration</>}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
