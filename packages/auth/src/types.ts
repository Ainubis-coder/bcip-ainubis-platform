export type UserRole =
  | 'PLATFORM_SUPER_ADMIN'
  | 'MANAGING_AGENT_ADMIN'
  | 'PORTFOLIO_MANAGER'
  | 'SCHEME_TRUSTEE'
  | 'PROPERTY_OWNER'
  | 'RESIDENT_TENANT'
  | 'CONTRACTOR_SERVICE'
  | 'FINANCIAL_AUDITOR'
  | 'AINUBIS_SERVICE_AGENT';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  schemeIds?: string[];
  permissions: string[];
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  tenantId: string;
  schemeIds?: string[];
  iss: string;
  aud: string;
  exp: number;
  iat: number;
}
