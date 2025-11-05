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

// Datos mock de la mesa
const getMesaData = (id: string) => {
  const mesas = {
    "1": {
      numero: 1,
      tipo: "Billar",
      tipoJuego: "Billar",
      jugadores: null,
      inicio: "14:20",
      tarifa: "Q10 por bloque de 30 min",
    },
    "3": {
      numero: 3,
      tipo: "Billar",
      tipoJuego: "Billar",
      jugadores: null,
      inicio: "15:15",
      tarifa: "Q10 por bloque de 30 min",
    },
    "10": {
      numero: 10,
      tipo: "Juegos de mesa",
      tipoJuego: "Domino",
      jugadores: 4,
      inicio: "13:30",
      tarifa: "Q6 por jugador por hora",
    },
  }
  return mesas[id as keyof typeof mesas] || mesas["1"]
}

export default function ConsumosMesaPage() {
  const params = useParams()
  const id = params.id as string
  const mesa = getMesaData(id)

  const [busqueda, setBusqueda] = useState("")
  const [cantidad, setCantidad] = useState(1)

  // Datos mock de consumos
  const consumos = [
    { id: 1, producto: "Coca Cola", cantidad: 2, precio: 8, total: 16 },
    { id: 2, producto: "Nachos", cantidad: 1, precio: 25, total: 25 },
    { id: 3, producto: "Cerveza", cantidad: 3, precio: 12, total: 36 },
  ]

  const subtotalConsumos = consumos.reduce((sum, item) => sum + item.total, 0)

  return (
    <div className="container mx-auto p-6 pt-24">
      <PageHeader
        title={`Mesa ${mesa.numero} - Consumos`}
        breadcrumb={["Mesas", `Mesa ${mesa.numero}`, "Consumos"]}
        backLabel="Volver a Mesas"
        fromTab={mesa.tipo === "Billar" ? "billar" : "juegos"}
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
                      <TableCell className="text-right">Q{consumo.precio}</TableCell>
                      <TableCell className="text-right font-medium">Q{consumo.total}</TableCell>
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

        {/* Columna derecha - Panel simplificado */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subtotal consumos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-right">Q{subtotalConsumos.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Información de sesión</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {mesa.tipo === "Billar" ? "Q10 por bloque de 30′" : `Q6 por jugador por hora`}
              </div>

              {mesa.jugadores && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Jugadores:</span>
                  <span className="font-medium">{mesa.jugadores}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
