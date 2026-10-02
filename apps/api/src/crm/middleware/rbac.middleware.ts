/**
 * BCIP CRM API RBAC Authorisation Middleware
 * Phase 2 — Prompt 002C: CRM API Layer
 */

import type { Request, Response, NextFunction } from 'express';
import { hasPermission } from '@bcip/auth';
import { ApiResponse } from '../serializers/response.serializer.ts';

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ApiResponse.unauthorized(res, 'Authentication required');
      return;
    }

    const permitted = hasPermission(req.user.role, permission) || req.user.permissions.includes(permission);
    if (!permitted) {
      ApiResponse.forbidden(
        res,
        `Access denied. Role '${req.user.role}' lacks required permission: '${permission}'`
      );
      return;
    }

    next();
  };
}

export function requireAnyPermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ApiResponse.unauthorized(res, 'Authentication required');
      return;
    }

    const permitted = permissions.some(
      (perm) => hasPermission(req.user!.role, perm) || req.user!.permissions.includes(perm)
    );

    if (!permitted) {
      ApiResponse.forbidden(
        res,
        `Access denied. Role '${req.user.role}' lacks one of the required permissions: ${permissions.join(', ')}`
      );
      return;
    }

    next();
  };
}
