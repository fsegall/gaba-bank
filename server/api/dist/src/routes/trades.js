// src/routes/trades.ts
import { Router } from 'express';
import { pool } from '../db.js';
export const router = Router();
router.get('/trades', async (req, res) => {
    const { order_id, limit = 50 } = req.query;
    const rows = await pool.query(`select * from trades
     ${order_id ? 'where order_id = $1' : ''}
     order by created_at desc
     limit ${Number(limit)}`, order_id ? [order_id] : []);
    res.json(rows.rows);
});
