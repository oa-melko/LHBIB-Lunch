# 🍕 LHBIB Lunch

## 📡 Accès équipe (LAN) — http://192.168.100.134:3001

L'app est **hors schéma ports Melko** (60XX/61XX) : elle garde son port **3001** (serveur unique)
et **5173** (dev). Le serveur écoute sur toutes les interfaces → l'équipe ouvre simplement
**http://192.168.100.134:3001** sur téléphone/PC (même réseau Wi-Fi).

```powershell
git clone https://github.com/oa-melko/LHBIB-Lunch.git
cd LHBIB-Lunch
npm install
npm run db:push                         # crée la base SQLite (prisma/dev.db)
npm run build                           # build du frontend
npm start                               # serveur unique → http://192.168.100.134:3001
```


L'app du déj de l'équipe : un menu 3D du restaurant LHBIB qu'on feuillette comme un vrai livre.
Chacun ouvre le lien sur son téléphone, choisit ses plats, et celui qui descend commander
envoie le récap sur WhatsApp (ou le copie) en un clic. Fini les notes dans le groupe Telegram 😄

## Démarrage

```powershell
npm install
npm run db:push      # crée la base SQLite (prisma/dev.db)
npm run build        # build du frontend
npm start            # serveur unique sur http://localhost:3001
```

Pour développer (hot reload) : `npm run dev` → http://localhost:5173

Pour les tests : `npm test`

## Exposer l'app à l'équipe (tunnel)

Le serveur écoute sur **un seul port (3001)** — il sert à la fois l'app et l'API.
Il suffit de pointer ton tunnel dessus, par exemple :

```powershell
# Cloudflare (recommandé : URL stable avec un named tunnel)
cloudflared tunnel --url http://localhost:3001

# ou ngrok
ngrok http 3001
```

💡 **Conseil :** utilise un tunnel à URL fixe (Cloudflare *named tunnel* ou domaine statique
ngrok), sinon le lien de l'équipe change à chaque redémarrage.

Le port se change avec la variable d'environnement `PORT`.

## Déploiement (Vercel)

L'app se découpe en deux sur Vercel : le frontend buildé (`client/dist`) est servi en
statique, et l'API Express tourne en **Serverless Function** via [api/index.js](api/index.js).
Tout est décrit dans [vercel.json](vercel.json).

### 1. La base (Neon)

Créer un projet sur [neon.tech](https://neon.tech), ouvrir le **SQL Editor**, y coller
[docs/schema-neon.sql](docs/schema-neon.sql) et l'exécuter.

⚠️ Copier ensuite la connection string **avec le pooler** — l'URL qui contient `-pooler` :

```
postgresql://user:motdepasse@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

En serverless, chaque requête peut ouvrir sa propre connexion. Sans le pooler, le nombre
de connexions Postgres part en vrille et l'app tombe aux heures de pointe.

### 2. Le projet Vercel

Importer le dépôt sur [vercel.com](https://vercel.com), puis dans **Settings →
Environment Variables** ajouter `DATABASE_URL` avec l'URL ci-dessus. Rien d'autre à
configurer : `vercel.json` fixe déjà la commande de build et le dossier de sortie.

Chaque `git push` sur `master` redéploie automatiquement.

### Pas de temps réel : du polling

Vercel ne sait pas maintenir de WebSocket, donc il n'y a plus de Socket.IO. À la place,
[client/src/sync.js](client/src/sync.js) réinterroge `/api/state` toutes les 5 secondes,
**uniquement quand l'onglet est visible** (sinon dix téléphones ouverts toute la journée
épuiseraient le quota d'invocations).

Les actions de celui qui les fait restent instantanées : les routes de mutation renvoient
déjà l'état complet de la journée, et [client/src/api.js](client/src/api.js) l'applique
directement au store. Le polling ne sert qu'à voir arriver les commandes des autres, avec
5 secondes de décalage au pire.

## Déploiement alternatif (Google Cloud Run)

L'app part en **un seul conteneur** (voir [Dockerfile](Dockerfile)) : Express
servent l'API, le temps réel et le frontend buildé, sur le port fourni par `PORT`.

⚠️ Le disque de Cloud Run est **éphémère** : la base n'est plus SQLite mais un
**Postgres externe** (Neon, offre gratuite).

### 1. La base (Neon)

Créer un projet sur [neon.tech](https://neon.tech), copier la chaîne de connexion, puis
initialiser le schéma depuis ton poste :

```powershell
# .env local
DATABASE_URL="postgresql://user:motdepasse@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require"

npx prisma generate
npm run db:push
```

### 2. Le déploiement

```powershell
gcloud auth login
gcloud config set project <ID-DU-PROJET>
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

gcloud run deploy lhbib-lunch `
  --source . `
  --region europe-west1 `
  --allow-unauthenticated `
  --max-instances 1 `
  --set-env-vars "DATABASE_URL=postgresql://..."
```

Cloud Run répond avec l'URL HTTPS de l'équipe. Pour redéployer : la même commande
(les `--set-env-vars` sont conservés si on les omet lors d'une mise à jour).

### Pourquoi ces options

| Option | Raison |
|---|---|
| `--max-instances 1` | Une seule instance suffit largement, et ça borne la facture. |
| `--allow-unauthenticated` | L'équipe ouvre le lien sans compte Google. |

💡 `DATABASE_URL` contient un mot de passe : il vit **uniquement** dans `.env` (ignoré par
git) et dans les variables d'environnement du service Cloud Run. Jamais dans le repo.

### Développement local

Le provider Prisma est maintenant `postgresql` : `npm run dev` a besoin d'un Postgres.
Le plus simple est de pointer le `.env` sur Neon. Pour les tests, un Postgres jetable :

```powershell
npm run test:db:up     # conteneur Postgres sur le port 5435
npm test
npm run test:db:down
```

## Utilisation

1. Chacun ouvre le lien, choisit **son prénom** (mémorisé sur son appareil).
2. On feuillette le menu 3D (onglets, flèches, ou swipe) et on touche un plat pour l'ajouter.
3. **« Je confirme ! ✅ »** quand le plateau est complet — le compteur `X/N` se met à jour
   en direct chez tout le monde.
4. Le badge `🍽️ X/N` ouvre le tableau de bord : qui a commandé quoi, total en dirhams,
   et les boutons **📲 WhatsApp** / **📋 Copier**.
5. La commande repart de zéro automatiquement chaque jour (l'historique reste en base).

## Réglages (⚙️)

- Ajouter / renommer / supprimer des membres de l'équipe.
- 🌴 met un membre « absent » (il ne compte plus dans le X/N), 💤 le réactive.
- Numéro WhatsApp du resto au format international (ex : `2126XXXXXXXX`).
  Vide → WhatsApp s'ouvre avec le choix du contact.

## Modifier le menu

Tout le menu vit dans [data/menu.json](data/menu.json) (extrait des photos dans
`assets/`). Noms, prix, descriptions, catégories : édite le JSON et redémarre le serveur.
Les plats avec deux prix utilisent `variants` (Sur place / Emporté, Petite / Grande),
et la catégorie Pâtes a un `choice` (Spaghetti / Tagliatelle / Penne).

## Stack

Node.js + Express 5 + Prisma/PostgreSQL côté serveur ·
React 19 + react-three-fiber (Three.js) côté client · Vite · Vitest.
