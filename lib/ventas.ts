// lib/ventas.ts
import { paymentsToOperaciones } from "./store/payment-to-operacion"
import { useStore } from "./store/store"

export type Operacion = {
  id: string
  fecha: Date
  tipo: "billar" | "juegos" | "solo-consumo"
  mesa?: string
  tipoMesa?: "billar" | "juegos"
  metodoPago: "efectivo" | "tarjeta" | "transferencia" | "mixto"
  usuario: string
  productos: { nombre: string; cantidad: number; precio: number }[]
  ingresoJuego: number
  ingresoConsumos: number
  total: number
  descuento: number
  estado: "abierta" | "cerrada"
}

export type Filtros = {
  dateStart: Date
  dateEnd: Date
  metodo?: "efectivo" | "tarjeta" | "transferencia" | "mixto" | "todos"
  usuario?: string | "todos"
  producto?: string | "todos"
  tipoOperacion?: "billar" | "juegos" | "solo-consumo" | "todos"
}

// Dominios dinámicos para Selects (ok tal como lo tenías)
export function getDomainValues(ops: Operacion[]) {
  const productos = new Set<string>()
  const usuarios = new Set<string>()
  const mesas = new Set<string>()

  for (const op of ops) {
    if (op.usuario) usuarios.add(op.usuario)
    if (op.mesa) mesas.add(op.mesa)
    for (const p of op.productos) if (p?.nombre) productos.add(p.nombre)
  }

  return {
    productos: Array.from(productos).sort((a, b) => a.localeCompare(b, "es")),
    usuarios: Array.from(usuarios).sort((a, b) => a.localeCompare(b, "es")),
    mesas: Array.from(mesas).sort((a, b) => a.localeCompare(b, "es")),
  }
}

export function getVentasCerradasFiltradas(f: Filtros): Operacion[] {
  const dateStart = new Date(f.dateStart)
  const dateEnd = new Date(f.dateEnd)

  // 1) Leer del store con los filtros de fecha
  const payments = useStore.getState().getPayments({
    dateStart,
    dateEnd,
  })

  // 2) Convertir a Operacion
  const ops = paymentsToOperaciones(payments)

  // 3) Filtrado adicional
  return ops.filter((op) => {
    // Solo cerradas
    if (op.estado !== "cerrada") return false

    if (f.metodo && f.metodo !== "todos" && op.metodoPago !== f.metodo) return false
    if (f.usuario && f.usuario !== "todos" && op.usuario !== f.usuario) return false

    if (f.tipoOperacion && f.tipoOperacion !== "todos") {
      if (op.tipo !== f.tipoOperacion) return false
    }

    if (f.producto && f.producto !== "todos") {
      const tiene = op.productos.some((p) => p.nombre === f.producto)
      if (!tiene) return false
    }

    return true
  })
}
