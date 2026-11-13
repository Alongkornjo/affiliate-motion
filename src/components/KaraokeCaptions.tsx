import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { BrandTheme, SAFE_ZONES } from '../themes';
import { CaptionLine, MascotId } from '../types';

interface Props {
  lines: CaptionLine[];
  theme: BrandTheme;
  sceneIdx?: number;
  activePointIdx?: number;
  totalPoints?: number;
  mascotId?: MascotId;
}

const MASCOT_NAMES: Record<MascotId, string> = {
  mini: 'น้องมินิ',
  max: 'น้องแม็กซ์',
  sky_cat: 'น้องแมวสกาย',
  star_bear: 'น้องสตาร์',
};

export const KaraokeCaptions: React.FC<Props> = ({
  lines,
  theme,
  sceneIdx = 0,
  activePointIdx = 0,
  totalPoints = 3,
  mascotId = 'mini',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  const activeLine = lines.find(
    (line) => currentTime >= line.start - 0.08 && currentTime <= line.end + 0.12
  );

  const mascotName = MASCOT_NAMES[mascotId] || 'น้องมินิ';

  // Steady, non-bouncing Presenter Status Header (changes only per scene/point)
  const headerLabel =
    sceneIdx === 0
      ? `✨ ${mascotName} ป้ายยาของเด็ด`
      : sceneIdx === 1
      ? `💡 ${mascotName} สรุปจุดเด่น (ข้อ ${ Math.min(activePointIdx + 1, totalPoints) }/${totalPoints})`
      : sceneIdx === 2
      ? `💕 ${mascotName} คอนเฟิร์มความปัง`
      : `🛒 ${mascotName} ชี้เป้าพิกัดในตะกร้า`;

  if (!activeLine) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: SAFE_ZONES.bottomCaption - 18,
        left: 232,
        right: SAFE_ZONES.right - 15,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        pointerEvents: 'none',
        zIndex: 30,
      }}
    >
      {/* Rock-Steady Presenter Header Pill (0% bounce, 100% readable) */}
      <div
        style={{
          backgroundColor: theme.primary,
          color: theme.badgeText,
          padding: '6px 18px',
          borderRadius: '16px 16px 16px 4px',
          fontSize: 22,
          fontWeight: 700,
          boxShadow: '0 6px 16px rgba(0,0,0,0.22)',
          marginBottom: -6,
          marginLeft: 14,
          zIndex: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span>{headerLabel}</span>
      </div>

      {/* Unified Speech Bubble Box */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          backgroundColor: theme.captionBg,
          borderRadius: 22,
          padding: '18px 24px 16px 24px',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.36)',
          border: `2.5px solid ${theme.primary}`,
          textAlign: 'left',
          lineHeight: 1.35,
        }}
      >
        {/* Speech Bubble Tail pointing left to Mascot */}
        <div
          style={{
            position: 'absolute',
            left: -14,
            bottom: 26,
            width: 0,
            height: 0,
            borderTop: '12px solid transparent',
            borderBottom: '12px solid transparent',
            borderRight: `14px solid ${theme.primary}`,
          }}
        />

        <span style={{ fontSize: 35, fontWeight: 700, letterSpacing: 0 }}>
          {activeLine.words.map((w, idx) => {
            const isSpoken = currentTime >= w.start - 0.04 && currentTime <= w.end + 0.06;
            const prev = idx > 0 ? activeLine.words[idx - 1].word : '';
            const needsSpace =
              idx > 0 &&
              (/[A-Za-z0-9]$/.test(prev) || /^[A-Za-z0-9]/.test(w.word));
            return (
              <React.Fragment key={`${w.word}-${idx}`}>
                {needsSpace ? ' ' : ''}
                <span
                  style={{
                    color: isSpoken ? theme.captionHighlightText : theme.captionText,
                    backgroundColor: isSpoken ? theme.captionHighlightBg : 'transparent',
                    borderRadius: isSpoken ? 8 : 0,
                    padding: isSpoken ? '1px 6px' : '0px',
                  }}
                >
                  {w.word}
                </span>
              </React.Fragment>
            );
          })}
        </span>
      </div>
    </div>
  );
};
