import React from 'react';
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { BrandTheme } from '../themes';
import { CaptionLine, MascotId } from '../types';

interface Props {
  sceneIdx: number; // 0: Hero (Full), 1: Grid (Wobble Head), 2: Spotlight (Wobble Head), 3: CTA (Full + Basket)
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

  // Scene 1 Walk-in Entrance (frames 0..24)
  const walkProgress = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 95, mass: 0.9 },
  });
  const walkX = interpolate(walkProgress, [0, 1], [-210, 0]);
  const isWalkingIn = frame < 24;

  // Smooth transition when switching between Full-Body & Wobble-Head scenes
  const poseTransition = spring({
    frame: Math.max(frame - sceneStartFrame, 0),
    fps,
    config: { damping: 13, stiffness: 145 },
  });
  const poseScale = interpolate(poseTransition, [0, 0.5, 1], [0.85, 1.05, 1.0]);

  const isHeadMode = sceneIdx === 1 || sceneIdx === 2;

  // Gentle Full-Body vs Expressive Pendulum Wobble Head Physics
  const stepY = isWalkingIn
    ? Math.abs(Math.sin(frame * 0.55)) * -14
    : isHeadMode
    ? Math.sin(frame / 5.5) * -5
    : isSpeaking
    ? Math.sin(frame / 5.5) * -4.5
    : Math.sin(frame / 14) * -3;

  const bodyTilt = isWalkingIn
    ? Math.sin(frame * 0.55) * 6
    : isHeadMode
    ? Math.sin(frame / 4.8) * 8.5 // Smooth ดุ๊กดิ๊ก pendulum wobble!
    : isSpeaking
    ? Math.sin(frame / 9) * 2.2
    : Math.sin(frame / 18) * 1.2;

  const breatheScaleY = isHeadMode
    ? 1 + Math.sin(frame / 4.8) * 0.025
    : isSpeaking
    ? 1 + Math.sin(frame / 5.5) * 0.015
    : 1;

  const particles =
    sceneIdx === 2
      ? ['💕', '✨', '🌸']
      : sceneIdx === 3
      ? ['🛒', '✨', '🔥']
      : ['✨', '⭐'];

  const fullSprite =
    sceneIdx === 3 ? `mascot/${mascotId}/basket.png` : `mascot/${mascotId}/wave.png`;
  const headSprite =
    sceneIdx === 2 ? `mascot/${mascotId}/head_love.png` : `mascot/${mascotId}/head_excited.png`;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 260,
        left: 24,
        width: 240,
        height: 320,
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
          width: 185,
          height: 42,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.primary}66 0%, transparent 72%)`,
          filter: 'blur(6px)',
        }}
      />

      {/* Gentle Floating Emotion Particles beside Mascot (Safe inside Stage Bounds) */}
      {particles.map((emoji, idx) => {
        const cycle = (frame + idx * 22) % 60;
        const pY = interpolate(cycle, [0, 60], [0, -34]);
        const pOpacity = interpolate(cycle, [0, 12, 46, 60], [0, 0.9, 0.9, 0]);
        const pX = idx === 0 ? -74 : idx === 1 ? 58 : -12;
        return (
          <div
            key={`pt-${idx}`}
            style={{
              position: 'absolute',
              top: isHeadMode ? 74 : 38,
              left: '50%',
              marginLeft: pX,
              fontSize: 24,
              opacity: pOpacity,
              transform: `translateY(${pY}px)`,
              filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.2))',
            }}
          >
            {emoji}
          </div>
        );
      })}

      {isHeadMode ? (
        /* Scene 2 & 3: Expressive Wobble Head Badge (หัวมาสคอตดุ๊กดิ๊กเห็นสีหน้าชัด 2.5x) */
        <div
          style={{
            width: 216,
            height: 216,
            marginBottom: 14,
            borderRadius: '50%',
            background: `linear-gradient(145deg, #FFFFFF 0%, ${theme.surface} 100%)`,
            border: `5px solid ${theme.primary}`,
            boxShadow: `0 14px 30px rgba(0,0,0,0.28), 0 0 0 6px ${theme.primary}33`,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `translateY(${stepY}px) rotate(${bodyTilt}deg) scale(${poseScale}) scaleY(${breatheScaleY})`,
            transformOrigin: '50% 85%',
          }}
        >
          <Img
            src={staticFile(headSprite)}
            style={{
              width: '108%',
              height: '108%',
              objectFit: 'cover',
              objectPosition: 'center top',
              transform: sceneIdx === 1 ? 'scaleX(-1)' : 'none',
            }}
          />
        </div>
      ) : (
        /* Scene 1 & 4: Full-Body Mascot (Walk-in Wave & Orange Basket CTA) */
        <div
          style={{
            width: 240,
            height: 318,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `translateY(${stepY}px) rotate(${bodyTilt}deg) scale(${poseScale}) scaleY(${breatheScaleY})`,
            transformOrigin: 'bottom center',
            filter: 'drop-shadow(0 14px 24px rgba(0,0,0,0.34))',
          }}
        >
          <Img
            src={staticFile(fullSprite)}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  );
};
