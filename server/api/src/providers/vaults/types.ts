/**
 * Provedores de vault suportados nativamente.
 */
export type VaultProviderKind = 'soroban' | 'defindex' | 'self';

/**
 * Alias legado
 * @deprecated Use 'soroban' no lugar de 'self'.
 */
export type LegacyVaultProviderKind = 'self';

/**
 * União para leitura de dados antigos (ex.: linhas no banco com 'self').
 * Use apenas para parsing; ao emitir eventos novos, prefira 'soroban' | 'defindex'.
 */
export type AnyVaultProviderKind = VaultProviderKind | LegacyVaultProviderKind;

export interface DepositArgs {
  userId: string;
  /** Quantia em base units (USDC 7 dps) já normalizada (BigInt). */
  amountBaseUnits: bigint;
  /** Por ora trabalhamos só com USDC. Se evoluir p/ multi-asset, trocar p/ union ou string. */
  assetSymbol: 'USDC';
  /** Chave idempotente gerada pelo orquestrador (ex.: `vault:<deposit_id>`). */
  idempotencyKey: string;
  metadata?: Record<string, string>;
}

export interface WithdrawArgs {
  userId: string;
  /** Shares internas do vault alvo (BigInt). */
  shares: bigint;
  idempotencyKey: string;
  metadata?: Record<string, string>;
}

export interface Position {
  userId: string;
  /** Para Soroban e Defindex é o address/ID do contrato (C...). */
  vaultId: string;
  /** Total de shares (BigInt). */
  shares: bigint;
  /** Principal em base units do ativo subjacente (USDC 7 dps). */
  principalBaseUnits: bigint;
  updatedAt: Date;
}

export interface VaultEvent {
  /** Use 'soroban' | 'defindex'. Aceitamos 'self' somente ao ler registros antigos. */
  provider: AnyVaultProviderKind;
  kind: 'DEPOSIT' | 'WITHDRAW';
  /** id/tx do provedor (hash da tx, etc.) — útil p/ idempotência. */
  externalId?: string;
  /** Payload de requisição serializado (log/auditoria). */
  request: any;
  /** Resposta do provedor serializada. */
  response: any;
}

export interface IVaultProvider {
  /** O provider **ativo** do adapter — sempre 'soroban' ou 'defindex'. */
  kind: VaultProviderKind;
  deposit(args: DepositArgs): Promise<{ externalId?: string; shares: bigint }>;
  withdraw(args: WithdrawArgs): Promise<{ externalId?: string; redeemedBaseUnits: bigint }>;
  getPosition(userId: string): Promise<Position>;
  getTreasuryPosition(): Promise<Position>;
}

/* -------------------- Helpers -------------------- */

/** Normaliza 'self' -> 'soroban' para uso interno. */
export function normalizeVaultProviderKind(k: AnyVaultProviderKind): VaultProviderKind {
  return (k === 'self' ? 'soroban' : k) as VaultProviderKind;
}

/** Type guard útil ao consumir dados antigos. */
export function isVaultProviderKind(k: any): k is VaultProviderKind {
  return k === 'soroban' || k === 'defindex' || k === 'self';
}
