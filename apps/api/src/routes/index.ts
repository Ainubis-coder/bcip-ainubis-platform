import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { statusRouter } from './status.route.ts';
import { crmRouter } from '../crm/routes/index.ts';
import { billingRouter } from '../billing/routes/billing.route.ts';

export const apiV1Router = express.Router();

apiV1Router.get('/v1/openapi.json', (_req, res) => {
  const specPath = path.resolve(process.cwd(), 'docs/crm/openapi.json');
  if (fs.existsSync(specPath)) {
    res.setHeader('Content-Type', 'application/json');
    res.send(fs.readFileSync(specPath, 'utf8'));
  } else {
    res.status(404).json({ error: 'OpenAPI specification not found' });
  }
});

apiV1Router.use('/v1', statusRouter);
apiV1Router.use('/v1', crmRouter);
apiV1Router.use('/v1/billing', billingRouter);


