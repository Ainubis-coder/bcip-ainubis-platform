import type { Request, Response, NextFunction } from 'express';
import { logger } from '../logger/index.ts';

export function structuredLoggingMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only log API routes and health checks; skip Vite internal frontend development asset requests
  if (!req.originalUrl.startsWith('/api') && !req.originalUrl.startsWith('/health')) {
    return next();
  }

  const startTime = Date.now();
  const requestId = req.requestId;

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    logger.info(`HTTP ${req.method} ${req.originalUrl} - ${res.statusCode}`, {
      requestId,
      event: 'http_request_completed',
      data: {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
        userAgent: req.headers['user-agent'] || 'unknown',
      },
    });
  });

  next();
}
