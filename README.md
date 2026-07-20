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

Le serveur écoute sur **un seul port (3001)** — il sert l'app, l'API et le temps réel
(Socket.IO). Il suffit de pointer ton tunnel dessus, par exemple :

```powershell
# Cloudflare (recommandé : URL stable avec un named tunnel)
cloudflared tunnel --url http://localhost:3001

# ou ngrok
ngrok http 3001
```

💡 **Conseil :** utilise un tunnel à URL fixe (Cloudflare *named tunnel* ou domaine statique
ngrok), sinon le lien de l'équipe change à chaque redémarrage.

Le port se change avec la variable d'environnement `PORT`.

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

Node.js + Express 5 + Socket.IO + Prisma/SQLite côté serveur ·
React 19 + react-three-fiber (Three.js) côté client · Vite · Vitest.
