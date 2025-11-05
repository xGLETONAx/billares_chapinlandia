export type TipoOrigen = "mesa" | "solo_consumo"
export type MetodoPago = "efectivo" | "tarjeta" | "transferencia" | "mixto"
export type DescuentoTipo = "Q" | "%"
export type EstadoSesion = "open" | "closed"

export interface ProductoItem {
  producto_id: string
  nombre: string
  cantidad: number
  precio_unit: number
  total_linea: number
}

export interface Descuento {
  tipo: DescuentoTipo
  valor: number
  monto_total: number
  monto_juego: number
  monto_productos: number
}

export interface PagoEfectivo {
  recibido: number
  pagado: number
  cambio: number
}

export interface PagoTarjeta {
  pagado: number
  last4?: string
  emisor?: string
}

export interface PagoTransferencia {
  pagado: number
  banco?: string
  referencia?: string
}

export interface PagoMixto {
  efectivo?: number
  tarjeta?: number
  transferencia?: number
}

export interface PagoDetalle {
  metodo_principal: MetodoPago
  efectivo?: PagoEfectivo
  tarjeta?: PagoTarjeta
  transferencia?: PagoTransferencia
  mixto?: PagoMixto
  total_neto: number
}

export interface Correccion {
  fecha: string
  usuario: string
  tipo: "linea" | "producto"
  de: string
  a: string
  motivo: string // Legacy: free text (backward compatible)
  motivo_id?: string // NEW: ID from motivos catalog
  motivo_texto?: string // NEW: Text for "Otro" option or legacy
}

export interface SnapshotCuenta {
  items: ProductoItem[]
  importe_juego: number
  subtotal_productos: number
  total_bruto: number
  descuento?: Descuento & {
    motivo_id?: string // NEW: ID from motivos catalog
    motivo_texto?: string // NEW: Text for "Otro" option
  }

  // NUEVO (opcionales, no rompen):
  tiempo_congelado?: string // "HH:MM"
  hora_inicio?: string // "HH:MM" (o el formato que ya usas)
}

export interface Payment {
  id: string
  tipo_origen: TipoOrigen
  id_origen: string // número de mesa o código C-XXX
  usuario: string
  fecha_hora: string // ISO format
  snapshot: SnapshotCuenta
  pago: PagoDetalle
  observacion?: string
  correcciones: Correccion[]
}

export interface ChargeDraft {
  mesaId: string
  tipo_origen: TipoOrigen
  id_origen: string
  fecha_creacion: string
  // Frozen session info
  tiempo_congelado: string // HH:MM format
  jugadores?: number
  tipo_juego?: string
  // Frozen items and costs
  items: ProductoItem[]
  importe_juego: number
  subtotal_productos: number
  total_bruto: number
  // Corrections made before payment
  correcciones: Correccion[]
}

export interface Sesion {
  id: string
  tipo_origen: TipoOrigen
  id_origen: string
  estado: EstadoSesion
  fecha_inicio: string
  tiempo_inicio?: string
  jugadores?: number
  tipo_juego?: string
  consumos: ProductoItem[]
  importe_juego: number
  correcciones: Correccion[]

  // --- NUEVO: control de congelamiento mientras está OPEN ---
  isFrozen?: boolean
  frozenAt?: string // ISO cuando se congeló
  frozenElapsed?: string // HH:MM congelado visible en resumen

  closedAt?: string
  frozenTotals?: {
    importe_juego: number
    subtotal_productos: number
    total_bruto: number
  }
}

export interface Producto {
  id: string
  nombre: string
  precio: number
  categoria: string
}

export interface AppState {
  sesiones: Sesion[]
  payments: Payment[]
  productos: Producto[]
  chargeDrafts: Record<string, ChargeDraft> // key is mesaId
}
