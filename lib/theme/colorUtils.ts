/**
 * Appends alpha to a 6-digit hex color for a soft tinted background (e.g. an
 * IconBadge or a selected chip using a category's own color at low opacity).
 * Anchor's category colors and semantic theme colors are always plain
 * 6-digit hex, so this doesn't need to handle rgb()/hsl()/named colors —
 * anything else is returned unchanged rather than mangled.
 */
export function tintColor(hex: string, alphaHex: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return `${hex}${alphaHex}`;
  return hex;
}

/**
 * Mixes a 6-digit hex color toward a target RGB by `amount` (0-1) — used to
 * derive a lighter/darker variant of the theme accent for gradients (e.g.
 * BrandMark's tile), so the gradient always matches the current accent
 * rather than a hardcoded color that would be wrong in dark mode.
 */
export function mixColor(hex: string, target: [number, number, number], amount: number): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const mixed: [number, number, number] = [
    r + (target[0] - r) * amount,
    g + (target[1] - g) * amount,
    b + (target[2] - b) * amount,
  ];
  return `#${mixed.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}
