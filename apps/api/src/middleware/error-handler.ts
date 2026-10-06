import type { Request, Response, NextFunction } from 'express';
import { logger } from '../logger/index.ts';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandlerMiddleware(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST');
  const correlationId = req.correlationId || 'unknown';

  logger.error(`API Error: ${err.message}`, {
    correlationId,
    event: 'api_unhandled_exception',
    data: {
      code: errorCode,
      statusCode,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    },
  });

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: statusCode === 500 && process.env.NODE_ENV === 'production'
        ? 'An unexpected internal error occurred'
        : err.message,
      correlationId,
    },
  });
}
