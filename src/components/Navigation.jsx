import React, { useState, useRef, useEffect } from 'react';
import { Plus, User, MoreHorizontal, Smartphone, Settings, HelpCircle, LogOut, PanelLeftClose } from 'lucide-react';

export default function Navigation({
  sidebarOpen,
  setSidebarOpen,
  user,
  onLogout,
  onOpenSettings,
  onOpenDownloadApp,
  onOpenHelpFeedback,
  conversations,
  activeConvId,
  loadConversation,
  startNewChat
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close popup menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <aside className={`floating-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      
      {/* Top Header: Logo + Title + Close Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 2px 14px 2px', borderBottom: '1px solid var(--ds-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgPneYG2HNT8jsgsviQT-3j0Mj4tN_xUqwl9a9KYP9YE5Bu8TVGPXSLDI&s=10"
            alt="LAF Logo"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--ds-blue)',
              display: 'block',
              flexShrink: 0
            }}
          />
          <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff', letterSpacing: '0.5px', fontFamily: 'var(--font-title)', lineHeight: '1' }}>
            LAF
          </span>
        </div>

        <button
          onClick={() => setSidebarOpen(false)}
          style={{ background: 'transparent', border: 'none', color: 'var(--ds-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Close sidebar"
        >
          <PanelLeftClose style={{ width: '18px' }} />
        </button>
      </div>

      {/* New Chat Button */}
      <button
        className="ds-new-chat-btn"
        style={{ marginTop: '12px' }}
        onClick={() => {
          startNewChat();
          setSidebarOpen(false);
        }}
      >
        <Plus style={{ width: '18px', color: 'var(--ds-blue)' }} />
        <span>New chat</span>
      </button>

      {/* Recent Chats History Section */}
      <div style={{ flex: 1, overflowY: 'auto', margin: '16px 0', borderTop: '1px solid var(--ds-border)', paddingTop: '12px' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--ds-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 6px 8px 6px' }}>
          Recent Chats
        </div>

        {conversations && conversations.length > 0 ? (
          conversations.map(c => (
            <div
              key={c.id}
              onClick={() => {
                loadConversation(c.id);
                setSidebarOpen(false);
              }}
              style={{
                padding: '9px 14px',
                borderRadius: 'var(--radius-oval)',
                marginBottom: '4px',
                background: activeConvId === c.id ? 'var(--ds-bg-card-hover)' : 'transparent',
                border: activeConvId === c.id ? '1px solid var(--ds-border)' : '1px solid transparent',
                cursor: 'pointer',
                fontSize: '0.84rem',
                color: activeConvId === c.id ? '#fff' : 'var(--ds-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between'
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.title || 'New Conversation'}
              </span>
            </div>
          ))
        ) : (
          <div style={{ fontSize: '0.78rem', color: 'var(--ds-text-muted)', padding: '8px', textAlign: 'center' }}>
            No recent chats
          </div>
        )}
      </div>

      {/* User Profile at Bottom + (...) More Options Menu */}
      <div style={{ borderTop: '1px solid var(--ds-border)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--ds-blue-bg)', border: '1px solid var(--ds-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User style={{ width: '16px', color: 'var(--ds-blue)' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#fff', lineHeight: '1.2' }}>{user?.username}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--ds-text-muted)' }}>@{user?.username?.toLowerCase()}</div>
          </div>
        </div>

        {/* (...) More Options Trigger Button */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              background: showMenu ? 'var(--ds-blue-bg)' : 'transparent',
              border: showMenu ? '1px solid var(--ds-blue)' : 'none',
              color: showMenu ? '#fff' : 'var(--ds-text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            title="More Options (...)"
          >
            <MoreHorizontal style={{ width: '20px', height: '20px' }} />
          </button>

          {/* (...) Popover Dropdown Menu */}
          {showMenu && (
            <div className="more-options-popover">
              <button
                className="more-options-item"
                onClick={() => {
                  setShowMenu(false);
                  onOpenDownloadApp();
                }}
              >
                <Smartphone style={{ width: '16px', color: 'var(--ds-blue)' }} />
                <span>Download app</span>
              </button>

              <button
                className="more-options-item"
                onClick={() => {
                  setShowMenu(false);
                  onOpenSettings();
                }}
              >
                <Settings style={{ width: '16px', color: 'var(--ds-blue)' }} />
                <span>Settings</span>
              </button>

              <button
                className="more-options-item"
                onClick={() => {
                  setShowMenu(false);
                  onOpenHelpFeedback();
                }}
              >
                <HelpCircle style={{ width: '16px', color: 'var(--ds-blue)' }} />
                <span>Help & Feedback</span>
              </button>

              <div style={{ height: '1px', background: 'var(--ds-border)', margin: '4px 0' }} />

              <button
                className="more-options-item logout-item"
                onClick={() => {
                  setShowMenu(false);
                  onLogout();
                }}
              >
                <LogOut style={{ width: '16px' }} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

    </aside>
  );
}
