# --- Étape 1 : build du frontend et du client Prisma ---
FROM node:24-slim AS build
WORKDIR /app

# openssl est requis par le moteur Prisma
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY vite.config.js ./
COPY client ./client
RUN npm run build

# --- Étape 2 : image finale (sans les devDependencies) ---
FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
# le client Prisma est copié depuis l'étape de build, pas régénéré ici
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/client/dist ./client/dist
COPY server ./server
COPY data ./data
COPY prisma ./prisma

# Cloud Run injecte PORT (8080 par défaut) — server/index.js le lit déjà
EXPOSE 8080
CMD ["node", "server/index.js"]
