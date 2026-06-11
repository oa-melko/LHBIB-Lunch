# LHBIB Lunch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A self-hosted real-time web app where the team picks lunch from a 3D flip-book of the Lhbib menu, sees a live "who ordered what" board, and exports the order via WhatsApp/clipboard.

**Architecture:** One Node.js process (Express + Socket.IO + Prisma/SQLite) serves both the REST/realtime API and the built Vite frontend on a single port (3001), exposed through the user's tunnel. The frontend is React + react-three-fiber: a 3D book whose pages are categories, with dish lists rendered as `drei` `<Html transform>` panels on the page faces so they stay crisp and clickable. Menu data lives in an editable `data/menu.json`, not the DB.

**Tech Stack:** Node 18+ ESM, Express 4, Socket.IO 4, Prisma 5 + SQLite, Vite 5, React 18, three + @react-three/fiber + @react-three/drei, zustand, Vitest + Supertest, cross-env, concurrently.

**Visual identity:** warm cream `#FFF8F0`, terracotta `#E2725B`, saffron `#F4A261`, deep green `#2A9D8F`, charcoal `#264653`. Rounded friendly type (Nunito via Google Fonts). Warm 3D lighting, soft shadows, sparkles on selection.

**Menu source of truth (extracted from assets/PAGE-1.jpg & PAGE-2.jpg, verified by zooming):** see Task 2 `menu.json` — prices double-checked: Pizza au poulet 45/40, Super Thon 50/45, Quatre saisons 65/60, Florance 55/50, Anchouba 55/50, Eau 7/10, Gazeuse 13/20, Orangina 13. Pizzas/Pâtes/Lasagne have *Sur place / Emporté* prices (default **Emporté** — the team takes away). Boissons have *Petite/Grande*. Pâtes have a pasta-type choice (Spaghetti/Tagliatelle/Penne). Couscous is Friday-only.

---

## File structure

```
package.json, vite.config.js, vitest.config.js, .env, .gitignore, README.md
data/menu.json                  # editable menu (names, prices, descriptions)
prisma/schema.prisma            # TeamMember, DailyOrder, OrderItem, MemberDayStatus, Setting
server/index.js                 # entry: http server + socket.io wiring + static serving
server/app.js                   # createApp(): Express REST API (testable, no sockets)
server/db.js                    # PrismaClient singleton
server/menu.js                  # loads/validates menu.json, item lookup, price resolution
server/orders.js                # day lifecycle, state assembly, mutations
server/format.js                # WhatsApp/copy message formatting (pure)
server/__tests__/menu.test.js
server/__tests__/orders.test.js
server/__tests__/format.test.js
server/__tests__/api.test.js
client/index.html
client/src/main.jsx, App.jsx, styles.css
client/src/api.js               # REST calls
client/src/socket.js            # socket.io-client + reconnect handling
client/src/store.js             # zustand: menu, dayState, me, ui state
client/src/components/NamePicker.jsx
client/src/components/Dashboard.jsx   # live board + X/N status + totals
client/src/components/Tray.jsx        # my selection, confirm button
client/src/components/ItemModal.jsx   # variant/pasta/qty/note picker
client/src/components/ExportBar.jsx   # WhatsApp + Copy buttons
client/src/components/Settings.jsx    # team CRUD + restaurant number
client/src/three/Scene.jsx            # canvas, lights, environment
client/src/three/MenuBook.jsx         # book, page flip state machine
client/src/three/BookPage.jsx         # one page mesh + Html dish list
```

---

### Task 1: Project scaffolding

**Files:** Create `package.json`, `.gitignore`, `.env`, `vite.config.js`, `vitest.config.js`, `client/index.html`

- [ ] **Step 1: Write `.gitignore`**

```
node_modules/
client/dist/
*.db
*.db-journal
.tmp-ocr/
.env
```

- [ ] **Step 2: Write `package.json`** (single package, ESM)

```json
{
  "name": "lhbib-lunch",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "concurrently -n srv,web \"node server/index.js\" \"vite\"",
    "build": "vite build",
    "start": "node server/index.js",
    "db:push": "prisma db push",
    "test": "cross-env DATABASE_URL=file:./test.db prisma db push --force-reset --skip-generate && cross-env DATABASE_URL=file:./test.db vitest run"
  }
}
```

- [ ] **Step 3: Install dependencies**

```powershell
npm i express socket.io @prisma/client zustand react react-dom three @react-three/fiber @react-three/drei socket.io-client
npm i -D prisma vite @vitejs/plugin-react vitest supertest cross-env concurrently
```

- [ ] **Step 4: Write `.env`** → `DATABASE_URL="file:./dev.db"` (prisma resolves relative to prisma/)

- [ ] **Step 5: Write `vite.config.js`** — root `client/`, proxy API+websocket to :3001

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: 'client',
  plugins: [react()],
  build: { outDir: 'dist' },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': 'http://localhost:3001',
      '/socket.io': { target: 'http://localhost:3001', ws: true },
    },
  },
})
```

- [ ] **Step 6: Write `vitest.config.js`**

```js
import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { include: ['server/__tests__/**/*.test.js'], environment: 'node', fileParallelism: false } })
```

- [ ] **Step 7: Commit** `chore: scaffold project`

---

### Task 2: Menu data + loader (TDD)

**Files:** Create `data/menu.json`, `server/menu.js`, `server/__tests__/menu.test.js`

- [ ] **Step 1: Write `data/menu.json`** — full extracted menu. Structure: category `{id, name, emoji, note?, choice?}`; item `{id, name, desc?, price}` OR `{id, name, desc?, variants: {label, default, options: [{key, label, price}]}}`. `choice` on Pâtes = pasta type. (Full JSON content is authoritative in this plan — see repository file; includes: 8 salades 25–80dh; 18 pizzas sur place/emporté 30/25–85/80; 4 sandwichs + frites; 4 plats grillés; couscous vendredi viande 70/poulet 55; 8 pâtes sur place/emporté avec choix spaghetti/tagliatelle/penne; lasagne 65/60; 3 boissons petite/grande; 4 jus; 2 desserts.)

- [ ] **Step 2: Write failing test `server/__tests__/menu.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { loadMenu, findItem, resolvePrice } from '../menu.js'

describe('menu', () => {
  const menu = loadMenu()
  it('loads categories with items', () => {
    expect(menu.categories.length).toBeGreaterThanOrEqual(9)
    expect(findItem(menu, 'pizza-thon').name).toBe('Pizza Thon')
  })
  it('resolves simple price', () => {
    expect(resolvePrice(menu, { menuItemId: 'salade-marocaine' })).toBe(25)
  })
  it('resolves variant price', () => {
    expect(resolvePrice(menu, { menuItemId: 'pizza-thon', variantKey: 'emporte' })).toBe(35)
    expect(resolvePrice(menu, { menuItemId: 'pizza-thon', variantKey: 'surplace' })).toBe(40)
  })
  it('falls back to default variant when key missing', () => {
    expect(resolvePrice(menu, { menuItemId: 'pizza-thon' })).toBe(35)
  })
  it('throws for unknown item', () => {
    expect(() => resolvePrice(menu, { menuItemId: 'nope' })).toThrow()
  })
})
```

- [ ] **Step 3: Run** `npm test` → FAIL (menu.js missing)
- [ ] **Step 4: Implement `server/menu.js`**

```js
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const menuPath = fileURLToPath(new URL('../data/menu.json', import.meta.url))

export function loadMenu() {
  return JSON.parse(readFileSync(menuPath, 'utf-8'))
}

export function findItem(menu, id) {
  for (const cat of menu.categories) {
    const item = cat.items.find((i) => i.id === id)
    if (item) return { ...item, category: cat }
  }
  return null
}

export function resolvePrice(menu, { menuItemId, variantKey }) {
  const item = findItem(menu, menuItemId)
  if (!item) throw new Error(`Unknown menu item: ${menuItemId}`)
  if (item.price != null) return item.price
  const opts = item.variants.options
  const opt = opts.find((o) => o.key === variantKey) ?? opts.find((o) => o.key === item.variants.default) ?? opts[0]
  return opt.price
}
```

- [ ] **Step 5: Run** `npm test` → PASS. **Step 6: Commit** `feat: menu data and loader`

---

### Task 3: Prisma schema + DB

**Files:** Create `prisma/schema.prisma`, `server/db.js`

- [ ] **Step 1: Write `prisma/schema.prisma`**

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "sqlite"  url = env("DATABASE_URL") }

model TeamMember {
  id       Int               @id @default(autoincrement())
  name     String
  color    String
  active   Boolean           @default(true)
  items    OrderItem[]
  statuses MemberDayStatus[]
}

model DailyOrder {
  id       Int               @id @default(autoincrement())
  date     String            @unique
  items    OrderItem[]
  statuses MemberDayStatus[]
}

model OrderItem {
  id           Int        @id @default(autoincrement())
  dailyOrder   DailyOrder @relation(fields: [dailyOrderId], references: [id], onDelete: Cascade)
  dailyOrderId Int
  member       TeamMember @relation(fields: [memberId], references: [id], onDelete: Cascade)
  memberId     Int
  menuItemId   String
  variantKey   String?
  pastaType    String?
  quantity     Int        @default(1)
  note         String?
}

model MemberDayStatus {
  id           Int        @id @default(autoincrement())
  dailyOrder   DailyOrder @relation(fields: [dailyOrderId], references: [id], onDelete: Cascade)
  dailyOrderId Int
  member       TeamMember @relation(fields: [memberId], references: [id], onDelete: Cascade)
  memberId     Int
  confirmedAt  DateTime?
  @@unique([dailyOrderId, memberId])
}

model Setting {
  key   String @id
  value String
}
```

- [ ] **Step 2: Write `server/db.js`**

```js
import { PrismaClient } from '@prisma/client'
export const prisma = new PrismaClient()
```

- [ ] **Step 3: Run** `npm run db:push` → creates `prisma/dev.db`. **Step 4: Commit** `feat: prisma schema`

---

### Task 4: Order/day service (TDD)

**Files:** Create `server/orders.js`, `server/__tests__/orders.test.js`

API of the module (all take a `prisma` instance — testable against test.db):
`todayKey()`, `getOrCreateDay(prisma, dateKey?)`, `getDayState(prisma, menu, dateKey?)`, `addItem(prisma, data)`, `updateItem(prisma, id, data)`, `removeItem(prisma, id)`, `setConfirmed(prisma, {memberId, confirmed, dateKey?})`.

`getDayState` returns:
```js
{ date, members: [{id, name, color, active, confirmed}],
  items: [{id, memberId, menuItemId, name, variantKey, variantLabel, pastaType, quantity, note, unitPrice, lineTotal}],
  confirmedCount, activeCount, total }
```

- [ ] **Step 1: Write failing tests** covering: day auto-creation & idempotency; addItem then state contains enriched item with resolved price and lineTotal = unitPrice×qty; setConfirmed flips member status and confirmedCount; removeItem; total aggregates all members. (Test code in repo file; uses `beforeEach` truncating all tables.)
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement `server/orders.js`** — key logic:

```js
import { findItem, resolvePrice } from './menu.js'

export function todayKey(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export async function getOrCreateDay(prisma, dateKey = todayKey()) {
  return prisma.dailyOrder.upsert({ where: { date: dateKey }, update: {}, create: { date: dateKey } })
}

export async function getDayState(prisma, menu, dateKey = todayKey()) {
  const day = await getOrCreateDay(prisma, dateKey)
  const [members, items, statuses] = await Promise.all([
    prisma.teamMember.findMany({ orderBy: { id: 'asc' } }),
    prisma.orderItem.findMany({ where: { dailyOrderId: day.id }, orderBy: { id: 'asc' } }),
    prisma.memberDayStatus.findMany({ where: { dailyOrderId: day.id } }),
  ])
  const confirmedIds = new Set(statuses.filter((s) => s.confirmedAt).map((s) => s.memberId))
  const enriched = items.map((it) => {
    const menuItem = findItem(menu, it.menuItemId)
    const unitPrice = resolvePrice(menu, it)
    const variantLabel = menuItem?.variants?.options.find((o) => o.key === it.variantKey)?.label ?? null
    return { ...it, name: menuItem?.name ?? it.menuItemId, variantLabel, unitPrice, lineTotal: unitPrice * it.quantity }
  })
  const activeMembers = members.filter((m) => m.active)
  return {
    date: dateKey,
    members: members.map((m) => ({ ...m, confirmed: confirmedIds.has(m.id) })),
    items: enriched,
    confirmedCount: activeMembers.filter((m) => confirmedIds.has(m.id)).length,
    activeCount: activeMembers.length,
    total: enriched.reduce((s, i) => s + i.lineTotal, 0),
  }
}

export async function addItem(prisma, { memberId, menuItemId, variantKey = null, pastaType = null, quantity = 1, note = null, dateKey }) {
  const day = await getOrCreateDay(prisma, dateKey)
  return prisma.orderItem.create({ data: { dailyOrderId: day.id, memberId, menuItemId, variantKey, pastaType, quantity, note } })
}

export async function updateItem(prisma, id, { quantity, note }) {
  return prisma.orderItem.update({ where: { id }, data: { ...(quantity != null && { quantity }), ...(note !== undefined && { note }) } })
}

export async function removeItem(prisma, id) {
  return prisma.orderItem.delete({ where: { id } })
}

export async function setConfirmed(prisma, { memberId, confirmed, dateKey }) {
  const day = await getOrCreateDay(prisma, dateKey)
  return prisma.memberDayStatus.upsert({
    where: { dailyOrderId_memberId: { dailyOrderId: day.id, memberId } },
    update: { confirmedAt: confirmed ? new Date() : null },
    create: { dailyOrderId: day.id, memberId, confirmedAt: confirmed ? new Date() : null },
  })
}
```

- [ ] **Step 4: Run → PASS. Step 5: Commit** `feat: order day service`

---

### Task 5: Message formatting (TDD)

**Files:** Create `server/format.js`, `server/__tests__/format.test.js`

- [ ] **Step 1: Failing tests:** groups identical lines (same item+variant+pasta+note) with summed qty; pasta type shown as `Carbonara (Tagliatelle)`; variant `(Emporté)` shown only for variant items; note appended `— sans olives`; total line; French weekday date header; per-person recap section.
- [ ] **Step 2: Implement `server/format.js`**

```js
export function formatOrderMessage(state) {
  const day = new Date(state.date + 'T12:00:00')
  const dateStr = day.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: '2-digit' })
  const lines = [`🍽️ Commande LHBIB — ${dateStr}`, '']
  const groups = new Map()
  for (const it of state.items) {
    const key = [it.menuItemId, it.variantKey, it.pastaType, it.note].join('|')
    const g = groups.get(key) ?? { ...it, quantity: 0 }
    g.quantity += it.quantity
    groups.set(key, g)
  }
  for (const g of groups.values()) {
    let label = g.name
    if (g.pastaType) label += ` (${g.pastaType})`
    if (g.variantLabel) label += ` (${g.variantLabel})`
    if (g.note) label += ` — ${g.note}`
    lines.push(`${g.quantity}× ${label}`)
  }
  lines.push('', `💰 Total : ${state.total} dh`, '')
  const byMember = new Map(state.members.map((m) => [m.id, []]))
  for (const it of state.items) byMember.get(it.memberId)?.push(it)
  const recap = state.members
    .filter((m) => (byMember.get(m.id) ?? []).length)
    .map((m) => `• ${m.name} : ` + byMember.get(m.id).map((i) => `${i.quantity > 1 ? i.quantity + '× ' : ''}${i.name}`).join(', '))
  if (recap.length) lines.push('👥 Détail :', ...recap)
  return lines.join('\n').trim()
}
```

- [ ] **Step 3: PASS → Commit** `feat: whatsapp message formatting`

---

### Task 6: REST API (TDD with Supertest)

**Files:** Create `server/app.js`, `server/__tests__/api.test.js`

`createApp({ prisma, menu, onChange })` — Express app with `express.json()`. After every successful mutation it calls `onChange()` (the socket layer will broadcast fresh state). Routes:

| Method/Path | Body | Result |
|---|---|---|
| GET `/api/menu` | — | menu.json |
| GET `/api/state` | — | `getDayState` |
| POST `/api/items` | `{memberId, menuItemId, variantKey?, pastaType?, quantity?, note?}` | 201, state |
| PATCH `/api/items/:id` | `{quantity?, note?}` | state |
| DELETE `/api/items/:id` | — | state |
| POST `/api/members/:id/confirm` | `{confirmed}` | state |
| GET/POST `/api/members`, PATCH/DELETE `/api/members/:id` | `{name?, color?, active?}` | members/state |
| GET `/api/settings` / PATCH `/api/settings` | `{whatsappNumber?}` | settings object |
| GET `/api/message` | — | `{text}` from `formatOrderMessage` |

Validation: 400 on missing memberId/menuItemId, unknown menuItemId, quantity < 1; 404 on missing item id. Errors as `{error}` JSON. Static serving + SPA fallback for `client/dist` happens in `index.js`, not here.

- [ ] **Step 1: Failing supertest tests** for: add→state enriched; invalid item → 400; confirm flow; member CRUD; settings roundtrip; `/api/message` contains item name and total.
- [ ] **Step 2: Implement.** Each mutation handler ends with `const state = await getDayState(prisma, menu); onChange?.(state); res.json(state)`.
- [ ] **Step 3: PASS → Commit** `feat: REST API`

---

### Task 7: Server entry + Socket.IO + static serving

**Files:** Create `server/index.js`

- [ ] **Step 1: Implement**

```js
import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
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
  app.get(/^(?!\/api|\/socket\.io).*/, (_req, res) => res.sendFile(dist + '/index.html'))
}

const PORT = process.env.PORT ?? 3001
httpServer.listen(PORT, () => console.log(`LHBIB Lunch server on http://localhost:${PORT}`))
```

- [ ] **Step 2: Smoke test:** `node server/index.js` + `curl http://localhost:3001/api/state` → JSON. **Commit** `feat: server entry with socket.io`

---

### Task 8: Client foundation (store, api, socket, shell)

**Files:** Create `client/index.html`, `client/src/main.jsx`, `client/src/styles.css`, `client/src/api.js`, `client/src/socket.js`, `client/src/store.js`, `client/src/App.jsx`

- `index.html`: viewport meta, Nunito font link, `#root`, dark-on-cream CSS variables.
- `api.js`: thin fetch helpers (`getMenu`, `getState`, `addItem`, `patchItem`, `deleteItem`, `confirm`, members CRUD, settings, `getMessage`).
- `socket.js`: `io()` with autoreconnect; exposes `onState(cb)` and `onConnectionChange(cb)`; on reconnect, refetch `/api/state` (no lost updates).
- `store.js` (zustand): `{menu, state, me, screen ('pick'|'menu'|'settings'), modalItem, connected}` + actions; `me` persisted to `localStorage('lhbib-me')`.
- `App.jsx`: loads menu+state on mount, subscribes to socket, routes between `NamePicker`, main 3D view (Scene + overlays: Dashboard toggle, Tray, ExportBar), `Settings`. Shows "Reconnexion…" banner when `!connected`.

- [ ] Steps: implement each file, `npm run dev`, verify app boots showing NamePicker with members from API. **Commit** `feat: client foundation`

---

### Task 9: Name picker + live dashboard

**Files:** Create `client/src/components/NamePicker.jsx`, `client/src/components/Dashboard.jsx`

- NamePicker: big friendly cards, one per active member (avatar circle with initial + member color), "C'est moi !" selection → store + localStorage. Link to Settings ("Gérer l'équipe") if list is empty.
- Dashboard: slide-in panel. Header `🍽️ {confirmedCount}/{activeCount} ont choisi`; member rows (✅ if confirmed, ⏳ otherwise) with their items + line totals; footer grand total. Updates live via socket state.
- [ ] Verify with two browser windows: changes in one appear in the other. **Commit** `feat: name picker and live dashboard`

---

### Task 10: 3D scene + menu book

**Files:** Create `client/src/three/Scene.jsx`, `client/src/three/MenuBook.jsx`, `client/src/three/BookPage.jsx`

Design:
- `Scene`: `<Canvas shadows camera={{position:[0,2.2,4.2], fov:42}}>`; warm hemisphere + directional light with shadow; cream fog/background; large soft-shadow ground (terracotta tinted); `<Sparkles>` ambience; gentle float on the book group.
- `MenuBook`: spread model — `spreadIndex` (0..N). Left page = category art (emoji, big name, fun blob shapes in palette colors); right page = dish list. Page flip: a dedicated "turning page" plane whose `rotation.y` animates `0 → -π` (ease in/out, ~0.6s, slight y-arc lift) on navigation; content swaps at mid-flip. Navigation: 3D arrow buttons on book edges + horizontal swipe/drag on canvas + category tab strip (DOM) for direct jump.
- `BookPage`: rounded-edge box (thin) as paper with subtle roughness; `<Html transform occlude distanceFactor>` anchored to the face renders the DOM dish list: each row = name, desc (small), price chip(s); tap → `store.openModal(item)` with a sparkle burst + scale pulse on the row.
- Cover state: before any interaction, the closed book shows "LHBIB 🍕 Le menu" and opens with an animation on first tap.
- Mobile: book scales to viewport (`useThree` viewport), portrait shows one page at a time (spread collapses to single page mode when aspect < 0.8).
- [ ] Verify on desktop + phone-sized window: flipping is smooth (60fps), items clickable on both. **Commit** `feat: 3D menu book`

---

### Task 11: Item modal, tray, confirm flow

**Files:** Create `client/src/components/ItemModal.jsx`, `client/src/components/Tray.jsx`

- ItemModal (DOM overlay, bouncy entrance): variant segmented control (default **Emporté**), pasta-type pills for Pâtes (Spaghetti/Tagliatelle/Penne, required), quantity stepper, note input ("sans olives…"), price preview, "Ajouter 🛒". POST `/api/items`.
- Tray: floating bottom bar with my items (qty editable via PATCH, ✕ via DELETE), my total, and the big **« Je confirme ! ✅ »** button → POST confirm; once confirmed shows "Modifié ? Reconfirme" if items change (unconfirm on edit). Item-added feedback: tray badge bounce.
- [ ] Verify full flow for one user end-to-end. **Commit** `feat: selection and confirm flow`

---

### Task 12: Export bar + settings

**Files:** Create `client/src/components/ExportBar.jsx`, `client/src/components/Settings.jsx`

- ExportBar (visible to all once `confirmedCount > 0`): **📲 WhatsApp** → `GET /api/message`, open `https://wa.me/<number>?text=<encoded>` (or `https://wa.me/?text=` when no number configured); **📋 Copier** → `navigator.clipboard.writeText` + "Copié ✅" toast.
- Settings: list/add/rename/deactivate/delete members (color auto-assigned from palette cycle), WhatsApp number field (international format hint `2126…`), back button.
- [ ] Verify: copy produces the formatted French message; wa.me link opens with prefilled text. **Commit** `feat: export and settings`

---

### Task 13: Production build, README, polish pass

- [ ] `npm run build` then `npm start` → app served fully from :3001 (test with Vite dev server stopped).
- [ ] README.md: setup (`npm i`, `npm run db:push`, `npm run build`, `npm start`), tunnel guidance (stable-URL named tunnel recommended; point it at port 3001), menu editing (`data/menu.json`), daily reset behavior.
- [ ] Polish pass: loading screen with animated plate emoji; favicon/title; disable pinch-zoom; safe-area insets.
- [ ] Run `npm test` (all green) + manual two-device check. **Commit** `feat: production build and docs`

---

## Self-review notes

- Spec coverage: real-time sync (T7/T8), fixed-team status (T4/T9), 3D book (T10), variant/pasta/qty/note (T2/T4/T11), WhatsApp+copy (T5/T12), daily reset (T4 `todayKey`), settings (T12), palette (T8/T10), tunnel/self-host (T7/T13). ✔
- Types consistent: `variantKey/pastaType/quantity/note` naming used across schema, service, API, client. ✔
- Out of scope (per spec): auth, history UI, payment split. ✔
