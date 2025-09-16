#!/usr/bin/env bash
set -euo pipefail

# =============== Guard rails =================
# Este script APAGA TODOS OS DADOS do schema 'public' do database apontado por $DATABASE_URL.
# Use SOMENTE em desenvolvimento.

# Caminho do projeto (raiz da API)
cd "$(dirname "$0")/.."  # volta para a raiz do pacote api

# Carrega .env se existir (sem reclamar se faltar)
if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

# Defaults defensivos (evita unbound com `set -u`)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-defy}"

# Verificações básicas
command -v psql >/dev/null || { echo "❌ psql não encontrado no PATH"; exit 1; }
: "${DATABASE_URL:?❌ DATABASE_URL não definido no ambiente (veja .env)}"
: "${DEFY_ENV:?❌ DEFY_ENV não definido no ambiente (veja .env)}"

if [[ "${DEFY_ENV}" != "dev" ]]; then
  echo "⛔  DEFY_ENV='${DEFY_ENV}' — este reset só roda em desenvolvimento."
  exit 1
fi

# Extrai host e dbname do DATABASE_URL (postgres://user:pass@host:port/db?qs)
DB_HOST="$(printf '%s' "$DATABASE_URL" | sed -E 's|^[^@]+@([^:/?]+).*|\1|')"
DB_NAME="$(printf '%s' "$DATABASE_URL" | sed -E 's|.*/([^/?]+)(\?.*)?$|\1|')"

case "${DB_HOST}" in
  localhost|127.0.0.1|db) ;; # ok
  *)
    echo "⛔  Host '${DB_HOST}' não está na allowlist (localhost, 127.0.0.1, db). Abortando."
    exit 1
    ;;
esac

# Mensagem de alerta
cat <<BANNER
⚠️  ATENÇÃO: RESET DO BANCO DE DADOS (SCHEMA PUBLIC)

  Ambiente:   ${DEFY_ENV}
  Host:       ${DB_HOST}
  Database:   ${DB_NAME}
  URL:        ${DATABASE_URL}

Isto vai executar:
  DROP SCHEMA public CASCADE; CREATE SCHEMA public;

Use SOMENTE em desenvolvimento. Esta ação é IRREVERSÍVEL.

BANNER

# Atalhos para automação
if [[ "${1:-}" == "--force" ]]; then
  CONFIRM_ENV="${DEFY_ENV}"
  CONFIRM_DB="${DB_NAME}"
else
  # Confirmação dupla
  read -r -p "Digite o NOME DO AMBIENTE para confirmar (esperado: ${DEFY_ENV}): " CONFIRM_ENV
  read -r -p "Digite o NOME DO BANCO para confirmar (esperado: ${DB_NAME}): " CONFIRM_DB
fi

if [[ "${CONFIRM_ENV}" != "${DEFY_ENV}" ]] || [[ "${CONFIRM_DB}" != "${DB_NAME}" ]]; then
  echo "❌ Confirmação rejeitada. Nada foi executado."
  exit 1
fi

# Dry-run opcional - não executa nada
if [[ "${DRY_RUN:-0}" == "1" ]]; then
  echo "🔎 DRY_RUN=1 — comandos que seriam executados:"
  echo "psql \"${DATABASE_URL}\" -v ON_ERROR_STOP=1 -c \"DROP SCHEMA public CASCADE; CREATE SCHEMA public;\""
  echo "npm run migrate"
  echo "npm run db:seed:dev   # opcional"
  exit 0
fi

# --- Backup (usa a URL completa) ---
if command -v pg_dump >/dev/null 2>&1; then
  BACKUP_DIR="${BACKUP_DIR:-/tmp/defy-backups}"
  mkdir -p "$BACKUP_DIR"
  BACKUP_FILE="$BACKUP_DIR/${DB_NAME:-defy}-$(date +%Y%m%d-%H%M%S).sql"
  echo "🧷 Gerando backup com pg_dump em: $BACKUP_FILE"
  pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
else
  echo "⚠️ pg_dump não encontrado; pulando backup."
fi
# --- fim do backup ---


# Execução
echo "🧨 Resetando schema 'public' em '${DB_NAME}' ..."
psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

echo "📦 Aplicando migrações..."
npm run -s migrate

# Se desejar, comente a próxima linha caso não queira popular automaticamente
if npm run -s db:seed:dev >/dev/null 2>&1; then
  echo "🌱 Seed (dev) aplicado."
else
  echo "ℹ️  Seed (dev) não executado ou script ausente — siga com 'npm run db:seed:dev' se quiser popular."
fi

echo "✅ Reset concluído com sucesso."
