import React, { useState } from 'react';
import { X, Settings, LogOut, Trash2, Shield, FileText, Check, Save } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, user, onLogout, customApiKey, setCustomApiKey, theme, setTheme }) {
  const [activeTab, setActiveTab] = useState('profile'); // Default to profile tab
  const [language, setLanguage] = useState('en');
  const [keyInput, setKeyInput] = useState(customApiKey || '');
  const [savedKey, setSavedKey] = useState(false);
  const [showLegalDoc, setShowLegalDoc] = useState(null); // 'terms' or 'privacy'

  // User editable profile details
  const [nameInput, setNameInput] = useState(user?.name || user?.username || '');
  const [usernameInput, setUsernameInput] = useState(user?.username ? `@${user.username.toLowerCase()}` : '');
  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [phoneInput, setPhoneInput] = useState(user?.phone || '');
  const [savedProfile, setSavedProfile] = useState(false);

  if (!isOpen) return null;

  const handleSaveKey = (e) => {
    e.preventDefault();
    setCustomApiKey(keyInput.trim());
    localStorage.setItem('laf_custom_api_key', keyInput.trim());
    setSavedKey(true);
    setTimeout(() => setSavedKey(false), 2000);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const cleanUsername = usernameInput.replace(/^@/, '').trim() || 'user';
    if (user) {
      user.name = nameInput.trim();
      user.username = cleanUsername;
      user.email = emailInput.trim();
      user.phone = phoneInput.trim();
    }
    localStorage.setItem(`laf_profile_${cleanUsername}`, JSON.stringify({
      name: nameInput.trim(),
      username: cleanUsername,
      email: emailInput.trim(),
      phone: phoneInput.trim()
    }));
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      {/* Floating Centered Card Container */}
      <div className="modal-floating-card">
        
        {/* Header with Perfectly Aligned X Close Button with Breathing Space */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--ds-border)',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          background: 'var(--ds-bg-sidebar)'
        }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--ds-text-primary)', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-title)', margin: 0 }}>
            <Settings style={{ width: '20px', color: 'var(--ds-blue)' }} /> Settings
          </h2>
          
          <button
            onClick={onClose}
            className="modal-close-btn"
            title="Close Settings"
          >
            <X />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--ds-border)', padding: '12px 24px', background: 'var(--ds-bg-main)' }}>
          <button
            onClick={() => setActiveTab('profile')}
            className={`settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`settings-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`settings-tab-btn ${activeTab === 'about' ? 'active' : ''}`}
          >
            About
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto', maxHeight: '460px' }}>
          
          {/* 👤 PROFILE TAB */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Editable Name */}
                <div style={{ background: 'var(--ds-bg-card)', padding: '12px 16px', borderRadius: '16px', border: '1px solid var(--ds-border)' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Enter name..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--ds-bg-input)',
                      border: '1px solid var(--ds-border)',
                      borderRadius: '10px',
                      color: 'var(--ds-text-primary)',
                      fontSize: '0.94rem',
                      fontWeight: '600',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Editable Username */}
                <div style={{ background: 'var(--ds-bg-card)', padding: '12px 16px', borderRadius: '16px', border: '1px solid var(--ds-border)' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    User name
                  </label>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Enter @username..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--ds-bg-input)',
                      border: '1px solid var(--ds-border)',
                      borderRadius: '10px',
                      color: 'var(--ds-blue)',
                      fontSize: '0.94rem',
                      fontWeight: '600',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Editable Email */}
              <div style={{ background: 'var(--ds-bg-card)', padding: '12px 16px', borderRadius: '16px', border: '1px solid var(--ds-border)' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter email address..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--ds-bg-input)',
                    border: '1px solid var(--ds-border)',
                    borderRadius: '10px',
                    color: 'var(--ds-text-primary)',
                    fontSize: '0.92rem',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Editable Phone Number */}
              <div style={{ background: 'var(--ds-bg-card)', padding: '12px 16px', borderRadius: '16px', border: '1px solid var(--ds-border)' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ds-text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Phone number
                </label>
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="Enter phone number..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--ds-bg-input)',
                    border: '1px solid var(--ds-border)',
                    borderRadius: '10px',
                    color: 'var(--ds-text-primary)',
                    fontSize: '0.92rem',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Save Profile Button */}
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--ds-blue)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '14px',
                  fontWeight: '700',
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  gap: '8px',
                  boxShadow: '0 0 16px rgba(79, 117, 255, 0.3)'
                }}
              >
                {savedProfile ? <Check style={{ width: '18px' }} /> : <Save style={{ width: '18px' }} />}
                <span>{savedProfile ? 'Profile Saved Successfully!' : 'Save Profile Changes'}</span>
              </button>

              <div style={{ borderTop: '1px solid var(--ds-border)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => { onLogout(); onClose(); }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'var(--ds-bg-card)',
                    border: '1px solid var(--ds-border)',
                    color: 'var(--ds-text-primary)',
                    borderRadius: '12px',
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
                  type="button"
                  onClick={() => { alert('Account deletion request initiated.'); onLogout(); onClose(); }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    borderRadius: '12px',
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

            </form>
          )}

          {/* ⚙️ GENERAL TAB (Working Theme Switcher) */}
          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--ds-text-primary)', display: 'block', marginBottom: '8px' }}>
                  Theme Accent & Mode
                </label>
                <select
                  value={theme || 'dark'}
                  onChange={(e) => setTheme(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'var(--ds-bg-card)',
                    border: '1px solid var(--ds-border)',
                    borderRadius: '14px',
                    color: 'var(--ds-text-primary)',
                    outline: 'none',
                    fontWeight: '600'
                  }}
                >
                  <option value="dark">🌙 Dark (Default Royal Blue Charcoal)</option>
                  <option value="cyber">⚡ Cyber Glow Neon (Cyan Accent)</option>
                  <option value="light">☀️ Sleek Light Mode</option>
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
                    padding: '12px 16px',
                    background: 'var(--ds-bg-card)',
                    border: '1px solid var(--ds-border)',
                    borderRadius: '14px',
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
                      padding: '12px 16px',
                      background: 'var(--ds-bg-card)',
                      border: '1px solid var(--ds-border)',
                      borderRadius: '14px',
                      color: 'var(--ds-text-primary)',
                      outline: 'none'
                    }}
                  />
                  <button type="submit" className="ds-new-chat-btn" style={{ width: 'auto', padding: '12px 20px', background: 'var(--ds-blue)', borderColor: 'var(--ds-blue)', color: '#fff' }}>
                    {savedKey ? <Check style={{ width: '16px' }} /> : 'Save'}
                  </button>
                </form>
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
                  style={{ width: '56px', height: '56px', borderRadius: '50%', marginBottom: '8px', border: '2px solid var(--ds-blue)' }}
                />
                <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--ds-text-primary)', fontFamily: 'var(--font-title)' }}>LAF AI</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--ds-text-muted)', marginTop: '4px' }}>Version 1.2</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--ds-border)', paddingTop: '16px' }}>
                <button
                  onClick={() => setShowLegalDoc(showLegalDoc === 'terms' ? null : 'terms')}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'var(--ds-bg-card)',
                    border: '1px solid var(--ds-border)',
                    color: 'var(--ds-text-primary)',
                    borderRadius: '14px',
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
                  <div style={{ fontSize: '0.82rem', color: 'var(--ds-text-secondary)', background: 'var(--ds-bg-main)', padding: '16px', borderRadius: '12px', lineHeight: '1.6', maxHeight: '250px', overflowY: 'auto' }}>
                    <h4 style={{ color: '#fff', marginBottom: '8px', fontSize: '0.95rem' }}>LAF AI Terms of Service & Use</h4>
                    <strong>Effective Date:</strong> August 4, 2026<br />
                    <strong>Owner:</strong> Purushothamanks<br /><br />
                    1. <strong>Acceptance:</strong> By accessing or using LAF AI ("Look at The Future"), you agree to be bound by these legal Terms of Service.<br />
                    2. <strong>User Isolation & E2EE:</strong> Accounts operate under isolated database partitions encrypted with AES-256-GCM. You are responsible for preserving session tokens.<br />
                    3. <strong>Acceptable Use:</strong> You agree not to perform prompt injection, server probing, rate limit evasion, or illegal content processing.<br />
                    4. <strong>Intellectual Property:</strong> All software, branding, architecture, and logos are the sole property of Purushothamanks.<br />
                    5. <strong>Limitation of Liability:</strong> Platform provided AS-IS. Contact purushothamanks1711@gmail.com for legal support.
                  </div>
                )}

                <button
                  onClick={() => setShowLegalDoc(showLegalDoc === 'privacy' ? null : 'privacy')}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'var(--ds-bg-card)',
                    border: '1px solid var(--ds-border)',
                    color: 'var(--ds-text-primary)',
                    borderRadius: '14px',
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
                  <div style={{ fontSize: '0.82rem', color: 'var(--ds-text-secondary)', background: 'var(--ds-bg-main)', padding: '16px', borderRadius: '12px', lineHeight: '1.6', maxHeight: '250px', overflowY: 'auto' }}>
                    <h4 style={{ color: '#fff', marginBottom: '8px', fontSize: '0.95rem' }}>LAF AI Privacy Policy</h4>
                    <strong>Effective Date:</strong> August 4, 2026<br /><br />
                    1. <strong>Privacy by Design:</strong> Zero passwords or invasive tracking. Accounts rely on passwordless username tokens.<br />
                    2. <strong>Data Encryption:</strong> All database records are stored under isolated files (<code>user_hash.json</code>) encrypted with AES-256-GCM using PBKDF2 keys.<br />
                    3. <strong>Zero Monetization:</strong> We never sell, rent, or monetize your prompt data or personal information to third parties.<br />
                    4. <strong>Data Erasure:</strong> Users maintain full rights to delete chat logs and partition data at any time.
                  </div>
                )}

                <button
                  onClick={() => setShowLegalDoc(showLegalDoc === 'eula' ? null : 'eula')}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'var(--ds-bg-card)',
                    border: '1px solid var(--ds-border)',
                    color: 'var(--ds-text-primary)',
                    borderRadius: '14px',
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
                    <FileText style={{ width: '16px', color: 'var(--ds-blue)' }} /> End-User License Agreement (EULA)
                  </span>
                </button>

                {showLegalDoc === 'eula' && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--ds-text-secondary)', background: 'var(--ds-bg-main)', padding: '16px', borderRadius: '12px', lineHeight: '1.6', maxHeight: '250px', overflowY: 'auto' }}>
                    <h4 style={{ color: '#fff', marginBottom: '8px', fontSize: '0.95rem' }}>End-User License Agreement (EULA)</h4>
                    <strong>Licensor:</strong> Purushothamanks<br /><br />
                    1. <strong>Grant:</strong> Personal, non-exclusive, non-transferable license to run and interact with LAF AI.<br />
                    2. <strong>Restrictions:</strong> No reverse engineering, server disruption, or unauthorized trademark usage.<br />
                    3. <strong>Ownership:</strong> Platform source code and trademarks remain sole property of Purushothamanks.
                  </div>
                )}

                <button
                  onClick={() => setShowLegalDoc(showLegalDoc === 'license' ? null : 'license')}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'var(--ds-bg-card)',
                    border: '1px solid var(--ds-border)',
                    color: 'var(--ds-text-primary)',
                    borderRadius: '14px',
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
                    <Shield style={{ width: '16px', color: 'var(--ds-blue)' }} /> Open Source License (MIT)
                  </span>
                </button>

                {showLegalDoc === 'license' && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--ds-text-secondary)', background: 'var(--ds-bg-main)', padding: '16px', borderRadius: '12px', lineHeight: '1.5', fontFamily: 'monospace', maxHeight: '250px', overflowY: 'auto' }}>
                    <strong>MIT License</strong><br /><br />
                    Copyright (c) 2026 Purushothamanks (Look at The Future - LAF AI Platform).<br /><br />
                    Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, subject to inclusion of the above copyright notice.
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
