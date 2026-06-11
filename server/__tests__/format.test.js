import { describe, it, expect } from 'vitest'
import { formatOrderMessage } from '../format.js'

function makeState() {
  return {
    date: '2026-06-11',
    total: 150,
    members: [
      { id: 1, name: 'Oussama', active: true },
      { id: 2, name: 'Ali', active: true },
      { id: 3, name: 'Sara', active: true },
    ],
    items: [
      { id: 10, memberId: 1, menuItemId: 'pizza-thon', name: 'Pizza Thon', variantKey: 'emporte', variantLabel: 'Emporté', pastaType: null, quantity: 1, note: null, unitPrice: 35, lineTotal: 35 },
      { id: 11, memberId: 2, menuItemId: 'pizza-thon', name: 'Pizza Thon', variantKey: 'emporte', variantLabel: 'Emporté', pastaType: null, quantity: 1, note: null, unitPrice: 35, lineTotal: 35 },
      { id: 12, memberId: 2, menuItemId: 'pates-carbonara', name: 'Carbonara', variantKey: 'emporte', variantLabel: 'Emporté', pastaType: 'Tagliatelle', quantity: 1, note: null, unitPrice: 45, lineTotal: 45 },
      { id: 13, memberId: 3, menuItemId: 'salade-marocaine', name: 'Salade Marocaine', variantKey: null, variantLabel: null, pastaType: null, quantity: 1, note: 'sans olives', unitPrice: 25, lineTotal: 25 },
    ],
  }
}

describe('formatOrderMessage', () => {
  const msg = formatOrderMessage(makeState())

  it('starts with a French date header', () => {
    expect(msg).toMatch(/^🍽️ Commande LHBIB — jeudi 11\/06/)
  })

  it('groups identical lines with summed quantity', () => {
    expect(msg).toContain('2× Pizza Thon (Emporté)')
  })

  it('shows pasta type', () => {
    expect(msg).toContain('1× Carbonara (Tagliatelle) (Emporté)')
  })

  it('appends the note and omits variant for simple items', () => {
    expect(msg).toContain('1× Salade Marocaine — sans olives')
  })

  it('has a total line', () => {
    expect(msg).toContain('💰 Total : 150 dh')
  })

  it('has a per-person recap', () => {
    expect(msg).toContain('👥 Détail :')
    expect(msg).toContain('• Oussama : Pizza Thon')
    expect(msg).toContain('• Ali : Pizza Thon, Carbonara')
    expect(msg).toContain('• Sara : Salade Marocaine')
  })

  it('skips members without items in the recap', () => {
    const state = makeState()
    state.members.push({ id: 4, name: 'Fantôme', active: true })
    expect(formatOrderMessage(state)).not.toContain('Fantôme')
  })
})
