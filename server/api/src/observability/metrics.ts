// src/observability/metrics.ts
import { Router } from 'express'
import {
  Registry,
  collectDefaultMetrics,
  Counter,
  Histogram,
  Gauge,
} from 'prom-client'

export const register = new Registry()
collectDefaultMetrics({ register })

// ==== Métricas principais ====

// PSP (webhook)
export const pspWebhookReceivedTotal = new Counter({
  name: 'psp_webhook_received_total',
  help: 'PSP webhooks received',
  labelNames: ['type'],
  registers: [register],
})

export const pspWebhookBadSignatureTotal = new Counter({
  name: 'psp_webhook_bad_signature_total',
  help: 'PSP webhooks rejected due to signature validation',
  registers: [register],
})

export const pspWebhookReplayedTotal = new Counter({
  name: 'psp_webhook_replayed_total',
  help: 'PSP webhooks ignored due to idempotency (already processed)',
  registers: [register],
})

export const brlCreditedTotalCentavos = new Counter({
  name: 'brl_credited_total_centavos',
  help: 'Total credited to BRL wallets (centavos)',
  registers: [register],
})

// Orders
export const ordersCreatedTotal = new Counter({
  name: 'orders_created_total',
  help: 'Orders created',
  labelNames: ['side', 'symbol'],
  registers: [register],
})

export const ordersFilledTotal = new Counter({
  name: 'orders_filled_total',
  help: 'Orders filled',
  labelNames: ['side', 'symbol'],
  registers: [register],
})

// SELL chunks
export const chunkSellExecutedTotal = new Counter({
  name: 'chunk_sell_executed_total',
  help: 'Sell chunks executed',
  labelNames: ['symbol', 'status'], // status: ok|error
  registers: [register],
})

export const chunkSellDurationSeconds = new Histogram({
  name: 'chunk_sell_duration_seconds',
  help: 'Duration of a SELL chunk execution (seconds)',
  labelNames: ['symbol'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 30],
  registers: [register],
})

// AUTOBUY chunks
export const chunkBuyExecutedTotal = new Counter({
  name: 'chunk_buy_executed_total',
  help: 'Autobuy chunks executed',
  labelNames: ['product_id', 'symbol', 'status'], // status: ok|error
  registers: [register],
})

export const chunkBuyDurationSeconds = new Histogram({
  name: 'chunk_buy_duration_seconds',
  help: 'Duration of an AUTOBUY chunk execution (seconds)',
  labelNames: ['product_id', 'symbol'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 30],
  registers: [register],
})

export const autobuyOrdersCreatedTotal = new Counter({
  name: 'autobuy_orders_created_total',
  help: 'Autobuy orders created per allocation',
  labelNames: ['product_id', 'symbol'],
  registers: [register],
})

export const autobuySkippedTotal = new Counter({
  name: 'autobuy_skipped_total',
  help: 'Autobuy skipped because orders already exist for deposit',
  registers: [register],
})
  
export const autobuyChunksExecutedTotal = new Counter({
name: 'autobuy_chunks_executed_total',
help: 'Chunks de autobuy executados (ok/duplicate/error)',
labelNames: ['symbol', 'status'] as const,
})

export const autobuyChunkDurationSeconds = new Histogram({
name: 'autobuy_chunk_duration_seconds',
help: 'Duração do processamento de cada chunk do autobuy',
labelNames: ['symbol'] as const,
buckets: [0.01, 0.05, 0.1, 0.3, 1, 2, 5],
})

// Opcional: carteira em BRL observável (last value)
export const brlWalletGauge = new Gauge({
  name: 'wallet_brl_last_value',
  help: 'Last observed BRL wallet value (human units)',
  labelNames: ['user_id'],
  registers: [register],
})

// ==== Rota /metrics ====
export const metricsRouter = Router()
metricsRouter.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
})

// --- NOVAS MÉTRICAS DE PSP (utilizadas pelo webhook) ---

export const pspWebhookHandledTotal = new Counter({
  name: 'psp_webhook_handled_total',
  help: 'PSP webhooks handled by outcome',
  labelNames: ['outcome'] as const, // ok|error|ignored|bad_signature|replay_window|idempotent
  registers: [register],
})

export const pspWebhookProcessingSeconds = new Histogram({
  name: 'psp_webhook_processing_seconds',
  help: 'Latency of PSP webhook processing (seconds)',
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
  registers: [register],
})