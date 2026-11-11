import React, { useState, useEffect } from 'react';
import { ArrowRight, X, RefreshCw, Smartphone } from 'lucide-react';

const CURRENT_APP_VERSION = 'v1.4.0_clean_app_update';

export default function MobileUpdateNotification() {
  const [showNotification, setShowNotification] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect mobile app environment (PWA, WebAPK, standalone, fullscreen, or mobile viewport)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
    const isIOSStandalone = window.navigator.standalone === true;
    const isAndroidReferrer = document.referrer.includes('android-app://');
    const isAppQuery = new URLSearchParams(window.location.search).get('mode') === 'app';
    const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

    const isMobileApp = isStandalone || isFullscreen || isIOSStandalone || isAndroidReferrer || isAppQuery || isMobileDevice;

    if (!isMobileApp) return;

    // Trigger for all mobile app users who haven't applied this clean update yet
    const savedVersion = localStorage.getItem('laf_applied_app_version');
    if (savedVersion !== CURRENT_APP_VERSION) {
      const timer = setTimeout(() => {
        setShowNotification(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleApplyUpdate = async () => {
    setIsUpdating(true);
    try {
      localStorage.setItem('laf_applied_app_version', CURRENT_APP_VERSION);

      // Wipe caches to guarantee 100% fresh assets
      if (typeof window !== 'undefined' && 'caches' in window) {
        try {
          const cacheKeys = await window.caches.keys();
          await Promise.all(cacheKeys.map(k => window.caches.delete(k)));
        } catch (e) {}
      }

      // Unregister any stale Service Workers
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const reg of registrations) {
            await reg.unregister();
          }
        } catch (e) {}
      }

      // Hard redirect with cache-buster to show fresh changes instantly
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('mode', 'app');
      currentUrl.searchParams.set('v', Date.now().toString());
      window.location.replace(currentUrl.toString());
    } catch (err) {
      window.location.reload(true);
    }
  };

  if (!showNotification) return null;

  return (
    <div
      className="mobile-update-notification-banner"
      style={{
        position: 'fixed',
        top: 'calc(12px + env(safe-area-inset-top, 0px))',
        left: '12px',
        right: '12px',
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(59, 130, 246, 0.5)',
        borderRadius: '16px',
        padding: '10px 14px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(59, 130, 246, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        animation: 'mobileUpdateSlideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
      role="alert"
      aria-live="polite"
    >
      {/* Icon + Clean Text */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#60a5fa',
            flexShrink: 0
          }}
        >
          {isUpdating ? (
            <RefreshCw style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
          ) : (
            <Smartphone style={{ width: '16px', height: '16px' }} />
          )}
        </div>

        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#fff', letterSpacing: '0.2px' }}>
            App Update
          </div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', lineHeight: '1.3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Tap update to apply latest changes instantly
          </div>
        </div>
      </div>

      {/* Neat Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleApplyUpdate}
          disabled={isUpdating}
          style={{
            background: 'var(--ds-blue, #2563eb)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            padding: '7px 13px',
            fontSize: '0.80rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 0 12px rgba(37, 99, 235, 0.35)',
            transition: 'all 0.15s ease'
          }}
        >
          <span>{isUpdating ? 'Updating...' : 'Update'}</span>
          {!isUpdating && <ArrowRight style={{ width: '13px', height: '13px' }} />}
        </button>

        <button
          type="button"
          onClick={() => setShowNotification(false)}
          title="Dismiss"
          aria-label="Dismiss notification"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: '5px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X style={{ width: '15px', height: '15px' }} />
        </button>
      </div>
    </div>
  );
}
