import { api } from './api.js'
import { useStore } from './store.js'

// L'hébergement est serverless : pas de WebSocket permanent possible. On interroge donc
// le serveur à intervalle régulier, et uniquement quand l'onglet est visible — sinon dix
// téléphones ouverts toute la journée épuiseraient le quota d'invocations.
const INTERVALLE_MS = 5000

export function startSync() {
  let timer = null
  let enVol = false

  async function rafraichir() {
    if (enVol) return // une requête suffit, même si l'onglet revient au premier plan pendant qu'elle vole
    enVol = true
    try {
      useStore.getState().setDayState(await api.getState())
      useStore.getState().setConnected(true)
    } catch {
      useStore.getState().setConnected(false)
    } finally {
      enVol = false
    }
  }

  function arreter() {
    clearInterval(timer)
    timer = null
  }

  function surVisibilite() {
    arreter()
    if (document.visibilityState !== 'visible') return
    rafraichir() // rattrape ce qui s'est passé pendant l'absence
    timer = setInterval(rafraichir, INTERVALLE_MS)
  }

  document.addEventListener('visibilitychange', surVisibilite)
  surVisibilite()

  return () => {
    arreter()
    document.removeEventListener('visibilitychange', surVisibilite)
  }
}
