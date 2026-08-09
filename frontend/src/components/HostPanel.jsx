import React, { useState } from 'react';
import { Lock, ArrowRight, Check, X, ShieldAlert, SlidersHorizontal } from 'lucide-react';
import { AvatarIcon } from '../utils/avatars';

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
      bottom: '1rem',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 150,
      width: 'calc(100% - 1.5rem)',
      maxWidth: '820px'
    }}>
      <div className="glass-panel glass-panel-glow" style={{
        padding: '0.75rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(11, 15, 25, 0.95)',
        border: '1px solid rgba(139, 92, 246, 0.45)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        {/* Host Label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ padding: '0.3rem 0.6rem', borderRadius: '0.5rem', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', fontSize: '0.78rem', fontWeight: 800 }}>
            HOST CONTROLS
          </div>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Q{(activeQuestion?.index || 0) + 1} / {activeQuestion?.total_questions || 10}
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowOverrideDrawer(!showOverrideDrawer)}
            className="btn-secondary"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
          >
            <SlidersHorizontal size={15} color="#c084fc" /> Overrides ({answersFeed.length})
          </button>

          {!isLocked ? (
            <button
              onClick={() => onLockQuestion(hostToken)}
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            >
              <Lock size={15} /> Lock Round
            </button>
          ) : (
            <button
              onClick={() => onNextQuestion(hostToken)}
              className="btn-success"
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            >
              Next <ArrowRight size={15} />
            </button>
          )}

          <button
            onClick={() => onEndGame(hostToken)}
            style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', padding: '0.45rem 0.75rem', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
          >
            End
          </button>
        </div>
      </div>

      {/* Manual Grade Override Drawer */}
      {showOverrideDrawer && (
        <div className="glass-panel animate-pop-in" style={{
          marginTop: '0.5rem',
          padding: '1rem',
          maxHeight: '300px',
          overflowY: 'auto',
          background: 'rgba(11, 15, 25, 0.98)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.4rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f59e0b' }}>
              <ShieldAlert size={16} /> Host Manual Grade Overrides
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Click ✓ Accept or ✗ Reject
            </span>
          </div>

          {answersFeed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No submissions for this round yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {answersFeed.map((ans) => (
                <div key={ans.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '0.75rem',
                  background: ans.is_correct ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  border: ans.is_correct ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                    <AvatarIcon id={ans.player_avatar} size={14} />
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{ans.player_nickname}:</span>
                    <span style={{ color: '#ffffff', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{ans.text}"</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: ans.is_correct ? '#34d399' : '#9ca3af', marginRight: '0.3rem' }}>
                      {ans.is_correct ? `+${ans.points} pts` : '0 pts'}
                    </span>

                    <button
                      onClick={() => onOverrideGrade(hostToken, ans.id, true)}
                      style={{
                        background: ans.is_correct ? '#10b981' : 'rgba(16, 185, 129, 0.2)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '0.4rem',
                        padding: '0.3rem 0.55rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      <Check size={13} /> Accept
                    </button>

                    <button
                      onClick={() => onOverrideGrade(hostToken, ans.id, false)}
                      style={{
                        background: !ans.is_correct ? '#f43f5e' : 'rgba(244, 63, 94, 0.2)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '0.4rem',
                        padding: '0.3rem 0.55rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      <X size={13} /> Reject
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
