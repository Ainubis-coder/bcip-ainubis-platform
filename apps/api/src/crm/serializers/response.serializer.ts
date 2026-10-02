/**
 * BCIP CRM API Response Serializer & Envelope Standard
 * Phase 2 — Prompt 002C: CRM API Layer
 */

import type { Response } from 'express';

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
  meta: {
    requestId: string;
    timestamp: string;
  };
}

export interface ApiPaginatedEnvelope<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
  meta: {
    requestId: string;
    timestamp: string;
  };
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
    requestId: string;
  };
}

export class ApiResponse {
  public static success<T>(res: Response, data: T, statusCode = 200): Response {
    const requestId = (res.req as { requestId?: string }).requestId || 'unknown';
    const envelope: ApiSuccessEnvelope<T> = {
      success: true,
      data,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    };
    return res.status(statusCode).json(envelope);
  }

  public static paginated<T>(
    res: Response,
    data: T[],
    pagination: { page: number; pageSize: number; total: number },
    statusCode = 200
  ): Response {
    const requestId = (res.req as { requestId?: string }).requestId || 'unknown';
    const totalPages = pagination.pageSize > 0 ? Math.ceil(pagination.total / pagination.pageSize) : 1;
    const envelope: ApiPaginatedEnvelope<T> = {
      success: true,
      data,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: pagination.total,
        totalPages,
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    };
    return res.status(statusCode).json(envelope);
  }

  public static error(
    res: Response,
    code: string,
    message: string,
    statusCode = 400,
    details?: ApiErrorDetail[]
  ): Response {
    const requestId = (res.req as { requestId?: string }).requestId || 'unknown';
    const envelope: ApiErrorEnvelope = {
      success: false,
      error: {
        code,
        message,
        details,
        requestId,
      },
    };
    return res.status(statusCode).json(envelope);
  }

  public static notFound(res: Response, message = 'Resource not found'): Response {
    return this.error(res, 'NOT_FOUND', message, 404);
  }

  public static unauthorized(res: Response, message = 'Authentication required'): Response {
    return this.error(res, 'UNAUTHORIZED', message, 401);
  }

  public static forbidden(res: Response, message = 'Insufficient permissions'): Response {
    return this.error(res, 'FORBIDDEN', message, 403);
  }

  public static validationFailed(
    res: Response,
    details: ApiErrorDetail[],
    message = 'Request validation failed'
  ): Response {
    return this.error(res, 'VALIDATION_ERROR', message, 422, details);
  }

  public static conflict(res: Response, message: string): Response {
    return this.error(res, 'CONFLICT', message, 409);
  }
}
