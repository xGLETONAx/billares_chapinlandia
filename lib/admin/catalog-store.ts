import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { seedCatalogos } from "./seeds"
import type {
  CatalogState,
  Producto,
  ReglaCobro,
  MetodoPago,
  Motivo,
  Identidad,
  MovimientoInventario,
  BitacoraEntry,
  Usuario,
  ConfigCorrelativo,
} from "./types"

const CATALOG_VERSION = 1

interface CatalogActions {
  // Productos
  getProductos: () => Producto[]
  getProducto: (id: string) => Producto | undefined
  getProductosActivos: () => Producto[]
  addProducto: (producto: Producto) => void
  updateProducto: (id: string, updates: Partial<Producto>) => void
  toggleProductoActivo: (id: string) => void

  // Reglas de cobro
  getReglaCobro: (tipo: "billar" | "juegos") => ReglaCobro | undefined
  updateReglaCobro: (tipo: "billar" | "juegos", updates: Partial<ReglaCobro>) => void

  // Métodos de pago
  getMetodosPagoHabilitados: () => MetodoPago[]
  toggleMetodoPago: (id: string) => void

  // Motivos
  getMotivos: (tipo?: "correccion" | "descuento") => Motivo[]
  getMotivosActivos: (tipo?: "correccion" | "descuento") => Motivo[]
  addMotivo: (motivo: Motivo) => void
  updateMotivo: (id: string, updates: Partial<Motivo>) => void
  toggleMotivoActivo: (id: string) => void

  // Correlativo
  getCorrelativo: () => ConfigCorrelativo
  updateCorrelativo: (updates: Partial<ConfigCorrelativo>) => void
  getNextSoloConsumoCode: () => string

  // Identidad
  getIdentidad: () => Identidad
  updateIdentidad: (updates: Partial<Identidad>) => void

  // Usuarios
  getUsuarios: () => Usuario[]
  getUsuario: (id: string) => Usuario | undefined
  getUsuariosActivos: () => Usuario[]
  addUsuario: (usuario: Usuario) => void
  updateUsuario: (id: string, updates: Partial<Usuario>) => void
  toggleUsuarioActivo: (id: string) => void
  resetPassword: (id: string) => void

  // Inventory
  registrarMovimiento: (movimiento: Omit<MovimientoInventario, "id" | "saldo">) => void
  getKardex: (productoId: string) => MovimientoInventario[]
  registrarSalidaPorVenta: (productoId: string, cantidad: number, referencia: string, usuario: string) => void
  updateProductoStock: (id: string, afectaStock: boolean, stockMinimo: number) => void

  // Bitácora
  addBitacoraEntry: (entry: Omit<BitacoraEntry, "id" | "fecha">) => void
  getBitacora: (filters?: { accion?: string; usuario?: string }) => BitacoraEntry[]

  // Utilities
  resetToSeeds: () => void
}

export const useCatalogStore = create<CatalogState & CatalogActions>()(
  persist(
    (set, get) => ({
      ...seedCatalogos,

      // Productos
      getProductos: () => get().productos,
      getProducto: (id) => get().productos.find((p) => p.id === id),
      getProductosActivos: () => get().productos.filter((p) => p.activo),

      addProducto: (producto) => {
        set((state) => ({
          productos: [...state.productos, producto],
        }))
        get().addBitacoraEntry({
          usuario: "Sistema",
          accion: "Crear producto",
          referencia: producto.id,
          nota: `Producto: ${producto.nombre}`,
        })
      },

      updateProducto: (id, updates) => {
        set((state) => ({
          productos: state.productos.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }))
        get().addBitacoraEntry({
          usuario: "Sistema",
          accion: "Editar producto",
          referencia: id,
          nota: `Cambios: ${Object.keys(updates).join(", ")}`,
        })
      },

      toggleProductoActivo: (id) => {
        const producto = get().getProducto(id)
        if (producto) {
          set((state) => ({
            productos: state.productos.map((p) => (p.id === id ? { ...p, activo: !p.activo } : p)),
          }))
          get().addBitacoraEntry({
            usuario: "Sistema",
            accion: producto.activo ? "Inactivar producto" : "Activar producto",
            referencia: id,
            nota: `Producto: ${producto.nombre}`,
          })
        }
      },

      // Reglas de cobro
      getReglaCobro: (tipo) => get().reglasCobro.find((r) => r.tipo === tipo),

      updateReglaCobro: (tipo, updates) => {
        set((state) => ({
          reglasCobro: state.reglasCobro.map((r) => (r.tipo === tipo ? { ...r, ...updates } : r)),
        }))
        get().addBitacoraEntry({
          usuario: "Sistema",
          accion: "Actualizar reglas de cobro",
          referencia: tipo,
          nota: `Cambios: ${Object.keys(updates).join(", ")}`,
        })
      },

      // Métodos de pago
      getMetodosPagoHabilitados: () => get().metodosPago.filter((m) => m.habilitado),

      toggleMetodoPago: (id) => {
        set((state) => ({
          metodosPago: state.metodosPago.map((m) => (m.id === id ? { ...m, habilitado: !m.habilitado } : m)),
        }))
      },

      // Motivos
      getMotivos: (tipo) => {
        const motivos = get().motivos
        return tipo ? motivos.filter((m) => m.tipo === tipo) : motivos
      },

      getMotivosActivos: (tipo) => {
        const motivos = get().motivos.filter((m) => m.activo)
        return tipo ? motivos.filter((m) => m.tipo === tipo) : motivos
      },

      addMotivo: (motivo) => {
        set((state) => ({
          motivos: [...state.motivos, motivo],
        }))
        get().addBitacoraEntry({
          usuario: "Sistema",
          accion: "Crear motivo",
          referencia: motivo.id,
          nota: `Tipo: ${motivo.tipo}, Descripción: ${motivo.descripcion}`,
        })
      },

      updateMotivo: (id, updates) => {
        set((state) => ({
          motivos: state.motivos.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        }))
      },

      toggleMotivoActivo: (id) => {
        set((state) => ({
          motivos: state.motivos.map((m) => (m.id === id ? { ...m, activo: !m.activo } : m)),
        }))
      },

      // Correlativo
      getCorrelativo: () => get().correlativo,

      updateCorrelativo: (updates) => {
        set((state) => ({
          correlativo: { ...state.correlativo, ...updates },
        }))
        get().addBitacoraEntry({
          usuario: "Sistema",
          accion: "Actualizar correlativos",
          nota: `Cambios: ${Object.keys(updates).join(", ")}`,
        })
      },

      getNextSoloConsumoCode: () => {
        const { prefijo, longitud, proximoNumero } = get().correlativo
        const now = new Date()
        const y = now.getFullYear()
        const m = String(now.getMonth() + 1).padStart(2, "0")
        const d = String(now.getDate()).padStart(2, "0")
        const code = `${prefijo}${y}${m}${d}-${String(proximoNumero).padStart(longitud, "0")}`

        // Increment for next time
        set((state) => ({
          correlativo: { ...state.correlativo, proximoNumero: proximoNumero + 1 },
        }))

        return code
      },

      // Identidad
      getIdentidad: () => get().identidad,

      updateIdentidad: (updates) => {
        set((state) => ({
          identidad: { ...state.identidad, ...updates },
        }))
        get().addBitacoraEntry({
          usuario: "Sistema",
          accion: "Actualizar identidad",
          nota: `Cambios: ${Object.keys(updates).join(", ")}`,
        })
      },

      // Usuarios
      getUsuarios: () => get().usuarios,
      getUsuario: (id) => get().usuarios.find((u) => u.id === id),
      getUsuariosActivos: () => get().usuarios.filter((u) => u.activo),

      addUsuario: (usuario) => {
        set((state) => ({
          usuarios: [...state.usuarios, usuario],
        }))
        get().addBitacoraEntry({
          usuario: "Sistema",
          accion: "Crear usuario",
          referencia: usuario.id,
          nota: `Usuario: ${usuario.nombre} (${usuario.email})`,
        })
      },

      updateUsuario: (id, updates) => {
        set((state) => ({
          usuarios: state.usuarios.map((u) => (u.id === id ? { ...u, ...updates } : u)),
        }))
        get().addBitacoraEntry({
          usuario: "Sistema",
          accion: "Editar usuario",
          referencia: id,
          nota: `Cambios: ${Object.keys(updates).join(", ")}`,
        })
      },

      toggleUsuarioActivo: (id) => {
        const usuario = get().getUsuario(id)
        if (usuario) {
          set((state) => ({
            usuarios: state.usuarios.map((u) => (u.id === id ? { ...u, activo: !u.activo } : u)),
          }))
          get().addBitacoraEntry({
            usuario: "Sistema",
            accion: usuario.activo ? "Inactivar usuario" : "Activar usuario",
            referencia: id,
            nota: `Usuario: ${usuario.nombre}`,
          })
        }
      },

      resetPassword: (id) => {
        const usuario = get().getUsuario(id)
        if (usuario) {
          get().addBitacoraEntry({
            usuario: "Sistema",
            accion: "Reset contraseña",
            referencia: id,
            nota: `Usuario: ${usuario.nombre}`,
          })
        }
      },

      // Inventory
      movimientosInventario: [],

      registrarMovimiento: (movimiento) => {
        const producto = get().getProducto(movimiento.productoId)
        if (!producto || !producto.afectaStock) return

        // Calculate new saldo
        const kardex = get().getKardex(movimiento.productoId)
        const lastSaldo = kardex.length > 0 ? kardex[0].saldo : producto.stockActual || 0
        const newSaldo = lastSaldo + movimiento.cantidad

        const newMovimiento: MovimientoInventario = {
          ...movimiento,
          id: `mov-${Date.now()}-${Math.random()}`,
          saldo: newSaldo,
        }

        set((state) => ({
          movimientosInventario: [newMovimiento, ...state.movimientosInventario],
          productos: state.productos.map((p) => (p.id === movimiento.productoId ? { ...p, stockActual: newSaldo } : p)),
        }))

        get().addBitacoraEntry({
          usuario: movimiento.usuario,
          accion: "Ajuste de stock",
          referencia: movimiento.productoId,
          nota: `${movimiento.tipo}: ${movimiento.cantidad > 0 ? "+" : ""}${movimiento.cantidad} → Saldo: ${newSaldo}`,
        })
      },

      getKardex: (productoId) => {
        return get()
          .movimientosInventario.filter((m) => m.productoId === productoId)
          .sort((a, b) => new Date(b.fechaISO).getTime() - new Date(a.fechaISO).getTime())
      },

      registrarSalidaPorVenta: (productoId, cantidad, referencia, usuario) => {
        const producto = get().getProducto(productoId)
        if (!producto || !producto.afectaStock) return

        get().registrarMovimiento({
          productoId,
          fechaISO: new Date().toISOString(),
          tipo: "venta",
          cantidad: -Math.abs(cantidad), // ensure negative
          referencia,
          usuario,
        })
      },

      updateProductoStock: (id, afectaStock, stockMinimo) => {
        const producto = get().getProducto(id)
        if (!producto) return

        const changes: string[] = []
        if (producto.afectaStock !== afectaStock) {
          changes.push(`Afecta stock: ${afectaStock ? "Sí" : "No"}`)
        }
        if (producto.stockMinimo !== stockMinimo) {
          changes.push(`Stock mínimo: ${stockMinimo}`)
        }

        set((state) => ({
          productos: state.productos.map((p) => (p.id === id ? { ...p, afectaStock, stockMinimo } : p)),
        }))

        if (changes.length > 0) {
          get().addBitacoraEntry({
            usuario: "Sistema",
            accion: "Editar configuración de inventario",
            referencia: id,
            nota: `${producto.nombre}: ${changes.join(", ")}`,
          })
        }
      },

      // Bitácora
      addBitacoraEntry: (entry) => {
        const newEntry: BitacoraEntry = {
          ...entry,
          id: `bitacora-${Date.now()}-${Math.random()}`,
          fecha: new Date().toISOString(),
        }
        set((state) => ({
          bitacora: [...state.bitacora, newEntry],
        }))
      },

      getBitacora: (filters) => {
        const bitacora = get().bitacora
        if (!filters) return bitacora

        return bitacora.filter((entry) => {
          if (filters.accion && !entry.accion.toLowerCase().includes(filters.accion.toLowerCase())) {
            return false
          }
          if (filters.usuario && !entry.usuario.toLowerCase().includes(filters.usuario.toLowerCase())) {
            return false
          }
          return true
        })
      },

      // Utilities
      resetToSeeds: () => {
        set(seedCatalogos)
      },
    }),
    {
      name: "billares-catalogos-storage",
      storage: createJSONStorage(() => localStorage),
      version: CATALOG_VERSION,
    },
  ),
)
