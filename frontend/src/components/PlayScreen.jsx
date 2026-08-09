import React, { useState, useEffect, useRef } from 'react';
import { Clock, Send, CheckCircle2, Trophy, MessageSquare, AlertCircle } from 'lucide-react';
import { sound } from '../utils/sound';
import { AvatarIcon } from '../utils/avatars';

export default function PlayScreen({
  activeQuestion,
  answersFeed,
  leaderboard,
  cooldownRemaining,
  lastNotification,
  onSubmitAnswer,
  currentPlayer,
  roomSettings
}) {
  const [inputText, setInputText] = useState('');
  const [timeLeft, setTimeLeft] = useState(activeQuestion?.duration || 30);
  const feedEndRef = useRef(null);

  const duration = activeQuestion?.duration || 30;
  const isLocked = activeQuestion?.is_locked || false;

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [answersFeed]);

  useEffect(() => {
    if (isLocked || !activeQuestion) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        if (prev <= 6 && prev > 1) {
          sound.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeQuestion, isLocked]);

  useEffect(() => {
    if (activeQuestion?.time_remaining !== undefined) {
      setTimeLeft(Math.ceil(activeQuestion.time_remaining));
    }
  }, [activeQuestion]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || cooldownRemaining > 0 || isLocked) return;
    onSubmitAnswer(inputText.trim());
    setInputText('');
  };

  const timerPercent = Math.max(0, Math.min(100, (timeLeft / duration) * 100));
  const timerColor = timerPercent > 50 ? '#10b981' : timerPercent > 20 ? '#f59e0b' : '#f43f5e';

  const hasCurrentPlayerSolved = answersFeed.some(
    a => a.player_nickname === currentPlayer?.nickname && a.is_correct
  );

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Toast Notification Banner */}
      {lastNotification && (
        <div style={{
          padding: '0.75rem 1.25rem',
          borderRadius: '1rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(6, 182, 212, 0.25))',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          color: '#ffffff',
          fontWeight: 700,
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.2)'
        }}>
          ✨ {lastNotification}
        </div>
      )}

      {/* Main Responsive Grid */}
      <div className="play-screen-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem' }}>
        
        {/* Left Column: Question Card & Answer Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Question Card */}
          <div className="glass-panel glass-panel-glow" style={{ padding: '1.75rem', position: 'relative' }}>
            
            {/* Question Top Header: Index & Timer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', border: '1px solid rgba(139, 92, 246, 0.35)', padding: '0.3rem 0.75rem', borderRadius: '2rem', fontSize: '0.82rem', fontWeight: 800 }}>
                  QUESTION {(activeQuestion?.index || 0) + 1} / {activeQuestion?.total_questions || 10}
                </span>
                {activeQuestion?.category && (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>
                    • {activeQuestion.category}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: timerColor, fontWeight: 900, fontSize: '1.2rem', fontFamily: 'var(--font-mono)' }}>
                <Clock size={20} />
                <span>{timeLeft}s</span>
              </div>
            </div>

            {/* Timer Bar */}
            <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden', marginBottom: '1.25rem' }}>
              <div style={{ width: `${timerPercent}%`, height: '100%', background: timerColor, transition: 'width 1s linear' }} />
            </div>

            {/* Question Text */}
            <h2 style={{ fontSize: '1.45rem', fontWeight: 700, lineHeight: 1.35, marginBottom: '1.25rem', color: '#ffffff' }}>
              {activeQuestion?.text || 'Loading question...'}
            </h2>

            {/* Media Image if present */}
            {activeQuestion?.media_url && (
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <img src={activeQuestion.media_url} alt="Question Media" style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '0.85rem', border: '1px solid rgba(255, 255, 255, 0.1)' }} />
              </div>
            )}

            {/* Locked Answer Reveal Box */}
            {isLocked && (
              <div className="animate-pop-in" style={{ marginTop: '1.25rem', padding: '1.15rem', borderRadius: '1rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#34d399', letterSpacing: '1px', marginBottom: '0.4rem' }}>
                  ACCEPTABLE ANSWERS:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.65rem' }}>
                  {(activeQuestion?.accepted_answers || []).map((ans, idx) => (
                    <span key={idx} style={{ background: '#10b981', color: '#ffffff', fontWeight: 800, padding: '0.35rem 0.8rem', borderRadius: '0.6rem', fontSize: '0.9rem' }}>
                      {ans}
                    </span>
                  ))}
                </div>
                {activeQuestion?.explanation && (
                  <div style={{ fontSize: '0.88rem', color: '#d1d5db', lineHeight: 1.45, borderTop: '1px dashed rgba(16, 185, 129, 0.3)', paddingTop: '0.65rem' }}>
                    <strong>Lore / Explanation:</strong> {activeQuestion.explanation}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Answer Input Box */}
          <div className="glass-panel" style={{ padding: '1.1rem' }}>
            {hasCurrentPlayerSolved ? (
              <div style={{ padding: '0.85rem', borderRadius: '0.85rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', textAlign: 'center', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.92rem' }}>
                <CheckCircle2 size={18} /> You solved this question! Watch the live feed.
              </div>
            ) : isLocked ? (
              <div style={{ padding: '0.85rem', borderRadius: '0.85rem', background: 'rgba(255, 255, 255, 0.04)', color: 'var(--text-muted)', textAlign: 'center', fontWeight: 600, fontSize: '0.9rem' }}>
                Question is locked. Host moving to next round...
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder={cooldownRemaining > 0 ? `Wait ${cooldownRemaining.toFixed(1)}s cooldown...` : "Type your answer here..."}
                  className="input-custom"
                  style={{ paddingRight: '4rem', fontSize: '1.05rem', background: cooldownRemaining > 0 ? 'rgba(0, 0, 0, 0.4)' : undefined }}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={cooldownRemaining > 0 || isLocked}
                  autoFocus
                />
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ position: 'absolute', right: '0.4rem', top: '50%', transform: 'translateY(-50%)', padding: '0.55rem 0.95rem' }}
                  disabled={!inputText.trim() || cooldownRemaining > 0 || isLocked}
                >
                  <Send size={18} />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Skribbl-Style Live Answer Feed */}
        <div className="glass-panel chat-feed-container" style={{ display: 'flex', flexDirection: 'column', height: '500px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.65rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MessageSquare size={18} color="#c084fc" /> Live Answer Feed
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.06)', padding: '0.2rem 0.5rem', borderRadius: '0.4rem', fontWeight: 600 }}>
              {answersFeed.length} guesses
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.2rem' }}>
            {answersFeed.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 1rem', fontSize: '0.88rem' }}>
                No submissions yet. Be the first to guess!
              </div>
            ) : (
              answersFeed.map((item, idx) => (
                <div key={item.id || idx} className={`feed-item ${item.is_correct ? 'correct' : ''}`}>
                  <AvatarIcon id={item.player_avatar} size={16} />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: item.is_correct ? '#34d399' : 'var(--text-main)' }}>
                        {item.player_nickname}
                      </span>
                      {item.is_correct && (
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.2)', padding: '0.15rem 0.5rem', borderRadius: '0.4rem' }}>
                          +{item.points} pts
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.92rem', wordBreak: 'break-word', marginTop: '0.15rem', color: item.is_correct ? '#ffffff' : '#d1d5db' }}>
                      {item.is_correct ? `★ Solved: "${item.text}"` : item.text}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={feedEndRef} />
          </div>
        </div>

      </div>

      {/* Mini Scoreboard Bar */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Trophy size={16} color="#f59e0b" /> CURRENT SCOREBOARD
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {leaderboard.slice(0, 8).map((p, rank) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.04)', padding: '0.45rem 0.75rem', borderRadius: '0.75rem', whiteSpace: 'nowrap', border: rank === 0 ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)' }}>
              <span style={{ fontWeight: 800, fontSize: '0.8rem', color: rank === 0 ? '#f59e0b' : '#9ca3af' }}>#{rank + 1}</span>
              <AvatarIcon id={p.avatar} size={14} />
              <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{p.nickname}</span>
              <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#c084fc', marginLeft: '0.15rem' }}>{p.score}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
