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
