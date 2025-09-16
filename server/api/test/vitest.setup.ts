// test/vitest.setup.ts
import { beforeAll } from "vitest";

beforeAll(() => {
  // Desliga tracing em testes
  process.env.NODE_ENV = "test";
  process.env.OTEL_ENABLED = "false";

  // Token que o middleware da API espera
  process.env.DEFY_API_TOKEN = process.env.DEFY_API_TOKEN || "test-token";

  // Evita que qualquer código tente falar com Jaeger/OTLP
  process.env.OTEL_TRACES_EXPORTER = "none";
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "";
  process.env.NODE_ENV = 'test';
  process.env.VITEST = '1';

  process.env.SOROBAN_RPC_URL ??= 'http://localhost:8000/soroban/rpc';
  process.env.SOROBAN_NETWORK_PASSPHRASE ??= 'Test SDF Network ; September 2015';
  process.env.REFLECTOR_CONTRACT_ID ??= 'CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC';

  /** use uma chave pública válida; exemplo abaixo é válido para teste */
  process.env.SOROBAN_VIEW_SOURCE ??= 'GBZXN7PIRZGNMHGA67VZ7EJQAW3X4QF5WSKSBVQ6JSV7YTZR2P5C3J6Q';

  process.env.ORACLE_SANITY_ENABLED ??= 'false';

});
