import { PrismaClient } from '@prisma/client'

// En serverless, le module est réutilisé d'une invocation « à chaud » à l'autre : on garde
// une seule instance sur globalThis, sinon chaque appel ouvrirait sa propre connexion et
// on épuiserait vite le pool Postgres.
export const prisma = globalThis.prismaClient ?? new PrismaClient()

globalThis.prismaClient = prisma
