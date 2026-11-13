import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { KaraokeCaptions } from '../components/KaraokeCaptions';
import { MascotNarrator } from '../components/MascotNarrator';
import { SAFE_ZONES, THEMES } from '../themes';
import { ProductClipProps } from '../types';

const bodyFont = 'MitrLocal';
const headlineFont = 'MaliLocal';

export const ProductClip: React.FC<ProductClipProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const baseTheme = THEMES[props.themeId] || THEMES.flash_sale;
  const theme = props.customAccent
    ? { ...baseTheme, primary: props.customAccent }
    : baseTheme;

  const images = props.images.length > 0 ? props.images : [];
  const mainImg = images[0];
  const sideLeftImg = images[1] || images[0];
  const sideRightImg = images[2] || images[1] || images[0];

  // 4-Scene Commercial Timeline
  const s1End = Math.floor(durationInFrames * 0.24); // HeroCollage
  const s2End = Math.floor(durationInFrames * 0.56); // FeatureGrid
  const s3End = Math.floor(durationInFrames * 0.76); // SpotlightZoom
  // s3End -> durationInFrames: ConversionCTA

  const isHero = frame < s1End;
  const isGrid = frame >= s1End && frame < s2End;
  const isSpotlight = frame >= s2End && frame < s3End;
  const isCta = frame >= s3End;

  const sceneIdx = isHero ? 0 : isGrid ? 1 : isSpotlight ? 2 : 3;
  const currentImg = images[sceneIdx % Math.max(images.length, 1)] || mainImg;

  const hookSpring = spring({ frame, fps, config: { damping: 12, stiffness: 165 } });
  const sideCardSpring = spring({ frame: Math.max(frame - 6, 0), fps, config: { damping: 13, stiffness: 130 } });
  const ctaSpring = spring({ frame: Math.max(frame - s3End, 0), fps, config: { damping: 12, stiffness: 150 } });

  const kenBurnsScale = interpolate(frame, [0, durationInFrames], [1.0, 1.12], {
    extrapolateRight: 'clamp',
  });
  const floatY = Math.sin(frame / 16) * 7;
  const ctaPulse = isCta ? 1 + Math.sin((frame - s3End) / 6) * 0.025 : 1;
  const progressPct = Math.min((frame / Math.max(durationInFrames - 1, 1)) * 100, 100);

  const discount =
    props.discountPercent ??
    (props.originalPrice && props.originalPrice > props.price
      ? Math.round(((props.originalPrice - props.price) / props.originalPrice) * 100)
      : 0);

  const activePointIdx = Math.min(
    Math.floor(
      interpolate(frame, [s1End, s2End], [0, Math.max(props.keyPoints.length, 1)], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    ),
    Math.max(props.keyPoints.length - 1, 0)
  );

  const ctaLabel =
    props.ctaMode === 'bio' && props.ctaText
      ? props.ctaText
      : props.ctaText || '🛒 กดดูสินค้าจากตะกร้าได้เลย!';

  return (
    <AbsoluteFill
      style={{
        background: theme.bgGradient,
        fontFamily: `${bodyFont}, ${headlineFont}, sans-serif`,
        color: theme.text,
        overflow: 'hidden',
      }}
    >
      <style>{`
        @font-face { font-family: 'MitrLocal'; src: url('${staticFile('fonts/Mitr-SemiBold.ttf')}') format('truetype'); font-weight: 600; font-style: normal; }
        @font-face { font-family: 'MitrLocal'; src: url('${staticFile('fonts/Mitr-Bold.ttf')}') format('truetype'); font-weight: 700; font-style: normal; }
        @font-face { font-family: 'MaliLocal'; src: url('${staticFile('fonts/Mali-Bold.ttf')}') format('truetype'); font-weight: 700; font-style: normal; }
      `}</style>

      {/* Voiceover Track */}
      {props.voiceoverFile && <Audio src={staticFile(props.voiceoverFile)} />}

      {/* Procedural SFX Tracks synced to 4 Scenes */}
      {props.enableSfx !== false && (
        <>
          <Sequence from={2} durationInFrames={18}>
            <Audio src={staticFile('sfx/pop.wav')} volume={0.22} />
          </Sequence>
          <Sequence from={Math.max(s1End, 15)} durationInFrames={20}>
            <Audio src={staticFile('sfx/whoosh.wav')} volume={0.18} />
          </Sequence>
          {props.keyPoints.slice(0, 3).map((_, idx) => {
            const ptFrame = Math.floor(s1End + ((s2End - s1End) * idx) / Math.max(props.keyPoints.length, 1));
            return (
              <Sequence key={`sfx-pt-${idx}`} from={Math.max(ptFrame, 12)} durationInFrames={24}>
                <Audio src={staticFile('sfx/ding.wav')} volume={0.16} />
              </Sequence>
            );
          })}
          <Sequence from={Math.max(s2End, 30)} durationInFrames={20}>
            <Audio src={staticFile('sfx/whoosh.wav')} volume={0.18} />
          </Sequence>
          <Sequence from={Math.max(s3End, 45)} durationInFrames={28}>
            <Audio src={staticFile('sfx/sparkle.wav')} volume={0.22} />
          </Sequence>
        </>
      )}

      {/* Ambient Animated Glow Orbs */}
      <div
        style={{
          position: 'absolute',
          top: 110 + Math.sin(frame / 26) * 32,
          left: -130,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: theme.primary,
          opacity: theme.isDark ? 0.16 : 0.13,
          filter: 'blur(95px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 240 + Math.cos(frame / 22) * 28,
          right: -110,
          width: 440,
          height: 440,
          borderRadius: '50%',
          background: theme.accent,
          opacity: theme.isDark ? 0.14 : 0.11,
          filter: 'blur(95px)',
        }}
      />

      {/* Top Progress Bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: 8,
          width: `${progressPct}%`,
          backgroundColor: theme.primary,
          zIndex: 40,
        }}
      />

      {/* Category Pill inside Top Safe Zone (no channel watermark) */}
      <div
        style={{
          position: 'absolute',
          top: SAFE_ZONES.top - 52,
          left: SAFE_ZONES.left,
          right: SAFE_ZONES.right,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 20,
        }}
      >
        <div
          style={{
            backgroundColor: theme.surface,
            border: `1.5px solid ${theme.surfaceBorder}`,
            color: theme.text,
            padding: '7px 18px',
            borderRadius: 999,
            fontSize: 22,
            fontWeight: 600,
          }}
        >
          ✨ ของแท้ · {props.category}
        </div>
      </div>

      {/* Main Content Container (Strictly within Safe Zones) */}
      <div
        style={{
          position: 'absolute',
          top: SAFE_ZONES.top + 12,
          bottom: SAFE_ZONES.bottomCard,
          left: SAFE_ZONES.left,
          right: SAFE_ZONES.right,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 18,
        }}
      >
        {/* Top Dynamic Headline Pill */}
        <div
          style={{
            transform: `scale(${interpolate(hookSpring, [0, 1], [0.88, 1])})`,
            backgroundColor: isHero ? theme.primary : theme.surface,
            border: `2px solid ${isHero ? theme.primary : theme.surfaceBorder}`,
            color: isHero ? theme.badgeText : theme.text,
            padding: '15px 26px',
            borderRadius: 22,
            textAlign: 'center',
            boxShadow: '0 12px 30px rgba(0,0,0,0.22)',
            width: '100%',
          }}
        >
          <div style={{ fontFamily: headlineFont, fontSize: 40, fontWeight: 700, lineHeight: 1.22 }}>
            {isHero
              ? props.hookText
              : isGrid
              ? 'ทำไมตัวนี้ถึงขายดี?'
              : isSpotlight
              ? props.productName
              : 'รีบกดก่อนหมดโปร!'}
          </div>
        </div>

        {/* Center Visual Stage: Hero Collage vs Feature Grid vs Spotlight */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Scene 1: Tilted Side Collage Cards behind Main Card */}
          {isHero && images.length > 1 && (
            <>
              <div
                style={{
                  position: 'absolute',
                  left: -8,
                  width: 240,
                  height: 300,
                  borderRadius: 24,
                  overflow: 'hidden',
                  border: `3px solid ${theme.surfaceBorder}`,
                  boxShadow: '0 14px 32px rgba(0,0,0,0.28)',
                  transform: `rotate(-8deg) scale(${interpolate(sideCardSpring, [0, 1], [0.7, 1])})`,
                  zIndex: 5,
                }}
              >
                <Img src={staticFile(sideLeftImg)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div
                style={{
                  position: 'absolute',
                  right: -8,
                  width: 240,
                  height: 300,
                  borderRadius: 24,
                  overflow: 'hidden',
                  border: `3px solid ${theme.surfaceBorder}`,
                  boxShadow: '0 14px 32px rgba(0,0,0,0.28)',
                  transform: `rotate(8deg) scale(${interpolate(sideCardSpring, [0, 1], [0.7, 1])})`,
                  zIndex: 5,
                }}
              >
                <Img src={staticFile(sideRightImg)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </>
          )}

          {/* Main Center Product Frame */}
          <div
            style={{
              position: 'relative',
              width: isHero && images.length > 1 ? '76%' : '100%',
              height: isGrid ? '56%' : '100%',
              alignSelf: isGrid ? 'flex-start' : 'center',
              borderRadius: 30,
              overflow: 'hidden',
              backgroundColor: theme.surface,
              border: `3px solid ${theme.surfaceBorder}`,
              boxShadow: '0 24px 52px rgba(0, 0, 0, 0.32)',
              transform: `translateY(${floatY}px)`,
              zIndex: 10,
            }}
          >
            {currentImg && (
              <Img
                src={staticFile(currentImg)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: `scale(${isSpotlight ? kenBurnsScale * 1.08 : kenBurnsScale})`,
                }}
              />
            )}

            {discount > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: 20,
                  right: 20,
                  backgroundColor: theme.accent,
                  color: '#111827',
                  padding: '8px 20px',
                  borderRadius: 999,
                  fontSize: 26,
                  fontWeight: 800,
                  boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
                }}
              >
                ลด {discount}%
              </div>
            )}
          </div>

          {/* Scene 2: Animated Feature Checklist Overlay below top card */}
          {isGrid && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '41%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 12,
                zIndex: 12,
              }}
            >
              {props.keyPoints.slice(0, 3).map((pt, idx) => {
                const isActive = idx === activePointIdx;
                return (
                  <div
                    key={`kp-${idx}`}
                    style={{
                      backgroundColor: isActive ? theme.primary : theme.surface,
                      color: isActive ? theme.badgeText : theme.text,
                      border: `2px solid ${isActive ? theme.accent : theme.surfaceBorder}`,
                      borderRadius: 18,
                      padding: '14px 20px',
                      fontSize: 27,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      boxShadow: isActive ? '0 10px 26px rgba(0,0,0,0.28)' : 'none',
                      transform: `scale(${isActive ? 1.02 : 0.98})`,
                    }}
                  >
                    <span
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        backgroundColor: isActive ? theme.accent : theme.primary,
                        color: isActive ? '#111827' : theme.badgeText,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {pt}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Stage: Product Strip or Pulsing Conversion CTA */}
        {isCta ? (
          <div
            style={{
              width: '100%',
              backgroundColor: theme.surface,
              border: `2.5px solid ${theme.primary}`,
              borderRadius: 26,
              padding: '16px 24px',
              textAlign: 'center',
              transform: `scale(${interpolate(ctaSpring, [0, 1], [0.9, 1]) * ctaPulse})`,
              boxShadow: '0 16px 36px rgba(0,0,0,0.28)',
            }}
          >
            {props.price > 0 && (
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 16 }}>
                {props.originalPrice && props.originalPrice > props.price && (
                  <span style={{ fontSize: 32, color: theme.mutedText, textDecoration: 'line-through', fontWeight: 600 }}>
                    ฿{props.originalPrice}
                  </span>
                )}
                <span style={{ fontFamily: headlineFont, fontSize: 64, fontWeight: 700, color: theme.primary, lineHeight: 1.05 }}>
                  ฿{props.price}
                </span>
              </div>
            )}
            <div
              style={{
                marginTop: 10,
                background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})`,
                color: theme.badgeText,
                padding: '13px 22px',
                borderRadius: 999,
                fontSize: 28,
                fontWeight: 800,
                boxShadow: '0 8px 20px rgba(0,0,0,0.22)',
              }}
            >
              {ctaLabel}
            </div>
          </div>
        ) : (
          <div
            style={{
              width: '100%',
              backgroundColor: theme.surface,
              border: `1.5px solid ${theme.surfaceBorder}`,
              borderRadius: 20,
              padding: '14px 22px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 29, fontWeight: 700, color: theme.text }}>
              {props.productName}
            </div>
          </div>
        )}
      </div>

      {/* Signature Channel Mascot Narrator (4-Corner Dynamic Hopping + Lip-Sync) */}
      <MascotNarrator sceneIdx={sceneIdx} captions={props.captions} theme={theme} />

      {/* Thai Karaoke Captions */}
      <KaraokeCaptions lines={props.captions} theme={theme} />
    </AbsoluteFill>
  );
};
