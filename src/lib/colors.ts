function hslToHex(hue: number, saturation: number, lightness: number) {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const channel = (offset: number) => {
    const k = (offset + hue / 30) % 12;
    const value = lightness - chroma / 2 * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`.toUpperCase();
}

function rgb(hex: string) {
  return [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
}

/** WCAG relative luminance of a #RRGGBB color */
function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map((value) =>
    value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const DARK_TEXT = '#11181C';

/** White text is kept down to this contrast, so vivid colors (orange, red) keep white text */
const MIN_WHITE_CONTRAST = 2.5;

/**
 * Text and icon color for content drawn on a habit color: white on vivid and dark colors,
 * dark on light ones (pastels, yellows) where white would be hard to read.
 */
export function textOn(color: string) {
  return 1.05 / (luminance(color) + 0.05) >= MIN_WHITE_CONTRAST ? '#FFFFFF' : DARK_TEXT;
}

/** Shade runs from 0 (light pastel) to 1 (deep); 0.45 matches the vivid preset colors */
const LIGHTEST = 0.88;
const DARKEST = 0.22;
export const DEFAULT_SHADE = 0.45;

/** A habit color from a hue (0-360) and a shade (0-1) */
export function hueToColor(hue: number, shade = DEFAULT_SHADE) {
  return hslToHex(hue, 0.75, LIGHTEST - shade * (LIGHTEST - DARKEST));
}

/** The hue (0-360) of a #RRGGBB color */
export function colorToHue(hex: string) {
  const [r, g, b] = rgb(hex);
  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);
  if (delta === 0) return 0;
  const hue =
    max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  return (hue * 60 + 360) % 360;
}

/** The shade (0-1, see hueToColor) of a #RRGGBB color */
export function colorToShade(hex: string) {
  const [r, g, b] = rgb(hex);
  const lightness = (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
  return Math.max(0, Math.min(1, (LIGHTEST - lightness) / (LIGHTEST - DARKEST)));
}
