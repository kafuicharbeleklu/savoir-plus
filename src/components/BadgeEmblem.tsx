/** Emblème hexagonal d'un badge, avec son pictogramme. */
import React from 'react';
import {
  Award,
  BarChart3,
  Camera,
  Eye,
  HelpCircle,
  Mountain,
  Repeat2,
  Share2,
  TrendingUp,
  Zap,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Compass,
  Crown,
  Flame,
  Cpu,
  Globe,
  HandHelping,
  HardDrive,
  Heart,
  Image as ImageIcon,
  Lock,
  Mail,
  Medal,
  MessageCircle,
  Mic,
  Network,
  PenLine,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Wallet
} from 'lucide-react';
import type { SavoirBadgeItem } from '../personas';

export function BadgeGlyph({ iconKey, size = 20 }: { iconKey: SavoirBadgeItem['iconKey']; size?: number }) {
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
    case 'star':
      return <Star size={size} aria-hidden="true" />;
    case 'trophy':
      return <Trophy size={size} aria-hidden="true" />;
    case 'medal':
      return <Medal size={size} aria-hidden="true" />;
    case 'pen':
      return <PenLine size={size} aria-hidden="true" />;
    case 'hand':
      return <HandHelping size={size} aria-hidden="true" />;
    case 'chart':
      return <BarChart3 size={size} aria-hidden="true" />;
    case 'mic':
      return <Mic size={size} aria-hidden="true" />;
    case 'cpu':
      return <Cpu size={size} aria-hidden="true" />;
    case 'trending':
      return <TrendingUp size={size} aria-hidden="true" />;
    case 'zap':
      return <Zap size={size} aria-hidden="true" />;
    case 'eye':
      return <Eye size={size} aria-hidden="true" />;
    case 'question':
      return <HelpCircle size={size} aria-hidden="true" />;
    case 'repeat':
      return <Repeat2 size={size} aria-hidden="true" />;
    case 'share':
      return <Share2 size={size} aria-hidden="true" />;
    case 'camera':
      return <Camera size={size} aria-hidden="true" />;
    case 'mountain':
      return <Mountain size={size} aria-hidden="true" />;
    case 'award':
    default:
      return <Award size={size} aria-hidden="true" />;
  }
}

/**
 * Badge dessiné comme sur la page Badges (d'après HackTheBox) : le pictogramme au trait dans un cercle
 * fin, aux couleurs de la marque quand le badge est obtenu.
 */
export function BadgeRing({
  iconKey,
  earned,
  size = 'md'
}: {
  iconKey: SavoirBadgeItem['iconKey'];
  earned: boolean;
  size?: 'sm' | 'md';
}) {
  return (
    <span className={`bd-ring is-${size}${earned ? ' is-earned' : ''}`} aria-hidden="true">
      <BadgeGlyph iconKey={iconKey} size={size === 'sm' ? 15 : 18} />
    </span>
  );
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
