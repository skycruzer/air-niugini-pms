/**
 * Advanced Role-Based Access Control (RBAC) System
 * Air Niugini Pilot Management System
 *
 * Comprehensive permission management with granular access control
 */

export type Permission =
  // Pilot Management
  | 'pilot:create'
  | 'pilot:read'
  | 'pilot:update'
  | 'pilot:delete'
  | 'pilot:view_sensitive'
  // Certification Management
  | 'certification:create'
  | 'certification:read'
  | 'certification:update'
  | 'certification:delete'
  | 'certification:bulk_update'
  // Leave Management
  | 'leave:create'
  | 'leave:read'
  | 'leave:update'
  | 'leave:delete'
  | 'leave:approve'
  | 'leave:reject'
  // Reports & Analytics
  | 'reports:view'
  | 'reports:export'
  | 'reports:create'
  | 'analytics:view'
  | 'analytics:advanced'
  // System Administration
  | 'system:settings'
  | 'system:users'
  | 'system:audit'
  | 'system:backup'
  | 'system:monitoring'
  | 'system:webhooks'
  | 'system:api_keys'
  // Check Types Management
  | 'check_types:create'
  | 'check_types:update'
  | 'check_types:delete';

export type Role = 'admin' | 'manager' | 'user' | 'readonly';

export interface PermissionGroup {
  name: string;
  description: string;
  permissions: Permission[];
}

export interface RoleDefinition {
  name: Role;
  displayName: string;
  description: string;
  permissions: Permission[];
  inherits?: Role[];
}

/**
 * Permission Groups for UI organization
 */
export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    name: 'Pilot Management',
    description: 'Manage pilot profiles and information',
    permissions: [
      'pilot:create',
      'pilot:read',
      'pilot:update',
      'pilot:delete',
      'pilot:view_sensitive',
    ],
  },
  {
    name: 'Certification Management',
    description: 'Manage pilot certifications and checks',
    permissions: [
      'certification:create',
      'certification:read',
      'certification:update',
      'certification:delete',
      'certification:bulk_update',
    ],
  },
  {
    name: 'Leave Management',
    description: 'Manage leave requests and approvals',
    permissions: [
      'leave:create',
      'leave:read',
      'leave:update',
      'leave:delete',
      'leave:approve',
      'leave:reject',
    ],
  },
  {
    name: 'Reports & Analytics',
    description: 'Access reports and analytics features',
    permissions: [
      'reports:view',
      'reports:export',
      'reports:create',
      'analytics:view',
      'analytics:advanced',
    ],
  },
  {
    name: 'System Administration',
    description: 'System configuration and administration',
    permissions: [
      'system:settings',
      'system:users',
      'system:audit',
      'system:backup',
      'system:monitoring',
      'system:webhooks',
      'system:api_keys',
    ],
  },
  {
    name: 'Check Types Management',
    description: 'Manage certification check types',
    permissions: ['check_types:create', 'check_types:update', 'check_types:delete'],
  },
];

/**
 * Role Definitions with Hierarchical Inheritance
 */
export const ROLE_DEFINITIONS: Record<Role, RoleDefinition> = {
  admin: {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full system access with all permissions',
    permissions: [
      // All permissions
      'pilot:create',
      'pilot:read',
      'pilot:update',
      'pilot:delete',
      'pilot:view_sensitive',
      'certification:create',
      'certification:read',
      'certification:update',
      'certification:delete',
      'certification:bulk_update',
      'leave:create',
      'leave:read',
      'leave:update',
      'leave:delete',
      'leave:approve',
      'leave:reject',
      'reports:view',
      'reports:export',
      'reports:create',
      'analytics:view',
      'analytics:advanced',
      'system:settings',
      'system:users',
      'system:audit',
      'system:backup',
      'system:monitoring',
      'system:webhooks',
      'system:api_keys',
      'check_types:create',
      'check_types:update',
      'check_types:delete',
    ],
  },
  manager: {
    name: 'manager',
    displayName: 'Manager',
    description: 'Manage pilots, certifications, and approve leave',
    permissions: [
      'pilot:read',
      'pilot:update',
      'pilot:view_sensitive',
      'certification:create',
      'certification:read',
      'certification:update',
      'certification:bulk_update',
      'leave:create',
      'leave:read',
      'leave:update',
      'leave:approve',
      'leave:reject',
      'reports:view',
      'reports:export',
      'analytics:view',
    ],
  },
  user: {
    name: 'user',
    displayName: 'User',
    description: 'View access and create leave requests',
    permissions: ['pilot:read', 'certification:read', 'leave:create', 'leave:read', 'reports:view'],
  },
  readonly: {
    name: 'readonly',
    displayName: 'Read Only',
    description: 'View-only access to all information',
    permissions: [
      'pilot:read',
      'certification:read',
      'leave:read',
      'reports:view',
      'analytics:view',
    ],
  },
};

/**
 * RBAC Service Class
 */
export class RBACService {
  private userRole: Role;
  private customPermissions: Set<Permission>;

  constructor(role: Role, customPermissions: Permission[] = []) {
    this.userRole = role;
    this.customPermissions = new Set(customPermissions);
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: Permission): boolean {
    // Custom permissions override role permissions
    if (this.customPermissions.has(permission)) {
      return true;
    }

    // Check role permissions
    const roleDefinition = ROLE_DEFINITIONS[this.userRole];
    return roleDefinition.permissions.includes(permission);
  }

  /**
   * Check if user has all specified permissions
   */
  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every((permission) => this.hasPermission(permission));
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some((permission) => this.hasPermission(permission));
  }

  /**
   * Get all permissions for current user
   */
  getAllPermissions(): Permission[] {
    const rolePermissions = ROLE_DEFINITIONS[this.userRole].permissions;
    const customPermissionArray = Array.from(this.customPermissions);
    return [...new Set([...rolePermissions, ...customPermissionArray])];
  }

  /**
   * Check if user has role or higher
   */
  hasRoleOrHigher(requiredRole: Role): boolean {
    const roleHierarchy: Record<Role, number> = {
      readonly: 1,
      user: 2,
      manager: 3,
      admin: 4,
    };

    return roleHierarchy[this.userRole] >= roleHierarchy[requiredRole];
  }

  /**
   * Get user's role
   */
  getRole(): Role {
    return this.userRole;
  }

  /**
   * Get role display name
   */
  getRoleDisplayName(): string {
    return ROLE_DEFINITIONS[this.userRole].displayName;
  }

  /**
   * Get role description
   */
  getRoleDescription(): string {
    return ROLE_DEFINITIONS[this.userRole].description;
  }
}

/**
 * Permission Helper Functions
 */

/**
 * Create RBAC instance for user
 */
export function createRBAC(role: Role, customPermissions: Permission[] = []): RBACService {
  return new RBACService(role, customPermissions);
}

/**
 * Check if role has permission (static check)
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  const rbac = new RBACService(role);
  return rbac.hasPermission(permission);
}

/**
 * Get permissions by group
 */
export function getPermissionsByGroup(groupName: string): Permission[] {
  const group = PERMISSION_GROUPS.find((g) => g.name === groupName);
  return group ? group.permissions : [];
}

/**
 * Get all available permissions
 */
export function getAllPermissions(): Permission[] {
  return PERMISSION_GROUPS.flatMap((group) => group.permissions);
}

/**
 * Get permissions difference between roles
 */
export function getPermissionDifference(
  fromRole: Role,
  toRole: Role
): {
  added: Permission[];
  removed: Permission[];
} {
  const fromPermissions = new Set(ROLE_DEFINITIONS[fromRole].permissions);
  const toPermissions = new Set(ROLE_DEFINITIONS[toRole].permissions);

  const added = Array.from(toPermissions).filter((p) => !fromPermissions.has(p));
  const removed = Array.from(fromPermissions).filter((p) => !toPermissions.has(p));

  return { added, removed };
}

/**
 * Validate role exists
 */
export function isValidRole(role: string): role is Role {
  return ['admin', 'manager', 'user', 'readonly'].includes(role);
}

/**
 * Format permission for display
 */
export function formatPermission(permission: Permission): string {
  const [resource, action] = permission.split(':');
  const formattedResource = resource.charAt(0).toUpperCase() + resource.slice(1);
  const formattedAction = action
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return `${formattedResource}: ${formattedAction}`;
}

/**
 * Permission Check Decorators (for UI components)
 */

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Check permission with detailed result
 */
export function checkPermissionDetailed(
  rbac: RBACService,
  permission: Permission
): PermissionCheckResult {
  const allowed = rbac.hasPermission(permission);

  if (!allowed) {
    return {
      allowed: false,
      reason: `User role '${rbac.getRoleDisplayName()}' does not have permission '${formatPermission(permission)}'`,
    };
  }

  return { allowed: true };
}

/**
 * Audit Log Interface for Permission Changes
 */
export interface PermissionAuditLog {
  timestamp: Date;
  userId: string;
  action: 'granted' | 'revoked' | 'role_changed';
  permission?: Permission;
  fromRole?: Role;
  toRole?: Role;
  reason?: string;
  performedBy: string;
}

/**
 * Default export
 */
export default {
  RBACService,
  createRBAC,
  roleHasPermission,
  ROLE_DEFINITIONS,
  PERMISSION_GROUPS,
  getAllPermissions,
  getPermissionsByGroup,
  isValidRole,
  formatPermission,
};
