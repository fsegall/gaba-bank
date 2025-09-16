import { pool } from '../db.js'

type Status = 'started'|'pending'|'completed'|'failed'
type Kind = 'deposit'|'withdraw'
type Provider = 'inter'|'circle'|'anchor'

export async function upsertProviderTx(p: {
  provider: Provider
  kind: Kind
  external_id: string
  status: Status
  user_id?: string | null
  amount_in_units?: number | null
  amount_out_units?: number | null
  asset_code?: string | null
  asset_issuer?: string | null
  interactive_url?: string | null
  metadata?: any
}) {
  const q = `select upsert_provider_tx($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) as id`
  const vals = [
    p.provider, p.kind, p.external_id, p.status,
    p.user_id ?? null,
    p.amount_in_units ?? null,
    p.amount_out_units ?? null,
    p.asset_code ?? null,
    p.asset_issuer ?? null,
    p.interactive_url ?? null,
    p.metadata ?? null,
  ]
  const { rows } = await pool.query(q, vals)
  return rows[0].id as string
}
