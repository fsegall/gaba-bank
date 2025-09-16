import { Router, Request, Response } from 'express'
import { z, ZodError } from 'zod'
import { randomUUID } from 'crypto'
import { createPixCharge, getPixCharge, payPix } from '../providers/inter/client.js'
import { normalizePixKey } from '../util/pix.js'
import promClient from 'prom-client'
import { makeTxid } from '../util/txid.js'

export const router = Router()

console.log('[pix] router carregado (base: /api/pix)')

const reqCount = new promClient.Counter({
  name: 'inter_http_requests_total',
  help: 'Reqs p/ Inter',
  labelNames: ['route','method','status'] as const,
})

const reqLatency = new promClient.Histogram({
  name: 'inter_http_request_duration_seconds',
  help: 'Latência das rotas PIX (s)',
  labelNames: ['route','method','status'] as const,
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 3, 5],
})

// ping simples
router.get('/__ping', (_req, res) => res.json({ ok: true, when: new Date().toISOString() }))

const createBody = z.object({
  amount: z.string().regex(/^\d{1,10}\.\d{2}$/),
  payer: z.object({
    nome: z.string().min(1),
    cpf: z.string().optional(),
    cnpj: z.string().optional(),
  }).optional(),
  seed: z.string().default(() => randomUUID()),
})



router.post('/cob', async (req, res) => {
  const end = reqLatency.startTimer({ route: 'cob', method: 'POST' })
  try {
    const { amount, payer, seed } = createBody.parse(req.body)
    const txid = makeTxid(seed)
    const data = await createPixCharge({ txid, amount, payer })
    reqCount.labels({ route: 'cob', method: 'POST', status: '200' }).inc()
    res.json({ txid, ...data })
  } catch (e:any) {
    if (e instanceof ZodError) {
      reqCount.labels({ route: 'cob', method: 'POST', status: '400' }).inc()
      res.status(400).json({ error: 'invalid_request', details: e.flatten() })
    } else {
      const status = e?.response?.status ?? 500
      reqCount.labels({ route: 'cob', method: 'POST', status: String(status) }).inc()
      res.status(status).json({ error: e?.message ?? 'internal_error', data: e?.response?.data })
    }
  } finally {
    end({ status: String(res.statusCode) })
  }
})

router.get('/cob/:txid', async (req, res) => {
  const end = reqLatency.startTimer({ route: 'cob-get', method: 'GET' })
  try {
    const data = await getPixCharge(req.params.txid)
    reqCount.labels({ route: 'cob-get', method: 'GET', status: '200' }).inc()
    res.json(data)
  } catch (e:any) {
    const status = e?.response?.status ?? 500
    reqCount.labels({ route: 'cob-get', method: 'GET', status: String(status) }).inc()
    res.status(status).json({ error: e?.message ?? 'internal_error', data: e?.response?.data })
  } finally {
    end({ status: String(res.statusCode) })
  }
})

// Pagamento (Banking v2): usar "idempotency" (aceita "txid" legado e normaliza)
const payBody = z.object({
  idempotency: z.string().min(1).optional(),      // novo nome
  txid: z.string().min(1).optional(),             // legado
  chave: z.string().min(1).transform(v => normalizePixKey(v)),
  amount: z.string().regex(/^\d{1,10}\.\d{2}$/),
  descricao: z.string().optional(),
})
.refine(d => d.idempotency || d.txid, {
  message: 'idempotency (ou txid legado) é obrigatório'
})
.transform(d => ({
  idempotency: d.idempotency ?? d.txid!,
  chave: d.chave, amount: d.amount, descricao: d.descricao
}))

router.post('/pay', async (req, res) => {
  const end = reqLatency.startTimer({ route: 'pay', method: 'POST' })
  try {
    const { idempotency, chave, amount, descricao } = payBody.parse(req.body) as any
    const data = await payPix({ idempotency, chave, amount, descricao })
    reqCount.labels({ route: 'pay', method: 'POST', status: '200' }).inc()
    res.json(data)
  } catch (e:any) {
    if (e instanceof ZodError) {
      reqCount.labels({ route: 'pay', method: 'POST', status: '400' }).inc()
      res.status(400).json({ error: 'invalid_request', details: e.flatten() })
    } else {
      const status = e?.response?.status ?? 500
      reqCount.labels({ route: 'pay', method: 'POST', status: String(status) }).inc()
      res.status(status).json({ error: e?.message ?? 'internal_error', data: e?.response?.data })
    }
  } finally {
    end({ status: String(res.statusCode) })
  }
})
