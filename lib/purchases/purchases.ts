import { Platform } from 'react-native';

import { supabase } from '../supabase/client';

// RevenueCat SDK — loaded lazily so the module is safe to import in Expo Go
// and web environments where the native module is absent.
let Purchases: typeof import('react-native-purchases').default | null = null;
let LOG_LEVEL: (typeof import('react-native-purchases'))['LOG_LEVEL'] | null = null;
try {
  const mod = require('react-native-purchases');
  Purchases = mod.default;
  LOG_LEVEL = mod.LOG_LEVEL;
} catch {
  // Native module not available (Expo Go, web)
}

export type { PurchasesPackage } from 'react-native-purchases';

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';

let initialized = false;

export function initPurchases(userId?: string) {
  if (!Purchases || !LOG_LEVEL) return;

  const apiKey = Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY;
  if (!apiKey) return;

  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey });
  initialized = true;

  if (userId) {
    Purchases.logIn(userId).catch(() => {});
  }
}

export async function logInPurchases(userId: string) {
  if (!Purchases || !initialized) return;
  try {
    await Purchases.logIn(userId);
  } catch {}
}

export async function getOfferings() {
  if (!Purchases || !initialized) throw new Error('Purchases not initialized');
  return Purchases.getOfferings();
}

export async function purchasePackage(pkg: import('react-native-purchases').PurchasesPackage) {
  if (!Purchases || !initialized) throw new Error('Purchases not initialized');
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  await syncSubscription();
  return customerInfo;
}

export async function restorePurchases() {
  if (!Purchases || !initialized) throw new Error('Purchases not initialized');
  const customerInfo = await Purchases.restorePurchases();
  await syncSubscription();
  return customerInfo;
}

// After any purchase or restore, tell the Edge Function to sync RevenueCat
// CustomerInfo → the subscriptions table. The function validates with
// RevenueCat's API server-side so the client can't fake Pro status.
async function syncSubscription() {
  await supabase.functions.invoke('validate-purchase');
}
