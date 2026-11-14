export type ThemeId = 'flash_sale' | 'clean_pastel' | 'modern_tech' | 'warm_home';

export type LayoutVariant =
  | 'card_center'
  | 'split_top'
  | 'floating_badge'
  | 'feature_carousel';

export type CtaMode = 'bio' | 'basket';

export type MascotId = 'mini' | 'max' | 'sky_cat' | 'star_bear';

export interface CaptionWord {
  word: string;
  start: number;
  end: number;
}

export interface CaptionLine {
  start: number;
  end: number;
  text: string;
  words: CaptionWord[];
}

export type ProductClipProps = {
  no: string;
  productName: string;
  category: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  hookText: string;
  brandLabel?: string;
  gridHeadline?: string;
  problemText?: string;
  keyPoints: string[];
  spotlightTitle?: string;
  decisionHelper?: string;
  howToSteps?: string[];
  ctaHeadline?: string;
  ctaText: string;
  ctaMode?: CtaMode;
  dmKeyword?: string;
  brandHandle?: string;
  themeId: ThemeId;
  layoutVariant: LayoutVariant;
  mascotId?: MascotId;
  customAccent?: string;
  images: string[];
  heroFullBleedImage?: string;
  heroBadges?: string[];
  voiceoverFile: string;
  captions: CaptionLine[];
  durationInSec: number;
  enableSfx?: boolean;
};
