import { io } from 'socket.io-client'
import { api } from './api.js'
import { useStore } from './store.js'

export function connectSocket() {
  const socket = io()

  socket.on('state', (state) => useStore.getState().setDayState(state))

  socket.on('connect', async () => {
    useStore.getState().setConnected(true)
    // refetch on (re)connect so no update is ever lost
    try {
      useStore.getState().setDayState(await api.getState())
    } catch {
      /* server will push on next change */
    }
  })

  socket.on('disconnect', () => useStore.getState().setConnected(false))

  return socket
}
