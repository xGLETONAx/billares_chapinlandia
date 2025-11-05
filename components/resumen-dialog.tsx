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
import { Clock, Users, DollarSign, Receipt } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useStore } from "@/lib/store/store"
import {
  clampHHMM,
  DEMO_STATIC_DURATIONS,
  DEMO_BILLAR_HHMM,
  DEMO_JUEGOS_HHMM,
  calcularCostoJuego,
} from "@/lib/store/helpers"

interface ConsumoItem {
  id: number
  producto: string
  cantidad: number
  precio: number
  total: number
}

interface ResumenDialogProps {
  isOpen: boolean
  onClose: () => void
  tipo: "mesa" | "solo-consumo"
  mesaNumero?: number
  tipoJuego?: string
  jugadores?: number
  tiempoCongelado?: string
  ticketId?: string
  consumos?: ConsumoItem[]
  onCobrar?: () => void
  onSeguirJugando?: () => void
  fromTab?: "billar" | "juegos" | "solo-consumo"
}

export function ResumenDialog({
  isOpen,
  onClose,
  tipo,
  mesaNumero,
  tipoJuego,
  jugadores,
  tiempoCongelado: tiempoCongeladoProp,
  ticketId,
  consumos = [],
  onSeguirJugando,
  fromTab = "billar",
}: ResumenDialogProps) {
  const router = useRouter()
  const [tiempoCongelado, setTiempoCongelado] = useState("00:00")

  // Leemos consumos vivos del store (si existen) para que el Resumen refleje lo último del carrito
const st = useStore() // ← añade esto
const { unfreezeSesion } = st
const sesionKey = tipo === "mesa"
  ? `sesion-mesa-${mesaNumero}`
  : `sesion-consumo-${String(ticketId ?? "").replace("C-", "")}`
  const sesion = st.getSesion?.(sesionKey)
  const consumosEfectivos = (sesion?.consumos ?? []) as Array<{
    producto_id: string
    nombre: string
    cantidad: number
    precio_unit: number
    total_linea: number
  }>

  // Si vienen consumos por props, usamos esos; si no, mapeamos los del store al shape del modal
  const consumosParaUI: ConsumoItem[] = (consumos?.length
    ? consumos
    : consumosEfectivos.map((c, i) => ({
        id: i + 1,
        producto: c.nombre,
        cantidad: c.cantidad,
        precio: c.precio_unit,
        total: c.total_linea,
      }))) as ConsumoItem[]

  const { createChargeDraft } = useStore()

useEffect(() => {
  if (!isOpen) return
  // usamos el congelado que nos pasó la página; si no hay, caemos a 00:00
  setTiempoCongelado(clampHHMM(tiempoCongeladoProp || "00:00"))
}, [isOpen, tiempoCongeladoProp])

  const costoJuego = tipo === "mesa" ? calcularCostoJuego(tiempoCongelado, tipoJuego, jugadores) : 0
  const subtotalConsumos = consumosParaUI.reduce((sum, item) => sum + item.total, 0)
  const total = subtotalConsumos + costoJuego

  const getChipTipoJuego = () => {
    if (tipoJuego?.includes("billar")) return "Billar 30'"
    if (tipoJuego) {
      const nombreJuego = tipoJuego.split("-")[0]
      return `${nombreJuego.charAt(0).toUpperCase() + nombreJuego.slice(1)} 60'`
    }
    return "Juego"
  }

  const handleCobrar = () => {
    const idOrigen = tipo === "mesa" ? String(mesaNumero) : String(ticketId)
    if (!idOrigen || idOrigen === "undefined") {
      console.error("[v0] Falta id para navegar al cobro.")
      return
    }
    const tipoOrigen: "mesa" | "solo_consumo" = tipo === "mesa" ? "mesa" : "solo_consumo"

    const congelado = tiempoCongelado // lo mismo que ve el usuario

    const items = (consumosParaUI ?? []).map((c, i) => ({
      producto_id: `prod-${i + 1}`,
      nombre: c.producto ?? "Producto",
      cantidad: Number(c.cantidad ?? 1),
      precio_unit: Number(c.precio ?? 0),
      total_linea: Number.isFinite(c.total) ? Number(c.total) : Number(c.cantidad ?? 1) * Number(c.precio ?? 0),
    }))
    const subtotal_productos = items.reduce((s, it) => s + (it.total_linea || 0), 0)

    const importe_juego = tipo === "mesa" ? calcularCostoJuego(congelado, tipoJuego, jugadores) : 0

    const draft = {
      mesaId: idOrigen,
      id_origen: idOrigen,
      tipo_origen: tipoOrigen,
      fecha_creacion: new Date().toISOString(),
      tipo_juego: tipoJuego,
      jugadores,
      tiempo_congelado: congelado,
      items,
      subtotal_productos,
      importe_juego,
      total_bruto: subtotal_productos + importe_juego,
      correcciones: [],
    }

    createChargeDraft(draft)

    const esBillar = (tipoJuego ?? "").toLowerCase().includes("billar")
    const tab = fromTab ?? (tipo === "mesa" ? (esBillar ? "billar" : "juegos") : "solo-consumo")

    setTimeout(() => {
      router.push(`/cierrepagos/${idOrigen}?tipo=${tipoOrigen}&fromTab=${tab}`)
      onClose()
    }, 0)
  }

  const handleSeguirJugando = () => {
  // ⬇️ descongela
  unfreezeSesion?.(sesionKey)
  onSeguirJugando?.()
  onClose()
}

  const handleCancelar = () => {
  // ⬇️ también descongela
  unfreezeSesion?.(sesionKey)
  onClose()
}

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {tipo === "mesa" ? `Resumen – Mesa ${mesaNumero || ""}` : `Resumen – Consumo ${ticketId || ""}`}
            {tipo === "mesa" && tipoJuego && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">{getChipTipoJuego()}</span>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">Resumen detallado de la sesión y consumos</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {tipo === "mesa" && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Información de sesión</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Tiempo (congelado)</div>
                    <div className="font-mono font-bold text-lg">{tiempoCongelado}</div>
                  </div>
                </div>

                {jugadores && !!jugadores && (
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Jugadores</div>
                      <div className="font-medium">{jugadores}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Costo de juego</div>
                    <div className="font-bold">Q{costoJuego.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tipo === "solo-consumo" && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Receipt className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Tipo</div>
                  <div className="font-medium">Solo productos</div>
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-3">Consumos registrados</h3>
            {consumosParaUI.length > 0 ? (
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
                  {consumosParaUI.map((consumo) => (
                    <TableRow key={consumo.id}>
                      <TableCell className="font-medium">{consumo.producto}</TableCell>
                      <TableCell className="text-center">{consumo.cantidad}</TableCell>
                      <TableCell className="text-right">Q{consumo.precio.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">Q{consumo.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No hay consumos registrados</div>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Resumen</h3>
            <div className="space-y-2">
              {tipo === "mesa" && (
                <div className="flex justify-between">
                  <span>Costo de juego:</span>
                  <span className="font-medium">Q{costoJuego.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Subtotal consumos:</span>
                <span className="font-medium">Q{subtotalConsumos.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>Q{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
  <Button variant="outline" onClick={handleCancelar}>Cancelar</Button>
  {tipo === "mesa" && <Button variant="outline" onClick={handleSeguirJugando}>Seguir jugando</Button>}
  {tipo === "solo-consumo" && <Button variant="outline" onClick={handleSeguirJugando}>Seguir consumiendo</Button>}
  <Button onClick={handleCobrar}>Cobrar</Button>
</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
