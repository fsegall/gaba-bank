// src/routes/debug.ts -- Só em ambiente de desenvolvimento
import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { pool } from '../db.js'
export const router = Router()

router.get('/_debug/orders_view', async (_req, res) => {
  const r = await pool.query(`select * from vw_orders_with_trades order by created_at desc limit 50`)
  res.json(r.rows)
})

router.get('/_debug/wallet_brl_check', async (_req, res) => {
  const r = await pool.query(`select * from vw_wallet_brl_check order by user_id asc limit 50`)
  res.json(r.rows)
})
