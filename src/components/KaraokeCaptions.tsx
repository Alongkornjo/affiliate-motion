import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { BrandTheme, SAFE_ZONES } from '../themes';
import { CaptionLine } from '../types';

interface Props {
  lines: CaptionLine[];
  theme: BrandTheme;
}

export const KaraokeCaptions: React.FC<Props> = ({ lines, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  const activeLine = lines.find(
    (line) => currentTime >= line.start - 0.08 && currentTime <= line.end + 0.12
  );

  if (!activeLine) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: SAFE_ZONES.bottomCaption,
        left: SAFE_ZONES.left,
        right: SAFE_ZONES.right,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 30,
      }}
    >
      <div
        style={{
          backgroundColor: theme.captionBg,
          borderRadius: 18,
          padding: '14px 24px',
          boxShadow: '0 10px 28px rgba(0, 0, 0, 0.35)',
          border: `1.5px solid ${theme.surfaceBorder}`,
          maxWidth: '100%',
          textAlign: 'center',
          lineHeight: 1.35,
        }}
      >
        <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: 0 }}>
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
                    transition: 'background-color 80ms linear',
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
