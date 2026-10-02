/**
 * BCIP CRM API Idempotency Middleware
 * Ensures safe retries on critical lifecycle mutations.
 * Phase 2 — Prompt 002C: CRM API Layer
 */

import type { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../serializers/response.serializer.ts';

interface IdempotencyRecord {
  status: 'PROCESSING' | 'COMPLETED';
  statusCode?: number;
  body?: unknown;
  timestamp: number;
}

const idempotencyStore = new Map<string, IdempotencyRecord>();
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours TTL

export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const idempotencyKey = (req.headers['idempotency-key'] || req.headers['x-idempotency-key']) as string | undefined;

  if (!idempotencyKey) {
    return next();
  }

  const tenantId = req.tenantId || 'global';
  const cacheKey = `${tenantId}:${idempotencyKey}:${req.method}:${req.baseUrl || ''}${req.path}`;
  const now = Date.now();

  const existing = idempotencyStore.get(cacheKey);

  if (existing) {
    // Check if expired
    if (now - existing.timestamp > TTL_MS) {
      idempotencyStore.delete(cacheKey);
    } else if (existing.status === 'PROCESSING') {
      ApiResponse.conflict(
        res,
        'A mutation request with this Idempotency-Key is currently in-flight. Please wait before retrying.'
      );
      return;
    } else if (existing.status === 'COMPLETED') {
      res.setHeader('X-Idempotency-Replay', 'true');
      res.status(existing.statusCode || 200).json(existing.body);
      return;
    }
  }

  // Register in-flight execution
  idempotencyStore.set(cacheKey, {
    status: 'PROCESSING',
    timestamp: now,
  });

  // Intercept response to store result
  const originalJson = res.json.bind(res);
  res.json = (body: unknown) => {
    idempotencyStore.set(cacheKey, {
      status: 'COMPLETED',
      statusCode: res.statusCode,
      body,
      timestamp: Date.now(),
    });
    return originalJson(body);
  };

  next();
}

export function clearIdempotencyCache(): void {
  idempotencyStore.clear();
}
