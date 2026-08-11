import React from 'react';
import { X, Flame, Trophy, Percent, Gamepad2 } from 'lucide-react';

export default function StatsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const statsRaw = localStorage.getItem('zakoweb_wordle_stats');
  const stats = statsRaw ? JSON.parse(statsRaw) : { played: 0, wins: 0, currentStreak: 0, maxStreak: 0 };
  const winRate = stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 200,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div className="wordle-card animate-pop-in" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '1.75rem',
        background: '#121213',
        border: '1.5px solid #3a3a3c',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: '#818384',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <h3 style={{
          textAlign: 'center',
          fontSize: '1.25rem',
          fontWeight: 800,
          letterSpacing: '1px',
          color: '#ffffff',
          marginBottom: '1.5rem',
          textTransform: 'uppercase'
        }}>
          STATISTIKA
        </h3>

        {/* Stats 4 Column Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.75rem',
          marginBottom: '1.75rem',
          textAlign: 'center'
        }}>
          <div className="stat-box">
            <div className="stat-val">{stats.played}</div>
            <div className="stat-lbl">O'ynaldi</div>
          </div>

          <div className="stat-box">
            <div className="stat-val">{winRate}%</div>
            <div className="stat-lbl">G'alaba</div>
          </div>

          <div className="stat-box">
            <div className="stat-val" style={{ color: '#f59e0b' }}>
              {stats.currentStreak} <Flame size={14} style={{ display: 'inline' }} />
            </div>
            <div className="stat-lbl">Streak</div>
          </div>

          <div className="stat-box">
            <div className="stat-val" style={{ color: '#c9b458' }}>
              {stats.maxStreak}
            </div>
            <div className="stat-lbl">Max Streak</div>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button onClick={onClose} className="wordle-btn-submit" style={{ width: '100%' }}>
            YOPISH
          </button>
        </div>
      </div>
    </div>
  );
}
