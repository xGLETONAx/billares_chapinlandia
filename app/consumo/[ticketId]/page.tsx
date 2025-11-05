"use client"

import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search } from "lucide-react"
import { useState } from "react"
import { useParams } from "next/navigation"

export default function ConsumoSoloPage() {
  const params = useParams()
  const ticketId = params.ticketId as string

  const [busqueda, setBusqueda] = useState("")
  const [cantidad, setCantidad] = useState(1)

  // Datos mock de consumos
  const consumos = [
    { id: 1, producto: "Coca Cola", cantidad: 2, precio: 8, total: 16 },
    { id: 2, producto: "Nachos", cantidad: 1, precio: 25, total: 25 },
  ]

  const subtotalConsumos = consumos.reduce((sum, item) => sum + item.total, 0)

  return (
    <div className="container mx-auto p-6 pt-24">
      <PageHeader
        title={`Consumo C-${ticketId}`}
        breadcrumb={["Solo consumo", `Consumo C-${ticketId}`]}
        backLabel="Volver a Solo consumo"
        fromTab="solo-consumo"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Agregar consumos */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agregar consumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="busqueda">Buscar producto</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="busqueda"
                      placeholder="Escriba el nombre del producto..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-24">
                  <Label htmlFor="cantidad">Cantidad</Label>
                  <Input
                    id="cantidad"
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(Number(e.target.value))}
                  />
                </div>
                <div className="flex items-end">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Consumos registrados</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead className="text-right">Precio unit.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consumos.map((consumo) => (
                    <TableRow key={consumo.id}>
                      <TableCell className="font-medium">{consumo.producto}</TableCell>
                      <TableCell className="text-center">{consumo.cantidad}</TableCell>
                      <TableCell className="text-right">Q{consumo.precio.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">Q{consumo.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Quitar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha - Subtotal */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subtotal consumos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-right">Q{subtotalConsumos.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
