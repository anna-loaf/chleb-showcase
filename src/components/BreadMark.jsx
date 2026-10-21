import { useId } from 'react';

// Bochenek — logo apki (ta sama grafika co ikona na ekranie początkowym).
export function BreadMark({ size = 40, className, decorative = false }) {
  const gradient = `bm${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : 'C.H.L.E.B — bochenek'}
    >
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dba55f" />
          <stop offset="1" stopColor="#b47436" />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="50.5" rx="23" ry="3" fill="#e6cf9e" />
      <path d="M8 42.5c0-12.5 10.75-22 24-22s24 9.5 24 22c0 2.75-2 4.5-4.75 4.5H12.75C10 47 8 45.25 8 42.5z" fill={`url(#${gradient})`} />
      <path d="M14 45.5h36" stroke="#9b6128" strokeWidth="2" strokeLinecap="round" opacity=".55" />
      <g stroke="#f6e6c2" strokeWidth="2.6" strokeLinecap="round" fill="none">
        <path d="M18.5 35.5c2-3.6 4.6-5.8 8-7" />
        <path d="M27 34c2-3.6 4.6-5.8 8-7" />
        <path d="M35.5 35.5c2-3.6 4.6-5.8 8-7" />
      </g>
    </svg>
  );
}
