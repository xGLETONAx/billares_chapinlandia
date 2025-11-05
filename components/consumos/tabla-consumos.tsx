"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Payment } from "@/lib/store/types"

type Tipo = "billar" | "juegos-mesa" | "solo-consumo"

export type ConsumoRow = {
  id: string
  mesa: string
  codigo: string
  juego: string
  tipo: Tipo
  estado: "Abierta" | "Cerrada"
  inicio: string
  tiempo: string
  subtotalConsumos: number
  totalParcial: number
  jugadores?: number
  consumos: Array<{
    id: number
    producto: string
    cantidad: number
    precio: number
    total: number
  }>
  fechaCreacion: string
  payment?: Payment
}

export function TablaConsumos({
  consumos,
  onVerDetalle,
}: {
  consumos: ConsumoRow[]
  onVerDetalle: (row: ConsumoRow) => void
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mesa / Código</TableHead>
              <TableHead>Operación</TableHead>
              <TableHead className="w-[110px] text-center">Estado</TableHead>
              <TableHead className="text-center">Inicio</TableHead>
              <TableHead className="text-center">Tiempo</TableHead>
              <TableHead className="text-right">Subtotal consumos</TableHead>
              <TableHead className="text-right">{/* total */}Total</TableHead>
              <TableHead className="text-center">Pago</TableHead>
              <TableHead className="w-[1%] text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consumos.map((c) => {
              const metodo = c.payment?.pago.metodo_principal
              const metodoChip =
                c.estado === "Cerrada" && metodo ? (
                  <Badge variant="secondary" className="whitespace-nowrap">
                    {metodo === "efectivo"
                      ? "Efectivo"
                      : metodo === "tarjeta"
                      ? "Tarjeta"
                      : metodo === "transferencia"
                      ? "Transferencia"
                      : "Mixto"}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )

              // Total mostrado:
              // - Si hay payment -> total_neto pagado (hecho contable)
              // - Si NO hay payment -> totalParcial calculado (sesión abierta)
              const total = c.payment?.pago.total_neto ?? c.totalParcial

              return (
                <TableRow key={`${c.id}-${c.payment?.id ?? "open"}`}>
                  <TableCell>
                    <div className="font-medium">{c.tipo === "solo-consumo" ? c.codigo : c.mesa}</div>
                    <div className="text-xs text-muted-foreground">{c.tipo === "solo-consumo" ? "Solo consumo" : c.codigo}</div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">{c.juego}</div>
                    {typeof c.jugadores === "number" && (
                      <div className="text-xs text-muted-foreground">{c.jugadores} jugador(es)</div>
                    )}
                  </TableCell>

                  <TableCell className="text-center">
                    {c.estado === "Abierta" ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Abierta</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-muted text-foreground">Cerrada</Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-center">{(c.payment as any)?.snapshot?.hora_inicio || c.inicio || "—"}</TableCell>
                  <TableCell className="text-center">
  <span className="font-mono tabular-nums">
    {/* si en el futuro guardas tiempo_congelado en el payment, lo usamos; si no, fallback a c.tiempo */}
    {c.payment?.snapshot && (c.payment as any)?.snapshot?.tiempo_congelado
      ? (c.payment as any).snapshot.tiempo_congelado
      : (c.tiempo || "—")}
  </span>
</TableCell>


                  <TableCell className="text-right">
                    Q{(c.payment?.snapshot.subtotal_productos ?? c.subtotalConsumos).toFixed(2)}
                  </TableCell>

                  <TableCell className="text-right font-semibold">Q{total.toFixed(2)}</TableCell>

                  <TableCell className="text-center">{metodoChip}</TableCell>

                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => onVerDetalle(c)}>
                      Ver detalle
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        {consumos.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">No hay registros para los filtros aplicados</div>
        )}
      </CardContent>
    </Card>
  )
}
