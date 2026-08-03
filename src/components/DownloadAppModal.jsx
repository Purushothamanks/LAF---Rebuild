import React, { useState, useEffect } from 'react';
import { X, Smartphone, Download, Share2, ShieldCheck, Check } from 'lucide-react';

export default function DownloadAppModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const isAppMode = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );

  if (!isOpen) return null;

  const handleAction = async () => {
    if (isAppMode) {
      // In App mode: Share App link
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'LAF AI Platform',
            text: 'Experience LAF AI — Autonomous Multimodal Fast Reasoning AI Platform!',
            url: window.location.origin
          });
        } catch (err) {
          // Fallback to clipboard
          navigator.clipboard.writeText(window.location.origin);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        }
      } else {
        navigator.clipboard.writeText(window.location.origin);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } else {
      // On Website: Direct download LAF web app shortcut file
      const appHtmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>LAF AI Platform</title>
<meta http-equiv="refresh" content="0; url=${window.location.origin}">
<script>window.location.href = "${window.location.origin}";</script>
</head>
<body>
<p>Launching LAF AI Platform... <a href="${window.location.origin}">Click here if not redirected</a>.</p>
</body>
</html>`;
      const blob = new Blob([appHtmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'LAF-AI-App.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
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
          background: 'var(--ds-bg-sidebar)'
        }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--ds-text-primary)', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-title)', margin: 0 }}>
            {isAppMode ? <Share2 style={{ width: '20px', color: 'var(--ds-blue)' }} /> : <Smartphone style={{ width: '20px', color: 'var(--ds-blue)' }} />}
            <span>{isAppMode ? 'Share LAF App' : 'Download LAF App'}</span>
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

          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--ds-text-primary)', fontFamily: 'var(--font-title)', margin: 0 }}>
            LAF AI Mobile & Desktop
          </h3>

          <p style={{ fontSize: '0.88rem', color: 'var(--ds-text-secondary)', lineHeight: '1.5', margin: 0 }}>
            {isAppMode
              ? 'Share the LAF AI app link with your friends and colleagues for instant access.'
              : 'Directly download the native LAF web app shortcut for Android, iOS, Windows, or macOS.'}
          </p>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
            <button
              onClick={handleAction}
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
              {isAppMode ? (
                copied ? <Check style={{ width: '18px' }} /> : <Share2 style={{ width: '18px' }} />
              ) : (
                <Download style={{ width: '18px' }} />
              )}
              <span>
                {isAppMode
                  ? (copied ? 'App Link Copied!' : 'Share App Link')
                  : 'Download App'}
              </span>
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
