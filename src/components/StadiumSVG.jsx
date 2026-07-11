import React, { useState, memo } from 'react';
import { ZONE_COLORS } from '../utils/styles';
import { getStatusColor } from '../utils/helpers';

const GATE_POSITIONS = {
  A: { x: 250, y: 22, dir: 'N' },
  B: { x: 310, y: 22, dir: 'N' },
  C: { x: 250, y: 378, dir: 'S' },
  D: { x: 310, y: 378, dir: 'S' },
  E: { x: 412, y: 200, dir: 'E' },
  F: { x: 88, y: 200, dir: 'W' },
};

/**
 * Interactive stadium SVG with zone selection
 * @component
 */
const StadiumSVG = memo(function StadiumSVG({
  zones,
  gates,
  onZoneClick,
  selectedZone,
  reducedMotion,
}) {
  const [focusIndex, setFocusIndex] = useState(-1);
  const [hoveredZone, setHoveredZone] = useState(null);

  const handleKeyDown = (e, zone) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onZoneClick(zone);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIndex((prev) => Math.min(prev + 1, zones.length - 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  return (
    <svg
      viewBox="0 0 500 400"
      className="w-full h-full"
      style={{ maxHeight: '420px', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))' }}
      role="application"
      aria-label="Interactive stadium map showing zone occupancy"
    >
      <defs>
        {/* Neon Glow Filter */}
        <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Pitch Lighting Gradient */}
        <radialGradient id="pitch-light" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
          <stop offset="70%" stopColor="#15803d" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#14532d" stopOpacity="0.9" />
        </radialGradient>

        {/* Metallic Roof Gradient */}
        <linearGradient id="roof-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#f8fafc" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.1" />
        </linearGradient>

        {/* Stadium Shape Clip Path */}
        <clipPath id="stadium-clip">
          <ellipse cx="250" cy="200" rx="228" ry="183" />
        </clipPath>
      </defs>

      {/* Deep Background Base */}
      <rect x="10" y="10" width="480" height="380" rx="190" fill="#03050a" opacity="0.6" />

      {/* Realistic Pitch */}
      <g className="stadium-pitch">
        {/* Grass Base */}
        <rect
          x="120"
          y="110"
          width="260"
          height="180"
          rx="6"
          fill="url(#pitch-light)"
          stroke="#ffffff"
          strokeOpacity="0.2"
          strokeWidth="1"
        />

        {/* Pitch Lines */}
        <g stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.5" fill="none">
          {/* Outer Boundary */}
          <rect x="125" y="115" width="250" height="170" />
          {/* Center Line */}
          <line x1="250" y1="115" x2="250" y2="285" />
          {/* Center Circle */}
          <circle cx="250" cy="200" r="25" />
          {/* Center Dot */}
          <circle cx="250" cy="200" r="2" fill="#ffffff" stroke="none" />
          {/* Left Penalty Box */}
          <rect x="125" y="150" width="40" height="100" />
          {/* Left Goal Box */}
          <rect x="125" y="170" width="15" height="60" />
          {/* Right Penalty Box */}
          <rect x="335" y="150" width="40" height="100" />
          {/* Right Goal Box */}
          <rect x="360" y="170" width="15" height="60" />
        </g>
      </g>

      <g clipPath="url(#stadium-clip)">
        {/* Architectural Tiers (Underneath Active Zones) */}
        <path
          d="M 105 95 Q 250 40 395 95 L 430 40 Q 250 -30 70 40 Z"
          fill="#1e293b"
          opacity="0.3"
        />
        <path
          d="M 105 305 Q 250 360 395 305 L 430 360 Q 250 430 70 360 Z"
          fill="#1e293b"
          opacity="0.3"
        />
        <path
          d="M 105 105 Q 60 200 105 295 L 50 340 Q -20 200 50 60 Z"
          fill="#1e293b"
          opacity="0.3"
        />
        <path
          d="M 395 105 Q 440 200 395 295 L 450 340 Q 520 200 450 60 Z"
          fill="#1e293b"
          opacity="0.3"
        />

        {/* Interactive Seating Zones */}
        {zones.map((zone, idx) => {
          const c = ZONE_COLORS[zone.status] || ZONE_COLORS.nominal;
          const isSelected = selectedZone === zone.id;
          const isFocused = focusIndex === idx;
          const isHovered = hoveredZone === zone.id;

          let pathData = '';
          let textX = 250;
          let textY = 200;

          if (zone.id === 'north') {
            pathData = 'M 115 90 Q 250 45 385 90 L 420 35 Q 250 -30 80 35 Z';
            textY = 55;
          } else if (zone.id === 'south') {
            pathData = 'M 115 310 Q 250 355 385 310 L 420 365 Q 250 430 80 365 Z';
            textY = 350;
          } else if (zone.id === 'west') {
            pathData = 'M 100 105 Q 55 200 100 295 L 45 335 Q -20 200 45 65 Z';
            textX = 65;
          } else if (zone.id === 'east') {
            pathData = 'M 400 105 Q 445 200 400 295 L 455 335 Q 520 200 455 65 Z';
            textX = 435;
          }

          const baseProps = {
            d: pathData,
            fill: c.fill,
            opacity: isSelected ? 0.95 : isHovered ? 0.75 : 0.45,
            stroke: c.fill,
            strokeWidth: isSelected ? 3 : isHovered ? 2 : isFocused ? 2 : 1,
            filter:
              isSelected || zone.status === 'critical'
                ? 'url(#neon-glow)'
                : isHovered
                  ? 'url(#neon-glow)'
                  : 'none',
            cursor: 'pointer',
            onClick: () => onZoneClick(zone),
            onMouseEnter: () => setHoveredZone(zone.id),
            onMouseLeave: () => setHoveredZone(null),
            onKeyDown: (e) => handleKeyDown(e, zone),
            role: 'button',
            tabIndex: 0,
            'aria-label': `${zone.name}: ${Math.round(zone.occupancy * 100)}% capacity, ${c.label}`,
            'aria-pressed': isSelected,
            style: {
              transition: 'opacity 0.3s ease, stroke-width 0.2s ease, filter 0.3s ease',
              outline: 'none',
            },
          };

          return (
            <g key={zone.id}>
              <path {...baseProps} />
              <text
                x={textX}
                y={textY - 5}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="13"
                fontWeight="800"
                letterSpacing="1"
                aria-hidden="true"
                style={{ pointerEvents: 'none' }}
              >
                {zone.id.charAt(0).toUpperCase()}
              </text>
              <text
                x={textX}
                y={textY + 10}
                textAnchor="middle"
                fill="#f8fafc"
                fontSize="10"
                fontWeight="600"
                aria-hidden="true"
                style={{ pointerEvents: 'none' }}
              >
                {Math.round(zone.occupancy * 100)}%
              </text>
            </g>
          );
        })}
      </g>

      {/* Outer Glass Roof / Canopy */}
      <ellipse
        cx="250"
        cy="200"
        rx="230"
        ry="185"
        fill="none"
        stroke="url(#roof-gradient)"
        strokeWidth="6"
        opacity="0.6"
        style={{ pointerEvents: 'none' }}
      />
      <ellipse
        cx="250"
        cy="200"
        rx="234"
        ry="189"
        fill="none"
        stroke="#00f0ff"
        strokeWidth="1"
        opacity="0.2"
        style={{ pointerEvents: 'none' }}
      />

      {/* Gate Hub Markers */}
      {gates.map((gate) => {
        const pos = GATE_POSITIONS[gate.id];
        if (!pos) return null;
        const gColor = getStatusColor(gate.status);
        return (
          <g
            key={gate.id}
            role="group"
            aria-label={`Gate ${gate.id}: ${gate.direction} side, ${gate.waitTimeMinutes} min wait`}
          >
            {/* Gate Connection Line */}
            <line
              x1="250"
              y1="200"
              x2={pos.x}
              y2={pos.y}
              stroke={gColor}
              strokeWidth="1"
              opacity="0.2"
              strokeDasharray="4 4"
            />

            {/* Base Gate Marker */}
            <circle cx={pos.x} cy={pos.y} r="16" fill="#0f1623" stroke={gColor} strokeWidth="2.5" />
            <circle cx={pos.x} cy={pos.y} r="12" fill={gColor} opacity="0.2" />

            <text
              x={pos.x}
              y={pos.y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#ffffff"
              fontSize="12"
              fontWeight="800"
              aria-hidden="true"
            >
              {gate.id}
            </text>

            {/* Critical Pulse */}
            {gate.status === 'critical' && !reducedMotion && (
              <circle
                cx={pos.x}
                cy={pos.y}
                r="16"
                fill="none"
                stroke={gColor}
                strokeWidth="2"
                filter="url(#neon-glow)"
              >
                <animate attributeName="r" values="16;26;16" dur="1.5s" repeatCount="indefinite" />
                <animate
                  attributeName="opacity"
                  values="0.8;0;0.8"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </circle>
            )}
          </g>
        );
      })}

      {/* Compass / Navigation Rose */}
      <g transform="translate(460, 30)">
        <circle cx="0" cy="0" r="14" fill="#0f1623" stroke="#334155" strokeWidth="1" />
        <text
          x="0"
          y="-1"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#94a3b8"
          fontSize="11"
          fontWeight="800"
          aria-hidden="true"
        >
          N
        </text>
        <path d="M 0 -14 L 4 -22 L 0 -18 L -4 -22 Z" fill="#00f0ff" />
      </g>
    </svg>
  );
});

export default StadiumSVG;
