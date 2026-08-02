import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Globe, Cpu, LogOut, Settings } from 'lucide-react';

export default function Header({ user, onLogout, onOpenSettings }) {
  const [trends, setTrends] = useState([]);

  useEffect(() => {
    fetch('/api/trends')
      .then(res => res.json())
      .then(data => {
        if (data.trends) setTrends(data.trends);
      })
      .catch(() => {});
  }, []);

  return (
    <header style={{
      background: 'rgba(7, 9, 19, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color)',
      zIndex: 100
    }}>
      {/* Real-time Global Ticker */}
      <div className="ticker-wrap">
        <div className="ticker">
          <span style={{ color: 'var(--primary-cyan)', fontWeight: '700', marginRight: '10px' }}>
            ⚡ LAF LIVE TREND TICKER:
          </span>
          {trends.length > 0 ? (
            trends.map((t, idx) => (
              <span key={t.id} style={{ marginRight: '30px' }}>
                <span style={{ color: 'var(--accent-green)', fontWeight: '600' }}>[{t.category}]</span> {t.title} • {t.updatedAt}
              </span>
            ))
          ) : (
            <span>⚡ Global Real-Time Trend Engine Active • E2EE Protected • Multimodal AI Online</span>
          )}
        </div>
      </div>

      {/* Main Bar */}
      <div style={{
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgPneYG2HNT8jsgsviQT-3j0Mj4tN_xUqwl9a9KYP9YE5Bu8TVGPXSLDI&s=10"
            alt="LAF Logo"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--primary-cyan)',
              boxShadow: '0 0 12px var(--primary-cyan)'
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="text-glow" style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '1px' }}>
                LAF
              </span>
              <span style={{
                background: 'rgba(0, 240, 255, 0.1)',
                color: 'var(--primary-cyan)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.68rem',
                fontWeight: '700',
                textTransform: 'uppercase'
              }}>
                Fast Reasoning v2.5
              </span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', letterSpacing: '0.5px' }}>
              Look At the Future • Isolated DB Mounted
            </div>
          </div>
        </div>

        {/* Status Indicators & User Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="mobile-hide" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(0, 255, 170, 0.08)',
            border: '1px solid rgba(0, 255, 170, 0.25)',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '0.78rem',
            color: 'var(--accent-green)'
          }}>
            <ShieldCheck style={{ width: '15px' }} />
            <span>E2EE Active</span>
          </div>

          {user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(138, 43, 226, 0.15)',
              border: '1px solid rgba(138, 43, 226, 0.3)',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.84rem'
            }}>
              <User style={{ width: '15px', color: 'var(--primary-cyan)' }} />
              <span style={{ fontWeight: '600' }}>{user.username}</span>
            </div>
          )}

          <button
            onClick={onOpenSettings}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Settings & API Keys"
          >
            <Settings style={{ width: '20px' }} />
          </button>

          <button
            onClick={onLogout}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ff4d4d',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Switch User / Logout"
          >
            <LogOut style={{ width: '20px' }} />
          </button>
        </div>
      </div>
    </header>
  );
}
