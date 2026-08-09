import React from 'react';
import {
  Brain, Zap, Flame, Rocket, Target, Crown, Sparkles,
  Ghost, Gamepad2, Wand2, Swords, Smile, Trophy, Star,
  Cat, Dog, Compass, Shield, Heart, Skull
} from 'lucide-react';

export const AVATAR_LIST = [
  { id: 'brain', label: 'Brainiac', icon: Brain, bg: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#ffffff' },
  { id: 'zap', label: 'Lightning', icon: Zap, bg: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#ffffff' },
  { id: 'flame', label: 'Fireball', icon: Flame, bg: 'linear-gradient(135deg, #ef4444, #f97316)', color: '#ffffff' },
  { id: 'rocket', label: 'Rocket', icon: Rocket, bg: 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: '#ffffff' },
  { id: 'target', label: 'Bullseye', icon: Target, bg: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff' },
  { id: 'crown', label: 'Royalty', icon: Crown, bg: 'linear-gradient(135deg, #eab308, #ca8a04)', color: '#ffffff' },
  { id: 'ghost', label: 'Phantom', icon: Ghost, bg: 'linear-gradient(135deg, #a855f7, #6b21a8)', color: '#ffffff' },
  { id: 'gamepad', label: 'Gamer', icon: Gamepad2, bg: 'linear-gradient(135deg, #ec4899, #be185d)', color: '#ffffff' },
  { id: 'wand', label: 'Wizard', icon: Wand2, bg: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: '#ffffff' },
  { id: 'swords', label: 'Warrior', icon: Swords, bg: 'linear-gradient(135deg, #64748b, #334155)', color: '#ffffff' },
  { id: 'sparkles', label: 'Starlight', icon: Sparkles, bg: 'linear-gradient(135deg, #f43f5e, #fb7185)', color: '#ffffff' },
  { id: 'star', label: 'Superstar', icon: Star, bg: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#ffffff' },
];

export function getAvatar(idOrKey) {
  const found = AVATAR_LIST.find(a => a.id === idOrKey || a.label === idOrKey);
  return found || AVATAR_LIST[0];
}

export function AvatarIcon({ id, size = 22, style = {} }) {
  const av = getAvatar(id);
  const IconComponent = av.icon;

  return (
    <div style={{
      width: `${size + 14}px`,
      height: `${size + 14}px`,
      borderRadius: '50%',
      background: av.bg,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
      flexShrink: 0,
      ...style
    }}>
      <IconComponent size={size} color={av.color} />
    </div>
  );
}
