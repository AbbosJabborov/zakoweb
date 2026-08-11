import React, { useState, useEffect } from 'react';
import { X, Sparkles, User, HelpCircle } from 'lucide-react';
import { AVATAR_LIST, AvatarIcon } from '../utils/avatars';

export default function CreateRoomModal({ isOpen, onClose, onCreate }) {
  const [hostNickname, setHostNickname] = useState('HostLeader');
  const [selectedAvatarId, setSelectedAvatarId] = useState('crown');
  const [selectedPackId, setSelectedPackId] = useState('');
  const [questionPacks, setQuestionPacks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const isDev = typeof window !== 'undefined' && (window.location.host.includes('5173') || window.location.host.includes('localhost'));
      const apiBase = isDev ? '' : 'https://api-zakoweb.claive.uz';
      fetch(`${apiBase}/api/question-packs/`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setQuestionPacks(data);
            if (data.length > 0) setSelectedPackId(data[0].id);
          }
        })
        .catch(err => console.error('Failed to load packs:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hostNickname.trim()) return;

    setIsLoading(true);
    try {
      await onCreate({
        hostNickname: hostNickname.trim(),
        hostAvatar: selectedAvatarId,
        settings: {
          question_count: 10,
          time_per_question: 60,
          answers_per_player: 'multiple',
          answering_cooldown: 0,
          answer_visibility: 'as_submitted',
          speed_bonus_enabled: true,
          host_participates: true
        },
        pack_id: selectedPackId ? Number(selectedPackId) : null
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '1rem'
    }}>
      <div className="glass-panel glass-panel-glow animate-pop-in" style={{ width: '100%', maxWidth: '480px', padding: '2rem', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
        >
          <X size={24} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ padding: '0.7rem', borderRadius: '1rem', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: '#ffffff' }}>
            <Sparkles size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Create Zakoweb Room</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Match rules can be edited live inside the lobby!</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Host Profile */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#c084fc', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={18} /> HOST PROFILE
            </h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                YOUR HOST NICKNAME
              </label>
              <input
                type="text"
                className="input-custom"
                value={hostNickname}
                onChange={(e) => setHostNickname(e.target.value)}
                maxLength={20}
                placeholder="e.g. MasterQuizzer"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                CHOOSE ICON AVATAR
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.6rem' }}>
                {AVATAR_LIST.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setSelectedAvatarId(av.id)}
                    style={{
                      padding: '0.4rem',
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
          </div>

          {/* Question Pack selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              <HelpCircle size={14} style={{ display: 'inline', marginRight: '4px' }} /> QUESTION PACK
            </label>
            <select
              className="input-custom"
              value={selectedPackId}
              onChange={(e) => setSelectedPackId(e.target.value)}
            >
              {questionPacks.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.language.toUpperCase()} • {p.question_count} questions)
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading} style={{ marginTop: '0.5rem' }}>
            {isLoading ? 'Launching Room...' : 'Launch Room & Open Lobby'}
          </button>
        </form>
      </div>
    </div>
  );
}
