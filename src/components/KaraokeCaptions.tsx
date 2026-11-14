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

  const headerLabel =
    sceneIdx === 0
      ? `✨ ${mascotName} ป้ายยาของเด็ด`
      : sceneIdx === 1
      ? `💡 ${mascotName} ชี้จุดปัง (${Math.min(activePointIdx + 1, totalPoints)}/${totalPoints})`
      : sceneIdx === 2
      ? `💕 ${mascotName} คอนเฟิร์มความปัง`
      : `🛒 ${mascotName} แปะพิกัดตะกร้าแล้ว`;

  if (!activeLine) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 248,
        left: 268,
        right: 48,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        pointerEvents: 'none',
        zIndex: 30,
      }}
    >
      {/* Soft Floating Presenter Tag Pill */}
      <div
        style={{
          background: theme.ctaGradient,
          color: '#FFFFFF',
          padding: '7px 20px',
          borderRadius: 999,
          fontSize: 24,
          fontWeight: 700,
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.14)',
          marginBottom: 8,
          marginLeft: 8,
          zIndex: 32,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span>{headerLabel}</span>
      </div>

      {/* Soft Pastel Glass Speech Bubble (Full-Column Balanced Width) */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          backgroundColor: theme.captionBg,
          backdropFilter: 'blur(16px)',
          borderRadius: 28,
          padding: '16px 28px',
          boxShadow: theme.isDark
            ? '0 14px 36px rgba(0, 0, 0, 0.38)'
            : '0 14px 34px rgba(255, 77, 109, 0.14), 0 4px 14px rgba(0, 0, 0, 0.06)',
          border: theme.isDark
            ? '1.5px solid rgba(255, 255, 255, 0.16)'
            : '1.5px solid rgba(255, 255, 255, 0.88)',
          textAlign: 'center',
          lineHeight: 1.38,
        }}
      >
        <span style={{ fontSize: 42, fontWeight: 700, letterSpacing: 0 }}>
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
                    borderBottom: isSpoken ? `4px solid ${theme.primary}` : '4px solid transparent',
                    borderRadius: isSpoken ? 10 : 0,
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
