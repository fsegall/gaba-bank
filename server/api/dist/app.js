import 'dotenv/config';
import express from 'express';
import cors from "cors";
import helmet from "helmet";
import './src/config/boot-decimals.js';
import './src/bootstrap/decimals.js';
import './src/observability/otel.js';
import pg from 'pg';
import pino from 'pino';
import { auth } from './src/middleware/auth.js';
import { router as health } from './src/routes/health.js';
import { router as metrics } from './src/routes/metrics.js';
import { router as pspWebhooks } from './src/routes/webhooks/psp.js';
import { router as interWebhooks } from './src/routes/inter.js';
import { router as anchor } from './src/routes/anchor.js';
import { router as pix } from './src/routes/pix.js';
import { router as deposits } from './src/routes/deposits.js';
import { router as orders } from './src/routes/orders.js';
import { router as quotes } from './src/routes/quotes.js';
import { router as products } from './src/routes/products.js';
import { router as portfolio } from './src/routes/portfolio.js';
import { router as trades } from './src/routes/trades.js';
import { router as debug } from './src/routes/debug.js';
import { router as sell } from './src/routes/sell.js';
import path from 'path';
import { fileURLToPath } from 'url';
import vaultRoutes from "./src/routes/vault.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const app = express();
const log = pino({ level: process.env.LOG_LEVEL || 'info' });
pg.types.setTypeParser(20, v => BigInt(v)); // BIGINT -> bigint
pg.types.setTypeParser(1700, v => v); // NUMERIC -> string
// json para o resto (guardando rawBody se vier como JSON)
app.use(express.json({
    limit: '1mb',
    verify: (req, _res, buf) => { req.rawBody = buf?.length ? buf.toString('utf8') : ''; }
}));
app.post('/echo', (req, res) => {
    res.json({ got: req.body, raw: req.rawBody?.slice(0, 80) });
});
// BigInt -> string no JSON
app.set('json replacer', (_k, v) => (typeof v === 'bigint' ? v.toString() : v));
// --- Rotas públicas ---
app.use(pspWebhooks); // contém /webhooks/psp e /webhooks/psp/hmac
app.use(interWebhooks); // público
app.use(metrics);
app.use(health);
app.use(cors());
app.use(helmet());
app.use("/.well-known", express.static(path.join(__dirname, "../static/.well-known")));
// --- Rotas protegidas ---
app.use(auth);
// console.log('[debug] About to register anchor router')
app.use('/', anchor);
// console.log('[debug] Anchor router registered')
app.use(vaultRoutes);
app.use('/api/pix', pix);
app.use(deposits);
app.use(quotes);
app.use(orders);
app.use(products);
app.use(portfolio);
app.use(trades);
app.use(debug);
app.use(sell);
// 404/erro
app.use((_req, res) => res.status(404).json({ error: 'not_found' }));
app.use((err, _req, res, _next) => {
    log.error({ err }, 'unhandled_error');
    res.status(500).json({ error: 'internal_error' });
});
function listRoutes(app) {
    const out = [];
    const seen = new Set();
    app._router?.stack?.forEach((l) => {
        if (l.route?.path) {
            const m = Object.keys(l.route.methods).join(',').toUpperCase();
            const route = `${m} ${l.route.path}`;
            if (!seen.has(route)) {
                seen.add(route);
                out.push(route);
            }
        }
        else if (l.name === 'router' && l.handle?.stack) {
            const base = (l.regexp?.fast_star ? '' :
                (l.regexp?.source?.match(/^\^\s*\\\/(.+?)\\\/\?\(\?=\\\/\|\$\)\$/)?.[1]?.replace(/\\\//g, '/') ?? ''));
            l.handle.stack.forEach((h) => {
                if (h.route?.path) {
                    const m = Object.keys(h.route.methods).join(',').toUpperCase();
                    const route = `${m} /${base}${h.route.path}`.replace(/\/{2,}/g, '/');
                    if (!seen.has(route)) {
                        seen.add(route);
                        out.push(route);
                    }
                }
            });
        }
    });
    console.log('[routes]\n  ' + out.join('\n  '));
}
listRoutes(app);
