import React, { useState, useEffect, useRef } from 'react';
import { Send, Volume2, Copy, Check, RefreshCw } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Custom Marked renderer to format code blocks into sleek box layout
const renderer = new marked.Renderer();
renderer.code = function ({ text, lang }) {
  const language = (lang || 'code').trim();
  const escapedCode = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const encodedText = encodeURIComponent(text);

  return `<div class="code-box">
    <div class="code-box-header">
      <span class="code-box-lang">${language}</span>
      <button class="code-box-copy-btn" onclick="navigator.clipboard.writeText(decodeURIComponent('${encodedText}')); this.innerText = 'Copied!'; setTimeout(() => this.innerText = 'Copy code', 2000);">
        Copy code
      </button>
    </div>
    <pre><code class="language-${language}">${escapedCode}</code></pre>
  </div>`;
};

marked.setOptions({ renderer });

export default function ChatView({
  user,
  token,
  customApiKey,
  activeConvId,
  setActiveConvId,
  messages,
  setMessages,
  fetchConversations
}) {
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [speakingIndex, setSpeakingIndex] = useState(null);

  const messagesEndRef = useRef(null);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || loading) return;

    const userMsgText = inputPrompt.trim();
    setInputPrompt('');

    // Append user message
    const newHistory = [...messages, { role: 'user', content: userMsgText, timestamp: new Date().toISOString() }];
    setMessages(newHistory);
    setLoading(true);

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: userMsgText,
          conversationId: activeConvId,
          history: messages,
          customApiKey
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActiveConvId(data.conversationId);
        
        const fullContent = data.response.content || '';
        
        // Add complete response to messages list directly
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: fullContent, provider: data.response.provider }
        ]);

        setLoading(false);
        fetchConversations();
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: `Error: ${data.error || 'Failed to process request'}`, provider: 'System Error' }
        ]);
        setLoading(false);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Connection error with LAF AI cluster.', provider: 'Offline' }
      ]);
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSpeak = (text, idx) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (speakingIndex === idx) {
        setSpeakingIndex(null);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.onend = () => setSpeakingIndex(null);
      setSpeakingIndex(idx);
      window.speechSynthesis.speak(utterance);
    }
  };

  const userInitial = (user?.username || 'S').substring(0, 1).toUpperCase();

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', background: 'var(--ds-bg-main)', paddingTop: '60px' }}>
      
      {/* Messages Scroll Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ maxWidth: '820px', width: '92%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {messages.length === 0 ? (
            /* Floating Centered Welcome Screen */
            <div style={{ marginTop: '100px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgPneYG2HNT8jsgsviQT-3j0Mj4tN_xUqwl9a9KYP9YE5Bu8TVGPXSLDI&s=10"
                alt="LAF Logo"
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  marginBottom: '16px',
                  boxShadow: '0 0 24px rgba(79, 117, 255, 0.4)'
                }}
              />

              <h1 style={{ fontSize: '2.2rem', fontWeight: '800', color: '#fff', marginBottom: '8px', fontFamily: 'var(--font-title)' }}>
                Hi, I'm LAF.
              </h1>
              <p style={{ color: 'var(--ds-text-secondary)', fontSize: '0.98rem', marginBottom: '36px' }}>
                How can I help you today?
              </p>

              {/* Floating Centered Oval Input Box */}
              <form onSubmit={handleSend} className="floating-input-card" style={{ background: 'rgba(23, 28, 38, 0.95)' }}>
                <textarea
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Message LAF..."
                  rows={2}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none',
                    resize: 'none',
                    maxHeight: '160px'
                  }}
                />

                {/* Dead-Centered Send Button */}
                <button
                  type="submit"
                  disabled={loading || !inputPrompt.trim()}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: inputPrompt.trim() ? 'var(--ds-blue)' : 'var(--ds-bg-card)',
                    border: 'none',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: inputPrompt.trim() ? 'pointer' : 'default',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                    padding: 0,
                    margin: 0
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', transform: 'translate(-1px, 1px)' }}>
                    <Send style={{ width: '16px', height: '16px' }} />
                  </div>
                </button>
              </form>
            </div>
          ) : (
            /* Active Conversation Messages List */
            messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: isUser ? 'row-reverse' : 'row',
                    gap: '14px',
                    alignItems: 'flex-start',
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '94%'
                  }}
                >
                  {/* Perfectly Centered Avatar Icon Circle */}
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      minWidth: '34px',
                      minHeight: '34px',
                      borderRadius: '50%',
                      background: isUser ? 'var(--ds-blue)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'center',
                      flexShrink: 0,
                      overflow: 'hidden',
                      marginTop: '2px',
                      boxShadow: !isUser ? '0 0 10px rgba(79, 117, 255, 0.4)' : 'none'
                    }}
                  >
                    {isUser ? (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'center',
                        width: '100%',
                        height: '100%',
                        fontSize: '0.92rem',
                        fontWeight: '800',
                        color: '#fff',
                        lineHeight: 1,
                        textTransform: 'uppercase',
                        userSelect: 'none',
                        margin: 0,
                        padding: 0,
                        transform: 'translateY(-0.5px)'
                      }}>
                        {userInitial}
                      </span>
                    ) : (
                      <img
                        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgPneYG2HNT8jsgsviQT-3j0Mj4tN_xUqwl9a9KYP9YE5Bu8TVGPXSLDI&s=10"
                        alt="LAF Logo"
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }}
                      />
                    )}
                  </div>

                  {/* Clean Text Message Container */}
                  <div style={{ flex: 1, minWidth: 0, textAlign: isUser ? 'right' : 'left' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: '700', color: isUser ? 'var(--ds-text-secondary)' : 'var(--ds-blue)', marginBottom: '4px' }}>
                      {isUser ? user.username : 'LAF AI'}
                    </div>

                    {/* Actual Pure Text & Code Box Message */}
                    <div
                      style={{
                        fontSize: '0.96rem',
                        lineHeight: '1.65',
                        color: 'var(--ds-text-primary)',
                        display: 'inline-block',
                        width: '100%',
                        textAlign: isUser ? 'right' : 'left'
                      }}
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(marked.parse(m.content || ''))
                      }}
                    />

                    {/* Voice (Read Aloud) & Copy Options Under BOTH User & AI Messages */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                      <button
                        onClick={() => handleSpeak(m.content, idx)}
                        style={{ background: 'transparent', border: 'none', color: speakingIndex === idx ? 'var(--ds-blue)' : 'var(--ds-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                        title="Read Aloud"
                      >
                        <Volume2 style={{ width: '13px' }} />
                        <span>Speak</span>
                      </button>
                      <button
                        onClick={() => handleCopy(m.content, idx)}
                        style={{ background: 'transparent', border: 'none', color: copiedIndex === idx ? '#10b981' : 'var(--ds-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                        title="Copy text"
                      >
                        {copiedIndex === idx ? <Check style={{ width: '13px' }} /> : <Copy style={{ width: '13px' }} />}
                        <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                  </div>

                </div>
              );
            })
          )}

          {/* Thinking... Animated Indicator */}
          {loading && (
            <div className="thinking-animation-container">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <RefreshCw style={{ width: '14px', height: '14px', color: 'var(--ds-blue)', animation: 'spin 1s linear infinite' }} />
              </div>
              <div className="thinking-text-glow">
                Thinking<span className="thinking-dots"><span>.</span><span>.</span><span>.</span></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Bottom Input Card */}
      {messages.length > 0 && (
        <div style={{ padding: '0 20px 16px 20px', maxWidth: '820px', width: '100%', margin: '0 auto' }}>
          <form onSubmit={handleSend} className="floating-input-card" style={{ background: 'rgba(23, 28, 38, 0.95)' }}>
            <textarea
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Message LAF..."
              rows={1}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none',
                resize: 'none',
                maxHeight: '120px'
              }}
            />

            {/* Dead-Centered Send Button */}
            <button
              type="submit"
              disabled={loading || !inputPrompt.trim()}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: inputPrompt.trim() ? 'var(--ds-blue)' : 'var(--ds-bg-card)',
                border: 'none',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                cursor: inputPrompt.trim() ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
                flexShrink: 0,
                padding: 0,
                margin: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', transform: 'translate(-1px, 1px)' }}>
                <Send style={{ width: '15px', height: '15px' }} />
              </div>
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
