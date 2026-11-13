import React, { useState, useRef, useEffect } from 'react';
import { Settings, HelpCircle, Smartphone, Share2, Trash2, LogOut } from 'lucide-react';

export default function UserMenu({
  user,
  onOpenSettings,
  onOpenDownloadApp,
  onOpenHelpFeedback,
  onClearAllConversations,
  onLogout
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const isAppMode = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://') ||
    new URLSearchParams(window.location.search).get('mode') === 'app'
  );

  // Compute first letter of username or display name (default to 'U' if not provided)
  const username = user?.username || user?.name || 'User';
  const userInitial = (username.trim().charAt(0) || 'U').toUpperCase();

  // Close menu on click outside or Escape key press
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="floating-user-menu" ref={menuRef}>
      {/* Top Right Circle Avatar Trigger with User's First Letter */}
      <button
        type="button"
        className="floating-user-circle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title={username ? `${username} • Settings & Profile` : "Settings & Profile"}
        aria-label="User profile and settings"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="user-circle-initial">{userInitial}</span>
      </button>

      {/* Floating Settings & Profile Popover Dropdown */}
      {isOpen && (
        <div className="user-settings-popover" role="menu">
          {/* User Profile Header Card */}
          <div className="user-menu-profile-header">
            <div className="user-menu-avatar-small" aria-hidden="true">
              {userInitial}
            </div>
            <div className="user-menu-user-info">
              <div className="user-menu-username">{username}</div>
              <div className="user-menu-handle">@{username.toLowerCase()}</div>
            </div>
          </div>

          {/* Primary Settings Option (Prominently Featured) */}
          <button
            type="button"
            className="user-menu-item user-menu-settings-btn"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              if (onOpenSettings) onOpenSettings();
            }}
          >
            <Settings style={{ width: '16px', height: '16px', color: 'var(--ds-blue)' }} />
            <span>Settings</span>
          </button>

          {/* Help & Feedback Option */}
          {onOpenHelpFeedback && (
            <button
              type="button"
              className="user-menu-item"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onOpenHelpFeedback();
              }}
            >
              <HelpCircle style={{ width: '16px', height: '16px', color: 'var(--ds-blue)' }} />
              <span>Help & Feedback</span>
            </button>
          )}


          {/* Download / Share Application Option */}
          {onOpenDownloadApp && (
            <button
              type="button"
              className="user-menu-item"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onOpenDownloadApp();
              }}
            >
              {isAppMode ? (
                <Share2 style={{ width: '16px', height: '16px', color: 'var(--ds-blue)' }} />
              ) : (
                <Smartphone style={{ width: '16px', height: '16px', color: 'var(--ds-blue)' }} />
              )}
              <span>{isAppMode ? 'Share app' : 'Download app'}</span>
            </button>
          )}

          {/* Clear All Chats Option */}
          {onClearAllConversations && (
            <button
              type="button"
              className="user-menu-item"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onClearAllConversations();
              }}
              style={{ color: '#f87171' }}
            >
              <Trash2 style={{ width: '16px', height: '16px', color: '#f87171' }} />
              <span>Clear all chats</span>
            </button>
          )}

          {/* Log Out Option */}
          {onLogout && (
            <button
              type="button"
              className="user-menu-item logout-item"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
            >
              <LogOut style={{ width: '16px', height: '16px' }} />
              <span>Log out</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
