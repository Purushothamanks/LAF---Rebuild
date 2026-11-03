import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Volume2, Copy, Check, RefreshCw, Pencil, Cpu, Mic, MicOff, 
  Bot, Sparkles, ChevronDown, ChevronUp, Layers, CheckCircle2, Play, 
  Paperclip, X, FileText, Image as ImageIcon, ExternalLink, Code, Eye, Download
} from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { apiUrl } from '../api';
import { generateRealtimeResponse, saveLocalConversation, isImageQuery } from '../utils/aiClient';
import AgentSandbox from './AgentSandbox';
import LafCanvas from './LafCanvas';
import { executeAgentTask, extractCodeArtifacts, extractCanvasArtifact, shouldAutoOpenCanvas, isComplexAgentTask, isDocumentCreationRequest, extractDocumentExcerpt } from '../utils/agentEngine';

if (typeof window !== 'undefined') {
  window.downloadLafImage = async function (url, filename) {
    const safeFilename = filename || `laf_image_${Date.now()}.jpg`;

    // Method 1: Fetch as Blob and trigger standard link download
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (res.ok) {
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = safeFilename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        return;
      }
    } catch (err) {
      console.warn('Direct blob fetch failed, trying canvas/direct fallback:', err);
    }

    // Method 2: HTML5 Canvas Export with crossOrigin
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(function (blob) {
            if (blob) {
              const blobUrl = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = blobUrl;
              a.download = safeFilename;
              a.style.display = 'none';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
            } else {
              fallbackDirectLink(url, safeFilename);
            }
          }, 'image/jpeg', 0.95);
        } catch (e) {
          fallbackDirectLink(url, safeFilename);
        }
      };
      img.onerror = function () {
        fallbackDirectLink(url, safeFilename);
      };
      img.src = url;
      return;
    } catch (e) {
      fallbackDirectLink(url, safeFilename);
    }

    function fallbackDirectLink(targetUrl, fname) {
      const a = document.createElement('a');
      a.href = targetUrl;
      a.download = fname;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
      <button class="code-box-copy-btn" data-copy-text="${encodedText}" type="button">
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
      <button data-download-url="${encodedHref}" class="laf-img-download-icon" title="Download Image" type="button" aria-label="Download Image">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y3="3"/>
        </svg>
      </button>
    </div>
    <div class="laf-image-badge-caption">
      <span class="laf-image-badge-sparkle">✨</span> Image generated successfully !
    </div>
  </div>`;
};

marked.setOptions({
  renderer,
  breaks: true,
  gfm: true
});

function TypewriterHeroSubheading() {
  const fullText = "Experience live LAF Canvas preview, real-time code synthesis, multimodal generation, and high-speed reasoning.";
  const [displayText, setDisplayText] = useState('');
  const [phase, setPhase] = useState('typing'); // 'typing' | 'holding' | 'snapping' | 'void'

  useEffect(() => {
    let timer;

    if (phase === 'typing') {
      if (displayText.length < fullText.length) {
        timer = setTimeout(() => {
          setDisplayText(fullText.slice(0, displayText.length + 1));
        }, 34); // natural live writing speed
      } else {
        timer = setTimeout(() => {
          setPhase('holding');
        }, 200);
      }
    } else if (phase === 'holding') {
      // Hold for 2.8 seconds so user can read comfortably
      timer = setTimeout(() => {
        setPhase('snapping');
      }, 2800);
    } else if (phase === 'snapping') {
      // Thanos snap dissolution sweeps across text (2.2 seconds total)
      timer = setTimeout(() => {
        setPhase('void');
        setDisplayText('');
      }, 2200);
    } else if (phase === 'void') {
      // Brief pause in void before live typing restarts
      timer = setTimeout(() => {
        setPhase('typing');
      }, 600);
    }

    return () => clearTimeout(timer);
  }, [displayText, phase, fullText]);

  if (phase === 'snapping') {
    return (
      <p className="laf-hero-subheading gemini-animated-subheading typewriter-subheading thanos-snap-active">
        {fullText.split(' ').map((word, wIdx) => (
          <span key={wIdx} style={{ display: 'inline-block', whiteSpace: 'nowrap', margin: '0 2.5px' }}>
            {word.split('').map((char, cIdx) => {
              const globalIdx = wIdx * 8 + cIdx;
              return (
                <span
                  key={cIdx}
                  className="thanos-ash-particle"
                  style={{
                    display: 'inline-block',
                    animationDelay: `${globalIdx * 12}ms`,
                    '--dx': `${((globalIdx % 5) - 2) * 8 + 10}px`,
                    '--dy': `${-(((globalIdx * 2) % 6) + 3) * 6}px`,
                    '--rot': `${((globalIdx % 4) - 2) * 8}deg`
                  }}
                >
                  {char}
                </span>
              );
            })}
          </span>
        ))}
      </p>
    );
  }

  return (
    <p className="laf-hero-subheading gemini-animated-subheading typewriter-subheading">
      <span>{displayText}</span>
      {phase === 'typing' && <span className="typewriter-cursor">|</span>}
    </p>
  );
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
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const selectedModel = 'auto';
  const [isListening, setIsListening] = useState(false);
  const isAgentMode = true;
  const [expandedMilestones, setExpandedMilestones] = useState({});

  // LAF Canvas States
  const [canvasArtifact, setCanvasArtifact] = useState(null);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [isLiveGenerating, setIsLiveGenerating] = useState(false);
  const [viewingFileModal, setViewingFileModal] = useState(null);

  // Live Typing & Streaming State
  const [isImageGenerating, setIsImageGenerating] = useState(false);
  const [isDocGenerating, setIsDocGenerating] = useState(false);
  const [docTopic, setDocTopic] = useState('');
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
  const attachmentCacheRef = useRef({});

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
    const blobUrl = URL.createObjectURL(file);

    if (isImg) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        const base64Data = dataUrl.split(',')[1];
        const attObj = {
          name: file.name,
          size: file.size,
          formattedSize,
          mimeType: file.type || 'image/jpeg',
          isImage: true,
          isPdf: false,
          previewUrl: blobUrl || dataUrl,
          data: base64Data
        };
        attachmentCacheRef.current[file.name] = attObj;
        setAttachment(attObj);
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

        const attObj = {
          name: file.name,
          size: file.size,
          formattedSize,
          mimeType: 'application/pdf',
          isImage: false,
          isPdf: true,
          previewUrl: blobUrl,
          data: base64Data,
          textContent: extractedSnippet || null
        };
        attachmentCacheRef.current[file.name] = attObj;
        setAttachment(attObj);
      };
      reader.readAsDataURL(file);
    } else {
      // Text, Code, JSON, Markdown, CSV, etc.
      const reader = new FileReader();
      reader.onload = (e) => {
        const attObj = {
          name: file.name,
          size: file.size,
          formattedSize,
          mimeType: file.type || 'text/plain',
          isImage: false,
          isPdf: false,
          previewUrl: blobUrl,
          textContent: e.target.result
        };
        attachmentCacheRef.current[file.name] = attObj;
        setAttachment(attObj);
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

  // Delegated Click Interceptor for Generated Images & Code Copy (bypasses any DOMPurify stripping)
  useEffect(() => {
    const handleGlobalClick = async (e) => {
      // 1. Image Download Button Click
      const dlBtn = e.target.closest('.laf-img-download-icon');
      if (dlBtn) {
        e.preventDefault();
        e.stopPropagation();
        const rawUrl = dlBtn.getAttribute('data-download-url');
        if (rawUrl) {
          const url = decodeURIComponent(rawUrl);
          // Visual confirmation animation on icon
          const originalHTML = dlBtn.innerHTML;
          dlBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
          dlBtn.classList.add('laf-download-active');
          setTimeout(() => {
            dlBtn.innerHTML = originalHTML;
            dlBtn.classList.remove('laf-download-active');
          }, 2200);

          if (window.downloadLafImage) {
            window.downloadLafImage(url, 'laf_ai_image.jpg');
          }
        }
        return;
      }

      // 2. Code Box Copy Button Click
      const copyBtn = e.target.closest('.code-box-copy-btn');
      if (copyBtn) {
        e.preventDefault();
        e.stopPropagation();
        const rawCode = copyBtn.getAttribute('data-copy-text');
        if (rawCode) {
          try {
            await navigator.clipboard.writeText(decodeURIComponent(rawCode));
            const orig = copyBtn.innerText;
            copyBtn.innerText = 'Copied!';
            setTimeout(() => { copyBtn.innerText = orig || 'Copy code'; }, 2000);
          } catch (err) {
            console.warn('Copy failed:', err);
          }
        }
        return;
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
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
  const streamTextResponse = async (fullText, providerName, baseHistory, artifacts = [], milestones = null, executionTimeMs = null, userPrompt = '') => {
    setLoading(false);
    setIsImageGenerating(false);
    setIsDocGenerating(false);
    setIsStreaming(true);

    // Auto-detect Code or Document Canvas Artifact (Canvas only auto-opens for Web UI or full Documents)
    const detectedArtifact = extractCanvasArtifact(fullText, userPrompt);
    const isDoc = detectedArtifact && detectedArtifact.type === 'document';

    if (detectedArtifact) {
      setCanvasArtifact(detectedArtifact);
      if (shouldAutoOpenCanvas(detectedArtifact)) {
        setIsCanvasOpen(true);
        setIsLiveGenerating(true);
      }
    }

    const assistantMsgIndex = baseHistory.length;
    const initialAssistantMsg = {
      role: 'assistant',
      content: fullText,
      documentArtifact: isDoc ? detectedArtifact : null,
      isDocument: isDoc,
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
            documentArtifact: isDoc ? detectedArtifact : null,
            isDocument: isDoc,
            provider: providerName,
            artifacts,
            milestones,
            executionTimeMs,
            isTyping: false
          }];

          setMessages(finalMessages);
          setIsStreaming(false);
          setIsLiveGenerating(false);

          if (isDoc && detectedArtifact) {
            setCanvasArtifact(detectedArtifact);
          }

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
          // Stream document content into side canvas live
          if (isDoc && detectedArtifact) {
            setCanvasArtifact(prev => ({
              ...(prev || detectedArtifact),
              content: partial
            }));
          }
          setMessages(prev => {
            const next = [...prev];
            if (next.length > assistantMsgIndex) {
              next[assistantMsgIndex] = {
                ...next[assistantMsgIndex],
                content: fullText,
                isDocument: isDoc,
                documentArtifact: isDoc ? { ...detectedArtifact, content: partial } : null,
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

    // Detect if this is a document creation query
    const isDoc = isDocumentCreationRequest(textToSend);
    setIsDocGenerating(isDoc);
    if (isDoc) {
      const inferredTopic = textToSend
        .replace(/\b(create|write|draft|generate|make|build|prepare|compose|give me as|generate me as a)\s+(a\s+|an\s+|the\s+)?([a-z0-9\s_-]*\s+)?(document|doc|docs|report|spec|specification|file)?\s*(of|on|about|for|regarding)?\s*/i, '')
        .trim();
      const cleanTopic = inferredTopic ? (inferredTopic.charAt(0).toUpperCase() + inferredTopic.slice(1)) : (currentAttachment ? currentAttachment.name.replace(/\.[^/.]+$/, '') : 'Document');
      setDocTopic(cleanTopic);
      setIsCanvasOpen(true);
      setIsLiveGenerating(true);
      setCanvasArtifact({
        type: 'document',
        title: cleanTopic,
        content: `# ${cleanTopic}\n\n*Drafting document in LAF Canvas...*`,
        wordCount: 0
      });
    }

    const baseHistory = overrideHistory !== undefined ? overrideHistory : messages;

    if (currentAttachment?.name) {
      attachmentCacheRef.current[currentAttachment.name] = currentAttachment;
    }

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
          isPdf: !!currentAttachment.isPdf || currentAttachment.mimeType === 'application/pdf' || currentAttachment.name?.toLowerCase().endsWith('.pdf'),
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
      const tid = setTimeout(() => controller.abort(), 40000);

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
          await streamTextResponse(fullContent, providerName, newHistory, artifacts, null, null, textToSend);
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

        await streamTextResponse(aiResultText, providerName, newHistory, artifacts, milestones, executionTimeMs, textToSend);
      } catch (clientAiErr) {
        setLoading(false);
        setIsImageGenerating(false);
        setIsDocGenerating(false);
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

  return (
    <div style={{ flex: 1, display: 'flex', width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      
      {/* Primary Chat Conversation Pane */}
      <div 
        style={{ 
          flex: '1 1 100%', 
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
        
        {/* Authentic Gemini Ambient Bottom Glow Aura (Layer 1: Behind text, light animation at bottom, fading to top half) */}
        <div className="gemini-ambient-bottom-glow" aria-hidden="true">
          <div className="gemini-glow-base" />
          <div className="gemini-glow-core" />
          <div className="gemini-glow-orb" />
          <div className="gemini-glow-beam" />
        </div>

        {/* Messages Scroll Area with Generous Bottom Clearance (Layer 2: Above glow, crisp text, zero blur/interference) */}
        <div 
          className="chat-messages-scroll"
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            overscrollBehaviorY: 'contain',
            padding: '20px 0 160px 0', 
            display: 'flex', 
            flexDirection: 'column',
            position: 'relative',
            zIndex: 2
          }}
        >
          <div className="chat-messages-inner" style={{ maxWidth: '820px', width: '92%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '26px' }}>
            
            {messages.length === 0 ? (
              /* Unique Futuristic Welcome Hero Screen */
              <div className="laf-hero-container">
                <div className="laf-hero-header-group">
                  <div className="laf-hero-emblem-wrap">
                    <img
                      src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgPneYG2HNT8jsgsviQT-3j0Mj4tN_xUqwl9a9KYP9YE5Bu8TVGPXSLDI&s=10"
                      alt="LAF Logo"
                      className="laf-hero-emblem laf-logo-intro-spin"
                    />
                    <div className="laf-hero-glow-ring"></div>
                  </div>

                  <h1 className="laf-hero-heading gemini-animated-heading">
                    Where Imagination Meets Intelligence.
                  </h1>
                  
                  <TypewriterHeroSubheading />
                </div>

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
                      <div 
                        onClick={() => {
                          const cached = attachmentCacheRef.current[attachment.name];
                          setViewingFileModal({
                            ...attachment,
                            ...(cached || {}),
                            isPdf: attachment.isPdf || attachment.mimeType === 'application/pdf' || attachment.name?.toLowerCase().endsWith('.pdf'),
                            isImage: attachment.isImage || attachment.mimeType?.startsWith('image/')
                          });
                        }}
                        title="Click to view and verify file"
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, cursor: 'pointer' }}
                      >
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
                        cursor: (inputPrompt.trim() || attachment) ? 'pointer' : 'default',
                        opacity: (inputPrompt.trim() || attachment) ? 1 : 0.85
                      }}
                    >
                      <Send style={{ width: '16px', height: '16px', transform: 'translate(-1px, 1px)' }} />
                    </button>
                  </div>
                </form>
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
                              onClick={() => {
                                const cached = attachmentCacheRef.current[m.attachment.name];
                                setViewingFileModal({
                                  ...m.attachment,
                                  ...(cached || {}),
                                  isPdf: m.attachment.isPdf || m.attachment.mimeType === 'application/pdf' || m.attachment.name?.toLowerCase().endsWith('.pdf'),
                                  isImage: true
                                });
                              }}
                              title="Click to view and verify full image"
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
                              onClick={() => {
                                const cached = attachmentCacheRef.current[m.attachment.name];
                                setViewingFileModal({
                                  ...m.attachment,
                                  ...(cached || {}),
                                  isPdf: m.attachment.isPdf || m.attachment.mimeType === 'application/pdf' || m.attachment.name?.toLowerCase().endsWith('.pdf'),
                                  isImage: m.attachment.isImage || m.attachment.mimeType?.startsWith('image/')
                                });
                              }}
                              title="Click to view and verify document"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '7px 12px',
                                borderRadius: '10px',
                                background: 'rgba(30, 41, 59, 0.85)',
                                border: '1px solid rgba(79, 117, 255, 0.3)',
                                color: '#f8fafc',
                                fontSize: '0.82rem',
                                cursor: 'pointer'
                              }}
                            >
                              <FileText style={{ width: '15px', height: '15px', color: (m.attachment.isPdf || m.attachment.name?.toLowerCase().endsWith('.pdf')) ? '#f87171' : '#60a5fa' }} />
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
                        (() => {
                          const docArt = !isUser && m.isDocument ? (m.documentArtifact || extractCanvasArtifact(m.content, 'doc')) : null;
                          const isDocCreating = docArt && m.isTyping;
                          const isDocFinished = docArt && !m.isTyping;

                          if (isDocCreating) {
                            return (
                              <div className="doc-live-creating-box">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div className="doc-icon-pulse-badge">
                                    <FileText style={{ width: '20px', height: '20px', color: '#60a5fa' }} />
                                  </div>
                                  <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ fontSize: '0.94rem', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span>Creating document...</span>
                                      <span className="live-pulse-dot" style={{ width: '7px', height: '7px' }}></span>
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      Drafting "{docArt.title || docTopic || 'Document'}" in LAF Canvas
                                    </div>
                                  </div>
                                </div>
                                <div className="doc-shimmer-progress">
                                  <div className="doc-shimmer-fill"></div>
                                </div>
                              </div>
                            );
                          }

                          if (isDocFinished) {
                            return (
                              <div className="doc-presentation-card">
                                <div className="doc-presentation-header">
                                  <div className="doc-presentation-icon">
                                    <FileText style={{ width: '20px', height: '20px', color: '#fff' }} />
                                  </div>
                                  <div style={{ minWidth: 0, flex: 1 }}>
                                    <div className="doc-presentation-title">
                                      {docArt.title || 'LAF Document'}
                                    </div>
                                    <div className="doc-presentation-meta">
                                      Document • {docArt.wordCount || (m.content?.split(/\s+/).filter(Boolean).length || 0)} words • Synthesized by LAF AI
                                    </div>
                                  </div>
                                  <span className="doc-ready-badge">
                                    <Sparkles style={{ width: '12px', height: '12px' }} />
                                    <span>In Canvas</span>
                                  </span>
                                </div>

                                <div className="doc-presentation-excerpt">
                                  {extractDocumentExcerpt(m.content)}
                                </div>

                                <div className="doc-presentation-actions">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCanvasArtifact(docArt);
                                      setIsCanvasOpen(true);
                                    }}
                                    className="doc-open-canvas-btn"
                                  >
                                    <ExternalLink style={{ width: '14px', height: '14px' }} />
                                    <span>Open in LAF Canvas</span>
                                  </button>
                                </div>

                                <div className="doc-presentation-footer-note">
                                  ✨ Document created successfully and ready in LAF Canvas.
                                </div>
                              </div>
                            );
                          }

                          // Default Message Bubble for standard chat responses
                          return (
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
                                      ADD_TAGS: ['svg', 'path', 'polyline', 'line', 'button'],
                                      ADD_ATTR: [
                                        'target', 'download', 'rel', 'viewBox', 'fill', 'stroke', 
                                        'stroke-width', 'stroke-linecap', 'stroke-linejoin', 
                                        'data-download-url', 'data-copy-text', 'class', 'title', 'type', 'aria-label'
                                      ],
                                      ALLOW_DATA_ATTR: true
                                    })
                                  }}
                                />
                              )}

                              {/* Streaming Blinking Cursor */}
                              {m.isTyping && (
                                <span className="streaming-cursor"></span>
                              )}

                              {/* Open in LAF Canvas Button for Code Artifacts */}
                              {!isUser && !m.isTyping && extractCanvasArtifact(m.content) && extractCanvasArtifact(m.content).type === 'code' && (
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
                                    <span>Preview in LAF Canvas</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })()
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
            {loading && !isImageGenerating && !isDocGenerating && (
              <div className="thinking-animation-container">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <RefreshCw style={{ width: '14px', height: '14px', color: 'var(--ds-blue)', animation: 'spin 1s linear infinite' }} />
                </div>
                <div className="thinking-text-glow">
                  Thinking<span className="thinking-dots"><span>.</span><span>.</span><span>.</span></span>
                </div>
              </div>
            )}

            {/* Document Creating Animated Indicator */}
            {loading && isDocGenerating && (
              <div className="thinking-animation-container doc-creating-indicator">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <FileText style={{ width: '15px', height: '15px', color: '#60a5fa' }} />
                </div>
                <div className="thinking-text-glow">
                  Creating document in LAF Canvas<span className="thinking-dots"><span>.</span><span>.</span><span>.</span></span>
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
                  <div 
                    onClick={() => {
                      const cached = attachmentCacheRef.current[attachment.name];
                      setViewingFileModal({
                        ...attachment,
                        ...(cached || {}),
                        isPdf: attachment.isPdf || attachment.mimeType === 'application/pdf' || attachment.name?.toLowerCase().endsWith('.pdf'),
                        isImage: attachment.isImage || attachment.mimeType?.startsWith('image/')
                      });
                    }}
                    title="Click to view and verify file"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, cursor: 'pointer' }}
                  >
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
                    cursor: (inputPrompt.trim() || attachment) ? 'pointer' : 'default',
                    opacity: (inputPrompt.trim() || attachment) ? 1 : 0.85
                  }}
                >
                  <Send style={{ width: '15px', height: '15px', transform: 'translate(-1px, 1px)' }} />
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

      {/* Floating Centered Blur-Transparent LAF Canvas Modal Overlay */}
      {isCanvasOpen && (
        <div 
          className="laf-canvas-floating-overlay"
          onClick={() => setIsCanvasOpen(false)}
        >
          <div 
            className="laf-canvas-floating-window"
            onClick={(e) => e.stopPropagation()}
          >
            <LafCanvas
              isOpen={isCanvasOpen}
              onClose={() => setIsCanvasOpen(false)}
              artifact={canvasArtifact}
              isLiveUpdating={isLiveGenerating}
            />
          </div>
        </div>
      )}

      {/* Uploaded File & Image Verification Viewer Modal */}
      {viewingFileModal && (
        <div
          className="modal-overlay"
          onClick={() => setViewingFileModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 8, 16, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px'
          }}
        >
          <div
            className="modal-floating-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '860px',
              width: '100%',
              maxHeight: '90vh',
              background: 'rgba(15, 23, 42, 0.96)',
              border: '1px solid rgba(79, 117, 255, 0.4)',
              borderRadius: '18px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(79, 117, 255, 0.25)'
            }}
          >
            {/* Header */}
            {(() => {
              const isPdf = viewingFileModal.isPdf || viewingFileModal.mimeType === 'application/pdf' || viewingFileModal.name?.toLowerCase().endsWith('.pdf');
              const isImage = viewingFileModal.isImage || viewingFileModal.mimeType?.startsWith('image/');

              let resolvedUrl = viewingFileModal.previewUrl;
              if (!resolvedUrl && viewingFileModal.data) {
                if (isImage) {
                  resolvedUrl = `data:${viewingFileModal.mimeType || 'image/jpeg'};base64,${viewingFileModal.data}`;
                } else if (isPdf) {
                  try {
                    const byteCharacters = atob(viewingFileModal.data);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                      byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: 'application/pdf' });
                    resolvedUrl = URL.createObjectURL(blob);
                  } catch (e) {
                    resolvedUrl = `data:application/pdf;base64,${viewingFileModal.data}`;
                  }
                }
              }

              let displayText = viewingFileModal.textContent;
              if (!displayText && viewingFileModal.data && !isImage && !isPdf) {
                try {
                  displayText = atob(viewingFileModal.data);
                } catch (e) {}
              }

              return (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      background: 'rgba(15, 23, 42, 0.8)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: isImage ? 'rgba(59, 130, 246, 0.2)' : (isPdf ? 'rgba(239, 68, 68, 0.2)' : 'rgba(168, 85, 247, 0.2)'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isImage ? '#60a5fa' : (isPdf ? '#f87171' : '#c084fc'),
                          flexShrink: 0
                        }}
                      >
                        {isImage ? <ImageIcon style={{ width: '16px', height: '16px' }} /> : <FileText style={{ width: '16px', height: '16px' }} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.92rem', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '420px' }}>
                          {viewingFileModal.name}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                          {viewingFileModal.formattedSize || ''} • {isImage ? 'Image' : (isPdf ? 'PDF Document' : 'Document / Code')}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {resolvedUrl && (
                        <>
                          <button
                            type="button"
                            onClick={() => window.open(resolvedUrl, '_blank')}
                            title="Open in new window"
                            style={{
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              color: '#cbd5e1',
                              cursor: 'pointer',
                              fontSize: '0.78rem',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            <ExternalLink style={{ width: '14px', height: '14px' }} />
                            <span>Open</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = resolvedUrl;
                              link.download = viewingFileModal.name || 'file';
                              link.click();
                            }}
                            title="Download file"
                            style={{
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              color: '#cbd5e1',
                              cursor: 'pointer',
                              fontSize: '0.78rem',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            <Download style={{ width: '14px', height: '14px' }} />
                            <span>Download</span>
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => setViewingFileModal(null)}
                        title="Close viewer"
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '8px',
                          padding: '6px',
                          color: '#f87171',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <X style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>
                  </div>

                  {/* Viewer Content Body */}
                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: '16px',
                      background: '#090d16',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '300px'
                    }}
                  >
                    {isImage && resolvedUrl ? (
                      <img
                        src={resolvedUrl}
                        alt={viewingFileModal.name}
                        style={{ maxWidth: '100%', maxHeight: '68vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                      />
                    ) : isPdf && resolvedUrl ? (
                      <iframe
                        src={`${resolvedUrl}#toolbar=1`}
                        title={viewingFileModal.name}
                        style={{ width: '100%', height: '68vh', border: 'none', borderRadius: '8px', background: '#fff' }}
                      />
                    ) : (
                      <div style={{ width: '100%', maxHeight: '68vh', overflowY: 'auto', textAlign: 'left', background: '#0d1322', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.84rem', color: '#cbd5e1', whiteSpace: 'pre-wrap', wordBreak: 'normal', overflowWrap: 'break-word' }}>
                          <code>{displayText || 'No text preview available for this file type.'}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
}
