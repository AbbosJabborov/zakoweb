import React, { useState } from 'react';
import { Users, Play, QrCode, Copy, Check, Crown, Shield } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function PlayerLobby({ roomData, isHost, hostToken, onStartGame }) {
  const [showQR, setShowQR] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const players = roomData?.players || [];
  const roomCode = roomData?.code || '';
  const joinUrl = `${window.location.origin}?code=${roomCode}`;

  const copyShareLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
      {/* Header Banner */}
      <div className="glass-panel glass-panel-glow" style={{ padding: '2rem', textAlign: 'center', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, padding: '0.75rem 1.25rem', background: 'rgba(99, 102, 241, 0.15)', borderBottomLeftRadius: '1rem', borderLeft: '1px solid rgba(99, 102, 241, 0.3)', borderBottom: '1px solid rgba(99, 102, 241, 0.3)', fontSize: '0.85rem', color: '#a5b4fc', fontWeight: 600 }}>
          STATUS: IN LOBBY
        </div>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>
          Waiting for Players...
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '1.5rem' }}>
          Share the room code or QR code with your friends to join the match!
        </p>

        {/* Big Room Code Box */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '1rem',
          background: 'rgba(15, 23, 42, 0.8)',
          border: '2px dashed rgba(99, 102, 241, 0.5)',
          padding: '1rem 2rem',
          borderRadius: '1.25rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', letterSpacing: '1px' }}>JOIN CODE</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', letterSpacing: '4px', color: '#6366f1' }}>
              {roomCode}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <button onClick={copyShareLink} className="btn-secondary" style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}>
              {copiedLink ? <Check size={14} color="#10b981" /> : <Copy size={14} />} {copiedLink ? 'Copied' : 'Copy Link'}
            </button>
            <button onClick={() => setShowQR(true)} className="btn-secondary" style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}>
              <QrCode size={14} /> Show QR
            </button>
          </div>
        </div>

        {/* Host controls inside lobby */}
        {isHost && (
          <div>
            <button
              onClick={() => onStartGame(hostToken)}
              className="btn-success"
              style={{ fontSize: '1.1rem', padding: '1rem 2.5rem', gap: '0.6rem' }}
            >
              <Play size={20} fill="#ffffff" /> START GAME NOW ({players.length} Players Ready)
            </button>
          </div>
        )}
      </div>

      {/* Players grid */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} color="#818cf8" /> Joined Players ({players.length})
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Max: {roomData?.settings?.max_players || 50}
          </span>
        </div>

        {players.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No players have joined yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '1rem' }}>
            {players.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '1rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  position: 'relative'
                }}
              >
                <div style={{ fontSize: '1.8rem', lineHeight: 1 }}>{p.avatar}</div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.nickname}
                  </div>
                  {p.is_host_player && (
                    <div style={{ fontSize: '0.72rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                      <Crown size={12} /> Host
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 300
        }}>
          <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', background: '#0f172a' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>Scan to Join Room</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Point phone camera at code</p>
            <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '1rem', display: 'inline-block', marginBottom: '1.5rem' }}>
              <QRCodeSVG value={joinUrl} size={220} />
            </div>
            <div>
              <button onClick={() => setShowQR(false)} className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
