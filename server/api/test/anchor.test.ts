// test/anchor.test.ts
import request from "supertest";
import { describe, it, expect, beforeAll, vi } from "vitest";

// ---- Desliga OTEL/Jaeger e define token da API ----
beforeAll(() => {
  process.env.NODE_ENV = "test";
  process.env.OTEL_ENABLED = "false";
  process.env.OTEL_TRACES_EXPORTER = "none";
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "";
  process.env.DEFY_API_TOKEN = process.env.DEFY_API_TOKEN || "test-token";
});

// ---- Mocks de infra "barulhenta" ----
vi.mock("../src/observability/otel.js", () => ({
  tracer: { startSpan: () => ({ setAttributes() {}, recordException() {}, end() {} }) },
}));
vi.mock("../src/db.js", () => ({
  pool: { query: vi.fn().mockResolvedValue({ rows: [] }) },
  tx: vi.fn().mockImplementation(async (fn) => fn({ query: vi.fn().mockResolvedValue({ rows: [] }) })),
}));

// ---- Mock do módulo usado pelo router ----
vi.mock("../src/services/anchor", () => ({
  resolveEndpoints: vi.fn().mockResolvedValue({
    WEB_AUTH_ENDPOINT: "http://anchor.mock/auth",
    TRANSFER_SERVER_SEP0024: "http://anchor.mock/sep24",
    KYC_SERVER_URL: "http://anchor.mock/sep12",
    SEP38_QUOTE_SERVER: "http://anchor.mock/sep38",
  }),
  loadAnchorToml: vi.fn().mockResolvedValue({
    WEB_AUTH_ENDPOINT: "http://anchor.mock/auth",
    TRANSFER_SERVER_SEP0024: "http://anchor.mock/sep24",
    KYC_SERVER_URL: "http://anchor.mock/sep12",
    SEP38_QUOTE_SERVER: "http://anchor.mock/sep38",
  }),
  sep10_start: vi.fn().mockResolvedValue({
    transaction: "AAAA...XDR...",
    network_passphrase: "Test SDF Network ; September 2015",
  }),
  sep10_token: vi.fn().mockResolvedValue({
    token: "fake.jwt.token",
    expires_at: new Date(Date.now() + 3600_000).toISOString(),
  }),
  sep38_quote: vi.fn().mockResolvedValue({
    id: "q_1",
    price: "1.2345",
    total_price: "12.345",
    expires_at: new Date(Date.now() + 600_000).toISOString(),
  }),
  sep24_deposit: vi.fn().mockResolvedValue({ id: "tx_1", url: "https://anchor.mock/interactive/tx_1" }),
  sep12_putCustomer: vi.fn().mockResolvedValue({ id: "cus_1", status: "ACCEPTED" }),
  sep12_getCustomer: vi.fn().mockResolvedValue({
    id: "cus_1",
    status: "ACCEPTED",
    provided_fields: { first_name: { status: "ACCEPTED" } },
  }),
}));

let app: import("express").Express;

beforeAll(async () => {
  // ✅ importe o app depois dos mocks
  const mod = await import("../app.ts");
  app = mod.app;
});

// ✅ helper: só autentica a API (x-api-token). NÃO usa Authorization aqui.
const auth = <T extends request.Test>(r: T) =>
  r.set("x-api-token", process.env.DEFY_API_TOKEN || "test-token");

describe("Anchor routes", () => {
  it("GET /anchor/toml resolve endpoints (via ENV/TOML)", async () => {
    // Configura o mock explicitamente
    const { resolveEndpoints } = await import("../src/services/anchor");
    const mockedResolveEndpoints = vi.mocked(resolveEndpoints);
    mockedResolveEndpoints.mockResolvedValue({
      WEB_AUTH_ENDPOINT: "http://anchor.mock/auth",
      TRANSFER_SERVER_SEP0024: "http://anchor.mock/sep24",
      KYC_SERVER_URL: "http://anchor.mock/sep12",
      SEP38_QUOTE_SERVER: "http://anchor.mock/sep38",
    });
    
    const res = await auth(request(app).get("/anchor/toml"));
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/json/i);
    expect(res.body).toMatchObject({
      WEB_AUTH_ENDPOINT: expect.any(String),
      TRANSFER_SERVER_SEP0024: expect.any(String),
    });
  });

  it("POST /anchor/sep10 retorna JWT (fluxo atalho)", async () => {
    // Configura os mocks necessários
    const { sep10_start, sep10_token } = await import("../src/services/anchor");
    vi.mocked(sep10_start).mockResolvedValue({
      transaction: "AAAA...XDR...",
      network_passphrase: "Test SDF Network ; September 2015",
    });
    vi.mocked(sep10_token).mockResolvedValue({
      token: "fake.jwt.token",
      expires_at: new Date(Date.now() + 3600_000).toISOString(),
    });
    
    const res = await auth(request(app).post("/anchor/sep10")).send({});
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token", "fake.jwt.token");
  });

  it("POST /anchor/sep38/quote retorna a quote", async () => {
    // Configura o mock necessário
    const { sep38_quote } = await import("../src/services/anchor");
    vi.mocked(sep38_quote).mockResolvedValue({
      id: "q_1",
      price: "1.2345",
      total_price: "12.345",
      expires_at: new Date(Date.now() + 600_000).toISOString(),
    });
    
    const res = await auth(request(app).post("/anchor/sep38/quote")).send({
      jwt: "fake.jwt.token",
      sell_asset: "USDC",
      buy_asset: "BRLD",
      sell_amount: "10",
      account: "G...CLIENT",
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("price");
  });

  it("POST /anchor/sep24/deposit retorna {id,url}", async () => {
    // Configura o mock necessário
    const { sep24_deposit } = await import("../src/services/anchor");
    vi.mocked(sep24_deposit).mockResolvedValue({
      id: "tx_1",
      url: "https://anchor.mock/interactive/tx_1",
    });
    
    const res = await auth(
      request(app).post("/anchor/sep24/deposit").send({
        jwt: "fake.jwt.token",
        asset_code: "BRLD",
        account: "G...CLIENT",
      })
    );
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: "tx_1", url: expect.any(String) });
  });

  it("POST /anchor/sep12/customer valida jwt/account", async () => {
    // Configura o mock necessário
    const { sep12_putCustomer } = await import("../src/services/anchor");
    vi.mocked(sep12_putCustomer).mockResolvedValue({
      id: "cus_1",
      status: "ACCEPTED",
    });
    
    // faltando jwt -> 400
    const r1 = await auth(
      request(app).post("/anchor/sep12/customer").send({ account: "G..", type: "natural_person" })
    );
    expect(r1.status).toBe(400);
    expect(r1.body).toHaveProperty("error", "missing_jwt");

    // faltando account -> 400
    const r2 = await auth(
      request(app).post("/anchor/sep12/customer").send({ jwt: "fake.jwt.token", type: "natural_person" })
    );
    expect(r2.status).toBe(400);
    expect(r2.body).toHaveProperty("error", "missing_account");

    // ok -> 200
    const r3 = await auth(
      request(app).post("/anchor/sep12/customer").send({
        jwt: "fake.jwt.token",
        account: "G...CLIENT",
        type: "natural_person",
        first_name: "Ada",
      })
    );
    expect(r3.status).toBe(200);
    expect(r3.body).toMatchObject({ id: "cus_1", status: "ACCEPTED" });
  });

  it("GET /anchor/sep12/customer valida jwt/account na query/header", async () => {
    // Configura o mock necessário
    const { sep12_getCustomer } = await import("../src/services/anchor");
    vi.mocked(sep12_getCustomer).mockResolvedValue({
      id: "cus_1",
      status: "ACCEPTED",
      provided_fields: { first_name: { status: "ACCEPTED" } },
    });
    
    // faltando jwt (não passe Authorization aqui) -> 400
    const r1 = await auth(request(app).get("/anchor/sep12/customer").query({ account: "G...CLIENT" }));
    expect(r1.status).toBe(400);
    expect(r1.body).toHaveProperty("error", "missing_jwt");

    // faltando account -> 400 (não passa Authorization aqui, só x-api-token)
    const r2 = await auth(request(app).get("/anchor/sep12/customer"));
    expect(r2.status).toBe(400);
    expect(r2.body).toHaveProperty("error", "missing_jwt");

    // ok -> 200 (agora sim passe o Authorization como JWT do Anchor)
    const r3 = await auth(
      request(app)
        .get("/anchor/sep12/customer")
        .set("Authorization", "Bearer fake.jwt.token")
        .query({ account: "G...CLIENT" })
    );
    expect(r3.status).toBe(200);
    expect(r3.body).toMatchObject({ id: "cus_1", status: "ACCEPTED" });
  });
});
