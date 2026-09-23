import { Router, Request, Response } from 'express';
import { envConfig } from '../config';

export const healthRouter = Router();

healthRouter.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'bcip-api',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    version: envConfig.APP_VERSION,
    requestId: req.requestId,
  });
});
