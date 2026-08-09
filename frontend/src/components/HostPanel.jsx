import React, { useState } from 'react';
import { Lock, ArrowRight, Check, X, ShieldAlert, Award, SlidersHorizontal } from 'lucide-react';

export default function HostPanel({
  isHost,
  hostToken,
  activeQuestion,
  answersFeed,
  onLockQuestion,
  onNextQuestion,
  onEndGame,
  onOverrideGrade
}) {
  const [showOverrideDrawer, setShowOverrideDrawer] = useState(false);

  if (!isHost || !hostToken) return null;

  const isLocked = activeQuestion?.is_locked;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.25rem',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 150,
      width: 'calc(100% - 2rem)',
      maxWidth: '820px'
    }}>
      <div className="glass-panel glass-panel-glow" style={{
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(15, 23, 42, 0.92)',
        border: '1px solid rgba(99, 102, 241, 0.4)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)'
      }}>
        {/* Host Info Label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ padding: '0.35rem 0.65rem', borderRadius: '0.5rem', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.5px' }}>
            HOST CONTROLS
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Q{(activeQuestion?.index || 0) + 1} / {activeQuestion?.total_questions || 10}
          </span>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Grade Override Drawer Button */}
          <button
            onClick={() => setShowOverrideDrawer(!showOverrideDrawer)}
            className="btn-secondary"
            style={{ padding: '0.55rem 0.95rem', fontSize: '0.85rem' }}
          >
            <SlidersHorizontal size={16} color="#818cf8" /> Override Grades ({answersFeed.length})
          </button>

          {/* Lock / Next Buttons */}
          {!isLocked ? (
            <button
              onClick={() => onLockQuestion(hostToken)}
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', padding: '0.55rem 1.25rem', fontSize: '0.9rem' }}
            >
              <Lock size={16} /> Lock & Reveal
            </button>
          ) : (
            <button
              onClick={() => onNextQuestion(hostToken)}
              className="btn-success"
              style={{ padding: '0.55rem 1.25rem', fontSize: '0.9rem' }}
            >
              Next Question <ArrowRight size={16} />
            </button>
          )}

          {/* End game early button */}
          <button
            onClick={() => onEndGame(hostToken)}
            style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f43f5e', padding: '0.55rem 0.85rem', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
          >
            End Game
          </button>
        </div>
      </div>

      {/* Manual Grade Override Drawer */}
      {showOverrideDrawer && (
        <div className="glass-panel animate-slide-up" style={{
          marginTop: '0.75rem',
          padding: '1.25rem',
          maxHeight: '320px',
          overflowY: 'auto',
          background: 'rgba(11, 15, 25, 0.96)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', pb: '0.5rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f59e0b' }}>
              <ShieldAlert size={18} /> Host Manual Grade Overrides
            </h4>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Click ✓ Accept or ✗ Reject to change points instantly
            </span>
          </div>

          {answersFeed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              No submissions for this round yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {answersFeed.map((ans) => (
                <div key={ans.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 1rem',
                  borderRadius: '0.75rem',
                  background: ans.is_correct ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  border: ans.is_correct ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span>{ans.player_avatar}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{ans.player_nickname}:</span>
                    <span style={{ color: '#ffffff', fontSize: '0.95rem' }}>"{ans.text}"</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: ans.is_correct ? '#34d399' : '#9ca3af', marginRight: '0.4rem' }}>
                      {ans.is_correct ? `+${ans.points} pts` : '0 pts'}
                    </span>

                    <button
                      onClick={() => onOverrideGrade(hostToken, ans.id, true)}
                      style={{
                        background: ans.is_correct ? '#10b981' : 'rgba(16, 185, 129, 0.2)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '0.5rem',
                        padding: '0.35rem 0.65rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        fontSize: '0.78rem',
                        fontWeight: 700
                      }}
                    >
                      <Check size={14} /> Accept
                    </button>

                    <button
                      onClick={() => onOverrideGrade(hostToken, ans.id, false)}
                      style={{
                        background: !ans.is_correct ? '#f43f5e' : 'rgba(244, 63, 94, 0.2)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '0.5rem',
                        padding: '0.35rem 0.65rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        fontSize: '0.78rem',
                        fontWeight: 700
                      }}
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
