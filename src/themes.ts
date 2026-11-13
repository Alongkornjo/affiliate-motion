import { MascotId, ThemeId } from './types';

export interface BrandTheme {
  id: ThemeId;
  name: string;
  bgGradient: string;
  surface: string;
  surfaceBorder: string;
  primary: string;
  accent: string;
  ctaGradient: string;
  text: string;
  mutedText: string;
  badgeText: string;
  captionBg: string;
  captionText: string;
  captionHighlightBg: string;
  captionHighlightText: string;
  isDark: boolean;
}

export const SAFE_ZONES = {
  top: 175,
  right: 115,
  left: 56,
  bottomCaption: 350,
  bottomCard: 485,
};

export const THEMES: Record<ThemeId, BrandTheme> = {
  flash_sale: {
    id: 'flash_sale',
    name: 'ป้ายยาโปร (Bold Flash Sale)',
    bgGradient: 'linear-gradient(165deg, #161822 0%, #090a0f 100%)',
    surface: 'rgba(30, 34, 48, 0.92)',
    surfaceBorder: '#EE4D2D',
    primary: '#EE4D2D',
    accent: '#FFD426',
    ctaGradient: 'linear-gradient(90deg, #EE4D2D 0%, #FF6B3D 55%, #FF8C42 100%)',
    text: '#FFFFFF',
    mutedText: '#CBD5E1',
    badgeText: '#FFFFFF',
    captionBg: 'rgba(18, 22, 34, 0.80)',
    captionText: '#FFFFFF',
    captionHighlightBg: 'rgba(238, 77, 45, 0.28)',
    captionHighlightText: '#FFD426',
    isDark: true,
  },
  clean_pastel: {
    id: 'clean_pastel',
    name: 'ของมันต้องมี (Clean Pastel)',
    bgGradient: 'linear-gradient(180deg, #FAF7F2 0%, #F3E9E2 100%)',
    surface: 'rgba(255, 255, 255, 0.88)',
    surfaceBorder: 'rgba(255, 255, 255, 0.75)',
    primary: '#FF4D6D',
    accent: '#FFB703',
    ctaGradient: 'linear-gradient(90deg, #FF3D68 0%, #FF6B6B 55%, #FF8E53 100%)',
    text: '#27272A',
    mutedText: '#52525B',
    badgeText: '#FFFFFF',
    captionBg: 'rgba(255, 255, 255, 0.90)',
    captionText: '#27272A',
    captionHighlightBg: 'rgba(255, 77, 109, 0.14)',
    captionHighlightText: '#E11D48',
    isDark: false,
  },
  modern_tech: {
    id: 'modern_tech',
    name: 'คัดมาแล้ว (Modern Tech)',
    bgGradient: 'linear-gradient(160deg, #0B1221 0%, #111C33 100%)',
    surface: 'rgba(15, 23, 42, 0.82)',
    surfaceBorder: 'rgba(56, 189, 248, 0.28)',
    primary: '#38BDF8',
    accent: '#22D3EE',
    ctaGradient: 'linear-gradient(90deg, #0284C7 0%, #0EA5E9 55%, #22D3EE 100%)',
    text: '#F8FAFC',
    mutedText: '#94A3B8',
    badgeText: '#FFFFFF',
    captionBg: 'rgba(15, 23, 42, 0.80)',
    captionText: '#F8FAFC',
    captionHighlightBg: 'rgba(56, 189, 248, 0.24)',
    captionHighlightText: '#38BDF8',
    isDark: true,
  },
  warm_home: {
    id: 'warm_home',
    name: 'โฮมมี่ (Warm Home)',
    bgGradient: 'linear-gradient(180deg, #FFFBF5 0%, #FEF3C7 100%)',
    surface: 'rgba(255, 255, 255, 0.90)',
    surfaceBorder: 'rgba(255, 255, 255, 0.75)',
    primary: '#EA580C',
    accent: '#F59E0B',
    ctaGradient: 'linear-gradient(90deg, #EA580C 0%, #F97316 55%, #F59E0B 100%)',
    text: '#1F2937',
    mutedText: '#6B7280',
    badgeText: '#FFFFFF',
    captionBg: 'rgba(255, 255, 255, 0.90)',
    captionText: '#1F2937',
    captionHighlightBg: 'rgba(234, 88, 12, 0.14)',
    captionHighlightText: '#C2410C',
    isDark: false,
  },
};

export function pickThemeByCategory(category: string): ThemeId {
  const c = (category || '').toLowerCase();
  if (/ความงาม|สกินแคร์|เครื่องสำอาง|แฟชั่น|beauty|skincare|cosmetic|fashion/.test(c)) {
    return 'clean_pastel';
  }
  if (/ไอที|แก็ดเจ็ต|เครื่องมือ|อิเล็กทรอนิกส์|it|gadget|tech|tool/.test(c)) {
    return 'modern_tech';
  }
  if (/บ้าน|ครัว|แม่และเด็ก|เครื่องนอน|สุขภาพ|home|kitchen|mom|health/.test(c)) {
    return 'warm_home';
  }
  return 'flash_sale';
}

export function pickMascotByCategory(category: string): MascotId {
  const c = (category || '').toLowerCase();
  if (/ความงาม|สกินแคร์|เครื่องสำอาง|แฟชั่น|beauty|skincare|cosmetic|fashion/.test(c)) {
    return 'mini';
  }
  if (/ไอที|แก็ดเจ็ต|เครื่องมือ|อิเล็กทรอนิกส์|it|gadget|tech|tool|electronic/.test(c)) {
    return 'max';
  }
  if (/สัตว์เลี้ยง|ไลฟ์สไตล์|ของขวัญ|น่ารัก|pet|lifestyle|cute|gift/.test(c)) {
    return 'sky_cat';
  }
  return 'star_bear';
}
