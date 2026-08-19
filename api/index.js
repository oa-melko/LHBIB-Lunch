import { prisma } from '../server/db.js'
import { loadMenu } from '../server/menu.js'
import { createApp } from '../server/app.js'

// Point d'entrée serverless (Vercel) : seule l'API tourne ici, le frontend est servi en
// statique depuis client/dist. Pas de onChange, la diffusion temps réel est remplacée par
// le polling côté client (voir client/src/sync.js).
//
// Tout /api/* est réécrit vers ce fichier par vercel.json plutôt que routé par nom de
// fichier : le catch-all api/[...path].js ne suivait pas les chemins à plusieurs segments
// et /api/members/7/confirm repartait en 404 avant même d'atteindre Express. La réécriture
// laisse l'URL d'origine intacte, donc les routes d'Express matchent telles quelles.
const menu = loadMenu()

export default createApp({ prisma, menu })
