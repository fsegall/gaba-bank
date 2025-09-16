// seus providers reais (já implementados no projeto)
import { SorobanVaultProvider } from '../providers/vaults/soroban.js';
import { DefindexVaultProvider } from '../providers/vaults/defindex.js';
let cached = null;
function getProvider() {
    if (cached)
        return cached;
    const kind = (process.env.VAULT_PROVIDER ?? 'soroban').toLowerCase();
    cached = kind === 'defindex' ? new DefindexVaultProvider() : new SorobanVaultProvider();
    return cached;
}
export async function depositToVault(args) {
    const p = getProvider();
    return p.deposit(args); // -> { externalId?, shares: bigint }
}
