import React, { useState } from 'react';
import { User, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginModal({ onLogin }) {
  const [usernameInput, setUsernameInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usernameInput.trim()) {
      setError('Please enter a username to access LAF');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput.trim() })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('laf_token', data.token);
        localStorage.setItem('laf_username', data.user.username);
        onLogin(data.user, data.token);
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Unable to connect to LAF server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(5, 7, 15, 0.92)',
      backdropFilter: 'blur(20px)'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '440px',
        width: '90%',
        padding: '36px 30px',
        textAlign: 'center',
        boxShadow: '0 0 40px rgba(0, 240, 255, 0.25)',
        border: '1px solid rgba(0, 240, 255, 0.3)'
      }}>
        <div style={{ marginBottom: '20px', display: 'inline-block', position: 'relative' }}>
          <img 
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgPneYG2HNT8jsgsviQT-3j0Mj4tN_xUqwl9a9KYP9YE5Bu8TVGPXSLDI&s=10" 
            alt="LAF Logo"
            style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--primary-cyan)',
              boxShadow: '0 0 20px var(--primary-cyan)'
            }}
          />
        </div>

        <h1 className="text-glow" style={{ fontSize: '2.2rem', fontWeight: '800', letterSpacing: '1px', marginBottom: '4px' }}>
          LAF
        </h1>
        <p style={{ color: 'var(--primary-cyan)', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '1.5px', marginBottom: '16px' }}>
          L - LOOK | A - AT | F - FUTURE
        </p>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.4' }}>
          Welcome to LAF Autonomous AI Platform. Enter your unique username to mount your isolated AES-256 encrypted database partition. No password required.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <User style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--primary-cyan)', width: '20px' }} />
            <input
              type="text"
              placeholder="Enter your username (e.g. Alex)"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              style={{
                width: '100%',
                padding: '13px 14px 13px 44px',
                background: 'rgba(10, 14, 30, 0.8)',
                border: '1px solid var(--border-glow)',
                borderRadius: 'var(--radius-sm)',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none'
              }}
              autoFocus
            />
          </div>

          {error && (
            <div style={{ color: '#ff4d4d', fontSize: '0.85rem', marginBottom: '14px', textAlign: 'left' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-cyber btn-cyber-solid"
            disabled={loading}
            style={{ width: '100%', padding: '14px', justifyContent: 'center', fontSize: '1rem' }}
          >
            {loading ? 'Mounting Isolated DB...' : (
              <>Launch LAF AI <ArrowRight style={{ width: '18px' }} /></>
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
          <ShieldCheck style={{ width: '14px', color: 'var(--accent-green)' }} />
          End-to-End Encryption & Isolated DB Partition Active
        </div>
      </div>
    </div>
  );
}
