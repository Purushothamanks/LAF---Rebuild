import React from 'react';
import { ShieldCheck, User, Settings, LogOut } from 'lucide-react';

export default function Header({ user, onLogout, onOpenSettings }) {
  return (
    <header style={{
      padding: '14px 24px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(10, 12, 20, 0.8)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 100
    }}>
      {/* Brand & Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <img
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgPneYG2HNT8jsgsviQT-3j0Mj4tN_xUqwl9a9KYP9YE5Bu8TVGPXSLDI&s=10"
          alt="LAF Logo"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '1px solid var(--accent-cyan)'
          }}
        />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: '800', letterSpacing: '0.5px', color: '#fff' }}>
              LAF
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: '500' }}>
              Look At Future
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.72rem',
              color: 'var(--accent-green)',
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '2px 8px',
              borderRadius: '12px',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              fontWeight: '500'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)' }}></span>
              Online & Encrypted
            </span>
          </div>
        </div>
      </div>

      {/* User Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)'
          }}>
            <User style={{ width: '14px', color: 'var(--accent-cyan)' }} />
            <span style={{ fontWeight: '600', color: '#fff' }}>{user.username}</span>
          </div>
        )}

        <button
          onClick={onOpenSettings}
          className="btn-pro"
          style={{ padding: '8px', borderRadius: 'var(--radius-full)' }}
          title="Settings & API Keys"
        >
          <Settings style={{ width: '16px' }} />
        </button>

        <button
          onClick={onLogout}
          className="btn-pro"
          style={{ padding: '8px', borderRadius: 'var(--radius-full)', color: 'var(--accent-red)' }}
          title="Switch User / Logout"
        >
          <LogOut style={{ width: '16px' }} />
        </button>
      </div>
    </header>
  );
}
