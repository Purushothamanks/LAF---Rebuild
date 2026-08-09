import React, { useRef, useEffect, useState } from 'react';

export default function IntroVideoModal({ onComplete }) {
  const videoRef = useRef(null);
  const videoSrc = "/Yellow%20and%20Black%20Simple%20intro%20Video.mp4";
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);

    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        onComplete();
      });
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        playsInline
        muted
        onEnded={onComplete}
        onError={onComplete}
        className={isMobile ? 'laf-intro-video-mobile' : 'laf-intro-video-desktop'}
      />
    </div>
  );
}
