# LHBIB Lunch — Design Spec

**Date:** 2026-06-11
**Status:** Approved by user

## Purpose

A fun, beautiful 3D web app so the team stops collecting lunch orders one-by-one over chat. Everyone opens the app on their own device, picks their dishes from a 3D flip-book version of the Lhbib restaurant menu, and the person going downstairs sends the aggregated order to the restaurant via WhatsApp or copies it to clipboard.

## Decisions (validated with user)

| Topic | Decision |
|---|---|
| Usage mode | Each person on their own device, real-time sync |
| 3D concept | 3D menu book with page-flip animation |
| Team management | Fixed team list with "X/N have chosen" status; editable in a settings page |
| Hosting | Self-hosted Node server on user's always-on PC, exposed via tunnel (single port) |
| Database | Prisma + SQLite |
| Export | WhatsApp button (prefilled wa.me message) + Copy-to-clipboard button |
| Visual style | NOT the black/red of the physical menu. Warm "modern Moroccan bistro" palette: warm cream background, terracotta + saffron accents, deep green secondary, charcoal text. Joyful and appetizing. |

## Architecture

One Node.js server, one port, one tunnel.

```
[Browser: React + react-three-fiber (Vite build)]
        │  HTTP (REST) + Socket.IO (realtime)
[Node.js: Express + Socket.IO]
        │  Prisma
[SQLite file]          [menu.json — editable, not in DB]
```

- **Frontend:** Vite + React + react-three-fiber + drei. Served as static files by the same Express server.
- **Backend:** Express REST API for reads/writes; Socket.IO broadcasts state changes to all connected clients.
- **Menu data:** `menu.json` extracted from the menu photos (`assets/PAGE-1.jpg`, `assets/PAGE-2.jpg`). Kept as JSON (not DB) so OCR mistakes in names/prices are trivially editable. Items reference categories; some items have two sizes (pizzas, pâtes) and pâtes have a pasta-type choice (spaghetti/tagliatelle/penne).

## Data model (Prisma / SQLite)

- `TeamMember`: id, name, avatarColor, active (bool)
- `DailyOrder`: id, date (unique, YYYY-MM-DD) — auto-created on first access each day; history preserved
- `OrderItem`: id, dailyOrderId, teamMemberId, menuItemId (string key into menu.json), sizeKey (nullable), pastaType (nullable), quantity, note (nullable)

A member's order is "confirmed" when they tap confirm; store `confirmedAt` on a join table or as a `MemberDayStatus` (memberId + dailyOrderId + confirmedAt). Status board counts confirmed members vs active members.

## User flow

1. Open app → pick your name from the team list (persisted in localStorage).
2. Browse the 3D menu book: pages = categories (Salades, Pizzas, Sandwiches, Plats grillés, Pâtes, Lasagne, Boissons, Jus, Desserts). Swipe/drag to flip pages.
3. Tap a dish → fun "jump to tray" animation → size/pasta-type/quantity/note picker when applicable.
4. Confirm order → live dashboard updates for everyone: who ordered what, "4/6 ont choisi", total in dh.
5. Final actions: **WhatsApp** (opens wa.me with prefilled French order summary; restaurant number configurable in settings, otherwise contact picker) and **Copier** (clipboard).
6. Settings page: add/remove/rename team members, set restaurant WhatsApp number.
7. New day → fresh empty order automatically.

## Realtime & error handling

- Socket.IO with automatic reconnection; UI shows a "reconnexion…" banner when disconnected.
- All writes go through REST endpoints which then broadcast the updated day-state; clients also refetch full state on reconnect (no lost updates).
- Server is resilient to concurrent updates (single SQLite writer via Prisma).
- Tunnel note: recommend a stable-URL tunnel (Cloudflare named tunnel or ngrok static domain) so the team link never changes.

## Visual design

- Palette: warm cream `#FFF8F0` background, terracotta `#E2725B`, saffron `#F4A261`, deep green `#2A9D8F`, charcoal `#264653`. Rounded, friendly typography. Warm lighting in the 3D scene, soft shadows, subtle particles/sparkles on selection.
- Mobile-first: the book fits portrait screens; touch gestures for page flips; UI overlay (tray, status) as DOM on top of the canvas.

## Testing

- Vitest on server logic: daily-order lifecycle, aggregation, WhatsApp message formatting, team CRUD.
- 3D/visual verified manually in browser.

## Out of scope (YAGNI)

- Authentication (team trusts each other; name picking is enough)
- Payment splitting
- Order history UI (data is kept in DB but no screen for it yet)
- Sending WhatsApp messages automatically via API (manual wa.me link only)

## Open inputs (can arrive during implementation)

- Team member first names (seed data; editable in settings anyway)
- Lhbib's WhatsApp number (configurable in settings; optional)
