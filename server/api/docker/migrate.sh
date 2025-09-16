#!/usr/bin/env bash
set -euo pipefail

# ===== Config =====
DB_URL="${DATABASE_URL:-}"
PGHOST="${PGHOST:-db}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-defy}"
PGPASSWORD="${PGPASSWORD:-defy}"
PGDATABASE="${PGDATABASE:-defy}"
SQL_DIR="${SQL_DIR:-/app/sql}"   # no container
WAIT_SECS="${MIGRATOR_WAIT_SECS:-60}"  # espera do DB

export PGPASSWORD

psql_cmd() {
  if [[ -n "$DB_URL" ]]; then
    psql "$DB_URL" -v ON_ERROR_STOP=1 "$@"
  else
    psql "host=$PGHOST port=$PGPORT user=$PGUSER dbname=$PGDATABASE" -v ON_ERROR_STOP=1 "$@"
  fi
}

# ===== Espera pelo DB =====
echo "⏳ Aguardando Postgres (${DB_URL:-$PGUSER@$PGHOST:$PGPORT/$PGDATABASE}) ..."
for i in $(seq 1 "$WAIT_SECS"); do
  if psql_cmd -c 'select 1;' >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
psql_cmd -c 'select 1;' >/dev/null
echo "✅ Postgres OK"

# ===== Tabela de controle + lock global =====
psql_cmd <<'SQL'
create table if not exists migrations (
  id serial primary key,
  filename text unique not null,
  checksum text not null,
  applied_at timestamptz default now()
);
-- tenta lock; se já estiver rodando em paralelo, aborta
do $$
begin
  if not pg_try_advisory_lock(727272) then
    raise exception 'migrations: another runner is active';
  end if;
end$$;
SQL

# ===== Função: sha256 do arquivo =====
sha256() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

# ===== Lista ordenada de migrations =====
shopt -s nullglob
mapfile -t FILES < <(ls -1 "$SQL_DIR"/*.sql 2>/dev/null | LC_ALL=C sort)
if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "ℹ️  Nenhum arquivo .sql em $SQL_DIR"; exit 0
fi

echo "🚀 Aplicando migrations de $SQL_DIR ..."
for migration in "${FILES[@]}"; do
  filename="$(basename "$migration")"
  sum="$(sha256 "$migration")"
  safe_filename=$(printf "%s" "$filename" | sed "s/'/''/g")

  existing_sum=$(psql_cmd -tA -c "select checksum from migrations where filename = '$safe_filename'" || true)

  if [[ -z "$existing_sum" ]]; then
    echo "→ Applying: $filename"
    psql_cmd -1 -f "$migration"
    psql_cmd -c "insert into migrations(filename, checksum) values ('$safe_filename', '$sum')"
    echo "✓ Migration $filename applied and recorded"
  else
    if [[ "$existing_sum" != "$sum" ]]; then
      echo "❌ Checksum mismatch para $filename"
      echo "    O arquivo foi alterado após aplicado. Crie uma nova migration de correção."
      psql_cmd -c "select pg_advisory_unlock(727272);" >/dev/null || true
      exit 1
    fi
    echo "↷ Migration $filename já aplicada, pulando"
  fi
done


# libera lock
psql_cmd -c "select pg_advisory_unlock(727272);" >/dev/null || true

echo "🎉 Migration check completed!"
