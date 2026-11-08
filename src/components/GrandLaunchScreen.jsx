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

      if (diff <= 0) {
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
  }, [isLaunched]);

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

  // Modern, Ultra-Colorful HTML5 Fireworks & Crackers Blast Simulation
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

    // Vivid, Radiant Festive Diwali Color Palette
    const vibrantPalettes = [
      ['#ffd700', '#f59e0b', '#fbbf24', '#ffffff'], // Golden Sparkle
      ['#00f0ff', '#0284c7', '#38bdf8', '#e0f2fe'], // Electric Cyan
      ['#ff007f', '#f43f5e', '#fb7185', '#ffe4e6'], // Neon Magenta / Rose
      ['#10b981', '#34d399', '#059669', '#a7f3d0'], // Emerald Aurora
      ['#a855f7', '#c084fc', '#7c3aed', '#f3e8ff'], // Royal Violet
      ['#ff6b00', '#f97316', '#fb923c', '#ffedd5'], // Radiant Saffron
      ['#3b82f6', '#60a5fa', '#93c5fd', '#ffffff']  // Deep Star Blue
    ];

    class Rocket {
      constructor() {
        this.x = Math.random() * (canvas.width - 120) + 60;
        this.y = canvas.height;
        this.targetY = Math.random() * (canvas.height * 0.45) + (canvas.height * 0.08);
        this.palette = vibrantPalettes[Math.floor(Math.random() * vibrantPalettes.length)];
        this.color = this.palette[0];
        this.speed = Math.random() * 4 + 7.5;
        this.trail = [];
      }

      update() {
        this.trail.push({ x: this.x, y: this.y, color: this.color });
        if (this.trail.length > 7) this.trail.shift();
        this.y -= this.speed;
        return this.y <= this.targetY;
      }

      draw() {
        ctx.save();
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        for (let i = 1; i < this.trail.length; i++) {
          ctx.strokeStyle = this.trail[i].color;
          ctx.beginPath();
          ctx.moveTo(this.trail[i - 1].x, this.trail[i - 1].y);
          ctx.lineTo(this.trail[i].x, this.trail[i].y);
          ctx.stroke();
        }
        ctx.restore();
      }

      explode() {
        const count = Math.floor(Math.random() * 45) + 65;
        for (let i = 0; i < count; i++) {
          const color = this.palette[Math.floor(Math.random() * this.palette.length)];
          particles.push(new Particle(this.x, this.y, color));
        }
      }
    }

    class Particle {
      constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6.5 + 1.2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.gravity = 0.055;
        this.friction = 0.962;
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.008;
        this.radius = Math.random() * 2.6 + 1.4;
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
        ctx.shadowBlur = 12;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Interactive cracker blast on user tap / click anywhere
    const handleCanvasClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const palette = vibrantPalettes[Math.floor(Math.random() * vibrantPalettes.length)];
      for (let i = 0; i < 90; i++) {
        const color = palette[Math.floor(Math.random() * palette.length)];
        particles.push(new Particle(x, y, color));
      }
    };
    canvas.addEventListener('pointerdown', handleCanvasClick);

    // Continuous rich fireworks spawner (higher frequency & multi-rocket launches)
    let frame = 0;
    const render = () => {
      // Soft translucent clear for beautiful glowing particle trails
      ctx.fillStyle = 'rgba(5, 7, 15, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      frame++;
      // Launch new fireworks frequently
      if (frame % 16 === 0) {
        rockets.push(new Rocket());
        if (Math.random() > 0.45) {
          rockets.push(new Rocket()); // Concurrent launch for extra vibrancy!
        }
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
        background: 'radial-gradient(ellipse at 50% 20%, #080f20 0%, #04070e 65%, #020307 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflowY: 'auto',
        overflowX: 'hidden',
        color: '#f8fafc',
        padding: 'clamp(20px, 4vw, 36px) clamp(16px, 3vw, 24px)',
        opacity: fadingOut ? 0 : 1,
        transform: fadingOut ? 'scale(1.04)' : 'scale(1)',
        transition: 'opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: fadingOut ? 'none' : 'auto'
      }}
    >
      {/* Background Multi-Color Fireworks Canvas */}
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

      {/* Modern Fully Transparent Floating Content (Zero Card / Zero Box) */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '680px',
          width: '100%',
          margin: 'auto',
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          padding: '12px 6px',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}
      >
        {/* Festive Diya Header with Radiant Halo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '8px' }}>
          <span style={{ fontSize: 'clamp(2.4rem, 6vw, 3.2rem)', filter: 'drop-shadow(0 0 25px rgba(245, 158, 11, 0.9))' }}>🪔</span>
          <span style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)', filter: 'drop-shadow(0 0 25px rgba(59, 130, 246, 0.8))' }}>✨</span>
          <span style={{ fontSize: 'clamp(2.4rem, 6vw, 3.2rem)', filter: 'drop-shadow(0 0 25px rgba(245, 158, 11, 0.9))' }}>🪔</span>
        </div>

        {/* Happy Diwali Headline */}
        <h2
          style={{
            margin: '0 0 8px 0',
            fontSize: 'clamp(1.8rem, 6.5vw, 3rem)',
            fontWeight: '900',
            fontFamily: 'var(--font-title)',
            background: 'linear-gradient(135deg, #fffbeb 0%, #fde047 30%, #f59e0b 70%, #ff5500 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '2px',
            filter: 'drop-shadow(0 0 30px rgba(245, 158, 11, 0.5))'
          }}
        >
          HAPPY DIWALI!
        </h2>
        
        <p
          style={{
            color: '#e2e8f0',
            fontSize: 'clamp(0.92rem, 3vw, 1.1rem)',
            fontWeight: '600',
            margin: '0 auto 22px auto',
            maxWidth: '520px',
            lineHeight: '1.6',
            textShadow: '0 2px 14px rgba(0, 0, 0, 0.95), 0 0 20px rgba(0,0,0,0.8)'
          }}
        >
          May the divine light of Diwali illuminate your journey with boundless joy, prosperity, and intelligence!
        </p>

        {/* Brand Floating Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(37, 99, 235, 0.25)',
            border: '1px solid rgba(59, 130, 246, 0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            padding: '7px 22px',
            borderRadius: '9999px',
            color: '#93c5fd',
            fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
            fontWeight: '800',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            marginBottom: '16px',
            boxShadow: '0 0 25px rgba(37, 99, 235, 0.35)'
          }}
        >
          <Sparkles style={{ width: '16px', color: '#f59e0b' }} />
          <span>LAF AI • Look At Future</span>
        </div>

        {/* Grand Launch Headline */}
        <h1
          style={{
            margin: '0 0 12px 0',
            fontSize: 'clamp(1.7rem, 5.5vw, 2.7rem)',
            fontWeight: '900',
            color: '#ffffff',
            letterSpacing: '-0.5px',
            textShadow: '0 2px 20px rgba(0, 0, 0, 0.95), 0 0 30px rgba(255, 255, 255, 0.25)'
          }}
        >
          {isLaunched ? '🚀 GRAND LAUNCH IS LIVE!' : 'Grand Launch Starts In'}
        </h1>

        {/* Modern Floating Transparent Countdown Timer (Zero Box / Luminous Float) */}
        {!isLaunched && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'clamp(12px, 4vw, 28px)',
              margin: '20px 0 28px 0'
            }}
          >
            {/* Hours */}
            <div style={{ textAlign: 'center' }}>
              <div style={floatingDigitStyle}>{String(timeLeft.hours).padStart(2, '0')}</div>
              <div style={floatingLabelStyle}>HOURS</div>
            </div>

            <div style={floatingSeparatorStyle}>:</div>

            {/* Minutes */}
            <div style={{ textAlign: 'center' }}>
              <div style={floatingDigitStyle}>{String(timeLeft.minutes).padStart(2, '0')}</div>
              <div style={floatingLabelStyle}>MINUTES</div>
            </div>

            <div style={floatingSeparatorStyle}>:</div>

            {/* Seconds */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ ...floatingDigitStyle, color: '#fde047', textShadow: '0 0 35px rgba(245, 158, 11, 0.9), 0 0 12px rgba(253, 224, 71, 0.9)' }}>
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
              <div style={{ ...floatingLabelStyle, color: '#fde047' }}>SECONDS</div>
            </div>
          </div>
        )}

        {isLaunched && (
          <div style={{ padding: '18px', background: 'rgba(16, 185, 129, 0.18)', border: '1px solid #10b981', borderRadius: '24px', margin: '20px auto', maxWidth: '480px', backdropFilter: 'blur(10px)' }}>
            <h3 style={{ margin: 0, color: '#34d399', fontSize: 'clamp(1rem, 3.2vw, 1.25rem)', fontWeight: '800' }}>
              🎉 1:00 PM Achieved! Unlocking LAF AI Workspace...
            </h3>
            <p style={{ margin: '6px 0 0 0', color: '#e2e8f0', fontSize: '0.9rem' }}>
              Welcome to the future of intelligence. Enjoy the celebration!
            </p>
          </div>
        )}

        {/* Floating Transparent Pre-Registration */}
        {!registered ? (
          <div style={{ maxWidth: '440px', margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '14px' }}>
              <Lock style={{ width: '16px', color: '#f59e0b' }} />
              <span style={{ fontSize: 'clamp(0.85rem, 2.6vw, 0.98rem)', color: '#f1f5f9', fontWeight: '700', textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>
                Pre-Register to Unlock Access Sharply at 1:00 PM
              </span>
            </div>

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Name Input */}
              <div style={{ position: 'relative' }}>
                <User style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', width: '18px', color: '#60a5fa' }} />
                <input
                  type="text"
                  placeholder="Enter your name (e.g. Alex)"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  style={floatingInputStyle}
                  required
                />
              </div>

              {/* Email Input */}
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', width: '18px', color: '#94a3b8' }} />
                <input
                  type="email"
                  placeholder="Enter your email for 1:00 PM launch alert"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  style={floatingInputStyle}
                  required
                />
              </div>

              {regError && (
                <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: '600', textAlign: 'center', textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>
                  {regError}
                </div>
              )}

              {/* Modern Vibrant CTA Button */}
              <button
                type="submit"
                disabled={regLoading}
                style={{
                  width: '100%',
                  minHeight: '48px',
                  padding: '13px 24px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #60a5fa 100%)',
                  border: 'none',
                  borderRadius: '9999px',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: 'clamp(0.92rem, 2.7vw, 1rem)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 25px rgba(37, 99, 235, 0.55), 0 0 15px rgba(96, 165, 250, 0.4)',
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
              maxWidth: '460px',
              margin: '8px auto 0 auto',
              background: 'rgba(16, 185, 129, 0.16)',
              border: '1px solid rgba(16, 185, 129, 0.45)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              borderRadius: '9999px',
              padding: 'clamp(14px, 3vw, 18px) clamp(16px, 3.5vw, 24px)',
              textAlign: 'center',
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.25)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
              <CheckCircle2 style={{ width: '20px', color: '#10b981' }} />
              <h3 style={{ margin: 0, fontSize: 'clamp(0.95rem, 3vw, 1.1rem)', color: '#34d399', fontWeight: '800' }}>
                VIP Access Confirmed: @{nameInput || user?.username}
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: 'clamp(0.8rem, 2.5vw, 0.88rem)', color: '#e2e8f0' }}>
              Your access unlocks sharply at <strong>1:00 PM</strong>. Launch email notification queued for <strong>{emailInput || localStorage.getItem('laf_email') || 'your email'}</strong>.
            </p>
          </div>
        )}

        {/* Sleek Minimalist Footer */}
        <div style={{ marginTop: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: 'clamp(0.74rem, 2.2vw, 0.82rem)', color: '#94a3b8', textShadow: '0 2px 10px rgba(0,0,0,0.95)' }}>
          <ShieldCheck style={{ width: '14px', color: '#10b981' }} />
          <span>Engineered by K S Purushothaman • All Rights Reserved</span>
        </div>
      </div>
    </div>
  );
}

// Styling Constants (Luminous Float, Zero Box)
const floatingDigitStyle = {
  fontSize: 'clamp(2.8rem, 9vw, 4.8rem)',
  fontWeight: '900',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontVariantNumeric: 'tabular-nums',
  color: '#ffffff',
  lineHeight: '1',
  textShadow: '0 0 35px rgba(59, 130, 246, 0.85), 0 0 12px rgba(255, 255, 255, 0.95)'
};

const floatingLabelStyle = {
  fontSize: 'clamp(0.68rem, 2.2vw, 0.8rem)',
  fontWeight: '800',
  color: '#93c5fd',
  letterSpacing: '2px',
  marginTop: '8px',
  textShadow: '0 2px 8px rgba(0, 0, 0, 0.9)'
};

const floatingSeparatorStyle = {
  fontSize: 'clamp(2rem, 7vw, 3.5rem)',
  fontWeight: '900',
  color: '#f59e0b',
  lineHeight: '1',
  paddingBottom: '24px',
  textShadow: '0 0 25px rgba(245, 158, 11, 0.9)'
};

const floatingInputStyle = {
  width: '100%',
  minHeight: '48px',
  padding: '12px 20px 12px 48px',
  background: 'rgba(15, 23, 42, 0.65)',
  border: '1.5px solid rgba(255, 255, 255, 0.22)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  borderRadius: '9999px',
  color: '#ffffff',
  fontSize: 'clamp(0.9rem, 2.6vw, 0.96rem)',
  outline: 'none',
  boxSizing: 'border-box',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
};
