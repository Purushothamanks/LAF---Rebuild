import React from 'react';
import { MessageSquare, Sparkles, Globe, Database, Shield, Plus, User, Settings, LogOut, ChevronRight } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab, user, onLogout, onOpenSettings, conversations, activeConvId, loadConversation, startNewChat }) {
  const navItems = [
    { id: 'chat', label: 'LAF Chat (R1 Reasoning)', icon: MessageSquare },
    { id: 'media', label: 'Multimodal Studio', icon: Sparkles },
    { id: 'trends', label: 'Global World Trends', icon: Globe },
    { id: 'memory', label: 'Memory Vault (Isolated DB)', icon: Database },
    { id: 'security', label: 'Security & E2EE Vault', icon: Shield }
  ];

  return (
    <aside className="ds-sidebar">
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 4px 16px 4px', borderBottom: '1px solid var(--border-deepseek)', marginBottom: '12px' }}>
        <img
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgPneYG2HNT8jsgsviQT-3j0Mj4tN_xUqwl9a9KYP9YE5Bu8TVGPXSLDI&s=10"
          alt="LAF Logo"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid var(--accent-ds-blue)',
            boxShadow: '0 0 10px rgba(79, 117, 255, 0.4)'
          }}
        />
        <div>
          <div style={{ fontFamily: 'var(--font-title)', fontSize: '1.2rem', fontWeight: '800', color: '#fff', letterSpacing: '0.5px' }}>
            LAF AI
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--accent-ds-blue)', fontWeight: '600', letterSpacing: '0.5px' }}>
            Look At the Future
          </div>
        </div>
      </div>

      {/* New Chat Button */}
      <button className="btn-ds-new-chat" onClick={() => { setActiveTab('chat'); startNewChat(); }}>
        <Plus style={{ width: '18px', color: 'var(--accent-ds-blue)' }} />
        <span>New chat</span>
      </button>

      {/* Main Workspace Navigation items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: isActive ? 'var(--accent-ds-blue-bg)' : 'transparent',
                color: isActive ? 'var(--accent-ds-blue)' : 'var(--text-muted)',
                fontWeight: isActive ? '600' : '400',
                fontSize: '0.85rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon style={{ width: '16px', color: isActive ? 'var(--accent-ds-blue)' : 'var(--text-dim)' }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Conversation History Section */}
      <div style={{ flex: 1, overflowY: 'auto', borderTop: '1px solid var(--border-deepseek)', paddingTop: '12px', margin: '4px 0' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', padding: '0 8px 8px 8px' }}>
          Recent Conversations
        </div>

        {conversations && conversations.length > 0 ? (
          conversations.map(c => (
            <div
              key={c.id}
              onClick={() => { setActiveTab('chat'); loadConversation(c.id); }}
              style={{
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '4px',
                background: activeConvId === c.id ? 'rgba(79, 117, 255, 0.15)' : 'transparent',
                border: activeConvId === c.id ? '1px solid rgba(79, 117, 255, 0.3)' : '1px solid transparent',
                cursor: 'pointer',
                fontSize: '0.82rem',
                color: activeConvId === c.id ? '#fff' : 'var(--text-muted)',
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
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', padding: '8px', textAlign: 'center' }}>
            No prior chat history yet.
          </div>
        )}
      </div>

      {/* User Account Dock at Bottom */}
      <div style={{ borderTop: '1px solid var(--border-deepseek)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-ds-blue-bg)', border: '1px solid var(--accent-ds-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User style={{ width: '16px', color: 'var(--accent-ds-blue)' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff' }}>{user?.username}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--accent-green)' }}>● Isolated DB Active</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={onOpenSettings} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }} title="Settings">
            <Settings style={{ width: '16px' }} />
          </button>
          <button onClick={onLogout} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }} title="Logout">
            <LogOut style={{ width: '16px' }} />
          </button>
        </div>
      </div>
    </aside>
  );
}
