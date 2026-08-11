import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, PlusCircle } from 'lucide-react';
import { AVATAR_LIST, AvatarIcon } from '../utils/avatars';
import { translations } from '../utils/i18n';

export default function JoinCard({ onJoin, onCreateOpen, initialCode = '', lang = 'uz' }) {
  const [nickname, setNickname] = useState('');
  const [code, setCode] = useState(initialCode);
  const [selectedAvatarId, setSelectedAvatarId] = useState('brain');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const nicknameInputRef = useRef(null);

  const t = translations[lang] || translations.uz;

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode.toUpperCase());
      if (nicknameInputRef.current && !nickname.trim()) {
        nicknameInputRef.current.focus();
      }
    }
  }, [initialCode]);

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nickname.trim()) {
      setErrorMsg('⚠️ Please enter your nickname before joining!');
      if (nicknameInputRef.current) nicknameInputRef.current.focus();
      return;
    }

    if (!code.trim() || code.trim().length < 4) {
      setErrorMsg('⚠️ Please enter a valid room code!');
      return;
    }

    setIsLoading(true);
    try {
      await onJoin({
        nickname: nickname.trim(),
        code: code.trim().toUpperCase(),
        avatar: selectedAvatarId
      });
    } catch (err) {
      setErrorMsg(err.message || 'Room not found');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="wordle-card animate-pop-in" style={{ width: '100%', maxWidth: '440px', padding: '1.75rem' }}>
      
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
          {t.joinRoom}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.35rem' }}>
          Zakoweb Multiplayer Party Mode
        </p>
      </div>

      {errorMsg && (
        <div style={{ padding: '0.65rem 0.85rem', borderRadius: '0.4rem', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.35)', color: '#fb7185', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center', fontWeight: 600 }}>
          {errorMsg}
        </div>
      )}

      {/* Join Form */}
      <form onSubmit={handleJoinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
        
        {/* Avatar Icon Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>
            {t.avatar.toUpperCase()}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.4rem' }}>
            {AVATAR_LIST.map((av) => (
              <button
                key={av.id}
                type="button"
                onClick={() => setSelectedAvatarId(av.id)}
                style={{
                  padding: '0.35rem',
                  borderRadius: '0.4rem',
                  background: selectedAvatarId === av.id ? '#3a3a3c' : '#121213',
                  border: selectedAvatarId === av.id ? '2px solid #538d4e' : '1px solid #3a3a3c',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
                title={av.label}
              >
                <AvatarIcon id={av.id} size={18} />
              </button>
            ))}
          </div>
        </div>

        {/* Nickname Input */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            {t.nickname.toUpperCase()}
          </label>
          <input
            ref={nicknameInputRef}
            type="text"
            placeholder="e.g. BrainMaster"
            className="wordle-input"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
            maxLength={18}
          />
        </div>

        {/* Room Code Input */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            {t.roomCode.toUpperCase()}
          </label>
          <input
            type="text"
            placeholder="e.g. X7K9A2"
            className="wordle-input"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 700, fontSize: '1.15rem', textAlign: 'center' }}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              if (errorMsg) setErrorMsg('');
            }}
            maxLength={6}
          />
        </div>

        {/* Join Button */}
        <button
          type="submit"
          className="wordle-btn-submit"
          style={{ width: '100%', padding: '0.85rem' }}
          disabled={isLoading}
        >
          {isLoading ? '...' : t.enter} <ArrowRight size={18} />
        </button>
      </form>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0', color: '#565758' }}>
        <div style={{ flex: 1, height: '1px', background: '#3a3a3c' }} />
        <span style={{ padding: '0 0.75rem', fontSize: '0.75rem', fontWeight: 700 }}>OR</span>
        <div style={{ flex: 1, height: '1px', background: '#3a3a3c' }} />
      </div>

      {/* Host Room Launcher */}
      <button
        onClick={onCreateOpen}
        className="btn-secondary"
        style={{ width: '100%', padding: '0.85rem', justifyContent: 'center' }}
      >
        <PlusCircle size={16} color="#6aaa64" /> {t.createRoom}
      </button>
    </div>
  );
}
