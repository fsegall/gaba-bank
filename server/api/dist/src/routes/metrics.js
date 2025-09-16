import { Router } from 'express';
import { register } from '../observability/metrics.js';
export const router = Router();
router.get('/metrics', async (req, res, next) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});
