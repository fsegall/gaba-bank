import { Router } from 'express';
import { z } from 'zod';
import { soroswap } from '../services/soroswap.js';
import { sanityCheckBRLUSDC, getUSDCperBRL_fromReflector } from '../services/oracle.js';
export const router = Router();
router.get('/quote', async (req, res) => {
    const Q = z.object({ pair: z.string(), amountIn: z.string() });
    const { pair, amountIn } = Q.parse(req.query);
    const q = await soroswap.quote({ pair, amountIn });
    // Verificação de oráculo para pares BRL/USDC
    let oraclePrice;
    if (process.env.ORACLE_SANITY_ENABLED === 'true' && pair.toLowerCase().includes('brl')) {
        try {
            const oracleData = await getUSDCperBRL_fromReflector();
            oraclePrice = oracleData.price;
            await sanityCheckBRLUSDC(q.poolMid);
        }
        catch (error) {
            return res.status(409).json({
                error: 'oracle_veto',
                message: error.message,
                poolMid: q.poolMid,
                oraclePrice
            });
        }
    }
    return res.json({ ...q, oraclePrice });
});
