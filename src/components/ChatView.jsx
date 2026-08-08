import React, { useState, useEffect, useRef } from 'react';
import { Send, Volume2, Copy, Check, RefreshCw, Pencil, Cpu, Mic, MicOff } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

if (typeof window !== 'undefined') {
  window.downloadLafImage = function (url, filename) {
    try {
      const proxyUrl = `/api/media/download-proxy?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename || 'laf_ai_image.jpg')}`;
      const link = document.createElement('a');
      link.href = proxyUrl;
      link.download = filename || 'laf_ai_image.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Image download error:', err);
      window.open(url, '_blank');
    }
  };
}

// Custom Marked renderer for sleek code blocks and image cards with direct download button
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

renderer.image = function ({ href, title, text }) {
  const altText = text || 'LAF AI Image';
  const encodedHref = encodeURIComponent(href);
  return `<div class="laf-image-card">
    <img src="${href}" alt="${altText}" class="laf-generated-img" loading="lazy" />
    <button onclick="window.downloadLafImage(decodeURIComponent('${encodedHref}'), 'laf_ai_image.jpg')" class="laf-img-download-icon" title="Download Image" type="button">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y3="3"/>
      </svg>
    </button>
  </div>`;
};

marked.setOptions({
  renderer,
  breaks: true,
  gfm: true
});

function extractChoiceOptions(content = '') {
  if (!content) return [];
  const regex = /\[CHOICE:\s*([^\]]+)\]/gi;
  const choices = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    choices.push(match[1].trim());
  }
  return choices;
}

function cleanMessageForRendering(content = '') {
  if (!content) return '';
  return content.replace(/\[CHOICE:\s*([^\]]+)\]/gi, '').trim();
}

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
  const [selectedModel, setSelectedModel] = useState('laf-v2');
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const toggleVoiceTyping = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice typing is not supported in your current browser. Please try Google Chrome, Microsoft Edge, or Safari.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        try { recognitionRef.current.stop(); } catch (e) {}
        recognitionRef.current = null;
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || 'en-US';

      let initialPrompt = inputPrompt;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        const spoken = finalTranscript || interimTranscript;
        setInputPrompt(initialPrompt ? `${initialPrompt} ${spoken}` : spoken);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition notice:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  const handleSend = async (e, overridePrompt) => {
    if (e) e.preventDefault();
    const textToSend = (overridePrompt || inputPrompt).trim();
    if (!textToSend || loading) return;

    // Immediately stop and unbind recognition to prevent trailing voice text from reappearing
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onend = null;
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInputPrompt('');

    // Append user message
    const newHistory = [...messages, { role: 'user', content: textToSend, timestamp: new Date().toISOString() }];
    setMessages(newHistory);
    setLoading(true);

    const sendFetch = async (retries = 1) => {
      try {
        return await fetch('/api/chat/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            prompt: textToSend,
            conversationId: activeConvId,
            history: messages,
            customApiKey,
            selectedModel
          })
        });
      } catch (err) {
        if (retries > 0) {
          await new Promise(r => setTimeout(r, 1000));
          return sendFetch(retries - 1);
        }
        throw err;
      }
    };

    try {
      const res = await sendFetch(1);
      const data = await res.json();
      if (res.ok && data.success) {
        setActiveConvId(data.conversationId);
        
        const fullContent = data.response.content || '';
        const providerName = data.response.provider || 'LAF AI';

        setLoading(false);

        if (fullContent.includes('![')) {
          setMessages(prev => [
            ...prev,
            { role: 'assistant', content: fullContent, provider: providerName, isTyping: false }
          ]);
          fetchConversations();
          return;
        }

        const tokens = fullContent.match(/(\s+|\S+)/g) || [fullContent];
        let currentText = '';
        let tokenIndex = 0;
        const chunkSize = tokens.length > 200 ? 5 : (tokens.length > 80 ? 3 : 1);

        // Add empty assistant placeholder message
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: '', provider: providerName, isTyping: true }
        ]);

        const timer = setInterval(() => {
          if (tokenIndex < tokens.length) {
            for (let i = 0; i < chunkSize && tokenIndex < tokens.length; i++) {
              currentText += tokens[tokenIndex];
              tokenIndex++;
            }
            setMessages(prev => {
              const updated = [...prev];
              if (updated.length > 0 && updated[updated.length - 1].role === 'assistant') {
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: currentText
                };
              }
              return updated;
            });
          } else {
            clearInterval(timer);
            setMessages(prev => {
              const updated = [...prev];
              if (updated.length > 0 && updated[updated.length - 1].role === 'assistant') {
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: fullContent,
                  isTyping: false
                };
              }
              return updated;
            });
            fetchConversations();
          }
        }, 5);
      } else {
        setLoading(false);
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: `Error: ${data.error || 'Failed to process request'}`, provider: 'System Error' }
        ]);
      }
    } catch (err) {
      setLoading(false);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Network Error: ${err.message}`, provider: 'System Error' }
      ]);
    } finally {
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
              <form onSubmit={handleSend} className="floating-input-card" style={{ background: 'rgba(23, 28, 38, 0.95)', position: 'relative' }}>
                <textarea
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={isListening ? "Listening... speak now..." : "Message LAF..."}
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

                {/* Dead-Centered Voice Typing Mic Button */}
                <button
                  type="button"
                  onClick={toggleVoiceTyping}
                  title={isListening ? "Stop Voice Typing" : "Voice Typing"}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: isListening ? '#ef4444' : 'var(--ds-bg-card)',
                    border: 'none',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                    padding: 0,
                    margin: 0,
                    lineHeight: 0,
                    outline: 'none',
                    animation: isListening ? 'micPulse 1.5s infinite' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                    {isListening ? <MicOff style={{ width: '17px', height: '17px', display: 'block' }} /> : <Mic style={{ width: '17px', height: '17px', color: 'var(--ds-blue)', display: 'block' }} />}
                  </div>
                </button>

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
                    justify: 'center',
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
              const rawContent = m.content || '';
              const choices = !isUser ? extractChoiceOptions(rawContent) : [];
              const displayContent = !isUser ? cleanMessageForRendering(rawContent) : rawContent;

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
                  {/* Dead-Centered Avatar Icon Circle with CSS Grid */}
                  <div
                    className="user-avatar-circle"
                    style={{
                      background: isUser ? 'var(--ds-blue)' : 'transparent',
                      boxShadow: !isUser ? '0 0 10px rgba(79, 117, 255, 0.4)' : 'none'
                    }}
                  >
                    {isUser ? (
                      <span className="user-avatar-initial">
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
                      className="message-markdown-content"
                      style={{
                        fontSize: '0.96rem',
                        lineHeight: '1.65',
                        color: 'var(--ds-text-primary)',
                        display: 'inline-block',
                        width: '100%',
                        textAlign: isUser ? 'right' : 'left'
                      }}
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(marked.parse(displayContent), {
                          ADD_TAGS: ['svg', 'path', 'polyline', 'line'],
                          ADD_ATTR: ['target', 'download', 'rel', 'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin']
                        })
                      }}
                    />

                    {/* Render Interactive Choice Option Pill Buttons */}
                    {choices.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px', marginBottom: '8px' }}>
                        {choices.map((choiceLabel, cIdx) => (
                          <button
                            key={cIdx}
                            type="button"
                            onClick={() => {
                              const cleanChoice = choiceLabel.replace(/^[^\w\s]+/, '').trim();
                              handleSend(null, cleanChoice || choiceLabel);
                            }}
                            style={{
                              background: 'rgba(79, 117, 255, 0.15)',
                              border: '1px solid var(--ds-blue)',
                              borderRadius: '9999px',
                              color: '#ffffff',
                              padding: '8px 16px',
                              fontSize: '0.86rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 0 12px rgba(79, 117, 255, 0.25)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--ds-blue)';
                              e.currentTarget.style.boxShadow = '0 0 16px rgba(79, 117, 255, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(79, 117, 255, 0.15)';
                              e.currentTarget.style.boxShadow = '0 0 12px rgba(79, 117, 255, 0.25)';
                            }}
                          >
                            {choiceLabel}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Voice, Copy & Edit Options Under Messages */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                      {isUser && (
                        <button
                          onClick={() => {
                            setInputPrompt(m.content);
                            setTimeout(() => {
                              const el = document.querySelector('textarea');
                              if (el) { el.focus(); el.select(); }
                            }, 50);
                          }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--ds-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                          title="Edit input message"
                        >
                          <Pencil style={{ width: '13px' }} />
                          <span>Edit</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleSpeak(displayContent, idx)}
                        style={{ background: 'transparent', border: 'none', color: speakingIndex === idx ? 'var(--ds-blue)' : 'var(--ds-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                        title="Read Aloud"
                      >
                        <Volume2 style={{ width: '13px' }} />
                        <span>Speak</span>
                      </button>
                      <button
                        onClick={() => handleCopy(displayContent, idx)}
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
              placeholder={isListening ? "Listening... speak now..." : "Message LAF..."}
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

            {/* Dead-Centered Voice Typing Mic Button */}
            <button
              type="button"
              onClick={toggleVoiceTyping}
              title={isListening ? "Stop Voice Typing" : "Voice Typing"}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: isListening ? '#ef4444' : 'var(--ds-bg-card)',
                border: 'none',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flexShrink: 0,
                padding: 0,
                margin: 0,
                lineHeight: 0,
                outline: 'none',
                animation: isListening ? 'micPulse 1.5s infinite' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                {isListening ? <MicOff style={{ width: '16px', height: '16px', display: 'block' }} /> : <Mic style={{ width: '16px', height: '16px', color: 'var(--ds-blue)', display: 'block' }} />}
              </div>
            </button>

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
