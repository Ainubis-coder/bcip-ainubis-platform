/**
 * BCIP CRM API Authentication & Tenant Resolution Middleware
 * Phase 2 — Prompt 002C: CRM API Layer
 */

import type { Request, Response, NextFunction } from 'express';
import { tokenService } from '@bcip/auth';
import { ROLE_PERMISSION_MAP } from '@bcip/auth';
import type { AuthUser, UserRole } from '@bcip/auth';
import { ApiResponse } from '../serializers/response.serializer.ts';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      tenantId?: string;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    // Support test headers in test / non-production environment if Bearer is absent
    if (process.env.NODE_ENV !== 'production' && req.headers['x-test-tenant-id']) {
      const testTenantId = req.headers['x-test-tenant-id'] as string;
      const testRole = (req.headers['x-test-user-role'] as UserRole) || 'MANAGING_AGENT_ADMIN';
      const testUserId = (req.headers['x-test-user-id'] as string) || 'test_user_01';
      const testEmail = (req.headers['x-test-user-email'] as string) || 'test@bcip.platform';

      const user: AuthUser = {
        id: testUserId,
        email: testEmail,
        name: testEmail.split('@')[0],
        role: testRole,
        tenantId: testTenantId,
        schemeIds: [],
        permissions: (ROLE_PERMISSION_MAP[testRole] || []) as string[],
      };

      req.user = user;
      req.tenantId = testTenantId;
      return next();
    }

    ApiResponse.unauthorized(res, 'Authorization token is required');
    return;
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    ApiResponse.unauthorized(res, 'Malformed Authorization header. Format: Bearer <token>');
    return;
  }

  const payload = tokenService.verifyToken(token);
  if (!payload) {
    ApiResponse.unauthorized(res, 'Invalid or expired authentication token');
    return;
  }

  // Validate tenant context is present
  if (!payload.tenantId) {
    ApiResponse.forbidden(res, 'Token does not contain a valid tenant boundary');
    return;
  }

  const user: AuthUser = {
    id: payload.sub,
    email: payload.email,
    name: payload.email.split('@')[0],
    role: payload.role,
    tenantId: payload.tenantId,
    schemeIds: payload.schemeIds || [],
    permissions: (ROLE_PERMISSION_MAP[payload.role] || []) as string[],
  };

  req.user = user;
  req.tenantId = payload.tenantId;

  next();
}
