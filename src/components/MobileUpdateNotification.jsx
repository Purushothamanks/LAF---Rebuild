import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, RefreshCw, Smartphone, X } from 'lucide-react';
import { 
  CURRENT_BUILD_ID, 
  CURRENT_BUILD_TIMESTAMP, 
  isMobileAppEnvironment, 
  checkRemoteVersion, 
  applyLiveAppUpdate 
} from '../utils/liveSync';

export default function MobileUpdateNotification() {
  const [showNotification, setShowNotification] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [remoteBuildInfo, setRemoteBuildInfo] = useState(null);
  const pollingRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // STRICT CHECK: ONLY show for installed Mobile App (PWA, WebAPK, standalone, fullscreen, ?mode=app)
    // NEVER show on the standard desktop/mobile browser website
    const isApp = isMobileAppEnvironment();
    if (!isApp) return;

    // 1. Initial local build check: has this mobile app instance acknowledged the latest client build?
    const appliedBuild = localStorage.getItem('laf_applied_mobile_build');
    if (appliedBuild !== CURRENT_BUILD_ID) {
      const timer = setTimeout(() => {
        setShowNotification(true);
      }, 450);
      return () => clearTimeout(timer);
    }

    // 2. Active Live Sync: verify directly with server version.json
    const runLiveSyncCheck = async () => {
      const remote = await checkRemoteVersion();
      if (!remote) return;

      const hasRemoteUpdate = Boolean(
        (remote.buildTimestamp && remote.buildTimestamp > CURRENT_BUILD_TIMESTAMP) ||
        (remote.buildId && remote.buildId !== CURRENT_BUILD_ID)
      );

      if (hasRemoteUpdate) {
        setRemoteBuildInfo(remote);
        setShowNotification(true);
      }
    };

    // Run initial live check
    runLiveSyncCheck();

    // 3. Live Sync Polling (every 8 seconds) & Visibility listener (when user switches back to app)
    pollingRef.current = setInterval(runLiveSyncCheck, 8000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        runLiveSyncCheck();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleUpdateClick = async () => {
    setIsUpdating(true);
    const targetBuild = remoteBuildInfo?.buildId || CURRENT_BUILD_ID;
    await applyLiveAppUpdate(targetBuild);
  };

  if (!showNotification) return null;

  return (
    <div
      className="mobile-update-notification-banner"
      style={{
        position: 'fixed',
        top: 'calc(14px + env(safe-area-inset-top, 0px))',
        left: '12px',
        right: '12px',
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(59, 130, 246, 0.55)',
        borderRadius: '16px',
        padding: '10px 14px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.75), 0 0 24px rgba(59, 130, 246, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        animation: 'mobileUpdateSlideDown 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards'
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
            minWidth: '34px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            border: '1px solid rgba(147, 197, 253, 0.4)',
            boxShadow: '0 0 12px rgba(37, 99, 235, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}
          aria-hidden="true"
        >
          <Smartphone style={{ width: '18px', height: '18px' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span
            style={{
              fontFamily: 'var(--font-title, sans-serif)',
              fontSize: '0.95rem',
              fontWeight: 700,
              color: '#f8fafc',
              lineHeight: 1.2,
              letterSpacing: '0.2px'
            }}
          >
            App Update
          </span>
          <span
            style={{
              fontFamily: 'var(--font-main, sans-serif)',
              fontSize: '0.75rem',
              color: '#94a3b8',
              lineHeight: 1.25,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            Tap update to apply latest changes instantly
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleUpdateClick}
          disabled={isUpdating}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: '#ffffff',
            border: '1px solid rgba(147, 197, 253, 0.5)',
            boxShadow: '0 0 14px rgba(37, 99, 235, 0.45)',
            borderRadius: '9999px',
            padding: '7px 14px',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: isUpdating ? 'wait' : 'pointer',
            transition: 'all 0.15s ease',
            outline: 'none'
          }}
          aria-label="Apply app update instantly"
        >
          {isUpdating ? (
            <>
              <RefreshCw style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} />
              <span>Updating...</span>
            </>
          ) : (
            <>
              <span>Update</span>
              <ArrowRight style={{ width: '13px', height: '13px' }} />
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowNotification(false)}
          aria-label="Dismiss update notification"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '50%',
            width: '26px',
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: 0
          }}
        >
          <X style={{ width: '14px', height: '14px' }} />
        </button>
      </div>
    </div>
  );
}
