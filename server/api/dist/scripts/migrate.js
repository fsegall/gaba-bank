// scripts/migrate.ts
import 'dotenv/config';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'node:crypto';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_URL = process.env.DATABASE_URL ??
    `postgres://${process.env.PGUSER ?? 'defy'}:${process.env.PGPASSWORD ?? 'defy'}@${process.env.PGHOST ?? 'localhost'}:${process.env.PGPORT ?? '5432'}/${process.env.PGDATABASE ?? 'defy'}`;
const SQL_DIR = process.env.SQL_DIR ?? path.resolve(__dirname, '..', 'sql');
const LOCK_KEY = 727272; // igual ao shell
function sha256(buf) {
    const h = createHash('sha256');
    h.update(buf);
    return h.digest('hex');
}
async function ensureMigrationsTable(pool) {
    await pool.query(`
    create table if not exists migrations (
      id serial primary key,
      filename text unique not null,
      checksum text not null,
      applied_at timestamptz default now()
    );
  `);
}
async function withAdvisoryLock(pool, fn) {
    const c = await pool.connect();
    try {
        const r = await c.query('select pg_try_advisory_lock($1) as ok', [LOCK_KEY]);
        if (!r.rows[0]?.ok) {
            throw new Error('migrations: another runner is active');
        }
        return await fn();
    }
    finally {
        try {
            await c.query('select pg_advisory_unlock($1)', [LOCK_KEY]);
        }
        catch { }
        c.release();
    }
}
async function applyFile(pool, filePath) {
    const filename = path.basename(filePath);
    const sql = fs.readFileSync(filePath);
    const sum = sha256(sql);
    const { rows } = await pool.query('select checksum from migrations where filename = $1', [filename]);
    const existing = rows[0]?.checksum;
    if (!existing) {
        console.log(`→ Applying: ${filename}`);
        const client = await pool.connect();
        try {
            await client.query('begin');
            await client.query(sql.toString()); // uma transação por arquivo
            await client.query('insert into migrations(filename, checksum) values ($1,$2)', [filename, sum]);
            await client.query('commit');
            console.log(`✓ Migration ${filename} applied and recorded`);
        }
        catch (e) {
            try {
                await client.query('rollback');
            }
            catch { }
            throw e;
        }
        finally {
            client.release();
        }
    }
    else if (existing !== sum) {
        throw new Error(`Checksum mismatch em ${filename}. O arquivo foi alterado após aplicado. Crie uma nova migration de correção.`);
    }
    else {
        console.log(`↷ Migration ${filename} já aplicada, pulando`);
    }
}
async function main() {
    console.log(`DB: ${DB_URL}`);
    const pool = new Pool({ connectionString: DB_URL });
    try {
        await pool.query('select 1'); // sanity
        await ensureMigrationsTable(pool);
        const files = fs
            .readdirSync(SQL_DIR)
            .filter((f) => f.endsWith('.sql'))
            .sort((a, b) => a.localeCompare(b, 'en'));
        if (files.length === 0) {
            console.log(`Nenhum .sql em ${SQL_DIR}`);
            return;
        }
        await withAdvisoryLock(pool, async () => {
            for (const f of files) {
                await applyFile(pool, path.join(SQL_DIR, f));
            }
        });
        console.log('🎉 migrations ok');
    }
    finally {
        await pool.end();
    }
}
main().catch((e) => {
    console.error('❌ migration failed');
    console.error(e);
    process.exit(1);
});
