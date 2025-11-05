"use client"

import { useState, useMemo } from "react"
import { useCatalogStore } from "@/lib/admin/catalog-store"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { AlertCircle, ArrowDown, ArrowUp, Package, CalendarIcon } from "lucide-react"

export default function KardexPage() {
  const productos = useCatalogStore((s) => s.productos)
  const motivos = useCatalogStore((s) => s.motivos)
  const getKardex = useCatalogStore((s) => s.getKardex)

  const [selectedProductoId, setSelectedProductoId] = useState<string>("")
  const [tipoFilter, setTipoFilter] = useState<"todos" | "ajuste" | "venta">("todos")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(),
    to: new Date(),
  })

  const selectedProducto = productos.find((p) => p.id === selectedProductoId)

  const kardex = useMemo(() => {
    if (!selectedProductoId) return []

    let movimientos = getKardex(selectedProductoId)

    // Apply type filter
    if (tipoFilter !== "todos") {
      movimientos = movimientos.filter((m) => m.tipo === tipoFilter)
    }

    if (dateRange.from || dateRange.to) {
      movimientos = movimientos.filter((m) => {
        const movDate = new Date(m.fechaISO)
        movDate.setHours(0, 0, 0, 0)

        if (dateRange.from && dateRange.to) {
          const from = new Date(dateRange.from)
          from.setHours(0, 0, 0, 0)
          const to = new Date(dateRange.to)
          to.setHours(23, 59, 59, 999)
          return movDate >= from && movDate <= to
        }
        if (dateRange.from) {
          const from = new Date(dateRange.from)
          from.setHours(0, 0, 0, 0)
          return movDate >= from
        }
        if (dateRange.to) {
          const to = new Date(dateRange.to)
          to.setHours(23, 59, 59, 999)
          return movDate <= to
        }
        return true
      })
    }

    // Sort by date ascending for correct balance calculation
    return movimientos.sort((a, b) => new Date(a.fechaISO).getTime() - new Date(b.fechaISO).getTime())
  }, [selectedProductoId, tipoFilter, dateRange, getKardex])

  const getMotivoNombre = (motivoId: string | null | undefined) => {
    if (!motivoId) return null
    const motivo = motivos.find((m) => m.id === motivoId)
    return motivo?.descripcion || null
  }

  return (
    <div className="space-y-6 px-4 pt-16 md:pt-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Kárdex</h1>
        <p className="text-muted-foreground">Historial de movimientos de inventario por producto</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1 max-w-md">
          <Label htmlFor="producto">Producto (obligatorio)</Label>
          <Select value={selectedProductoId} onValueChange={setSelectedProductoId}>
            <SelectTrigger id="producto">
              <SelectValue placeholder="Selecciona un producto" />
            </SelectTrigger>
            <SelectContent>
              {productos
                .filter((p) => p.afectaStock)
                .map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre} ({p.categoria})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-48">
          <Label htmlFor="tipo">Tipo</Label>
          <Select value={tipoFilter} onValueChange={(v) => setTipoFilter(v as "todos" | "ajuste" | "venta")}>
            <SelectTrigger id="tipo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ajuste">Ajuste</SelectItem>
              <SelectItem value="venta">Venta</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-64">
          <Label htmlFor="fecha">Rango de fechas</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="fecha"
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yy", { locale: es })} -{" "}
                      {format(dateRange.to, "dd/MM/yy", { locale: es })}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yy", { locale: es })
                  )
                ) : (
                  "Seleccionar fechas"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                numberOfMonths={2}
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Content */}
      {!selectedProductoId ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Selecciona un producto para ver su historial de movimientos</AlertDescription>
        </Alert>
      ) : selectedProducto && !selectedProducto.afectaStock ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Este producto no registra movimientos de inventario.</AlertDescription>
        </Alert>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha/hora</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead>Referencia</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Observación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kardex.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No hay movimientos registrados</p>
                  </TableCell>
                </TableRow>
              ) : (
                kardex.map((movimiento) => {
                  const motivoNombre = getMotivoNombre(movimiento.motivo_id)
                  const isPositive = movimiento.cantidad > 0

                  return (
                    <TableRow key={movimiento.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(movimiento.fechaISO), "dd/MM/yyyy HH:mm", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell>
                        {movimiento.tipo === "ajuste" ? (
                          <Badge variant="outline" className="gap-1">
                            {isPositive ? (
                              <ArrowUp className="h-3 w-3 text-green-600" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-red-600" />
                            )}
                            Ajuste
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Venta/Consumo</Badge>
                        )}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
                        {isPositive ? "+" : ""}
                        {movimiento.cantidad}
                      </TableCell>
                      <TableCell className="text-right font-semibold">{movimiento.saldo}</TableCell>
                      <TableCell className="text-muted-foreground">{movimiento.referencia || "—"}</TableCell>
                      <TableCell>{movimiento.usuario}</TableCell>
                      <TableCell className="max-w-xs">
                        {motivoNombre && (
                          <div className="text-sm">
                            <span className="font-medium">Motivo:</span> {motivoNombre}
                          </div>
                        )}
                        {movimiento.motivo_texto && (
                          <div className="text-sm">
                            <span className="font-medium">Detalle:</span> {movimiento.motivo_texto}
                          </div>
                        )}
                        {movimiento.observacion && (
                          <div className="text-sm text-muted-foreground">{movimiento.observacion}</div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
