import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import ChatView from './components/ChatView';
import MediaStudio from './components/MediaStudio';
import TrendsView from './components/TrendsView';
import MemoryVault from './components/MemoryVault';
import SecurityVault from './components/SecurityVault';
import LoginModal from './components/LoginModal';
import SettingsModal from './components/SettingsModal';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('laf_token') || '');
  const [activeTab, setActiveTab] = useState('chat');
  const [customApiKey, setCustomApiKey] = useState(localStorage.getItem('laf_custom_api_key') || '');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);

  // Validate session token on mount
  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user) {
            setUser(data.user);
          } else {
            handleLogout();
          }
        })
        .catch(() => handleLogout())
        .finally(() => setLoadingSession(false));
    } else {
      setLoadingSession(false);
    }
  }, [token]);

  const handleLogin = (userData, sessionToken) => {
    setUser(userData);
    setToken(sessionToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('laf_token');
    localStorage.removeItem('laf_username');
    setUser(null);
    setToken('');
  };

  if (loadingSession) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#070913', color: '#00f0ff' }}>
        <div style={{ textAlign: 'center' }}>
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgPneYG2HNT8jsgsviQT-3j0Mj4tN_xUqwl9a9KYP9YE5Bu8TVGPXSLDI&s=10"
            alt="LAF Logo"
            style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '16px', border: '2px solid #00f0ff', boxShadow: '0 0 20px #00f0ff' }}
          />
          <h2 className="text-glow">LAF AI Mount Active...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Background Mesh */}
      <div className="bg-mesh" />

      {/* Passwordless Login Modal if unauthenticated */}
      {!user && <LoginModal onLogin={handleLogin} />}

      {/* Main Header */}
      <Header
        user={user}
        onLogout={handleLogout}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* App Workspace Body */}
      {user && (
        <div className="app-container" style={{ flex: 1, overflow: 'hidden' }}>
          
          {/* Navigation Drawer */}
          <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Active Workspace View */}
          <main style={{ flex: 1, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {activeTab === 'chat' && <ChatView user={user} token={token} customApiKey={customApiKey} />}
            {activeTab === 'media' && <MediaStudio token={token} />}
            {activeTab === 'trends' && <TrendsView />}
            {activeTab === 'memory' && <MemoryVault user={user} token={token} />}
            {activeTab === 'security' && <SecurityVault token={token} />}
          </main>

        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        customApiKey={customApiKey}
        setCustomApiKey={setCustomApiKey}
      />
    </div>
  );
}
