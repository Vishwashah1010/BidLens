import React from "react";

interface BidLensLogoProps {
  size?: number;
  className?: string;
  hasBorder?: boolean;
}

export default function BidLensLogo({ size = 40, className = "", hasBorder = true }: BidLensLogoProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`shrink-0 select-none ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Clip to keep all sunburst rays and builder drawings inside the circular frame */}
        <clipPath id="logoCircleClip">
          <circle cx="100" cy="100" r="92" />
        </clipPath>
        
        {/* Drop shadow filter for a premium visual effect */}
        <filter id="logoShadow" x="0" y="0" width="200" height="200" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.15" />
        </filter>

        {/* Sunburst radial orange gradient */}
        <radialGradient id="sunGlow" cx="100" cy="120" r="90" fx="100" fy="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF2CC" />
          <stop offset="45%" stopColor="#F9A825" />
          <stop offset="100%" stopColor="#E65100" />
        </radialGradient>
      </defs>

      {/* Main outer border */}
      {hasBorder && (
        <circle cx="100" cy="100" r="95" fill="#FFFFFF" stroke="#1A1C1E" strokeWidth="4" />
      )}

      {/* Background circle */}
      <circle cx="100" cy="100" r="92" fill="#111215" />

      {/* Clipped background content (Sunburst Rays & Glow) */}
      <g clipPath="url(#logoCircleClip)">
        {/* Core background radial orange glow */}
        <circle cx="100" cy="115" r="75" fill="url(#sunGlow)" opacity="0.85" />

        {/* Sharp, stylized sunburst rays emanating from the lower-center */}
        <g opacity="0.9" stroke="#E65100" strokeWidth="2.5">
          <line x1="100" y1="120" x2="100" y2="10" stroke="#FFB300" strokeWidth="4" />
          <line x1="100" y1="120" x2="190" y2="120" />
          <line x1="100" y1="120" x2="10" y2="120" />
          
          <line x1="100" y1="120" x2="170" y2="50" />
          <line x1="100" y1="120" x2="30" y2="50" />
          
          <line x1="100" y1="120" x2="180" y2="85" />
          <line x1="100" y1="120" x2="20" y2="85" />

          <line x1="100" y1="120" x2="145" y2="25" stroke="#FFB300" strokeWidth="3" />
          <line x1="100" y1="120" x2="55" y2="25" stroke="#FFB300" strokeWidth="3" />
          
          <line x1="100" y1="120" x2="135" y2="190" />
          <line x1="100" y1="120" x2="65" y2="190" />
        </g>

        {/* BUILDER PROFILE DESIGN */}
        {/* Collar & Shirt base */}
        <path
          d="M 50,185 C 50,150 70,140 100,140 C 130,140 150,150 150,185"
          fill="#111215"
          stroke="#111215"
          strokeWidth="6"
        />
        {/* White inner shirt collar */}
        <path
          d="M 62,175 L 85,138 L 100,152 L 115,138 L 138,175"
          fill="#FFFFFF"
          stroke="#1A1C1E"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d="M 85,138 L 94,168 L 100,152 L 106,168 L 115,138"
          fill="none"
          stroke="#1A1C1E"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Neck structure */}
        <path
          d="M 82,138 C 82,110 85,105 100,105 C 115,105 118,110 118,138 Z"
          fill="#FFB74D"
          stroke="#1A1C1E"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        {/* Neck shadow */}
        <path d="M 82,130 C 90,130 110,130 118,130 L 100,145 Z" fill="#E65100" opacity="0.3" />

        {/* Face / Head Profile facing right */}
        {/* We craft the side-profile facing right with hair, jawline, nose, chin */}
        <path
          d="M 88,105 C 88,85 92,62 108,62 C 122,62 135,70 138,82 C 139,86 142,88 144,91 C 146,93 143,97 141,99 C 139,101 137,103 134,103 C 131,103 129,106 128,109 C 126,112 120,116 112,116 C 100,116 90,112 88,105 Z"
          fill="#FFCC80"
          stroke="#1A1C1E"
          strokeWidth="4"
          strokeLinejoin="round"
        />

        {/* Detailed side-profile features: Nose, lips, chin facing right */}
        <path
          d="M 130,80 C 135,80 142,82 142,85 C 142,88 138,89 135,89 L 131,89 C 134,92 134,94 131,95 C 129,96 126,96 124,96 L 122,98 C 125,100 125,103 122,103 C 118,103 115,101 113,99"
          stroke="#1A1C1E"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Eyebrow & Eye indication */}
        <path d="M 118,74 Q 123,72 126,75" stroke="#1A1C1E" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M 122,79 L 125,80" stroke="#1A1C1E" strokeWidth="3" strokeLinecap="round" />

        {/* Ear */}
        <path
          d="M 98,88 C 94,88 92,92 92,95 C 92,98 94,102 98,102"
          stroke="#1A1C1E"
          strokeWidth="3.5"
          fill="#FFB74D"
        />
        <path d="M 95,95 Q 97,95 97,97" stroke="#1A1C1E" strokeWidth="2" strokeLinecap="round" />

        {/* Hair block under helmet */}
        <path d="M 88,85 C 88,75 92,72 98,72 L 98,82 Z" fill="#263238" />

        {/* CONSTRUCTION HARD HAT (YELLOW) */}
        {/* Main Dome */}
        <path
          d="M 72,72 C 72,40 90,28 112,28 C 134,28 148,40 148,64 C 148,66 146,68 140,68 C 125,68 90,68 72,72 Z"
          fill="#FFD54F"
          stroke="#1A1C1E"
          strokeWidth="4.5"
          strokeLinejoin="round"
        />
        
        {/* Helmet Brim / Visor pointing right */}
        <path
          d="M 66,72 C 72,70 100,68 128,68 C 140,68 152,70 156,74 L 148,79 C 140,76 100,76 70,79 Z"
          fill="#FFC107"
          stroke="#1A1C1E"
          strokeWidth="4"
          strokeLinejoin="round"
        />

        {/* Helmet crown band / design strip */}
        <path d="M 82,68 C 85,52 105,48 124,48 C 134,48 138,52 138,64" stroke="#1A1C1E" strokeWidth="3" fill="none" />
        
        {/* Front Badge / Shield on the helmet */}
        <path
          d="M 103,40 L 117,40 L 115,50 L 110,54 L 105,50 Z"
          fill="#FFA000"
          stroke="#1A1C1E"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
