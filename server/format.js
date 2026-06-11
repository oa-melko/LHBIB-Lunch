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
    .filter((m) => (byMember.get(m.id) ?? []).length > 0)
    .map(
      (m) =>
        `• ${m.name} : ` +
        byMember
          .get(m.id)
          .map((i) => `${i.quantity > 1 ? i.quantity + '× ' : ''}${i.name}`)
          .join(', ')
    )
  if (recap.length) lines.push('👥 Détail :', ...recap)

  return lines.join('\n').trim()
}
