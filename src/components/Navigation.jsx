import React, { useState } from 'react';
import { Plus, PanelLeftClose, Trash2 } from 'lucide-react';

export default function Navigation({
  sidebarOpen,
  setSidebarOpen,
  conversations,
  activeConvId,
  loadConversation,
  deleteConversation,
  onClearAllConversations,
  startNewChat
}) {
  const [hoveredConvId, setHoveredConvId] = useState(null);

  return (
    <aside className={`floating-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      
      {/* Top Header: Logo + Title + Close Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 2px 10px 2px', borderBottom: '1px solid var(--ds-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgPneYG2HNT8jsgsviQT-3j0Mj4tN_xUqwl9a9KYP9YE5Bu8TVGPXSLDI&s=10"
            alt="LAF Logo"
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--ds-blue)',
              display: 'block',
              flexShrink: 0
            }}
          />
          <span style={{ fontSize: '1rem', fontWeight: '800', color: '#fff', letterSpacing: '0.5px', fontFamily: 'var(--font-title)', lineHeight: '1' }}>
            LAF
          </span>
        </div>

        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          style={{ background: 'transparent', border: 'none', color: 'var(--ds-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
          title="Close sidebar"
          aria-label="Close sidebar"
        >
          <PanelLeftClose style={{ width: '16px', height: '16px' }} />
        </button>
      </div>

      {/* New Chat Button */}
      <button
        type="button"
        className="ds-new-chat-btn"
        style={{ marginTop: '10px' }}
        onClick={() => {
          startNewChat();
          setSidebarOpen(false);
        }}
      >
        <Plus style={{ width: '16px', height: '16px', color: 'var(--ds-blue)' }} />
        <span>New chat</span>
      </button>

      {/* Recent Chats History Section */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', margin: '12px 0 8px 0', borderTop: '1px solid var(--ds-border)', paddingTop: '10px' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: '600', color: 'var(--ds-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 4px 6px 4px' }}>
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
              onMouseEnter={() => setHoveredConvId(c.id)}
              onMouseLeave={() => setHoveredConvId(null)}
              style={{
                padding: '7px 10px',
                borderRadius: '8px',
                marginBottom: '3px',
                background: activeConvId === c.id ? 'var(--ds-bg-card-hover)' : 'transparent',
                border: activeConvId === c.id ? '1px solid var(--ds-border)' : '1px solid transparent',
                cursor: 'pointer',
                fontSize: '0.82rem',
                color: activeConvId === c.id ? '#fff' : 'var(--ds-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '6px',
                position: 'relative',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {c.title || 'New Conversation'}
              </span>

              {/* Delete Icon on Hover or Active Conversation */}
              {(hoveredConvId === c.id || activeConvId === c.id) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(c.id);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    opacity: 0.85
                  }}
                  title="Delete conversation"
                  aria-label="Delete conversation"
                >
                  <Trash2 style={{ width: '13px', height: '13px' }} />
                </button>
              )}
            </div>
          ))
        ) : (
          <div style={{ fontSize: '0.75rem', color: 'var(--ds-text-muted)', padding: '12px 6px', textAlign: 'center' }}>
            No recent chats
          </div>
        )}
      </div>

      {/* Clear All Chats Footer Button (Only visible when chats exist) */}
      {conversations && conversations.length > 0 && onClearAllConversations && (
        <div style={{ borderTop: '1px solid var(--ds-border)', paddingTop: '8px', marginTop: 'auto' }}>
          <button
            type="button"
            onClick={() => {
              onClearAllConversations();
            }}
            className="sidebar-clear-chats-btn"
            style={{
              width: '100%',
              background: 'transparent',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              padding: '6px 8px',
              color: '#f87171',
              fontSize: '0.76rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
            title="Clear all conversations"
          >
            <Trash2 style={{ width: '12px', height: '12px' }} />
            <span>Clear all chats</span>
          </button>
        </div>
      )}

    </aside>
  );
}
