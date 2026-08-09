import React, { useState } from 'react';
import { Play, PlusCircle, Sparkles, User, KeyRound } from 'lucide-react';

const AVATARS = ['🧠', '⚡', '🦉', '🦊', '🦁', '🚀', '🎯', '👑', '💎', '🔥', '🎓', '🎨'];

export default function JoinCard({ onJoin, onCreateOpen }) {
  const [nickname, setNickname] = useState('');
  const [code, setCode] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🧠');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setErrorMsg('Please enter your nickname');
      return;
    }
    if (!code.trim()) {
      setErrorMsg('Please enter a 6-character room code');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await onJoin({ nickname: nickname.trim(), code: code.trim().toUpperCase(), avatar: selectedAvatar });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to join room');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel glass-panel-glow" style={{ padding: '2.5rem', maxWidth: '480px', width: '100%', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', padding: '0.5rem 1rem', borderRadius: '2rem', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#a5b4fc', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', gap: '0.4rem', alignItems: 'center' }}>
          <Sparkles size={14} /> Live Zakovat Party Room
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>
          Join Game
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Type your nickname & room code to play live with your friends!
        </p>
      </div>

      {errorMsg && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', fontSize: '0.9rem', marginBottom: '1.25rem', textAlign: 'center' }}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleJoinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Nickname input */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            YOUR NICKNAME
          </label>
          <div style={{ position: 'relative' }}>
            <User size={18} color="#6b7280" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="e.g. ZakovatKing"
              className="input-custom"
              style={{ paddingLeft: '2.75rem' }}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
            />
          </div>
        </div>

        {/* Avatar Picker */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            CHOOSE AVATAR
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem' }}>
            {AVATARS.map((av) => (
              <button
                key={av}
                type="button"
                onClick={() => setSelectedAvatar(av)}
                style={{
                  fontSize: '1.4rem',
                  padding: '0.5rem',
                  borderRadius: '0.75rem',
                  background: selectedAvatar === av ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.04)',
                  border: selectedAvatar === av ? '2px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        {/* Room Code input */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            ROOM CODE
          </label>
          <div style={{ position: 'relative' }}>
            <KeyRound size={18} color="#6b7280" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="e.g. X7K9A2"
              className="input-custom"
              style={{ paddingLeft: '2.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={8}
            />
          </div>
        </div>

        {/* Join button */}
        <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ marginTop: '0.5rem', width: '100%' }}>
          <Play size={18} /> {isSubmitting ? 'Joining Room...' : 'Enter Party Room'}
        </button>

        <div style={{ position: 'relative', textAlign: 'center', margin: '0.75rem 0' }}>
          <hr style={{ borderColor: 'rgba(255, 255, 255, 0.08)', margin: 0 }} />
          <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#0f172a', padding: '0 0.75rem', fontSize: '0.8rem', color: '#6b7280', fontWeight: 600 }}>OR</span>
        </div>

        {/* Create room button */}
        <button type="button" className="btn-secondary" onClick={onCreateOpen} style={{ width: '100%' }}>
          <PlusCircle size={18} color="#a5b4fc" /> Host a New Room
        </button>
      </form>
    </div>
  );
}
