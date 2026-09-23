import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';

export function structuredLoggingMiddleware(req: Request, res: Response, next: NextFunction) {
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
