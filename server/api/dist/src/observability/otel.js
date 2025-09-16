// src/observability/otel.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { trace } from '@opentelemetry/api';
const OTEL_ENABLED = (process.env.OTEL_ENABLED ?? 'true').toLowerCase() === 'true';
const SERVICE_NAME = process.env.OTEL_SERVICE_NAME ?? 'defy-api';
const OTLP_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ??
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ??
    'http://localhost:4318/v1/traces'; // Collector padrão
if (OTEL_ENABLED) {
    const sdk = new NodeSDK({
        resource: resourceFromAttributes({
            'service.name': SERVICE_NAME,
            'deployment.environment': process.env.NODE_ENV ?? 'development',
        }),
        traceExporter: new OTLPTraceExporter({ url: OTLP_ENDPOINT }),
        instrumentations: [
            getNodeAutoInstrumentations({
                '@opentelemetry/instrumentation-http': { enabled: true },
                '@opentelemetry/instrumentation-express': { enabled: true },
                '@opentelemetry/instrumentation-pg': { enabled: true },
            }),
        ],
    });
    sdk.start();
    console.log('[otel] tracing started');
    process.on('SIGTERM', () => {
        sdk.shutdown();
        console.log('[otel] tracing terminated');
    });
}
export const tracer = trace.getTracer(SERVICE_NAME);
