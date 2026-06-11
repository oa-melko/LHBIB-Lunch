import { findItem, resolvePrice } from './menu.js'

export function todayKey(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export async function getOrCreateDay(prisma, dateKey = todayKey()) {
  return prisma.dailyOrder.upsert({
    where: { date: dateKey },
    update: {},
    create: { date: dateKey },
  })
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
    const variantLabel =
      menuItem?.variants?.options.find((o) => o.key === it.variantKey)?.label ?? null
    return {
      ...it,
      name: menuItem?.name ?? it.menuItemId,
      variantLabel,
      unitPrice,
      lineTotal: unitPrice * it.quantity,
    }
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

export async function addItem(
  prisma,
  { memberId, menuItemId, variantKey = null, pastaType = null, quantity = 1, note = null, dateKey }
) {
  const day = await getOrCreateDay(prisma, dateKey)
  return prisma.orderItem.create({
    data: { dailyOrderId: day.id, memberId, menuItemId, variantKey, pastaType, quantity, note },
  })
}

export async function updateItem(prisma, id, { quantity, note }) {
  return prisma.orderItem.update({
    where: { id },
    data: {
      ...(quantity != null && { quantity }),
      ...(note !== undefined && { note }),
    },
  })
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
