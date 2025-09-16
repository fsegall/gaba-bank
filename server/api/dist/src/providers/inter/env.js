// src/providers/inter/env.ts
import path from 'path';
function expandEnv(s) {
    if (!s)
        return s;
    return s.replace(/\$\{(\w+)\}/g, (_, k) => process.env[k] ?? '');
}
export function resolveInterEnv() {
    const env = (process.env.INTER_ENV ?? 'homolog');
    // clientId/secret: usa INTER_CLIENT_ID/SECRET se existir; senão, usa *_HOMOLOG/PROD
    const clientId = process.env.INTER_CLIENT_ID ??
        (env === 'prod' ? process.env.INTER_CLIENT_ID_PROD : process.env.INTER_CLIENT_ID_HOMOLOG) ??
        '';
    const clientSecret = process.env.INTER_CLIENT_SECRET ??
        (env === 'prod' ? process.env.INTER_CLIENT_SECRET_PROD : process.env.INTER_CLIENT_SECRET_HOMOLOG) ??
        '';
    const baseURL = (process.env.INTER_BASE_URL ?? '').replace(/\/$/, '');
    const tokenURL = process.env.INTER_TOKEN_URL ??
        (baseURL ? `${baseURL}/oauth/v2/token` : '');
    if (!baseURL || !tokenURL || !clientId || !clientSecret) {
        throw new Error('Config Inter incompleta: verifique INTER_BASE_URL, INTER_TOKEN_URL, clientId/secret');
    }
    const certPath = expandEnv(process.env.INTER_CERT_PATH);
    const keyPath = expandEnv(process.env.INTER_KEY_PATH);
    const caPath = expandEnv(process.env.INTER_CA_PATH);
    const scopes = {
        // ⚠ Em alguns tenants do Inter os escopos são "pix.read pix.write".
        // Se tomar 401 "requested scope is not registered", troque COB para "pix.read pix.write".
        COB: process.env.INTER_OAUTH_SCOPE_COB ?? 'pix.read pix.write',
        PAGAR: process.env.INTER_OAUTH_SCOPE_PAGAR ?? 'pagamento-pix.write',
        PIX: process.env.INTER_OAUTH_SCOPE_PIX ?? 'pix.read',
    };
    // normaliza paths absolutos
    const abs = (p) => (p ? path.resolve(process.cwd(), p) : undefined);
    return {
        env, baseURL, tokenURL, clientId, clientSecret,
        certPath: abs(certPath), keyPath: abs(keyPath), caPath: abs(caPath),
        scopes,
    };
}
