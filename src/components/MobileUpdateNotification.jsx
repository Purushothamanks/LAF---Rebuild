import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, X, RefreshCw } from 'lucide-react';

const CURRENT_APP_VERSION = 'v1.3.0_all_rounder_fullscreen';

export default function MobileUpdateNotification() {
  const [showNotification, setShowNotification] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect mobile app environment (PWA, WebAPK, standalone, or mobile browser)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
    const isIOSStandalone = window.navigator.standalone === true;
    const isAndroidReferrer = document.referrer.includes('android-app://');
    const isAppQuery = new URLSearchParams(window.location.search).get('mode') === 'app';
    const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

    const isMobileApp = isStandalone || isFullscreen || isIOSStandalone || isAndroidReferrer || isAppQuery || isMobileDevice;

    if (!isMobileApp) return;

    // Check if the current version has already been applied by this client
    const savedVersion = localStorage.getItem('laf_applied_app_version');
    if (savedVersion !== CURRENT_APP_VERSION) {
      // Small timeout to allow initial UI to mount smoothly
      const timer = setTimeout(() => {
        setShowNotification(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleApplyUpdate = async () => {
    setIsUpdating(true);
    try {
      // 1. Mark this version as successfully applied
      localStorage.setItem('laf_applied_app_version', CURRENT_APP_VERSION);

      // 2. Clear all browser cache storage so the fresh bundle is loaded
      if (typeof window !== 'undefined' && 'caches' in window) {
        try {
          const cacheKeys = await window.caches.keys();
          await Promise.all(cacheKeys.map(k => window.caches.delete(k)));
        } catch (e) {}
      }

      // 3. Unregister any stale service workers
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const reg of registrations) {
            await reg.unregister();
          }
        } catch (e) {}
      }

      // 4. Instant cache-busting reload to immediately display all latest changes
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('mode', 'app');
      currentUrl.searchParams.set('v', Date.now().toString());
      window.location.replace(currentUrl.toString());
    } catch (err) {
      // Fallback reload
      window.location.reload(true);
    }
  };

  if (!showNotification) return null;

  return (
    <div
      className="mobile-update-notification-banner"
      style={{
        position: 'fixed',
        top: 'calc(10px + env(safe-area-inset-top, 0px))',
        left: '12px',
        right: '12px',
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1.5px solid rgba(59, 130, 246, 0.65)',
        borderRadius: '20px',
        padding: '12px 14px',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.75), 0 0 24px rgba(59, 130, 246, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        animation: 'mobileUpdateSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
      role="alert"
      aria-live="polite"
    >
      {/* Icon + Information */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            flexShrink: 0,
            boxShadow: '0 0 12px rgba(59, 130, 246, 0.5)'
          }}
        >
          {isUpdating ? (
            <RefreshCw style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} />
          ) : (
            <Sparkles style={{ width: '18px', height: '18px' }} />
          )}
        </div>

        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#fff', letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Update Available</span>
            <span style={{ fontSize: '0.66rem', background: 'rgba(59, 130, 246, 0.25)', color: '#60a5fa', border: '1px solid rgba(96, 165, 250, 0.4)', borderRadius: '6px', padding: '1px 5px', fontWeight: '700' }}>
              NEW
            </span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', lineHeight: '1.3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            All-Rounder AI & Fullscreen Experience
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleApplyUpdate}
          disabled={isUpdating}
          style={{
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            padding: '8px 14px',
            fontSize: '0.82rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 0 14px rgba(37, 99, 235, 0.45)',
            transition: 'all 0.15s ease'
          }}
        >
          <span>{isUpdating ? 'Applying...' : 'Update'}</span>
          {!isUpdating && <ArrowRight style={{ width: '14px', height: '14px' }} />}
        </button>

        <button
          type="button"
          onClick={() => setShowNotification(false)}
          title="Dismiss for now"
          aria-label="Dismiss notification"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X style={{ width: '16px', height: '16px' }} />
        </button>
      </div>
    </div>
  );
}
