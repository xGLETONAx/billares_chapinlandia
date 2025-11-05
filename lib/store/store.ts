import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { mockProductos, mockSesionesAbiertas } from "./mock-data"
import type { AppState, Sesion, Payment, Producto, ChargeDraft, ProductoItem } from "./types"

const STORE_VERSION = 2

interface StoreActions {
  // Sesiones
  addSesion: (sesion: Sesion) => void
  updateSesion: (id: string, updates: Partial<Sesion>) => void
  closeSesion: (
    id: string,
    frozenElapsed: string,
    frozenTotals: { importe_juego: number; subtotal_productos: number; total_bruto: number },
  ) => void
  getSesion: (id: string) => Sesion | undefined

  // NUEVO: freeze / unfreeze
  freezeSesion: (id: string, hhmm: string) => void
  unfreezeSesion: (id: string) => void

  // Drafts
  createChargeDraft: (draft: ChargeDraft) => void
  getChargeDraft: (mesaId: string) => ChargeDraft | undefined
  deleteChargeDraft: (mesaId: string) => void
  updateChargeDraft: (mesaId: string, updates: Partial<ChargeDraft>) => void

  // Payments
  addPayment: (payment: Payment) => void
  getPayments: (filters?: { dateStart?: Date; dateEnd?: Date; tipo_origen?: string }) => Payment[]

  // Productos
  getProducto: (id: string) => Producto | undefined

  // Utilities
  clearAll: () => void

  // NUEVO: Sesiones “open”
  openSesion: (sesion: Sesion) => void

  // NUEVO: Consumos en sesión
  addConsumoToSesion: (sesionId: string, item: ProductoItem) => void
  removeConsumoFromSesion: (sesionId: string, productoId: string) => void
  setSesionConsumos: (sesionId: string, items: ProductoItem[]) => void
}

const initialState: AppState = {
  sesiones: [],
  payments: [],
  productos: [],
  chargeDrafts: {},
}

export const useStore = create<AppState & StoreActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Sesiones
      addSesion: (sesion) =>
        set((state) => ({
          sesiones: [...state.sesiones, sesion],
        })),

      updateSesion: (id, updates) =>
        set((state) => ({
          sesiones: state.sesiones.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),

              // Abrir/crear una sesión marcada como open
      openSesion: (sesion) =>
  set((state) => {
    const existe = state.sesiones.some((s) => s.id === sesion.id)

    const sanitize = (base: Sesion): Sesion => ({
      ...base,
      estado: "open",
      // 🔽 limpiar cualquier resto de la sesión anterior
      isFrozen: false,
      frozenElapsed: undefined,
      frozenAt: undefined,
      closedAt: undefined,
      frozenTotals: undefined,
    })

    const sesiones = existe
      ? state.sesiones.map((s) =>
          s.id === sesion.id
            ? sanitize({ ...s, ...sesion }) // sobreescribe y limpia flags
            : s,
        )
      : [...state.sesiones, sanitize({ ...sesion })]

    return { sesiones }
  }),

      // Consumir/agregar línea
addConsumoToSesion: (sesionId, item) =>
  set((state) => ({
    sesiones: state.sesiones.map((s) =>
      s.id === sesionId
        ? { ...s, consumos: [...(s.consumos ?? []), item] }
        : s
    ),
  })),

// Eliminar línea por producto_id
removeConsumoFromSesion: (sesionId, productoId) =>
  set((state) => ({
    sesiones: state.sesiones.map((s) =>
      s.id === sesionId
        ? { ...s, consumos: (s.consumos ?? []).filter((it) => it.producto_id !== productoId) }
        : s
    ),
  })),

// Reemplazar todas las líneas (útil para correcciones masivas)
setSesionConsumos: (sesionId, items) =>
  set((state) => ({
    sesiones: state.sesiones.map((s) =>
      s.id === sesionId
        ? { ...s, consumos: items }
        : s
    ),
  })),

// --- FREEZE / UNFREEZE mientras la sesión está OPEN ---
freezeSesion: (id, hhmm) =>
  set((state) => ({
    sesiones: state.sesiones.map((s) =>
      s.id === id && s.estado === "open"
        ? { ...s, isFrozen: true, frozenElapsed: hhmm, frozenAt: new Date().toISOString() }
        : s
    ),
  })),

unfreezeSesion: (id) =>
  set((state) => ({
    sesiones: state.sesiones.map((s) =>
      s.id === id && s.estado === "open"
        ? { ...s, isFrozen: false, frozenElapsed: undefined, frozenAt: undefined }
        : s
    ),
  })),

// Cerrar sesión (flujo de cierre definitivo)
closeSesion: (id, frozenElapsed, frozenTotals) =>
  set((state) => ({
    sesiones: state.sesiones.map((s) =>
      s.id === id
        ? {
            ...s,
            estado: "closed" as const,
            closedAt: new Date().toISOString(),
            // 🔽 aseguramos que no queda residuo de freeze
            isFrozen: false,
            frozenAt: undefined,
            frozenElapsed,
            frozenTotals,
          }
        : s,
    ),
  })),

      getSesion: (id) => {
        return get().sesiones.find((s) => s.id === id)
      },

      createChargeDraft: (draft) =>
        set((state) => ({
          chargeDrafts: {
            ...state.chargeDrafts,
            [draft.mesaId]: draft,
          },
        })),

      getChargeDraft: (mesaId) => {
        return get().chargeDrafts[mesaId]
      },

      deleteChargeDraft: (mesaId) =>
        set((state) => {
          const { [mesaId]: _, ...rest } = state.chargeDrafts
          return { chargeDrafts: rest }
        }),

      updateChargeDraft: (mesaId, updates) =>
        set((state) => {
          const existing = state.chargeDrafts[mesaId]
          if (!existing) return state
          return {
            chargeDrafts: {
              ...state.chargeDrafts,
              [mesaId]: { ...existing, ...updates },
            },
          }
        }),

      // Payments
      addPayment: (payment) =>
        set((state) => ({
          payments: [...state.payments, payment],
        })),

      getPayments: (filters) => {
        const { payments } = get()

        if (!filters) return payments

        return payments.filter((p) => {
          if (filters.dateStart) {
            const paymentDate = new Date(p.fecha_hora)
            if (paymentDate < filters.dateStart) return false
          }

          if (filters.dateEnd) {
            const paymentDate = new Date(p.fecha_hora)
            if (paymentDate > filters.dateEnd) return false
          }

          if (filters.tipo_origen && p.tipo_origen !== filters.tipo_origen) {
            return false
          }

          return true
        })
      },

      // Productos
      getProducto: (id) => {
        return get().productos.find((p) => p.id === id)
      },

      // Utilities
      clearAll: () => set(initialState),
    }),
    {
      name: "billares-chapinlandia-storage",
      storage: createJSONStorage(() => localStorage),
      version: STORE_VERSION,
      partialize: (state) => ({
        sesiones: state.sesiones,
        payments: state.payments,
        productos: state.productos,
        chargeDrafts: state.chargeDrafts,
      }),
      migrate: (persistedState: any, version: number) => {
  if (version < 1) {
    // ... lo que ya tienes ...
    persistedState.chargeDrafts = {}
  }

  // 🔽 NUEVO: limpieza para sesiones abiertas que traigan flags “pegados”
  if (version < 2) {
    if (persistedState.sesiones) {
      persistedState.sesiones = persistedState.sesiones.map((s: any) => {
        if (s?.estado === "open") {
          return {
            ...s,
            isFrozen: false,
            frozenElapsed: undefined,
            frozenAt: undefined,
            closedAt: undefined,
            frozenTotals: undefined,
          }
        }
        return s
      })
    }
  }

  return persistedState as AppState & StoreActions
},
    },
  ),
)

// Initialize store with mock data if empty
export const initializeStore = () => {
  const store = useStore.getState()

  // Check if localStorage has any data at all
  const hasLocalStorage = typeof window !== "undefined" && localStorage.getItem("billares-chapinlandia-storage")

  // Only seed if localStorage is completely empty (first time)
  if (!hasLocalStorage && store.sesiones.length === 0 && store.payments.length === 0 && store.productos.length === 0) {
    console.log("[v0] Initializing store with mock data (first time)")

    // Add mock productos
    mockProductos.forEach((producto) => {
      useStore.setState((state) => ({
        productos: [...state.productos, producto],
      }))
    })

    // Add mock sesiones abiertas
    mockSesionesAbiertas.forEach((sesion) => {
      store.addSesion(sesion)
    })
  } else if (hasLocalStorage) {
    console.log("[v0] Store rehydrated from localStorage")
  }
}
