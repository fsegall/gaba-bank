# Regras de Ouro — Dinheiro & Precisão (Defy)

> **Objetivo:** padronizar como representamos, calculamos, persistimos e exibimos **dinheiro** e **quantidades de ativos** no Defy com **precisão máxima** e **segurança** (sem `float`). Este guia reflete nossa lib `@defy-labs/precise-money` e separa bem a **camada core (pura, BigInt)** da **camada simbólica** (que conhece símbolos/códigos e o registry de decimais).

---

## 1) Tipos & Representações

* **Quantias internas (minor units):** sempre `bigint` (ex.: cents USD/BRL, micro‑USDC, sats BTC).
  **Nunca** use `number` para representar dinheiro/quantidade persistida ou enviada on‑chain.
* **Taxas/percentuais/preços:** representar como **razão de inteiros** `{ num, den }` ou usar helpers inteiros: `mulDiv` / `applyBps` com **arredondamento explícito**.
  Evite `number`/`float` também nesses cálculos.
* **JSON (APIs):** `bigint` **não** é serializável. Converter para **string** (via replacer global ou manualmente no DTO).
* **Banco (Postgres):**

  * Persistir quantias em **`BIGINT`**.
  * Evitar `NUMERIC` em hot‑path; use `NUMERIC` apenas para relatórios agregados.
  * Se ler `NUMERIC`, tratar como **string** no Node (parser custom) e converter só quando estritamente necessário.

---

## 2) Decimais por ativo (camada de negócio)

* Declarar decimais no **registry** (e defaults de negócio):

  * `ASSET_DECIMALS` (ex.: `USD:2`, `BRL:2`, `USDC:6`, `BTC:8`, `ETH:18`).
  * `DEC.set('USDC', 6)` ou `DEC.setById({ chain:'stellar', symbol:'USDC', issuer:'GA...' }, 7)` quando houver overrides por rede/issuer.
* **Stellar clássico:** amounts no ledger usam **7 casas**; **Soroban tokens** expõem `decimals()` no contrato.
* **Regra:** mantenha a ergonomia do negócio (ex.: `USDC:6`) na aplicação e **converta na borda on‑chain** quando for assinar/enviar transações.
* **ENV override opcional:** `STELLAR_DECIMALS_<CODE>` (ex.: `STELLAR_DECIMALS_USDC=7`).

**Prioridade de resolução de decimais** (na camada simbólica): `DEC` → ENV → `ASSET_DECIMALS` → fallback `7` (Stellar comum).

---

## 3) Conversões canônicas (entrada/saída)

> Use **core** quando você sabe a escala (nº de casas). Use a **camada simbólica** quando você só tem o **símbolo** ou **asset id**.

* **Entrada humana → unidades internas**

  * **Core:** `toMinor(human, decimals, { mode })`
  * **Simbólico:** `toUnits(symbolOrKey, human, mode)`
  * Normaliza formatos (`1.234,56` → `1234.56`), aceita negativos e aplica o **modo de arredondamento**.

* **Unidades internas → exibição**

  * **Core:** `fromMinor(units, decimals)` (string fixa, sem agrupamento)
  * **Simbólico:** `fromUnits(symbolOrKey, units)`
  * **Formatação local**: `formatUnits(symbolOrKey, units, locale, minFrac?, maxFrac?)` (agrupamento e fallback para inteiros grandes).

* **Mudança de escala entre decimais**

  * **Core:** `scaleUnits(u, fromDec, toDec, { mode? })`

---

## 4) Arredondamento (sempre explícito)

* **Core modes:** `floor` | `ceil` | `round` | `bankers`.
* **Convenções:**

  * **Entrada de usuário** (ex.: FIAT com mais casas do que o permitido): usar **`round`** (half‑up).
  * **Cálculos de taxas/fees**: preferir **`round`**; quando a regra exigir, use `floor`/`ceil`.
  * **Registro contábil**: documentar o modo em cálculos que impactam saldos.
* **Compat (camada simbólica):** aceita `half_up`/`trunc` e mapeia internamente para os modos do core.

---

## 5) Cálculo seguro (BigInt)

* **Multiplicação/Divisão:** `mulDiv(a, b, c, mode)` computa `a * b / c` com arredondamento controlado e suporte a sinais.
* **BPS / percentuais:** `applyBps(units, bps, mode)` (ex.: 25 bps = 0,25%).
  Clamp auxiliar: `clampBps(bps)` garante `[0, 10000]`.
* **Slippage:**

  * **EXACT\_IN** (protege *saída* mínima): `slippageDown(amountOut, bps)` ou `applySlippage(amountOut, bps)`.
  * **EXACT\_OUT** (protege *entrada* máxima): `slippageUp(amountIn, bps)` (usa divisão com **ceil**).
* **Preços/cotações (racional):**

  * **Core:** `priceRatioDecimals(quoteDecimals, priceStr)` → `{ num, den }` (preço = **QUOTE por 1 BASE**).
  * **Conversão entre ativos:** `convertUnitsByDecimals(amountUnits, fromDec, toDec, price, mode)`.
  * **Simbólico:** `priceRatio(quoteSymbol, baseSymbol, priceStr)` e `convertUnits(amount, fromSymbol, toSymbol, price, mode)` resolvem decimais via registry.

---

## 6) Postgres & Node parsers

* No `pg` (Node):

  * OID **20/BIGINT** → parse para **BigInt**.
  * OID **1700/NUMERIC** → parse para **string**.
* No Express (ou similar): defina um **JSON replacer** global para serializar `bigint` como string:
  `app.set('json replacer', (k,v) => typeof v === 'bigint' ? v.toString() : v)`.
* Configure `statement_timeout`, `query_timeout` e `application_name`.

---

## 7) Boas práticas de API/serviço

* **Nunca** receba/retorne dinheiro como `float`. Use **string** (`"10.50"`) na API e converta para `bigint` com `toUnits`.
* **Persistência idempotente:** armazene **unidades inteiras** (`BIGINT`). Ex.: `provider_transactions.amount_in_units` / `amount_out_units`.
* **Métricas (Prometheus):** prefira contadores/eventos (`*_total{stage}`) em vez de somar valores monetários. Se precisar número, converta **na borda** com ciência da escala.

---

## 8) Fronteira on‑chain (Stellar/EVM/Solana/Cosmos)

* **Aplicação ↔ On‑chain:** mantenha decimais “de negócio” (ex.: `USDC:6`). Na **borda on‑chain**, converta para a escala exigida pela rede (ex.: **Stellar clássico 7**; **Solana**: `mint.decimals`; **EVM**: `decimals()` do token).
* **Soroban/contratos:** persistir inteiros escalados (documentar `SCALE` no contrato) e expor `decimals()` quando pertinente.

---

## 9) Do / Don’t

**Do** ✅

* Usar `bigint` para quantias internas.
* Centralizar decimais por ativo (`DEC` + `ASSET_DECIMALS` + ENV).
* Usar `toUnits`/`fromUnits`/`formatUnits` em toda entrada/saída humana.
* Arredondamento **explícito** (`round` por padrão) ao reduzir escala/dividir.
* Representar preços/percentuais como **razão** + `mulDiv`.
* Serializar `bigint` como **string** no JSON.

**Don’t** ❌

* Não usar `number`/`float` para dinheiro.
* Não somar valores monetários com `Number` (perda de precisão).
* Não misturar escalas (ex.: tratar `USDC` como 6 em um lugar e 7 em outro).
  **Converter somente na borda on‑chain**.

---

## 10) Exemplos práticos

```ts
import {
  // core
  toMinor, fromMinor, scaleUnits,
  mulDiv, applyBps, slippageDown, slippageUp,
  priceRatioDecimals, convertUnitsByDecimals,
  // simbólico
  toUnits, fromUnits, formatUnits, priceRatio, convertUnits,
} from '@defy-labs/precise-money'

// 10,505 USD (entrada humana) → cents (minor)
const cents = toUnits('USD', '10,505')        // 1051n (half_up via simbólico)

// Fee 25 bps sobre $100.00
const fee = applyBps(toMinor('100', 2), 25)   // 25n (2 casas)

// Exibição amigável (locale)
formatUnits('USD', 1234567890123456789n, 'en-US') // "1,234,567,890,123,456,789.00"

// Preço 5.4321 USD por 1 TOKEN (QUOTE/BASE) → converter $10.50 para TOKEN
const pr = priceRatio('USD', 'TOKEN', '5.4321')    // escala de USD
const usd = toUnits('USD', '10.50')                // 1050n (2 dec)
const out = convertUnits(usd, 'USD', 'TOKEN', pr)  // TOKEN minor considerando decimais do TOKEN
fromUnits('TOKEN', out)                            // string humana do TOKEN

// Apenas com core (sem registry): USD=2, TOKEN=7
const pr2 = priceRatioDecimals(2, '5.4321')
const out2 = convertUnitsByDecimals(1050n, 2, 7, pr2)
```

---

## 11) Testes mínimos (recomendado)

* `toMinor/fromMinor` & `toUnits/fromUnits`: positivos/negativos, vírgula decimal, excesso de casas (arredondamento), ida/volta.
* `mulDiv`: sinais, divisões não exatas, `round` vs `floor/ceil/bankers`.
* `applyBps` / `slippageDown` / `slippageUp`: bps típicos (25, 50, 75) e limites (0/10000).
* `priceRatio* / convertUnits*`: USD↔USDC, BTC↔USDC, TOKEN↔FIAT com diferentes escalas.
* JSON replacer: garantir que `bigint` sai como string.

---

## 12) Checklist de adoção

* [ ] `ASSET_DECIMALS` definido e revisado por ambiente.
* [ ] Registry `DEC` configurado (incluindo overrides por issuer/chainId quando necessário).
* [ ] Parsers do `pg` ajustados (BIGINT → BigInt, NUMERIC → string).
* [ ] Replacer JSON registrado para `bigint`.
* [ ] Rotas/serviços usam `toUnits`/`fromUnits`/`formatUnits`.
* [ ] Cálculos monetários só com `bigint`/`mulDiv`/razão.
* [ ] Conversão on‑chain somente nos adapters.

---

### Arquivos relevantes
## Lib precise-money
* `packages/precise-money/src/core.ts` — primitivos puros: normalização, to/fromMinor, scaleUnits, slippage, mulDiv, priceRatio, convertUnitsByDecimals, etc.
* `packages/precise-money/src/symbolic.ts` — camada por símbolo: to/from/formatUnits, priceRatio/convertUnits, `avgFiatPricePerUnit`.
* `packages/precise-money/src/registry.ts` — `DEC` e helpers de ID.
* `packages/precise-money/src/adapters/*` — borda on‑chain (formatação por rede, sem SDK).

## Project Files
* `src/db.ts` / `src/server.ts` (no app) — parsers `pg`, replacer JSON.

> Documento vivo: ao incluir novo ativo/escala ou alterar regra de arredondamento, **atualize aqui** e os helpers correspondentes no código.
