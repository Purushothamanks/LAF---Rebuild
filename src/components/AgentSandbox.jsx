import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Code, Terminal, Maximize2, Minimize2, RefreshCw, 
  AlertCircle, CheckCircle2, Copy, Check, ExternalLink, 
  Monitor, Tablet, Smartphone, X, Trash2
} from 'lucide-react';

/**
 * Sandboxed In-Browser Execution & Live Preview Engine for LAF AI
 * Securely runs generated HTML, CSS, JavaScript, SVGs, and Web Apps in an isolated iframe.
 * Perfectly calibrated to fit both Mobile and Desktop viewports seamlessly.
 */
export default function AgentSandbox({ 
  code, 
  language = 'html', 
  title = 'Interactive Application Preview',
  embedded = false 
}) {
  const [activeTab, setActiveTab] = useState('preview'); // 'preview', 'code', 'console'
  const [deviceMode, setDeviceMode] = useState('desktop'); // 'desktop', 'tablet', 'mobile'
  const [showConsole, setShowConsole] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [hasError, setHasError] = useState(false);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef(null);
  const [sandboxHtml, setSandboxHtml] = useState('');

  // Prepare robust, fully responsive HTML bundle
  const prepareHtmlBundle = (rawCode, lang) => {
    const raw = (rawCode || '').trim();

    // Console and error interceptor script
    const interceptScript = `
<script>
  (function() {
    var _log = console.log;
    var _err = console.error;
    var _warn = console.warn;
    console.log = function() {
      _log.apply(console, arguments);
      try {
        var args = Array.prototype.slice.call(arguments);
        var msg = args.map(function(a) { return typeof a === 'object' ? JSON.stringify(a) : String(a); }).join(' ');
        window.parent.postMessage({ type: 'CONSOLE_LOG', message: msg }, '*');
      } catch(e) {}
    };
    console.warn = function() {
      _warn.apply(console, arguments);
      try {
        var args = Array.prototype.slice.call(arguments);
        var msg = args.map(function(a) { return typeof a === 'object' ? JSON.stringify(a) : String(a); }).join(' ');
        window.parent.postMessage({ type: 'CONSOLE_WARN', message: msg }, '*');
      } catch(e) {}
    };
    console.error = function() {
      _err.apply(console, arguments);
      try {
        var args = Array.prototype.slice.call(arguments);
        var msg = args.map(function(a) { return typeof a === 'object' ? JSON.stringify(a) : String(a); }).join(' ');
        window.parent.postMessage({ type: 'CONSOLE_ERROR', message: msg }, '*');
      } catch(e) {}
    };
    window.addEventListener('error', function(e) {
      try {
        window.parent.postMessage({ type: 'CONSOLE_ERROR', message: (e.message || 'Script error') + ' (at line ' + (e.lineno || '?') + ')' }, '*');
      } catch(err) {}
    });
  })();
</script>`;

    // 1. Pure SVG Graphic Rendering
    if (lang === 'svg' || (raw.startsWith('<svg') && raw.endsWith('</svg>'))) {
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #090d16;
      overflow: auto;
      padding: 16px;
    }
    svg {
      max-width: 100%;
      max-height: 100%;
      height: auto;
      filter: drop-shadow(0 10px 25px rgba(0,0,0,0.5));
    }
  </style>
</head>
<body>
  ${raw}
</body>
</html>`;
    }

    // 2. JavaScript Execution Playground
    if (lang === 'javascript' || lang === 'js') {
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #090d16;
      color: #f8fafc;
      padding: 24px;
      line-height: 1.6;
    }
    h3 { color: #38bdf8; margin-bottom: 14px; font-size: 1.05rem; }
    pre {
      background: #111827;
      padding: 14px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.1);
      overflow-x: auto;
      font-family: monospace;
      font-size: 0.88rem;
      margin-bottom: 10px;
      color: #7dd3fc;
    }
  </style>
</head>
<body>
  <h3>JavaScript Execution Output:</h3>
  <div id="output"></div>
  <script>
    var out = document.getElementById('output');
    var originalLog = console.log;
    console.log = function() {
      originalLog.apply(console, arguments);
      var p = document.createElement('pre');
      p.textContent = Array.prototype.slice.call(arguments).map(function(a) {
        return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a);
      }).join(' ');
      out.appendChild(p);
      window.parent.postMessage({ type: 'CONSOLE_LOG', message: p.textContent }, '*');
    };
    window.onerror = function(msg, url, line) {
      window.parent.postMessage({ type: 'CONSOLE_ERROR', message: msg + ' (Line ' + line + ')' }, '*');
    };
    try {
      ${raw}
    } catch(err) {
      console.error(err);
      window.parent.postMessage({ type: 'CONSOLE_ERROR', message: err.message }, '*');
    }
  </script>
</body>
</html>`;
    }

    // 3. Web Application / HTML Code
    let htmlContent = raw;

    // Check if full document
    if (/<!doctype|html/i.test(htmlContent)) {
      // Ensure viewport meta tag is present for mobile fidelity
      if (!/<meta[^>]*viewport/i.test(htmlContent)) {
        const viewportMeta = `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">\n`;
        if (/<head[^>]*>/i.test(htmlContent)) {
          htmlContent = htmlContent.replace(/<head[^>]*>/i, `$&${viewportMeta}`);
        } else {
          htmlContent = viewportMeta + htmlContent;
        }
      }
      if (/<head[^>]*>/i.test(htmlContent)) {
        htmlContent = htmlContent.replace(/<head[^>]*>/i, `$&${interceptScript}`);
      } else {
        htmlContent = interceptScript + htmlContent;
      }
      return htmlContent;
    }

    // Standalone HTML fragment: Wrap inside a clean, responsive HTML5 document
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  ${interceptScript}
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      min-height: 100%;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      color: #0f172a;
    }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;
  };

  const reloadSandbox = () => {
    setLogs([]);
    setHasError(false);
    const bundle = prepareHtmlBundle(code, language);
    setSandboxHtml(bundle);
    if (iframeRef.current) {
      iframeRef.current.srcdoc = bundle;
    }
  };

  // Open the live app in a full browser tab safely with noopener,noreferrer
  const openInNewTab = () => {
    try {
      const fullHtml = prepareHtmlBundle(code, language);
      const blob = new Blob([fullHtml], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
    } catch (e) {
      console.warn('Failed to open preview in new window:', e);
    }
  };

  useEffect(() => {
    reloadSandbox();
  }, [code, language]);

  useEffect(() => {
    const handleMessage = (event) => {
      // Defensive Security Barrier: strictly accept events from our sandboxed iframe
      if (iframeRef.current && event.source !== iframeRef.current.contentWindow) return;
      if (!event.data || typeof event.data !== 'object') return;

      if (event.data.type === 'CONSOLE_LOG' || event.data.type === 'CONSOLE_WARN') {
        setLogs(prev => [...prev.slice(-40), { 
          type: event.data.type === 'CONSOLE_WARN' ? 'warn' : 'log', 
          text: String(event.data.message || ''), 
          time: new Date().toLocaleTimeString() 
        }]);
      } else if (event.data.type === 'CONSOLE_ERROR') {
        setHasError(true);
        setLogs(prev => [...prev.slice(-40), { 
          type: 'error', 
          text: String(event.data.message || ''), 
          time: new Date().toLocaleTimeString() 
        }]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // -------------------------------------------------------------
  // 1. EMBEDDED MODE (Inside LAF Canvas)
  // Maximize viewable space with 100% height and responsive viewports
  // -------------------------------------------------------------
  if (embedded) {
    return (
      <div 
        className="agent-sandbox-embedded"
        style={{
          width: '100%',
          height: '100%',
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          background: '#070a13',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Sleek Sub-Toolbar: Status, Device Mode & Quick Actions */}
        <div 
          className="sandbox-embedded-toolbar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 14px',
            background: 'rgba(15, 23, 42, 0.95)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            flexShrink: 0,
            gap: '8px',
            zIndex: 10
          }}
        >
          {/* Left: Verification Badge & Console Drawer Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            {hasError ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: '700', color: '#f87171', background: 'rgba(239, 68, 68, 0.15)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <AlertCircle style={{ width: '12px', height: '12px' }} />
                <span>Error Notice</span>
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: '700', color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <CheckCircle2 style={{ width: '12px', height: '12px' }} />
                <span>Live Sandbox</span>
              </span>
            )}

            {/* Console Drawer Toggle */}
            <button
              type="button"
              onClick={() => setShowConsole(!showConsole)}
              title="Toggle runtime console output"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: showConsole ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.04)',
                color: showConsole ? '#60a5fa' : '#94a3b8',
                fontSize: '0.72rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Terminal style={{ width: '12px', height: '12px' }} />
              <span>Console</span>
              {logs.length > 0 && (
                <span style={{ 
                  fontSize: '0.66rem', 
                  padding: '0 5px', 
                  borderRadius: '10px', 
                  background: hasError ? '#ef4444' : '#2563eb', 
                  color: '#fff',
                  fontWeight: '700'
                }}>
                  {logs.length}
                </span>
              )}
            </button>
          </div>

          {/* Center: Device Viewport Switcher (Desktop only - hidden on mobile) */}
          <div className="sandbox-device-pills" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.4)', padding: '2px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              type="button"
              onClick={() => setDeviceMode('desktop')}
              title="Full Width Responsive (Desktop)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '6px',
                border: 'none',
                background: deviceMode === 'desktop' ? '#2563eb' : 'transparent',
                color: deviceMode === 'desktop' ? '#fff' : '#94a3b8',
                fontSize: '0.72rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Monitor style={{ width: '12px', height: '12px' }} />
              <span className="device-btn-text">Desktop</span>
            </button>

            <button
              type="button"
              onClick={() => setDeviceMode('tablet')}
              title="Tablet Viewport (768px)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '6px',
                border: 'none',
                background: deviceMode === 'tablet' ? '#2563eb' : 'transparent',
                color: deviceMode === 'tablet' ? '#fff' : '#94a3b8',
                fontSize: '0.72rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Tablet style={{ width: '12px', height: '12px' }} />
              <span className="device-btn-text">Tablet</span>
            </button>

            <button
              type="button"
              onClick={() => setDeviceMode('mobile')}
              title="Mobile Viewport (375px)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '6px',
                border: 'none',
                background: deviceMode === 'mobile' ? '#2563eb' : 'transparent',
                color: deviceMode === 'mobile' ? '#fff' : '#94a3b8',
                fontSize: '0.72rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Smartphone style={{ width: '12px', height: '12px' }} />
              <span className="device-btn-text">Mobile</span>
            </button>
          </div>

          {/* Right: Reload & Open in New Window */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={reloadSandbox}
              title="Reload sandbox preview"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: '#cbd5e1',
                cursor: 'pointer',
                fontSize: '0.72rem',
                fontWeight: '600'
              }}
            >
              <RefreshCw style={{ width: '12px', height: '12px' }} />
              <span className="sandbox-action-text">Reload</span>
            </button>

            <button
              type="button"
              onClick={openInNewTab}
              title="Open in new browser tab"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#93c5fd',
                cursor: 'pointer',
                fontSize: '0.72rem',
                fontWeight: '600'
              }}
            >
              <ExternalLink style={{ width: '12px', height: '12px' }} />
              <span className="sandbox-action-text">New Tab</span>
            </button>
          </div>
        </div>

        {/* Viewport Frame Container (Edge-to-Edge & Responsive) */}
        <div 
          className="sandbox-viewport-container"
          style={{
            flex: 1,
            minHeight: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#090d16',
            overflow: 'auto',
            padding: deviceMode === 'desktop' ? '0' : '16px',
            position: 'relative'
          }}
        >
          <div
            className={`sandbox-device-frame device-frame-${deviceMode}`}
            style={{
              width: deviceMode === 'desktop' ? '100%' : (deviceMode === 'tablet' ? '768px' : '375px'),
              maxWidth: '100%',
              height: '100%',
              maxHeight: deviceMode === 'mobile' ? '740px' : (deviceMode === 'tablet' ? '820px' : '100%'),
              borderRadius: deviceMode === 'desktop' ? '0' : (deviceMode === 'mobile' ? '28px' : '16px'),
              border: deviceMode === 'desktop' ? 'none' : '8px solid #1e293b',
              boxShadow: deviceMode === 'desktop' ? 'none' : '0 20px 50px rgba(0,0,0,0.8), 0 0 20px rgba(59, 130, 246, 0.2)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              background: '#ffffff',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <iframe
              ref={iframeRef}
              title="LAF Live App Preview"
              sandbox="allow-scripts allow-modals allow-forms"
              srcDoc={sandboxHtml}
              style={{
                width: '100%',
                height: '100%',
                flex: 1,
                minHeight: 0,
                border: 'none',
                background: '#ffffff',
                display: 'block'
              }}
            />
          </div>
        </div>

        {/* Real-time Slide-up Console Logs Drawer */}
        {showConsole && (
          <div 
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '210px',
              maxHeight: '45%',
              background: 'rgba(10, 15, 26, 0.96)',
              backdropFilter: 'blur(16px)',
              borderTop: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 30,
              boxShadow: '0 -10px 30px rgba(0,0,0,0.6)'
            }}
          >
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 14px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(15, 23, 42, 0.7)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Terminal style={{ width: '13px', height: '13px', color: '#60a5fa' }} />
                <span style={{ fontSize: '0.74rem', fontWeight: '700', color: '#e2e8f0' }}>Runtime Console Logs</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setLogs([])}
                  title="Clear Console"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.7rem'
                  }}
                >
                  <Trash2 style={{ width: '11px', height: '11px' }} />
                  <span>Clear</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowConsole(false)}
                  title="Close Console"
                  style={{
                    padding: '3px 6px',
                    borderRadius: '4px',
                    border: 'none',
                    background: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  <X style={{ width: '13px', height: '13px' }} />
                </button>
              </div>
            </div>

            <div 
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                padding: '10px 14px',
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                background: '#060911'
              }}
            >
              {logs.length === 0 ? (
                <div style={{ color: '#64748b', fontStyle: 'italic', padding: '6px 0' }}>
                  No console logs emitted yet. Click interactive buttons inside the preview to stream runtime events.
                </div>
              ) : (
                logs.map((l, i) => (
                  <div 
                    key={i}
                    style={{
                      padding: '3px 0',
                      color: l.type === 'error' ? '#f87171' : (l.type === 'warn' ? '#fbbf24' : '#38bdf8'),
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      display: 'flex',
                      gap: '8px',
                      wordBreak: 'break-word'
                    }}
                  >
                    <span style={{ color: '#64748b', flexShrink: 0 }}>[{l.time}]</span>
                    <span>{l.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. STANDALONE MODE (e.g. In MemoryVault or standalone widgets)
  // -------------------------------------------------------------
  return (
    <div
      style={{
        borderRadius: isFullscreen ? 0 : '12px',
        border: isFullscreen ? 'none' : '1px solid rgba(79, 117, 255, 0.3)',
        background: '#090d16',
        overflow: 'hidden',
        boxShadow: isFullscreen ? 'none' : '0 8px 30px rgba(0, 0, 0, 0.4)',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? '0' : 'auto',
        left: isFullscreen ? '0' : 'auto',
        width: isFullscreen ? '100vw' : '100%',
        height: isFullscreen ? '100vh' : '520px',
        zIndex: isFullscreen ? 99999 : 1,
        display: 'flex',
        flexDirection: 'column'
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
          backdropFilter: 'blur(8px)',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
          </div>
          <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#cbd5e1', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title}
          </span>
          {hasError ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#f87171', background: 'rgba(239, 68, 68, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
              <AlertCircle style={{ width: '12px' }} /> Notice
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
              <CheckCircle2 style={{ width: '12px' }} /> Verified
            </span>
          )}
        </div>

        {/* View Switchers & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'preview' ? 'rgba(79, 117, 255, 0.25)' : 'transparent',
              color: activeTab === 'preview' ? '#60a5fa' : '#94a3b8',
              fontSize: '0.76rem',
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
            type="button"
            onClick={() => setActiveTab('code')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'code' ? 'rgba(79, 117, 255, 0.25)' : 'transparent',
              color: activeTab === 'code' ? '#60a5fa' : '#94a3b8',
              fontSize: '0.76rem',
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
            type="button"
            onClick={() => setActiveTab('console')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'console' ? 'rgba(79, 117, 255, 0.25)' : 'transparent',
              color: activeTab === 'console' ? '#60a5fa' : '#94a3b8',
              fontSize: '0.76rem',
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
            type="button"
            onClick={reloadSandbox}
            title="Reload Sandbox"
            style={{
              padding: '5px',
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
            type="button"
            onClick={handleCopyCode}
            title="Copy Source Code"
            style={{
              padding: '5px',
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
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Preview'}
            style={{
              padding: '5px',
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
      <div style={{ flex: 1, minHeight: 0, position: 'relative', background: '#070a13', display: 'flex', flexDirection: 'column' }}>
        {/* TAB 1: LIVE IFRAME PREVIEW */}
        <div style={{ width: '100%', height: '100%', flex: 1, minHeight: 0, display: activeTab === 'preview' ? 'block' : 'none' }}>
          <iframe
            ref={iframeRef}
            title="LAF Agent Sandbox"
            sandbox="allow-scripts allow-modals allow-forms"
            srcDoc={sandboxHtml}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: '#ffffff',
              display: 'block'
            }}
          />
        </div>

        {/* TAB 2: CODE SOURCE VIEWER */}
        <div
          style={{
            width: '100%',
            height: '100%',
            flex: 1,
            minHeight: 0,
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
            flex: 1,
            minHeight: 0,
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
                  color: l.type === 'error' ? '#f87171' : (l.type === 'warn' ? '#fbbf24' : '#38bdf8'),
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
