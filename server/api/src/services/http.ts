// api/src/services/http.ts
import axios from "axios";
import http from "node:http";
import https from "node:https";

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

const TIMEOUT = Number(process.env.ANCHOR_TIMEOUT_MS || 15_000);

function isTransientDns(err: any) {
  const msg = String(err?.message || "");
  return err?.code === "EAI_AGAIN" || /getaddrinfo.*EAI_AGAIN/i.test(msg);
}

async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (isTransientDns(e) && i < tries - 1) {
        await new Promise((r) => setTimeout(r, 300 * (i + 1))); // 300ms, 600ms
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

export async function httpGet<T = any>(
  url: string,
  headers: Record<string, string> = {},
  timeout = TIMEOUT,
) {
  return withRetry(() =>
    axios.get<T>(url, { headers, timeout, httpAgent, httpsAgent })
  );
}

export async function httpPost<T = any>(
  url: string,
  data: any,
  headers: Record<string, string> = {},
  timeout = TIMEOUT,
) {
  return withRetry(() =>
    axios.post<T>(url, data, { headers, timeout, httpAgent, httpsAgent })
  );
}

export async function httpPut<T = any>(
  url: string,
  data: any,
  headers: Record<string, string> = {},
  timeout = TIMEOUT,
) {
  return withRetry(() =>
    axios.put<T>(url, data, { headers, timeout, httpAgent, httpsAgent })
  );
}
