// api/src/services/psp.ts
import * as inter from '../providers/inter/client.js';

const PROVIDER = (
  process.env.PSP_PROVIDER ??
  (process.env.NODE_ENV === 'production' ? 'inter' : 'mock')
) as 'inter' | 'mock' | 'anchor';

export const getProvider = () => PROVIDER;


export const psp = {
  async criarCobranca({ valor_centavos, txid }: { valor_centavos: number; txid: string; }) {
    if (PROVIDER === 'inter') {
      const amount = (valor_centavos / 100).toFixed(2);
      const cob = await inter.createPixCharge({ txid, amount });
      return {
        qr_code: cob.qr_code ?? cob.qrCode ?? cob.imagemQrcode ?? '',
        copia_cola: cob.pixCopiaECola ?? cob.copiaECola ?? cob.copia_cola ?? '',
      };
    }
    throw new Error(`PSP provider not supported: ${PROVIDER}`);
  },

  validarAssinatura({ rawBody, signature, headers }:{
    rawBody: string; signature?: string; headers?: Record<string, any>;
  }) {
    if (PROVIDER === 'mock') return true;      // <- sem verificação no mock
    if (PROVIDER === 'inter') {
      // TODO: validar HMAC do Inter aqui
      return true; // placeholder
    }
    return false;
  },
  
};

export type PixPagoEvt = {
  type: 'pix.pago';
  psp_ref: string;
  txid: string;
  valor_centavos: number;
  product_id?: string;
  raw: any;
};

// helpers
const toCentavos = (v: unknown) => {
  if (typeof v === 'number') return Math.round(v * 100);
  if (typeof v === 'string') {
    const s = v.replace(',', '.').trim();
    const n = Number(s);
    if (!Number.isFinite(n)) throw new Error(`valor inválido: ${v}`);
    return Math.round(n * 100);
  }
  throw new Error(`valor inválido: ${v}`);
};

const infoAdicionaisLookup = (raw: any, key: string): string | undefined => {
  const arr = raw?.infoAdicionais ?? raw?.metadata?.infoAdicionais;
  if (Array.isArray(arr)) {
    const f = arr.find((x: any) => (x?.nome || '').toLowerCase() === key.toLowerCase());
    return f?.valor;
  }
  return raw?.metadata?.[key];
};

type ParseArgs = {
  provider: 'mock' | 'inter' | string;
  rawBody: string;
  signature?: string;
  headers: Record<string, any>;
};

type PixPagoEvent = {
  type: 'pix.pago';
  psp_ref: string;
  txid: string;
  valor_centavos: number;
  product_id?: string;
};

export function parseAndVerify({ provider, rawBody }: ParseArgs): PixPagoEvent {
  
  let evt: any;
  try {
    evt = JSON.parse(rawBody || '{}');
  } catch {
    throw new Error('payload inválido (JSON malformado)');
  }
  console.log('[psp:webhook]', { provider: process.env.PSP_PROVIDER, type: evt.type, txid: evt.txid, valor_centavos: evt.valor_centavos });

  if (provider === 'mock') {
    if (evt?.type !== 'pix.pago') throw new Error('mock: tipo inválido (esperado "pix.pago")');
    if (typeof evt.txid !== 'string') throw new Error('mock: txid ausente/ inválido');
    if (typeof evt.valor_centavos !== 'number') throw new Error('mock: valor_centavos ausente/ inválido');
    return {
      type: 'pix.pago',
      txid: evt.txid,
      valor_centavos: evt.valor_centavos,
      psp_ref: evt.psp_ref ?? 'mock-ref',
      product_id: evt.product_id,
    };
  }

  // stub p/ real (Inter): por ora passa adiante
  return evt as PixPagoEvent;
};