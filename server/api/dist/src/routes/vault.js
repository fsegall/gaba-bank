import { Router } from "express";
import { Address, Contract, TransactionBuilder, BASE_FEE, nativeToScVal, rpc } from "@stellar/stellar-sdk";
import { Pool } from "pg";
import child_process from "node:child_process";
import util from "node:util";
const r = Router();
const exec = util.promisify(child_process.exec);
// --- ENV & wiring ---
const RPC_URL = process.env.SOROBAN_RPC_URL;
const PASSPHRASE = process.env.STELLAR_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015";
const VAULT_C = process.env.VAULT_C; // defina após init
const USDC_DECIMALS = Number(process.env.USDC_DECIMALS || 7);
// DB (ajuste se já tiver pool exportado)
const pg = new Pool({ connectionString: process.env.DATABASE_URL });
// --- helpers ---
function parseHumanToUnits(v, d = USDC_DECIMALS) {
    const [i, f = ""] = String(v).trim().split(".");
    const pad = (f + "0".repeat(d)).slice(0, d);
    return BigInt((i || "0") + pad);
}
async function buildInvokeXdr(sourceG, contractId, fn, args) {
    const server = new rpc.Server(RPC_URL, { allowHttp: true });
    const account = await server.getAccount(sourceG);
    const tx = new TransactionBuilder(account, { fee: String(BASE_FEE), networkPassphrase: PASSPHRASE })
        .addOperation(new Contract(contractId).call(fn, ...args))
        .setTimeout(180)
        .build();
    // simulate & prepare (footprint/auth) – retorna XDR pronto p/ assinar no Freighter
    const sim = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(sim)) {
        throw new Error(`simulation failed: ${JSON.stringify(sim, null, 2)}`);
    }
    const prepared = await server.prepareTransaction(tx);
    return prepared.toXDR();
}
// --- XDR builders (Freighter assina/enviar) ---
r.post("/vault/tx/deposit", async (req, res, next) => {
    try {
        const { fromG, toG, amount } = req.body || {};
        if (!fromG || !amount)
            return res.status(400).json({ error: "fromG and amount are required" });
        const amountUnits = parseHumanToUnits(String(amount));
        const xdr = await buildInvokeXdr(fromG, VAULT_C, "deposit", [
            Address.fromString(fromG).toScVal(),
            Address.fromString(toG || fromG).toScVal(),
            nativeToScVal(amountUnits.toString(), { type: "i128" }),
        ]);
        res.json({ xdr, network: PASSPHRASE });
    }
    catch (e) {
        next(e);
    }
});
r.post("/vault/tx/withdraw", async (req, res, next) => {
    try {
        const { ownerG, toG, shares } = req.body || {};
        if (!ownerG || !shares)
            return res.status(400).json({ error: "ownerG and shares are required" });
        const sharesUnits = parseHumanToUnits(String(shares));
        const xdr = await buildInvokeXdr(ownerG, VAULT_C, "withdraw", [
            Address.fromString(ownerG).toScVal(),
            Address.fromString(toG || ownerG).toScVal(),
            nativeToScVal(sharesUnits.toString(), { type: "i128" }),
        ]);
        res.json({ xdr, network: PASSPHRASE });
    }
    catch (e) {
        next(e);
    }
});
// --- Views rápidas (opção “ganha tempo” via CLI) ---
// Usa `stellar contract invoke --send=no` e parseia stdout. Substitua depois por SDK se quiser.
async function viewI128(fn) {
    const cmd = `stellar contract invoke --id ${VAULT_C} --source-account ${process.env.VIEW_G || process.env.ADMIN_G} ` +
        `--rpc-url "${RPC_URL}" --network-passphrase "${PASSPHRASE}" -- ${fn}`;
    const { stdout } = await exec(cmd);
    // stdout tipicamente já vem como inteiro/JSON – sanitize simples:
    return stdout.trim().replace(/[^0-9.-]/g, "");
}
r.get("/vault/views", async (_req, res, next) => {
    try {
        const [ta, ts, ppsScaled] = await Promise.all([
            viewI128("total_assets"),
            viewI128("total_shares"),
            viewI128("price_per_share_scaled"),
        ]);
        // Converte i128 para decimais humanos (tvl e totalShares)
        const toHuman = (u) => {
            const s = u.padStart(USDC_DECIMALS + 1, "0");
            const head = s.slice(0, -USDC_DECIMALS) || "0";
            const tail = s.slice(-USDC_DECIMALS).replace(/0+$/, "");
            return tail ? `${head}.${tail}` : head;
        };
        res.json({
            tvl: toHuman(ta),
            totalShares: toHuman(ts),
            pps: (Number(ppsScaled) / 1_000_000).toFixed(6), // 1e6 scale no contrato
        });
    }
    catch (e) {
        next(e);
    }
});
// --- Eventos & posição (DB) ---
r.get("/vault/events", async (req, res, next) => {
    try {
        const { user_id, limit = 50 } = req.query;
        const params = [];
        let sql = `SELECT kind, amount, shares, tx_hash, created_at FROM vault_events`;
        if (user_id) {
            sql += ` WHERE user_id = $1`;
            params.push(user_id);
        }
        sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
        params.push(Number(limit));
        const q = await pg.query(sql, params);
        res.json(q.rows);
    }
    catch (e) {
        next(e);
    }
});
r.get("/vault/position", async (req, res, next) => {
    try {
        const { user_id, vault_address } = req.query;
        if (!user_id || !vault_address)
            return res.status(400).json({ error: "user_id and vault_address are required" });
        const q = await pg.query(`SELECT shares FROM vault_positions WHERE user_id=$1 AND vault_address=$2`, [user_id, vault_address]);
        res.json({ shares: q.rows[0]?.shares ?? "0" });
    }
    catch (e) {
        next(e);
    }
});
// --- Persistência simples pós-envio (opcional, front chama após Freighter retornar hash) ---
r.post("/vault/log", async (req, res, next) => {
    try {
        const { user_id, vault_address, kind, amount, shares, tx_hash, payload } = req.body || {};
        if (!user_id || !vault_address || !kind)
            return res.status(400).json({ error: "missing fields" });
        await pg.query(`INSERT INTO vault_events (user_id, vault_address, kind, amount, shares, tx_hash, payload)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`, [user_id, vault_address, kind, amount ?? null, shares ?? null, tx_hash ?? null, payload ?? null]);
        res.json({ ok: true });
    }
    catch (e) {
        next(e);
    }
});
export default r;
