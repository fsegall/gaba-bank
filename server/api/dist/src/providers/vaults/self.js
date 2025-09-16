export class SelfVaultProvider {
    kind = 'self';
    async deposit(args) {
        // ... lógica atual do seu vault interno
        // retornar shares emitidas
        return { externalId: undefined, shares: /* calc */ BigInt(0) };
    }
    async withdraw(args) {
        // ... lógica atual
        return { externalId: undefined, redeemedBaseUnits: /* calc */ BigInt(0) };
    }
    async getPosition(userId) {
        // ... consulta banco interno
        return { userId, vaultId: process.env.VAULT_DEFAULT_ID, shares: BigInt(0), principalBaseUnits: BigInt(0), updatedAt: new Date() };
    }
    async getTreasuryPosition() {
        // ... consulta posição da tesouraria
        return { userId: 'treasury', vaultId: process.env.VAULT_DEFAULT_ID, shares: BigInt(0), principalBaseUnits: BigInt(0), updatedAt: new Date() };
    }
}
