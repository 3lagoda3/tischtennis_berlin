"use client";

import { useId } from "react";

// Per-format glyph, drawn centred on (0,0), thick black outline (groovy style).
function Glyph({ format }) {
  const ico = {
    stroke: "#1a1330",
    strokeWidth: 3.2,
    strokeLinejoin: "round",
    strokeLinecap: "round",
  };
  switch (format) {
    case "duel": // crossed paddles + ball
      return (
        <g {...ico}>
          <g transform="rotate(-28) translate(0,-1)">
            <rect x="-3" y="-3" width="6" height="20" rx="3" fill="#ff5a1f" />
            <circle cx="0" cy="-7" r="8.5" fill="#ffd60a" />
          </g>
          <g transform="rotate(28) translate(0,-1)">
            <rect x="-3" y="-3" width="6" height="20" rx="3" fill="#118ab2" />
            <circle cx="0" cy="-7" r="8.5" fill="#ec4899" />
          </g>
          <circle cx="0" cy="15" r="4" fill="#fff" />
        </g>
      );
    case "round_robin": // laurel wreath + "1"
      return (
        <g>
          <path d="M-3,16 C-16,10 -16,-9 -4,-16" fill="none" stroke="#1a1330" strokeWidth="8.5" strokeLinecap="round" />
          <path d="M3,16 C16,10 16,-9 4,-16" fill="none" stroke="#1a1330" strokeWidth="8.5" strokeLinecap="round" />
          <path d="M-3,16 C-16,10 -16,-9 -4,-16" fill="none" stroke="#06d6a0" strokeWidth="5" strokeLinecap="round" />
          <path d="M3,16 C16,10 16,-9 4,-16" fill="none" stroke="#06d6a0" strokeWidth="5" strokeLinecap="round" />
          <text x="0" y="6" textAnchor="middle" fontSize="19" fontWeight="500" fill="#ffd60a" stroke="#1a1330" strokeWidth="1">1</text>
        </g>
      );
    case "single_elim": // crown
      return (
        <g {...ico}>
          <path d="M-14,9 L-14,-9 L-5,-1 L0,-14 L5,-1 L14,-9 L14,9 Z" fill="#a855f7" />
          <rect x="-14" y="9" width="28" height="6" rx="2" fill="#a855f7" />
          <circle cx="0" cy="-14" r="2.6" fill="#ffd60a" stroke="none" />
          <circle cx="-14" cy="-9" r="2.2" fill="#ffd60a" stroke="none" />
          <circle cx="14" cy="-9" r="2.2" fill="#ffd60a" stroke="none" />
        </g>
      );
    case "groups_knockout": // trophy cup
      return (
        <g {...ico}>
          <path d="M-11,-12 C-19,-12 -19,-2 -11,-3" fill="none" />
          <path d="M11,-12 C19,-12 19,-2 11,-3" fill="none" />
          <path d="M-12,-13 L12,-13 L10,-3 A10,10 0 0 1 -10,-3 Z" fill="#ffd60a" />
          <rect x="-3" y="-3" width="6" height="10" fill="#ffd60a" />
          <rect x="-11" y="7" width="22" height="6" rx="2" fill="#ffd60a" />
        </g>
      );
    case "swiss": // cheese wedge with holes
      return (
        <g {...ico}>
          <path d="M-15,9 L15,9 L15,-3 Z" fill="#ffd60a" />
          <circle cx="3" cy="4" r="2.7" fill="#d97706" stroke="none" />
          <circle cx="9" cy="6" r="1.8" fill="#d97706" stroke="none" />
          <circle cx="-5" cy="6" r="2.1" fill="#d97706" stroke="none" />
        </g>
      );
    default:
      return null;
  }
}

// Out-of-sync motion per format so a row of badges doesn't pulse in lockstep.
const TUNING = {
  duel:            { delay: 0,   dur: 5,   wob: "-5;5;-5" },
  round_robin:     { delay: -3,  dur: 5.6, wob: "5;-5;5" },
  single_elim:     { delay: -6,  dur: 4.7, wob: "-4.5;4.5;-4.5" },
  groups_knockout: { delay: -9,  dur: 6,   wob: "4;-4;4" },
  swiss:           { delay: -12, dur: 5.2, wob: "-5;5;-5" },
};

// Animated liquid-marble winner badge. Waves flow continuously (turbulence),
// the colour-wheel hue-shifts, and the format glyph sits on a centre medallion.
export function WinnerBadge({ format = "round_robin", size = 28, className = "" }) {
  const raw = useId().replace(/[:]/g, "");
  const liq = `liq-${raw}`;
  const cc = `cc-${raw}`;
  const med = `med-${raw}`;
  const t = TUNING[format] || TUNING.round_robin;

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      style={{ display: "block", flexShrink: 0 }}
      aria-hidden
    >
      <defs>
        <filter id={liq} x="-25%" y="-25%" width="150%" height="150%">
          <feTurbulence type="fractalNoise" baseFrequency="0.013 0.019" numOctaves="2" seed="7" result="n">
            <animate
              attributeName="baseFrequency"
              dur="16s"
              repeatCount="indefinite"
              values="0.013 0.019;0.02 0.011;0.009 0.023;0.016 0.014;0.013 0.019"
            />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="34" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <clipPath id={cc}>
          <circle cx="60" cy="60" r="47" />
        </clipPath>
        <radialGradient id={med} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#241640" />
          <stop offset="100%" stopColor="#130b24" />
        </radialGradient>
      </defs>

      <g
        clipPath={`url(#${cc})`}
        style={{ animation: "badge-hue 14s linear infinite", animationDelay: `${t.delay}s` }}
      >
        <g stroke="#1a1330" strokeWidth="3" filter={`url(#${liq})`}>
          <circle cx="60" cy="60" r="86" fill="#ec4899" />
          <circle cx="60" cy="60" r="78" fill="#118ab2" />
          <circle cx="60" cy="60" r="70" fill="#ffd60a" />
          <circle cx="60" cy="60" r="62" fill="#06d6a0" />
          <circle cx="60" cy="60" r="54" fill="#a855f7" />
          <circle cx="60" cy="60" r="46" fill="#ff5a1f" />
          <circle cx="60" cy="60" r="38" fill="#84cc16" />
          <circle cx="60" cy="60" r="30" fill="#ec4899" />
          <circle cx="60" cy="60" r="22" fill="#118ab2" />
          <circle cx="60" cy="60" r="14" fill="#ffd60a" />
          <circle cx="60" cy="60" r="7" fill="#ff5a1f" />
        </g>
      </g>

      <circle cx="60" cy="60" r="47" fill="none" stroke="#1a1330" strokeWidth="5" />
      <circle cx="60" cy="60" r="27" fill={`url(#${med})`} stroke="#1a1330" strokeWidth="3" />
      <circle cx="60" cy="60" r="27" fill="none" stroke="#fff" strokeWidth="1.4" opacity="0.5" />

      <g transform="translate(60,60)">
        <g>
          <animateTransform attributeName="transform" type="rotate" values={t.wob} dur={`${t.dur}s`} repeatCount="indefinite" />
          <Glyph format={format} />
        </g>
      </g>
    </svg>
  );
}
