/**
 * Shared sizing for the floating pill tab bar (see app/(tabs)/_layout.tsx).
 * Scrollable tab screens use `getTabBarClearance` so their last item isn't
 * hidden behind the bar, which floats over content rather than reserving
 * layout space for itself.
 */
export const TAB_BAR_HEIGHT = 64;
export const TAB_BAR_BOTTOM_MARGIN = 12;
export const TAB_BAR_SIDE_MARGIN = 24;

export function getTabBarClearance(insetBottom: number): number {
  return TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_MARGIN + insetBottom + 16;
}
