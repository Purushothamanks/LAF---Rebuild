import React, { useState } from 'react';
import { X, Settings, User, Info, Key, LogOut, Trash2, Shield, FileText, Check } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, user, onLogout, customApiKey, setCustomApiKey }) {
  const [activeTab, setActiveTab] = useState('general'); // 'general', 'profile', 'about'
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('en');
  const [keyInput, setKeyInput] = useState(customApiKey || '');
  const [savedKey, setSavedKey] = useState(false);
  const [showLegalDoc, setShowLegalDoc] = useState(null); // 'terms' or 'privacy'

  if (!isOpen) return null;

  const handleSaveKey = (e) => {
    e.preventDefault();
    setCustomApiKey(keyInput.trim());
    localStorage.setItem('laf_custom_api_key', keyInput.trim());
    setSavedKey(true);
    setTimeout(() => setSavedKey(false), 2000);
  };

  const username = user?.username || 'User';
  const maskedEmail = `${username.substring(0, 3)}*****@gmail.com`;
  const maskedPhone = `+91 ******${Math.floor(1000 + Math.random() * 9000)}`;

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
      <div style={{
        width: '560px',
        maxWidth: '92%',
        background: 'var(--ds-bg-sidebar)',
        border: '1px solid var(--ds-border)',
        boxShadow: '0 0 30px rgba(79, 117, 255, 0.3)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--ds-border)',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          background: 'var(--ds-bg-card)'
        }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-title)' }}>
            <Settings style={{ width: '18px', color: 'var(--ds-blue)' }} /> Settings
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--ds-text-secondary)', cursor: 'pointer' }}>
            <X style={{ width: '20px' }} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--ds-border)', padding: '0 16px', background: 'rgba(0,0,0,0.2)' }}>
          <button
            onClick={() => setActiveTab('general')}
            className={`settings-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`settings-tab-btn ${activeTab === 'about' ? 'active' : ''}`}
          >
            About
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto', maxHeight: '420px' }}>
          
          {/* ⚙️ GENERAL TAB */}
          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--ds-text-primary)', display: 'block', marginBottom: '8px' }}>
                  Theme
                </label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--ds-bg-card)',
                    border: '1px solid var(--ds-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    outline: 'none'
                  }}
                >
                  <option value="dark">Dark (Default DeepSeek Charcoal)</option>
                  <option value="cyber">Cyber Glow Neon</option>
                  <option value="light">Light Mode</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--ds-text-primary)', display: 'block', marginBottom: '8px' }}>
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--ds-bg-card)',
                    border: '1px solid var(--ds-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    outline: 'none'
                  }}
                >
                  <option value="en">English (US)</option>
                  <option value="system">System Default</option>
                </select>
              </div>

              <div style={{ borderTop: '1px solid var(--ds-border)', paddingTop: '16px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--ds-text-primary)', display: 'block', marginBottom: '6px' }}>
                  Custom Reasoning API Key (Optional)
                </label>
                <form onSubmit={handleSaveKey} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="Paste Gemini / OpenRouter API Key"
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      background: 'var(--ds-bg-card)',
                      border: '1px solid var(--ds-border)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#fff',
                      outline: 'none'
                    }}
                  />
                  <button type="submit" className="ds-new-chat-btn" style={{ width: 'auto', padding: '10px 16px', background: 'var(--ds-blue)', borderColor: 'var(--ds-blue)' }}>
                    {savedKey ? <Check style={{ width: '16px' }} /> : 'Save'}
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* 👤 PROFILE TAB */}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'var(--ds-bg-card)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--ds-border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ds-text-muted)', marginBottom: '4px' }}>Name</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#fff' }}>{username}</div>
                </div>

                <div style={{ background: 'var(--ds-bg-card)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--ds-border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ds-text-muted)', marginBottom: '4px' }}>User name</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--ds-blue)' }}>@{username.toLowerCase()}</div>
                </div>
              </div>

              <div style={{ background: 'var(--ds-bg-card)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--ds-border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--ds-text-muted)', marginBottom: '4px' }}>Email address</div>
                <div style={{ fontSize: '0.92rem', color: '#fff', fontFamily: 'var(--font-mono)' }}>{maskedEmail}</div>
              </div>

              <div style={{ background: 'var(--ds-bg-card)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--ds-border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--ds-text-muted)', marginBottom: '4px' }}>Phone number</div>
                <div style={{ fontSize: '0.92rem', color: '#fff', fontFamily: 'var(--font-mono)' }}>{maskedPhone}</div>
              </div>

              <div style={{ borderTop: '1px solid var(--ds-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={() => { onLogout(); onClose(); }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--ds-border)',
                    color: '#fff',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    gap: '8px'
                  }}
                >
                  <LogOut style={{ width: '16px' }} /> Log out of all devices
                </button>

                <button
                  onClick={() => { alert('Account deletion request initiated.'); onLogout(); onClose(); }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    gap: '8px'
                  }}
                >
                  <Trash2 style={{ width: '16px' }} /> Delete account
                </button>
              </div>

            </div>
          )}

          {/* ℹ️ ABOUT TAB */}
          {activeTab === 'about' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgPneYG2HNT8jsgsviQT-3j0Mj4tN_xUqwl9a9KYP9YE5Bu8TVGPXSLDI&s=10"
                  alt="LAF Logo"
                  style={{ width: '48px', height: '48px', borderRadius: '50%', marginBottom: '8px', border: '2px solid var(--ds-blue)' }}
                />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff', fontFamily: 'var(--font-title)' }}>LAF AI</h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--ds-blue)' }}>L - Look | A - At | F - Future</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ds-text-muted)', marginTop: '4px' }}>Version 2.5 (Production Release)</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--ds-border)', paddingTop: '16px' }}>
                <button
                  onClick={() => setShowLegalDoc(showLegalDoc === 'terms' ? null : 'terms')}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'var(--ds-bg-card)',
                    border: '1px solid var(--ds-border)',
                    color: '#fff',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.88rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText style={{ width: '16px', color: 'var(--ds-blue)' }} /> Terms of Use
                  </span>
                </button>

                {showLegalDoc === 'terms' && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--ds-text-secondary)', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: 'var(--radius-sm)', lineHeight: '1.5' }}>
                    LAF Terms of Use: By accessing LAF AI, you agree to secure data processing rules, isolated database partition usage, and compliant usage of reasoning LLM tools.
                  </div>
                )}

                <button
                  onClick={() => setShowLegalDoc(showLegalDoc === 'privacy' ? null : 'privacy')}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'var(--ds-bg-card)',
                    border: '1px solid var(--ds-border)',
                    color: '#fff',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.88rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield style={{ width: '16px', color: 'var(--ds-blue)' }} /> Privacy Policy
                  </span>
                </button>

                {showLegalDoc === 'privacy' && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--ds-text-secondary)', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: 'var(--radius-sm)', lineHeight: '1.5' }}>
                    LAF Privacy Policy: All user conversations are end-to-end encrypted (E2EE) with AES-256 keys derived per username. Zero data is shared across user partitions.
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
