import React from 'react';
import { MessageSquare, Sparkles, Globe, Database, Shield, Zap } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'chat', label: 'Reasoning AI', icon: MessageSquare, badge: 'Fast' },
    { id: 'media', label: 'Multimodal Studio', icon: Sparkles, badge: 'Img/Aud/Vid' },
    { id: 'trends', label: 'Global Trends', icon: Globe, badge: 'Live' },
    { id: 'memory', label: 'Memory Vault', icon: Database, badge: 'Isolated DB' },
    { id: 'security', label: 'Security Vault', icon: Shield, badge: 'AES-256' }
  ];

  return (
    <nav className="glass-panel" style={{
      borderRadius: 0,
      borderTop: 'none',
      borderLeft: 'none',
      borderBottom: 'none',
      width: '240px',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 12px',
      justify: 'space-between',
      flexShrink: 0
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{
          fontSize: '0.72rem',
          fontWeight: '700',
          color: 'var(--text-dim)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          padding: '6px 12px',
          marginBottom: '4px'
        }}>
          Navigation Workspaces
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
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                border: isActive ? '1px solid var(--primary-cyan)' : '1px solid transparent',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.15) 0%, rgba(138, 43, 226, 0.15) 100%)'
                  : 'transparent',
                color: isActive ? 'var(--primary-cyan)' : 'var(--text-muted)',
                fontWeight: isActive ? '700' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon style={{ width: '18px', color: isActive ? 'var(--primary-cyan)' : 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.92rem' }}>{item.label}</span>
              </div>
              {item.badge && (
                <span style={{
                  fontSize: '0.65rem',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  background: isActive ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  color: isActive ? 'var(--primary-cyan)' : 'var(--text-dim)',
                  fontWeight: '600'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* System Status Footer */}
      <div className="glass-panel" style={{ padding: '12px', borderRadius: 'var(--radius-sm)', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--accent-green)' }}>
          <Zap style={{ width: '14px' }} />
          <span>LAF Core Engine Ready</span>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
          Response Speed: &lt; 350ms
        </div>
      </div>
    </nav>
  );
}
