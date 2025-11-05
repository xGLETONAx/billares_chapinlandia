"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function KpisConsumos({
  consumosHoy,
  itemsVendidos,
  mesasConConsumo,
}: {
  consumosHoy: number
  itemsVendidos: number
  mesasConConsumo: number
}) {
  // Render igual que ya tienes; aquí solo muestro los valores.
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div className="rounded-lg border p-4">
        <div className="text-sm text-muted-foreground">Ingresos hoy</div>
        <div className="text-2xl font-bold">Q{consumosHoy.toFixed(2)}</div>
      </div>
      <div className="rounded-lg border p-4">
        <div className="text-sm text-muted-foreground">Ítems vendidos</div>
        <div className="text-2xl font-bold">{itemsVendidos}</div>
      </div>
      <div className="rounded-lg border p-4">
        <div className="text-sm text-muted-foreground">Mesas con consumo</div>
        <div className="text-2xl font-bold">{mesasConConsumo}</div>
      </div>
    </div>
  )
}
