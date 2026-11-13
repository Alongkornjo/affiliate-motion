import React from 'react';
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { BrandTheme } from '../themes';
import { CaptionLine, MascotId } from '../types';

interface Props {
  sceneIdx: number; // 0: Hero, 1: Grid, 2: Spotlight, 3: CTA
  sceneStartFrame?: number;
  activePointIdx?: number;
  captions: CaptionLine[];
  theme: BrandTheme;
  mascotId?: MascotId;
}

export const MascotNarrator: React.FC<Props> = ({
  sceneIdx,
  sceneStartFrame = 0,
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

  // 1. Scene 1 Walk-in Entrance (frames 0..24: walks in from left off-screen)
  const walkProgress = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 95, mass: 0.9 },
  });
  const walkX = interpolate(walkProgress, [0, 1], [-210, 0]);
  const isWalkingIn = frame < 24;

  // 2. Smooth Pose Transition when scene changes (NO repeating frame % 45 reset!)
  const poseTransition = spring({
    frame: Math.max(frame - sceneStartFrame, 0),
    fps,
    config: { damping: 14, stiffness: 150 },
  });
  const poseScale = interpolate(poseTransition, [0, 0.4, 1], [0.92, 1.04, 1.0]);

  // 3. Gentle, natural presenter motion (no fast jitter)
  const stepY = isWalkingIn
    ? Math.abs(Math.sin(frame * 0.55)) * -14
    : isSpeaking
    ? Math.sin(frame / 5.5) * -4.5
    : Math.sin(frame / 14) * -3;

  const bodyTilt = isWalkingIn
    ? Math.sin(frame * 0.55) * 6
    : isSpeaking
    ? Math.sin(frame / 9) * 2.2
    : Math.sin(frame / 18) * 1.2;

  const breatheScaleY = isSpeaking ? 1 + Math.sin(frame / 5.5) * 0.015 : 1;

  // 4. Pose selection per scene
  // Scene 0: wave, Scene 1: point (flipped right toward checklist & bubble), Scene 2: love, Scene 3: basket
  const poseMap: Record<number, { file: string; flipX?: boolean }> = {
    0: { file: `mascot/${mascotId}/wave.png`, flipX: false },
    1: { file: `mascot/${mascotId}/point.png`, flipX: true },
    2: { file: `mascot/${mascotId}/love.png`, flipX: false },
    3: { file: `mascot/${mascotId}/basket.png`, flipX: false },
  };
  const currentPose = poseMap[sceneIdx] || poseMap[0];

  // 5. Floating Reaction Particles (gentle rising sparkles/hearts)
  const particles =
    sceneIdx === 2
      ? ['💕', '✨', '🌸']
      : sceneIdx === 3
      ? ['🛒', '✨', '🔥']
      : ['✨', '⭐'];

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 312,
        left: 14,
        width: 228,
        height: 305,
        zIndex: 35,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        transform: `translateX(${walkX}px)`,
      }}
    >
      {/* Glowing Presenter Stage Aura behind Mascot */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          width: 160,
          height: 38,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.primary}66 0%, transparent 72%)`,
          filter: 'blur(6px)',
        }}
      />

      {/* Gentle Floating Emotion Particles above Mascot */}
      {particles.map((emoji, idx) => {
        const cycle = (frame + idx * 22) % 60;
        const pY = interpolate(cycle, [0, 60], [0, -68]);
        const pOpacity = interpolate(cycle, [0, 12, 48, 60], [0, 0.9, 0.9, 0]);
        const pX = idx === 0 ? -62 : idx === 1 ? 62 : -15;
        return (
          <div
            key={`pt-${idx}`}
            style={{
              position: 'absolute',
              top: 14,
              left: '50%',
              marginLeft: pX,
              fontSize: 28,
              opacity: pOpacity,
              transform: `translateY(${pY}px)`,
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
            }}
          >
            {emoji}
          </div>
        );
      })}

      {/* 3D Chibi Mascot Co-Host */}
      <div
        style={{
          width: 220,
          height: 296,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `translateY(${stepY}px) rotate(${bodyTilt}deg) scale(${poseScale}) scaleY(${breatheScaleY}) scaleX(${
            currentPose.flipX ? -1 : 1
          })`,
          transformOrigin: 'bottom center',
          filter: 'drop-shadow(0 14px 24px rgba(0,0,0,0.34))',
        }}
      >
        <Img
          src={staticFile(currentPose.file)}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
    </div>
  );
};
