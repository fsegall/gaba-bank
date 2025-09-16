// src/services/execProvider/mock.ts
import { ExecProvider, ExecQuote, ExecFill } from "./types.js";

export const mockExecProvider: ExecProvider = {
  async quoteSell({ symbol, amount_units }: { symbol: string; amount_units: bigint }): Promise<ExecQuote> {
    // 1:1 em BRL para facilitar (preço em centavos por unidade = 1 * 10^2 / 10^decimals?), mock simplificado:
    // Para manter simetria com BUY mock, assumimos "1 unidade do ATIVO == 1 BRL" => price_brl_per_unit = 100 (centavos)
    const price_brl_per_unit = 100n;
    const total_brl_centavos = amount_units * price_brl_per_unit;
    return {
      price_brl_per_unit,
      fee_native_units: 0n,
    };
  },

  async sell({ symbol, amount_units }: { symbol: string; amount_units: bigint }): Promise<ExecFill> {
    // Mesmo preço do quote; sem slippage no mock
    const price_brl_per_unit = 100n;
    const received_brl_centavos = amount_units * price_brl_per_unit;
    return {
      provider_ref: `mock-${Date.now()}`,
      filled_units: amount_units,
      received_brl_centavos,
      fee_native_units: 0n,
    };
  },
};
