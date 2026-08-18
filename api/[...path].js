import { prisma } from '../server/db.js'
import { loadMenu } from '../server/menu.js'
import { createApp } from '../server/app.js'

// Point d'entrée serverless (Vercel) : seule l'API tourne ici, le frontend est servi
// en statique depuis client/dist. Pas de onChange : la diffusion temps réel est remplacée
// par le polling côté client (voir client/src/sync.js).
const menu = loadMenu()

export default createApp({ prisma, menu })
