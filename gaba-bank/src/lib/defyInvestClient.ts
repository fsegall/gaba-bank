// Minimal client wrapper for defy-invest API. Replace placeholders after OpenAPI is provided.
export type DefyAuth = {
  apiKey?: string;
  bearerToken?: string;
  userId?: string;
};

export class DefyInvestClient {
  private readonly baseUrl: string;
  private readonly auth: DefyAuth;

  constructor(params?: { baseUrl?: string; auth?: DefyAuth }) {
    this.baseUrl =
      params?.baseUrl || import.meta.env.VITE_DEFY_BASE_URL || "http://localhost:3000";
    this.auth =
      params?.auth || {
        apiKey: import.meta.env.VITE_DEFY_API_KEY,
        bearerToken: import.meta.env.VITE_DEFY_BEARER,
        userId: import.meta.env.VITE_DEFY_USER_ID,
      };
  }

  private buildHeaders(extra?: Record<string, string>): Headers {
    const headers = new Headers({
      "Content-Type": "application/json",
      Accept: "application/json",
      ...extra,
    });
    if (this.auth.apiKey) headers.set("x-api-key", this.auth.apiKey);
    if (this.auth.bearerToken) headers.set("Authorization", `Bearer ${this.auth.bearerToken}`);
    if (this.auth.userId) headers.set("x-user-id", this.auth.userId);
    return headers;
  }

  // PIX: criar cobrança
  async createPixCharge(input: { amount: string; payer?: any; seed?: string }): Promise<any> {
    const res = await fetch(`${this.baseUrl}/pix/cob`, {
      method: "POST",
      headers: this.buildHeaders({ "x-idempotency-key": crypto.randomUUID() }),
      body: JSON.stringify(input),
    });
    if (!res.ok) throw await this.normalizeError(res);
    return res.json();
  }

  // PIX: consultar cobrança
  async getPixCharge(txid: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/pix/cob/${encodeURIComponent(txid)}`, {
      method: "GET",
      headers: this.buildHeaders(),
    });
    if (!res.ok) throw await this.normalizeError(res);
    return res.json();
  }

  // System: health
  async health(): Promise<any> {
    const res = await fetch(`${this.baseUrl}/health`, {
      method: "GET",
      headers: this.buildHeaders(),
    });
    if (!res.ok) throw await this.normalizeError(res);
    return res.json();
  }

  // PIX: ping
  async pixPing(): Promise<any> {
    const res = await fetch(`${this.baseUrl}/pix/__ping`, {
      method: "GET",
      headers: this.buildHeaders(),
    });
    if (!res.ok) throw await this.normalizeError(res);
    return res.json();
  }

  private async normalizeError(res: Response) {
    let detail: any = undefined;
    try {
      detail = await res.json();
    } catch {}
    return new Error(
      `defy-invest ${res.status}: ${detail?.message || res.statusText}`
    );
  }
}

export const defyClient = new DefyInvestClient();


