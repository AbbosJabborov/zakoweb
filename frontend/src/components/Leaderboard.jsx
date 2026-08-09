import React, { useEffect } from 'react';
import { Trophy, Crown, Sparkles, RefreshCw, Home, Medal } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Leaderboard({ leaderboard, onPlayAgain, onHome }) {
  useEffect(() => {
    // Fire festive victory confetti
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#6366f1', '#f59e0b', '#10b981', '#ec4899']
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#6366f1', '#f59e0b', '#10b981', '#ec4899']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const top3 = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  // Podium order: 2nd place left, 1st place center, 3rd place right
  const first = top3[0];
  const second = top3[1];
  const third = top3[2];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', padding: '0.5rem 1rem', borderRadius: '2rem', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b', fontSize: '0.85rem', fontWeight: 700, gap: '0.4rem', alignItems: 'center', marginBottom: '1rem' }}>
          <Sparkles size={16} /> MATCH COMPLETED
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: '0.5rem' }}>
          Game Over Podium
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          Congratulations to the Zakoweb Champions!
        </p>
      </div>

      {/* Victory Podium */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: '1.25rem',
        marginBottom: '2.5rem',
        padding: '0 1rem',
        minHeight: '260px'
      }}>
        {/* 2nd Place */}
        {second && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: '180px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.2rem' }}>{second.avatar}</div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#cbd5e1', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
              {second.nickname}
            </div>
            <div style={{ fontWeight: 900, color: '#a5b4fc', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              {second.score} pts
            </div>
            <div style={{
              width: '100%',
              height: '140px',
              background: 'linear-gradient(180deg, rgba(203, 213, 225, 0.25) 0%, rgba(148, 163, 184, 0.1) 100%)',
              border: '2px solid rgba(203, 213, 225, 0.4)',
              borderTopLeftRadius: '1rem',
              borderTopRightRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: 900,
              color: '#94a3b8'
            }}>
              2nd 🥈
            </div>
          </div>
        )}

        {/* 1st Place */}
        {first && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: '210px' }}>
            <Crown size={36} color="#f59e0b" style={{ marginBottom: '0.2rem', filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.6))' }} />
            <div style={{ fontSize: '3rem', marginBottom: '0.2rem' }}>{first.avatar}</div>
            <div style={{ fontWeight: 900, fontSize: '1.2rem', color: '#f59e0b', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
              {first.nickname}
            </div>
            <div style={{ fontWeight: 900, color: '#fcd34d', fontSize: '1.3rem', marginBottom: '0.5rem' }}>
              {first.score} pts
            </div>
            <div style={{
              width: '100%',
              height: '180px',
              background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.35) 0%, rgba(217, 119, 6, 0.15) 100%)',
              border: '2px solid rgba(245, 158, 11, 0.6)',
              borderTopLeftRadius: '1.2rem',
              borderTopRightRadius: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              fontWeight: 900,
              color: '#f59e0b',
              boxShadow: '0 0 30px rgba(245, 158, 11, 0.2)'
            }}>
              1st 🏆
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {third && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: '180px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.2rem' }}>{third.avatar}</div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#b45309', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
              {third.nickname}
            </div>
            <div style={{ fontWeight: 900, color: '#f59e0b', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              {third.score} pts
            </div>
            <div style={{
              width: '100%',
              height: '110px',
              background: 'linear-gradient(180deg, rgba(180, 83, 9, 0.25) 0%, rgba(146, 64, 14, 0.1) 100%)',
              border: '2px solid rgba(180, 83, 9, 0.4)',
              borderTopLeftRadius: '1rem',
              borderTopRightRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              fontWeight: 900,
              color: '#d97706'
            }}>
              3rd 🥉
            </div>
          </div>
        )}
      </div>

      {/* Remaining Players Standings */}
      {remaining.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-muted)' }}>
            Full Scoreboard Standings
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {remaining.map((p, idx) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#6b7280', width: '24px' }}>#{idx + 4}</span>
                  <span style={{ fontSize: '1.4rem' }}>{p.avatar}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.nickname}</span>
                </div>
                <span style={{ fontWeight: 900, fontSize: '1rem', color: '#818cf8' }}>{p.score} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        <button onClick={onPlayAgain} className="btn-primary" style={{ padding: '0.85rem 2rem' }}>
          <RefreshCw size={18} /> Play Again
        </button>
        <button onClick={onHome} className="btn-secondary" style={{ padding: '0.85rem 2rem' }}>
          <Home size={18} /> Back to Home
        </button>
      </div>

    </div>
  );
}
