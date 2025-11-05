// Catalog types for administration
export interface Producto {
  id: string
  codigo?: string
  nombre: string
  categoria: string
  precio: number
  activo: boolean
  // Inventory fields (optional MVP)
  afectaStock?: boolean
  stockActual?: number
  stockMinimo?: number
}

export interface ReglaCobro {
  id: string
  tipo: "billar" | "juegos"
  // Billar
  duracionBloque?: number // minutes
  precioBloque?: number
  cobrarPrimerBloque?: boolean
  tolerancia?: number // minutes
  // Juegos de mesa
  precioPorJugadorHora?: number
}

export interface MetodoPago {
  id: string
  nombre: string
  habilitado: boolean
}

export interface Motivo {
  id: string
  tipo: "correccion" | "descuento"
  descripcion: string
  activo: boolean
}

export interface ConfigCorrelativo {
  prefijo: string
  longitud: number
  proximoNumero: number
}

export interface Identidad {
  nombreComercial: string
  logo?: string
  moneda: string
  textoContacto?: string
}

export interface Usuario {
  id: string
  nombre: string
  email: string
  rol: "admin"
  activo: boolean
  fechaCreacion: string
}

export interface AjusteStock {
  id: string
  productoId: string
  fecha: string
  tipo: "ajuste" | "venta"
  cantidad: number // positive or negative
  saldo: number
  motivo: string
  nota?: string
  usuario: string
  referencia?: string // mesa/ticket reference
}

export interface BitacoraEntry {
  id: string
  fecha: string
  usuario: string
  accion: string
  referencia?: string
  nota?: string
}

export interface MovimientoInventario {
  id: string
  productoId: string
  fechaISO: string
  tipo: "ajuste" | "venta"
  cantidad: number // positive or negative
  saldo: number // running balance after this movement
  referencia?: string // mesa/ticket reference for sales
  usuario: string
  observacion?: string
  motivo_id?: string | null
  motivo_texto?: string | null
}

// Catalog state
export interface CatalogState {
  productos: Producto[]
  reglasCobro: ReglaCobro[]
  metodosPago: MetodoPago[]
  motivos: Motivo[]
  correlativo: ConfigCorrelativo
  identidad: Identidad
  usuarios: Usuario[]
  ajustesStock: AjusteStock[]
  bitacora: BitacoraEntry[]
  movimientosInventario: MovimientoInventario[]
}
