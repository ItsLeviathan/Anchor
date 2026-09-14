import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';

import { toast } from '../toast/toast';
import {
  getOfferings,
  purchasePackage as doPurchase,
  restorePurchases as doRestore,
} from './purchases';

export function usePurchases() {
  const queryClient = useQueryClient();
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    getOfferings()
      .then(setOfferings)
      .catch(() => {})
      .finally(() => setIsLoadingOfferings(false));
  }, []);

  async function purchase(pkg: PurchasesPackage) {
    setIsPurchasing(true);
    try {
      await doPurchase(pkg);
      // Invalidate subscription query so useEntitlements picks up the new Pro status
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast.success('Welcome to Anchor Pro!');
    } catch (err: any) {
      // userCancelled is set by RevenueCat when the user dismisses the native sheet
      if (err?.userCancelled) return;
      toast.error('Purchase failed. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  }

  async function restore() {
    setIsRestoring(true);
    try {
      await doRestore();
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast.success('Purchases restored.');
    } catch {
      toast.error("Couldn't restore purchases. Please try again.");
    } finally {
      setIsRestoring(false);
    }
  }

  return { offerings, isLoadingOfferings, isPurchasing, purchase, isRestoring, restore };
}
