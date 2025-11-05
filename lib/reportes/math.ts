// lib/reportes/math.ts
// Funciones centralizadas para cálculos de reportes
// Trabajan en centavos para evitar errores de redondeo intermedio

import type { Operacion } from "./ventas"

/**
 * Convierte quetzales a centavos (redondea al entero más cercano)
 */
export const toCents = (q: number) => Math.round((q || 0) * 100)

/**
 * Convierte centavos a quetzales
 */
export const fromCents = (c: number) => (c || 0) / 100

/**
 * Asegura que un valor en centavos no sea negativo
 */
export const clamp = (c: number) => Math.max(0, c)

/**
 * Calcula el ingreso NETO de JUEGO para un ticket (en centavos)
 *
 * Algoritmo:
 * 1. Calcula brutos de productos y juego
 * 2. Prorratea el descuento proporcionalmente entre productos y juego
 * 3. Resta productos neto del total del ticket para obtener juego neto
 *
 * @param op - Operación (ticket cerrado)
 * @returns Centavos netos de juego
 */
export const juegoNetoCents = (op: Operacion) => {
  // 1. Brutos en centavos
  const prodBruto = op.productos.reduce((a, l) => a + toCents(l.precio * l.cantidad), 0)
  const juegoBruto = toCents(op.ingresoJuego)
  const brutoTotal = prodBruto + juegoBruto

  // 2. Descuento prorrateado
  const descCents = toCents(op.descuento || 0)
  const descProd = brutoTotal > 0 && descCents > 0 ? Math.round(descCents * (prodBruto / brutoTotal)) : 0

  // 3. Neto de productos
  const prodNeto = clamp(prodBruto - descProd)

  // 4. Total del ticket (canon) menos productos = juego neto
  const totalTicket = toCents(op.total)
  return clamp(totalTicket - prodNeto)
}

/**
 * Calcula el ingreso NETO de PRODUCTOS para un ticket (en centavos)
 * Opcionalmente filtra por nombre de producto específico
 *
 * Algoritmo:
 * 1. Si NO hay descuento → retorna brutos
 * 2. Si hay descuento → prorratea el descuento proporcionalmente
 * 3. Si se especifica producto → aplica factor de neteo a ese producto
 *
 * @param op - Operación (ticket cerrado)
 * @param productoNombre - Nombre del producto a filtrar (opcional)
 * @returns Centavos netos de productos (o de un producto específico)
 */
export const productosNetoCents = (op: Operacion, productoNombre?: string | null) => {
  // 1. Calcular brutos por línea
  const lineas = op.productos.map((l) => ({
    nombre: l.nombre,
    bruto: toCents(l.precio * l.cantidad),
  }))
  const prodBruto = lineas.reduce((a, b) => a + b.bruto, 0)
  const juegoBruto = toCents(op.ingresoJuego || 0)
  const brutoTotal = prodBruto + juegoBruto

  const descCents = toCents(op.descuento || 0)

  // 2. Sin descuento → usar brutos directamente
  if (descCents === 0) {
    if (!productoNombre) return prodBruto
    return lineas.filter((l) => l.nombre === productoNombre).reduce((a, b) => a + b.bruto, 0)
  }

  // 3. Con descuento → prorratear
  const descProd = brutoTotal > 0 ? Math.round(descCents * (prodBruto / brutoTotal)) : 0
  const prodNeto = clamp(prodBruto - descProd)

  if (!productoNombre) return prodNeto
  if (prodBruto === 0) return 0

  // 4. Aplicar factor de neteo al producto específico
  const factor = prodNeto / prodBruto
  const brutoLineaSel = lineas.filter((l) => l.nombre === productoNombre).reduce((a, b) => a + b.bruto, 0)
  return Math.round(brutoLineaSel * factor)
}
