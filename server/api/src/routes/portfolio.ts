// src/routes/portfolio.ts
import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { pool } from '../db.js'
export const router = Router()

router.get('/portfolio', async (req, res) => {
  const userId = req.header('x-user-id') || '00000000-0000-0000-0000-000000000001'

  const { rows: wallets } = await pool.query(
    `select asset,
            trim(trailing '.' from to_char(balance, 'FM999999999999990.9999999999')) as balance
       from wallets
      where user_id = $1
      order by asset`,
    [userId]
  )

  const { rows: orders } = await pool.query(
    `select id, product_id, side, symbol, amount_brl_centavos, status, created_at
       from orders
      where user_id = $1
      order by created_at desc
      limit 50`,
    [userId]
  )

  res.json({ wallets, orders })
})

router.get('/vaults/:id/position', async (req, res) => {
  const { id } = req.params; const userId = String(req.query.user_id);
  const r = await pool.query(`select * from vault_positions where user_id=$1 and vault_id=$2`, [userId, id]);
  res.json(r.rows[0] ?? { user_id: userId, vault_id: id, shares: '0', principal_base_units: '0' });
});