// scripts/smoke_inter_cob.ts
import 'dotenv/config';
import { createPixCharge, getPixCharge } from '../src/providers/inter/client.js';
async function main() {
    const txid = ('dep_smoke_' + Date.now()).replace(/[^A-Za-z0-9]/g, '').slice(0, 35);
    const amount = '10.50';
    const cob = await createPixCharge({ txid, amount, payer: { nome: 'Cliente Teste' } });
    console.log('COB criada:', { txid, resumo: cob?.loc ?? cob });
    const got = await getPixCharge(txid);
    console.log('COB consultada:', got?.status, got?.valor);
}
main().catch((e) => {
    console.error('Erro COB:', e.response?.status, e.response?.data || e);
    process.exit(1);
});
