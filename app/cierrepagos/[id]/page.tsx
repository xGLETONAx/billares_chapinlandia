"use client"

import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { useState, useEffect, useMemo } from "react"
import { Clock, Users, DollarSign, Receipt, AlertCircle, Pencil } from "lucide-react"
import { CorreccionConsumoDialog } from "@/components/correccion-consumo-dialog"
import { CarritoModal } from "@/components/carrito-modal"
import { useStore } from "@/lib/store/store"
import { calcularProrrateoDescuento, clampPositive } from "@/lib/store/helpers"
import type { Payment, ProductoItem, Correccion } from "@/lib/store/types"
import { useCatalogStore } from "@/lib/admin/catalog-store"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

const numFromProductoId = (pid?: string) => {
  if (!pid) return 0
  const parts = String(pid).split("-")
  const last = parts[parts.length - 1]
  const n = Number.parseInt(last, 10)
  return Number.isNaN(n) ? 0 : n
}

export default function CierrePagosPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = params.id as string
  const tipo = searchParams.get("tipo") as "mesa" | "solo_consumo" | null
  const fromTab = (searchParams.get("fromTab") || "billar") as "billar" | "juegos" | "solo-consumo"

  const { getChargeDraft, addPayment, closeSesion, deleteChargeDraft, updateChargeDraft, getSesion } = useStore()

  const metodosPago = useCatalogStore((s) => s.metodosPago)
  const motivos = useCatalogStore((s) => s.motivos)

  const metodosPagoHabilitados = useMemo(() => metodosPago.filter((m) => m.habilitado), [metodosPago])
  const motivosDescuento = useMemo(() => motivos.filter((m) => m.tipo === "descuento" && m.activo), [motivos])

  const [descuentoTipo, setDescuentoTipo] = useState<"porcentaje" | "quetzales">("quetzales")
  const [descuentoValor, setDescuentoValor] = useState("")
  const [observacion, setObservacion] = useState("")
  const [metodoPago, setMetodoPago] = useState<"efectivo" | "tarjeta" | "transferencia" | "mixto">("efectivo")
  const [efectivoRecibido, setEfectivoRecibido] = useState("")
  const [tarjetaMonto, setTarjetaMonto] = useState("")
  const [tarjetaReferencia, setTarjetaReferencia] = useState("")
  const [transferenciaMonto, setTransferenciaMonto] = useState("")
  const [transferenciaReferencia, setTransferenciaReferencia] = useState("")
  const [mixtoEfectivo, setMixtoEfectivo] = useState("")
  const [mixtoTarjeta, setMixtoTarjeta] = useState("")
  const [mixtoTransferencia, setMixtoTransferencia] = useState("")
  const [correccionDialogOpen, setCorreccionDialogOpen] = useState(false)
  const [carritoModalOpen, setCarritoModalOpen] = useState(false)
  const [motivoCorreccionId, setMotivoCorreccionId] = useState("")
  const [motivoCorreccionTexto, setMotivoCorreccionTexto] = useState("")
  const [motivoDescuentoId, setMotivoDescuentoId] = useState("")
  const [motivoDescuentoTexto, setMotivoDescuentoTexto] = useState("")

  const draft = getChargeDraft(id)
  const sesionId = tipo === "mesa" ? `sesion-mesa-${id}` : `sesion-consumo-${id.replace("C-", "")}`
  const sesion = getSesion(sesionId)

  const [consumos, setConsumos] = useState<ProductoItem[]>([])
  const [correcciones, setCorrecciones] = useState<Correccion[]>([])

  useEffect(() => {
    if (draft) {
      setConsumos(draft.items)
      setCorrecciones(draft.correcciones)
    }
  }, [draft])

  useEffect(() => {
    if (!draft && id && tipo) {
      const sesionKey = tipo === "mesa" ? `sesion-mesa-${id}` : `sesion-consumo-${String(id).replace("C-", "")}`
      const s = getSesion?.(sesionKey)

      const esBillar = (s?.tipo_juego ?? "").toLowerCase().includes("billar")
      const demoHHMM = tipo === "mesa" ? (esBillar ? DEMO_BILLAR_HHMM : DEMO_JUEGOS_HHMM) : "00:00"
      const freeze = clampHHMM(DEMO_STATIC_DURATIONS ? demoHHMM : "00:00")

      const items = (s?.consumos ?? []).map((c: ProductoItem) => ({
        ...c,
        total_linea: c.total_linea ?? c.cantidad * c.precio_unit,
      }))
      const subtotal_productos = items.reduce((acc: number, it: ProductoItem) => acc + (it.total_linea || 0), 0)
      const importe_juego = tipo === "mesa" ? calcularCostoJuego(freeze, s?.tipo_juego, s?.jugadores) : 0

      const draftReconstruido = {
        mesaId: String(id),
        id_origen: String(id),
        tipo_origen: tipo as "mesa" | "solo_consumo",
        fecha_creacion: new Date().toISOString(),
        tipo_juego: s?.tipo_juego,
        jugadores: s?.jugadores,
        tiempo_congelado: freeze,
        items,
        subtotal_productos,
        importe_juego,
        total_bruto: subtotal_productos + importe_juego,
        correcciones: s?.correcciones ?? [],
      }

      try {
        useStore.getState().createChargeDraft(draftReconstruido as any)
        return
      } catch (e) {
        console.error("[v0] no pude reconstruir draft:", e)
      }
    }

    if (!draft && id && tipo) {
      console.error("[v0] Checkout draft not found for:", id)
      toast.error("No se encontró el borrador de cobro. Redirigiendo...")
      setTimeout(() => {
        router.push("/?tab=billar")
      }, 1500)
    }
  }, [draft, id, tipo, router, getSesion])

  const isValidState = !!id && id !== "undefined" && id !== "null" && !!tipo && !!fromTab && !!draft
  const backHref = `/?tab=${fromTab}`

  const getBackLabel = () => {
    switch (fromTab) {
      case "juegos":
        return "Volver a Mesas"
      case "solo-consumo":
        return "Volver a Solo Consumo"
      default:
        return "Volver a Mesas"
    }
  }

  const getChipTipoJuego = () => {
    if (draft?.tipo_juego?.includes("billar")) {
      return "Billar 30'"
    }
    if (draft?.tipo_juego) {
      const nombreJuego = draft.tipo_juego.split("-")[0]
      return `${nombreJuego.charAt(0).toUpperCase() + nombreJuego.slice(1)} 60'`
    }
    return "Juego"
  }

  const subtotalConsumos = clampPositive(consumos.reduce((sum, item) => sum + item.total_linea, 0))
  const costoJuego = clampPositive(draft?.importe_juego || 0)

  const calcularDescuento = () => {
    if (!descuentoValor) return 0
    const valor = Number.parseFloat(descuentoValor)
    if (isNaN(valor) || valor < 0) return 0

    const totalBruto = subtotalConsumos + costoJuego

    if (descuentoTipo === "porcentaje") {
      return clampPositive(totalBruto * (valor / 100))
    }
    return clampPositive(Math.min(valor, totalBruto))
  }

  const descuento = calcularDescuento()
  const total = clampPositive(subtotalConsumos + costoJuego - descuento)

  const validarPago = () => {
    if (metodoPago === "efectivo") {
      const recibido = Number.parseFloat(efectivoRecibido)
      return !isNaN(recibido) && recibido >= total
    }

    if (metodoPago === "tarjeta") {
      const monto = Number.parseFloat(tarjetaMonto)
      return !isNaN(monto) && Math.abs(monto - total) < 0.01
    }

    if (metodoPago === "transferencia") {
      const monto = Number.parseFloat(transferenciaMonto)
      return !isNaN(monto) && Math.abs(monto - total) < 0.01
    }

    if (metodoPago === "mixto") {
      const efectivo = Number.parseFloat(mixtoEfectivo) || 0
      const tarjeta = Number.parseFloat(mixtoTarjeta) || 0
      const transferencia = Number.parseFloat(mixtoTransferencia) || 0
      const suma = efectivo + tarjeta + transferencia
      return Math.abs(suma - total) < 0.01
    }

    return false
  }

  const calcularCambio = () => {
    if (metodoPago === "efectivo") {
      const recibido = Number.parseFloat(efectivoRecibido)
      if (!isNaN(recibido)) {
        return Math.max(0, recibido - total)
      }
    }
    return 0
  }

  const cambio = calcularCambio()

  const handleCorregirConsumo = () => {
    setCorreccionDialogOpen(true)
  }

  const handleConfirmarMotivo = (motivoId: string, motivoTexto: string) => {
    setMotivoCorreccionId(motivoId)
    setMotivoCorreccionTexto(motivoTexto)
    setCarritoModalOpen(true)
  }

  const handleGuardarConsumos = (nuevosConsumos: ProductoItem[]) => {
    const getMotivoNombre = (motivoId: string): string => {
      if (motivoId === "otro") return "Otro"
      const motivo = useCatalogStore.getState().motivos.find((m) => m.id === motivoId)
      return motivo?.nombre || motivoId
    }

    const correccion: Correccion = {
      fecha: new Date().toISOString(),
      usuario: "Operador",
      tipo: "linea",
      de: `${consumos.length} items`,
      a: `${nuevosConsumos.length} items`,
      motivo: getMotivoNombre(motivoCorreccionId),
      motivo_id: motivoCorreccionId,
      motivo_texto: motivoCorreccionTexto,
    }

    const nuevasCorrecciones = [...correcciones, correccion]
    const nuevoSubtotal = nuevosConsumos.reduce((sum, item) => sum + item.total_linea, 0)
    const nuevoTotal = costoJuego + nuevoSubtotal

    setConsumos(nuevosConsumos)
    setCorrecciones(nuevasCorrecciones)

    if (draft) {
      updateChargeDraft(id, {
        items: nuevosConsumos,
        correcciones: nuevasCorrecciones,
        subtotal_productos: nuevoSubtotal,
        total_bruto: nuevoTotal,
      })
    }

    setCarritoModalOpen(false)
    toast.success("Consumos actualizados correctamente")
  }

  const handleProcesarPago = () => {
    if (!draft || !sesion) return

    const totalBruto = subtotalConsumos + costoJuego
    const prorrateo = descuentoValor
      ? calcularProrrateoDescuento(
          costoJuego,
          subtotalConsumos,
          descuentoTipo === "porcentaje" ? "%" : "Q",
          Number.parseFloat(descuentoValor),
        )
      : { descuento_juego: 0, descuento_productos: 0 }

    const payment: Payment = {
      id: `payment-${Date.now()}`,
      tipo_origen: draft.tipo_origen,
      id_origen: draft.id_origen,
      usuario: "Operador",
      fecha_hora: new Date().toISOString(),
      snapshot: {
        items: consumos,
        importe_juego: costoJuego,
        subtotal_productos: subtotalConsumos,
        total_bruto: totalBruto,
        tiempo_congelado: draft.tiempo_congelado,
        hora_inicio: sesion?.tiempo_inicio || undefined,
        descuento: descuentoValor
          ? {
              tipo: descuentoTipo === "porcentaje" ? "%" : "Q",
              valor: Number.parseFloat(descuentoValor),
              monto_total: descuento,
              monto_juego: prorrateo.descuento_juego,
              monto_productos: prorrateo.descuento_productos,
              motivo_id: motivoDescuentoId || undefined,
              motivo_texto: motivoDescuentoTexto || undefined,
            }
          : undefined,
      },
      pago: {
        metodo_principal: metodoPago,
        total_neto: total,
        ...(metodoPago === "efectivo" && {
          efectivo: {
            recibido: Number.parseFloat(efectivoRecibido),
            pagado: total,
            cambio: calcularCambio(),
          },
        }),
        ...(metodoPago === "tarjeta" && {
          tarjeta: {
            pagado: Number.parseFloat(tarjetaMonto),
            last4: tarjetaReferencia || undefined,
          },
        }),
        ...(metodoPago === "transferencia" && {
          transferencia: {
            pagado: Number.parseFloat(transferenciaMonto),
            referencia: transferenciaReferencia || undefined,
          },
        }),
        ...(metodoPago === "mixto" && {
          mixto: {
            efectivo: Number.parseFloat(mixtoEfectivo) || undefined,
            tarjeta: Number.parseFloat(mixtoTarjeta) || undefined,
            transferencia: Number.parseFloat(mixtoTransferencia) || undefined,
          },
        }),
      },
      observacion: observacion || undefined,
      correcciones,
    }

    addPayment(payment)

    closeSesion(sesionId, draft.tiempo_congelado, {
      importe_juego: costoJuego,
      subtotal_productos: subtotalConsumos,
      total_bruto: totalBruto,
    })

    deleteChargeDraft(id)

    toast.success("Pago registrado exitosamente")

    setTimeout(() => {
      router.replace(backHref)
    }, 1500)
  }

  const handleCancelar = () => {
    router.push(backHref)
  }

  useEffect(() => {
    if (!isValidState) {
      router.push("/?tab=billar")
    }
  }, [isValidState, router])

  return (
    <div className="container mx-auto p-6 pt-20">
      {isValidState ? (
        <>
          <BreadcrumbNav
            items={[
              { label: getBackLabel(), href: backHref },
              { label: tipo === "solo_consumo" ? `Consumo ${id}` : `Mesa ${id}` },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
            <div className="lg:col-span-8 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {tipo === "solo_consumo" ? `Consumo ${id}` : `Mesa ${id}`}
                      {tipo === "mesa" && draft?.tipo_juego && (
                        <span className="ml-2 text-sm font-normal text-muted-foreground">{getChipTipoJuego()}</span>
                      )}
                    </CardTitle>
                    {correcciones.length > 0 && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        Ajustado
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {tipo === "mesa" && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Información de sesión (congelada)</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-3">
                          <Clock className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <div className="text-sm text-muted-foreground">Tiempo</div>
                            <div className="font-mono font-bold text-lg">{draft?.tiempo_congelado || "00:00"}</div>
                          </div>
                        </div>

                        {draft?.jugadores && (
                          <div className="flex items-center space-x-3">
                            <Users className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <div className="text-sm text-muted-foreground">Jugadores</div>
                              <div className="font-medium">{draft.jugadores}</div>
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

                  {tipo === "solo_consumo" && (
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
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Productos consumidos</h3>
                      <Button variant="link" size="sm" onClick={handleCorregirConsumo} className="text-sm">
                        <Pencil className="w-3 h-3 mr-1" />
                        Corregir consumo…
                      </Button>
                    </div>
                    {consumos.length > 0 ? (
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
                          {consumos.map((consumo) => (
                            <TableRow key={consumo.producto_id}>
                              <TableCell className="font-medium">{consumo.nombre}</TableCell>
                              <TableCell className="text-center">{consumo.cantidad}</TableCell>
                              <TableCell className="text-right">Q{consumo.precio_unit.toFixed(2)}</TableCell>
                              <TableCell className="text-right font-medium">
                                Q{consumo.total_linea.toFixed(2)}
                              </TableCell>
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
                      {descuento > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Descuento:</span>
                          <span className="font-medium">-Q{descuento.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="border-t pt-2">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total:</span>
                          <span>Q{total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-4">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Procesar pago</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-primary/10 rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">Total a pagar</div>
                    <div className="text-3xl font-bold">Q{total.toFixed(2)}</div>
                  </div>

                  <div className="space-y-3">
                    <Label>Descuento (opcional)</Label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={descuentoValor}
                          onChange={(e) => setDescuentoValor(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <RadioGroup
                        value={descuentoTipo}
                        onValueChange={(value) => setDescuentoTipo(value as "porcentaje" | "quetzales")}
                        className="flex gap-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="quetzales" id="quetzales" />
                          <Label htmlFor="quetzales" className="cursor-pointer">
                            Q
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="porcentaje" id="porcentaje" />
                          <Label htmlFor="porcentaje" className="cursor-pointer">
                            %
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    {descuentoValor && Number(descuentoValor) > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="motivo-descuento">Motivo (opcional)</Label>
                        <Select value={motivoDescuentoId} onValueChange={setMotivoDescuentoId}>
                          <SelectTrigger id="motivo-descuento">
                            <SelectValue placeholder="Seleccionar motivo..." />
                          </SelectTrigger>
                          <SelectContent>
                            {motivosDescuento.map((motivo) => (
                              <SelectItem key={motivo.id} value={motivo.id}>
                                {motivo.nombre}
                              </SelectItem>
                            ))}
                            <SelectItem value="otro">Otro (especificar)</SelectItem>
                          </SelectContent>
                        </Select>
                        {motivoDescuentoId === "otro" && (
                          <Textarea
                            placeholder="Especifica el motivo del descuento"
                            value={motivoDescuentoTexto}
                            onChange={(e) => setMotivoDescuentoTexto(e.target.value)}
                            rows={3}
                            className="resize-none"
                          />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observacion">Observación (opcional)</Label>
                    <Textarea
                      id="observacion"
                      placeholder="Notas adicionales sobre el pago..."
                      value={observacion}
                      onChange={(e) => setObservacion(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Método de pago</Label>
                    <RadioGroup value={metodoPago} onValueChange={(value) => setMetodoPago(value as any)}>
                      {metodosPagoHabilitados.map((metodo) => (
                        <div key={metodo.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={metodo.nombre.toLowerCase()} id={metodo.nombre.toLowerCase()} />
                          <Label htmlFor={metodo.nombre.toLowerCase()} className="cursor-pointer">
                            {metodo.nombre}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {metodoPago === "efectivo" && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="efectivo-recibido">Efectivo recibido *</Label>
                        <Input
                          id="efectivo-recibido"
                          type="number"
                          placeholder="0.00"
                          value={efectivoRecibido}
                          onChange={(e) => setEfectivoRecibido(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      {cambio > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="text-sm text-green-700">Cambio a devolver</div>
                          <div className="text-xl font-bold text-green-800">Q{cambio.toFixed(2)}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {metodoPago === "tarjeta" && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="tarjeta-monto">Monto *</Label>
                        <Input
                          id="tarjeta-monto"
                          type="number"
                          placeholder="0.00"
                          value={tarjetaMonto}
                          onChange={(e) => setTarjetaMonto(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tarjeta-referencia">Referencia (opcional)</Label>
                        <Input
                          id="tarjeta-referencia"
                          placeholder="Últimos 4 dígitos, etc."
                          value={tarjetaReferencia}
                          onChange={(e) => setTarjetaReferencia(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {metodoPago === "transferencia" && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="transferencia-monto">Monto *</Label>
                        <Input
                          id="transferencia-monto"
                          type="number"
                          placeholder="0.00"
                          value={transferenciaMonto}
                          onChange={(e) => setTransferenciaMonto(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="transferencia-referencia">Referencia (opcional)</Label>
                        <Input
                          id="transferencia-referencia"
                          placeholder="Número de operación, etc."
                          value={transferenciaReferencia}
                          onChange={(e) => setTransferenciaReferencia(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {metodoPago === "mixto" && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="mixto-efectivo">Efectivo</Label>
                        <Input
                          id="mixto-efectivo"
                          type="number"
                          placeholder="0.00"
                          value={mixtoEfectivo}
                          onChange={(e) => setMixtoEfectivo(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mixto-tarjeta">Tarjeta</Label>
                        <Input
                          id="mixto-tarjeta"
                          type="number"
                          placeholder="0.00"
                          value={mixtoTarjeta}
                          onChange={(e) => setMixtoTarjeta(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mixto-transferencia">Transferencia</Label>
                        <Input
                          id="mixto-transferencia"
                          type="number"
                          placeholder="0.00"
                          value={mixtoTransferencia}
                          onChange={(e) => setMixtoTransferencia(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="text-sm text-muted-foreground">Total ingresado</div>
                        <div className="text-lg font-bold">
                          Q
                          {(
                            (Number.parseFloat(mixtoEfectivo) || 0) +
                            (Number.parseFloat(mixtoTarjeta) || 0) +
                            (Number.parseFloat(mixtoTransferencia) || 0)
                          ).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 pt-4">
                    <Button onClick={handleProcesarPago} disabled={!validarPago()} className="w-full">
                      Procesar pago
                    </Button>
                    <Button variant="outline" onClick={handleCancelar} className="w-full bg-transparent">
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <CorreccionConsumoDialog
            isOpen={correccionDialogOpen}
            onClose={() => setCorreccionDialogOpen(false)}
            onConfirm={handleConfirmarMotivo}
          />

          <CarritoModal
            open={carritoModalOpen}
            onOpenChange={setCarritoModalOpen}
            title={tipo === "solo_consumo" ? `Consumos – ${id}` : `Consumos – Mesa ${id}`}
            gameChip={tipo === "mesa" ? getChipTipoJuego() : undefined}
            consumos={consumos.map((c) => ({
              id: numFromProductoId(c.producto_id),
              producto: c.nombre,
              cantidad: c.cantidad,
              precio: c.precio_unit,
              total: c.total_linea,
            }))}
            onAddConsumo={(producto, cantidad) => {
              const mockPrice = 10
              const newConsumo: ProductoItem = {
                producto_id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                nombre: producto,
                cantidad,
                precio_unit: mockPrice,
                total_linea: mockPrice * cantidad,
              }
              handleGuardarConsumos([...consumos, newConsumo])
            }}
            onRemoveConsumo={(id) => {
              handleGuardarConsumos(consumos.filter((c) => numFromProductoId(c.producto_id) !== id))
            }}
            showSessionInfo={tipo === "mesa"}
            sessionInfo={
              tipo === "mesa"
                ? {
                    tipo: draft?.tipo_juego?.includes("billar") ? "Billar" : "Juegos de mesa",
                    jugadores: draft?.jugadores,
                    tarifa: draft?.tipo_juego?.includes("billar") ? "Q10 por bloque de 30′" : "Q6 por jugador por hora",
                  }
                : undefined
            }
          />
        </>
      ) : (
        <div className="container mx-auto p-6 pt-20">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                Datos incompletos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Faltan parámetros necesarios para procesar el pago. Por favor, verifica que la URL sea correcta.
                </p>
                <Button onClick={() => router.push("/?tab=billar")}>Ir a Mesas</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
