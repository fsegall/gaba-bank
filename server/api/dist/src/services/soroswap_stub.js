// src/services/soroswap.ts
import crypto from 'crypto';
export const soroswap = {
    async quote({ pair, amountIn }) {
        const poolMid = 1;
        const route = { pair, hops: [] };
        return { route, amountIn, amountOut: amountIn, poolMid };
    },
    async swap({ route, amountIn, minOut, client_ref, }) {
        // se vier um client_ref determinístico, usa como provider_ref
        const ref = client_ref ?? `tx_${crypto.randomUUID()}`;
        return { exec_provider: 'soroswap', tx_hash: ref, route, fee_native: 0.0001 };
    }
};
