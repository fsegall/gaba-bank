# DevOps & Observability

### Stack

* **Prometheus (9090)** for API metrics scraping.
* **Grafana (3000)** with dashboards (API, PSPs, Anchor).
* **Jaeger (16686 / OTLP 4318)** for tracing via OpenTelemetry.
* **pgweb (8081)** to visualize Postgres.
* **Anchor Platform (testnet)** for SEP-10/12/24 (run isolated from `pgweb`, see port note).

> **Port note:** in current `docker compose`, `pgweb` and `anchor` use `8081`. Use **only one at a time** or change `anchor` to `8082`:

```yaml
anchor:
  image: stellar/anchor-platform:latest
  ports: ["8082:8081"]        # host:container
  environment:
    HOST_URL: "http://localhost:8082"
```

### Ports (summary)

| Service     | Host:Port | Container |
| ----------- | --------- | --------- |
| API         |      8080 |      8080 |
| Postgres    |      5433 |      5432 |
| pgweb       |      8081 |      8081 |
| Anchor      | 8082 (sug.) |      8081 |
| Prometheus  |      9090 |      9090 |
| Grafana     |      3000 |      3000 |
| Jaeger UI   |     16686 |     16686 |
| Jaeger OTLP | 4318 HTTP |      4318 |

### OpenTelemetry (tracing)

In the API, already set up:

```env
OTEL_ENABLED=true
OTEL_SERVICE_NAME=defy-api
OTEL_TRACES_EXPORTER=otlp
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318
# Recommended for environment filters:
OTEL_RESOURCE_ATTRIBUTES=deployment.environment=dev
```

**Best practices:** propagate `trace_id` and `span_id` in API logger and outgoing headers (`traceparent`).

### Prometheus (API scraping)

Your Prometheus reads a token via secret. In `prometheus.yml`:

```yaml
global:
  scrape_interval: 10s

scrape_configs:
  - job_name: 'defy-api'
    metrics_path: /metrics
    bearer_token_file: /etc/prometheus/secrets/api_metrics_token
    static_configs:
      - targets: ['api:9464']   # API exposes Prometheus on 9464 in docker network
```

### Metrics (suggested & already used)

* **API**: `http_requests_total{status}`, `http_request_duration_seconds_bucket`, `provider_event_total{provider}`, `orders_filled_total`.
* **PSP Inter**: `inter_http_duration_seconds`, `inter_webhook_total{event}`, `inter_reconcile_runs_total{result}`.
* **Anchor**: `anchor_sep10_latency_seconds`, `anchor_sep12_put_total{ok,err}`, `anchor_sep24_deposit_total{ok,err}`, `sep24_webhook_latency_seconds`, `anchor_tx_status_total{status}`.
* **Vault/Swap**: `vault_deposit_total`, `vault_withdraw_total`, `soroswap_quote_latency_seconds`, `soroswap_route_total{platform}`.

**Ready queries (Grafana):**

* **5xx Error**:
  `sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))`
* **API p95**:
  `histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))`
* **Webhooks down (Anchor/Inter)**:
  `rate(sep24_webhook_latency_seconds_count[5m]) == 0`

### Alerts (example rules)

```yaml
groups:
- name: defy-api.rules
  rules:
  - alert: ApiHighErrorRate
    expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05
    for: 10m
    labels: { severity: warning }
    annotations:
      description: "5xx error > 5% for 10m"

  - alert: Sep24NoWebhook
    expr: rate(anchor_tx_status_total[10m]) == 0
    for: 15m
    labels: { severity: critical }
    annotations:
      description: "No SEP-24 updates for 15m"
```

### Logging (recommended structure)

JSON format with correlation:

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

### Runbook (operational)

* **Start observability stack**
  `docker compose up -d prometheus grafana jaeger`
* **Check API metrics**
  `curl -H "Authorization: Bearer $(cat ../ops/secrets/api_metrics_token)" http://localhost:8080/metrics`
* **Traces**: open `http://localhost:16686` → `Service = defy-api`.
* **PG**: `http://localhost:8081` (pgweb) or change Anchor to `8082`.

### Security & Secrets

* Mount secrets **read-only** (`/run/secrets/*`), never commit `.env` with seeds.
* Isolate public ports to minimum; Prometheus can talk to API **inside** docker network (without exposing 9464).
* Rotate `API_METRICS_TOKEN` and Inter secrets (`PFX`, `client_id/secret`).
