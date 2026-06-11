import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const menuPath = fileURLToPath(new URL('../data/menu.json', import.meta.url))

export function loadMenu() {
  return JSON.parse(readFileSync(menuPath, 'utf-8'))
}

export function findItem(menu, id) {
  for (const cat of menu.categories) {
    const item = cat.items.find((i) => i.id === id)
    if (item) return { ...item, category: cat }
  }
  return null
}

export function resolvePrice(menu, { menuItemId, variantKey }) {
  const item = findItem(menu, menuItemId)
  if (!item) throw new Error(`Unknown menu item: ${menuItemId}`)
  if (item.price != null) return item.price
  const opts = item.variants.options
  const opt =
    opts.find((o) => o.key === variantKey) ??
    opts.find((o) => o.key === item.variants.default) ??
    opts[0]
  return opt.price
}
