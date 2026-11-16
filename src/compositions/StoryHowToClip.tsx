import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { KaraokeCaptions } from '../components/KaraokeCaptions';
import { THEMES } from '../themes';
import { CaptionLine, ThemeId } from '../types';

const bodyFont = 'MitrLocal';
const headlineFont = 'MaliLocal';

export interface StoryShot {
  image: string;
  startSec: number;
  endSec: number;
  phase: 'problem' | 'solve' | 'step1' | 'step2' | 'step3' | 'before_after' | 'lineup' | 'cta';
  motion?: 'zoom_in' | 'zoom_out';
  pillText?: string;
  pillColor?: string;
  title?: string;
  subTitle?: string;
  splitBeforeImage?: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export interface StoryHowToClipProps {
  no: string;
  productName: string;
  themeId: ThemeId;
  customAccent?: string;
  hookBadge?: string;
  hookHeadline?: string;
  hookSub?: string;
  ctaText?: string;
  voiceoverFile: string;
  captions: CaptionLine[];
  durationInSec: number;
  enableSfx?: boolean;
  shots: StoryShot[];
}

export const StoryHowToClip: React.FC<StoryHowToClipProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;

  const baseTheme = THEMES[props.themeId] || THEMES.warm_home;
  const theme = props.customAccent ? { ...baseTheme, primary: props.customAccent } : baseTheme;

  const shots = props.shots || [];
  const activeShot =
    shots.find((s) => t >= s.startSec && t < s.endSec) ||
    shots[shots.length - 1] || {
      image: '',
      startSec: 0,
      endSec: props.durationInSec || 30,
      phase: 'problem' as const,
      motion: 'zoom_in' as const,
    };

  const shotDur = Math.max(activeShot.endSec - activeShot.startSec, 1);
  const shotProgress = Math.min(Math.max((t - activeShot.startSec) / shotDur, 0), 1);
  const scale =
    activeShot.motion === 'zoom_out'
      ? interpolate(shotProgress, [0, 1], [1.055, 1.0])
      : interpolate(shotProgress, [0, 1], [1.0, 1.055]);

  const shotStartFrame = Math.round(activeShot.startSec * fps);
  const enterSpring = spring({
    frame: Math.max(frame - shotStartFrame, 0),
    fps,
    config: { damping: 16, stiffness: 140 },
  });

  const isProblem = activeShot.phase === 'problem';
  const isBeforeAfter = activeShot.phase === 'before_after' && Boolean(activeShot.splitBeforeImage);
  const isCta = activeShot.phase === 'cta' || activeShot.phase === 'lineup';

  const pillBg =
    activeShot.pillColor ||
    (isProblem
      ? '#DC2626'
      : activeShot.phase === 'solve'
      ? '#F97316'
      : isBeforeAfter
      ? '#16A34A'
      : theme.primary);

  return (
    <AbsoluteFill style={{ backgroundColor: '#0F172A', fontFamily: bodyFont, overflow: 'hidden' }}>
      <style>{`
        @font-face { font-family: 'MitrLocal'; src: url('${staticFile('fonts/Mitr-SemiBold.ttf')}') format('truetype'); font-weight: 600; font-style: normal; }
        @font-face { font-family: 'MitrLocal'; src: url('${staticFile('fonts/Mitr-Bold.ttf')}') format('truetype'); font-weight: 700; font-style: normal; }
        @font-face { font-family: 'MaliLocal'; src: url('${staticFile('fonts/Mali-Bold.ttf')}') format('truetype'); font-weight: 700; font-style: normal; }
      `}</style>
      {/* Audio: Voiceover + gentle BGM */}
      {props.voiceoverFile && <Audio src={staticFile(props.voiceoverFile)} volume={1.0} />}
      {props.enableSfx !== false && (
        <Audio src={staticFile('sfx/bgm_upbeat.wav')} volume={0.055} loop />
      )}

      {/* Full-Bleed Edge-to-Edge Realistic Photography (or Side-by-Side Before/After) */}
      {isBeforeAfter && activeShot.splitBeforeImage ? (
        <AbsoluteFill style={{ flexDirection: 'row', display: 'flex' }}>
          <div style={{ flex: 1, height: '100%', overflow: 'hidden', position: 'relative' }}>
            <Img
              src={staticFile(activeShot.splitBeforeImage)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: `scale(${scale})`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 390,
                left: 36,
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                fontSize: 34,
                fontWeight: 800,
                padding: '10px 26px',
                borderRadius: 999,
                boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              }}
            >
              {activeShot.beforeLabel || 'BEFORE'}
            </div>
          </div>

          {/* Center white divider */}
          <div style={{ width: 6, height: '100%', backgroundColor: '#FFFFFF', zIndex: 10 }} />

          <div style={{ flex: 1, height: '100%', overflow: 'hidden', position: 'relative' }}>
            <Img
              src={staticFile(activeShot.image)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: `scale(${scale})`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 390,
                right: 36,
                backgroundColor: '#16A34A',
                color: '#FFFFFF',
                fontSize: 34,
                fontWeight: 800,
                padding: '10px 26px',
                borderRadius: 999,
                boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              }}
            >
              {activeShot.afterLabel || 'AFTER'}
            </div>
          </div>
        </AbsoluteFill>
      ) : (
        activeShot.image && (
          <AbsoluteFill>
            <Img
              src={staticFile(activeShot.image)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: `scale(${scale})`,
              }}
            />
          </AbsoluteFill>
        )
      )}

      {/* Subtle top & bottom gradient scrims for crisp text readability without hiding the photo */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 460,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.18) 65%, rgba(0,0,0,0) 100%)',
          pointerEvents: 'none',
          zIndex: 12,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 440,
          background: 'linear-gradient(0deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0) 100%)',
          pointerEvents: 'none',
          zIndex: 12,
        }}
      />

      {/* Top Overlay: Type-A 3-Tier Big Hook Banner for Problem Phase, Compact Pill + Title for Solve/Steps */}
      {isProblem ? (
        <div
          style={{
            position: 'absolute',
            top: 150,
            left: 48,
            right: 48,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            zIndex: 20,
            transform: `translateY(${interpolate(enterSpring, [0, 1], [-18, 0])}px)`,
          }}
        >
          <div
            style={{
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              fontSize: 34,
              fontWeight: 800,
              padding: '10px 28px',
              borderRadius: 999,
              border: '2px solid rgba(255,255,255,0.65)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            }}
          >
            {activeShot.pillText || props.hookBadge || '❌ ปัญหาที่เจอบ่อย'}
          </div>
          <div
            style={{
              backgroundColor: '#FFFFFF',
              color: '#111827',
              fontFamily: headlineFont,
              fontSize: 64,
              fontWeight: 900,
              lineHeight: 1.2,
              padding: '14px 34px',
              borderRadius: 28,
              textAlign: 'center',
              boxShadow: '0 12px 32px rgba(0,0,0,0.28)',
            }}
          >
            {activeShot.title || props.hookHeadline}
          </div>
          {(activeShot.subTitle || props.hookSub) && (
            <div
              style={{
                backgroundColor: theme.primary,
                color: '#FFFFFF',
                fontSize: 38,
                fontWeight: 800,
                padding: '10px 30px',
                borderRadius: 999,
                border: '2px solid rgba(255,255,255,0.75)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.28)',
              }}
            >
              {activeShot.subTitle || props.hookSub}
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            position: 'absolute',
            top: 155,
            left: 56,
            right: 56,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            zIndex: 20,
          }}
        >
          {activeShot.pillText && (
            <div
              style={{
                backgroundColor: pillBg,
                color: '#FFFFFF',
                fontSize: 34,
                fontWeight: 800,
                padding: '9px 28px',
                borderRadius: 999,
                border: '2px solid rgba(255,255,255,0.7)',
                boxShadow: '0 8px 22px rgba(0,0,0,0.28)',
              }}
            >
              {activeShot.pillText}
            </div>
          )}
          {activeShot.title && (
            <div
              style={{
                color: '#FFFFFF',
                fontFamily: headlineFont,
                fontSize: 54,
                fontWeight: 900,
                textAlign: 'center',
                lineHeight: 1.24,
                textShadow:
                  '0 4px 18px rgba(0,0,0,0.85), 0 2px 6px rgba(0,0,0,0.95)',
              }}
            >
              {activeShot.title}
            </div>
          )}
        </div>
      )}

      {/* CTA Pill (shown during lineup / cta phase) */}
      {isCta && (
        <div
          style={{
            position: 'absolute',
            bottom: 390,
            left: 72,
            right: 104,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 25,
          }}
        >
          <div
            style={{
              background: theme.ctaGradient,
              color: '#FFFFFF',
              fontSize: 38,
              fontWeight: 800,
              padding: '18px 36px',
              borderRadius: 26,
              border: '2px solid rgba(255,255,255,0.8)',
              boxShadow: '0 14px 36px rgba(0,0,0,0.35)',
              textAlign: 'center',
            }}
          >
            {props.ctaText || '🛒 กดเลือกขนาดจากตะกร้าด้านล่าง!'}
          </div>
        </div>
      )}

      {/* Clean Full-Width Karaoke Captions (NO Mascot, NO Mascot Tag) */}
      <KaraokeCaptions
        lines={props.captions}
        theme={theme}
        fullWidth
        hideMascotTag
      />
    </AbsoluteFill>
  );
};
