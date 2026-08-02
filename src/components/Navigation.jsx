import React from 'react';
import { MessageSquare, Sparkles, Globe, Database, Shield, Plus, User, Settings, LogOut, PanelLeftClose } from 'lucide-react';

export default function Navigation({
  sidebarOpen,
  setSidebarOpen,
  activeTab,
  setActiveTab,
  user,
  onLogout,
  onOpenSettings,
  conversations,
  activeConvId,
  loadConversation,
  startNewChat
}) {
  const navItems = [
    { id: 'chat', label: 'LAF Chat', icon: MessageSquare },
    { id: 'media', label: 'Multimodal Studio', icon: Sparkles },
    { id: 'trends', label: 'Global World Trends', icon: Globe },
    { id: 'memory', label: 'Memory Vault (DB)', icon: Database },
    { id: 'security', label: 'Security & E2EE', icon: Shield }
  ];

  return (
    <aside className={`floating-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      
      {/* Top Header inside sidebar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 4px 12px 4px', borderBottom: '1px solid var(--ds-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgPneYG2HNT8jsgsviQT-3j0Mj4tN_xUqwl9a9KYP9YE5Bu8TVGPXSLDI&s=10"
            alt="LAF Logo"
            style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <span style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fff', letterSpacing: '0.3px' }}>
            LAF
          </span>
        </div>

        <button
          onClick={() => setSidebarOpen(false)}
          style={{ background: 'transparent', border: 'none', color: 'var(--ds-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
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
          setActiveTab('chat');
          startNewChat();
          setSidebarOpen(false);
        }}
      >
        <Plus style={{ width: '18px', color: 'var(--ds-text-primary)' }} />
        <span>New chat</span>
      </button>

      {/* Workspace Switcher Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '12px 0 16px 0' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSidebarOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: isActive ? 'var(--ds-bg-card)' : 'transparent',
                color: isActive ? 'var(--ds-text-primary)' : 'var(--ds-text-secondary)',
                fontWeight: isActive ? '600' : '400',
                fontSize: '0.85rem',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <Icon style={{ width: '16px', color: isActive ? 'var(--ds-blue)' : 'var(--ds-text-muted)' }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Recent Chats List */}
      <div style={{ flex: 1, overflowY: 'auto', borderTop: '1px solid var(--ds-border)', paddingTop: '12px' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--ds-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 6px 8px 6px' }}>
          Recent Chats
        </div>

        {conversations && conversations.length > 0 ? (
          conversations.map(c => (
            <div
              key={c.id}
              onClick={() => {
                setActiveTab('chat');
                loadConversation(c.id);
                setSidebarOpen(false);
              }}
              style={{
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '2px',
                background: activeConvId === c.id ? 'var(--ds-bg-card-hover)' : 'transparent',
                cursor: 'pointer',
                fontSize: '0.83rem',
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

      {/* User Name & Profile at Bottom (Requirement) */}
      <div style={{ borderTop: '1px solid var(--ds-border)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--ds-blue-bg)', border: '1px solid var(--ds-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User style={{ width: '16px', color: 'var(--ds-blue)' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#fff' }}>{user?.username}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--accent-green)' }}>● Isolated DB Mounted</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={onOpenSettings} style={{ background: 'transparent', border: 'none', color: 'var(--ds-text-secondary)', cursor: 'pointer', padding: '4px' }} title="Settings">
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
