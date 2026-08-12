import React, { useState, useEffect } from 'react';
import { Users, Radio, RefreshCw, ArrowRight, Globe } from 'lucide-react';

export default function PublicRoomsList({ apiBase, onSelectRoomCode, lang = 'en' }) {
  const [publicRooms, setPublicRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);

  const fetchPublicRooms = async () => {
    try {
      const res = await fetch(`${apiBase}/api/public-rooms/`);
      if (res.ok) {
        const data = await res.json();
        setPublicRooms(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Failed to fetch public rooms:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualRefresh = () => {
    setIsSpinning(true);
    fetchPublicRooms().finally(() => {
      setTimeout(() => setIsSpinning(false), 600);
    });
  };

  useEffect(() => {
    fetchPublicRooms();
    const interval = setInterval(fetchPublicRooms, 4000);
    return () => clearInterval(interval);
  }, [apiBase]);

  return (
    <div className="wordle-card animate-pop-in" style={{ width: '100%', maxWidth: '440px', padding: '1.75rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
            <Globe size={20} color="#6aaa64" /> Live Public Rooms
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.2rem', margin: 0 }}>
            Join ongoing public games & party lobbies
          </p>
        </div>

        <button
          onClick={handleManualRefresh}
          className="btn-secondary"
          style={{ padding: '0.4rem 0.6rem', borderRadius: '0.5rem', cursor: 'pointer' }}
          title="Refresh rooms"
        >
          <RefreshCw
            size={14}
            style={{
              transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isSpinning ? 'rotate(360deg)' : 'rotate(0deg)'
            }}
          />
        </button>
      </div>

      {/* Rooms List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', minHeight: '260px' }}>
        {publicRooms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '1rem', border: '1px dashed #3a3a3c' }}>
            <Radio size={32} color="#565758" style={{ marginBottom: '0.65rem' }} />
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#d7dadc' }}>No Public Lobbies Active</div>
            <div style={{ fontSize: '0.8rem', marginTop: '0.35rem' }}>
              Create a new room to start playing with others!
            </div>
          </div>
        ) : (
          publicRooms.map((room) => {
            const isLobby = room.status === 'lobby';
            const statusLabel = isLobby
              ? 'Waiting in Lobby'
              : `Question ${(room.current_question_index || 0) + 1} / ${room.question_count || 10}`;

            return (
              <div
                key={room.id || room.code}
                style={{
                  background: '#121213',
                  border: isLobby ? '1px solid #538d4e' : '1px solid #3a3a3c',
                  borderRadius: '0.85rem',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.85rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1.2rem', color: '#ffffff', letterSpacing: '1px' }}>
                      {room.code}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '0.4rem',
                        background: isLobby ? 'rgba(106, 170, 100, 0.2)' : 'rgba(201, 180, 88, 0.2)',
                        color: isLobby ? '#6aaa64' : '#c9b458',
                        border: isLobby ? '1px solid rgba(106, 170, 100, 0.4)' : '1px solid rgba(201, 180, 88, 0.4)'
                      }}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#d7dadc', fontWeight: 600 }}>
                      <Users size={13} color="#c084fc" /> {room.player_count} Players
                    </span>
                    <span>⏱️ {room.time_per_question}s / Q</span>
                  </div>
                </div>

                <button
                  onClick={() => onSelectRoomCode(room.code)}
                  className="wordle-btn-submit"
                  style={{ padding: '0.55rem 0.85rem', fontSize: '0.85rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                >
                  Join <ArrowRight size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
