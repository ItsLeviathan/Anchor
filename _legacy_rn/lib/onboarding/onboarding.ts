import * as SecureStore from 'expo-secure-store';

const KEY = 'anchor_onboarding_complete';

export async function getOnboardingComplete(): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function setOnboardingComplete(): Promise<void> {
  await SecureStore.setItemAsync(KEY, 'true');
}

export async function resetOnboarding(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
}
