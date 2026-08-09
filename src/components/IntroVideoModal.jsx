import React, { useRef, useEffect } from 'react';

export default function IntroVideoModal({ onComplete }) {
  const videoRef = useRef(null);
  const videoSrc = "/Yellow%20and%20Black%20Simple%20intro%20Video.mp4";

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        onComplete();
      });
    }
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
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        playsInline
        muted
        onEnded={onComplete}
        onError={onComplete}
        style={{
          width: '100%',
          height: '100%',
          maxWidth: '100vw',
          maxHeight: '100dvh',
          objectFit: 'contain',
          objectPosition: 'center',
          background: '#000000',
          display: 'block'
        }}
      />
    </div>
  );
}
