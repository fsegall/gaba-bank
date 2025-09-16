// src/bootstrap/decimals.ts
import { DEC } from 'precise-money';
export function loadDecimalsRegistry() {
    // Defaults de negócio
    DEC.set('USDC', 6);
    DEC.set('BTC', 8);
    DEC.set('ETH', 18);
    DEC.set('BRL', 2); // BRL sempre 2 casas no ledger interno
    // Stellar Classic (sempre 7 no ledger)
    DEC.set('XLM', 7);
    DEC.set('USDC', 7); // Stellar USDC é 7 casas
    // Overrides por chain/asset (exemplos)
    // EVM USDC
    DEC.setById({ chain: 'evm', symbol: 'USDC', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', chainId: 1 }, 6);
    // Solana USDC
    DEC.setById({ chain: 'solana', symbol: 'USDC', address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB' }, 6);
    // Stellar Soroban (contrato hipotético)
    DEC.setById({ chain: 'stellar', symbol: 'USDC', address: 'CBR...CONTRACT' }, 6);
    console.log('[bootstrap] Decimals registry loaded');
}
// Auto-load on import
loadDecimalsRegistry();
