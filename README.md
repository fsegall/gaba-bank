# Defy Invest — Monorepo

Monorepo for Defy Invest MVP: a community banking app built on Stellar. It contains:

- `gaba-bank/` — React/TypeScript frontend (Vite) with MSW mocks
- `server/` — TypeScript API server with Docker tooling and SQL migrations
- `gaba-bank/contracts/` — Soroban smart contracts (Rust) and examples

This README gives you a one‑page guide to run everything locally. See per‑package READMEs for deep dives.

---

## Repository Layout

```
./
├─ gaba-bank/                 # Frontend app (Vite, React, TS)
│  ├─ README.md
│  └─ src/ ...
├─ server/                    # API server (Node/TS)
│  ├─ README.md               # Detailed ops/dev docs
│  └─ api/, src/, sql/ ...
├─ openapi.yaml               # API surface (root copy)
└─ gaba-bank/contracts/       # Soroban contracts (Rust)
```

---

## Quickstart

Choose the setup that best fits your goal.

### Option A: Frontend‑only (mocked backend)

The frontend ships with MSW mocks so you can explore the UI without the server.

```bash
cd gaba-bank
npm install
npm run dev
# Open http://localhost:5173
```

### Option B: API Server with Docker (DB, migrations, metrics)

This runs the API and Postgres via Docker Compose.

```bash
cd server
docker compose up -d
# run DB migrations
docker compose run --rm migrator

# sanity check
echo "Bearer devtoken" | xargs -I{} curl -sS -H "Authorization: {}" http://localhost:8080/health | jq .
```

Then run the frontend pointing to the local API (if you wire them):

```bash
cd ../gaba-bank
npm run dev
```

> Tip: The frontend defaults to mocked APIs. Switch to real API calls by disabling MSW or wiring your fetchers to `http://localhost:8080` according to the frontend config.

### Option C: Contracts (Soroban / Rust)

Contracts live under `gaba-bank/contracts/*`. Install Rust and the Soroban toolchain as per `rust-toolchain.toml`.

```bash
cd gaba-bank/contracts
cargo build
```

See contract subfolders for specific instructions.

---

## Requirements

- Node.js 18+
- Docker + Docker Compose (for server stack)
- Rust toolchain (for Soroban contracts)

---

## API Docs

- Root OpenAPI: `openapi.yaml`
- Server OpenAPI: `server/api/openapi.yaml`

When the server is running, see the server README for how to serve docs locally.

---

## Environment Variables (server)

See `server/README.md` for the complete list. Common ones for local dev:

```env
DEFY_API_TOKEN=devtoken
DATABASE_URL=postgres://defy:defy@db:5432/defy
STELLAR_NETWORK=testnet
SORSWAP_*  # Soroswap endpoints/keys
```

Secrets are managed via Docker secrets in dev; never commit real keys.

---

## Common Tasks

- Install deps (frontend):
  ```bash
  cd gaba-bank && npm install
  ```
- Start frontend dev server:
  ```bash
  npm run dev
  ```
- Run frontend tests:
  ```bash
  npm test
  ```
- Bring up API + DB with Docker:
  ```bash
  cd server && docker compose up -d
  ```
- Apply server DB migrations:
  ```bash
  docker compose run --rm migrator
  ```

---

## Contributing

1. Create a feature branch from `main`.
2. Follow package‑specific coding standards and lint rules.
3. Add tests where relevant.
4. Open a PR with a concise description and testing notes.

---

## License

MIT (see headers and per‑package files for specifics).


