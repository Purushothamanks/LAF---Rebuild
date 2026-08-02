import React from 'react';
import { PanelLeft, PanelLeftClose, Plus } from 'lucide-react';

export default function Header({ sidebarOpen, setSidebarOpen, startNewChat, setActiveTab }) {
  return (
    <div className="floating-top-bar">
      {/* Circle LAF Logo */}
      <img
        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgPneYG2HNT8jsgsviQT-3j0Mj4tN_xUqwl9a9KYP9YE5Bu8TVGPXSLDI&s=10"
        alt="LAF Logo"
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid var(--ds-blue)'
        }}
      />

      {/* Sidebar Toggle Button (Click to open or close) */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--ds-text-primary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          padding: '4px'
        }}
        title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        {sidebarOpen ? (
          <PanelLeftClose style={{ width: '20px', color: 'var(--ds-blue)' }} />
        ) : (
          <PanelLeft style={{ width: '20px', color: 'var(--ds-text-primary)' }} />
        )}
      </button>

      {/* Floating New Chat Option */}
      <button
        onClick={() => {
          setActiveTab('chat');
          startNewChat();
        }}
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid var(--ds-border)',
          color: '#fff',
          borderRadius: 'var(--radius-full)',
          padding: '4px 12px',
          fontSize: '0.8rem',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <Plus style={{ width: '14px', color: 'var(--ds-blue)' }} />
        <span>New chat</span>
      </button>
    </div>
  );
}
