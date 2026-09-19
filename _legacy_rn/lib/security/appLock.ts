import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const APP_LOCK_KEY = 'anchor_app_lock_enabled';

export async function isAppLockEnabled(): Promise<boolean> {
  const val = await SecureStore.getItemAsync(APP_LOCK_KEY);
  return val === 'true';
}

export async function setAppLockEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(APP_LOCK_KEY, enabled ? 'true' : 'false');
}

export async function isBiometricAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return false;
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return isEnrolled;
}

export async function authenticateWithBiometric(): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Anchor',
      fallbackLabel: 'Use passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
    return result.success;
  } catch (err) {
    // Fail closed: if the native authentication module throws instead of
    // resolving with { success: false, error }, that must never be treated
    // as an unlock. Log rather than swallow so the failure is visible.
    console.error('Biometric authentication threw unexpectedly', err);
    return false;
  }
}
