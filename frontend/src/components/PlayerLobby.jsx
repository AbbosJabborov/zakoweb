import React, { useState } from 'react';
import { Users, Play, QrCode, Copy, Check, Crown, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { AvatarIcon } from '../utils/avatars';

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
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '0.5rem' }}>
      
      {/* Header Banner */}
      <div className="glass-panel glass-panel-glow" style={{ padding: '2rem 1.5rem', textAlign: 'center', marginBottom: '1.5rem', position: 'relative' }}>
        
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.9rem', borderRadius: '2rem', background: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.35)', color: '#c084fc', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          <Sparkles size={16} /> WAITING LOBBY
        </div>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.4rem', color: '#ffffff' }}>
          Waiting for Party...
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          Share the room join code or QR code with your friends!
        </p>

        {/* Room Code Card */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '1.25rem',
          background: 'rgba(11, 15, 25, 0.85)',
          border: '2px dashed rgba(139, 92, 246, 0.5)',
          padding: '1rem 1.75rem',
          borderRadius: '1.25rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px' }}>JOIN CODE</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', letterSpacing: '4px', color: '#c084fc' }}>
              {roomCode}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={copyShareLink} className="btn-secondary" style={{ padding: '0.55rem 0.9rem', fontSize: '0.85rem' }}>
              {copiedLink ? <Check size={16} color="#10b981" /> : <Copy size={16} />} {copiedLink ? 'Copied' : 'Copy Link'}
            </button>
            <button onClick={() => setShowQR(true)} className="btn-secondary" style={{ padding: '0.55rem 0.9rem', fontSize: '0.85rem' }}>
              <QrCode size={16} /> QR Code
            </button>
          </div>
        </div>

        {/* Host Launch Action */}
        {isHost && (
          <div>
            <button
              onClick={() => onStartGame(hostToken)}
              className="btn-success"
              style={{ fontSize: '1.15rem', padding: '1rem 2.5rem', gap: '0.6rem', width: '100%', maxWidth: '380px' }}
            >
              <Play size={22} fill="#ffffff" /> START GAME ({players.length} Ready)
            </button>
          </div>
        )}
      </div>

      {/* Players List Grid */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} color="#c084fc" /> Joined Players ({players.length})
          </h2>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Max: {roomData?.settings?.max_players || 50}
          </span>
        </div>

        {players.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No players have joined yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.85rem' }}>
            {players.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 0.9rem',
                  borderRadius: '1rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  position: 'relative'
                }}
              >
                <AvatarIcon id={p.avatar} size={20} />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.nickname}
                  </div>
                  {p.is_host_player && (
                    <div style={{ fontSize: '0.72rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700 }}>
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
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 300,
          padding: '1rem'
        }}>
          <div className="glass-panel animate-pop-in" style={{ padding: '2.25rem', textAlign: 'center', background: '#0b0f19', maxWidth: '340px', width: '100%' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.3rem' }}>Scan to Join</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>Point phone camera at QR code</p>
            <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '1.25rem', display: 'inline-block', marginBottom: '1.5rem' }}>
              <QRCodeSVG value={joinUrl} size={200} />
            </div>
            <div>
              <button onClick={() => setShowQR(false)} className="btn-secondary" style={{ width: '100%' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
