'use client';

import { useWorkspace } from './use-workspace';
import { hasPermission, hasAnyPermission, hasAllPermissions, type Role, type Permission } from '@/lib/rbac';

export function usePermissions() {
  const { currentWorkspace } = useWorkspace();
  const role = (currentWorkspace?.role || 'storekeeper') as Role;

  return {
    role,
    hasPermission: (permission: Permission) => hasPermission(role, permission),
    hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(role, permissions),
    hasAllPermissions: (permissions: Permission[]) => hasAllPermissions(role, permissions),
    canManageWorkspace: hasPermission(role, 'workspace:manage'),
    canManageBilling: hasPermission(role, 'billing:manage'),
    canManageTeam: hasPermission(role, 'team:manage'),
    canManageWarehouses: hasPermission(role, 'warehouse:manage'),
    canManageProducts: hasPermission(role, 'product:manage'),
    canViewInventory: hasPermission(role, 'inventory:view'),
    canProcessSales: hasPermission(role, 'pos:process'),
    canViewAnalytics: hasPermission(role, 'analytics:view'),
    canManageSettings: hasPermission(role, 'settings:manage'),
    canUseAI: hasPermission(role, 'ai:use'),
  };
}
