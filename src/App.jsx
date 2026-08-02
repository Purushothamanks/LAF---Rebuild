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
import DownloadAppModal from './components/DownloadAppModal';
import HelpFeedbackModal from './components/HelpFeedbackModal';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('laf_token') || '');
  const [activeTab, setActiveTab] = useState('chat');
  const [customApiKey, setCustomApiKey] = useState(localStorage.getItem('laf_custom_api_key') || '');
  
  // Theme state ('dark', 'cyber', 'light')
  const [theme, setTheme] = useState(localStorage.getItem('laf_theme') || 'dark');

  // Modal toggle states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDownloadAppOpen, setIsDownloadAppOpen] = useState(false);
  const [isHelpFeedbackOpen, setIsHelpFeedbackOpen] = useState(false);

  const [loadingSession, setLoadingSession] = useState(true);

  // Sidebar toggle state (open / closed)
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Conversation state
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);

  // Sync theme attribute to HTML root element whenever theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('laf_theme', theme);
  }, [theme]);

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
            fetchConversations(token);
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

  const fetchConversations = async (authToken) => {
    const t = authToken || token;
    if (!t) return;
    try {
      const res = await fetch('/api/chat/conversations', {
        headers: { 'Authorization': `Bearer ${t}` }
      });
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadConversation = async (convId) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/chat/conversation/${convId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.conversation) {
        setActiveConvId(data.conversation.id);
        setMessages(data.conversation.messages || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteConversation = async (convId) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/chat/conversation/${convId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        if (activeConvId === convId) {
          startNewChat();
        }
        fetchConversations(token);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
  };

  const handleLogin = (userData, sessionToken) => {
    setUser(userData);
    setToken(sessionToken);
    fetchConversations(sessionToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('laf_token');
    localStorage.removeItem('laf_username');
    setUser(null);
    setToken('');
  };

  if (loadingSession) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0e1117', color: '#4f75ff' }}>
        <div style={{ textAlign: 'center' }}>
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgPneYG2HNT8jsgsviQT-3j0Mj4tN_xUqwl9a9KYP9YE5Bu8TVGPXSLDI&s=10"
            alt="LAF Logo"
            style={{ width: '70px', height: '70px', borderRadius: '50%', marginBottom: '16px', border: '2px solid #4f75ff', boxShadow: '0 0 20px rgba(79, 117, 255, 0.4)' }}
          />
          <h2 style={{ fontFamily: 'var(--font-title)', color: '#fff' }}>Mounting LAF AI Cluster...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Passwordless Login Modal if unauthenticated */}
      {!user && <LoginModal onLogin={handleLogin} />}

      {/* Floating Top-Left Bar */}
      {user && (
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          startNewChat={startNewChat}
          setActiveTab={setActiveTab}
        />
      )}

      {/* Collapsible Floating Sidebar (Includes Trash Delete Icon for each conversation) */}
      {user && (
        <Navigation
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          onLogout={handleLogout}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenDownloadApp={() => setIsDownloadAppOpen(true)}
          onOpenHelpFeedback={() => setIsHelpFeedbackOpen(true)}
          conversations={conversations}
          activeConvId={activeConvId}
          loadConversation={loadConversation}
          deleteConversation={deleteConversation}
          startNewChat={startNewChat}
        />
      )}

      {/* Main Workspace Body */}
      {user && (
        <main style={{ width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'chat' && (
            <ChatView
              user={user}
              token={token}
              customApiKey={customApiKey}
              activeConvId={activeConvId}
              setActiveConvId={setActiveConvId}
              messages={messages}
              setMessages={setMessages}
              fetchConversations={() => fetchConversations(token)}
            />
          )}
          {activeTab === 'media' && <div style={{ paddingTop: '60px', height: '100%' }}><MediaStudio token={token} /></div>}
          {activeTab === 'trends' && <div style={{ paddingTop: '60px', height: '100%' }}><TrendsView /></div>}
          {activeTab === 'memory' && <div style={{ paddingTop: '60px', height: '100%' }}><MemoryVault user={user} token={token} /></div>}
          {activeTab === 'security' && <div style={{ paddingTop: '60px', height: '100%' }}><SecurityVault token={token} /></div>}
        </main>
      )}

      {/* Settings Modal (Includes working theme selector & editable fields) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        onLogout={handleLogout}
        customApiKey={customApiKey}
        setCustomApiKey={setCustomApiKey}
        theme={theme}
        setTheme={setTheme}
      />

      {/* Download App Modal */}
      <DownloadAppModal
        isOpen={isDownloadAppOpen}
        onClose={() => setIsDownloadAppOpen(false)}
      />

      {/* Help & Feedback Modal (Dispatches feedback to purushothamaks1711@gmail.com) */}
      <HelpFeedbackModal
        isOpen={isHelpFeedbackOpen}
        onClose={() => setIsHelpFeedbackOpen(false)}
        token={token}
      />
    </div>
  );
}
