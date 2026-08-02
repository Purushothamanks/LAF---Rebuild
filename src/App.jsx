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

  // DeepSeek Chat UI State Controls
  const [selectedModel, setSelectedModel] = useState('LAF-R1'); // 'LAF-R1' or 'LAF-V3'
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [deepThinkingEnabled, setDeepThinkingEnabled] = useState(true);
  const [concisenessMode, setConcisenessMode] = useState('short'); // 'short' or 'detailed'

  // Conversation history state
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);

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
    <div className="ds-app-shell">
      {/* Passwordless Login Modal if unauthenticated */}
      {!user && <LoginModal onLogin={handleLogin} />}

      {/* DeepSeek Sidebar Navigation */}
      {user && (
        <Navigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          onLogout={handleLogout}
          onOpenSettings={() => setIsSettingsOpen(true)}
          conversations={conversations}
          activeConvId={activeConvId}
          loadConversation={loadConversation}
          startNewChat={startNewChat}
        />
      )}

      {/* Main Workspace Body */}
      {user && (
        <div style={{ flex: 1, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          
          {/* DeepSeek Top Control Header */}
          <Header
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            webSearchEnabled={webSearchEnabled}
            setWebSearchEnabled={setWebSearchEnabled}
            deepThinkingEnabled={deepThinkingEnabled}
            setDeepThinkingEnabled={setDeepThinkingEnabled}
            concisenessMode={concisenessMode}
            setConcisenessMode={setConcisenessMode}
          />

          {/* Active Workspace View */}
          <main style={{ flex: 1, height: 'calc(100% - 56px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {activeTab === 'chat' && (
              <ChatView
                user={user}
                token={token}
                customApiKey={customApiKey}
                selectedModel={selectedModel}
                webSearchEnabled={webSearchEnabled}
                setWebSearchEnabled={setWebSearchEnabled}
                deepThinkingEnabled={deepThinkingEnabled}
                setDeepThinkingEnabled={setDeepThinkingEnabled}
                concisenessMode={concisenessMode}
                activeConvId={activeConvId}
                setActiveConvId={setActiveConvId}
                messages={messages}
                setMessages={setMessages}
                fetchConversations={() => fetchConversations(token)}
              />
            )}
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
