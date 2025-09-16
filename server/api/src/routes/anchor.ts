// api/src/routes/anchor.ts
import { Router, Request, Response, NextFunction, RequestHandler } from "express";
import {
  resolveEndpoints,
  sep10_start,
  sep10_token,
  sep38_quote,
  sep24_deposit,
  sep12_putCustomer,
  sep12_getCustomer,
} from "../services/anchor.js";

export const router = Router();

type AnyHandler = RequestHandler;

const normalizeJwt = (v?: string | null) => {
  const s = (v ?? "").trim();
  if (!s) return undefined;
  const low = s.toLowerCase();
  // não aceitar "undefined" / "null" enviados por engano
  if (low === "undefined" || low === "null") return undefined;
  return s;
};

const getJwt = (req: Request) =>
  normalizeJwt(req.body?.jwt as string | undefined) ||
  normalizeJwt(/^Bearer\s+(.+)$/i.exec(req.header("authorization") || "")?.[1]) ||
  normalizeJwt(req.query.jwt as string | undefined);

const badReq = (res: Response, msg: string) => res.status(400).json({ error: msg });

const wrap =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): AnyHandler =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res, next).catch((err: any) => {
      const status = Number(err?.status || err?.statusCode || err?.response?.status) || 502;
      const body =
        typeof err?.response?.data === "object" ? err.response.data : undefined;
      res.status(status).json(body ?? { error: err?.message || "anchor_proxy_error" });
    });

/** exige presença de JWT (SEP-10) — usado nas rotas SEP-12 */
const requireJwtSep10: AnyHandler = (req, res, next) => {
  const jwt = getJwt(req);
  if (!jwt) return badReq(res, "missing_jwt");
  (req as any).__jwt = jwt;
  next();
};

/** --- Descobrir/forçar endpoints --- */
router.get(
  "/anchor/toml",
  wrap(async (_req, res) => {
    const ep = await resolveEndpoints();
    res.json(ep);
  })
);

/** --- SEP-10: start + finish --- */
router.post(
  "/anchor/sep10",
  wrap(async (req, res) => {
    const { account } = (req.body || {}) as { account?: string };
    const ch = await sep10_start(account);
    const jwt = await sep10_token(ch);
    res.json(jwt); // { token, ... }
  })
);

/** --- SEP-38: quote --- */
router.post(
  "/anchor/sep38/quote",
  wrap(async (req, res) => {
    const jwt = getJwt(req);
    if (!jwt) return badReq(res, "missing_jwt");

    const { sell_asset, buy_asset, sell_amount, buy_amount, account } = req.body || {};
    if (!sell_asset || !buy_asset) return badReq(res, "missing_asset_pair");
    if (!!sell_amount === !!buy_amount)
      return badReq(res, "provide_exactly_one_of_sell_amount_or_buy_amount");

    const q = await sep38_quote(jwt, { sell_asset, buy_asset, sell_amount, buy_amount, account });
    res.json(q);
  })
);

/** --- SEP-24: deposit (fluxo interativo) --- */
router.post(
  "/anchor/sep24/deposit",
  wrap(async (req, res) => {
    const jwt = getJwt(req);
    if (!jwt) return badReq(res, "missing_jwt");

    const { asset_code, account } = req.body || {};
    if (!asset_code) return badReq(res, "missing_asset_code");
    if (!account) return badReq(res, "missing_account");

    const d = await sep24_deposit(jwt, asset_code, account);
    res.json(d); // { id, url }
  })
);

/** --- SEP-12: cria/atualiza cliente (AGORA COM MIDDLEWARE) --- */
router.post(
  "/anchor/sep12/customer",
  requireJwtSep10,
  wrap(async (req, res) => {
    const jwt = (req as any).__jwt as string;
    const { jwt: _drop, ...kyc } = req.body || {};
    if (!kyc?.account) return badReq(res, "missing_account");
    const out = await sep12_putCustomer(jwt, kyc);
    res.json(out);
  })
);

/** --- SEP-12: consulta status (AGORA COM MIDDLEWARE) --- */
router.get(
  "/anchor/sep12/customer",
  requireJwtSep10,
  wrap(async (req, res) => {
    const jwt = (req as any).__jwt as string;
    const account = (req.query.account as string) || undefined;
    if (!account) return badReq(res, "missing_account");
    const out = await sep12_getCustomer(jwt, account);
    res.json(out);
  })
);

/** --- SEP-24 /info (proxy) --- */
router.get(
  "/anchor/sep24/info",
  wrap(async (_req, res) => {
    const ep: any = await resolveEndpoints();
    const base = ep.sep24 || ep.TRANSFER_SERVER_SEP0024 || process.env.ANCHOR_TRANSFER_SERVER_URL;
    const r = await fetch(`${base}/info`, { headers: { accept: "application/json" } });
    const body = await r.text();
    res.status(r.status).type(r.headers.get("content-type") || "application/json").send(body);
  })
);

// --- Redirect helpers para o UI SEP-24 ---
router.get("/sep24/interactive", wrap(async (req, res) => {
  const ep: any = await resolveEndpoints();
  const base = ep.TRANSFER_SERVER_SEP0024 || process.env.ANCHOR_TRANSFER_SERVER_URL || "http://anchor:8080/sep24";
  const qs = req.originalUrl.includes("?") ? req.originalUrl.split("?")[1] : "";
  return res.redirect(302, `${base}/interactive${qs ? `?${qs}` : ""}`);
}));

router.get("/sep24/interactive/*", wrap(async (req, res) => {
  const ep: any = await resolveEndpoints();
  const base = ep.TRANSFER_SERVER_SEP0024 || process.env.ANCHOR_TRANSFER_SERVER_URL || "http://anchor:8080/sep24";
  const suffix = req.params[0] ? `/${req.params[0]}` : "";
  const qs = req.originalUrl.includes("?") ? req.originalUrl.split("?")[1] : "";
  return res.redirect(302, `${base}/interactive${suffix}${qs ? `?${qs}` : ""}`);
}));

export default router;
