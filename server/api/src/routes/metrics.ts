import { Router, Request, Response } from 'express'
import { register } from '../observability/metrics.js'
import { NextFunction } from 'express'

export const router = Router()
router.get('/metrics', async (req: Request, res: Response, next: NextFunction) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});