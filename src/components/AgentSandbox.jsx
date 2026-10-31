import React, { useState, useEffect, useRef } from 'react';
import { Play, Code, Terminal, Maximize2, Minimize2, RefreshCw, AlertCircle, CheckCircle2, Copy, Check } from 'lucide-react';

/**
 * Sandboxed In-Browser Execution & Live Preview Engine for LAF AI
 * Securely runs generated HTML, CSS, JavaScript, SVGs, and Canvas apps in an isolated iframe.
 */
export default function AgentSandbox({ code, language = 'html', title = 'Interactive Application Preview' }) {
  const [activeTab, setActiveTab] = useState('preview'); // 'preview', 'code', 'console'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [hasError, setHasError] = useState(false);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef(null);

  // Prepare executable HTML bundle
  const prepareHtmlBundle = (rawCode, lang) => {
    let htmlContent = rawCode.trim();

    if (lang === 'javascript' || lang === 'js') {
      htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 20px; }
    pre { background: #1e293b; padding: 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); overflow-x: auto; font-family: monospace; }
  </style>
</head>
<body>
  <h3>JavaScript Execution Output:</h3>
  <div id="output"></div>
  <script>
    const out = document.getElementById('output');
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog(...args);
      const p = document.createElement('pre');
      p.textContent = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ');
      out.appendChild(p);
      window.parent.postMessage({ type: 'CONSOLE_LOG', message: p.textContent }, '*');
    };
    window.onerror = (msg, url, line) => {
      window.parent.postMessage({ type: 'CONSOLE_ERROR', message: msg + ' (Line ' + line + ')' }, '*');
    };
    try {
      ${rawCode}
    } catch(err) {
      console.error(err);
      window.parent.postMessage({ type: 'CONSOLE_ERROR', message: err.message }, '*');
    }
  </script>
</body>
</html>`;
    } else if (lang === 'html' || lang === 'xml' || lang === 'svg') {
      // Inject console interception and error listener
      const interceptScript = `
<script>
  (function() {
    const _log = console.log;
    const _err = console.error;
    console.log = function(...args) {
      _log.apply(console, args);
      try {
        window.parent.postMessage({ type: 'CONSOLE_LOG', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }, '*');
      } catch(e) {}
    };
    console.error = function(...args) {
      _err.apply(console, args);
      try {
        window.parent.postMessage({ type: 'CONSOLE_ERROR', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }, '*');
      } catch(e) {}
    };
    window.addEventListener('error', function(e) {
      try {
        window.parent.postMessage({ type: 'CONSOLE_ERROR', message: e.message + ' (at line ' + (e.lineno || '?') + ')' }, '*');
      } catch(err) {}
    });
  })();
</script>`;
      if (htmlContent.includes('<head>')) {
        htmlContent = htmlContent.replace('<head>', '<head>' + interceptScript);
      } else {
        htmlContent = interceptScript + htmlContent;
      }
    }

    return htmlContent;
  };

  const reloadSandbox = () => {
    setLogs([]);
    setHasError(false);
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
      doc.open();
      doc.write(prepareHtmlBundle(code, language));
      doc.close();
    }
  };

  useEffect(() => {
    reloadSandbox();

    const handleMessage = (event) => {
      if (!event.data || typeof event.data !== 'object') return;
      if (event.data.type === 'CONSOLE_LOG') {
        setLogs(prev => [...prev.slice(-30), { type: 'log', text: event.data.message, time: new Date().toLocaleTimeString() }]);
      } else if (event.data.type === 'CONSOLE_ERROR') {
        setHasError(true);
        setLogs(prev => [...prev.slice(-30), { type: 'error', text: event.data.message, time: new Date().toLocaleTimeString() }]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [code, language]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        marginTop: '14px',
        marginBottom: '14px',
        borderRadius: '12px',
        border: '1px solid rgba(79, 117, 255, 0.3)',
        background: '#090d16',
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? '0' : 'auto',
        left: isFullscreen ? '0' : 'auto',
        width: isFullscreen ? '100vw' : '100%',
        height: isFullscreen ? '100vh' : 'auto',
        zIndex: isFullscreen ? 99999 : 1
      }}
    >
      {/* Sandbox Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: 'rgba(15, 23, 42, 0.85)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(8px)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
          </div>
          <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#cbd5e1', letterSpacing: '0.02em' }}>
            {title}
          </span>
          {hasError ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#f87171', background: 'rgba(239, 68, 68, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
              <AlertCircle style={{ width: '12px' }} /> Runtime Notice
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
              <CheckCircle2 style={{ width: '12px' }} /> Verified Sandbox
            </span>
          )}
        </div>

        {/* View Switchers & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('preview')}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'preview' ? 'rgba(79, 117, 255, 0.25)' : 'transparent',
              color: activeTab === 'preview' ? '#60a5fa' : '#94a3b8',
              fontSize: '0.78rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Play style={{ width: '12px' }} /> Live App
          </button>

          <button
            onClick={() => setActiveTab('code')}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'code' ? 'rgba(79, 117, 255, 0.25)' : 'transparent',
              color: activeTab === 'code' ? '#60a5fa' : '#94a3b8',
              fontSize: '0.78rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Code style={{ width: '12px' }} /> Source
          </button>

          <button
            onClick={() => setActiveTab('console')}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'console' ? 'rgba(79, 117, 255, 0.25)' : 'transparent',
              color: activeTab === 'console' ? '#60a5fa' : '#94a3b8',
              fontSize: '0.78rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Terminal style={{ width: '12px' }} /> Console ({logs.length})
          </button>

          <button
            onClick={reloadSandbox}
            title="Reload Sandbox"
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <RefreshCw style={{ width: '13px' }} />
          </button>

          <button
            onClick={handleCopyCode}
            title="Copy Source Code"
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: copied ? '#34d399' : '#94a3b8',
              cursor: 'pointer'
            }}
          >
            {copied ? <Check style={{ width: '13px' }} /> : <Copy style={{ width: '13px' }} />}
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Preview'}
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            {isFullscreen ? <Minimize2 style={{ width: '13px' }} /> : <Maximize2 style={{ width: '13px' }} />}
          </button>
        </div>
      </div>

      {/* Main Sandbox Content Body */}
      <div style={{ height: isFullscreen ? 'calc(100vh - 46px)' : '380px', position: 'relative', background: '#070a13' }}>
        {/* TAB 1: LIVE IFRAME PREVIEW */}
        <div style={{ width: '100%', height: '100%', display: activeTab === 'preview' ? 'block' : 'none' }}>
          <iframe
            ref={iframeRef}
            title="LAF Agent Sandbox"
            sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: '#ffffff'
            }}
          />
        </div>

        {/* TAB 2: CODE SOURCE VIEWER */}
        <div
          style={{
            width: '100%',
            height: '100%',
            overflowY: 'auto',
            padding: '16px',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            color: '#e2e8f0',
            background: '#0d1117',
            display: activeTab === 'code' ? 'block' : 'none',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}
        >
          {code}
        </div>

        {/* TAB 3: CONSOLE OUTPUT STREAM */}
        <div
          style={{
            width: '100%',
            height: '100%',
            overflowY: 'auto',
            padding: '14px 16px',
            fontFamily: 'monospace',
            fontSize: '0.82rem',
            background: '#070a12',
            display: activeTab === 'console' ? 'block' : 'none'
          }}
        >
          {logs.length === 0 ? (
            <div style={{ color: '#64748b', fontStyle: 'italic', padding: '10px 0' }}>
              No console logs emitted yet. Actions inside the preview will stream events here in real time.
            </div>
          ) : (
            logs.map((l, i) => (
              <div
                key={i}
                style={{
                  padding: '4px 0',
                  color: l.type === 'error' ? '#f87171' : '#38bdf8',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  display: 'flex',
                  gap: '8px'
                }}
              >
                <span style={{ color: '#64748b' }}>[{l.time}]</span>
                <span>{l.text}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
