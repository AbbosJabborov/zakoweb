import React, { useState } from 'react';
import { Volume2, VolumeX, LogOut, Brain, Calendar, Gamepad2, BarChart2, Globe } from 'lucide-react';
import { sound } from '../utils/sound';
import { translations } from '../utils/i18n';

export default function Navbar({ roomCode, onLeave, activeTab, setActiveTab, onOpenStats, lang, setLang }) {
  const [soundMuted, setSoundMuted] = useState(sound.isMuted);

  const t = translations[lang] || translations.uz;

  const toggleSound = () => {
    const isMutedNow = sound.toggleMute();
    setSoundMuted(isMutedNow);
  };

  const toggleLang = () => {
    const nextLang = lang === 'uz' ? 'en' : 'uz';
    setLang(nextLang);
    localStorage.setItem('zakoweb_lang', nextLang);
  };

  return (
    <nav style={{
      width: '100%',
      padding: '0.65rem 1.25rem',
      background: '#121213',
      borderBottom: '1px solid #3a3a3c',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      flexWrap: 'wrap',
      gap: '0.5rem'
    }}>
      {/* Left: Brand Logo & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }} onClick={() => onLeave && onLeave()}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          background: '#538d4e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Brain size={18} color="#ffffff" />
        </div>
        <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
          ZAKO<span style={{ color: '#6aaa64' }}>WEB</span>
        </span>
      </div>

      {/* Middle Mode Tabs */}
      {!roomCode && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: '#272729',
          padding: '0.2rem',
          borderRadius: '0.5rem',
          border: '1px solid #3a3a3c'
        }}>
          <button
            onClick={() => setActiveTab('daily')}
            style={{
              padding: '0.35rem 0.8rem',
              borderRadius: '0.35rem',
              border: 'none',
              background: activeTab === 'daily' ? '#538d4e' : 'transparent',
              color: activeTab === 'daily' ? '#ffffff' : '#818384',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Calendar size={14} /> {t.dailyTab}
          </button>

          <button
            onClick={() => setActiveTab('party')}
            style={{
              padding: '0.35rem 0.8rem',
              borderRadius: '0.35rem',
              border: 'none',
              background: activeTab === 'party' ? '#538d4e' : 'transparent',
              color: activeTab === 'party' ? '#ffffff' : '#818384',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Gamepad2 size={14} /> {t.multiplayerTab}
          </button>
        </div>
      )}

      {/* Middle: Active Room Tag */}
      {roomCode && (
        <div className="room-code-tag" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span>{roomCode}</span>
        </div>
      )}

      {/* Right Controls: Language, Stats, Mute */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        {/* Language Switcher */}
        <button
          onClick={toggleLang}
          className="wordle-icon-btn"
          title="Switch Language (UZ / EN)"
        >
          <Globe size={15} style={{ marginRight: '0.2rem' }} />
          <span>{lang === 'uz' ? 'UZ' : 'EN'}</span>
        </button>

        {/* Stats Modal Trigger */}
        <button
          onClick={onOpenStats}
          className="wordle-icon-btn"
          title={t.stats}
        >
          <BarChart2 size={16} />
        </button>

        {/* Sound Toggle */}
        <button
          onClick={toggleSound}
          className="wordle-icon-btn"
          title={soundMuted ? "Unmute Audio" : "Mute Audio"}
        >
          {soundMuted ? <VolumeX size={16} color="#f43f5e" /> : <Volume2 size={16} color="#6aaa64" />}
        </button>

        {/* Leave Room Button */}
        {roomCode && (
          <button
            onClick={onLeave}
            className="btn-secondary"
            style={{ padding: '0.35rem 0.65rem', borderRadius: '0.4rem', fontSize: '0.78rem', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185' }}
            title={t.leave}
          >
            <LogOut size={14} /> {t.leave}
          </button>
        )}
      </div>
    </nav>
  );
}
