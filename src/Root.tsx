import React from 'react';
import { Composition } from 'remotion';
import { HowToClip, HowToClipProps } from './compositions/HowToClip';
import { ProductClip } from './compositions/ProductClip';
import { ProductClipProps } from './types';

const defaultProps: ProductClipProps = {
  no: '127',
  productName: 'โคมไฟตั้งโต๊ะถนอมสายตา LED',
  category: 'ไอที / ของใช้ในบ้าน',
  price: 249,
  originalPrice: 590,
  hookText: 'หยุดเลื่อน! จ้องคอมนานตาอ่อนล้า?',
  problemText: 'แสงนุ่ม ไม่กระพริบ ปรับได้ 3 โทนสี',
  keyPoints: [
    'แสงนุ่ม ไม่กระพริบ ถนอมสายตา',
    'ปรับได้ 3 โทนสี ชาร์จ USB-C พกพาสะดวก',
    'ลดแรงวันนี้คุ้มมาก',
  ],
  ctaText: 'กดลิงก์ในไบโอ เลข #127 · หรือเม้น "เอา"',
  dmKeyword: 'เอา',
  brandHandle: '@AffiliateMotion',
  themeId: 'modern_tech',
  layoutVariant: 'card_center',
  images: [],
  voiceoverFile: '',
  captions: [],
  durationInSec: 20,
  enableSfx: true,
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ProductClip"
        component={ProductClip}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultProps}
        calculateMetadata={({ props }) => {
          const fps = 30;
          const p = props as ProductClipProps;
          const sec = Math.max(p.durationInSec || 20, 5);
          return {
            durationInFrames: Math.ceil(sec * fps),
            fps,
            width: 1080,
            height: 1920,
          };
        }}
      />
      <Composition
        id="HowToClip"
        component={HowToClip}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultProps as HowToClipProps}
        calculateMetadata={({ props }) => {
          const fps = 30;
          const p = props as HowToClipProps;
          const sec = Math.max(p.durationInSec || 20, 5);
          return {
            durationInFrames: Math.ceil(sec * fps),
            fps,
            width: 1080,
            height: 1920,
          };
        }}
      />
    </>
  );
};
