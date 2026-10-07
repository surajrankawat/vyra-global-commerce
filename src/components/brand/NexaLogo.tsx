import React from 'react';
import { BRAND } from '../../config/brand';

interface VyraLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'wordmark';
  theme?: 'dark' | 'light' | 'auto';
  className?: string;
  showTagline?: boolean;
}

/**
 * Geometric VYRA V-Mark:
 * Precision vector mark symbolizing the confluence of global commerce,
 * interconnected trade vectors, and enterprise acceleration.
 */
export const VyraIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 32,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 hover:scale-105 ${className}`}
      aria-label="VYRA Global Commerce Network Icon"
    >
      <defs>
        <linearGradient id="vyra-grad-border" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="vyra-grad-v1" x1="12" y1="12" x2="24" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="vyra-grad-v2" x1="36" y1="12" x2="24" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        <filter id="vyra-glow" x="0" y="0" width="48" height="48" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#2563eb" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Outer rounded container */}
      <rect
        x="3"
        y="3"
        width="42"
        height="42"
        rx="12"
        fill="#090d16"
        stroke="url(#vyra-grad-border)"
        strokeWidth="1.5"
      />

      {/* Dynamic Geometric V Structure */}
      <g filter="url(#vyra-glow)">
        {/* Left descent stroke */}
        <path
          d="M13 13L24 35"
          stroke="url(#vyra-grad-v1)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Right ascent stroke */}
        <path
          d="M35 13L24 35"
          stroke="url(#vyra-grad-v2)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Central horizontal connective bar */}
        <path
          d="M18.5 24H29.5"
          stroke="#38bdf8"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Vertex convergence node */}
        <circle cx="24" cy="35" r="2.2" fill="#ffffff" />
        {/* Top left and right anchor nodes */}
        <circle cx="13" cy="13" r="2" fill="#38bdf8" />
        <circle cx="35" cy="13" r="2" fill="#60a5fa" />
      </g>
    </svg>
  );
};

export const VyraLogo: React.FC<VyraLogoProps> = ({
  size = 'md',
  variant = 'full',
  theme = 'auto',
  className = '',
  showTagline = false,
}) => {
  const sizeMap = {
    sm: { icon: 24, text: 'text-lg', tag: 'text-[9px]' },
    md: { icon: 32, text: 'text-xl', tag: 'text-[10px]' },
    lg: { icon: 40, text: 'text-2xl', tag: 'text-xs' },
    xl: { icon: 52, text: 'text-3xl', tag: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  const textColor =
    theme === 'light'
      ? 'text-slate-900'
      : theme === 'dark'
      ? 'text-white'
      : 'text-slate-900 dark:text-white';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {variant !== 'wordmark' && <VyraIcon size={currentSize.icon} />}

      {variant !== 'icon' && (
        <div className="flex flex-col">
          <div className="flex items-center tracking-tight">
            <span
              className={`font-black tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 dark:from-sky-400 dark:via-blue-400 dark:to-indigo-300 font-sans ${currentSize.text}`}
            >
              {BRAND.wordmark}
            </span>
            <span className="ml-1.5 px-1.5 py-0.2 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-bold uppercase tracking-wider rounded border border-blue-500/20">
              COMMERCE
            </span>
          </div>

          {showTagline && (
            <span
              className={`font-medium tracking-wide text-slate-500 dark:text-slate-400 ${currentSize.tag}`}
            >
              {BRAND.tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Aliases for seamless backward compatibility across existing views
export const NexaIcon = VyraIcon;
export const NexaLogo = VyraLogo;
export const NexvoraIcon = VyraIcon;
export const NexvoraLogo = VyraLogo;

export default VyraLogo;

