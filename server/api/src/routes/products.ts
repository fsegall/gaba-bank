// src/util/products.ts
import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { Router } from 'express'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const router = Router()

router.get('/products', async (_req, res) => {
  const items = await loadProducts()
  res.json(items)
})

function resolveProductsPath(p?: string) {
  if (!p) return path.join(__dirname, '..', '..', 'products.json')
  return path.isAbsolute(p) ? p : path.resolve(__dirname, '..', p)
}
const productsPath = resolveProductsPath(process.env.PRODUCTS_PATH)

let cache: any[] | null = null
export async function loadProducts() {
  if (!cache) cache = JSON.parse(await readFile(productsPath, 'utf8'))
  return cache!
}
export async function getProductById(id: string) {
  const all = await loadProducts()
  return all.find(p => p.id === id) || null
}
