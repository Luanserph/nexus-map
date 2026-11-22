import sharp from 'sharp';
import type { BackgroundPattern, BadgeStyle, GameTheme } from '../../src/types/schema';

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number; // 0..360
  s: number; // 0..1
  l: number; // 0..1
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / delta + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / delta + 2;
        break;
      default:
        h = (rn - gn) / delta + 4;
        break;
    }
    h *= 60;
  }

  return { h, s, l };
}

function hslToRgb({ h, s, l }: HSL): RGB {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let rn = 0;
  let gn = 0;
  let bn = 0;

  if (h < 60) {
    rn = c;
    gn = x;
  } else if (h < 120) {
    rn = x;
    gn = c;
  } else if (h < 180) {
    gn = c;
    bn = x;
  } else if (h < 240) {
    gn = x;
    bn = c;
  } else if (h < 300) {
    rn = x;
    bn = c;
  } else {
    rn = c;
    bn = x;
  }

  return {
    r: Math.round((rn + m) * 255),
    g: Math.round((gn + m) * 255),
    b: Math.round((bn + m) * 255),
  };
}

function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function inferStyleFromGenres(genres: string[]): {
  backgroundPattern: BackgroundPattern;
  badgeStyle: BadgeStyle;
  fontDisplay: string;
} {
  const joined = genres.join(' ').toLowerCase();

  if (
    joined.includes('sci-fi') ||
    joined.includes('cyber') ||
    joined.includes('shooter')
  ) {
    return {
      backgroundPattern: 'cyber-grid',
      badgeStyle: 'chamfered',
      fontDisplay: "'Rajdhani', sans-serif",
    };
  }

  if (joined.includes('rpg') || joined.includes('fantasy')) {
    return {
      backgroundPattern: 'topographic-rings',
      badgeStyle: 'ornate',
      fontDisplay: "'Cinzel', Georgia, serif",
    };
  }

  if (
    joined.includes('indie') ||
    joined.includes('platformer') ||
    joined.includes('metroidvania')
  ) {
    return {
      backgroundPattern: 'abyssal-contours',
      badgeStyle: 'minimal',
      fontDisplay: "'Space Grotesk', sans-serif",
    };
  }

  return {
    backgroundPattern: 'tactical-grid',
    badgeStyle: 'minimal',
    fontDisplay: "'Space Grotesk', sans-serif",
  };
}

/**
 * Samples pixels from the cover/banner image via Sharp and derives a vibrant,
 * cohesive Tactical Neon Glassmorphism theme block for manifest.json.
 */
export async function extractThemeFromImage(
  imageBuffer: Buffer | null,
  genres: string[]
): Promise<GameTheme> {
  const styleDefaults = inferStyleFromGenres(genres);

  // Neutral tactical fallback if no image was available
  if (!imageBuffer) {
    return {
      accentPrimary: '#00F0FF',
      accentSecondary: '#FF2A85',
      accentGlow: 'rgba(0, 240, 255, 0.34)',
      glassTint: 'rgba(13, 17, 24, 0.78)',
      surfaceBase: '#07090D',
      ...styleDefaults,
    };
  }

  const { data, info } = await sharp(imageBuffer)
    .resize(64, 64, { fit: 'cover' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Quantize hues into 24 buckets (15° each) and score vibrancy
  const buckets = Array.from({ length: 24 }, () => ({
    score: 0,
    rSum: 0,
    gSum: 0,
    bSum: 0,
    count: 0,
  }));

  for (let i = 0; i < data.length; i += info.channels) {
    const rgb: RGB = { r: data[i], g: data[i + 1], b: data[i + 2] };
    const hsl = rgbToHsl(rgb);

    // Filter out near-black, near-white, and desaturated grey pixels
    if (hsl.s < 0.28 || hsl.l < 0.16 || hsl.l > 0.84) continue;

    const bucketIdx = Math.floor(hsl.h / 15) % 24;
    const lightnessWeight = 1 - Math.abs(hsl.l - 0.54) * 1.4;
    const vibrancyWeight = hsl.s * hsl.s * Math.max(0.2, lightnessWeight);

    const bucket = buckets[bucketIdx];
    bucket.score += vibrancyWeight;
    bucket.rSum += rgb.r * vibrancyWeight;
    bucket.gSum += rgb.g * vibrancyWeight;
    bucket.bSum += rgb.b * vibrancyWeight;
    bucket.count += 1;
  }

  const ranked = buckets
    .filter((b) => b.score > 0 && b.count > 0)
    .sort((a, b) => b.score - a.score);

  let primaryHsl: HSL;

  if (ranked.length > 0) {
    const top = ranked[0];
    const avgRgb: RGB = {
      r: top.rSum / top.score,
      g: top.gSum / top.score,
      b: top.bSum / top.score,
    };
    const rawHsl = rgbToHsl(avgRgb);
    // Boost saturation & clamp lightness so accent reads crisp against dark obsidian glass
    primaryHsl = {
      h: rawHsl.h,
      s: Math.min(0.92, Math.max(0.62, rawHsl.s * 1.15)),
      l: Math.min(0.66, Math.max(0.52, rawHsl.l)),
    };
  } else {
    // Fallback to image dominant stats if image is monochromatic
    const stats = await sharp(imageBuffer).stats();
    const domHsl = rgbToHsl(stats.dominant);
    primaryHsl = {
      h: domHsl.h,
      s: Math.max(0.55, domHsl.s),
      l: 0.58,
    };
  }

  const primaryRgb = hslToRgb(primaryHsl);
  const secondaryHsl: HSL = {
    h: (primaryHsl.h + 150) % 360,
    s: Math.min(0.85, Math.max(0.5, primaryHsl.s * 0.9)),
    l: 0.62,
  };
  const secondaryRgb = hslToRgb(secondaryHsl);

  // Subtle dark tinted obsidian surface & glass tint tied to primary hue
  const surfaceRgb = hslToRgb({
    h: primaryHsl.h,
    s: Math.min(0.24, primaryHsl.s * 0.25),
    l: 0.04,
  });
  const glassRgb = hslToRgb({
    h: primaryHsl.h,
    s: Math.min(0.22, primaryHsl.s * 0.25),
    l: 0.08,
  });

  return {
    accentPrimary: rgbToHex(primaryRgb),
    accentSecondary: rgbToHex(secondaryRgb),
    accentGlow: `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.35)`,
    glassTint: `rgba(${glassRgb.r}, ${glassRgb.g}, ${glassRgb.b}, 0.78)`,
    surfaceBase: rgbToHex(surfaceRgb),
    ...styleDefaults,
  };
}
