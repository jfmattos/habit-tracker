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

/** WCAG relative luminance of a #RRGGBB color */
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Minimum contrast against white, so white text and checkmarks stay readable */
const MIN_CONTRAST = 3;

/**
 * A habit color for any hue (0-360). Light hues (yellows, greens, cyans) are darkened just
 * enough to reach MIN_CONTRAST with white, like the preset colors.
 */
export function hueToColor(hue: number) {
  let lightness = 0.55;
  let color = hslToHex(hue, 0.72, lightness);
  while (1.05 / (luminance(color) + 0.05) < MIN_CONTRAST && lightness > 0.2) {
    lightness -= 0.01;
    color = hslToHex(hue, 0.72, lightness);
  }
  return color;
}

/** The hue (0-360) of a #RRGGBB color */
export function colorToHue(hex: string) {
  const [r, g, b] = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);
  if (delta === 0) return 0;
  const hue =
    max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  return (hue * 60 + 360) % 360;
}
