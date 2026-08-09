import React, { useState } from 'react';
import { Sparkles, Gamepad2, ArrowRight, PlusCircle, Users } from 'lucide-react';
import { AVATAR_LIST, AvatarIcon } from '../utils/avatars';

export default function JoinCard({ onJoin, onCreateOpen }) {
  const [nickname, setNickname] = useState('');
  const [code, setCode] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState('brain');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    if (!nickname.trim() || !code.trim()) return;

    setErrorMsg('');
    setIsLoading(true);
    try {
      await onJoin({
        nickname: nickname.trim(),
        code: code.trim().toUpperCase(),
        avatar: selectedAvatarId
      });
    } catch (err) {
      setErrorMsg(err.message || 'Room not found or game already in progress');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel glass-panel-glow animate-pop-in" style={{ width: '100%', maxWidth: '460px', padding: '2.25rem' }}>
      
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <div style={{ display: 'inline-flex', padding: '0.4rem 0.9rem', borderRadius: '2rem', background: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.4)', color: '#c084fc', fontSize: '0.85rem', fontWeight: 700, gap: '0.4rem', alignItems: 'center', marginBottom: '0.75rem' }}>
          <Sparkles size={16} /> Zakovat Party Arena
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
          Zakoweb Live
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.4rem' }}>
          Join your party room with code & guess answers live!
        </p>
      </div>

      {errorMsg && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '0.85rem', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.35)', color: '#fb7185', fontSize: '0.88rem', marginBottom: '1.25rem', textAlign: 'center', fontWeight: 600 }}>
          {errorMsg}
        </div>
      )}

      {/* Join Form */}
      <form onSubmit={handleJoinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Avatar Icon Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
            SELECT YOUR AVATAR
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem' }}>
            {AVATAR_LIST.map((av) => (
              <button
                key={av.id}
                type="button"
                onClick={() => setSelectedAvatarId(av.id)}
                style={{
                  padding: '0.35rem',
                  borderRadius: '0.85rem',
                  background: selectedAvatarId === av.id ? 'rgba(139, 92, 246, 0.35)' : 'rgba(255, 255, 255, 0.04)',
                  border: selectedAvatarId === av.id ? '2px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
                title={av.label}
              >
                <AvatarIcon id={av.id} size={20} />
              </button>
            ))}
          </div>
        </div>

        {/* Nickname Input */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            YOUR NICKNAME
          </label>
          <input
            type="text"
            placeholder="e.g. BrainMaster"
            className="input-custom"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={18}
            required
          />
        </div>

        {/* Room Code Input */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            ROOM JOIN CODE
          </label>
          <input
            type="text"
            placeholder="e.g. X7K9A2"
            className="input-custom"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 700, fontSize: '1.2rem', textAlign: 'center' }}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            required
          />
        </div>

        {/* Join Button */}
        <button
          type="submit"
          className="btn-primary"
          style={{ width: '100%', padding: '1rem', marginTop: '0.25rem' }}
          disabled={isLoading || !nickname.trim() || code.length < 4}
        >
          {isLoading ? 'Joining Room...' : 'Enter Party Room'} <ArrowRight size={20} />
        </button>
      </form>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: 'var(--text-dim)' }}>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
        <span style={{ padding: '0 0.85rem', fontSize: '0.8rem', fontWeight: 700 }}>OR</span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
      </div>

      {/* Host Room Launcher */}
      <button
        onClick={onCreateOpen}
        className="btn-secondary"
        style={{ width: '100%', padding: '0.9rem', justifyContent: 'center' }}
      >
        <PlusCircle size={18} color="#c084fc" /> Host a New Room
      </button>
    </div>
  );
}
