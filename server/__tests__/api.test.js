import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import request from 'supertest'
import { PrismaClient } from '@prisma/client'
import { loadMenu } from '../menu.js'
import { createApp } from '../app.js'

const prisma = new PrismaClient()
const menu = loadMenu()
const onChange = vi.fn()
const app = createApp({ prisma, menu, onChange })

async function resetDb() {
  await prisma.orderItem.deleteMany()
  await prisma.memberDayStatus.deleteMany()
  await prisma.dailyOrder.deleteMany()
  await prisma.teamMember.deleteMany()
  await prisma.setting.deleteMany()
  onChange.mockClear()
}

async function createMember(name = 'Oussama') {
  const res = await request(app).post('/api/members').send({ name })
  return res.body.members.find((m) => m.name === name)
}

describe('REST API', () => {
  beforeEach(resetDb)
  afterAll(() => prisma.$disconnect())

  it('GET /api/menu returns the menu', async () => {
    const res = await request(app).get('/api/menu')
    expect(res.status).toBe(200)
    expect(res.body.restaurant).toBe('LHBIB')
  })

  it('POST /api/items adds an item and returns enriched state', async () => {
    const m = await createMember()
    const res = await request(app)
      .post('/api/items')
      .send({ memberId: m.id, menuItemId: 'pizza-thon', variantKey: 'emporte', quantity: 2 })
    expect(res.status).toBe(201)
    expect(res.body.items[0].name).toBe('Pizza Thon')
    expect(res.body.total).toBe(70)
    expect(onChange).toHaveBeenCalled()
  })

  it('POST /api/items rejects unknown menu item with 400', async () => {
    const m = await createMember()
    const res = await request(app).post('/api/items').send({ memberId: m.id, menuItemId: 'nope' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBeTruthy()
  })

  it('POST /api/items rejects missing fields and bad quantity', async () => {
    expect((await request(app).post('/api/items').send({})).status).toBe(400)
    const m = await createMember()
    const bad = await request(app)
      .post('/api/items')
      .send({ memberId: m.id, menuItemId: 'frites', quantity: 0 })
    expect(bad.status).toBe(400)
  })

  it('PATCH and DELETE /api/items/:id work, 404 on missing', async () => {
    const m = await createMember()
    const created = await request(app)
      .post('/api/items')
      .send({ memberId: m.id, menuItemId: 'frites' })
    const itemId = created.body.items[0].id
    const patched = await request(app).patch(`/api/items/${itemId}`).send({ quantity: 3 })
    expect(patched.body.items[0].quantity).toBe(3)
    const deleted = await request(app).delete(`/api/items/${itemId}`)
    expect(deleted.body.items).toHaveLength(0)
    expect((await request(app).delete(`/api/items/${itemId}`)).status).toBe(404)
  })

  it('confirm flow updates counts', async () => {
    const m = await createMember()
    const res = await request(app).post(`/api/members/${m.id}/confirm`).send({ confirmed: true })
    expect(res.body.confirmedCount).toBe(1)
    const undo = await request(app).post(`/api/members/${m.id}/confirm`).send({ confirmed: false })
    expect(undo.body.confirmedCount).toBe(0)
  })

  it('member CRUD', async () => {
    const m = await createMember('Ali')
    const renamed = await request(app).patch(`/api/members/${m.id}`).send({ name: 'Alae' })
    expect(renamed.body.members.find((x) => x.id === m.id).name).toBe('Alae')
    const deleted = await request(app).delete(`/api/members/${m.id}`)
    expect(deleted.body.members).toHaveLength(0)
    expect((await request(app).post('/api/members').send({})).status).toBe(400)
  })

  it('settings roundtrip', async () => {
    const empty = await request(app).get('/api/settings')
    expect(empty.body.whatsappNumber).toBe('')
    await request(app).patch('/api/settings').send({ whatsappNumber: '212600000000' })
    const set = await request(app).get('/api/settings')
    expect(set.body.whatsappNumber).toBe('212600000000')
  })

  it('GET /api/message returns formatted text', async () => {
    const m = await createMember()
    await request(app).post('/api/items').send({ memberId: m.id, menuItemId: 'pizza-thon' })
    const res = await request(app).get('/api/message')
    expect(res.body.text).toContain('Pizza Thon')
    expect(res.body.text).toContain('Total : 35 dh')
  })
})
