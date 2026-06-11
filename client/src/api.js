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

export const api = {
  getMenu: () => req('GET', '/api/menu'),
  getState: () => req('GET', '/api/state'),
  addItem: (data) => req('POST', '/api/items', data),
  patchItem: (id, data) => req('PATCH', `/api/items/${id}`, data),
  deleteItem: (id) => req('DELETE', `/api/items/${id}`),
  confirm: (memberId, confirmed) => req('POST', `/api/members/${memberId}/confirm`, { confirmed }),
  addMember: (name) => req('POST', '/api/members', { name }),
  patchMember: (id, data) => req('PATCH', `/api/members/${id}`, data),
  deleteMember: (id) => req('DELETE', `/api/members/${id}`),
  getSettings: () => req('GET', '/api/settings'),
  patchSettings: (data) => req('PATCH', '/api/settings', data),
  getMessage: () => req('GET', '/api/message'),
}
