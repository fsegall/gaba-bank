// src/providers/inter/client.ts
import { interHttp } from './http.js'
import { normalizePixKey } from '../../util/pix.js'
import { createHash, randomUUID } from 'crypto'

// === Constantes de caminho/escopo (podem ser override no .env) ===
const COB_PATH    = process.env.INTER_PIX_COB_PATH    ?? '/pix/v2/cob'
const COBQ_PATH   = process.env.INTER_PIX_COBQ_PATH   ?? '/pix/v2/cob'
const COB_METHOD  = (process.env.INTER_PIX_COB_METHOD ?? 'PUT').toUpperCase()

// Pagamento (Banking v2)
const PAY_PATH    = process.env.INTER_PIX_PAY_PATH    ?? '/banking/v2/pix'
const PAY_METHOD  = (process.env.INTER_PIX_PAY_METHOD ?? 'POST').toUpperCase()

// Escopos
const SCOPE_COB   = process.env.INTER_OAUTH_SCOPE_COB   ?? 'pix.read pix.write'
const SCOPE_PIX   = process.env.INTER_OAUTH_SCOPE_PIX   ?? 'pix.read'
const SCOPE_PAGAR = process.env.INTER_OAUTH_SCOPE_PAGAR ?? 'pagamento-pix.write'

// Gera um UUID v4 determinístico a partir de um seed (ex.: seu idempotency)
function uuidFromSeed(seed: string): string {
  const h = createHash('sha256').update(String(seed)).digest() // 32 bytes
  const b = Buffer.from(h)
  // Ajusta bits p/ version=4 e variant=RFC4122
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const hex = b.toString('hex')
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`
}

function assertTxidCob(txid: string) {
  if (!/^[A-Za-z0-9]{26,35}$/.test(txid)) {
    throw new Error(`TXID inválido (COB): 26–35 chars alfanuméricos (recebi "${txid}")`)
  }
}
function assertIdempotencySeed(id: string) {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) {
    throw new Error(`id inválido (idempotência): 1–64 [A-Za-z0-9_-] (recebi "${id}")`)
  }
}

function assertAmount(amount: string) {
  if (!/^\d{1,10}(\.\d{2})?$/.test(amount)) {
    throw new Error(`Valor inválido: use formato "100.00" (recebi "${amount}")`)
  }
}

type Payer = { nome: string; cpf?: string; cnpj?: string }
function sanitizePayer(p?: Payer): Payer | undefined {
  if (!p) return undefined
  const out: Payer = { nome: p.nome.trim() }
  if (p.cpf)  out.cpf  = p.cpf.replace(/\D/g, '')
  if (p.cnpj) out.cnpj = p.cnpj.replace(/\D/g, '')
  return out
}

function isDuplicateTxidError(err: any) {
  const data = err?.response?.data
  const viol = Array.isArray(data?.violacoes) ? data.violacoes : []
  if (viol.some((v: any) =>
      /txid/i.test(String(v?.propriedade)) && /utilizad/i.test(String(v?.razao)))) return true
  const detail = typeof data === 'string' ? data : data?.detail
  return typeof detail === 'string' &&
         /txid/i.test(detail) && /utilizad/i.test(detail)
}

// === COB (criar) ===
export async function createPixCharge({ txid, amount, payer }:{
  txid: string; amount: string; payer?: Payer
}) {
  assertTxidCob(txid)
  assertAmount(amount)

  const http = interHttp()
  const key = process.env.INTER_PIX_KEY
  if (!key) throw new Error('INTER_PIX_KEY não configurada')

  const body: any = {
    calendario: { expiracao: 3600 },
    valor: { original: amount },
    chave: normalizePixKey(key),
    infoAdicionais: [{ nome: 'ref', valor: txid }],
  }
  const payr = sanitizePayer(payer)
  if (payr?.cpf || payr?.cnpj) body.devedor = payr

  try {
    if (COB_METHOD === 'PUT') {
      const { data } = await http.put(`${COB_PATH}/${encodeURIComponent(txid)}`, body, {
        interScope: SCOPE_COB, // escopo de COB
      })
      return data
    } else {
      const { data } = await http.post(COB_PATH, body, { interScope: SCOPE_COB })
      return data
    }
  } catch (err) {
    // se já existe, devolve a existente
    if (isDuplicateTxidError(err)) {
      const { data } = await http.get(`${COBQ_PATH}/${encodeURIComponent(txid)}`, {
        interScope: SCOPE_COB, // use o mesmo escopo de COB também na leitura
      })
      return data
    }
    throw err
  }
}

// === COB (consultar) ===
export async function getPixCharge(txid: string) {
  assertTxidCob(txid)
  const http = interHttp()
  const { data } = await http.get(`${COBQ_PATH}/${encodeURIComponent(txid)}`, {
    interScope: SCOPE_COB, // evita 401 por escopo
  })
  return data
}


// === Pagamento (Banking v2) ===
// src/providers/inter/client.ts
export async function payPix({
  idempotency, // <-- novo nome, sem confundir com txid de COB
  chave,
  amount,
  descricao,
}: {
  idempotency: string
  chave: string
  amount: string
  descricao?: string
}) {
  if (!idempotency) throw new Error('idempotency é obrigatório')
  assertAmount(amount)

  const http = interHttp()

  const body = {
    valor: Number(amount), // number
    descricao,
    destinatario: {
      tipo: 'CHAVE',                 // ESSENCIAL pela doc
      chave: normalizePixKey(chave), // e.g. CNPJ só números
    },
    // dataPagamento: "YYYY-MM-DD" // opcional (default: hoje)
  }

  const headers: Record<string, string> = {
    'x-id-idempotente': uuidFromSeed(idempotency),
  }
  const conta = process.env.INTER_BANK_ACCOUNT?.trim()
  if (conta) headers['x-conta-corrente'] = conta

  const { data } = await http.post('/banking/v2/pix', body, {
    interScope: SCOPE_PAGAR, // o interceptor pega token com esse scope
    headers,
  })
  return data
}