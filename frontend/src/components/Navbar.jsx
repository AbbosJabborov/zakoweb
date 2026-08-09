import React, { useState } from 'react';
import { Volume2, VolumeX, LogOut, Sparkles, Brain } from 'lucide-react';
import { sound } from '../utils/sound';

export default function Navbar({ roomCode, onLeave }) {
  const [soundMuted, setSoundMuted] = useState(sound.isMuted);

  const toggleSound = () => {
    const isMutedNow = sound.toggleMute();
    setSoundMuted(isMutedNow);
  };

  return (
    <nav style={{
      width: '100%',
      padding: '0.85rem 1.5rem',
      background: 'rgba(11, 15, 25, 0.75)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }} onClick={() => onLeave && onLeave()}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)'
        }}>
          <Brain size={22} color="#ffffff" />
        </div>
        <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>
          Zako<span style={{ color: '#c084fc' }}>web</span>
        </span>
      </div>

      {/* Middle: Active Room Tag */}
      {roomCode && (
        <div className="room-code-tag" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={16} color="#c084fc" />
          <span>{roomCode}</span>
        </div>
      )}

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {/* Sound Toggle */}
        <button
          onClick={toggleSound}
          className="btn-secondary"
          style={{ padding: '0.5rem 0.75rem', borderRadius: '0.75rem' }}
          title={soundMuted ? "Unmute Audio" : "Mute Audio"}
        >
          {soundMuted ? <VolumeX size={18} color="#f43f5e" /> : <Volume2 size={18} color="#10b981" />}
        </button>

        {/* Leave Room Button */}
        {roomCode && (
          <button
            onClick={onLeave}
            className="btn-secondary"
            style={{ padding: '0.5rem 0.85rem', borderRadius: '0.75rem', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185' }}
            title="Leave Room"
          >
            <LogOut size={16} /> <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Leave</span>
          </button>
        )}
      </div>
    </nav>
  );
}
