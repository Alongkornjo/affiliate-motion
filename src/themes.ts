import { ThemeId } from './types';

export interface BrandTheme {
  id: ThemeId;
  name: string;
  bgGradient: string;
  surface: string;
  surfaceBorder: string;
  primary: string;
  accent: string;
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
    text: '#FFFFFF',
    mutedText: '#CBD5E1',
    badgeText: '#FFFFFF',
    captionBg: 'rgba(15, 17, 23, 0.86)',
    captionText: '#FFFFFF',
    captionHighlightBg: '#EE4D2D',
    captionHighlightText: '#FFFFFF',
    isDark: true,
  },
  clean_pastel: {
    id: 'clean_pastel',
    name: 'ของมันต้องมี (Clean Pastel)',
    bgGradient: 'linear-gradient(180deg, #FAF7F2 0%, #F3E9E2 100%)',
    surface: 'rgba(255, 255, 255, 0.96)',
    surfaceBorder: '#FBCFE8',
    primary: '#FF5A5F',
    accent: '#10B981',
    text: '#18181B',
    mutedText: '#52525B',
    badgeText: '#FFFFFF',
    captionBg: 'rgba(24, 24, 27, 0.88)',
    captionText: '#FFFFFF',
    captionHighlightBg: '#FFD426',
    captionHighlightText: '#18181B',
    isDark: false,
  },
  modern_tech: {
    id: 'modern_tech',
    name: 'คัดมาแล้ว (Modern Tech)',
    bgGradient: 'linear-gradient(160deg, #0B1221 0%, #111C33 100%)',
    surface: 'rgba(15, 23, 42, 0.88)',
    surfaceBorder: 'rgba(56, 189, 248, 0.45)',
    primary: '#38BDF8',
    accent: '#22D3EE',
    text: '#F8FAFC',
    mutedText: '#94A3B8',
    badgeText: '#0B1221',
    captionBg: 'rgba(11, 18, 33, 0.88)',
    captionText: '#F8FAFC',
    captionHighlightBg: '#38BDF8',
    captionHighlightText: '#0B1221',
    isDark: true,
  },
  warm_home: {
    id: 'warm_home',
    name: 'โฮมมี่ (Warm Home)',
    bgGradient: 'linear-gradient(180deg, #FFFBF5 0%, #FEF3C7 100%)',
    surface: 'rgba(255, 255, 255, 0.95)',
    surfaceBorder: '#F59E0B',
    primary: '#D97706',
    accent: '#059669',
    text: '#1F2937',
    mutedText: '#6B7280',
    badgeText: '#FFFFFF',
    captionBg: 'rgba(31, 41, 55, 0.88)',
    captionText: '#FFFFFF',
    captionHighlightBg: '#F59E0B',
    captionHighlightText: '#1F2937',
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
