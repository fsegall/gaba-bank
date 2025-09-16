import toml from "@iarna/toml";
import { Keypair, Transaction, Networks } from "@stellar/stellar-sdk";
import fs from "node:fs";
import { httpGet, httpPost, httpPut } from "./http.js";
// ---------- Env ----------
const { ANCHOR_TOML_URL, ANCHOR_AUTH_URL, ANCHOR_TRANSFER_SERVER_URL, ANCHOR_KYC_SERVER_URL, ANCHOR_QUOTE_URL, STELLAR_TREASURY_PUBLIC, STELLAR_TREASURY_SECRET, STELLAR_TREASURY_SECRET_FILE, STELLAR_NETWORK, } = process.env;
const TREASURY_PUB = STELLAR_TREASURY_PUBLIC;
const NETWORK_PASSPHRASE = STELLAR_NETWORK === "public" ? Networks.PUBLIC : Networks.TESTNET;
// ---------- Cache ----------
let endpoints = null;
// ---------- Utils ----------
function readSecretFromEnvOrFile(value, filePath) {
    const envVal = value?.trim();
    if (envVal)
        return envVal;
    if (filePath) {
        try {
            return fs.readFileSync(filePath, "utf8").trim();
        }
        catch {
            // ignora e cai para retorno vazio
        }
    }
    return "";
}
// ---------- Resolvedor de endpoints (ENV > TOML) ----------
export async function resolveEndpoints(force = false) {
    if (endpoints && !force)
        return endpoints;
    // 1) Overrides parciais por ENV
    if (ANCHOR_AUTH_URL ||
        ANCHOR_TRANSFER_SERVER_URL ||
        ANCHOR_KYC_SERVER_URL ||
        ANCHOR_QUOTE_URL) {
        endpoints = {
            WEB_AUTH_ENDPOINT: ANCHOR_AUTH_URL || undefined,
            TRANSFER_SERVER_SEP0024: ANCHOR_TRANSFER_SERVER_URL || undefined,
            KYC_SERVER_URL: ANCHOR_KYC_SERVER_URL || undefined,
            SEP38_QUOTE_SERVER: ANCHOR_QUOTE_URL || undefined,
        };
        return endpoints;
    }
    // 2) Fallback: carregar do TOML
    if (!ANCHOR_TOML_URL) {
        throw new Error("ANCHOR_TOML_URL not set and no env overrides provided");
    }
    const { data } = await httpGet(ANCHOR_TOML_URL, {}, 10_000);
    const t = toml.parse(data);
    const eps = {
        WEB_AUTH_ENDPOINT: t.WEB_AUTH_ENDPOINT,
        TRANSFER_SERVER_SEP0024: t.TRANSFER_SERVER_SEP0024 || t.TRANSFER_SERVER,
        KYC_SERVER_URL: t.KYC_SERVER_URL || t.KYC_SERVER,
        SEP38_QUOTE_SERVER: t.SEP38_QUOTE_SERVER || t.QUOTE_SERVER,
    };
    if (!eps.WEB_AUTH_ENDPOINT)
        throw new Error("WEB_AUTH_ENDPOINT missing in TOML");
    if (!eps.TRANSFER_SERVER_SEP0024)
        throw new Error("TRANSFER_SERVER_SEP0024 missing in TOML");
    endpoints = eps;
    return endpoints;
}
// ---------- Compat: manter loadAnchorToml disponível ----------
export async function loadAnchorToml() {
    return resolveEndpoints(true);
}
// ---------- SEP-10 ----------
export async function sep10_start(account = TREASURY_PUB) {
    const eps = await resolveEndpoints();
    if (!eps.WEB_AUTH_ENDPOINT)
        throw new Error("SEP-10 not configured on anchor");
    const { data } = await httpGet(`${eps.WEB_AUTH_ENDPOINT}?account=${encodeURIComponent(account)}`, {}, 10_000);
    return data;
}
export async function sep10_token(challenge) {
    const eps = await resolveEndpoints();
    if (!eps.WEB_AUTH_ENDPOINT)
        throw new Error("SEP-10 not configured on anchor");
    const secret = readSecretFromEnvOrFile(STELLAR_TREASURY_SECRET, STELLAR_TREASURY_SECRET_FILE);
    if (!secret)
        throw new Error("Missing STELLAR_TREASURY_SECRET (or *_FILE)");
    const kp = Keypair.fromSecret(secret);
    const tx = new Transaction(challenge.transaction, challenge.network_passphrase || NETWORK_PASSPHRASE);
    tx.sign(kp);
    const { data } = await httpPost(eps.WEB_AUTH_ENDPOINT, { transaction: tx.toXDR() }, { "Content-Type": "application/json" }, 10_000);
    return data; // { token, expires_at? }
}
// ---------- SEP-38 ----------
export async function sep38_quote(jwt, req) {
    const eps = await resolveEndpoints();
    if (!eps.SEP38_QUOTE_SERVER)
        throw new Error("SEP-38 not configured on anchor");
    const { data } = await httpPost(`${eps.SEP38_QUOTE_SERVER}/quote`, req, { Authorization: `Bearer ${jwt}` }, 15_000);
    return data;
}
// ---------- SEP-24 ----------
export async function sep24_deposit(jwt, asset_code, account) {
    const ep = await resolveEndpoints();
    const base = ep.sep24 ||
        ep.TRANSFER_SERVER_SEP0024 ||
        process.env.ANCHOR_TRANSFER_SERVER_URL ||
        "http://anchor:8080/sep24";
    const { data } = await httpPost(`${base}/transactions/deposit/interactive`, { asset_code, account }, {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
    }, +(process.env.ANCHOR_TIMEOUT_MS || 15_000));
    return data; // { id, url }
}
// ---------- SEP-12 ----------
export async function sep12_putCustomer(jwt, payload) {
    const eps = await resolveEndpoints();
    if (!eps.KYC_SERVER_URL)
        throw new Error("SEP-12 not configured on anchor");
    const { data } = await httpPut(`${eps.KYC_SERVER_URL}/customer`, payload, { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" }, 15_000);
    return data;
}
export async function sep12_getCustomer(jwt, account) {
    const eps = await resolveEndpoints();
    if (!eps.KYC_SERVER_URL)
        throw new Error("SEP-12 not configured on anchor");
    const url = new URL(`${eps.KYC_SERVER_URL}/customer`);
    url.searchParams.set("account", account);
    const { data } = await httpGet(url.toString(), { Authorization: `Bearer ${jwt}` }, 15_000);
    return data;
}
