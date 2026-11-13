import React from 'react';
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { BrandTheme } from '../themes';
import { CaptionLine, MascotId } from '../types';

interface Props {
  sceneIdx: number; // 0: Hero, 1: Grid, 2: Spotlight, 3: CTA
  captions: CaptionLine[];
  theme: BrandTheme;
  mascotId?: MascotId;
}

const SCENE3_LABELS: Record<MascotId, string> = {
  mini: 'ละมุนมาก 💕',
  max: 'สเปคโดนใจ! ⚡',
  sky_cat: 'น่ารักไม่ไหว ✨',
  star_bear: 'ของมันต้องมี! 🌟',
};

export const MascotNarrator: React.FC<Props> = ({
  sceneIdx,
  captions,
  theme,
  mascotId = 'mini',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  const activeLine = captions.find(
    (l) => currentTime >= l.start - 0.05 && currentTime <= l.end + 0.05
  );
  const isSpeaking = Boolean(activeLine);

  const popSpring = spring({
    frame: frame % 45,
    fps,
    config: { damping: 11, stiffness: 180 },
  });
  const popScale = interpolate(popSpring, [0, 1], [0.8, 1]);

  const bounceY = isSpeaking
    ? Math.abs(Math.sin(frame * 0.45)) * -12
    : Math.sin(frame / 10) * 5;
  const bodyTilt = isSpeaking ? Math.sin(frame / 6) * 4 : Math.sin(frame / 15) * 2;
  const squashY = isSpeaking ? 1 + Math.sin(frame * 0.65) * 0.035 : 1;

  // 4 Corner Positions & 4 Distinct Poses (strictly within 9:16 Safe Zones)
  const positions: Record<
    number,
    {
      top?: number;
      bottom?: number;
      left?: number;
      right?: number;
      bubbleSide: 'right' | 'left';
      label: string;
      sprite: string;
      flipX?: boolean;
    }
  > = {
    0: { top: 240, left: 42, bubbleSide: 'right', label: 'ของดีบอกต่อ! ✨', sprite: `mascot/${mascotId}/wave.png` },
    1: { top: 240, right: 112, bubbleSide: 'left', label: 'ดูจุดเด่นสิ! 👇', sprite: `mascot/${mascotId}/point.png`, flipX: true },
    2: { bottom: 580, left: 42, bubbleSide: 'right', label: SCENE3_LABELS[mascotId] || 'ของมันต้องมี! 💕', sprite: `mascot/${mascotId}/love.png` },
    3: { bottom: 625, right: 112, bubbleSide: 'left', label: 'จิ้มตะกร้าเลย! 🛒', sprite: `mascot/${mascotId}/basket.png` },
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
        gap: 8,
        transform: `translateY(${bounceY}px) scale(${popScale})`,
      }}
    >
      {/* 3D Chibi Mascot Sprite (4 Poses) */}
      <div
        style={{
          width: 185,
          height: 250,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `rotate(${bodyTilt}deg) scaleY(${squashY}) scaleX(${pos.flipX ? -1 : 1})`,
          filter: 'drop-shadow(0 12px 22px rgba(0,0,0,0.35))',
        }}
      >
        <Img
          src={staticFile(pos.sprite)}
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
