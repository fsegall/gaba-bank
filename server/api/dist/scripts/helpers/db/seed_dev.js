// scripts/seed_dev.ts
import 'dotenv/config';
import { Pool } from 'pg';
async function main() {
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) {
        console.error('seed_dev: defina DATABASE_URL no .env');
        process.exit(1);
    }
    const pool = new Pool({ connectionString: DATABASE_URL });
    const c = await pool.connect();
    try {
        await c.query('begin');
        // Usuário dev fixo
        const USER_ID = '00000000-0000-0000-0000-000000000001';
        await c.query(`insert into users (id, email, cpf, kyc_status, risk_tier)
       values ($1,'dev@defy.local','000.000.000-00','approved','standard')
       on conflict (id) do update set kyc_status='approved', risk_tier='standard'`, [USER_ID]);
        // Zera/garante wallet BRL
        await c.query(`insert into wallets (user_id, asset, balance)
       values ($1,'BRL',0)
       on conflict (user_id, asset) do update set balance=0, updated_at=now()`, [USER_ID]);
        // Limpa tabelas de movimento (dev only)
        await c.query(`truncate table deposits, orders, trades, provider_events restart identity cascade`);
        await c.query('commit');
        console.log('seed_dev: OK');
    }
    catch (e) {
        await c.query('rollback');
        console.error('seed_dev: erro', e);
        process.exit(1);
    }
    finally {
        c.release();
        await pool.end();
    }
}
main();
