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
import { apiUrl } from './api';
import { getLocalUserDb, deleteLocalConversation } from './utils/aiClient';

export default function App() {
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('laf_username') : null;
  const storedToken = typeof window !== 'undefined' ? localStorage.getItem('laf_token') : null;

  const [user, setUser] = useState(storedUser ? { username: storedUser } : null);
  const [token, setToken] = useState(storedToken || '');
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

  // Validate session token on mount while maintaining permanent logged-in username
  useEffect(() => {
    const activeName = user?.username || storedUser;
    if (token) {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 3500);

      fetch(apiUrl('/api/auth/me'), {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: controller.signal
      })
        .then(res => {
          clearTimeout(tid);
          const ct = res.headers.get('content-type') || '';
          if (res.ok && ct.includes('application/json')) {
            return res.json();
          }
          return null;
        })
        .then(data => {
          if (data && data.success && data.user) {
            setUser(data.user);
            fetchConversations(token, data.user.username);
          } else if (activeName) {
            setUser({ username: activeName });
            fetchConversations(token, activeName);
          }
        })
        .catch(err => {
          console.warn('Session check note:', err.message);
          if (activeName) {
            setUser({ username: activeName });
            fetchConversations(token, activeName);
          }
        })
        .finally(() => setLoadingSession(false));
    } else if (storedUser) {
      setUser({ username: storedUser });
      fetchConversations('', storedUser);
      setLoadingSession(false);
    } else {
      setLoadingSession(false);
    }
  }, [token]);

  const fetchConversations = async (authToken, explicitUsername) => {
    const activeUsername = explicitUsername || user?.username || storedUser;
    if (!activeUsername) return;

    const t = authToken || token;
    let loaded = false;

    if (t) {
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(apiUrl('/api/chat/conversations'), {
          headers: { 'Authorization': `Bearer ${t}` },
          signal: controller.signal
        });
        clearTimeout(tid);
        const ct = res.headers.get('content-type') || '';
        if (res.ok && ct.includes('application/json')) {
          const data = await res.json();
          if (data.success && Array.isArray(data.conversations)) {
            setConversations(data.conversations);
            loaded = true;
          }
        }
      } catch (e) {
        console.warn('Backend conversations note:', e.message);
      }
    }

    if (!loaded) {
      // Fallback to local DB
      const db = getLocalUserDb(activeUsername);
      if (db && Array.isArray(db.conversations)) {
        setConversations(db.conversations.map(c => ({
          id: c.id,
          title: c.title,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          messageCount: c.messages ? c.messages.length : 0
        })));
      }
    }
  };

  const loadConversation = async (convId) => {
    const activeUsername = user?.username || storedUser;
    let loaded = false;

    if (token) {
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(apiUrl(`/api/chat/conversation/${convId}`), {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: controller.signal
        });
        clearTimeout(tid);
        const ct = res.headers.get('content-type') || '';
        if (res.ok && ct.includes('application/json')) {
          const data = await res.json();
          if (data.success && data.conversation) {
            setActiveConvId(data.conversation.id);
            setMessages(data.conversation.messages || []);
            loaded = true;
          }
        }
      } catch (e) {
        console.warn('Backend load conversation note:', e.message);
      }
    }

    if (!loaded && activeUsername) {
      const db = getLocalUserDb(activeUsername);
      const found = db?.conversations?.find(c => c.id === convId);
      if (found) {
        setActiveConvId(found.id);
        setMessages(found.messages || []);
      }
    }
  };

  const deleteConversation = async (convId) => {
    const activeUsername = user?.username || storedUser;
    if (token) {
      try {
        await fetch(apiUrl(`/api/chat/conversation/${convId}`), {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {}
    }

    if (activeUsername) {
      deleteLocalConversation(activeUsername, convId);
    }

    if (activeConvId === convId) {
      startNewChat();
    }
    fetchConversations(token, activeUsername);
  };

  const startNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
  };

  const handleLogin = (userData, sessionToken) => {
    localStorage.setItem('laf_token', sessionToken);
    if (userData?.username) {
      localStorage.setItem('laf_username', userData.username);
    }
    setUser(userData);
    setToken(sessionToken);
    fetchConversations(sessionToken, userData?.username);
  };

  const handleLogout = () => {
    localStorage.removeItem('laf_token');
    localStorage.removeItem('laf_username');
    setUser(null);
    setToken('');
    setConversations([]);
    setMessages([]);
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

      {/* Collapsible Floating Sidebar */}
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
              fetchConversations={() => fetchConversations(token, user?.username)}
            />
          )}
          {activeTab === 'media' && <div style={{ paddingTop: '60px', height: '100%' }}><MediaStudio token={token} /></div>}
          {activeTab === 'trends' && <div style={{ paddingTop: '60px', height: '100%' }}><TrendsView /></div>}
          {activeTab === 'memory' && <div style={{ paddingTop: '60px', height: '100%' }}><MemoryVault user={user} token={token} /></div>}
          {activeTab === 'security' && <div style={{ paddingTop: '60px', height: '100%' }}><SecurityVault token={token} /></div>}
        </main>
      )}

      {/* Settings Modal */}
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

      {/* Help & Feedback Modal */}
      <HelpFeedbackModal
        isOpen={isHelpFeedbackOpen}
        onClose={() => setIsHelpFeedbackOpen(false)}
        token={token}
      />
    </div>
  );
}
