import React, { useState } from 'react';
import { User, ShieldCheck, ArrowRight } from 'lucide-react';

export default function LoginModal({ onLogin }) {
  const [usernameInput, setUsernameInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usernameInput.trim()) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const existingToken = localStorage.getItem('laf_token') || '';
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${existingToken}`
        },
        body: JSON.stringify({ username: usernameInput.trim() })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('laf_token', data.token);
        localStorage.setItem('laf_username', data.user.username);
        onLogin(data.user, data.token);
      } else {
        setError(data.error || 'Authentication failed. Please choose a different username.');
      }
    } catch (err) {
      setError('Unable to connect to LAF server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-floating-card" style={{ width: '420px', padding: '36px 30px', textAlign: 'center', margin: 'auto' }}>
        <div style={{ marginBottom: '16px', display: 'inline-block', position: 'relative' }}>
          <img 
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgPneYG2HNT8jsgsviQT-3j0Mj4tN_xUqwl9a9KYP9YE5Bu8TVGPXSLDI&s=10" 
            alt="LAF Logo"
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--ds-blue)',
              boxShadow: '0 0 20px rgba(79, 117, 255, 0.4)'
            }}
          />
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-title)', color: 'var(--ds-text-primary)', marginBottom: '4px', margin: 0 }}>
          LAF AI
        </h1>
        <p style={{ color: 'var(--ds-blue)', fontSize: '0.86rem', fontWeight: '700', letterSpacing: '1px', marginBottom: '14px', textTransform: 'uppercase' }}>
          Look at The Future
        </p>

        <p style={{ color: 'var(--ds-text-secondary)', fontSize: '0.94rem', fontWeight: '600', marginBottom: '24px' }}>
          Login to continue
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ position: 'relative' }}>
            <User style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--ds-blue)', width: '18px' }} />
            <input
              type="text"
              placeholder="Enter your username (e.g. Alex)"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px 12px 42px',
                background: 'var(--ds-bg-card)',
                border: '1px solid var(--ds-border)',
                borderRadius: '14px',
                color: 'var(--ds-text-primary)',
                fontSize: '0.95rem',
                outline: 'none',
                fontWeight: '500'
              }}
              autoFocus
            />
          </div>

          {error && (
            <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'left', fontWeight: '500', lineHeight: '1.4' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              background: 'var(--ds-blue)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '9999px',
              fontWeight: '700',
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 0 20px rgba(79, 117, 255, 0.4)',
              transition: 'all 0.15s ease'
            }}
          >
            <span>{loading ? 'Logging in...' : 'Launch LAF AI'}</span>
            <ArrowRight style={{ width: '18px' }} />
          </button>
        </form>

        <div style={{ marginTop: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--ds-text-muted)' }}>
          <ShieldCheck style={{ width: '14px', color: '#10b981' }} />
          Isolated Database Partition & Encrypted Vault Active
        </div>
      </div>
    </div>
  );
}
