// lib/store/payment-to-operacion.ts
import type { Payment } from "./types"
import type { Operacion } from "../ventas"

/**
 * Convierte Payment (store) a Operacion (reportes)
 * Respeta snapshot (precios unitarios sellados, descuentos y breakdown).
 *
 * IMPORTANTE: Los valores ingresoJuego e ingresoConsumos son BRUTOS del snapshot.
 * El neteo (prorrateo de descuentos) se realiza en lib/reportes/math.ts
 * usando las funciones juegoNetoCents() y productosNetoCents().
 */
export function paymentToOperacion(payment: Payment): Operacion {
  const fecha = new Date(payment.fecha_hora)

  // Determinar tipo y mesa
  let tipo: "billar" | "juegos" | "solo-consumo"
  let mesa: string | undefined
  let tipoMesa: "billar" | "juegos" | undefined

  if (payment.tipo_origen === "solo_consumo") {
    tipo = "solo-consumo"
  } else {
    mesa = payment.id_origen
    // Preferir snapshot si trae tipo explícito
    const explicitType = (payment as any)?.snapshot?.tipo_mesa || (payment as any)?.snapshot?.origen?.tipo || undefined

    if (explicitType === "billar" || explicitType === "juegos") {
      tipo = explicitType
      tipoMesa = explicitType
    } else {
      // Fallback por número de mesa (1-5 billar / 6+ juegos)
      const mesaNum = Number.parseInt(String(mesa).replace(/\D/g, ""))
      if (mesaNum <= 5) {
        tipo = "billar"
        tipoMesa = "billar"
      } else {
        tipo = "juegos"
        tipoMesa = "juegos"
      }
    }
  }

  // Productos usando precio_unit del snapshot
  const productos = (payment.snapshot?.items ?? []).map((item: any) => ({
    nombre: item.nombre,
    cantidad: item.cantidad,
    precio: item.precio_unit,
  }))

  // El neteo (prorrateo de descuentos) se hace en lib/reportes/math.ts
  const ingresoJuegoBruto = payment.snapshot?.importe_juego ?? 0
  const ingresoConsumosBruto = payment.snapshot?.subtotal_productos ?? 0

  return {
    id: payment.id,
    fecha,
    tipo,
    mesa,
    tipoMesa,
    metodoPago: payment.pago.metodo_principal as Operacion["metodoPago"],
    usuario: payment.usuario,
    productos,
    // NOTA: Estos son valores BRUTOS. Para netos, usar juegoNetoCents() y productosNetoCents()
    ingresoJuego: ingresoJuegoBruto,
    ingresoConsumos: ingresoConsumosBruto,
    total: payment.pago.total_neto, // Este es el canon: total neto final del ticket
    descuento: payment.snapshot?.descuento?.monto_total ?? 0,
    estado: "cerrada",
  }
}

export function paymentsToOperaciones(payments: Payment[]): Operacion[] {
  return payments.map(paymentToOperacion)
}
