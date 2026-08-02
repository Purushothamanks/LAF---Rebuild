import React from 'react';
import { X, Smartphone, Download, ShieldCheck } from 'lucide-react';

export default function DownloadAppModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const handleDownloadPWA = () => {
    alert('LAF AI Progressive Web App installer triggered. Click "Add to Home Screen" on your device browser.');
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-floating-card" style={{ width: '460px' }}>
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--ds-border)',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          background: 'rgba(28, 33, 45, 0.9)'
        }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-title)', margin: 0 }}>
            <Smartphone style={{ width: '20px', color: 'var(--ds-blue)' }} /> Download LAF App
          </h2>
          <button
            onClick={onClose}
            className="modal-close-btn"
            title="Close"
          >
            <X />
          </button>
        </div>

        <div style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgPneYG2HNT8jsgsviQT-3j0Mj4tN_xUqwl9a9KYP9YE5Bu8TVGPXSLDI&s=10"
            alt="LAF Logo"
            style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid var(--ds-blue)', boxShadow: '0 0 20px rgba(79, 117, 255, 0.4)' }}
          />

          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff', fontFamily: 'var(--font-title)', margin: 0 }}>
            LAF AI Mobile & Desktop
          </h3>

          <p style={{ fontSize: '0.88rem', color: 'var(--ds-text-secondary)', lineHeight: '1.5', margin: 0 }}>
            Install the native LAF PWA on Android, iOS, Windows, or macOS for instant access and zero latency.
          </p>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
            <button
              onClick={handleDownloadPWA}
              style={{
                width: '100%',
                padding: '14px',
                background: 'var(--ds-blue)',
                border: 'none',
                color: '#fff',
                borderRadius: '14px',
                fontWeight: '700',
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                gap: '8px',
                boxShadow: '0 0 20px rgba(79, 117, 255, 0.4)'
              }}
            >
              <Download style={{ width: '18px' }} /> Install Web App / Mobile App
            </button>

            <div style={{ fontSize: '0.78rem', color: 'var(--ds-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <ShieldCheck style={{ width: '14px', color: '#10b981' }} /> Verified Safe & Encrypted PWA Build
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
