import React, { useState } from 'react';
import { Volume2, VolumeX, LogOut, Sparkles, Brain, Calendar, Gamepad2, BarChart2 } from 'lucide-react';
import { sound } from '../utils/sound';

export default function Navbar({ roomCode, onLeave, activeTab, setActiveTab, onOpenStats }) {
  const [soundMuted, setSoundMuted] = useState(sound.isMuted);

  const toggleSound = () => {
    const isMutedNow = sound.toggleMute();
    setSoundMuted(isMutedNow);
  };

  return (
    <nav style={{
      width: '100%',
      padding: '0.75rem 1.25rem',
      background: 'rgba(11, 15, 25, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      flexWrap: 'wrap',
      gap: '0.5rem'
    }}>
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }} onClick={() => onLeave && onLeave()}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #538d4e 0%, #8b5cf6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(83, 141, 78, 0.4)'
        }}>
          <Brain size={20} color="#ffffff" />
        </div>
        <span style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>
          Zako<span style={{ color: '#6aaa64' }}>web</span>
        </span>
      </div>

      {/* Middle Mode Selector Tabs */}
      {!roomCode && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: '#121213',
          padding: '0.25rem',
          borderRadius: '0.75rem',
          border: '1px solid #3a3a3c'
        }}>
          <button
            onClick={() => setActiveTab('party')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '0.55rem',
              border: 'none',
              background: activeTab === 'party' ? '#538d4e' : 'transparent',
              color: activeTab === 'party' ? '#ffffff' : '#818384',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s ease'
            }}
          >
            <Gamepad2 size={15} /> Multi-Player
          </button>

          <button
            onClick={() => setActiveTab('daily')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '0.55rem',
              border: 'none',
              background: activeTab === 'daily' ? '#538d4e' : 'transparent',
              color: activeTab === 'daily' ? '#ffffff' : '#818384',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s ease'
            }}
          >
            <Calendar size={15} /> Kun Savoli
          </button>
        </div>
      )}

      {/* Middle: Active Room Tag */}
      {roomCode && (
        <div className="room-code-tag" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={16} color="#c084fc" />
          <span>{roomCode}</span>
        </div>
      )}

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Stats Modal Trigger */}
        <button
          onClick={onOpenStats}
          className="wordle-icon-btn"
          title="Daily Stats"
        >
          <BarChart2 size={18} />
        </button>

        {/* Sound Toggle */}
        <button
          onClick={toggleSound}
          className="wordle-icon-btn"
          title={soundMuted ? "Unmute Audio" : "Mute Audio"}
        >
          {soundMuted ? <VolumeX size={18} color="#f43f5e" /> : <Volume2 size={18} color="#6aaa64" />}
        </button>

        {/* Leave Room Button */}
        {roomCode && (
          <button
            onClick={onLeave}
            className="btn-secondary"
            style={{ padding: '0.45rem 0.75rem', borderRadius: '0.65rem', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185' }}
            title="Leave Room"
          >
            <LogOut size={15} /> <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Leave</span>
          </button>
        )}
      </div>
    </nav>
  );
}
