import { Dimensions, PixelRatio } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

// Reference size: 390 × 844 (iPhone 14 / Galaxy S21)
const BASE_W = 390;
const SCALE = W / BASE_W;

/**
 * Scale a horizontal dimension (padding, margin, border-radius, icon sizes…)
 * relative to the current screen width.
 */
export const rw = (px: number): number => Math.round(px * SCALE);

/**
 * Scale a font size, capped at 130 % to avoid huge text on large tablets.
 */
export const rf = (size: number): number => {
  const capped = Math.min(SCALE, 1.3);
  return Math.round(PixelRatio.roundToNearestPixel(size * capped));
};

export const SCREEN_W = W;
export const SCREEN_H = H;

/** true on phones narrower than 375 px (e.g. older Galaxy A series) */
export const isSmall = W < 375;

/** true on wide phones / compact tablets (e.g. Samsung Galaxy Z Fold outer screen) */
export const isLarge = W >= 414;
