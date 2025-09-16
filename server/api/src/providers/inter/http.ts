// src/providers/inter/http.ts
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import axios, { AxiosInstance } from 'axios'
import https from 'https'

// === Augment Axios p/ aceitar interScope ===
declare module 'axios' {
  // ambos são necessários
  interface AxiosRequestConfig { interScope?: string }
  interface InternalAxiosRequestConfig { interScope?: string }
}

let cached: AxiosInstance | null = null

type TokenInfo = { token: string; exp: number }
const tokenCache = new Map<string, TokenInfo>()

// Expande ${VAR}
const expand = (s?: string) =>
  s?.replace(/\$\{([A-Z0-9_]+)\}/gi, (_, k) => process.env[k] ?? '')

// Lê arquivo se existir (senão retorna undefined)
function readMaybe(p?: string) {
  if (!p) return undefined
  const full = path.resolve(p)
  return fs.existsSync(full) ? fs.readFileSync(full) : undefined
}

function resolveCreds() {
  const env = (process.env.INTER_ENV ?? 'homolog').toLowerCase()
  const clientId =
    process.env.INTER_CLIENT_ID ??
    (env === 'prod' ? process.env.INTER_CLIENT_ID_PROD : process.env.INTER_CLIENT_ID_HOMOLOG)
  const clientSecret =
    process.env.INTER_CLIENT_SECRET ??
    (env === 'prod' ? process.env.INTER_CLIENT_SECRET_PROD : process.env.INTER_CLIENT_SECRET_HOMOLOG)

  const baseURL = (process.env.INTER_BASE_URL ?? '').replace(/\/$/, '')
  const tokenURL = process.env.INTER_TOKEN_URL ?? (baseURL ? `${baseURL}/oauth/v2/token` : '')

  if (!baseURL) throw new Error('INTER_BASE_URL não configurado')
  if (!tokenURL) throw new Error('INTER_TOKEN_URL não configurado')
  if (!clientId || !clientSecret) throw new Error('INTER_CLIENT_ID/INTER_CLIENT_SECRET não configurados')

  return { baseURL, tokenURL, clientId, clientSecret }
}

async function fetchToken(agent: https.Agent, scopeRaw: string): Promise<TokenInfo> {
  const { tokenURL, clientId, clientSecret } = resolveCreds()
  const scope = (scopeRaw || process.env.INTER_OAUTH_SCOPE || 'pix.read').trim()
  const params = new URLSearchParams({ grant_type: 'client_credentials', scope })

  const resp = await axios.post(tokenURL, params, {
    httpsAgent: agent,
    auth: { username: clientId, password: clientSecret },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 20_000,
    // se houver proxy corporativo, comente a linha abaixo
    proxy: false as any,
    validateStatus: () => true,
  })

  if (resp.status >= 400) {
    const body = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data ?? {})
    throw new Error(`Falha token (${resp.status}): ${body?.slice(0, 300)}`)
  }

  const now = Math.floor(Date.now() / 1000)
  return { token: resp.data.access_token, exp: now + (resp.data.expires_in ?? 900) }
}

function makeAgent(): https.Agent {
  const pfxPath = expand(process.env.INTER_PFX_PATH)
  if (pfxPath) {
    const pfx = readMaybe(pfxPath)
    if (!pfx) throw new Error(`INTER_PFX_PATH inválido: ${pfxPath}`)
    return new https.Agent({
      pfx,
      passphrase: process.env.INTER_PFX_PASSPHRASE,
      keepAlive: true,
      minVersion: 'TLSv1.2',
    })
  }

  const cert = readMaybe(expand(process.env.INTER_CERT_PATH))
  const key  = readMaybe(expand(process.env.INTER_KEY_PATH))
  const ca   = readMaybe(expand(process.env.INTER_CA_PATH))
  if (!cert || !key || !ca) throw new Error('Certificados CRT/KEY/CA não configurados')

  return new https.Agent({ cert, key, ca, keepAlive: true, minVersion: 'TLSv1.2' })
}

export function interHttp(): AxiosInstance {
  if (cached) return cached

  const { baseURL } = resolveCreds()
  const agent = makeAgent()

  const http = axios.create({
    baseURL,
    httpsAgent: agent,
    timeout: Number(process.env.INTER_TIMEOUT_MS ?? 25_000),
    headers: { Accept: 'application/json' },
    // vamos lançar manualmente no interceptor de response
    validateStatus: () => true,
  })

  // === Request: injeta Bearer baseado no interScope ===
  http.interceptors.request.use(async (cfg) => {
    const scopeKey = (cfg.interScope || process.env.INTER_OAUTH_SCOPE || 'pix.read').trim()
    const now = Math.floor(Date.now() / 1000)
    let tok = tokenCache.get(scopeKey)

    if (!tok || tok.exp - 15 <= now) {
      tok = await fetchToken(agent, scopeKey)
      tokenCache.set(scopeKey, tok)
    }

    cfg.headers = cfg.headers ?? {}
    ;(cfg.headers as any)['Authorization'] = `Bearer ${tok.token}`
    return cfg
  })

  // === Response: se >=400, log e lança erro com detalhes ===
  http.interceptors.response.use(
    (resp) => {
      if (resp.status >= 400) {
        const body = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data ?? {})
        if (process.env.LOG_LEVEL !== 'silent') {
          console.error('[inter http error]', {
            url: resp.config?.url,
            method: resp.config?.method,
            status: resp.status,
            headers: resp.headers,
            bodyPreview: body.slice(0, 500),
          })
        }
        const err = new Error(`Inter ${resp.status}`)
        ;(err as any).response = resp
        throw err
      }
      return resp
    },
    (err) => {
      console.error('[inter transport error]', err?.message || String(err))
      throw err
    }
  )

  cached = http
  return http
}
