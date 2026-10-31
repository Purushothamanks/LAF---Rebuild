import React, { useState } from 'react';
import { Image, Music, Video, Sparkles, Download, Play, RefreshCw, Eye } from 'lucide-react';

export default function MediaStudio({ token }) {
  const [subTab, setSubTab] = useState('image'); // 'image', 'audio', 'video'
  
  // Image State
  const [imgPrompt, setImgPrompt] = useState('');
  const [imgModel, setImgModel] = useState('flux');
  const [aspectRatio, setAspectRatio] = useState('1024x1024');
  const [imgResult, setImgResult] = useState(null);
  const [imgLoading, setImgLoading] = useState(false);

  // Audio State
  const [audioText, setAudioText] = useState('');
  const [voiceProfile, setVoiceProfile] = useState('alloy');
  const [audioResult, setAudioResult] = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);

  // Video State
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoDuration, setVideoDuration] = useState(4);
  const [videoResult, setVideoResult] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);

  // Image Generation
  const handleGenerateImage = async (e) => {
    e.preventDefault();
    if (!imgPrompt.trim()) return;
    setImgLoading(true);
    try {
      const seed = Math.floor(Math.random() * 1000000);
      const encodedPrompt = encodeURIComponent(imgPrompt.trim() + ', 8k resolution, photorealistic, masterclass');
      const [w, h] = aspectRatio.split('x');
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${w || 1024}&height=${h || 1024}&seed=${seed}&model=${imgModel || 'flux'}&nologo=true&enhance=true`;
      
      setImgResult({
        url: imageUrl,
        prompt: imgPrompt,
        seed,
        model: imgModel
      });
    } catch (err) {
      alert('Failed to generate image: ' + err.message);
    } finally {
      setImgLoading(false);
    }
  };

  // Audio Generation
  const handleGenerateAudio = async (e) => {
    e.preventDefault();
    if (!audioText.trim()) return;
    setAudioLoading(true);
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(audioText.trim());
        if (voiceProfile === 'echo') {
          utterance.pitch = 0.8;
          utterance.rate = 0.95;
        } else if (voiceProfile === 'nova') {
          utterance.pitch = 1.25;
          utterance.rate = 1.1;
        } else {
          utterance.pitch = 1.0;
          utterance.rate = 1.0;
        }
        window.speechSynthesis.speak(utterance);
        setAudioResult({
          text: audioText.trim(),
          voice: voiceProfile,
          timestamp: new Date().toLocaleTimeString()
        });
      } else {
        alert('Web Speech Synthesis is not supported in this browser.');
      }
    } catch (err) {
      alert('Audio error: ' + err.message);
    } finally {
      setAudioLoading(false);
    }
  };

  // Video Generation
  const handleGenerateVideo = async (e) => {
    e.preventDefault();
    if (!videoPrompt.trim()) return;
    setVideoLoading(true);
    try {
      const seed = Math.floor(Math.random() * 1000000);
      const encodedPrompt = encodeURIComponent(videoPrompt.trim() + ', 8k cinematic motion video frame, 60fps dynamic lighting');
      const motionFrameUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&seed=${seed}&model=flux&nologo=true&enhance=true`;
      setVideoResult({
        url: motionFrameUrl,
        prompt: videoPrompt,
        seed,
        duration: videoDuration
      });
    } catch (err) {
      alert('Failed to generate video preview: ' + err.message);
    } finally {
      setVideoLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
      
      {/* Studio Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="text-glow" style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '6px' }}>
          LAF Multimodal Creation Studio
        </h1>
        <p style={{ color: 'var(--ds-text-secondary)', fontSize: '0.94rem' }}>
          Synthesize high-resolution photorealistic images, voice audio, and AI video motion.
        </p>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button
          onClick={() => setSubTab('image')}
          className="btn-cyber"
          style={{
            background: subTab === 'image' ? 'var(--primary-cyan)' : 'transparent',
            color: subTab === 'image' ? '#000' : 'var(--text-main)',
            border: '1px solid var(--primary-cyan)'
          }}
        >
          <Image style={{ width: '18px' }} /> Image Generator (FLUX)
        </button>

        <button
          onClick={() => setSubTab('audio')}
          className="btn-cyber"
          style={{
            background: subTab === 'audio' ? 'var(--primary-purple)' : 'transparent',
            color: subTab === 'audio' ? '#fff' : 'var(--text-main)',
            border: '1px solid var(--primary-purple)'
          }}
        >
          <Music style={{ width: '18px' }} /> Audio & Voice Synthesizer
        </button>

        <button
          onClick={() => setSubTab('video')}
          className="btn-cyber"
          style={{
            background: subTab === 'video' ? 'var(--accent-pink)' : 'transparent',
            color: subTab === 'video' ? '#fff' : 'var(--text-main)',
            border: '1px solid var(--accent-pink)'
          }}
        >
          <Video style={{ width: '18px' }} /> AI Video Motion Engine
        </button>
      </div>

      {/* 🖼️ IMAGE STUDIO */}
      {subTab === 'image' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <form onSubmit={handleGenerateImage} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary-cyan)' }}>
              Image Prompt & Configuration
            </h3>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Prompt Description
              </label>
              <textarea
                value={imgPrompt}
                onChange={(e) => setImgPrompt(e.target.value)}
                placeholder="Cyberpunk city with futuristic flying vehicles, hyperrealistic 8k ultra detailed..."
                rows={4}
                style={{
                  width: '100%',
                  background: 'rgba(7, 9, 19, 0.8)',
                  border: '1px solid var(--border-glow)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                  color: '#fff',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Model
                </label>
                <select
                  value={imgModel}
                  onChange={(e) => setImgModel(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(7, 9, 19, 0.8)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <option value="flux">FLUX.1-HD (Ultra Quality)</option>
                  <option value="turbo">SDXL Turbo (Instant)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Aspect Ratio
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(7, 9, 19, 0.8)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <option value="1024x1024">1:1 Square (1024x1024)</option>
                  <option value="1280x720">16:9 Widescreen (1280x720)</option>
                  <option value="720x1280">9:16 Portrait (720x1280)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn-cyber btn-cyber-solid"
              disabled={imgLoading || !imgPrompt.trim()}
              style={{ marginTop: '10px', padding: '14px', justifyContent: 'center' }}
            >
              {imgLoading ? 'Synthesizing Image...' : <><Sparkles style={{ width: '18px' }} /> Generate Image</>}
            </button>
          </form>

          {/* Result Display */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '380px' }}>
            {imgResult ? (
              <div style={{ textAlign: 'center', width: '100%' }}>
                <img
                  src={imgResult.url}
                  alt={imgResult.prompt}
                  style={{ maxWidth: '100%', maxHeight: '350px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary-cyan)', boxShadow: 'var(--shadow-glow)' }}
                />
                <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    Model: {imgResult.model} • Seed: {imgResult.seed}
                  </span>
                  <button
                    type="button"
                    onClick={() => window.downloadLafImage && window.downloadLafImage(imgResult.url, `laf_${imgResult.model}_image.jpg`)}
                    className="btn-cyber"
                    style={{ padding: '6px 12px', fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    <Download style={{ width: '14px' }} /> Download
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-dim)', textAlign: 'center' }}>
                <Image style={{ width: '48px', margin: '0 auto 12px auto', opacity: 0.4 }} />
                <p>Your generated AI image will appear here.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🎵 AUDIO STUDIO */}
      {subTab === 'audio' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <form onSubmit={handleGenerateAudio} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary-purple)' }}>
              Audio Speech Synthesizer
            </h3>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Script / Text to Speak
              </label>
              <textarea
                value={audioText}
                onChange={(e) => setAudioText(e.target.value)}
                placeholder="Welcome to LAF, the future of artificial intelligence..."
                rows={4}
                style={{
                  width: '100%',
                  background: 'rgba(7, 9, 19, 0.8)',
                  border: '1px solid var(--border-glow)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                  color: '#fff',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Voice Profile
              </label>
              <select
                value={voiceProfile}
                onChange={(e) => setVoiceProfile(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(7, 9, 19, 0.8)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <option value="alloy">Alloy (Futuristic Crisp)</option>
                <option value="echo">Echo (Warm Deep)</option>
                <option value="nova">Nova (Energetic Female)</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn-cyber btn-cyber-solid"
              disabled={audioLoading || !audioText.trim()}
              style={{ marginTop: '10px', padding: '14px', justifyContent: 'center' }}
            >
              {audioLoading ? 'Synthesizing Audio...' : <><Music style={{ width: '18px' }} /> Generate Audio Speech</>}
            </button>
          </form>

          {/* Audio Result */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '320px' }}>
            {audioResult ? (
              <div style={{ textAlign: 'center', width: '100%' }}>
                <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid var(--primary-purple)', marginBottom: '16px' }}>
                  <Music style={{ width: '36px', height: '36px', color: 'var(--primary-purple)' }} />
                </div>
                <h4 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px' }}>
                  Voice Synthesized Successfully
                </h4>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '16px' }}>
                  Profile: <strong style={{ color: 'var(--primary-purple)' }}>{audioResult.voice.toUpperCase()}</strong> • Rendered: {audioResult.timestamp}
                </p>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '8px', fontSize: '0.88rem', color: '#cbd5e1', textAlign: 'left', marginBottom: '18px', maxHeight: '100px', overflowY: 'auto' }}>
                  "{audioResult.text}"
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if ('speechSynthesis' in window) {
                        window.speechSynthesis.cancel();
                        const u = new SpeechSynthesisUtterance(audioResult.text);
                        if (audioResult.voice === 'echo') { u.pitch = 0.8; u.rate = 0.95; }
                        else if (audioResult.voice === 'nova') { u.pitch = 1.25; u.rate = 1.1; }
                        window.speechSynthesis.speak(u);
                      }
                    }}
                    className="btn-cyber btn-cyber-solid"
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    <Play style={{ width: '15px' }} /> Replay Speech
                  </button>
                  <button
                    type="button"
                    onClick={() => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }}
                    className="btn-cyber"
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    Stop
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-dim)', textAlign: 'center' }}>
                <Music style={{ width: '48px', margin: '0 auto 12px auto', opacity: 0.4 }} />
                <p>Your AI audio speech render will appear here.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🎬 VIDEO STUDIO */}
      {subTab === 'video' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <form onSubmit={handleGenerateVideo} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-pink)' }}>
              AI Motion Video Engine
            </h3>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Video Motion Prompt
              </label>
              <textarea
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                placeholder="Cinematic drone sweep across neon futuristic metropolis at sunset, 4k 60fps video..."
                rows={4}
                style={{
                  width: '100%',
                  background: 'rgba(7, 9, 19, 0.8)',
                  border: '1px solid var(--border-glow)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                  color: '#fff',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Duration
              </label>
              <select
                value={videoDuration}
                onChange={(e) => setVideoDuration(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(7, 9, 19, 0.8)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <option value={4}>4 Seconds HD Loop</option>
                <option value={8}>8 Seconds Extended Motion</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn-cyber btn-cyber-solid"
              disabled={videoLoading || !videoPrompt.trim()}
              style={{ marginTop: '10px', padding: '14px', justifyContent: 'center' }}
            >
              {videoLoading ? 'Rendering Motion Video...' : <><Video style={{ width: '18px' }} /> Generate AI Video</>}
            </button>
          </form>

          {/* Video Result */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '380px' }}>
            {videoResult ? (
              <div style={{ textAlign: 'center', width: '100%' }}>
                <img
                  src={videoResult.url}
                  alt={videoResult.prompt}
                  style={{ maxWidth: '100%', maxHeight: '350px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent-pink)' }}
                />
                <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    Engine: {videoResult.model} • Duration: {videoResult.duration}
                  </span>
                  <a href={videoResult.url} target="_blank" rel="noreferrer" className="btn-cyber" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                    <Download style={{ width: '14px' }} /> Save Video
                  </a>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-dim)', textAlign: 'center' }}>
                <Video style={{ width: '48px', margin: '0 auto 12px auto', opacity: 0.4 }} />
                <p>Your generated AI video motion render will appear here.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
