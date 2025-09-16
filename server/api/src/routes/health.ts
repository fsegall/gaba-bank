// src/routes/health.ts (ou equivalente)
import { Router } from 'express';

const AUTOBUY_ENABLED = (process.env.AUTOBUY_ENABLED ?? 'false').toLowerCase() === 'true';
const AUTOBUY_DEFAULT_PRODUCT = process.env.AUTOBUY_DEFAULT_PRODUCT ?? 'defy-balanced';

export const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    autobuy_enabled: AUTOBUY_ENABLED,
    autobuy_default_product: AUTOBUY_DEFAULT_PRODUCT,
    // opcional: versao, commit, etc.
  });
});
