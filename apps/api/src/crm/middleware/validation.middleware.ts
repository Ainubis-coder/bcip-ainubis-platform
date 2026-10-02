/**
 * BCIP CRM API Request Validation Middleware
 * Validates route parameters, query strings, and request bodies using Zod schemas.
 * Phase 2 — Prompt 002C: CRM API Layer
 */

import type { Request, Response, NextFunction } from 'express';
import { z, type ZodTypeAny } from 'zod';
import { ApiResponse, type ApiErrorDetail } from '../serializers/response.serializer.ts';

export interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export function validateRequest(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errorDetails: ApiErrorDetail[] = [];

    // Validate params
    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        for (const issue of result.error.issues) {
          errorDetails.push({
            field: `params.${issue.path.join('.')}`,
            message: issue.message,
            code: issue.code,
          });
        }
      } else {
        req.params = result.data as Record<string, string>;
      }
    }

    // Validate query
    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        for (const issue of result.error.issues) {
          errorDetails.push({
            field: `query.${issue.path.join('.')}`,
            message: issue.message,
            code: issue.code,
          });
        }
      } else {
        req.query = result.data as any;
      }
    }

    // Validate body
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        for (const issue of result.error.issues) {
          errorDetails.push({
            field: issue.path.join('.') || 'body',
            message: issue.message,
            code: issue.code,
          });
        }
      } else {
        req.body = result.data;
      }
    }

    if (errorDetails.length > 0) {
      ApiResponse.validationFailed(res, errorDetails);
      return;
    }

    next();
  };
}
