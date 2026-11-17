import React, { useId } from 'react';

export function NexusMark({
  width = 24,
  height = 17,
  className = ''
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  const gradId = useId().replace(/:/g, '');
  return (
    <svg
      className={className}
      viewBox="0 0 28 20"
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="2" y1="18" x2="26" y2="2" gradientUnits="userSpaceOnUse">
          {/* Les variables ne sont définies qu'en thème clair ; le thème sombre garde les valeurs de repli. */}
          <stop offset="0%" style={{ stopColor: 'var(--nexus-a, #4CA982)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--nexus-b, #E09168)' }} />
        </linearGradient>
      </defs>
      <path
        d="M8.2 15.5C4.8 15.5 2.5 13 2.5 10C2.5 7 4.8 4.5 8.2 4.5C11.2 4.5 13 7.2 14 10C15 12.8 16.8 15.5 19.8 15.5C23.2 15.5 25.5 13 25.5 10C25.5 7 23.2 4.5 19.8 4.5C16.8 4.5 15 7.2 14 10"
        stroke={`url(#${gradId})`}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="10" r="1.6" style={{ fill: 'var(--nexus-a, #4CA982)' }} />
      <circle cx="20" cy="10" r="1.6" style={{ fill: 'var(--nexus-b, #E09168)' }} />
    </svg>
  );
}
