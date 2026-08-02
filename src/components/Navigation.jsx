import React from 'react';
import { MessageSquare, Sparkles, Globe, Database, Shield } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'chat', label: 'Reasoning AI', icon: MessageSquare },
    { id: 'media', label: 'Multimodal Studio', icon: Sparkles },
    { id: 'trends', label: 'Global Trends', icon: Globe },
    { id: 'memory', label: 'Memory Vault', icon: Database },
    { id: 'security', label: 'Security Vault', icon: Shield }
  ];

  return (
    <nav style={{
      width: '220px',
      background: 'rgba(10, 12, 20, 0.6)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 12px',
      justify: 'space-between',
      flexShrink: 0
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{
          fontSize: '0.68rem',
          fontWeight: '700',
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '1.2px',
          padding: '4px 12px',
          marginBottom: '8px'
        }}>
          Workspace
        </div>

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
                gap: '12px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: isActive ? 'rgba(0, 240, 255, 0.08)' : 'transparent',
                color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                fontWeight: isActive ? '600' : '400',
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left'
              }}
            >
              <Icon style={{ width: '17px', color: isActive ? 'var(--accent-cyan)' : 'var(--text-tertiary)' }} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
        <div style={{ color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '2px' }}>LAF Core 2.5</div>
        <div>AES-256 Partitioned DB</div>
      </div>
    </nav>
  );
}
