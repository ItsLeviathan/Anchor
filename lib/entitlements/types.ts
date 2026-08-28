export type SubscriptionProvider = 'apple' | 'google';

export type SubscriptionStatus = 'trialing' | 'active' | 'expired' | 'cancelled' | 'grace_period';

export interface Subscription {
  id: string;
  userId: string;
  provider: SubscriptionProvider;
  productId: string;
  status: SubscriptionStatus;
  startedAt: string;
  expiresAt: string | null;
  autoRenewing: boolean;
}

export interface Entitlements {
  isPro: boolean;
  canUseAdvancedAI: boolean;
  canUseSmartScheduling: boolean;
  canUseAdvancedInsights: boolean;
  canUseAdvancedWidgets: boolean;
  canStoreAdvancedDocuments: boolean;
  canUseAdvancedStudentMode: boolean;
  canUseMultipleCalendars: boolean;
  aiMonthlyLimit: number;
}
