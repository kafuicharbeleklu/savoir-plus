import React, { useSyncExternalStore } from 'react';
import { BadgeCheck, MapPin } from 'lucide-react';
import type { Profile } from '../data';
import {
  difficultySegments,
  resolveProfileVerified,
  type RoleCapabilities
} from '../personas';
import type { DifficultyLevel, ExtendedDemoState } from '../wireframeData';

/* Photos de profil : un petit registre partagé, pour que chaque avatar de l'application
   affiche la photo du membre dès qu'il en a une, sans faire passer l'état partout. */
let avatarPhotos: Record<string, string> = {};
const avatarListeners = new Set<() => void>();

export function setAvatarPhotos(next: Record<string, string>) {
  const sameKeys = Object.keys(next).length === Object.keys(avatarPhotos).length;
  if (sameKeys && Object.keys(next).every((id) => avatarPhotos[id] === next[id])) return;
  avatarPhotos = next;
  avatarListeners.forEach((listener) => listener());
}

function subscribeAvatarPhotos(listener: () => void) {
  avatarListeners.add(listener);
  return () => {
    avatarListeners.delete(listener);
  };
}

export function Avatar({ person, small = false, className = '' }: { person: Profile; small?: boolean; className?: string }) {
  const photo = useSyncExternalStore(subscribeAvatarPhotos, () => avatarPhotos[person.id]);
  const classes = ['avatar', person.color, small ? 'small' : '', photo ? 'has-photo' : '', className].filter(Boolean).join(' ');
  return (
    <span className={classes} aria-hidden="true">
      {photo ? <img src={photo} alt="" /> : person.initials || 'SV'}
    </span>
  );
}

export function VerifiedBadge({ title = 'Profil vérifié' }: { title?: string }) {
  return (
    <span className="verified-badge" title={title} aria-label={title}>
      <BadgeCheck size={16} strokeWidth={2.3} aria-hidden="true" />
    </span>
  );
}

export function ProgressBar({
  value,
  label = 'Progression',
  tone = 'accent'
}: {
  value: number;
  label?: string;
  tone?: 'accent' | 'htb';
}) {
  const safeVal = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className={`progress-track ${tone === 'htb' ? 'htb-track' : ''}`}
      role="progressbar"
      aria-label={label}
      aria-valuenow={safeVal}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <i style={{ transform: `scaleX(${safeVal / 100})` }} />
    </div>
  );
}

function DifficultyGlyph({ level }: { level: DifficultyLevel }) {
  if (level === 'Avancé') {
    return (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M8 1.4L9.55 5.1L13.5 3.8L11.4 7.3L14.8 9.2L10.8 10.3L11.8 14.3L8 11.9L4.2 14.3L5.2 10.3L1.2 9.2L4.6 7.3L2.5 3.8L6.45 5.1L8 1.4Z"
          stroke="currentColor"
          strokeWidth="1.45"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (level === 'Intermédiaire') {
    return (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <polygon
          points="8,1.5 13.6,4.75 13.6,11.25 8,14.5 2.4,11.25 2.4,4.75"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="8" cy="8" r="2" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <polygon
        points="8,1.6 14.1,6.05 11.75,13.25 4.25,13.25 1.9,6.05"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DifficultyMeter({ level }: { level: DifficultyLevel }) {
  const seg = difficultySegments(level);
  return (
    <span className={`diff-meter diff-${seg.tone}`} title={`Niveau : ${seg.label}`}>
      <span className="diff-glyph" aria-hidden="true">
        <DifficultyGlyph level={level} />
      </span>
      <span className="diff-label">{seg.label}</span>
    </span>
  );
}

export function ProfileIdentityCard({
  user,
  ext,
  caps,
  compact = false,
  onOpenProfile
}: {
  user: Profile;
  ext: ExtendedDemoState;
  caps?: RoleCapabilities;
  compact?: boolean;
  onOpenProfile: () => void;
}) {
  const details = ext.profileDetails[user.id];
  const headline = details?.tagline || caps?.roleLabel || user.role;
  const location = details?.location || 'Lomé, Région Maritime';
  const isVerified = resolveProfileVerified(user.id, ext.adminUsers, details?.verified);

  return (
    <section className={`profile-card ${compact ? 'profile-card-compact' : ''}`} aria-label="Carte personnelle">
      {!compact && (
        <div
          className="mini-profile-cover"
          aria-hidden="true"
          style={details?.coverDataUrl ? { backgroundImage: `url(${details.coverDataUrl})` } : undefined}
        />
      )}
      <button type="button" className="mini-profile-identity" onClick={onOpenProfile}>
        <Avatar person={user} small={compact} />
        <div className="mini-profile-text">
          <div className="mini-profile-name-row">
            <h3>{user.name}</h3>
            {isVerified && <VerifiedBadge />}
          </div>
          <p className="mini-profile-headline">{headline}</p>
          {location && (
            <span className="mini-profile-location">
              <MapPin size={12} aria-hidden="true" />
              <span>{location}</span>
            </span>
          )}
        </div>
      </button>
    </section>
  );
}

