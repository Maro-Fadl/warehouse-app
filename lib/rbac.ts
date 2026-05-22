export type Role = 'owner' | 'manager' | 'storekeeper' | 'cashier';

export type Permission =
  | 'workspace:manage'
  | 'billing:manage'
  | 'team:manage'
  | 'team:view'
  | 'warehouse:manage'
  | 'warehouse:view'
  | 'product:manage'
  | 'product:view'
  | 'inventory:manage'
  | 'inventory:view'
  | 'pos:process'
  | 'pos:view'
  | 'analytics:view'
  | 'settings:manage'
  | 'settings:view'
  | 'ai:use'
  | 'customer:manage'
  | 'customer:view';

const rolePermissions: Record<Role, Set<Permission>> = {
  owner: new Set([
    'workspace:manage',
    'billing:manage',
    'team:manage',
    'team:view',
    'warehouse:manage',
    'warehouse:view',
    'product:manage',
    'product:view',
    'inventory:manage',
    'inventory:view',
    'pos:process',
    'pos:view',
    'analytics:view',
    'settings:manage',
    'settings:view',
    'ai:use',
    'customer:manage',
    'customer:view',
  ]),
  manager: new Set([
    'team:manage',
    'team:view',
    'warehouse:manage',
    'warehouse:view',
    'product:manage',
    'product:view',
    'inventory:manage',
    'inventory:view',
    'pos:process',
    'pos:view',
    'analytics:view',
    'settings:manage',
    'settings:view',
    'ai:use',
    'customer:manage',
    'customer:view',
  ]),
  storekeeper: new Set([
    'warehouse:view',
    'product:manage',
    'product:view',
    'inventory:manage',
    'inventory:view',
    'ai:use',
    'customer:view',
  ]),
  cashier: new Set([
    'warehouse:view',
    'product:view',
    'inventory:view',
    'pos:process',
    'pos:view',
    'customer:view',
    'customer:manage',
  ]),
};

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.has(permission) ?? false;
}

/**
 * Check if a role has any of the specified permissions.
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Check if a role has all of the specified permissions.
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Get all permissions for a role.
 */
export function getRolePermissions(role: Role): Permission[] {
  return Array.from(rolePermissions[role] || []);
}

/**
 * Get a permission error message.
 */
export function getPermissionError(permission: Permission): string {
  const messages: Record<string, string> = {
    'workspace:manage': 'Only workspace owners can manage workspace settings',
    'billing:manage': 'Only workspace owners can manage billing',
    'team:manage': 'Only owners and managers can manage team members',
    'warehouse:manage': 'Only owners and managers can manage warehouses',
    'product:manage': 'Only owners, managers, and storekeepers can manage products',
    'pos:process': 'Only owners, managers, and cashiers can process sales',
    'analytics:view': 'Only owners and managers can view analytics',
    'settings:manage': 'Only owners and managers can change settings',
    'ai:use': 'Only owners, managers, and storekeepers can use the AI assistant',
  };
  return messages[permission] || 'You do not have permission to perform this action';
}

/**
 * Middleware helper: require specific permission.
 */
export function requirePermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(getPermissionError(permission));
  }
}
