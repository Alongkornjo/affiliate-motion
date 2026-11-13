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
import { SAFE_ZONES, THEMES } from '../themes';
import { ProductClipProps } from '../types';

const promptFont = 'PromptLocal';
const kanitFont = 'KanitLocal';

export const ProductClip: React.FC<ProductClipProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const theme = THEMES[props.themeId] || THEMES.flash_sale;

  const images = props.images.length > 0 ? props.images : [];
  const sceneSpan = Math.max(Math.floor(durationInFrames / Math.max(images.length, 1)), 1);
  const currentImgIdx = Math.min(Math.floor(frame / sceneSpan), Math.max(images.length - 1, 0));
  const currentImg = images[currentImgIdx];

  const hookEnd = Math.min(Math.floor(fps * 3.5), Math.floor(durationInFrames * 0.25));
  const ctaStart = Math.max(Math.floor(durationInFrames * 0.72), hookEnd + 30);

  const hookSpring = spring({ frame, fps, config: { damping: 12, stiffness: 160 } });
  const cardSpring = spring({ frame: Math.max(frame - 4, 0), fps, config: { damping: 14, stiffness: 120 } });
  const ctaSpring = spring({ frame: Math.max(frame - ctaStart, 0), fps, config: { damping: 13, stiffness: 150 } });

  const kenBurnsScale = interpolate(
    frame % sceneSpan,
    [0, sceneSpan],
    [1.0, 1.09],
    { extrapolateRight: 'clamp' }
  );
  const floatY = Math.sin(frame / 18) * 6;
  const progressPct = Math.min((frame / Math.max(durationInFrames - 1, 1)) * 100, 100);

  const discount =
    props.discountPercent ??
    (props.originalPrice && props.originalPrice > props.price
      ? Math.round(((props.originalPrice - props.price) / props.originalPrice) * 100)
      : 0);

  const activePointIdx = Math.min(
    Math.floor(
      interpolate(frame, [hookEnd, ctaStart], [0, Math.max(props.keyPoints.length, 1)], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    ),
    Math.max(props.keyPoints.length - 1, 0)
  );

  const isSplitTop = props.layoutVariant === 'split_top';
  const isFloatingBadge = props.layoutVariant === 'floating_badge';
  const isCarousel = props.layoutVariant === 'feature_carousel';

  return (
    <AbsoluteFill
      style={{
        background: theme.bgGradient,
        fontFamily: `${promptFont}, ${kanitFont}, sans-serif`,
        color: theme.text,
        overflow: 'hidden',
      }}
    >
      <style>{`
        @font-face { font-family: 'PromptLocal'; src: url('${staticFile('fonts/Prompt-SemiBold.ttf')}') format('truetype'); font-weight: 600; font-style: normal; }
        @font-face { font-family: 'PromptLocal'; src: url('${staticFile('fonts/Prompt-Bold.ttf')}') format('truetype'); font-weight: 700; font-style: normal; }
        @font-face { font-family: 'KanitLocal'; src: url('${staticFile('fonts/Kanit-ExtraBold.ttf')}') format('truetype'); font-weight: 800; font-style: normal; }
      `}</style>
      {/* Voiceover Track */}
      {props.voiceoverFile && <Audio src={staticFile(props.voiceoverFile)} />}

      {/* Procedural SFX Tracks */}
      {props.enableSfx !== false && (
        <>
          <Sequence from={2} durationInFrames={18}>
            <Audio src={staticFile('sfx/pop.wav')} volume={0.22} />
          </Sequence>
          {hookEnd > 20 && (
            <Sequence from={hookEnd} durationInFrames={20}>
              <Audio src={staticFile('sfx/whoosh.wav')} volume={0.18} />
            </Sequence>
          )}
          {props.keyPoints.slice(0, 3).map((_, idx) => {
            const ptFrame = Math.floor(
              hookEnd + ((ctaStart - hookEnd) * idx) / Math.max(props.keyPoints.length, 1)
            );
            return (
              <Sequence key={`sfx-pt-${idx}`} from={Math.max(ptFrame, 10)} durationInFrames={24}>
                <Audio src={staticFile('sfx/ding.wav')} volume={0.16} />
              </Sequence>
            );
          })}
          <Sequence from={ctaStart} durationInFrames={25}>
            <Audio src={staticFile('sfx/sparkle.wav')} volume={0.22} />
          </Sequence>
        </>
      )}

      {/* Ambient Animated Glow Orbs */}
      <div
        style={{
          position: 'absolute',
          top: 120 + Math.sin(frame / 28) * 30,
          left: -120,
          width: 480,
          height: 480,
          borderRadius: '50%',
          background: theme.primary,
          opacity: theme.isDark ? 0.14 : 0.12,
          filter: 'blur(90px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 260 + Math.cos(frame / 24) * 25,
          right: -100,
          width: 420,
          height: 420,
          borderRadius: '50%',
          background: theme.accent,
          opacity: theme.isDark ? 0.12 : 0.1,
          filter: 'blur(90px)',
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

      {/* Brand Header inside Top Safe Zone */}
      <div
        style={{
          position: 'absolute',
          top: SAFE_ZONES.top - 50,
          left: SAFE_ZONES.left,
          right: SAFE_ZONES.right,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 20,
        }}
      >
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: theme.mutedText,
            letterSpacing: 0.3,
          }}
        >
          {props.brandHandle || '@AffiliateMotion'}
        </div>
        <div
          style={{
            backgroundColor: theme.surface,
            border: `1.5px solid ${theme.surfaceBorder}`,
            color: theme.text,
            padding: '8px 18px',
            borderRadius: 999,
            fontSize: 22,
            fontWeight: 600,
          }}
        >
          {props.category}
        </div>
      </div>

      {/* Main Content Container (Strictly within Safe Zones) */}
      <div
        style={{
          position: 'absolute',
          top: SAFE_ZONES.top + 16,
          bottom: SAFE_ZONES.bottomCard,
          left: SAFE_ZONES.left,
          right: SAFE_ZONES.right,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: isSplitTop ? 'flex-start' : 'space-between',
          alignItems: 'center',
          gap: 20,
        }}
      >
        {/* Top Hook / Scene Headline Banner */}
        <div
          style={{
            transform: `scale(${interpolate(hookSpring, [0, 1], [0.85, 1])})`,
            backgroundColor: frame < hookEnd ? theme.primary : theme.surface,
            border: `2px solid ${frame < hookEnd ? theme.primary : theme.surfaceBorder}`,
            color: frame < hookEnd ? theme.badgeText : theme.text,
            padding: '16px 28px',
            borderRadius: 22,
            textAlign: 'center',
            boxShadow: '0 12px 30px rgba(0,0,0,0.22)',
            width: '100%',
          }}
        >
          <div
            style={{
              fontFamily: kanitFont,
              fontSize: 42,
              fontWeight: 800,
              lineHeight: 1.2,
            }}
          >
            {frame < hookEnd
              ? props.hookText
              : frame >= ctaStart
              ? 'รีบกดก่อนหมดโปร!'
              : props.keyPoints[activePointIdx] || props.productName}
          </div>
        </div>

        {/* Product Visual Showcase Card */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            flex: 1,
            minHeight: 460,
            maxHeight: 680,
            borderRadius: 32,
            overflow: 'hidden',
            backgroundColor: theme.surface,
            border: `3px solid ${theme.surfaceBorder}`,
            boxShadow: '0 22px 50px rgba(0, 0, 0, 0.28)',
            transform: `translateY(${isFloatingBadge ? floatY : 0}px) scale(${interpolate(
              cardSpring,
              [0, 1],
              [0.92, 1]
            )})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {currentImg && (
            <Img
              src={staticFile(currentImg)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: `scale(${kenBurnsScale})`,
              }}
            />
          )}

          {/* Product Number Badge (#NO) */}
          <div
            style={{
              position: 'absolute',
              top: 22,
              left: 22,
              backgroundColor: theme.primary,
              color: theme.badgeText,
              padding: '10px 22px',
              borderRadius: 999,
              fontSize: 30,
              fontWeight: 800,
              boxShadow: '0 6px 18px rgba(0,0,0,0.28)',
            }}
          >
            #{props.no}
          </div>

          {/* Discount Badge */}
          {discount > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 22,
                right: 22,
                backgroundColor: theme.accent,
                color: '#111827',
                padding: '10px 22px',
                borderRadius: 999,
                fontSize: 28,
                fontWeight: 800,
                boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
              }}
            >
              ลด {discount}%
            </div>
          )}

          {/* Multi-image Thumbnail Strip (for Carousel or multi-angle) */}
          {isCarousel && images.length > 1 && (
            <div
              style={{
                position: 'absolute',
                bottom: 18,
                left: 18,
                right: 18,
                display: 'flex',
                gap: 12,
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.55)',
                padding: 10,
                borderRadius: 18,
              }}
            >
              {images.slice(0, 4).map((img, i) => (
                <div
                  key={`thumb-${i}`}
                  style={{
                    width: 82,
                    height: 82,
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: i === currentImgIdx ? `3px solid ${theme.accent}` : '2px solid rgba(255,255,255,0.35)',
                  }}
                >
                  <Img src={staticFile(img)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Feature Strip / PriceTag CTA */}
        {frame >= ctaStart ? (
          <div
            style={{
              width: '100%',
              backgroundColor: theme.surface,
              border: `2.5px solid ${theme.primary}`,
              borderRadius: 24,
              padding: '18px 26px',
              textAlign: 'center',
              transform: `scale(${interpolate(ctaSpring, [0, 1], [0.9, 1])})`,
              boxShadow: '0 14px 32px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 18 }}>
              {props.originalPrice && props.originalPrice > props.price && (
                <span
                  style={{
                    fontSize: 34,
                    color: theme.mutedText,
                    textDecoration: 'line-through',
                    fontWeight: 600,
                  }}
                >
                  ฿{props.originalPrice}
                </span>
              )}
              <span
                style={{
                  fontFamily: kanitFont,
                  fontSize: 64,
                  fontWeight: 800,
                  color: theme.primary,
                  lineHeight: 1.05,
                }}
              >
                ฿{props.price}
              </span>
            </div>
            <div
              style={{
                marginTop: 10,
                backgroundColor: theme.primary,
                color: theme.badgeText,
                padding: '12px 20px',
                borderRadius: 999,
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              {props.ctaText}
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
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 30, fontWeight: 700, color: theme.text }}>
              {props.productName}
            </div>
            <div style={{ fontSize: 24, fontWeight: 500, color: theme.mutedText }}>
              {props.problemText || props.keyPoints[0] || ''}
            </div>
          </div>
        )}
      </div>

      {/* Thai Karaoke Captions (Word-level highlighted, natural Thai spacing) */}
      <KaraokeCaptions lines={props.captions} theme={theme} />
    </AbsoluteFill>
  );
};
