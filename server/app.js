import express from 'express'
import { findItem } from './menu.js'
import { formatOrderMessage } from './format.js'
import { getDayState, addItem, updateItem, removeItem, setConfirmed } from './orders.js'

const AVATAR_COLORS = ['#E2725B', '#F4A261', '#2A9D8F', '#E76F51', '#8AB17D', '#EE8959', '#287271', '#B5838D']

export function createApp({ prisma, menu, onChange }) {
  const app = express()
  app.use(express.json())

  const broadcast = async (res, status = 200) => {
    const state = await getDayState(prisma, menu)
    onChange?.(state)
    res.status(status).json(state)
  }

  app.get('/api/menu', (_req, res) => res.json(menu))

  app.get('/api/state', async (_req, res) => {
    res.json(await getDayState(prisma, menu))
  })

  app.post('/api/items', async (req, res) => {
    const { memberId, menuItemId, variantKey, pastaType, quantity = 1, note } = req.body ?? {}
    if (!memberId || !menuItemId) return res.status(400).json({ error: 'memberId et menuItemId requis' })
    if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ error: 'quantité invalide' })
    if (!findItem(menu, menuItemId)) return res.status(400).json({ error: `Plat inconnu : ${menuItemId}` })
    await addItem(prisma, { memberId, menuItemId, variantKey, pastaType, quantity, note })
    await broadcast(res, 201)
  })

  app.patch('/api/items/:id', async (req, res) => {
    const { quantity, note } = req.body ?? {}
    if (quantity != null && (!Number.isInteger(quantity) || quantity < 1))
      return res.status(400).json({ error: 'quantité invalide' })
    try {
      await updateItem(prisma, Number(req.params.id), { quantity, note })
    } catch {
      return res.status(404).json({ error: 'Article introuvable' })
    }
    await broadcast(res)
  })

  app.delete('/api/items/:id', async (req, res) => {
    try {
      await removeItem(prisma, Number(req.params.id))
    } catch {
      return res.status(404).json({ error: 'Article introuvable' })
    }
    await broadcast(res)
  })

  app.post('/api/members/:id/confirm', async (req, res) => {
    const memberId = Number(req.params.id)
    const confirmed = Boolean(req.body?.confirmed)
    await setConfirmed(prisma, { memberId, confirmed })
    await broadcast(res)
  })

  app.get('/api/members', async (_req, res) => {
    res.json(await prisma.teamMember.findMany({ orderBy: { id: 'asc' } }))
  })

  app.post('/api/members', async (req, res) => {
    const { name } = req.body ?? {}
    if (!name?.trim()) return res.status(400).json({ error: 'nom requis' })
    const count = await prisma.teamMember.count()
    await prisma.teamMember.create({
      data: { name: name.trim(), color: AVATAR_COLORS[count % AVATAR_COLORS.length] },
    })
    await broadcast(res, 201)
  })

  app.patch('/api/members/:id', async (req, res) => {
    const { name, color, active } = req.body ?? {}
    try {
      await prisma.teamMember.update({
        where: { id: Number(req.params.id) },
        data: {
          ...(name != null && { name: String(name).trim() }),
          ...(color != null && { color }),
          ...(active != null && { active: Boolean(active) }),
        },
      })
    } catch {
      return res.status(404).json({ error: 'Membre introuvable' })
    }
    await broadcast(res)
  })

  app.delete('/api/members/:id', async (req, res) => {
    try {
      await prisma.teamMember.delete({ where: { id: Number(req.params.id) } })
    } catch {
      return res.status(404).json({ error: 'Membre introuvable' })
    }
    await broadcast(res)
  })

  app.get('/api/settings', async (_req, res) => {
    const rows = await prisma.setting.findMany()
    const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]))
    res.json({ whatsappNumber: settings.whatsappNumber ?? '' })
  })

  app.patch('/api/settings', async (req, res) => {
    const { whatsappNumber } = req.body ?? {}
    if (whatsappNumber != null) {
      await prisma.setting.upsert({
        where: { key: 'whatsappNumber' },
        update: { value: String(whatsappNumber).trim() },
        create: { key: 'whatsappNumber', value: String(whatsappNumber).trim() },
      })
    }
    const rows = await prisma.setting.findMany()
    const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]))
    res.json({ whatsappNumber: settings.whatsappNumber ?? '' })
  })

  app.get('/api/message', async (_req, res) => {
    const state = await getDayState(prisma, menu)
    res.json({ text: formatOrderMessage(state) })
  })

  // Express 5 fait remonter ici les rejets des handlers async. Sans ce filet, toute panne
  // de base ressort en « Internal Server Error » nu et il faut aller fouiller les logs de
  // l'hébergeur. On renvoie le code Prisma, qui suffit à identifier la cause — jamais le
  // message brut, qui peut contenir la chaîne de connexion.
  app.use((err, _req, res, _next) => {
    console.error(err)
    const causes = {
      P1001: "base injoignable — vérifie DATABASE_URL et que l'instance est réveillée",
      P1000: 'authentification refusée — identifiants incorrects dans DATABASE_URL',
      P1003: "la base nommée dans DATABASE_URL n'existe pas",
      P2021: "tables absentes — le schéma SQL n'a pas été exécuté sur la base",
    }
    res.status(500).json({
      error: causes[err.code] ?? 'erreur serveur',
      code: err.code ?? null,
    })
  })

  return app
}
