import React, { useState } from 'react';
import { Brain, Volume2, VolumeX, Wifi, WifiOff, LogOut, Copy, Check } from 'lucide-react';
import { sound } from '../utils/sound';

export default function Navbar({ roomCode, isConnected, onLeave }) {
  const [isMuted, setIsMuted] = useState(sound.muted);
  const [copied, setCopied] = useState(false);

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const copyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem 1.5rem',
      background: 'rgba(11, 15, 25, 0.8)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Brand logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={onLeave}>
        <div style={{
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '0.75rem',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
        }}>
          <Brain size={24} color="#ffffff" />
        </div>
        <span style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.5px', background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          zakoweb
        </span>
      </div>

      {/* Center: Room Code Badge */}
      {roomCode && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="room-code-tag" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>CODE:</span>
            <span style={{ color: '#ffffff' }}>{roomCode}</span>
          </div>
          <button
            onClick={copyCode}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#9ca3af',
              borderRadius: '0.6rem',
              padding: '0.45rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Copy room code"
          >
            {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
          </button>
        </div>
      )}

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Connection status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.85rem',
          padding: '0.35rem 0.75rem',
          borderRadius: '2rem',
          background: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
          color: isConnected ? '#34d399' : '#fb7185',
          border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`
        }}>
          {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span style={{ fontWeight: 600 }}>{isConnected ? 'LIVE' : 'Offline'}</span>
        </div>

        {/* Audio Mute toggle */}
        <button
          onClick={toggleSound}
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: isMuted ? '#f43f5e' : '#f3f4f6',
            borderRadius: '0.75rem',
            padding: '0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title={isMuted ? 'Unmute audio' : 'Mute audio'}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        {/* Exit button */}
        {roomCode && (
          <button
            onClick={onLeave}
            style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#f43f5e',
              borderRadius: '0.75rem',
              padding: '0.5rem 0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.9rem',
              fontWeight: 600
            }}
          >
            <LogOut size={16} />
            <span>Leave</span>
          </button>
        )}
      </div>
    </nav>
  );
}
