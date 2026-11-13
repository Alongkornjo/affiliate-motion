import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BrandTheme } from '../themes';
import { CaptionLine } from '../types';

interface Props {
  sceneIdx: number; // 0: Hero, 1: Grid, 2: Spotlight, 3: CTA
  captions: CaptionLine[];
  theme: BrandTheme;
}

export const MascotNarrator: React.FC<Props> = ({ sceneIdx, captions, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // Check if voiceover is actively speaking a word right now for lip-sync & talking bounce
  const activeLine = captions.find(
    (l) => currentTime >= l.start - 0.05 && currentTime <= l.end + 0.05
  );
  const isSpeaking = Boolean(activeLine);
  const mouthCycle = isSpeaking ? (Math.sin(frame * 0.85) + 1) / 2 : 0;

  // Natural eye blink every ~85 frames
  const blinkFrame = frame % 85;
  const isBlinking = blinkFrame >= 80 && blinkFrame <= 83;

  // Pop-in spring whenever sceneIdx changes
  const popSpring = spring({
    frame: frame % 45,
    fps,
    config: { damping: 11, stiffness: 180 },
  });
  const popScale = interpolate(popSpring, [0, 1], [0.75, 1]);

  // Continuous cute idle + talking bounce
  const bounceY = isSpeaking
    ? Math.abs(Math.sin(frame * 0.45)) * -10
    : Math.sin(frame / 10) * 5;
  const earWiggle = Math.sin(frame / 7) * 6;
  const bodyTilt = isSpeaking ? Math.sin(frame / 6) * 4 : Math.sin(frame / 15) * 2;

  // 4 Corner Positions (all strictly within 9:16 Safe Zones)
  const positions: Record<
    number,
    { top?: number; bottom?: number; left?: number; right?: number; bubbleSide: 'right' | 'left'; label: string }
  > = {
    0: { top: 245, left: 44, bubbleSide: 'right', label: 'ของดีบอกต่อ! ✨' },
    1: { top: 245, right: 112, bubbleSide: 'left', label: 'ดูจุดเด่นสิ! 👇' },
    2: { bottom: 590, left: 44, bubbleSide: 'right', label: 'ละมุนมาก 💕' },
    3: { bottom: 635, right: 112, bubbleSide: 'left', label: 'จิ้มตะกร้าเลย! 🛒' },
  };

  const pos = positions[sceneIdx] || positions[0];

  return (
    <div
      style={{
        position: 'absolute',
        top: pos.top,
        bottom: pos.bottom,
        left: pos.left,
        right: pos.right,
        zIndex: 35,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: pos.bubbleSide === 'right' ? 'row' : 'row-reverse',
        alignItems: 'center',
        gap: 10,
        transform: `translateY(${bounceY}px) scale(${popScale})`,
      }}
    >
      {/* Cute Chibi Bunny-Cat Mascot Sticker (Vector SVG with thick white sticker border) */}
      <div
        style={{
          width: 156,
          height: 168,
          position: 'relative',
          transform: `rotate(${bodyTilt}deg)`,
          filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.28))',
        }}
      >
        <svg viewBox="0 0 180 190" width="100%" height="100%">
          {/* Sticker White Outer Outline Group */}
          <g stroke="#FFFFFF" strokeWidth="12" strokeLinejoin="round" strokeLinecap="round">
            {/* Left Ear */}
            <g transform={`rotate(${-10 + earWiggle} 58 62)`}>
              <ellipse cx="55" cy="36" rx="18" ry="32" fill="#FFFDF9" />
            </g>
            {/* Right Ear */}
            <g transform={`rotate(${10 - earWiggle} 122 62)`}>
              <ellipse cx="125" cy="36" rx="18" ry="32" fill="#FFFDF9" />
            </g>
            {/* Chubby Body */}
            <path
              d="M52 128 C44 150, 48 175, 90 175 C132 175, 136 150, 128 128 Z"
              fill={theme.primary}
            />
            {/* Chubby Head */}
            <ellipse cx="90" cy="96" rx="54" ry="46" fill="#FFFDF9" />
          </g>

          {/* Main Colored Mascot Layers */}
          {/* Left Ear */}
          <g transform={`rotate(${-10 + earWiggle} 58 62)`}>
            <ellipse cx="55" cy="36" rx="18" ry="32" fill="#FFFDF9" stroke="#3F2E2E" strokeWidth="4.5" />
            <ellipse cx="55" cy="38" rx="9" ry="20" fill="#FFB3C6" />
          </g>

          {/* Right Ear */}
          <g transform={`rotate(${10 - earWiggle} 122 62)`}>
            <ellipse cx="125" cy="36" rx="18" ry="32" fill="#FFFDF9" stroke="#3F2E2E" strokeWidth="4.5" />
            <ellipse cx="125" cy="38" rx="9" ry="20" fill="#FFB3C6" />
            {/* Cute Ribbon Bow on Right Ear */}
            <circle cx="132" cy="58" r="7" fill={theme.primary} stroke="#3F2E2E" strokeWidth="3" />
            <path d="M132 58 L120 50 L122 65 Z" fill={theme.primary} stroke="#3F2E2E" strokeWidth="3" />
            <path d="M132 58 L144 50 L142 65 Z" fill={theme.primary} stroke="#3F2E2E" strokeWidth="3" />
          </g>

          {/* Body / Outfit */}
          <path
            d="M52 128 C44 150, 48 175, 90 175 C132 175, 136 150, 128 128 Z"
            fill={theme.primary}
            stroke="#3F2E2E"
            strokeWidth="4.5"
          />
          {/* White Collar */}
          <path d="M68 134 Q90 148 112 134" fill="#FFFFFF" stroke="#3F2E2E" strokeWidth="3.5" />

          {/* Chubby Head */}
          <ellipse cx="90" cy="96" rx="54" ry="46" fill="#FFFDF9" stroke="#3F2E2E" strokeWidth="4.5" />

          {/* Soft Pink Blush Cheeks */}
          <ellipse cx="54" cy="104" rx="11" ry="6.5" fill="#FF9EBB" opacity="0.85" />
          <ellipse cx="126" cy="104" rx="11" ry="6.5" fill="#FF9EBB" opacity="0.85" />

          {/* Eyes (Changes by Scene + Natural Blink) */}
          {isBlinking ? (
            <>
              <path d="M58 92 Q68 98 78 92" fill="none" stroke="#3F2E2E" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M102 92 Q112 98 122 92" fill="none" stroke="#3F2E2E" strokeWidth="4.5" strokeLinecap="round" />
            </>
          ) : sceneIdx === 2 ? (
            /* Happy Arch Eyes in Scene 3 */
            <>
              <path d="M58 94 Q68 82 78 94" fill="none" stroke="#3F2E2E" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M102 94 Q112 82 122 94" fill="none" stroke="#3F2E2E" strokeWidth="4.5" strokeLinecap="round" />
            </>
          ) : (
            /* Big Kawaii Sparkling Eyes */
            <>
              <circle cx="68" cy="91" r="9.5" fill="#2B1E1E" />
              <circle cx="65" cy="87.5" r="3.8" fill="#FFFFFF" />
              <circle cx="71.5" cy="94" r="1.8" fill="#FFFFFF" />

              <circle cx="112" cy="91" r="9.5" fill="#2B1E1E" />
              <circle cx="109" cy="87.5" r="3.8" fill="#FFFFFF" />
              <circle cx="115.5" cy="94" r="1.8" fill="#FFFFFF" />
            </>
          )}

          {/* Tiny Cute Nose */}
          <ellipse cx="90" cy="99" rx="4" ry="3" fill="#FF7597" />

          {/* Lip-Synced Mouth (Opens & Closes with Voiceover!) */}
          {mouthCycle > 0.25 ? (
            <ellipse
              cx="90"
              cy={107 + mouthCycle * 2}
              rx={6 + mouthCycle * 4}
              ry={3 + mouthCycle * 6}
              fill="#FF5C8A"
              stroke="#3F2E2E"
              strokeWidth="3.5"
            />
          ) : (
            <path
              d="M82 105 Q86 110 90 105 Q94 110 98 105"
              fill="none"
              stroke="#3F2E2E"
              strokeWidth="3.8"
              strokeLinecap="round"
            />
          )}

          {/* Paws (Waving & Pointing based on Scene) */}
          <g transform={`rotate(${isSpeaking ? Math.sin(frame * 0.6) * 18 : 0} 48 142)`}>
            <ellipse cx="42" cy="138" rx="13" ry="10" fill="#FFFDF9" stroke="#3F2E2E" strokeWidth="4" />
          </g>
          <g transform={`rotate(${isSpeaking ? -Math.sin(frame * 0.6) * 18 : 0} 132 142)`}>
            <ellipse cx="138" cy="138" rx="13" ry="10" fill="#FFFDF9" stroke="#3F2E2E" strokeWidth="4" />
          </g>

          {/* Scene-Specific Cute Prop Badge */}
          {sceneIdx === 3 && (
            /* Little Orange Shopping Basket Prop in CTA Scene */
            <g transform="translate(122, 134)">
              <rect x="0" y="8" width="34" height="26" rx="6" fill="#EE4D2D" stroke="#FFFFFF" strokeWidth="3" />
              <path d="M8 8 C8 -2, 26 -2, 26 8" fill="none" stroke="#FFFFFF" strokeWidth="3.5" />
            </g>
          )}
        </svg>
      </div>

      {/* Mini Speech Bubble Pill next to Mascot */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          color: '#18181B',
          border: `3px solid ${theme.primary}`,
          borderRadius: 999,
          padding: '8px 18px',
          fontSize: 23,
          fontWeight: 700,
          boxShadow: '0 8px 20px rgba(0,0,0,0.22)',
          whiteSpace: 'nowrap',
        }}
      >
        {pos.label}
      </div>
    </div>
  );
};
