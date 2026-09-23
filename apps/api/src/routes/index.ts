import { Router } from 'express';
import { statusRouter } from './status.route';

export const apiV1Router = Router();

apiV1Router.use('/v1', statusRouter);
