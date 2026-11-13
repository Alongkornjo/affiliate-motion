import React from 'react';
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
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

  // Check if voiceover is actively speaking a word right now for lively talking bounce
  const activeLine = captions.find(
    (l) => currentTime >= l.start - 0.05 && currentTime <= l.end + 0.05
  );
  const isSpeaking = Boolean(activeLine);

  const popSpring = spring({
    frame: frame % 45,
    fps,
    config: { damping: 11, stiffness: 180 },
  });
  const popScale = interpolate(popSpring, [0, 1], [0.78, 1]);

  const bounceY = isSpeaking
    ? Math.abs(Math.sin(frame * 0.45)) * -12
    : Math.sin(frame / 10) * 5;
  const bodyTilt = isSpeaking ? Math.sin(frame / 6) * 4.5 : Math.sin(frame / 15) * 2;
  const squashY = isSpeaking ? 1 + Math.sin(frame * 0.65) * 0.035 : 1;

  // 4 Corner Positions (all strictly within 9:16 Safe Zones)
  const positions: Record<
    number,
    { top?: number; bottom?: number; left?: number; right?: number; bubbleSide: 'right' | 'left'; label: string }
  > = {
    0: { top: 245, left: 42, bubbleSide: 'right', label: 'ของดีบอกต่อ! ✨' },
    1: { top: 245, right: 112, bubbleSide: 'left', label: 'ดูจุดเด่นสิ! 👇' },
    2: { bottom: 585, left: 42, bubbleSide: 'right', label: 'ละมุนมาก 💕' },
    3: { bottom: 630, right: 112, bubbleSide: 'left', label: 'จิ้มตะกร้าเลย! 🛒' },
  };

  const pos = positions[sceneIdx] || positions[0];
  const sprite = sceneIdx === 3 ? 'mascot/basket.png' : 'mascot/wave.png';
  const flipX = pos.bubbleSide === 'left' && sceneIdx !== 3 ? -1 : 1;

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
        gap: 8,
        transform: `translateY(${bounceY}px) scale(${popScale})`,
      }}
    >
      {/* Studio-Quality Illustrated Kawaii Mascot Sprite */}
      <div
        style={{
          width: 175,
          height: 235,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `rotate(${bodyTilt}deg) scaleY(${squashY}) scaleX(${flipX})`,
          filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.32))',
        }}
      >
        <Img
          src={staticFile(sprite)}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
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
