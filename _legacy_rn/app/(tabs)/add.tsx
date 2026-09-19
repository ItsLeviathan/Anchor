// This route exists only because Expo Router requires a screen component
// per <Tabs.Screen>. Pressing this tab is intercepted in (tabs)/_layout.tsx
// and opens the /add-sheet modal instead, so this component never renders.
export default function AddPlaceholder() {
  return null;
}
