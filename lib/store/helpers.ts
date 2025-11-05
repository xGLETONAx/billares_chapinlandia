import type { Sesion } from "./types"
/**
 * Convert quetzales to cents to avoid floating point errors
 */
export const toCents = (q: number): number => Math.round(q * 100)

/**
 * Convert cents back to quetzales
 */
export const fromCents = (c: number): number => c / 100

/**
 * Ensure cents value is not negative
 */
export const clampCents = (c: number): number => Math.max(0, c)

/**
 * Round to 2 decimal places
 */
export const round2 = (num: number): number => Math.round(num * 100) / 100

/**
 * Calculate prorated discount for game and products
 */
export interface ProrrateoResult {
  descuento_juego: number
  descuento_productos: number
}

export const calcularProrrateoDescuento = (
  importe_juego: number,
  subtotal_productos: number,
  descuento_tipo: "Q" | "%",
  descuento_valor: number,
): ProrrateoResult => {
  const juegoCents = toCents(importe_juego)
  const productosCents = toCents(subtotal_productos)
  const totalBrutoCents = juegoCents + productosCents

  let descuentoTotalCents = 0

  if (descuento_tipo === "%") {
    descuentoTotalCents = Math.round(totalBrutoCents * (descuento_valor / 100))
  } else {
    descuentoTotalCents = toCents(descuento_valor)
  }

  // Prorate proportionally
  let descuentoJuegoCents = 0
  let descuentoProductosCents = 0

  if (totalBrutoCents > 0 && descuentoTotalCents > 0) {
    descuentoJuegoCents = Math.round(descuentoTotalCents * (juegoCents / totalBrutoCents))
    descuentoProductosCents = Math.round(descuentoTotalCents * (productosCents / totalBrutoCents))
  }

  return {
    descuento_juego: fromCents(descuentoJuegoCents),
    descuento_productos: fromCents(descuentoProductosCents),
  }
}

/**
 * Calculate elapsed time with clamping to prevent negatives
 * @param now Current timestamp
 * @param startedAt Start timestamp
 * @returns Elapsed time in milliseconds (always >= 0)
 */
export const calcElapsed = (now: Date, startedAt: Date): number => {
  const elapsed = now.getTime() - startedAt.getTime()
  return Math.max(0, elapsed)
}

/**
 * Format elapsed milliseconds to HH:MM string
 */
export const formatElapsed = (elapsedMs: number): string => {
  const totalMinutes = Math.floor(elapsedMs / 1000 / 60)
  const hrs = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}

/**
 * Parse HH:MM string to total minutes
 */
export const parseTimeToMinutes = (timeStr: string): number => {
  try {
    const [hrs, mins] = timeStr.split(":").map(Number)
    return hrs * 60 + mins
  } catch {
    return 0
  }
}

/**
 * Calculate game cost based on time and game type
 * Returns 0 if elapsed is 0 or negative
 */
export const calcularCostoJuego = (tiempoCongelado: string, tipoJuego?: string, jugadores?: number): number => {
  if (!tiempoCongelado) return 0

  const totalMinutos = parseTimeToMinutes(tiempoCongelado)

  if (totalMinutos <= 0) return 0

  if (tipoJuego?.includes("billar")) {
    // Q10 per 30-minute block
    const bloques = Math.ceil(totalMinutos / 30)
    return bloques * 10
  } else {
    // Q6 per player per hour
    const horas = Math.ceil(totalMinutos / 60)
    return horas * 6 * (jugadores || 2)
  }
}

/**
 * Validate discount value
 */
export const validarDescuento = (
  tipo: "Q" | "%",
  valor: number,
  totalBruto: number,
): { valid: boolean; error?: string } => {
  if (valor < 0) {
    return { valid: false, error: "El descuento no puede ser negativo" }
  }

  if (tipo === "%") {
    if (valor > 100) {
      return { valid: false, error: "El descuento porcentual no puede ser mayor a 100%" }
    }
  } else {
    if (valor > totalBruto) {
      return { valid: false, error: "El descuento no puede ser mayor al total" }
    }
  }

  return { valid: true }
}

/**
 * Normalize value to prevent negatives
 */
export const clampPositive = (value: number): number => Math.max(0, value)

// --- DEMO knobs: tiempos fijos mientras no hay backend ---
export const DEMO_STATIC_DURATIONS = false;     // poner en false cuando quieras volver a tiempo real
export const DEMO_BILLAR_HHMM = "02:00";       // = Q40 (Q10 por bloque de 30’)
export const DEMO_JUEGOS_HHMM  = "01:00";      // = 1h (Q6 x jugador)

// HH:MM seguro (sin valores negativos/raros)
export const clampHHMM = (hhmm?: string) => {
  const [h, m] = String(hhmm ?? "").split(":").map(Number);
  const H = Number.isFinite(h) ? Math.max(0, h) : 0;
  const M = Number.isFinite(m) ? Math.max(0, m) : 0;
  return `${String(H).padStart(2,"0")}:${String(M).padStart(2,"0")}`;
};

// Útil si lo prefieres (tienes parseTimeToMinutes, aquí un alias)
export const hhmmToMinutes = (hhmm: string) => {
  const [h, m] = String(hhmm ?? "00:00").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

/**
 * Devuelve el HH:MM transcurrido desde (fecha_inicio + tiempo_inicio) hasta ahora.
 * Usa la misma base que el temporizador visible en la tarjeta.
 */
export const elapsedHHMM = (fechaISO?: string, hhmmInicio?: string): string => {
  if (!fechaISO || !hhmmInicio) return "00:00"
  const [h, m] = String(hhmmInicio).split(":").map(Number)
  const inicio = new Date(fechaISO)
  inicio.setHours(h || 0, m || 0, 0, 0)
  const ms = calcElapsed(new Date(), inicio)
  return clampHHMM(formatElapsed(ms))
}

export const elapsedHHMMForSesion = (s?: {
  fecha_inicio?: string;
  tiempo_inicio?: string;
  isFrozen?: boolean;
  frozenElapsed?: string;
}): string => {
  if (!s) return "00:00";
  if (s.isFrozen && s.frozenElapsed) return clampHHMM(s.frozenElapsed);
  return elapsedHHMM(s.fecha_inicio, s.tiempo_inicio);
};
