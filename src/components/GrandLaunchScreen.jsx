import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, ShieldCheck, Lock, Mail, User } from 'lucide-react';
import { apiUrl } from '../api';
import { createLocalSession } from '../utils/aiClient';

export default function GrandLaunchScreen({ user, onRegisterSuccess, onLaunchUnlock }) {
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

  // Compute launch target: Today at sharply 1:00:00 PM (13:00 IST)
  const getTargetTime = () => {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0, 0, 0);
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

  // Dispatch launch notification when time hits 1:00 PM
  const handleLaunchTrigger = async () => {
    try {
      fetch(apiUrl('/api/admin/broadcast-launch'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ developerPermission: true })
      }).catch(() => {});
    } catch (e) {}

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
      setRegError('Please enter a valid email address.');
      return;
    }

    setRegLoading(true);
    setRegError('');

    localStorage.setItem('laf_username', cleanName);
    localStorage.setItem('laf_email', cleanEmail);

    let sessionToken = 'laf_guest_' + Date.now();
    let userData = { username: cleanName, email: cleanEmail };

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

  // 60 FPS HTML5 Canvas Crackers Blast & Particle Fireworks
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
      '#ffffff'  // Starlight White
    ];

    class Rocket {
      constructor(x, targetY, color) {
        this.x = x || Math.random() * (canvas.width - 160) + 80;
        this.y = canvas.height;
        this.targetY = targetY || Math.random() * (canvas.height * 0.42) + (canvas.height * 0.08);
        this.color = color || festiveColors[Math.floor(Math.random() * festiveColors.length)];
        this.speed = Math.random() * 4 + 7.5;
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
        ctx.lineWidth = 2.2;
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
        const count = Math.floor(Math.random() * 35) + 55;
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
        const speed = Math.random() * 5.5 + 1.2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.gravity = 0.048;
        this.friction = 0.965;
        this.alpha = 1;
        this.decay = Math.random() * 0.016 + 0.009;
        this.radius = Math.random() * 2.2 + 1.2;
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
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const handleCanvasClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const color = festiveColors[Math.floor(Math.random() * festiveColors.length)];
      for (let i = 0; i < 60; i++) {
        particles.push(new Particle(x, y, color));
      }
    };
    canvas.addEventListener('pointerdown', handleCanvasClick);

    let spawnCounter = 0;
    const render = () => {
      ctx.fillStyle = 'rgba(5, 8, 18, 0.22)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      spawnCounter++;
      if (spawnCounter % 26 === 0) {
        rockets.push(new Rocket());
      }

      for (let i = rockets.length - 1; i >= 0; i--) {
        const rocket = rockets[i];
        rocket.draw();
        if (rocket.update()) {
          rocket.explode();
          rockets.splice(i, 1);
        }
      }

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
        background: 'radial-gradient(ellipse at 50% 15%, #0f1d38 0%, #060b17 65%, #03060c 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflowY: 'auto',
        overflowX: 'hidden',
        color: '#f8fafc',
        padding: 'clamp(16px, 4vw, 32px) clamp(12px, 3vw, 24px)',
        opacity: fadingOut ? 0 : 1,
        transform: fadingOut ? 'scale(1.03)' : 'scale(1)',
        transition: 'opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: fadingOut ? 'none' : 'auto'
      }}
    >
      {/* Background Fireworks Canvas */}
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

      {/* Modern Ethereal Floating Hero Container (Non-Boxy, Fluid Glass) */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '640px',
          width: '100%',
          margin: 'auto',
          background: 'rgba(10, 16, 30, 0.72)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 'clamp(24px, 5vw, 36px)',
          padding: 'clamp(24px, 5vw, 40px) clamp(18px, 4vw, 32px)',
          textAlign: 'center',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.75), 0 0 50px rgba(37, 99, 235, 0.18)',
          boxSizing: 'border-box'
        }}
      >
        {/* Festive Diya Header with Ambient Glow */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
          <span style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', filter: 'drop-shadow(0 0 12px rgba(245, 158, 11, 0.6))' }}>🪔</span>
          <span style={{ fontSize: 'clamp(1.8rem, 4.5vw, 2.2rem)', filter: 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.5))' }}>✨</span>
          <span style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', filter: 'drop-shadow(0 0 12px rgba(245, 158, 11, 0.6))' }}>🪔</span>
        </div>

        {/* Happy Diwali Headline */}
        <h2
          style={{
            margin: '0 0 6px 0',
            fontSize: 'clamp(1.5rem, 5.5vw, 2.2rem)',
            fontWeight: '900',
            fontFamily: 'var(--font-title)',
            background: 'linear-gradient(135deg, #fffbeb 0%, #fde047 35%, #f59e0b 70%, #ea580c 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '1px'
          }}
        >
          HAPPY DIWALI!
        </h2>
        <p style={{ color: '#cbd5e1', fontSize: 'clamp(0.85rem, 2.8vw, 0.98rem)', fontWeight: '500', margin: '0 0 20px 0', lineHeight: '1.5' }}>
          Wishing you a vibrant, joyous, and prosperous Diwali!
        </p>

        {/* Brand Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(59, 130, 246, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            padding: '6px 18px',
            borderRadius: '9999px',
            color: '#60a5fa',
            fontSize: 'clamp(0.75rem, 2.4vw, 0.85rem)',
            fontWeight: '700',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '14px'
          }}
        >
          <Sparkles style={{ width: '15px', color: '#f59e0b' }} />
          <span>LAF AI • Look At Future</span>
        </div>

        {/* Grand Launch Title */}
        <h1
          style={{
            margin: '0 0 8px 0',
            fontSize: 'clamp(1.6rem, 5vw, 2.5rem)',
            fontWeight: '900',
            color: '#ffffff',
            letterSpacing: '-0.5px'
          }}
        >
          {isLaunched ? '🚀 GRAND LAUNCH IS LIVE!' : 'Grand Launch Starts In'}
        </h1>

        {/* Modern Fluid Floating Timer Ribbon (Zero Clunky Separate Boxes) */}
        {!isLaunched && (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'clamp(20px, 4vw, 28px)',
              padding: 'clamp(16px, 3.5vw, 24px) clamp(10px, 2.5vw, 20px)',
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr auto 1fr',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '20px 0 26px 0',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 8px 24px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Hours Column */}
            <div style={{ textAlign: 'center' }}>
              <div style={fluidNumberStyle}>{String(timeLeft.hours).padStart(2, '0')}</div>
              <div style={fluidLabelStyle}>HOURS</div>
            </div>

            {/* Glowing Divider */}
            <div style={timerDividerStyle}>:</div>

            {/* Minutes Column */}
            <div style={{ textAlign: 'center' }}>
              <div style={fluidNumberStyle}>{String(timeLeft.minutes).padStart(2, '0')}</div>
              <div style={fluidLabelStyle}>MINUTES</div>
            </div>

            {/* Glowing Divider */}
            <div style={timerDividerStyle}>:</div>

            {/* Seconds Column */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ ...fluidNumberStyle, color: '#f59e0b', textShadow: '0 0 20px rgba(245, 158, 11, 0.5)' }}>
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
              <div style={fluidLabelStyle}>SECONDS</div>
            </div>
          </div>
        )}

        {isLaunched && (
          <div style={{ padding: '18px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', borderRadius: '20px', margin: '20px 0' }}>
            <h3 style={{ margin: 0, color: '#34d399', fontSize: 'clamp(1rem, 3.2vw, 1.2rem)', fontWeight: '800' }}>
              🎉 1:00 PM Achieved! Unlocking LAF AI Workspace...
            </h3>
            <p style={{ margin: '6px 0 0 0', color: '#e2e8f0', fontSize: '0.88rem' }}>
              Welcome to the future of intelligence. Enjoy the celebration!
            </p>
          </div>
        )}

        {/* Sleek Floating Pre-Registration or VIP Status */}
        {!registered ? (
          <div style={{ marginTop: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '14px' }}>
              <Lock style={{ width: '16px', color: '#f59e0b' }} />
              <span style={{ fontSize: 'clamp(0.85rem, 2.6vw, 0.95rem)', color: '#f1f5f9', fontWeight: '700' }}>
                Pre-Register to Unlock Access Sharply at 1:00 PM
              </span>
            </div>

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Name Input */}
              <div style={{ position: 'relative' }}>
                <User style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '18px', color: '#60a5fa' }} />
                <input
                  type="text"
                  placeholder="Enter your name (e.g. Alex)"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  style={sleekInputStyle}
                  required
                />
              </div>

              {/* Email Input */}
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '18px', color: '#94a3b8' }} />
                <input
                  type="email"
                  placeholder="Enter your email for 1:00 PM launch notification"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  style={sleekInputStyle}
                  required
                />
              </div>

              {regError && (
                <div style={{ color: '#ef4444', fontSize: '0.82rem', fontWeight: '600', textAlign: 'center' }}>
                  {regError}
                </div>
              )}

              {/* Sleek CTA Button */}
              <button
                type="submit"
                disabled={regLoading}
                style={{
                  width: '100%',
                  padding: 'clamp(12px, 3vw, 15px)',
                  minHeight: '48px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #60a5fa 100%)',
                  border: 'none',
                  borderRadius: '9999px',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: 'clamp(0.9rem, 2.7vw, 1rem)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 20px rgba(37, 99, 235, 0.45)',
                  transition: 'all 0.15s ease',
                  marginTop: '4px'
                }}
              >
                <span>{regLoading ? 'Registering VIP Access...' : 'Register for 1:00 PM Launch'}</span>
                <ArrowRight style={{ width: '18px' }} />
              </button>
            </form>
          </div>
        ) : (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '24px',
              padding: 'clamp(16px, 3.5vw, 22px) clamp(14px, 3vw, 20px)',
              textAlign: 'center',
              marginTop: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
              <CheckCircle2 style={{ width: '20px', color: '#10b981' }} />
              <h3 style={{ margin: 0, fontSize: 'clamp(0.95rem, 3vw, 1.1rem)', color: '#34d399', fontWeight: '800' }}>
                VIP Access Confirmed: @{nameInput || user?.username}
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: 'clamp(0.8rem, 2.5vw, 0.88rem)', color: '#cbd5e1', lineHeight: '1.5' }}>
              Your access unlocks sharply at <strong>1:00 PM</strong>. Launch email notification is queued for <strong>{emailInput || localStorage.getItem('laf_email') || 'your email'}</strong>.
            </p>
          </div>
        )}

        {/* Sleek Minimalist Footer */}
        <div style={{ marginTop: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: 'clamp(0.72rem, 2.2vw, 0.8rem)', color: '#64748b' }}>
          <ShieldCheck style={{ width: '14px', color: '#10b981' }} />
          <span>Engineered by K S Purushothaman • All Rights Reserved</span>
        </div>

        {/* Developer Mode: Preview 1:00 PM Unlock */}
        <div style={{ marginTop: '12px', textAlign: 'center' }}>
          <button
            onClick={() => setDevBypass(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.22)',
              fontSize: '0.72rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
            title="Preview the 1:00 PM launch transition"
          >
            Developer Mode: Preview 1:00 PM Unlock
          </button>
        </div>
      </div>
    </div>
  );
}

// Fluid Modern Typography & Input Styles
const fluidNumberStyle = {
  fontSize: 'clamp(2.2rem, 7vw, 3.6rem)',
  fontWeight: '800',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontVariantNumeric: 'tabular-nums',
  color: '#ffffff',
  lineHeight: '1',
  marginBottom: '4px',
  textShadow: '0 0 25px rgba(255, 255, 255, 0.35)'
};

const fluidLabelStyle = {
  fontSize: 'clamp(0.62rem, 2vw, 0.72rem)',
  fontWeight: '800',
  color: '#94a3b8',
  letterSpacing: '1.5px'
};

const timerDividerStyle = {
  fontSize: 'clamp(1.6rem, 5vw, 2.4rem)',
  fontWeight: '800',
  color: 'rgba(245, 158, 11, 0.8)',
  lineHeight: '1',
  paddingBottom: '14px',
  textShadow: '0 0 15px rgba(245, 158, 11, 0.5)'
};

const sleekInputStyle = {
  width: '100%',
  minHeight: '48px',
  padding: '12px 18px 12px 46px',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.14)',
  borderRadius: '9999px',
  color: '#ffffff',
  fontSize: 'clamp(0.88rem, 2.6vw, 0.95rem)',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
};
