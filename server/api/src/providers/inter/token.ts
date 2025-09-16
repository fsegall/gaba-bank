// src/providers/inter/token.ts
import axios from 'axios'
import https from 'https'
import fs from 'fs'
import path from 'path'

type Cached = { token: string; exp: number }
const cache = new Map<string, Cached>() // cache por escopo

const expand = (s?: string) =>
  s?.replace(/\$\{([A-Z0-9_]+)\}/gi, (_, k) => process.env[k] ?? '')

const read = (p?: string) => {
  if (!p) return undefined
  const expanded = expand(p)
  if (!expanded) return undefined
  const full = path.resolve(expanded)
  return fs.readFileSync(full)
}

function makeMtlsAgent(): https.Agent {
  const pfxPath = expand(process.env.INTER_PFX_PATH)
  const pfxPass = process.env.INTER_PFX_PASSPHRASE

  if (pfxPath) {
    const pfx = read(pfxPath)
    if (!pfx) throw new Error(`INTER_PFX_PATH inválido: ${pfxPath}`)
    return new https.Agent({ pfx, passphrase: pfxPass, keepAlive: true, rejectUnauthorized: true, minVersion: 'TLSv1.2' })
  }

  const cert = read(process.env.INTER_CERT_PATH)
  const key  = read(process.env.INTER_KEY_PATH)
  const ca   = read(process.env.INTER_CA_PATH)
  if (!cert || !key || !ca) {
    throw new Error('INTER_CERT_PATH/INTER_KEY_PATH/INTER_CA_PATH não configurados')
  }
  return new https.Agent({ cert, key, ca, keepAlive: true, rejectUnauthorized: true, minVersion: 'TLSv1.2' })
}

function resolveCreds() {
  const env = (process.env.INTER_ENV ?? 'homolog').toLowerCase()
  const clientId =
    process.env.INTER_CLIENT_ID ??
    (env === 'prod' ? process.env.INTER_CLIENT_ID_PROD : process.env.INTER_CLIENT_ID_HOMOLOG)
  const clientSecret =
    process.env.INTER_CLIENT_SECRET ??
    (env === 'prod' ? process.env.INTER_CLIENT_SECRET_PROD : process.env.INTER_CLIENT_SECRET_HOMOLOG)

  const baseURL  = (process.env.INTER_BASE_URL ?? '').replace(/\/$/, '')
  const tokenURL = process.env.INTER_TOKEN_URL ?? (baseURL ? `${baseURL}/oauth/v2/token` : '')

  if (!tokenURL) throw new Error('INTER_TOKEN_URL não configurado')
  if (!clientId || !clientSecret)
    throw new Error('INTER_CLIENT_ID/INTER_CLIENT_SECRET não configurados (nem *_HOMOLOG/PROD)')

  return { tokenURL, clientId, clientSecret }
}

// apelidos -> escopos (pode sobrescrever no .env)
function resolveScope(name?: string): string {
  if (name === 'cob') return process.env.INTER_OAUTH_SCOPE_COB   ?? 'pix.read pix.write'
  if (name === 'pix') return process.env.INTER_OAUTH_SCOPE_PIX   ?? 'pix.read'
  if (name === 'pay') return process.env.INTER_OAUTH_SCOPE_PAGAR ?? 'pagamento-pix.write'
  return name || (process.env.INTER_OAUTH_SCOPE_COB ?? 'pix.read pix.write')
}

export async function getInterToken(scopeName?: 'cob'|'pay'|'pix'|string): Promise<string> {
  const scope = resolveScope(scopeName)
  const now = Math.floor(Date.now() / 1000)
  const hit = cache.get(scope)
  if (hit && hit.exp - 10 > now) return hit.token

  const { tokenURL, clientId, clientSecret } = resolveCreds()
  const agent = makeMtlsAgent()
  const params = new URLSearchParams()
  params.set('grant_type', 'client_credentials')
  params.set('scope', scope)

  const { data } = await axios.post(tokenURL, params.toString(), {
    httpsAgent: agent,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    auth: { username: clientId, password: clientSecret }, // Basic
    timeout: Number(process.env.INTER_TIMEOUT_MS ?? 20000),
    proxy: false as any,
  })

  const exp = now + Math.max(60, Number(data?.expires_in ?? 900))
  cache.set(scope, { token: data.access_token, exp })
  return data.access_token as string
}
