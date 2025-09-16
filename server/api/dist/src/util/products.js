import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productsPath = path.join(__dirname, '..', '..', 'products.json');
let cache = null;
export async function loadProducts() {
    if (!cache)
        cache = JSON.parse(await readFile(productsPath, 'utf8'));
    return cache;
}
export async function getProductById(id) {
    const all = await loadProducts();
    return all.find(p => p.id === id) || null;
}
