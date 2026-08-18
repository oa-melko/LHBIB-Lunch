import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { prisma } from './db.js'
import { loadMenu } from './menu.js'
import { createApp } from './app.js'

const menu = loadMenu()
const app = createApp({ prisma, menu })

const dist = fileURLToPath(new URL('../client/dist', import.meta.url))
if (existsSync(dist)) {
  app.use(express.static(dist))
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(join(dist, 'index.html')))
}

const PORT = process.env.PORT ?? 3001
app.listen(PORT, () => console.log(`🍽️ LHBIB Lunch server on http://localhost:${PORT}`))
