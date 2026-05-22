export type PlanTier = 'personal' | 'retail' | 'enterprise';

export interface TierLimits {
  maxWarehouses: number;
  maxUsers: number;
  maxProducts: number;
  maxPosTerminals: number;
  maxAiQueries: number; // per day
  features: {
    advancedAnalytics: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
    customBranding: boolean;
    exportData: boolean;
    multiLocation: boolean;
    barcodeScanning: boolean;
    aiAssistant: boolean;
  };
}

export const tierLimits: Record<PlanTier, TierLimits> = {
  personal: {
    maxWarehouses: 1,
    maxUsers: 1,
    maxProducts: 100,
    maxPosTerminals: 0,
    maxAiQueries: 10,
    features: {
      advancedAnalytics: false,
      apiAccess: false,
      prioritySupport: false,
      customBranding: false,
      exportData: false,
      multiLocation: false,
      barcodeScanning: false,
      aiAssistant: true,
    },
  },
  retail: {
    maxWarehouses: 5,
    maxUsers: 10,
    maxProducts: 5000,
    maxPosTerminals: 3,
    maxAiQueries: 100,
    features: {
      advancedAnalytics: true,
      apiAccess: false,
      prioritySupport: true,
      customBranding: false,
      exportData: true,
      multiLocation: true,
      barcodeScanning: true,
      aiAssistant: true,
    },
  },
  enterprise: {
    maxWarehouses: Infinity,
    maxUsers: Infinity,
    maxProducts: Infinity,
    maxPosTerminals: Infinity,
    maxAiQueries: Infinity,
    features: {
      advancedAnalytics: true,
      apiAccess: true,
      prioritySupport: true,
      customBranding: true,
      exportData: true,
      multiLocation: true,
      barcodeScanning: true,
      aiAssistant: true,
    },
  },
};

export const tierPricing: Record<PlanTier, { monthly: number; yearly: number }> = {
  personal: { monthly: 9, yearly: 90 },
  retail: { monthly: 29, yearly: 290 },
  enterprise: { monthly: 99, yearly: 990 },
};

export const tierNames: Record<PlanTier, string> = {
  personal: 'Personal',
  retail: 'Retail / POS',
  enterprise: 'Enterprise',
};

/**
 * Check if a workspace can add more of a resource.
 */
export function canAddResource(
  tier: PlanTier,
  resource: 'warehouses' | 'users' | 'products' | 'posTerminals',
  currentCount: number
): boolean {
  const limits = tierLimits[tier];
  const maxMap = {
    warehouses: limits.maxWarehouses,
    users: limits.maxUsers,
    products: limits.maxProducts,
    posTerminals: limits.maxPosTerminals,
  };
  return currentCount < maxMap[resource];
}

/**
 * Check if a feature is available for a tier.
 */
export function hasFeature(tier: PlanTier, feature: keyof TierLimits['features']): boolean {
  return tierLimits[tier].features[feature];
}

/**
 * Check if a workspace has exceeded its AI query limit for today.
 */
export function canUseAi(tier: PlanTier, queriesToday: number): boolean {
  return queriesToday < tierLimits[tier].maxAiQueries;
}

/**
 * Get the remaining resource counts.
 */
export function getRemainingResources(
  tier: PlanTier,
  counts: {
    warehouses: number;
    users: number;
    products: number;
    posTerminals: number;
  }
) {
  const limits = tierLimits[tier];
  return {
    warehouses: Math.max(0, limits.maxWarehouses - counts.warehouses),
    users: Math.max(0, limits.maxUsers - counts.users),
    products: Math.max(0, limits.maxProducts - counts.products),
    posTerminals: Math.max(0, limits.maxPosTerminals - counts.posTerminals),
  };
}

/**
 * Get upgrade suggestion based on current usage.
 */
export function getUpgradeSuggestion(
  currentTier: PlanTier,
  resource: string
): PlanTier | null {
  if (currentTier === 'personal') return 'retail';
  if (currentTier === 'retail') return 'enterprise';
  return null; // already on highest tier
}
