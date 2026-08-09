import React, { useEffect } from 'react';
import { Trophy, Crown, Sparkles, RefreshCw, Home } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AvatarIcon } from '../utils/avatars';

export default function Leaderboard({ leaderboard, onPlayAgain, onHome }) {
  useEffect(() => {
    const duration = 3.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#8b5cf6', '#f59e0b', '#10b981', '#ec4899']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#8b5cf6', '#f59e0b', '#10b981', '#ec4899']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const top3 = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  const first = top3[0];
  const second = top3[1];
  const third = top3[2];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0.5rem' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', padding: '0.4rem 0.9rem', borderRadius: '2rem', background: 'rgba(245, 158, 11, 0.18)', border: '1px solid rgba(245, 158, 11, 0.35)', color: '#f59e0b', fontSize: '0.85rem', fontWeight: 700, gap: '0.4rem', alignItems: 'center', marginBottom: '0.75rem' }}>
          <Sparkles size={16} /> MATCH CHAMPIONS
        </div>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px' }}>
          Victory Podium
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Congratulations to the Zakoweb Winners!
        </p>
      </div>

      {/* Victory Podium Grid */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: '1rem',
        marginBottom: '2.5rem',
        padding: '0 0.5rem',
        minHeight: '270px'
      }}>
        {/* 2nd Place */}
        {second && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: '170px' }}>
            <AvatarIcon id={second.avatar} size={32} style={{ marginBottom: '0.4rem' }} />
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#cbd5e1', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
              {second.nickname}
            </div>
            <div style={{ fontWeight: 900, color: '#c084fc', fontSize: '1.05rem', marginBottom: '0.4rem' }}>
              {second.score} pts
            </div>
            <div style={{
              width: '100%',
              height: '130px',
              background: 'linear-gradient(180deg, rgba(203, 213, 225, 0.25) 0%, rgba(148, 163, 184, 0.08) 100%)',
              border: '2px solid rgba(203, 213, 225, 0.35)',
              borderTopLeftRadius: '1rem',
              borderTopRightRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              fontWeight: 900,
              color: '#94a3b8'
            }}>
              2nd 🥈
            </div>
          </div>
        )}

        {/* 1st Place */}
        {first && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: '200px' }}>
            <Crown size={36} color="#f59e0b" style={{ marginBottom: '0.2rem', filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.6))' }} />
            <AvatarIcon id={first.avatar} size={40} style={{ marginBottom: '0.4rem' }} />
            <div style={{ fontWeight: 900, fontSize: '1.15rem', color: '#f59e0b', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
              {first.nickname}
            </div>
            <div style={{ fontWeight: 900, color: '#fcd34d', fontSize: '1.25rem', marginBottom: '0.4rem' }}>
              {first.score} pts
            </div>
            <div style={{
              width: '100%',
              height: '170px',
              background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.35) 0%, rgba(217, 119, 6, 0.12) 100%)',
              border: '2px solid rgba(245, 158, 11, 0.55)',
              borderTopLeftRadius: '1.2rem',
              borderTopRightRadius: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.2rem',
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: '170px' }}>
            <AvatarIcon id={third.avatar} size={30} style={{ marginBottom: '0.4rem' }} />
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#d97706', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
              {third.nickname}
            </div>
            <div style={{ fontWeight: 900, color: '#f59e0b', fontSize: '1.05rem', marginBottom: '0.4rem' }}>
              {third.score} pts
            </div>
            <div style={{
              width: '100%',
              height: '105px',
              background: 'linear-gradient(180deg, rgba(180, 83, 9, 0.25) 0%, rgba(146, 64, 14, 0.08) 100%)',
              border: '2px solid rgba(180, 83, 9, 0.35)',
              borderTopLeftRadius: '1rem',
              borderTopRightRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 900,
              color: '#d97706'
            }}>
              3rd 🥉
            </div>
          </div>
        )}
      </div>

      {/* Remaining Players List */}
      {remaining.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.85rem', color: 'var(--text-muted)' }}>
            Full Standings
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {remaining.map((p, idx) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.9rem', borderRadius: '0.75rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#6b7280', width: '22px' }}>#{idx + 4}</span>
                  <AvatarIcon id={p.avatar} size={16} />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.nickname}</span>
                </div>
                <span style={{ fontWeight: 900, fontSize: '0.95rem', color: '#c084fc' }}>{p.score} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button onClick={onPlayAgain} className="btn-primary" style={{ padding: '0.85rem 1.75rem' }}>
          <RefreshCw size={18} /> Play Again
        </button>
        <button onClick={onHome} className="btn-secondary" style={{ padding: '0.85rem 1.75rem' }}>
          <Home size={18} /> Back to Home
        </button>
      </div>

    </div>
  );
}
