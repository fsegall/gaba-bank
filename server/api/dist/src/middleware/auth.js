const OPEN_PREFIXES = [
    "/metrics",
    "/health",
    "/webhooks/psp",
    "/webhooks/inter",
    "/api/pix",
    "/echo",
    "/.well-known",
];
// caminhos do Anchor: não devemos injetar Authorization aqui
const ANCHOR_PREFIXES = ["/anchor", "/sep24"];
export function auth(req, res, next) {
    const url = (req.originalUrl || req.url || "").split("?")[0];
    if (process.env.DEV_BYPASS_AUTH === "true")
        return next();
    if (OPEN_PREFIXES.some((p) => url.startsWith(p)))
        return next();
    const expected = (process.env.DEFY_API_TOKEN || "").trim();
    if (!expected) {
        return res
            .status(500)
            .json({ error: "server_misconfig", missing: "DEFY_API_TOKEN" });
    }
    // Authorization: Bearer <token>
    const authHdr = req.header("authorization") || "";
    const bearer = /^bearer\s+(.+)$/i.exec(authHdr)?.[1]?.trim() || "";
    // X-API-{TOKEN|KEY}
    const xapi = (req.header("x-api-token") || req.header("x-api-key") || "").trim();
    const ok = bearer === expected || xapi === expected;
    if (!ok)
        return res.status(401).json({ error: "unauthorized" });
    // 🔑 Normaliza: só injeta Authorization se NÃO for rota do Anchor
    if (!bearer &&
        xapi === expected &&
        !ANCHOR_PREFIXES.some((p) => url.startsWith(p))) {
        req.headers.authorization = `Bearer ${expected}`;
    }
    next();
}
