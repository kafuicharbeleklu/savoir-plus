/** Emblème hexagonal d'un badge, avec son pictogramme. */
import React from 'react';
import {
  Award,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Compass,
  Crown,
  Flame,
  Globe,
  HardDrive,
  Heart,
  Image as ImageIcon,
  Lock,
  Mail,
  MessageCircle,
  Network,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Wallet
} from 'lucide-react';
import type { SavoirBadgeItem } from '../personas';

function BadgeGlyph({ iconKey, size = 20 }: { iconKey: SavoirBadgeItem['iconKey']; size?: number }) {
  switch (iconKey) {
    case 'compass':
      return <Compass size={size} aria-hidden="true" />;
    case 'target':
      return <Target size={size} aria-hidden="true" />;
    case 'crown':
      return <Crown size={size} aria-hidden="true" />;
    case 'phishing':
      return <ShieldAlert size={size} aria-hidden="true" />;
    case 'network':
      return <Network size={size} aria-hidden="true" />;
    case 'lock':
      return <Lock size={size} aria-hidden="true" />;
    case 'shield':
      return <ShieldCheck size={size} aria-hidden="true" />;
    case 'path':
      return <Compass size={size} aria-hidden="true" />;
    case 'book':
      return <BookOpen size={size} aria-hidden="true" />;
    case 'sparkles':
      return <Sparkles size={size} aria-hidden="true" />;
    case 'message':
      return <MessageCircle size={size} aria-hidden="true" />;
    case 'check':
      return <CheckCircle2 size={size} aria-hidden="true" />;
    case 'users':
      return <Users size={size} aria-hidden="true" />;
    case 'heart':
      return <Heart size={size} aria-hidden="true" />;
    case 'flame':
      return <Flame size={size} aria-hidden="true" />;
    case 'mail':
      return <Mail size={size} aria-hidden="true" />;
    case 'wallet':
      return <Wallet size={size} aria-hidden="true" />;
    case 'drive':
      return <HardDrive size={size} aria-hidden="true" />;
    case 'calendar':
      return <CalendarCheck size={size} aria-hidden="true" />;
    case 'image':
      return <ImageIcon size={size} aria-hidden="true" />;
    case 'globe':
      return <Globe size={size} aria-hidden="true" />;
    case 'award':
    default:
      return <Award size={size} aria-hidden="true" />;
  }
}

export function HexBadgeEmblem({
  iconKey,
  earned,
  size = 'md'
}: {
  iconKey: SavoirBadgeItem['iconKey'];
  earned: boolean;
  size?: 'sm' | 'md';
}) {
  return (
    <div className={`htb-hex-badge ${earned ? 'is-earned' : 'is-locked'} is-${size}`}>
      <svg viewBox="0 0 64 72" className="htb-hex-svg" aria-hidden="true">
        <path
          d="M32 3 L59 18.5 L59 53.5 L32 69 L5 53.5 L5 18.5 Z"
          className="htb-hex-shape"
          strokeLinejoin="round"
        />
      </svg>
      <span className="htb-hex-icon">
        <BadgeGlyph iconKey={iconKey} size={size === 'sm' ? 16 : 20} />
      </span>
    </div>
  );
}
