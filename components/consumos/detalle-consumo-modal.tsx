"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, Users, DollarSign, Receipt, AlertCircle } from "lucide-react"
import type { Payment } from "@/lib/store/types"
import { useCatalogStore } from "@/lib/admin/catalog-store"

interface ConsumoItem {
  id: number
  producto: string
  cantidad: number
  precio: number
  total: number
}

interface DetalleConsumoModalProps {
  isOpen: boolean
  onClose: () => void
  tipo: "billar" | "juegos-mesa" | "solo-consumo"
  // Common data
  mesa?: string
  codigo?: string
  estado: "Abierta" | "Cerrada"
  // Session data
  tiempoCongelado?: string
  horaInicio?: string
  jugadores?: number
  // Consumos
  consumos: ConsumoItem[]
  // Payment data
  payment?: Payment
}

export function DetalleConsumoModal({
  isOpen,
  onClose,
  tipo,
  mesa,
  codigo,
  estado,
  tiempoCongelado,
  horaInicio,
  jugadores,
  consumos,
  payment,
}: DetalleConsumoModalProps) {
  // ==== FUENTES DE VERDAD PARA EL DETALLE (DENTRO DEL COMPONENTE) ====
  const hasPayment = !!payment

  // Items consumidos (si hay pago, usamos snapshot)
  const items = hasPayment
    ? payment!.snapshot.items.map((it, idx) => ({
        id: idx + 1,
        producto: it.nombre,
        cantidad: it.cantidad,
        precio: it.precio_unit,
        total: (it as any).total_linea ?? it.cantidad * it.precio_unit,
      }))
    : consumos

  // Importes “congelados” si hay payment
  const importeJuego = hasPayment ? payment!.snapshot.importe_juego : 0
  const subtotalProductos = hasPayment
    ? payment!.snapshot.subtotal_productos
    : items.reduce((acc, it) => acc + it.total, 0)

  // Descuento del pago (si existió)
  const descuento = hasPayment ? payment!.snapshot.descuento : undefined

  // Total “real” mostrado
  const totalMostrado = hasPayment ? payment!.pago.total_neto : importeJuego + subtotalProductos

  // Campos auxiliares de pago
  const metodo = hasPayment ? payment!.pago.metodo_principal : undefined
  const obs = hasPayment ? payment!.observacion || "" : ""
  const correcciones = hasPayment ? payment!.correcciones || [] : []

  // Tiempo a mostrar (si luego guardas tiempo_congelado en snapshot, úsalo)
  const tiempoMostrado = (hasPayment && (payment as any).snapshot?.tiempo_congelado) || tiempoCongelado || "00:00"

  const getTipoLabel = () => {
    if (tipo === "billar") return "Billar 30′"
    if (tipo === "juegos-mesa") return "Juegos de mesa 60′"
    return "Solo consumo"
  }

  const getMotivoNombre = (motivoId: string): string => {
    if (motivoId === "otro") return "Otro"
    const motivo = useCatalogStore.getState().motivos.find((m) => m.id === motivoId)
    return motivo?.nombre || motivoId
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Detalle de consumo — {mesa || codigo}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {getTipoLabel()} · {estado}
            </span>
          </DialogTitle>
          <DialogDescription className="sr-only">Información detallada del consumo y productos</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información de sesión - solo para Billar y Juegos de mesa */}
          {tipo !== "solo-consumo" && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Información de sesión</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Tiempo {estado === "Cerrada" ? "(congelado)" : ""}
                    </div>
                    <div className="font-mono font-bold text-lg">{tiempoMostrado}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Hora de inicio</div>
                    <div className="font-medium">{(payment as any)?.snapshot?.hora_inicio || horaInicio || "—"}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Costo de juego</div>
                    <div className="font-bold">Q{importeJuego.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">
                      {tipo === "billar" ? "Q10 por bloque de 30′" : `Q6 por jugador por hora`}
                    </div>
                  </div>
                </div>

                {tipo === "juegos-mesa" && jugadores && (
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Jugadores</div>
                      <div className="font-medium">{jugadores}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Solo consumo info */}
          {tipo === "solo-consumo" && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Receipt className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Tipo</div>
                  <div className="font-medium">Solo productos (sin costo de juego)</div>
                </div>
              </div>
            </div>
          )}

          {/* Productos consumidos */}
          <div>
            <h3 className="font-semibold mb-3">Productos consumidos</h3>
            {items.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-center">Cantidad</TableHead>
                      <TableHead className="text-right">Precio unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((consumo) => (
                      <TableRow key={consumo.id}>
                        <TableCell className="font-medium">{consumo.producto}</TableCell>
                        <TableCell className="text-center">{consumo.cantidad}</TableCell>
                        <TableCell className="text-right">Q{consumo.precio.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">Q{consumo.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                No hay productos consumidos
              </div>
            )}
          </div>

          {/* Resumen de totales */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Resumen</h3>
            <div className="space-y-2">
              {tipo !== "solo-consumo" && (
                <div className="flex justify-between">
                  <span>Costo de juego:</span>
                  <span className="font-medium">Q{importeJuego.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Subtotal consumos:</span>
                <span className="font-medium">Q{subtotalProductos.toFixed(2)}</span>
              </div>

              {descuento && descuento.monto_total > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento{descuento.tipo === "%" ? ` (${descuento.valor}%)` : ""}</span>
                  <span className="font-medium">-Q{descuento.monto_total.toFixed(2)}</span>
                </div>
              )}

              <div className="border-t pt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>Q{totalMostrado.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {payment && payment.correcciones.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Correcciones realizadas
              </h3>
              <div className="space-y-2">
                {payment.correcciones.map((corr, idx) => (
                  <div key={idx} className="text-sm">
                    <div className="font-medium">
                      Motivo: {corr.motivo_id ? getMotivoNombre(corr.motivo_id) : corr.motivo}
                    </div>
                    {corr.motivo_texto && <div className="text-muted-foreground">Detalle: {corr.motivo_texto}</div>}
                    <div className="text-muted-foreground">
                      {new Date(corr.fecha).toLocaleString("es-GT")} · {corr.usuario}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {descuento && descuento.monto_total > 0 && (descuento as any).motivo_id && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Motivo del descuento</h3>
              <div className="text-sm">
                <div className="font-medium">Motivo: {getMotivoNombre((descuento as any).motivo_id)}</div>
                {(descuento as any).motivo_texto && (
                  <div className="text-muted-foreground">Detalle: {(descuento as any).motivo_texto}</div>
                )}
              </div>
            </div>
          )}

          {hasPayment && (
            <div className="mt-4 bg-muted/50 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold mb-1">Información de pago</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex justify-between">
                  <span>Método:</span>
                  <span className="font-medium capitalize">{metodo}</span>
                </div>

                <div className="flex justify-between">
                  <span>Total pagado:</span>
                  <span className="font-medium">Q{totalMostrado.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Fecha y hora:</span>
                  <span className="font-medium">{new Date(payment!.fecha_hora).toLocaleString("es-GT")}</span>
                </div>

                <div className="flex justify-between">
                  <span>Usuario:</span>
                  <span className="font-medium">{payment!.usuario}</span>
                </div>

                {/* EFECTIVO: recibido y cambio */}
                {payment!.pago.efectivo && (
                  <>
                    <div className="flex justify-between">
                      <span>Efectivo recibido:</span>
                      <span className="font-medium">Q{payment!.pago.efectivo.recibido.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cambio entregado:</span>
                      <span className="font-medium">Q{payment!.pago.efectivo.cambio.toFixed(2)}</span>
                    </div>
                  </>
                )}

                {/* TARJETA: últimos 4 */}
                {payment!.pago.tarjeta && (
                  <div className="flex justify-between">
                    <span>Tarjeta (últimos 4):</span>
                    <span className="font-medium">{payment!.pago.tarjeta.last4 || "—"}</span>
                  </div>
                )}

                {/* TRANSFERENCIA: referencia/banco si viene */}
                {payment!.pago.transferencia && (
                  <>
                    <div className="flex justify-between">
                      <span>Transferencia:</span>
                      <span className="font-medium">Q{payment!.pago.transferencia.pagado.toFixed(2)}</span>
                    </div>
                    {(payment!.pago.transferencia.referencia || payment!.pago.transferencia.banco) && (
                      <div className="flex justify-between">
                        <span>Referencia:</span>
                        <span className="font-medium">{payment!.pago.transferencia.referencia || "—"}</span>
                      </div>
                    )}
                  </>
                )}

                {/* MIXTO: desgloses */}
                {payment!.pago.mixto && (
                  <>
                    <div className="flex justify-between">
                      <span>Mixto – Efectivo:</span>
                      <span className="font-medium">Q{(payment!.pago.mixto.efectivo || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mixto – Tarjeta:</span>
                      <span className="font-medium">Q{(payment!.pago.mixto.tarjeta || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mixto – Transferencia:</span>
                      <span className="font-medium">Q{(payment!.pago.mixto.transferencia || 0).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Observación */}
              {obs && obs.trim().length > 0 && (
                <div className="pt-2">
                  <div className="text-sm text-muted-foreground mb-1">Observación</div>
                  <div className="rounded-md bg-background border p-2 text-sm">{obs}</div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
