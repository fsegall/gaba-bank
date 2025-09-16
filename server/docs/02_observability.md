# DevOps & Observability

### Stack

* **Prometheus (9090)** para scrape de métricas da API.
* **Grafana (3000)** com dashboards (API, PSPs, Anchor).
* **Jaeger (16686 / OTLP 4318)** para tracing via OpenTelemetry.
* **pgweb (8081)** para visualizar Postgres.
* **Anchor Platform (testnet)** para SEP-10/12/24 (rodar isolado da `pgweb`, ver nota de portas).

> **Nota de portas:** no `docker compose` atual, `pgweb` e `anchor` usam `8081`. Use **apenas um por vez** ou mude o `anchor` para `8082`:

```yaml
anchor:
  image: stellar/anchor-platform:latest
  ports: ["8082:8081"]        # host:container
  environment:
    HOST_URL: "http://localhost:8082"
```

### Portas (resumo)

| Serviço     | Host\:Porta | Container |
| ----------- | ----------: | --------: |
| API         |        8080 |      8080 |
| Postgres    |        5433 |      5432 |
| pgweb       |        8081 |      8081 |
| Anchor      | 8082 (sug.) |      8081 |
| Prometheus  |        9090 |      9090 |
| Grafana     |        3000 |      3000 |
| Jaeger UI   |       16686 |     16686 |
| Jaeger OTLP |   4318 HTTP |      4318 |

### OpenTelemetry (tracing)

Na API, já está setado:

```env
OTEL_ENABLED=true
OTEL_SERVICE_NAME=defy-api
OTEL_TRACES_EXPORTER=otlp
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318
# Recomendado p/ filtros por ambiente:
OTEL_RESOURCE_ATTRIBUTES=deployment.environment=dev
```

**Boas práticas:** propague `trace_id` e `span_id` no logger da API e em headers de saída (`traceparent`).

### Prometheus (scrape da API)

Seu Prometheus lê um token via secret. No `prometheus.yml`:

```yaml
global:
  scrape_interval: 10s

scrape_configs:
  - job_name: 'defy-api'
    metrics_path: /metrics
    bearer_token_file: /etc/prometheus/secrets/api_metrics_token
    static_configs:
      - targets: ['api:9464']   # API expõe Prometheus em 9464 na rede docker
```

### Métricas (sugeridas & já usadas)

* **API**: `http_requests_total{status}`, `http_request_duration_seconds_bucket`, `provider_event_total{provider}`, `orders_filled_total`.
* **PSP Inter**: `inter_http_duration_seconds`, `inter_webhook_total{event}`, `inter_reconcile_runs_total{result}`.
* **Anchor**: `anchor_sep10_latency_seconds`, `anchor_sep12_put_total{ok,err}`, `anchor_sep24_deposit_total{ok,err}`, `sep24_webhook_latency_seconds`, `anchor_tx_status_total{status}`.
* **Vault/Swap**: `vault_deposit_total`, `vault_withdraw_total`, `soroswap_quote_latency_seconds`, `soroswap_route_total{platform}`.

**Queries prontas (Grafana):**

* **Erro 5xx**:
  `sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))`
* **p95 API**:
  `histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))`
* **Webhooks fora do ar (Anchor/Inter)**:
  `rate(sep24_webhook_latency_seconds_count[5m]) == 0`

### Alertas (regras exemplo)

```yaml
groups:
- name: defy-api.rules
  rules:
  - alert: ApiHighErrorRate
    expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05
    for: 10m
    labels: { severity: warning }
    annotations:
      description: "Erro 5xx > 5% por 10m"

  - alert: Sep24NoWebhook
    expr: rate(anchor_tx_status_total[10m]) == 0
    for: 15m
    labels: { severity: critical }
    annotations:
      description: "Sem updates de SEP-24 há 15m"
```

### Logging (estrutura recomendado)

Formato JSON com correlação:

```json
{
  "ts":"2025-09-09T12:34:56.789Z",
  "level":"info",
  "msg":"SEP24 webhook processed",
  "provider":"anchor",
  "external_id":"abc123",
  "status":"completed",
  "trace_id":"7a5f1b5f1d6e4c2a",
  "span_id":"b9b8c0f2e1a3d4c5"
}
```

### Runbook (operacional)

* **Subir stack de observabilidade**
  `docker compose up -d prometheus grafana jaeger`
* **Checar métricas da API**
  `curl -H "Authorization: Bearer $(cat ../ops/secrets/api_metrics_token)" http://localhost:8080/metrics`
* **Traces**: abrir `http://localhost:16686` → `Service = defy-api`.
* **PG**: `http://localhost:8081` (pgweb) ou mude Anchor para `8082`.

### Segurança & Segredos

* Montar segredos **somente-leitura** (`/run/secrets/*`), nunca comitar `.env` com seeds.
* Isolar portas públicas ao mínimo; o Prometheus pode falar com a API **dentro** da rede docker (sem expor 9464).
* Rotacionar `API_METRICS_TOKEN` e segredos do Inter (`PFX`, `client_id/secret`).
