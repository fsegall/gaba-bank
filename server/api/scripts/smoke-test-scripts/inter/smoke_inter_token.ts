// scripts/smoke_inter_token.ts
import 'dotenv/config'
import { interHttp } from '../../../src/providers/inter/http.js'
async function main() {
  const http = interHttp()
  const { status } = await http.get('/') // força handshake+token
  console.log('HTTP OK status =', status)
}
main().catch((e) => {
  console.error('Erro:', e.response?.status, e.response?.data || e.message)
  process.exit(1)
})
