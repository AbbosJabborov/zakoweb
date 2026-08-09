import React, { useState, useEffect } from 'react';
import { X, Settings, Sparkles, Clock, MessageSquare, ShieldCheck, Zap } from 'lucide-react';

export default function CreateRoomModal({ isOpen, onClose, onCreate }) {
  const [questionCount, setQuestionCount] = useState(10);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [answersPerPlayer, setAnswersPerPlayer] = useState('multiple');
  const [answeringCooldown, setAnsweringCooldown] = useState(3);
  const [answerVisibility, setAnswerVisibility] = useState('as_submitted');
  const [speedBonusEnabled, setSpeedBonusEnabled] = useState(true);
  const [hostParticipates, setHostParticipates] = useState(true);
  const [selectedPackId, setSelectedPackId] = useState('');

  const [questionPacks, setQuestionPacks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/question-packs/')
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
    setIsLoading(true);
    try {
      await onCreate({
        settings: {
          question_count: Number(questionCount),
          time_per_question: Number(timePerQuestion),
          answers_per_player: answersPerPlayer,
          answering_cooldown: Number(answeringCooldown),
          answer_visibility: answerVisibility,
          speed_bonus_enabled: speedBonusEnabled,
          host_participates: hostParticipates
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
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '1rem'
    }}>
      <div className="glass-panel glass-panel-glow animate-slide-up" style={{ width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
        >
          <X size={22} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: '0.75rem', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
            <Settings size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Create Zakoweb Room</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Configure host rules and game pacing</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Question Pack selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              SELECT QUESTION PACK
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Question count */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                QUESTIONS PER GAME
              </label>
              <select className="input-custom" value={questionCount} onChange={(e) => setQuestionCount(e.target.value)}>
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions (Standard)</option>
                <option value={15}>15 Questions</option>
                <option value={20}>20 Questions</option>
              </select>
            </div>

            {/* Time per question */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                TIME PER QUESTION
              </label>
              <select className="input-custom" value={timePerQuestion} onChange={(e) => setTimePerQuestion(e.target.value)}>
                <option value={20}>20 Seconds</option>
                <option value={30}>30 Seconds (Default)</option>
                <option value={45}>45 Seconds</option>
                <option value={60}>60 Seconds</option>
              </select>
            </div>
          </div>

          {/* Answer Mode */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              ANSWER MODE
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setAnswersPerPlayer('multiple')}
                style={{
                  padding: '0.85rem',
                  borderRadius: '0.85rem',
                  background: answersPerPlayer === 'multiple' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  border: answersPerPlayer === 'multiple' ? '2px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MessageSquare size={16} color="#818cf8" /> Skribbl Chat Feed
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Keep guessing live into the chat until solved
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAnswersPerPlayer('single')}
                style={{
                  padding: '0.85rem',
                  borderRadius: '0.85rem',
                  background: answersPerPlayer === 'single' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  border: answersPerPlayer === 'single' ? '2px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={16} color="#34d399" /> Classic Zakovat
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  1 submission per question per player
                </div>
              </button>
            </div>
          </div>

          {/* Cooldown & Visibility */}
          {answersPerPlayer === 'multiple' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  CHAT COOLDOWN
                </label>
                <select className="input-custom" value={answeringCooldown} onChange={(e) => setAnsweringCooldown(e.target.value)}>
                  <option value={2}>2 Seconds</option>
                  <option value={3}>3 Seconds (Recommended)</option>
                  <option value={5}>5 Seconds</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  FEED VISIBILITY
                </label>
                <select className="input-custom" value={answerVisibility} onChange={(e) => setAnswerVisibility(e.target.value)}>
                  <option value="as_submitted">Show guesses in feed</option>
                  <option value="hidden_until_reveal">Hide until reveal</option>
                </select>
              </div>
            </div>
          )}

          {/* Toggles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '0.85rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={16} color="#f59e0b" /> Speed Bonus Points
              </span>
              <input
                type="checkbox"
                checked={speedBonusEnabled}
                onChange={(e) => setSpeedBonusEnabled(e.target.checked)}
                style={{ width: '1.2rem', height: '1.2rem', accentColor: '#6366f1' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} color="#a5b4fc" /> Host Also Plays as Player
              </span>
              <input
                type="checkbox"
                checked={hostParticipates}
                onChange={(e) => setHostParticipates(e.target.checked)}
                style={{ width: '1.2rem', height: '1.2rem', accentColor: '#6366f1' }}
              />
            </label>
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading} style={{ marginTop: '0.5rem' }}>
            {isLoading ? 'Creating Room...' : 'Launch Room & Get Code'}
          </button>
        </form>
      </div>
    </div>
  );
}
