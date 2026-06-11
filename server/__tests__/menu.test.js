import { describe, it, expect } from 'vitest'
import { loadMenu, findItem, resolvePrice } from '../menu.js'

describe('menu', () => {
  const menu = loadMenu()

  it('loads categories with items', () => {
    expect(menu.categories.length).toBeGreaterThanOrEqual(9)
    expect(findItem(menu, 'pizza-thon').name).toBe('Pizza Thon')
  })

  it('resolves simple price', () => {
    expect(resolvePrice(menu, { menuItemId: 'salade-marocaine' })).toBe(25)
  })

  it('resolves variant price', () => {
    expect(resolvePrice(menu, { menuItemId: 'pizza-thon', variantKey: 'emporte' })).toBe(35)
    expect(resolvePrice(menu, { menuItemId: 'pizza-thon', variantKey: 'surplace' })).toBe(40)
  })

  it('falls back to default variant when key missing', () => {
    expect(resolvePrice(menu, { menuItemId: 'pizza-thon' })).toBe(35)
  })

  it('throws for unknown item', () => {
    expect(() => resolvePrice(menu, { menuItemId: 'nope' })).toThrow()
  })
})
