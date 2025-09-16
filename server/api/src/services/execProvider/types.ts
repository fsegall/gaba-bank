// src/services/execProvider/types.ts
export type ExecQuote = {
    price_brl_per_unit: bigint; // preço 1 unidade do ATIVO em BRL centavos
    fee_native_units: bigint;   // taxa do provedor na moeda nativa (mock = 0)
    route_json?: any;
  };
  
  export type ExecFill = {
    provider_ref: string;       // ex: tx_hash
    filled_units: bigint;       // unidades do ativo vendidas
    received_brl_centavos: bigint;
    fee_native_units: bigint;
  };
  
  export interface ExecProvider {
    quoteSell(params: { symbol: string; amount_units: bigint }): Promise<ExecQuote>;
    sell(params: { symbol: string; amount_units: bigint }): Promise<ExecFill>;
  }
  