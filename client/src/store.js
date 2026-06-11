import { create } from 'zustand'

const ME_KEY = 'lhbib-me'

export const useStore = create((set, get) => ({
  menu: null,
  dayState: null,
  meId: Number(localStorage.getItem(ME_KEY)) || null,
  screen: 'menu', // 'menu' | 'settings'
  panelOpen: false,
  modalItem: null, // { item, category }
  connected: false,
  toast: null,
  trayBump: 0,

  setMenu: (menu) => set({ menu }),
  setDayState: (dayState) => set({ dayState }),
  setConnected: (connected) => set({ connected }),

  setMe: (id) => {
    localStorage.setItem(ME_KEY, String(id))
    set({ meId: id })
  },
  clearMe: () => {
    localStorage.removeItem(ME_KEY)
    set({ meId: null })
  },

  // -1 = couverture du livre, >= 0 = index de catégorie
  catIndex: -1,
  setCatIndex: (i) => set({ catIndex: i }),

  setScreen: (screen) => set({ screen }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  openModal: (item, category) => set({ modalItem: { item, category } }),
  closeModal: () => set({ modalItem: null }),
  bumpTray: () => set((s) => ({ trayBump: s.trayBump + 1 })),

  showToast: (msg) => {
    set({ toast: msg })
    clearTimeout(get()._toastTimer)
    const _toastTimer = setTimeout(() => set({ toast: null }), 2200)
    set({ _toastTimer })
  },
}))

export const selectMe = (s) => s.dayState?.members.find((m) => m.id === s.meId) ?? null
export const selectMyItems = (s) => s.dayState?.items.filter((i) => i.memberId === s.meId) ?? []
