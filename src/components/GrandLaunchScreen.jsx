import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Bell, ArrowRight, CheckCircle2, ShieldCheck, Play, Lock } from 'lucide-react';
import { apiUrl } from '../api';
import { createLocalSession } from '../utils/aiClient';

export default function GrandLaunchScreen({ user, onRegisterSuccess, onLaunchUnlock, isPreviewMode = false }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, totalMs: 0 });
  const [isLaunched, setIsLaunched] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  
  // Registration form state
  const [nameInput, setNameInput] = useState(user?.username || localStorage.getItem('laf_username') || '');
  const [emailInput, setEmailInput] = useState(localStorage.getItem('laf_email') || '');
  const [registered, setRegistered] = useState(Boolean(user?.username || localStorage.getItem('laf_username')));
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [devBypass, setDevBypass] = useState(false);

  const canvasRef = useRef(null);

  // Compute launch target: Today at 12:00:00 PM (12.o clock) IST
  const getTargetTime = () => {
    const now = new Date();
    // Sharply 12:00:00 PM today
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
    return target.getTime();
  };

  // Timer loop
  useEffect(() => {
    const targetTime = getTargetTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0 || devBypass) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, totalMs: 0 });
        if (!isLaunched) {
          setIsLaunched(true);
          handleLaunchTrigger();
        }
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds, totalMs: diff });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isLaunched, devBypass]);

  // Dispatch launch notification when time hits 12:00 PM
  const handleLaunchTrigger = async () => {
    try {
      // Broadcast launch email to all registered users
      fetch(apiUrl('/api/admin/broadcast-launch'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ developerPermission: true })
      }).catch(() => {});
    } catch (e) {}

    // Wait 2.5 seconds for celebration fireworks finale, then smoothly lift curtain into LAF
    setTimeout(() => {
      setFadingOut(true);
      setTimeout(() => {
        if (onLaunchUnlock) onLaunchUnlock();
      }, 1200);
    }, 2500);
  };

  // Handle User Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    const cleanName = nameInput.trim();
    const cleanEmail = emailInput.trim().toLowerCase();

    if (!cleanName || cleanName.length < 2) {
      setRegError('Please enter your name (minimum 2 characters).');
      return;
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setRegError('Please enter a valid email address to receive launch & update alerts.');
      return;
    }

    setRegLoading(true);
    setRegError('');

    // Save in localStorage immediately
    localStorage.setItem('laf_username', cleanName);
    localStorage.setItem('laf_email', cleanEmail);

    let sessionToken = 'laf_guest_' + Date.now();
    let userData = { username: cleanName, email: cleanEmail };

    // Register via Backend
    try {
      const res = await fetch(apiUrl('/api/admin/register-launch'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanName, email: cleanEmail })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) userData = data.user;
      }

      // Also obtain auth session
      const authRes = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanName, email: cleanEmail })
      });
      if (authRes.ok) {
        const authData = await authRes.json();
        if (authData.token) sessionToken = authData.token;
      }
    } catch (err) {
      console.warn('Backend registration note:', err.message);
      const local = createLocalSession(cleanName);
      sessionToken = local.token;
    }

    localStorage.setItem('laf_token', sessionToken);
    setRegistered(true);
    setRegLoading(false);

    if (onRegisterSuccess) {
      onRegisterSuccess(userData, sessionToken);
    }
  };

  // HTML5 Canvas Fireworks & Diwali Crackers Blast Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle and Rocket Systems
    const particles = [];
    const rockets = [];

    const festiveColors = [
      '#f59e0b', // Festive Gold
      '#ef4444', // Brilliant Crimson
      '#3b82f6', // Royal Blue
      '#10b981', // Emerald Green
      '#ec4899', // Radiant Pink
      '#8b5cf6', // Electric Purple
      '#06b6d4', // Cyan Spark
      '#ffffff'  // Pure Starlight
    ];

    class Rocket {
      constructor(x, targetY, color) {
        this.x = x || Math.random() * (canvas.width - 200) + 100;
        this.y = canvas.height;
        this.targetY = targetY || Math.random() * (canvas.height * 0.45) + (canvas.height * 0.1);
        this.color = color || festiveColors[Math.floor(Math.random() * festiveColors.length)];
        this.speed = Math.random() * 4 + 7;
        this.trail = [];
      }

      update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 5) this.trail.shift();
        this.y -= this.speed;
        return this.y <= this.targetY;
      }

      draw() {
        ctx.save();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        if (this.trail.length > 0) {
          ctx.moveTo(this.trail[0].x, this.trail[0].y);
          for (let i = 1; i < this.trail.length; i++) {
            ctx.lineTo(this.trail[i].x, this.trail[i].y);
          }
        }
        ctx.stroke();
        ctx.restore();
      }

      explode() {
        const count = Math.floor(Math.random() * 40) + 60;
        for (let i = 0; i < count; i++) {
          particles.push(new Particle(this.x, this.y, this.color));
        }
      }
    }

    class Particle {
      constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 1.5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.gravity = 0.05;
        this.friction = 0.96;
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.009;
        this.radius = Math.random() * 2.5 + 1.5;
      }

      update() {
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
        return this.alpha <= 0;
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Interactive cracker blast on user tap / click
    const handleCanvasClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const color = festiveColors[Math.floor(Math.random() * festiveColors.length)];
      for (let i = 0; i < 70; i++) {
        particles.push(new Particle(x, y, color));
      }
    };
    canvas.addEventListener('pointerdown', handleCanvasClick);

    // Continuous fireworks spawner
    let spawnCounter = 0;
    const render = () => {
      ctx.fillStyle = 'rgba(7, 11, 22, 0.22)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      spawnCounter++;
      // Launch a new cracker rocket every 28 frames
      if (spawnCounter % 28 === 0) {
        rockets.push(new Rocket());
      }

      // Update rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const rocket = rockets[i];
        rocket.draw();
        if (rocket.update()) {
          rocket.explode();
          rockets.splice(i, 1);
        }
      }

      // Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.draw();
        if (p.update()) {
          particles.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('pointerdown', handleCanvasClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: '#070b16',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflowY: 'auto',
        overflowX: 'hidden',
        color: '#f8fafc',
        padding: '24px 16px',
        opacity: fadingOut ? 0 : 1,
        transform: fadingOut ? 'scale(1.04)' : 'scale(1)',
        transition: 'opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: fadingOut ? 'none' : 'auto'
      }}
    >
      {/* Dynamic Background Cracker Blast Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'auto'
        }}
      />

      {/* Foreground Container with Glassmorphism */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '680px',
          width: '100%',
          margin: 'auto',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(234, 179, 8, 0.35)',
          borderRadius: '28px',
          padding: '36px 28px',
          textAlign: 'center',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(234, 179, 8, 0.25)',
          animation: 'fadeInUp 0.8s ease'
        }}
      >
        {/* Festive Diya Header with Glowing Flame */}
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '12px' }}>
          <span style={{ fontSize: '2.5rem', animation: 'pulse 1.8s infinite' }}>🪔</span>
          <span style={{ fontSize: '2.5rem', animation: 'bounce 2.2s infinite' }}>🎆</span>
          <span style={{ fontSize: '2.5rem', animation: 'pulse 1.8s infinite' }}>🪔</span>
        </div>

        {/* Happy Diwali Announcement */}
        <h2
          style={{
            margin: '0 0 6px 0',
            fontSize: 'clamp(1.6rem, 5vw, 2.3rem)',
            fontWeight: '900',
            fontFamily: 'var(--font-title)',
            background: 'linear-gradient(135deg, #fde047 0%, #f59e0b 50%, #f97316 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.5px'
          }}
        >
          HAPPY DIWALI!
        </h2>
        <p style={{ color: '#93c5fd', fontSize: '0.96rem', fontWeight: '600', margin: '0 0 22px 0', lineHeight: '1.5' }}>
          May the festival of lights bring limitless happiness, peace, and prosperity to you and your loved ones!
        </p>

        {/* Brand Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(37, 99, 235, 0.18)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            padding: '6px 18px',
            borderRadius: '9999px',
            color: '#60a5fa',
            fontSize: '0.85rem',
            fontWeight: '700',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '16px'
          }}
        >
          <Sparkles style={{ width: '16px', color: '#f59e0b' }} />
          <span>LAF AI • Look At Future</span>
        </div>

        {/* Grand Launch Headline */}
        <h1
          style={{
            margin: '0 0 10px 0',
            fontSize: 'clamp(1.8rem, 6vw, 2.8rem)',
            fontWeight: '900',
            color: '#ffffff',
            letterSpacing: '-0.5px'
          }}
        >
          {isLaunched ? '🚀 GRAND LAUNCH IS LIVE!' : 'Grand Launch Starts In'}
        </h1>

        {/* Running Live Countdown Timer */}
        {!isLaunched && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              margin: '24px 0 32px 0'
            }}
          >
            {/* Hours */}
            <div style={timeCardStyle}>
              <div style={timeDigitStyle}>{String(timeLeft.hours).padStart(2, '0')}</div>
              <div style={timeLabelStyle}>HOURS</div>
            </div>

            <span style={timeSeparatorStyle}>:</span>

            {/* Minutes */}
            <div style={timeCardStyle}>
              <div style={timeDigitStyle}>{String(timeLeft.minutes).padStart(2, '0')}</div>
              <div style={timeLabelStyle}>MINUTES</div>
            </div>

            <span style={timeSeparatorStyle}>:</span>

            {/* Seconds */}
            <div style={timeCardStyle}>
              <div style={{ ...timeDigitStyle, color: '#f59e0b' }}>{String(timeLeft.seconds).padStart(2, '0')}</div>
              <div style={timeLabelStyle}>SECONDS</div>
            </div>
          </div>
        )}

        {isLaunched && (
          <div style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '16px', margin: '20px 0' }}>
            <h3 style={{ margin: 0, color: '#34d399', fontSize: '1.2rem', fontWeight: '800' }}>
              🎉 Sharply 12:00 PM Achieved! Unlocking LAF AI Workspace...
            </h3>
            <p style={{ margin: '6px 0 0 0', color: '#e2e8f0', fontSize: '0.9rem' }}>
              Welcome to the fastest multimodal AI platform. Enjoy the celebration!
            </p>
          </div>
        )}

        {/* Pre-Registration / VIP Status Card */}
        {!registered ? (
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '20px',
              padding: '24px 20px',
              textAlign: 'left',
              marginTop: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Lock style={{ width: '18px', color: '#f59e0b' }} />
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#f8fafc', fontWeight: '700' }}>
                Pre-Register to Unlock VIP Access at 12:00 PM
              </h3>
            </div>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.86rem', color: '#94a3b8' }}>
              Enter your name and email to receive the Grand Launch notification and be first to use LAF AI sharply at 12:00 PM.
            </p>

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder="Enter your name (e.g. Alex)"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                style={inputStyle}
                required
              />

              <input
                type="email"
                placeholder="Enter your email (e.g. alex@example.com)"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                style={inputStyle}
                required
              />

              {regError && (
                <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: '600' }}>
                  {regError}
                </div>
              )}

              <button
                type="submit"
                disabled={regLoading}
                style={{
                  padding: '14px',
                  background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                  border: 'none',
                  borderRadius: '9999px',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '0.96rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{regLoading ? 'Registering VIP Access...' : 'Register for Grand Launch →'}</span>
              </button>
            </form>
          </div>
        ) : (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '20px',
              padding: '20px',
              textAlign: 'center',
              marginTop: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
              <CheckCircle2 style={{ width: '22px', color: '#10b981' }} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#34d399', fontWeight: '800' }}>
                VIP Access Confirmed: @{nameInput || user?.username}
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#cbd5e1' }}>
              Your access unlocks sharply at <strong>12:00 PM</strong>. Launch email notification has been queued for <strong>{emailInput || localStorage.getItem('laf_email') || 'your email'}</strong>.
            </p>
          </div>
        )}

        {/* Footer Guarantee */}
        <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748b' }}>
          <ShieldCheck style={{ width: '15px', color: '#10b981' }} />
          <span>Architected & Engineered by K S Purushothaman • All Rights Reserved</span>
        </div>

        {/* Developer Test Bypass (for testing and verification) */}
        <div style={{ marginTop: '14px', textAlign: 'center' }}>
          <button
            onClick={() => setDevBypass(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.2)',
              fontSize: '0.72rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
            title="Click to preview the 12:00 PM unlock transition"
          >
            Developer Mode: Preview 12:00 PM Unlock
          </button>
        </div>
      </div>
    </div>
  );
}

// Styling Constants
const timeCardStyle = {
  background: 'rgba(30, 41, 59, 0.9)',
  border: '1.5px solid rgba(234, 179, 8, 0.4)',
  borderRadius: '18px',
  padding: '16px 14px',
  minWidth: '85px',
  textAlign: 'center',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), inset 0 0 15px rgba(234, 179, 8, 0.08)'
};

const timeDigitStyle = {
  fontSize: 'clamp(2rem, 6vw, 2.8rem)',
  fontWeight: '900',
  fontFamily: 'monospace',
  color: '#ffffff',
  lineHeight: '1',
  marginBottom: '4px'
};

const timeLabelStyle = {
  fontSize: '0.68rem',
  fontWeight: '800',
  color: '#94a3b8',
  letterSpacing: '1px'
};

const timeSeparatorStyle = {
  fontSize: '2rem',
  fontWeight: '900',
  color: '#f59e0b',
  margin: '0 2px'
};

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  background: 'rgba(15, 23, 42, 0.9)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '12px',
  color: '#ffffff',
  fontSize: '0.94rem',
  outline: 'none',
  boxSizing: 'border-box'
};
