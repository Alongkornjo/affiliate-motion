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
import { THEMES, pickMascotByCategory } from '../themes';
import { CaptionLine, ProductClipProps } from '../types';

const bodyFont = 'MitrLocal';
const headlineFont = 'MaliLocal';

export interface HowToStepItem {
  stepNo: string;
  badge: string;
  title: string;
  tip: string;
  image: string;
}

export interface HowToClipProps extends ProductClipProps {
  howToTitle?: string;
  steps?: HowToStepItem[];
}

function computeHowToBounds(
  captions: CaptionLine[],
  durationInFrames: number,
  fps: number
): [number, number, number, number] {
  const d1 = Math.floor(durationInFrames * 0.18);
  const d2 = Math.floor(durationInFrames * 0.42);
  const d3 = Math.floor(durationInFrames * 0.65);
  const d4 = Math.floor(durationInFrames * 0.84);

  if (!captions || captions.length < 5) {
    return [d1, d2, d3, d4];
  }

  const lineStarts = captions.map((l) => Math.round(l.start * fps));
  const closestStart = (target: number, minF: number, maxF: number) => {
    const cands = lineStarts.filter((f) => f >= minF && f <= maxF);
    if (cands.length === 0) return target;
    return cands.reduce((best, cur) => (Math.abs(cur - target) < Math.abs(best - target) ? cur : best), cands[0]);
  };

  const ctaLine = [...captions].reverse().find((l) => /ตะกร้า|กดดู|สั่งซื้อ|พิกัด|ลองเลย/.test(l.text));
  const s4 = ctaLine
    ? Math.min(Math.max(Math.round(ctaLine.start * fps), Math.floor(durationInFrames * 0.74)), Math.floor(durationInFrames * 0.90))
    : closestStart(d4, Math.floor(durationInFrames * 0.76), Math.floor(durationInFrames * 0.90));

  const s1 = closestStart(d1, Math.floor(durationInFrames * 0.12), Math.floor(durationInFrames * 0.25));
  const s2 = closestStart(d2, s1 + fps * 2, Math.floor(durationInFrames * 0.50));
  const s3 = closestStart(d3, s2 + fps * 2, s4 - fps * 2);

  return [s1, s2, s3, s4];
}

export const HowToClip: React.FC<HowToClipProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const baseTheme = THEMES[props.themeId] || THEMES.warm_home;
  const theme = props.customAccent ? { ...baseTheme, primary: props.customAccent } : baseTheme;
  const mascotId = props.mascotId || pickMascotByCategory(props.category);

  const [s1, s2, s3, s4] = computeHowToBounds(props.captions, durationInFrames, fps);

  const isIntro = frame < s1;
  const isStep1 = frame >= s1 && frame < s2;
  const isStep2 = frame >= s2 && frame < s3;
  const isStep3 = frame >= s3 && frame < s4;
  const isCta = frame >= s4;

  const activeStepIdx = isStep1 ? 0 : isStep2 ? 1 : isStep3 ? 2 : -1;
  const sceneStart = isIntro ? 0 : isStep1 ? s1 : isStep2 ? s2 : isStep3 ? s3 : s4;

  const sceneEnter = spring({
    frame: Math.max(frame - sceneStart, 0),
    fps,
    config: { damping: 14, stiffness: 150 },
  });
  const hookSpring = spring({ frame, fps, config: { damping: 12, stiffness: 165 } });
  const ctaPulse = isCta ? 1 + Math.sin((frame - s4) / 6) * 0.025 : 1;
  const kenBurns = interpolate(frame, [0, durationInFrames], [1.0, 1.05], { extrapolateRight: 'clamp' });
  const progressPct = Math.min((frame / Math.max(durationInFrames - 1, 1)) * 100, 100);

  const steps: HowToStepItem[] = props.steps || [
    {
      stepNo: '01',
      badge: 'STEP 01 · ประกอบง่าย',
      title: 'วางเสื่อลับเล็บลงบนโครงไม้',
      tip: 'เสื่อป่านทอแน่น ยึดแน่นไม่หลุดง่าย ไม่เป็นขุย',
      image: props.images[4] || props.images[0],
    },
    {
      stepNo: '02',
      badge: 'STEP 02 · มุมโปรดน้องแมว',
      title: 'วางมุมโปรดให้น้องแมวมาลับเล็บ',
      tip: 'ช่วยลดน้องแมวข่วนโซฟา ผ้าม่าน และเฟอร์นิเจอร์',
      image: props.images[7] || props.images[1] || props.images[0],
    },
    {
      stepNo: '03',
      badge: 'STEP 03 · นอนสบายปลอดภัย',
      title: 'นอนกลิ้งสบาย มีขอบพิงกันตก',
      tip: 'ขนาดใหญ่ 62×32×32 ซม. รับน้ำหนักได้ 50 กก.',
      image: props.images[1] || props.images[0],
    },
  ];

  const currentStep = activeStepIdx >= 0 ? steps[activeStepIdx] : null;
  const mascotSceneIdx = isIntro ? 0 : isCta ? 3 : activeStepIdx === 0 ? 1 : 2;

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

      {props.voiceoverFile && <Audio src={staticFile(props.voiceoverFile)} volume={1.12} />}

      {props.enableSfx !== false && (
        <>
          <Audio src={staticFile('sfx/bgm_upbeat.wav')} loop volume={0.075} />
          <Sequence from={2} durationInFrames={18}>
            <Audio src={staticFile('sfx/pop.wav')} volume={0.2} />
          </Sequence>
          {[s1, s2, s3].map((sf, idx) => (
            <React.Fragment key={`step-sfx-${idx}`}>
              <Sequence from={Math.max(sf, 10)} durationInFrames={20}>
                <Audio src={staticFile('sfx/whoosh.wav')} volume={0.18} />
              </Sequence>
              <Sequence from={Math.max(sf + 6, 16)} durationInFrames={24}>
                <Audio src={staticFile('sfx/ding.wav')} volume={0.16} />
              </Sequence>
            </React.Fragment>
          ))}
          <Sequence from={Math.max(s4, 30)} durationInFrames={28}>
            <Audio src={staticFile('sfx/sparkle.wav')} volume={0.2} />
          </Sequence>
        </>
      )}

      {/* Top Progress Bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${progressPct}%`,
          height: 8,
          background: theme.ctaGradient,
          zIndex: 60,
        }}
      />

      {/* SCENE 0: INTRO */}
      {isIntro && (
        <AbsoluteFill>
          <Img
            src={staticFile(props.heroFullBleedImage || props.images[0])}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${kenBurns})`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(255,251,245,0.22) 0%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.18) 100%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 148,
              left: 48,
              right: 48,
              background: theme.ctaGradient,
              borderRadius: 28,
              padding: '24px 32px',
              boxShadow: '0 16px 40px rgba(234,88,12,0.32)',
              transform: `scale(${interpolate(hookSpring, [0, 1], [0.9, 1])})`,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 3,
                color: 'rgba(255,255,255,0.92)',
                marginBottom: 8,
              }}
            >
              HOW-TO  ·  สาธิตวิธีใช้ 3 ขั้นตอน
            </div>
            <div
              style={{
                fontFamily: headlineFont,
                fontSize: 48,
                fontWeight: 700,
                lineHeight: 1.25,
                color: '#FFFFFF',
                whiteSpace: 'pre-line',
              }}
            >
              {props.howToTitle || 'วิธีใช้เก้าอี้ลับเล็บแมว\nง่ายๆ แค่ 3 ขั้นตอน!'}
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* SCENES 1-3: STEP-BY-STEP DEMO */}
      {currentStep && (
        <AbsoluteFill style={{ padding: '148px 104px 480px 48px' }}>
          {/* 3-Step Progress Tracker */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              marginBottom: 20,
            }}
          >
            {steps.map((st, idx) => {
              const isActive = idx === activeStepIdx;
              const isDone = idx < activeStepIdx;
              return (
                <React.Fragment key={st.stepNo}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 22px',
                      borderRadius: 999,
                      background: isActive
                        ? theme.ctaGradient
                        : isDone
                        ? 'rgba(16,185,129,0.18)'
                        : 'rgba(255,255,255,0.85)',
                      color: isActive ? '#FFFFFF' : isDone ? '#047857' : theme.mutedText,
                      fontWeight: 700,
                      fontSize: 24,
                      boxShadow: isActive ? '0 8px 20px rgba(234,88,12,0.28)' : '0 4px 12px rgba(0,0,0,0.06)',
                      transform: `scale(${isActive ? 1.06 : 1})`,
                    }}
                  >
                    <span>{isDone ? '✓' : st.stepNo}</span>
                    <span>{`ขั้นที่ ${idx + 1}`}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      style={{
                        width: 32,
                        height: 4,
                        borderRadius: 2,
                        background: isDone ? '#10B981' : 'rgba(0,0,0,0.12)',
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Step Header Card */}
          <div
            style={{
              background: theme.surface,
              borderRadius: 26,
              padding: '20px 28px',
              marginBottom: 22,
              boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
              border: `2px solid ${theme.primary}22`,
              transform: `translateY(${interpolate(sceneEnter, [0, 1], [24, 0])}px)`,
              opacity: sceneEnter,
            }}
          >
            <div
              style={{
                display: 'inline-block',
                background: `${theme.primary}18`,
                color: theme.primary,
                fontWeight: 700,
                fontSize: 22,
                padding: '6px 16px',
                borderRadius: 999,
                marginBottom: 8,
              }}
            >
              {currentStep.badge}
            </div>
            <div
              style={{
                fontFamily: headlineFont,
                fontSize: 42,
                fontWeight: 700,
                lineHeight: 1.25,
                color: theme.text,
              }}
            >
              {currentStep.title}
            </div>
          </div>

          {/* Main Step Visual Card */}
          <div
            style={{
              position: 'relative',
              flex: 1,
              borderRadius: 32,
              overflow: 'hidden',
              background: '#FFFFFF',
              boxShadow: '0 18px 42px rgba(0,0,0,0.12)',
              border: '4px solid #FFFFFF',
              transform: `scale(${interpolate(sceneEnter, [0, 1], [0.95, 1])})`,
              opacity: sceneEnter,
            }}
          >
            <Img
              src={staticFile(currentStep.image)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: `scale(${kenBurns})`,
              }}
            />
            {/* Bottom Tip Pill inside visual */}
            <div
              style={{
                position: 'absolute',
                bottom: 20,
                left: 20,
                right: 20,
                background: 'rgba(31,41,55,0.88)',
                backdropFilter: 'blur(8px)',
                color: '#FFFFFF',
                borderRadius: 20,
                padding: '14px 22px',
                fontSize: 26,
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              💡 {currentStep.tip}
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* SCENE 4: RESULT & CTA */}
      {isCta && (
        <AbsoluteFill style={{ padding: '148px 104px 520px 48px' }}>
          <div
            style={{
              background: theme.surface,
              borderRadius: 26,
              padding: '20px 28px',
              marginBottom: 20,
              textAlign: 'center',
              boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
              transform: `translateY(${interpolate(sceneEnter, [0, 1], [20, 0])}px)`,
              opacity: sceneEnter,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 700, color: theme.primary, letterSpacing: 2, marginBottom: 4 }}>
              {props.brandLabel || 'MANGO · 2 IN 1 CAT LOUNGE'}
            </div>
            <div style={{ fontFamily: headlineFont, fontSize: 40, fontWeight: 700, color: theme.text }}>
              {props.ctaHeadline || 'โซฟาปลอดภัย น้องแมวแฮปปี้! 🐾'}
            </div>
          </div>

          <div
            style={{
              flex: 1,
              borderRadius: 30,
              overflow: 'hidden',
              background: '#FFFFFF',
              boxShadow: '0 18px 40px rgba(0,0,0,0.12)',
              border: '4px solid #FFFFFF',
            }}
          >
            <Img
              src={staticFile(props.images[3] || props.images[0])}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Pulsing CTA Button above bottom 455px safe zone */}
          <div
            style={{
              position: 'absolute',
              bottom: 455,
              left: 266,
              right: 104,
              background: theme.ctaGradient,
              color: '#FFFFFF',
              borderRadius: 999,
              padding: '18px 28px',
              fontSize: 28,
              fontWeight: 700,
              textAlign: 'center',
              boxShadow: '0 14px 30px rgba(234,88,12,0.38)',
              transform: `scale(${ctaPulse})`,
            }}
          >
            🛒 {props.ctaText || 'จิ้มตะกร้าด้านล่าง · ลองเลยวันนี้!'}
          </div>
        </AbsoluteFill>
      )}

      {/* Fixed v13 Mascot & Karaoke Captions */}
      <MascotNarrator
        sceneIdx={mascotSceneIdx}
        sceneStartFrame={sceneStart}
        activePointIdx={Math.max(activeStepIdx, 0)}
        captions={props.captions}
        theme={theme}
        mascotId={mascotId}
      />
      <KaraokeCaptions
        lines={props.captions}
        theme={theme}
        sceneIdx={mascotSceneIdx}
        activePointIdx={Math.max(activeStepIdx, 0)}
        totalPoints={3}
        mascotId={mascotId}
      />
    </AbsoluteFill>
  );
};
