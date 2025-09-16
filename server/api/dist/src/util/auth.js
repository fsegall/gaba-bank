const OPEN_PREFIXES = [
    '/metrics',
    '/health', // ou /healthz, conforme seu server
    '/webhooks/psp',
    '/webhooks/inter',
    '/api/pix',
    '/echo' // libera todas as rotas PIX por enquanto
];
export function auth(req, res, next) {
    const url = (req.originalUrl || req.url).split('?')[0];
    // bypass em dev, se quiser
    if (process.env.DEV_BYPASS_AUTH === 'true')
        return next();
    // rotas abertas por prefixo
    if (OPEN_PREFIXES.some(p => url?.startsWith(p)))
        return next();
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : hdr;
    const expected = process.env.DEFY_API_TOKEN;
    if (!expected) {
        return res.status(500).json({ error: 'server_misconfig', missing: 'DEFY_API_TOKEN' });
    }
    if (token !== expected) {
        return res.status(401).json({ error: 'unauthorized' });
    }
    next();
}
