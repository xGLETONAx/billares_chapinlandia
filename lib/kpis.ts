import type { Sesion, Payment } from "./store/types"

/**
 * Pure selector functions for calculating KPIs from store data
 * These functions match the logic used in the Resumen de Consumos page
 */

/**
 * Calculate total income for today from payments
 * Uses the same logic as KpisConsumos component
 */
export function calcularIngresosHoy(payments: Payment[]): number {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const manana = new Date(hoy)
  manana.setDate(manana.getDate() + 1)

  const paymentsHoy = payments.filter((p) => {
    const fecha = new Date(p.fecha_hora)
    return fecha >= hoy && fecha < manana
  })

  return paymentsHoy.reduce((sum, p) => sum + (p.pago.total_neto || 0), 0)
}

/**
 * Calculate active tables ratio
 * Returns { activas: number, total: number }
 */
export function calcularMesasActivas(sesiones: Sesion[], totalMesas: number): { activas: number; total: number } {
  // Count open sessions (including solo_consumo if needed)
  const sesionesAbiertas = sesiones.filter((s) => s.estado === "open" && s.tipo_origen === "mesa")

  return {
    activas: sesionesAbiertas.length,
    total: totalMesas,
  }
}

/**
 * Calculate average session duration for sessions closed today
 * Returns duration in hours with 1 decimal (e.g., 2.5)
 */
export function calcularTiempoPromedio(sesiones: Sesion[], payments: Payment[]): number {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const manana = new Date(hoy)
  manana.setDate(manana.getDate() + 1)

  // Get payments from today to find closed sessions
  const paymentsHoy = payments.filter((p) => {
    const fecha = new Date(p.fecha_hora)
    return fecha >= hoy && fecha < manana
  })

  if (paymentsHoy.length === 0) return 0

  let totalMinutos = 0
  let count = 0

  for (const payment of paymentsHoy) {
    // Get frozen time from snapshot if available
    const tiempoCongelado = payment.snapshot.tiempo_congelado
    const horaInicio = payment.snapshot.hora_inicio

    if (tiempoCongelado) {
      // Parse HH:MM format
      const [horas, minutos] = tiempoCongelado.split(":").map(Number)
      totalMinutos += horas * 60 + minutos
      count++
    } else if (horaInicio) {
      // Fallback: calculate from inicio to payment time
      const fechaPago = new Date(payment.fecha_hora)
      const [h, m] = horaInicio.split(":").map(Number)
      const fechaInicio = new Date(payment.fecha_hora)
      fechaInicio.setHours(h, m, 0, 0)

      const diffMs = fechaPago.getTime() - fechaInicio.getTime()
      const diffMinutos = Math.floor(diffMs / 1000 / 60)
      if (diffMinutos > 0) {
        totalMinutos += diffMinutos
        count++
      }
    }
  }

  if (count === 0) return 0

  const promedioMinutos = totalMinutos / count
  const promedioHoras = promedioMinutos / 60

  return Math.round(promedioHoras * 10) / 10 // 1 decimal
}

/**
 * Calculate table occupancy percentage
 * For now, uses instantaneous occupancy (active / total * 100)
 * Can be enhanced later with time-weighted average
 */
export function calcularOcupacion(sesiones: Sesion[], totalMesas: number): number {
  if (totalMesas === 0) return 0

  const { activas } = calcularMesasActivas(sesiones, totalMesas)
  const porcentaje = (activas / totalMesas) * 100

  return Math.round(porcentaje)
}

/**
 * Format currency value as Q{amount}
 */
export function formatearMoneda(monto: number): string {
  return `Q${monto.toFixed(2)}`
}

/**
 * Format hours with 1 decimal
 */
export function formatearHoras(horas: number): string {
  return `${horas.toFixed(1)}h`
}

/**
 * Format percentage
 */
export function formatearPorcentaje(porcentaje: number): string {
  return `${porcentaje}%`
}
