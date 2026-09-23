import { UserRole } from './types';
import { ROLE_PERMISSION_MAP } from './permissions';

export function hasPermission(userRole: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSION_MAP[userRole] || [];
  return permissions.includes(permission);
}

export function isPlatformAdmin(userRole: UserRole): boolean {
  return userRole === 'PLATFORM_SUPER_ADMIN';
}

export function isSchemeTrustee(userRole: UserRole): boolean {
  return userRole === 'SCHEME_TRUSTEE' || userRole === 'MANAGING_AGENT_ADMIN' || userRole === 'PLATFORM_SUPER_ADMIN';
}
