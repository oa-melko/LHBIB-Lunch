import { useStore } from './store.js'

async function req(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`)
  return data
}

// Les routes qui modifient la commande renvoient l'état complet de la journée.
// On l'applique aussitôt : celui qui agit voit son geste sans attendre le prochain
// rafraîchissement, le polling ne sert qu'à voir les gestes des autres.
function applique(state) {
  useStore.getState().setDayState(state)
  return state
}

export const api = {
  getMenu: () => req('GET', '/api/menu'),
  getState: () => req('GET', '/api/state'),
  addItem: (data) => req('POST', '/api/items', data).then(applique),
  patchItem: (id, data) => req('PATCH', `/api/items/${id}`, data).then(applique),
  deleteItem: (id) => req('DELETE', `/api/items/${id}`).then(applique),
  confirm: (memberId, confirmed) =>
    req('POST', `/api/members/${memberId}/confirm`, { confirmed }).then(applique),
  addMember: (name) => req('POST', '/api/members', { name }).then(applique),
  patchMember: (id, data) => req('PATCH', `/api/members/${id}`, data).then(applique),
  deleteMember: (id) => req('DELETE', `/api/members/${id}`).then(applique),
  getSettings: () => req('GET', '/api/settings'),
  patchSettings: (data) => req('PATCH', '/api/settings', data),
  getMessage: () => req('GET', '/api/message'),
}
