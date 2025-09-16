import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { tx } from '../db.js'
import { psp } from '../services/psp.js'
import crypto from 'crypto'
export const router = Router()

router.post('/depositos', async (req: Request, res: Response) => {
  const Body = z.object({ valor_centavos: z.number().int().positive() })
  const { valor_centavos } = Body.parse(req.body)
  const userId = req.header('x-user-id') || '00000000-0000-0000-0000-000000000001'
  const txid = `TX-${crypto.randomUUID()}`
  const cobranca = await psp.criarCobranca({ valor_centavos, txid })
  await tx(async (c) => {
      // garante usuário em dev (kyc approved só para ambiente de desenvolvimento)
  await c.query(
    `insert into users (id, kyc_status) values ($1,'approved')
     on conflict (id) do nothing`,
    [userId]
  );

  await c.query(
    `insert into deposits (user_id, valor_centavos, txid, status)
     values ($1,$2,$3,'aguardando_pagamento')`,
    [userId, valor_centavos, txid]
  );
  })
  return res.json({ txid, qr_code: cobranca.qr_code, copia_cola: cobranca.copia_cola })
})
