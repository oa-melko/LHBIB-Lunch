import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { Server } from 'socket.io'
import { prisma } from './db.js'
import { loadMenu } from './menu.js'
import { createApp } from './app.js'
import { getDayState } from './orders.js'

const menu = loadMenu()
const app = createApp({ prisma, menu, onChange: (state) => io.emit('state', state) })
const httpServer = createServer(app)
const io = new Server(httpServer)

io.on('connection', async (socket) => {
  socket.emit('state', await getDayState(prisma, menu))
})

const dist = fileURLToPath(new URL('../client/dist', import.meta.url))
if (existsSync(dist)) {
  app.use(express.static(dist))
  app.get(/^(?!\/api|\/socket\.io).*/, (_req, res) => res.sendFile(join(dist, 'index.html')))
}

const PORT = process.env.PORT ?? 3001
httpServer.listen(PORT, () => console.log(`🍽️ LHBIB Lunch server on http://localhost:${PORT}`))
