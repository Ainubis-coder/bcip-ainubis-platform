/**
 * Tenant & User Account Context Types
 */

export interface TenantContext {
  id: string;
  name: string;
  registrationNumber: string;
  schemeCount: number;
  unitCount: number;
  region: string;
  csosRegistered: boolean;
  tier: 'enterprise' | 'standard' | 'trial';
}

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  role: string;
  userRole?: string;
  avatarUrl?: string;
  initials: string;
  tenantId: string;
  tenantName: string;
  lastLogin: string;
  twoFactorEnabled: boolean;
}

export interface ShellNotification {
  id: string;
  title: string;
  message: string;
  category: 'operational' | 'financial' | 'governance' | 'maintenance' | 'ainubis' | 'system';
  severity: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface GlobalSearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: 'schemes' | 'properties' | 'contacts' | 'finance' | 'documents' | 'ainubis' | 'navigation';
  moduleId: string;
  badge?: string;
}
