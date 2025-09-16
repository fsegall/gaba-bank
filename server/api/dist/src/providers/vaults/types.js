/* -------------------- Helpers -------------------- */
/** Normaliza 'self' -> 'soroban' para uso interno. */
export function normalizeVaultProviderKind(k) {
    return (k === 'self' ? 'soroban' : k);
}
/** Type guard útil ao consumir dados antigos. */
export function isVaultProviderKind(k) {
    return k === 'soroban' || k === 'defindex' || k === 'self';
}
