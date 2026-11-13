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
import { SAFE_ZONES, THEMES, pickMascotByCategory } from '../themes';
import { CaptionLine, ProductClipProps } from '../types';

const bodyFont = 'MitrLocal';
const headlineFont = 'MaliLocal';

/** Blurred-glass backdrop + crisp full-frame product image so text/swatches are never cropped */
const ProductStageImage: React.FC<{ src: string; zoom?: number }> = ({ src, zoom = 1 }) => (
  <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
    <Img
      src={staticFile(src)}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: 'scale(1.18)',
        filter: 'blur(26px) brightness(0.88)',
        opacity: 0.72,
      }}
    />
    <Img
      src={staticFile(src)}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        transform: `scale(${zoom})`,
        filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.16))',
      }}
    />
  </div>
);

/** Align scene transitions cleanly to spoken caption line boundaries & key phrases */
function computeSceneBounds(
  captions: CaptionLine[],
  durationInFrames: number,
  fps: number
): [number, number, number] {
  const def1 = Math.floor(durationInFrames * 0.24);
  const def2 = Math.floor(durationInFrames * 0.56);
  const def3 = Math.floor(durationInFrames * 0.78);

  if (!captions || captions.length < 4) {
    return [def1, def2, def3];
  }

  const lineEnds = captions.map((l) => Math.round(l.end * fps));
  const closestEnd = (target: number, minF: number, maxF: number) => {
    const cands = lineEnds.filter((f) => f >= minF && f <= maxF);
    if (cands.length === 0) return target;
    return cands.reduce((best, cur) => (Math.abs(cur - target) < Math.abs(best - target) ? cur : best), cands[0]);
  };

  // Lock Scene 4 (CTA) to start of the final CTA line when it mentions basket/order
  const ctaLine = [...captions]
    .reverse()
    .find((l) => /ตะกร้า|กดดู|สั่งซื้อ|พิกัด|ลิงก์/.test(l.text));
  let s3End = def3;
  if (ctaLine) {
    const cand = Math.round(ctaLine.start * fps);
    if (cand >= Math.floor(durationInFrames * 0.65) && cand <= Math.floor(durationInFrames * 0.92)) {
      s3End = cand;
    }
  } else {
    s3End = closestEnd(def3, Math.floor(durationInFrames * 0.68), Math.floor(durationInFrames * 0.88));
  }

  // Lock Scene 3 (Spotlight / Shades) to start of line mentioning shades/colors/texture if in mid-section
  const spotLine = captions.find(
    (l) => /เฉดสี|สี|โทน|เนื้อ|ขนาด|วิธีใช้/.test(l.text) && l.start * fps >= durationInFrames * 0.44
  );
  let s2End = def2;
  if (spotLine) {
    const cand = Math.round(spotLine.start * fps);
    if (cand < s3End - fps * 2.5) {
      s2End = cand;
    }
  } else {
    s2End = closestEnd(def2, Math.floor(durationInFrames * 0.45), s3End - fps * 2);
  }

  const s1End = closestEnd(def1, Math.floor(durationInFrames * 0.16), Math.min(s2End - fps * 2.5, Math.floor(durationInFrames * 0.34)));

  return [s1End, s2End, s3End];
}

export const ProductClip: React.FC<ProductClipProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const baseTheme = THEMES[props.themeId] || THEMES.flash_sale;
  const theme = props.customAccent
    ? { ...baseTheme, primary: props.customAccent }
    : baseTheme;

  const images = props.images.length > 0 ? props.images : [];
  const mainImg = images[0];
  const sideLeftImg = images[5] || images[1] || images[0];
  const sideRightImg = images[6] || images[2] || images[1] || images[0];

  // Speech-Synced 4-Scene Commercial Timeline
  const [s1End, s2End, s3End] = computeSceneBounds(props.captions, durationInFrames, fps);

  const isHero = frame < s1End;
  const isGrid = frame >= s1End && frame < s2End;
  const isSpotlight = frame >= s2End && frame < s3End;
  const isCta = frame >= s3End;

  const sceneIdx = isHero ? 0 : isGrid ? 1 : isSpotlight ? 2 : 3;

  const hookSpring = spring({ frame, fps, config: { damping: 12, stiffness: 165 } });
  const sideCardSpring = spring({ frame: Math.max(frame - 6, 0), fps, config: { damping: 13, stiffness: 130 } });
  const ctaSpring = spring({ frame: Math.max(frame - s3End, 0), fps, config: { damping: 12, stiffness: 150 } });

  // Gentle 1.0 -> 1.04 Ken Burns so full product edges stay visible
  const kenBurnsScale = interpolate(frame, [0, durationInFrames], [1.0, 1.04], {
    extrapolateRight: 'clamp',
  });
  const floatY = Math.sin(frame / 16) * 5;
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

  const spotMid = Math.floor((s2End + s3End) / 2);
  const gridImages = [
    images[6] || images[1] || mainImg,
    images[1] || images[2] || mainImg,
    images[4] || images[3] || mainImg,
  ];
  const currentImg = isHero
    ? mainImg
    : isGrid
    ? gridImages[activePointIdx % gridImages.length]
    : isSpotlight
    ? frame < spotMid
      ? images[2] || images[1] || mainImg
      : images[5] || images[3] || mainImg
    : images[3] || images[5] || mainImg;

  const rawCtaText =
    props.ctaMode === 'bio' && props.ctaText
      ? props.ctaText
      : props.ctaText || 'กดดูสินค้าจากตะกร้าได้เลย!';
  const cleanCtaText = rawCtaText.replace(/^[\u{1F300}-\u{1FAFF}\s]+/u, '').trim() || 'กดดูสินค้าจากตะกร้าได้เลย!';

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

      {/* Subtle Upbeat BGM + Procedural SFX Synced to Speech-Matched Scenes */}
      {props.enableSfx !== false && (
        <>
          <Audio src={staticFile('sfx/bgm_upbeat.wav')} loop volume={0.075} />
          <Sequence from={2} durationInFrames={18}>
            <Audio src={staticFile('sfx/pop.wav')} volume={0.2} />
          </Sequence>
          <Sequence from={Math.max(s1End, 15)} durationInFrames={20}>
            <Audio src={staticFile('sfx/whoosh.wav')} volume={0.18} />
          </Sequence>
          {props.keyPoints.slice(0, 3).map((_, idx) => {
            const ptFrame = Math.floor(s1End + ((s2End - s1End) * idx) / Math.max(props.keyPoints.length, 1));
            return (
              <Sequence key={`sfx-pt-${idx}`} from={Math.max(ptFrame, 12)} durationInFrames={24}>
                <Audio src={staticFile('sfx/ding.wav')} volume={0.15} />
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

      {/* Main Content Container (Strictly within Safe Zones, above Presenter Stage) */}
      <div
        style={{
          position: 'absolute',
          top: SAFE_ZONES.top + 12,
          bottom: isCta ? 595 : 580,
          left: SAFE_ZONES.left,
          right: SAFE_ZONES.right,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
        }}
      >
        {/* Top Dynamic Headline Pill (Soft Rounded Glass) */}
        <div
          style={{
            transform: `scale(${interpolate(hookSpring, [0, 1], [0.88, 1])})`,
            background: isHero ? theme.ctaGradient : theme.surface,
            backdropFilter: 'blur(14px)',
            border: isHero ? 'none' : `1.5px solid ${theme.surfaceBorder}`,
            color: isHero ? theme.badgeText : theme.text,
            padding: '15px 26px',
            borderRadius: 28,
            textAlign: 'center',
            boxShadow: isHero
              ? '0 14px 32px rgba(255, 61, 104, 0.24)'
              : '0 10px 28px rgba(0, 0, 0, 0.08)',
            width: '100%',
          }}
        >
          <div style={{ fontFamily: headlineFont, fontSize: 35, fontWeight: 700, lineHeight: 1.25 }}>
            {isHero
              ? props.hookText
              : isGrid
              ? 'ทำไมตัวนี้ถึงขายดี?'
              : isSpotlight
              ? props.spotlightTitle || props.productName
              : props.ctaHeadline || 'เล็งสีที่ชอบไว้แล้วใช่ไหม? จิ้มดูในตะกร้าเลย!'}
          </div>
        </div>

        {/* Center Visual Stage: Hero Collage vs Feature Grid vs Spotlight */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
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
                  borderRadius: 26,
                  overflow: 'hidden',
                  border: `2px solid ${theme.surfaceBorder}`,
                  boxShadow: '0 14px 32px rgba(0,0,0,0.22)',
                  transform: `rotate(-8deg) scale(${interpolate(sideCardSpring, [0, 1], [0.7, 1])})`,
                  zIndex: 5,
                }}
              >
                <ProductStageImage src={sideLeftImg} zoom={1.0} />
              </div>
              <div
                style={{
                  position: 'absolute',
                  right: -8,
                  width: 240,
                  height: 300,
                  borderRadius: 26,
                  overflow: 'hidden',
                  border: `2px solid ${theme.surfaceBorder}`,
                  boxShadow: '0 14px 32px rgba(0,0,0,0.22)',
                  transform: `rotate(8deg) scale(${interpolate(sideCardSpring, [0, 1], [0.7, 1])})`,
                  zIndex: 5,
                }}
              >
                <ProductStageImage src={sideRightImg} zoom={1.0} />
              </div>
            </>
          )}

          {/* Main Center Product Frame (Full-frame contain + blurred glass backdrop) */}
          <div
            style={{
              position: 'relative',
              width: isHero && images.length > 1 ? '76%' : '100%',
              height: isGrid ? '56%' : isSpotlight && props.decisionHelper ? '89%' : isCta && props.howToSteps?.length ? '87%' : '100%',
              alignSelf: isGrid ? 'flex-start' : 'center',
              borderRadius: 32,
              overflow: 'hidden',
              backgroundColor: theme.surface,
              border: `2px solid ${theme.surfaceBorder}`,
              boxShadow: '0 22px 48px rgba(0, 0, 0, 0.20)',
              transform: `translateY(${floatY}px)`,
              zIndex: 10,
            }}
          >
            {currentImg && (
              <ProductStageImage
                src={currentImg}
                zoom={isSpotlight ? kenBurnsScale * 1.02 : kenBurnsScale}
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
                  boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
                }}
              >
                ลด {discount}%
              </div>
            )}
          </div>

          {/* Scene 3: Shade Decision Helper Pill (Soft Glass) */}
          {isSpotlight && props.decisionHelper && (
            <div
              style={{
                width: 'fit-content',
                maxWidth: '100%',
                backgroundColor: theme.surface,
                backdropFilter: 'blur(12px)',
                border: `1.5px solid ${theme.surfaceBorder}`,
                color: theme.text,
                borderRadius: 999,
                padding: '12px 24px',
                fontSize: 24,
                fontWeight: 700,
                textAlign: 'center',
                boxShadow: '0 10px 26px rgba(255, 77, 109, 0.12)',
                zIndex: 12,
              }}
            >
              {props.decisionHelper}
            </div>
          )}

          {/* Scene 4: 3-Second How-To Steps Strip (Soft Rounded Pills) */}
          {isCta && props.howToSteps && props.howToSteps.length > 0 && (
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                gap: 10,
                zIndex: 12,
              }}
            >
              {props.howToSteps.slice(0, 3).map((step, sIdx) => (
                <div
                  key={`step-${sIdx}`}
                  style={{
                    flex: 1,
                    backgroundColor: theme.surface,
                    backdropFilter: 'blur(10px)',
                    border: `1.5px solid ${theme.surfaceBorder}`,
                    borderRadius: 20,
                    padding: '10px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontSize: 21,
                    fontWeight: 700,
                    color: theme.text,
                    boxShadow: '0 8px 20px rgba(0,0,0,0.07)',
                  }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: theme.ctaGradient,
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 17,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {sIdx + 1}
                  </span>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Scene 2: Staggered Feature Checklist with Soft Glass Cards */}
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
                const enterSpring = spring({
                  frame: Math.max(frame - s1End - idx * 7, 0),
                  fps,
                  config: { damping: 14, stiffness: 140 },
                });
                const enterY = interpolate(enterSpring, [0, 1], [28, 0]);
                return (
                  <div
                    key={`kp-${idx}`}
                    style={{
                      position: 'relative',
                      background: isActive ? theme.ctaGradient : theme.surface,
                      backdropFilter: 'blur(12px)',
                      color: isActive ? '#FFFFFF' : theme.text,
                      border: isActive ? 'none' : `1.5px solid ${theme.surfaceBorder}`,
                      borderRadius: 22,
                      padding: '13px 20px',
                      fontSize: 27,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      opacity: enterSpring,
                      boxShadow: isActive
                        ? '0 12px 28px rgba(255, 61, 104, 0.25)'
                        : '0 6px 18px rgba(0, 0, 0, 0.06)',
                      transform: `translateY(${enterY}px) translateX(${isActive ? 10 : 0}px) scale(${isActive ? 1.02 : 0.98})`,
                    }}
                  >
                    <span
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        backgroundColor: isActive ? '#FFFFFF' : theme.primary,
                        border: isActive ? `2.5px solid ${theme.accent}` : 'none',
                        color: isActive ? '#111827' : theme.badgeText,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 21,
                        fontWeight: 800,
                        flexShrink: 0,
                        overflow: 'hidden',
                        transform: isActive ? `rotate(${Math.sin(frame / 3.8) * 12}deg)` : 'none',
                      }}
                    >
                      {isActive ? (
                        <Img
                          src={staticFile(`mascot/${props.mascotId || pickMascotByCategory(props.category)}/head_happy.png`)}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                        />
                      ) : (
                        idx + 1
                      )}
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
      </div>

      {/* Scene 4: Vibrant Pulsing Conversion CTA Button with Crisp White Basket Icon */}
      {isCta && (
        <div
          style={{
            position: 'absolute',
            bottom: 495,
            left: 232,
            right: SAFE_ZONES.right - 15,
            zIndex: 34,
            transform: `scale(${interpolate(ctaSpring, [0, 1], [0.9, 1]) * ctaPulse})`,
          }}
        >
          <div
            style={{
              background: theme.ctaGradient,
              color: '#FFFFFF',
              padding: '15px 24px',
              borderRadius: 999,
              fontSize: 30,
              fontWeight: 800,
              textAlign: 'center',
              boxShadow: '0 14px 32px rgba(255, 61, 104, 0.38)',
              border: '3px solid #FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 11h14l-1.5 8h-11z" fill="rgba(255,255,255,0.22)" />
              <path d="M9 11l3-6 3 6" />
              <line x1="10" y1="14" x2="10" y2="16" />
              <line x1="14" y1="14" x2="14" y2="16" />
            </svg>
            <span>{cleanCtaText}</span>
          </div>
        </div>
      )}

      {/* Signature Channel Mascot Co-Host (Bottom-Left Presenter Stage) */}
      <MascotNarrator
        sceneIdx={sceneIdx}
        sceneStartFrame={isHero ? 0 : isGrid ? s1End : isSpotlight ? s2End : s3End}
        activePointIdx={activePointIdx}
        captions={props.captions}
        theme={theme}
        mascotId={props.mascotId || pickMascotByCategory(props.category)}
      />

      {/* Unified Presenter Speech Bubble + Thai Karaoke Captions */}
      <KaraokeCaptions
        lines={props.captions}
        theme={theme}
        sceneIdx={sceneIdx}
        activePointIdx={activePointIdx}
        totalPoints={Math.max(props.keyPoints.length, 1)}
        mascotId={props.mascotId || pickMascotByCategory(props.category)}
      />
    </AbsoluteFill>
  );
};
