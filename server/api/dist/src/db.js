// src/db.ts
import 'dotenv/config';
import { Pool, types as pgTypes } from 'pg';
import fs from 'fs';
const OID_BIGINT = 20;
const OID_NUMERIC = 1700;
pgTypes.setTypeParser(OID_BIGINT, (v) => BigInt(v));
pgTypes.setTypeParser(OID_NUMERIC, (v) => v);
const IN_DOCKER = fs.existsSync('/.dockerenv');
const DEFAULT_URL = IN_DOCKER
    ? 'postgres://defy:defy@db:5432/defy'
    : 'postgres://defy:defy@localhost:5433/defy';
// --- NOVO: sanitiza DATABASE_URL quando fora do Docker ---
function resolveConnString() {
    const raw = process.env.DATABASE_URL ?? DEFAULT_URL;
    try {
        const u = new URL(raw);
        const looksDockerHost = (h) => h === 'db' || h === 'postgres' || h === 'postgresql';
        if (!IN_DOCKER && looksDockerHost(u.hostname)) {
            // fora do Docker, trocar por host/porta locais
            u.hostname = 'localhost';
            u.port = process.env.DB_HOST_PORT || '5433';
            return u.toString();
        }
        return raw;
    }
    catch {
        return raw;
    }
}
const connectionString = resolveConnString();
export const pool = new Pool({
    connectionString,
    application_name: process.env.APP_NAME ?? 'defy-api',
    max: Number(process.env.PGPOOL_MAX ?? 10),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS ?? 30_000),
    connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS ?? 5_000),
    statement_timeout: Number(process.env.PG_STMT_TIMEOUT_MS ?? 30_000),
    query_timeout: Number(process.env.PG_QUERY_TIMEOUT_MS ?? 30_000),
});
pool.on('error', (err) => {
    console.error('[pg] idle client error:', err);
});
export async function withClient(fn) {
    const c = await pool.connect();
    try {
        return await fn(c);
    }
    finally {
        c.release();
    }
}
export async function tx(fn, client) {
    if (client) {
        const sp = `sp_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
        await client.query(`SAVEPOINT ${sp}`);
        try {
            const v = await fn(client);
            await client.query(`RELEASE SAVEPOINT ${sp}`);
            return v;
        }
        catch (e) {
            await client.query(`ROLLBACK TO SAVEPOINT ${sp}`);
            throw e;
        }
    }
    else {
        const c = await pool.connect();
        try {
            await c.query('BEGIN');
            const v = await fn(c);
            await c.query('COMMIT');
            return v;
        }
        catch (e) {
            try {
                await c.query('ROLLBACK');
            }
            catch { }
            throw e;
        }
        finally {
            c.release();
        }
    }
}
export async function dbHealth() {
    try {
        await pool.query('select 1');
        return true;
    }
    catch {
        return false;
    }
}
