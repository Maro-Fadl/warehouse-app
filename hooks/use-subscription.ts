'use client';

import { useWorkspace } from './use-workspace';
import {
  tierLimits,
  canAddResource,
  hasFeature,
  canUseAi,
  getRemainingResources,
  type PlanTier,
  type TierLimits,
} from '@/lib/subscriptions';

export function useSubscription() {
  const { currentWorkspace } = useWorkspace();
  const tier = (currentWorkspace?.planTier || 'personal') as PlanTier;
  const limits = tierLimits[tier];

  return {
    tier,
    limits,
    canAddWarehouse: (currentCount: number) => canAddResource(tier, 'warehouses', currentCount),
    canAddUser: (currentCount: number) => canAddResource(tier, 'users', currentCount),
    canAddProduct: (currentCount: number) => canAddResource(tier, 'products', currentCount),
    canAddTerminal: (currentCount: number) => canAddResource(tier, 'posTerminals', currentCount),
    hasFeature: (feature: keyof TierLimits['features']) => hasFeature(tier, feature),
    canUseAi: (queriesToday: number) => canUseAi(tier, queriesToday),
    getRemaining: (counts: { warehouses: number; users: number; products: number; posTerminals: number }) =>
      getRemainingResources(tier, counts),
    isPersonal: tier === 'personal',
    isRetail: tier === 'retail',
    isEnterprise: tier === 'enterprise',
  };
}
