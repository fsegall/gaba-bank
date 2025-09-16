import 'dotenv/config'
import { pool } from '../../../src/db.js'
import { randomUUID } from 'crypto'

async function main() {
  const ext = 'txid-node-001'
  const userId = randomUUID()

  await pool.query(
    `select upsert_provider_tx($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    ['inter','deposit',ext,'started', userId, 2500, null, 'BRL', null, null, { from:'node:first' }]
  )
  await pool.query(
    `select upsert_provider_tx($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    ['inter','deposit',ext,'completed', null, 3100, null, 'BRL', null, null, { from:'node:update' }]
  )

  const { rows } = await pool.query(
    `select provider, kind, external_id, status, amount_in_units, user_id
       from provider_transactions where provider=$1 and external_id=$2`,
    ['inter', ext]
  )
  console.log(rows[0])
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
