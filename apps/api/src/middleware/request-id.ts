import type { Request, Response, NextFunction } from 'express';
import { envConfig } from '../config/index.ts';

function generateCorrelationId(): string {
  return `bcip_req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function requestCorrelationMiddleware(req: Request, res: Response, next: NextFunction) {
  req.correlationId = (req.headers['x-correlation-id'] as string) || generateCorrelationId();
  
  res.setHeader('x-correlation-id', req.correlationId);
  next();
}
