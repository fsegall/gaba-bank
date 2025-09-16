// src/utils/pix.ts
/**
 * Normaliza uma chave Pix para o formato aceito pelos PSPs:
 * - E-mail  → lowercase (sem alterações adicionais)
 * - CNPJ    → 14 dígitos
 * - CPF     → 11 dígitos
 * - Telefone BR → E.164 (+55DDDN...) a partir de 10/11 dígitos; se já vier 55..., vira +55...
 * - Chave aleatória (UUID) → lowercase
 * - Qualquer outra coisa → retornada como veio (trim)
 *
 * Obs.: inclui validação de dígitos verificadores para CPF/CNPJ.
 */
export function normalizePixKey(key) {
    const raw = key.trim();
    if (!raw)
        return raw;
    // 1) Email
    if (isEmail(raw))
        return raw.toLowerCase();
    // 2) UUID (chave aleatória)
    if (isUuid(raw))
        return raw.toLowerCase();
    // 3) Somente dígitos (CPF/CNPJ/telefone)
    const digits = onlyDigits(raw);
    // CNPJ (14 dígitos)
    if (digits.length === 14 && isValidCnpj(digits))
        return digits;
    // CPF (11 dígitos)
    if (digits.length === 11 && isValidCpf(digits))
        return digits;
    // Telefone BR
    // - Se vier com 55 + (10|11) dígitos (ex.: 55 31 9xxxx yyyy) → +55...
    if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
        return `+${digits}`;
    }
    // - Se vier com 10 (fixo) ou 11 (móvel) dígitos sem país → prefixa +55
    if (digits.length === 10 || digits.length === 11) {
        return `+55${digits}`;
    }
    // 4) E.164 já válido (qualquer país)
    if (isE164(raw))
        return raw;
    // Fallback: devolve como veio (trim)
    return raw;
}
/* ===================== Helpers ===================== */
function onlyDigits(s) {
    return s.replace(/\D/g, '');
}
function isEmail(s) {
    // validação simples, suficiente para Pix (PSPs aceitam RFCs menos estritos)
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
function isUuid(s) {
    // UUID v4 usual (aceita letras maiúsculas/minúsculas)
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89abAB][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}
function isE164(s) {
    // +[1-9][1-14 dígitos] (até 15 dígitos no total, conforme E.164)
    return /^\+[1-9]\d{1,14}$/.test(s);
}
/* -------- CPF -------- */
function isValidCpf(cpfRaw) {
    const cpf = onlyDigits(cpfRaw);
    if (cpf.length !== 11)
        return false;
    if (/^(\d)\1{10}$/.test(cpf))
        return false; // todos iguais
    const calcDv = (base, factorStart) => {
        let sum = 0;
        for (let i = 0; i < base.length; i++) {
            sum += Number(base[i]) * (factorStart - i);
        }
        const mod = (sum * 10) % 11;
        return mod === 10 ? 0 : mod;
    };
    const dv1 = calcDv(cpf.slice(0, 9), 10);
    if (dv1 !== Number(cpf[9]))
        return false;
    const dv2 = calcDv(cpf.slice(0, 10), 11);
    return dv2 === Number(cpf[10]);
}
/* -------- CNPJ -------- */
function isValidCnpj(cnpjRaw) {
    const cnpj = onlyDigits(cnpjRaw);
    if (cnpj.length !== 14)
        return false;
    if (/^(\d)\1{13}$/.test(cnpj))
        return false; // todos iguais
    const calcDv = (base) => {
        const pesos = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        let sum = 0;
        for (let i = 0; i < base.length; i++) {
            sum += Number(base[i]) * pesos[i];
        }
        const mod = sum % 11;
        return mod < 2 ? 0 : 11 - mod;
    };
    const base12 = cnpj.slice(0, 12);
    const dv1 = calcDv(base12);
    if (dv1 !== Number(cnpj[12]))
        return false;
    const base13 = cnpj.slice(0, 13);
    const dv2 = calcDv(base13);
    return dv2 === Number(cnpj[13]);
}
export function detectPixKeyType(key) {
    const raw = key.trim();
    if (!raw)
        return 'unknown';
    if (isEmail(raw))
        return 'email';
    if (isUuid(raw))
        return 'random';
    if (isE164(raw))
        return 'phone';
    const digits = onlyDigits(raw);
    if (digits.length === 14 && isValidCnpj(digits))
        return 'cnpj';
    if (digits.length === 11 && isValidCpf(digits))
        return 'cpf';
    if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55'))
        return 'phone';
    if (digits.length === 10 || digits.length === 11)
        return 'phone';
    return 'unknown';
}
