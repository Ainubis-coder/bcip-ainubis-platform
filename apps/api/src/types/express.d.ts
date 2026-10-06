declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      tenantId?: string;
    }
  }
}

export {};
