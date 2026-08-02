import React from 'react';
import { PanelLeft, PanelLeftClose } from 'lucide-react';

export default function Header({ sidebarOpen, setSidebarOpen }) {
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
          border: '2px solid var(--ds-blue)',
          boxShadow: '0 0 10px rgba(79, 117, 255, 0.4)'
        }}
      />

      {/* Sidebar Toggle Button (Click to open or close sidebar) */}
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
    </div>
  );
}
