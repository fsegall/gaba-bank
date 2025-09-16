// src/providers/vaults/factory.ts
import type { IVaultProvider } from './types.js';
import { SorobanVaultProvider } from './soroban.js';
import { DefindexVaultProvider } from './defindex.js';

export function makeVaultProvider(): IVaultProvider {
  const raw = (process.env.VAULT_PROVIDER ?? 'soroban').toLowerCase();
  const kind = raw === 'self' ? 'soroban' : raw; // alias para compatibilidade
  if (kind === 'defindex') return new DefindexVaultProvider();
  return new SorobanVaultProvider(); // default = seu vault
}

