import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

let oracle: typeof import('../src/services/oracle');

beforeAll(() => {
  // ENVs mínimas para o oracle.ts inicializar sem cair no checksum
  process.env.NODE_ENV = 'test';
  process.env.VITEST = '1';
  process.env.SOROBAN_RPC_URL = process.env.SOROBAN_RPC_URL ?? 'http://localhost:8000/soroban/rpc';
  process.env.SOROBAN_NETWORK_PASSPHRASE = process.env.SOROBAN_NETWORK_PASSPHRASE ?? 'Test SDF Network ; September 2015';
  process.env.REFLECTOR_CONTRACT_ID = process.env.REFLECTOR_CONTRACT_ID ?? 'CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC';
  // **G válido** (checksum OK). Pode ser qualquer chave de teste válida.
  process.env.SOROBAN_VIEW_SOURCE = process.env.SOROBAN_VIEW_SOURCE ?? 'GB3JDWCQ6M3S6Q6N4QH7Z7U53Y6Q5YGXK4V6F2T3N7I32D5WJ7KQ4XYZ';
});

beforeEach(async () => {
  vi.resetModules();            // força reimport respeitando as ENVs acima
  oracle = await import('../src/services/oracle');
});

describe('BRLD parity (BRLD = BRL 1:1) + breaker', () => {
  it('BLOQUEIA quando spread > limite', async () => {
    // Mocka o oracle: USDC/BRLD = 0.2000 (≈ R$5 por US$1)
    vi.spyOn(oracle.__deps, 'getUSDCperBRLD_parity')
    .mockResolvedValue({ pair: 'USDC/BRLD', price: 0.20, ts: Date.now(), source: 'reflector+parity' });
  
    process.env.ORACLE_SANITY_ENABLED = 'true';
    process.env.ORACLE_MAX_SPREAD_BPS = '50';
    
    await expect(oracle.sanityCheckBRLDUSDC(0.2050))
      .rejects.toThrow(/circuit-breaker \(BRLD\)/i);
  });
});
