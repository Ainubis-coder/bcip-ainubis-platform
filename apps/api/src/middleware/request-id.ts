import type { Request, Response, NextFunction } from 'express';
import { envConfig } from '../config/index.ts';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export function requestCorrelationMiddleware(req: Request, res: Response, next: NextFunction) {
  const headerKey = envConfig.REQUEST_ID_HEADER.toLowerCase();
  const existingId = (req.headers[headerKey] || req.headers['x-request-id']) as string;
  const requestId = existingId || `bcip_req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  req.requestId = requestId;
  res.setHeader(envConfig.REQUEST_ID_HEADER, requestId);
  res.setHeader('X-Request-Id', requestId);
  next();
}
