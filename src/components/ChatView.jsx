import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Volume2, Copy, Check, RefreshCw, Pencil, Cpu, Mic, MicOff, 
  Bot, Sparkles, ChevronDown, ChevronUp, Layers, CheckCircle2, Play, 
  Paperclip, X, FileText, Image as ImageIcon, ExternalLink, Code, Eye
} from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { apiUrl } from '../api';
import { generateRealtimeResponse, saveLocalConversation, isImageQuery } from '../utils/aiClient';
import AgentSandbox from './AgentSandbox';
import GeminiCanvas from './GeminiCanvas';
import { executeAgentTask, extractCodeArtifacts, extractCanvasArtifact, isComplexAgentTask } from '../utils/agentEngine';

if (typeof window !== 'undefined') {
  window.downloadLafImage = function (url, filename) {
    try {
      const proxyUrl = apiUrl(`/api/media/download-proxy?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename || 'laf_ai_image.jpg')}`);
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

// Custom Marked renderer with Powered by LAF Ai branding and direct download button
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
    <div class="laf-img-wrapper">
      <img src="${href}" alt="${altText}" class="laf-generated-img" loading="lazy" />
      <button onclick="window.downloadLafImage(decodeURIComponent('${encodedHref}'), 'laf_ai_image.jpg')" class="laf-img-download-icon" title="Download Image" type="button">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y3="3"/>
        </svg>
      </button>
    </div>
    <div class="laf-image-badge-caption">
      <span class="laf-image-badge-sparkle">✨</span> Powered by LAF Ai
    </div>
  </div>`;
};

marked.setOptions({
  renderer,
  breaks: true,
  gfm: true
});

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
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const selectedModel = 'auto';
  const [isListening, setIsListening] = useState(false);
  const isAgentMode = true;
  const [expandedMilestones, setExpandedMilestones] = useState({});

  // Gemini Canvas States
  const [canvasArtifact, setCanvasArtifact] = useState(null);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [isLiveGenerating, setIsLiveGenerating] = useState(false);

  // Live Typing & Streaming State
  const [isImageGenerating, setIsImageGenerating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // Message Editing & Regeneration State
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText] = useState('');

  const toggleMilestone = (idx) => {
    setExpandedMilestones(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const fileInputWelcomeRef = useRef(null);
  const fileInputBottomRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Robust Multimodal File Processing (Direct Native PDF Base64 & Image Engine)
  const processUploadedFile = (file) => {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      alert('File size exceeds 25MB limit. Please upload a smaller file.');
      return;
    }

    const formattedSize = formatFileSize(file.size);
    const isImg = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (isImg) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        const base64Data = dataUrl.split(',')[1];
        setAttachment({
          name: file.name,
          size: file.size,
          formattedSize,
          mimeType: file.type || 'image/jpeg',
          isImage: true,
          isPdf: false,
          previewUrl: dataUrl,
          data: base64Data
        });
      };
      reader.readAsDataURL(file);
    } else if (isPdf) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        const base64Data = dataUrl.split(',')[1];

        // Extract plaintext streams as fallback
        let extractedSnippet = '';
        try {
          const raw = atob(base64Data.substring(0, 40000));
          const matches = raw.match(/\(([^)]+)\)\s*T[jJ]/g) || raw.match(/\[(.*?)\]\s*TJ/g);
          if (matches && matches.length > 0) {
            extractedSnippet = matches.map(m => m.replace(/[\(\)\[\]]/g, '').replace(/\\n/g, ' ')).join(' ').substring(0, 8000);
          }
        } catch(err) {}

        setAttachment({
          name: file.name,
          size: file.size,
          formattedSize,
          mimeType: 'application/pdf',
          isImage: false,
          isPdf: true,
          previewUrl: null,
          data: base64Data,
          textContent: extractedSnippet || null
        });
      };
      reader.readAsDataURL(file);
    } else {
      // Text, Code, JSON, Markdown, CSV, etc.
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachment({
          name: file.name,
          size: file.size,
          formattedSize,
          mimeType: file.type || 'text/plain',
          isImage: false,
          isPdf: false,
          previewUrl: null,
          textContent: e.target.result
        });
      };
      reader.readAsText(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    if (fileInputWelcomeRef.current) fileInputWelcomeRef.current.value = '';
    if (fileInputBottomRef.current) fileInputBottomRef.current.value = '';
  };

  // Support clipboard image paste
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processUploadedFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

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

  /**
   * Fluid Live Typewriter Streaming simulation for instantaneous, lifelike AI responses
   */
  const streamTextResponse = async (fullText, providerName, baseHistory, artifacts = [], milestones = null, executionTimeMs = null) => {
    setLoading(false);
    setIsImageGenerating(false);
    setIsStreaming(true);

    // Auto-detect Code or Document Canvas Artifact
    const detectedArtifact = extractCanvasArtifact(fullText);
    if (detectedArtifact) {
      setCanvasArtifact(detectedArtifact);
      setIsCanvasOpen(true);
      setIsLiveGenerating(true);
    }

    const assistantMsgIndex = baseHistory.length;
    const initialAssistantMsg = {
      role: 'assistant',
      content: '',
      provider: providerName,
      artifacts,
      milestones,
      executionTimeMs,
      isTyping: true
    };

    setMessages([...baseHistory, initialAssistantMsg]);

    const totalLen = fullText.length;
    const chunkSize = totalLen > 3000 ? 55 : (totalLen > 1500 ? 30 : (totalLen > 500 ? 14 : 5));
    let currentLen = 0;

    await new Promise((resolve) => {
      const interval = setInterval(() => {
        currentLen += chunkSize;
        if (currentLen >= totalLen) {
          currentLen = totalLen;
          clearInterval(interval);

          const finalMessages = [...baseHistory, {
            role: 'assistant',
            content: fullText,
            provider: providerName,
            artifacts,
            milestones,
            executionTimeMs,
            isTyping: false
          }];

          setMessages(finalMessages);
          setIsStreaming(false);
          setIsLiveGenerating(false);

          // Persist conversation to vault
          const convId = activeConvId || `conv_${Date.now()}`;
          setActiveConvId(convId);
          try {
            saveLocalConversation(user?.username, convId, undefined, finalMessages);
            fetchConversations();
          } catch (e) {}

          resolve();
        } else {
          const partial = fullText.substring(0, currentLen);
          setMessages(prev => {
            const next = [...prev];
            if (next.length > assistantMsgIndex) {
              next[assistantMsgIndex] = {
                ...next[assistantMsgIndex],
                content: partial,
                isTyping: true
              };
            }
            return next;
          });
        }
      }, 16);
    });
  };

  const handleSend = async (e, overridePrompt, overrideHistory) => {
    if (e) e.preventDefault();
    const textToSend = (overridePrompt !== undefined ? overridePrompt : inputPrompt).trim();
    if ((!textToSend && !attachment) || loading || isStreaming) return;

    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onend = null;
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInputPrompt('');

    const currentAttachment = attachment;
    handleRemoveAttachment();

    // Detect if this is an image generation query to display the Gemini neural shimmer
    const isImage = isImageQuery(textToSend);
    setIsImageGenerating(isImage);

    const baseHistory = overrideHistory !== undefined ? overrideHistory : messages;

    // Append user message
    const newHistory = [
      ...baseHistory,
      {
        role: 'user',
        content: textToSend,
        attachment: currentAttachment ? {
          name: currentAttachment.name,
          size: currentAttachment.size,
          formattedSize: currentAttachment.formattedSize,
          mimeType: currentAttachment.mimeType,
          isImage: currentAttachment.isImage,
          isPdf: currentAttachment.isPdf,
          previewUrl: currentAttachment.previewUrl,
          data: currentAttachment.data,
          textContent: currentAttachment.textContent
        } : null,
        timestamp: new Date().toISOString()
      }
    ];

    setMessages(newHistory);
    setLoading(true);

    let answered = false;

    // 1. Try sending to backend if reachable
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(apiUrl('/api/chat/send'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: textToSend,
          conversationId: activeConvId,
          history: baseHistory,
          customApiKey,
          selectedModel,
          attachment: currentAttachment
        }),
        signal: controller.signal
      });

      clearTimeout(tid);

      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        const data = await res.json();
        if (data.success && data.response) {
          setActiveConvId(data.conversationId);
          const fullContent = data.response.content || '';
          const providerName = data.response.provider || 'LAF AI';

          const artifacts = extractCodeArtifacts(fullContent);
          await streamTextResponse(fullContent, providerName, newHistory, artifacts);
          answered = true;
          fetchConversations();
        }
      }
    } catch (backendErr) {
      console.warn('Backend chat route note:', backendErr.message);
    }

    // 2. Real-Time Autonomous AI Engine (Multimodal Google Gemini Vision & Native PDF Intelligence)
    if (!answered) {
      try {
        let aiResultText = '';
        let providerName = 'LAF AI';
        let artifacts = [];
        let milestones = null;
        let executionTimeMs = null;

        if (isAgentMode && isComplexAgentTask(textToSend)) {
          const agentTask = await executeAgentTask({
            prompt: textToSend,
            history: baseHistory,
            customApiKey,
            username: user?.username || 'User',
            attachment: currentAttachment
          });
          aiResultText = agentTask.text;
          providerName = agentTask.provider;
          artifacts = agentTask.artifacts || [];
          milestones = agentTask.milestones;
          executionTimeMs = agentTask.executionTimeMs;
        } else {
          const res = await generateRealtimeResponse({
            prompt: textToSend,
            history: baseHistory,
            customApiKey,
            username: user?.username || 'User',
            attachment: currentAttachment
          });
          aiResultText = res.text;
          providerName = res.provider;
          artifacts = extractCodeArtifacts(res.text);
        }

        await streamTextResponse(aiResultText, providerName, newHistory, artifacts, milestones, executionTimeMs);
      } catch (clientAiErr) {
        setLoading(false);
        setIsImageGenerating(false);
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: `Error: ${clientAiErr.message}`, provider: 'System Notice' }
        ]);
      }
    }
  };

  // Edit Message & Restart Responding
  const handleStartEdit = (idx, currentContent) => {
    setEditingIndex(idx);
    setEditingText(currentContent);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingText('');
  };

  const handleSaveAndRestart = (idx, newText) => {
    if (!newText.trim()) return;
    const priorHistory = messages.slice(0, idx);
    setEditingIndex(null);
    setEditingText('');
    handleSend(null, newText, priorHistory);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, isStreaming, isImageGenerating]);

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

  const userInitial = (user?.username || 'U').substring(0, 1).toUpperCase();

  // Unique Hero Inspiration Starter Prompts
  const heroPrompts = [
    { icon: '⚡', label: 'Build Web App', prompt: 'Create an interactive glassmorphism Pomodoro timer with audio alerts and dark mode in HTML, CSS, and JavaScript.' },
    { icon: '🎨', label: 'Generate Vision', prompt: 'Generate an ultra-realistic image of a futuristic floating neon cyber-city over reflecting waters at midnight, 8k cinematic.' },
    { icon: '📄', label: 'Draft Document', prompt: 'Write a comprehensive technical architecture specification for an autonomous real-time AI multimodal reasoning platform.' },
    { icon: '🔬', label: 'Algorithm Lab', prompt: 'Explain how transformer self-attention mechanisms calculate Q, K, V matrices and implement it in clean Python code.' }
  ];

  return (
    <div style={{ flex: 1, display: 'flex', width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      
      {/* Primary Chat Conversation Pane */}
      <div 
        style={{ 
          flex: isCanvasOpen ? '1 1 50%' : '1 1 100%', 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%', 
          position: 'relative', 
          background: 'var(--ds-bg-main)', 
          paddingTop: '60px',
          minWidth: '320px',
          transition: 'flex 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        
        {/* Messages Scroll Area with Generous Bottom Clearance */}
        <div 
          className="chat-messages-scroll"
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '20px 0 160px 0', 
            display: 'flex', 
            flexDirection: 'column' 
          }}
        >
          <div style={{ maxWidth: '820px', width: '92%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '26px' }}>
            
            {messages.length === 0 ? (
              /* Unique Futuristic Welcome Hero Screen */
              <div className="laf-hero-container">
                <div className="laf-hero-emblem-wrap">
                  <img
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgPneYG2HNT8jsgsviQT-3j0Mj4tN_xUqwl9a9KYP9YE5Bu8TVGPXSLDI&s=10"
                    alt="LAF Logo"
                    className="laf-hero-emblem"
                  />
                  <div className="laf-hero-glow-ring"></div>
                </div>

                <div className="laf-hero-badge">
                  <Sparkles style={{ width: '13px', height: '13px', color: '#60a5fa' }} />
                  <span>Look At Future • 2026 Engine</span>
                </div>

                <h1 className="laf-hero-heading">
                  Where Imagination Meets Intelligence.
                </h1>
                
                <p className="laf-hero-subheading">
                  Experience live Gemini Canvas preview, real-time code synthesis, multimodal generation, and high-speed reasoning.
                </p>

                {/* Floating Centered Clean Input Card with Multimodal Attachment Support */}
                <form
                  onSubmit={handleSend}
                  className="floating-input-card hero-input-card"
                  style={{
                    background: 'rgba(23, 28, 38, 0.95)',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    borderRadius: attachment ? '22px' : 'var(--radius-oval)',
                    padding: attachment ? '12px 18px 10px 18px' : '10px 18px',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    width: '100%',
                    maxWidth: '720px',
                    margin: '0 auto 28px auto'
                  }}
                >
                  {/* Selected File/Image/PDF Preview Chip */}
                  {attachment && (
                    <div className="attachment-chip-bar">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        {attachment.isImage ? (
                          <img
                            src={attachment.previewUrl}
                            alt={attachment.name}
                            style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }}
                          />
                        ) : (
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: attachment.isPdf ? 'rgba(239, 68, 68, 0.15)' : 'rgba(79, 117, 255, 0.15)',
                            border: `1px solid ${attachment.isPdf ? 'rgba(239, 68, 68, 0.4)' : 'rgba(79, 117, 255, 0.3)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: attachment.isPdf ? '#f87171' : '#60a5fa'
                          }}>
                            <FileText style={{ width: '18px', height: '18px' }} />
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, textAlign: 'left' }}>
                          <span style={{ fontSize: '0.84rem', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                            {attachment.name}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {attachment.formattedSize} • {attachment.isImage ? 'Image' : (attachment.isPdf ? 'PDF Document' : 'Document / Code')}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveAttachment}
                        title="Remove attachment"
                        className="chip-remove-btn"
                      >
                        <X style={{ width: '13px', height: '13px' }} />
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                    <input
                      type="file"
                      ref={fileInputWelcomeRef}
                      onChange={handleFileSelect}
                      accept="image/*,text/*,.pdf,.json,.js,.jsx,.ts,.tsx,.py,.html,.css,.csv,.md,.txt,.xml,.yml,.yaml,.sql"
                      style={{ display: 'none' }}
                    />

                    {/* Attachment Button */}
                    <button
                      type="button"
                      onClick={() => fileInputWelcomeRef.current?.click()}
                      title="Attach image or PDF"
                      className="chat-icon-action-btn"
                      style={{
                        background: attachment ? 'rgba(79, 117, 255, 0.25)' : 'var(--ds-bg-card)',
                        border: attachment ? '1px solid rgba(79, 117, 255, 0.6)' : 'none',
                        color: attachment ? '#60a5fa' : 'var(--ds-text-secondary)'
                      }}
                    >
                      <Paperclip style={{ width: '17px', height: '17px' }} />
                    </button>

                    <textarea
                      value={inputPrompt}
                      onChange={(e) => setInputPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder={isListening ? "Listening... speak now..." : (attachment ? "Ask LAF about this attachment..." : "Message LAF...")}
                      rows={1}
                      className="chat-prompt-textarea"
                    />

                    {/* Voice Typing Mic Button */}
                    <button
                      type="button"
                      onClick={toggleVoiceTyping}
                      title={isListening ? "Stop Voice Typing" : "Voice Typing"}
                      className="chat-icon-action-btn"
                      style={{
                        background: isListening ? '#ef4444' : 'var(--ds-bg-card)',
                        animation: isListening ? 'micPulse 1.5s infinite' : 'none'
                      }}
                    >
                      {isListening ? <MicOff style={{ width: '17px', height: '17px', color: '#fff' }} /> : <Mic style={{ width: '17px', height: '17px', color: 'var(--ds-blue)' }} />}
                    </button>

                    {/* Send Button */}
                    <button
                      type="submit"
                      disabled={loading || (!inputPrompt.trim() && !attachment)}
                      className="chat-icon-action-btn send-btn"
                      style={{
                        background: (inputPrompt.trim() || attachment) ? 'var(--ds-blue)' : 'var(--ds-bg-card)',
                        cursor: (inputPrompt.trim() || attachment) ? 'pointer' : 'default'
                      }}
                    >
                      <Send style={{ width: '16px', height: '16px', transform: 'translate(-1px, 1px)' }} />
                    </button>
                  </div>
                </form>

                {/* Quick Inspiration Pills */}
                <div className="hero-inspiration-grid">
                  {heroPrompts.map((hp, i) => (
                    <div 
                      key={i} 
                      className="hero-inspiration-pill"
                      onClick={() => handleSend(null, hp.prompt)}
                    >
                      <div className="pill-header">
                        <span className="pill-icon">{hp.icon}</span>
                        <span className="pill-label">{hp.label}</span>
                      </div>
                      <div className="pill-text">{hp.prompt}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Active Conversation Messages List with Left-Aligned Clean Typography */
              messages.map((m, idx) => {
                const isUser = m.role === 'user';
                const isEditing = editingIndex === idx;

                return (
                  <div
                    key={idx}
                    className={`chat-message-row ${isUser ? 'user-row' : 'assistant-row'}`}
                    style={{
                      display: 'flex',
                      flexDirection: isUser ? 'row-reverse' : 'row',
                      gap: '14px',
                      alignItems: 'flex-start',
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      maxWidth: isUser ? '85%' : '100%',
                      width: isUser ? 'auto' : '100%'
                    }}
                  >
                    {/* Centered Avatar Icon Circle */}
                    <div
                      className="user-avatar-circle"
                      style={{
                        background: isUser ? 'var(--ds-blue)' : 'transparent',
                        boxShadow: !isUser ? '0 0 10px rgba(79, 117, 255, 0.4)' : 'none',
                        flexShrink: 0
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

                    {/* Message Bubble & Content Container (Strict Left-Aligned Text) */}
                    <div 
                      style={{ 
                        flex: 1, 
                        minWidth: 0, 
                        textAlign: 'left' 
                      }}
                    >
                      <div style={{ fontSize: '0.82rem', fontWeight: '700', color: isUser ? 'var(--ds-text-secondary)' : 'var(--ds-blue)', marginBottom: '5px' }}>
                        {isUser ? user.username : (m.provider || 'LAF AI')}
                      </div>

                      {/* Render User Attached Image or File Badge if present */}
                      {m.attachment && (
                        <div style={{ marginBottom: '10px', display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                          {m.attachment.isImage && m.attachment.previewUrl ? (
                            <div
                              onClick={() => window.open(m.attachment.previewUrl, '_blank')}
                              title="Click to view full image"
                              style={{
                                borderRadius: '12px',
                                overflow: 'hidden',
                                border: '1px solid rgba(79, 117, 255, 0.35)',
                                maxWidth: '300px',
                                maxHeight: '220px',
                                cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                                background: 'rgba(15, 23, 42, 0.7)'
                              }}
                            >
                              <img
                                src={m.attachment.previewUrl}
                                alt={m.attachment.name || 'User uploaded image'}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                              />
                            </div>
                          ) : (
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '7px 12px',
                                borderRadius: '10px',
                                background: 'rgba(30, 41, 59, 0.85)',
                                border: '1px solid rgba(79, 117, 255, 0.3)',
                                color: '#f8fafc',
                                fontSize: '0.82rem'
                              }}
                            >
                              <FileText style={{ width: '15px', height: '15px', color: m.attachment.isPdf ? '#f87171' : '#60a5fa' }} />
                              <span style={{ fontWeight: '600', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {m.attachment.name}
                              </span>
                              {m.attachment.formattedSize && (
                                <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                                  ({m.attachment.formattedSize})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Inline Message Editing Interface */}
                      {isEditing ? (
                        <div className="message-inline-editor">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="editor-textarea"
                            rows={3}
                          />
                          <div className="editor-actions">
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="editor-cancel-btn"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveAndRestart(idx, editingText)}
                              className="editor-save-btn"
                            >
                              <RefreshCw style={{ width: '13px', height: '13px' }} />
                              <span>Save & Restart</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Message Bubble */
                        <div 
                          className={isUser ? "user-message-bubble" : "assistant-message-bubble"}
                          style={{ textAlign: 'left' }}
                        >
                          {/* Markdown Rendered Content */}
                          {m.content && (
                            <div
                              className="message-markdown-content"
                              style={{
                                fontSize: '0.96rem',
                                lineHeight: '1.68',
                                color: 'var(--ds-text-primary)',
                                textAlign: 'left',
                                wordBreak: 'break-word'
                              }}
                              dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(marked.parse(m.content || ''), {
                                  ADD_TAGS: ['svg', 'path', 'polyline', 'line'],
                                  ADD_ATTR: ['target', 'download', 'rel', 'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin']
                                })
                              }}
                            />
                          )}

                          {/* Streaming Blinking Cursor */}
                          {m.isTyping && (
                            <span className="streaming-cursor"></span>
                          )}

                          {/* Open in Gemini Canvas Button for Code or Documents */}
                          {!isUser && !m.isTyping && extractCanvasArtifact(m.content) && (
                            <div style={{ marginTop: '12px' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  const art = extractCanvasArtifact(m.content);
                                  setCanvasArtifact(art);
                                  setIsCanvasOpen(true);
                                }}
                                className="open-canvas-action-pill"
                              >
                                <Sparkles style={{ width: '14px', height: '14px', color: '#60a5fa' }} />
                                <span>Preview in Gemini Canvas</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Voice, Copy & Edit Options Under Messages */}
                      {!isEditing && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                          {isUser && m.content && (
                            <button
                              onClick={() => handleStartEdit(idx, m.content)}
                              className="message-tool-btn"
                              title="Edit message & restart response"
                            >
                              <Pencil style={{ width: '13px' }} />
                              <span>Edit</span>
                            </button>
                          )}
                          {m.content && (
                            <button
                              onClick={() => handleSpeak(m.content, idx)}
                              className="message-tool-btn"
                              style={{ color: speakingIndex === idx ? 'var(--ds-blue)' : 'var(--ds-text-muted)' }}
                              title="Read Aloud"
                            >
                              <Volume2 style={{ width: '13px' }} />
                              <span>Speak</span>
                            </button>
                          )}
                          {m.content && (
                            <button
                              onClick={() => handleCopy(m.content, idx)}
                              className="message-tool-btn"
                              style={{ color: copiedIndex === idx ? '#10b981' : 'var(--ds-text-muted)' }}
                              title="Copy text"
                            >
                              {copiedIndex === idx ? <Check style={{ width: '13px' }} /> : <Copy style={{ width: '13px' }} />}
                              <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                            </button>
                          )}
                        </div>
                      )}

                    </div>

                  </div>
                );
              })
            )}

            {/* Gemini Neural Shimmer Loader during Image Generation */}
            {isImageGenerating && (
              <div className="gemini-image-generating-card">
                <div className="gemini-neural-mesh"></div>
                <div className="gemini-shimmer-sweep"></div>
                <div className="gemini-image-loader-content">
                  <div className="gemini-sparkle-halo">
                    <Sparkles style={{ width: '22px', height: '22px', color: '#60a5fa' }} />
                  </div>
                  <div className="gemini-image-title">Synthesizing Neural Vision</div>
                  <div className="gemini-image-subtitle">FLUX.1-HD • 1024x1024 Photorealistic Render</div>
                  <div className="gemini-progress-bar"><div className="gemini-progress-fill"></div></div>
                </div>
              </div>
            )}

            {/* Thinking... Animated Indicator */}
            {loading && !isImageGenerating && (
              <div className="thinking-animation-container">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <RefreshCw style={{ width: '14px', height: '14px', color: 'var(--ds-blue)', animation: 'spin 1s linear infinite' }} />
                </div>
                <div className="thinking-text-glow">
                  Thinking<span className="thinking-dots"><span>.</span><span>.</span><span>.</span></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} style={{ height: '24px', flexShrink: 0 }} />
          </div>
        </div>

        {/* Floating Bottom Input Card with Fixed Bottom Padding */}
        {messages.length > 0 && (
          <div className="chat-bottom-input-anchor">
            <form
              onSubmit={handleSend}
              className="floating-input-card bottom-card-form"
              style={{
                background: 'rgba(23, 28, 38, 0.95)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                borderRadius: attachment ? '20px' : 'var(--radius-oval)',
                padding: attachment ? '10px 16px 8px 16px' : '8px 16px',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {/* Selected File/Image Preview Chip */}
              {attachment && (
                <div className="attachment-chip-bar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    {attachment.isImage ? (
                      <img
                        src={attachment.previewUrl}
                        alt={attachment.name}
                        style={{ width: '34px', height: '34px', borderRadius: '6px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }}
                      />
                    ) : (
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        background: attachment.isPdf ? 'rgba(239, 68, 68, 0.15)' : 'rgba(79, 117, 255, 0.15)',
                        border: `1px solid ${attachment.isPdf ? 'rgba(239, 68, 68, 0.4)' : 'rgba(79, 117, 255, 0.3)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: attachment.isPdf ? '#f87171' : '#60a5fa'
                      }}>
                        <FileText style={{ width: '16px', height: '16px' }} />
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, textAlign: 'left' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>
                        {attachment.name}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        {attachment.formattedSize} • {attachment.isImage ? 'Image' : (attachment.isPdf ? 'PDF Document' : 'Document / Code')}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveAttachment}
                    title="Remove attachment"
                    className="chip-remove-btn"
                  >
                    <X style={{ width: '12px', height: '12px' }} />
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                <input
                  type="file"
                  ref={fileInputBottomRef}
                  onChange={handleFileSelect}
                  accept="image/*,text/*,.pdf,.json,.js,.jsx,.ts,.tsx,.py,.html,.css,.csv,.md,.txt,.xml,.yml,.yaml,.sql"
                  style={{ display: 'none' }}
                />

                {/* Attachment Button */}
                <button
                  type="button"
                  onClick={() => fileInputBottomRef.current?.click()}
                  title="Attach image or PDF"
                  className="chat-icon-action-btn"
                  style={{
                    background: attachment ? 'rgba(79, 117, 255, 0.25)' : 'var(--ds-bg-card)',
                    border: attachment ? '1px solid rgba(79, 117, 255, 0.6)' : 'none',
                    color: attachment ? '#60a5fa' : 'var(--ds-text-secondary)'
                  }}
                >
                  <Paperclip style={{ width: '16px', height: '16px' }} />
                </button>

                <textarea
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={isListening ? "Listening... speak now..." : (attachment ? "Ask LAF about this attachment..." : "Message LAF...")}
                  rows={1}
                  className="chat-prompt-textarea"
                />

                {/* Voice Typing Mic Button */}
                <button
                  type="button"
                  onClick={toggleVoiceTyping}
                  title={isListening ? "Stop Voice Typing" : "Voice Typing"}
                  className="chat-icon-action-btn"
                  style={{
                    background: isListening ? '#ef4444' : 'var(--ds-bg-card)',
                    animation: isListening ? 'micPulse 1.5s infinite' : 'none'
                  }}
                >
                  {isListening ? <MicOff style={{ width: '16px', height: '16px', color: '#fff' }} /> : <Mic style={{ width: '16px', height: '16px', color: 'var(--ds-blue)' }} />}
                </button>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={loading || isStreaming || (!inputPrompt.trim() && !attachment)}
                  className="chat-icon-action-btn send-btn"
                  style={{
                    background: (inputPrompt.trim() || attachment) ? 'var(--ds-blue)' : 'var(--ds-bg-card)',
                    cursor: (inputPrompt.trim() || attachment) ? 'pointer' : 'default'
                  }}
                >
                  <Send style={{ width: '15px', height: '15px', transform: 'translate(-1px, 1px)' }} />
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

      {/* Side-by-Side Gemini Canvas Panel */}
      {isCanvasOpen && (
        <div 
          className="gemini-canvas-container"
          style={{ 
            flex: '1 1 50%', 
            height: '100%', 
            minWidth: '340px',
            borderLeft: '1px solid var(--ds-border)'
          }}
        >
          <GeminiCanvas
            isOpen={isCanvasOpen}
            onClose={() => setIsCanvasOpen(false)}
            artifact={canvasArtifact}
            isLiveUpdating={isLiveGenerating}
          />
        </div>
      )}

    </div>
  );
}
