import React, { useRef, useEffect, useState } from 'react';

export default function IntroVideoModal({ onComplete }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const videoSrc = "/Yellow%20and%20Black%20Simple%20intro%20Video.mp4";
  const audioSrc = "/intro-audio.mp3";

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);

    const startPlayback = async () => {
      if (videoRef.current) {
        try {
          await videoRef.current.play();
        } catch (e) {
          onComplete();
          return;
        }
      }

      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => {
          console.warn('Autoplay audio notification:', err);
        });
      }
    };

    startPlayback();

    // Enable audio on user interaction if autoplay was restricted by browser policy
    const handleUserInteraction = () => {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      }
    };

    window.addEventListener('click', handleUserInteraction, { once: true });
    window.addEventListener('touchstart', handleUserInteraction, { once: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  const handleEnded = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    onComplete();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      minHeight: '100dvh',
      zIndex: 999999,
      background: '#000000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      touchAction: 'none'
    }}>
      <style>{`
        .laf-intro-video-desktop {
          width: 100vw;
          height: 100vh;
          object-fit: cover;
          object-position: center;
          display: block;
        }
        .laf-intro-video-mobile {
          width: 100vw;
          height: 100dvh;
          max-width: 100vw;
          max-height: 100dvh;
          object-fit: contain;
          object-position: center;
          display: block;
        }
      `}</style>

      {/* Synchronized Logo Sound FX */}
      <audio ref={audioRef} src={audioSrc} preload="auto" />

      {/* Intro Video Element */}
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        playsInline
        muted
        onEnded={handleEnded}
        onError={handleEnded}
        className={isMobile ? 'laf-intro-video-mobile' : 'laf-intro-video-desktop'}
      />
    </div>
  );
}
