import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { loadMenu } from '../menu.js'
import {
  todayKey,
  getOrCreateDay,
  getDayState,
  addItem,
  updateItem,
  removeItem,
  setConfirmed,
} from '../orders.js'

const prisma = new PrismaClient()
const menu = loadMenu()
const DAY = '2026-06-11'

async function resetDb() {
  await prisma.orderItem.deleteMany()
  await prisma.memberDayStatus.deleteMany()
  await prisma.dailyOrder.deleteMany()
  await prisma.teamMember.deleteMany()
}

describe('orders service', () => {
  beforeEach(resetDb)
  afterAll(() => prisma.$disconnect())

  it('todayKey formats local date as YYYY-MM-DD', () => {
    expect(todayKey(new Date(2026, 5, 11))).toBe('2026-06-11')
  })

  it('creates the day once (idempotent)', async () => {
    const a = await getOrCreateDay(prisma, DAY)
    const b = await getOrCreateDay(prisma, DAY)
    expect(a.id).toBe(b.id)
  })

  it('addItem enriches state with resolved price and lineTotal', async () => {
    const m = await prisma.teamMember.create({ data: { name: 'Oussama', color: '#E2725B' } })
    await addItem(prisma, { memberId: m.id, menuItemId: 'pizza-thon', variantKey: 'emporte', quantity: 2, dateKey: DAY })
    const state = await getDayState(prisma, menu, DAY)
    expect(state.items).toHaveLength(1)
    const it1 = state.items[0]
    expect(it1.name).toBe('Pizza Thon')
    expect(it1.unitPrice).toBe(35)
    expect(it1.lineTotal).toBe(70)
    expect(it1.variantLabel).toBe('Emporté')
    expect(state.total).toBe(70)
  })

  it('setConfirmed flips status and confirmedCount counts only active members', async () => {
    const m1 = await prisma.teamMember.create({ data: { name: 'A', color: '#111' } })
    const m2 = await prisma.teamMember.create({ data: { name: 'B', color: '#222' } })
    await prisma.teamMember.create({ data: { name: 'Inactif', color: '#333', active: false } })
    await setConfirmed(prisma, { memberId: m1.id, confirmed: true, dateKey: DAY })
    let state = await getDayState(prisma, menu, DAY)
    expect(state.confirmedCount).toBe(1)
    expect(state.activeCount).toBe(2)
    expect(state.members.find((m) => m.id === m1.id).confirmed).toBe(true)
    expect(state.members.find((m) => m.id === m2.id).confirmed).toBe(false)
    await setConfirmed(prisma, { memberId: m1.id, confirmed: false, dateKey: DAY })
    state = await getDayState(prisma, menu, DAY)
    expect(state.confirmedCount).toBe(0)
  })

  it('updateItem and removeItem adjust the state', async () => {
    const m = await prisma.teamMember.create({ data: { name: 'C', color: '#444' } })
    const created = await addItem(prisma, { memberId: m.id, menuItemId: 'salade-marocaine', dateKey: DAY })
    await updateItem(prisma, created.id, { quantity: 3 })
    let state = await getDayState(prisma, menu, DAY)
    expect(state.items[0].quantity).toBe(3)
    expect(state.total).toBe(75)
    await removeItem(prisma, created.id)
    state = await getDayState(prisma, menu, DAY)
    expect(state.items).toHaveLength(0)
    expect(state.total).toBe(0)
  })

  it('total aggregates across members', async () => {
    const m1 = await prisma.teamMember.create({ data: { name: 'A', color: '#111' } })
    const m2 = await prisma.teamMember.create({ data: { name: 'B', color: '#222' } })
    await addItem(prisma, { memberId: m1.id, menuItemId: 'pizza-thon', variantKey: 'surplace', dateKey: DAY })
    await addItem(prisma, { memberId: m2.id, menuItemId: 'frites', quantity: 2, dateKey: DAY })
    const state = await getDayState(prisma, menu, DAY)
    expect(state.total).toBe(40 + 20)
  })
})
