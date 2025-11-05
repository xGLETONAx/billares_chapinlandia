"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Search, Users } from "lucide-react"
import { productos, type Producto } from "@/data/productos"

interface ConsumoItem {
  id: number
  producto: Producto
  cantidad: number
  descuento: number
  subtotal: number
}

interface SesionConsumosProps {
  mesaId: string
}

export function SesionConsumos({ mesaId }: SesionConsumosProps) {
  const [busquedaProducto, setBusquedaProducto] = useState("")
  const [cantidad, setCantidad] = useState(1)
  const [consumos, setConsumos] = useState<ConsumoItem[]>([])
  const [productosFiltrados, setProductosFiltrados] = useState<Producto[]>([])
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)

  // Mock data para la mesa
  const mesaData = {
    numero: Number.parseInt(mesaId) || 1,
    tipo: Number.parseInt(mesaId) <= 8 ? "Billar" : "Juegos de mesa",
    tipoJuego: Number.parseInt(mesaId) <= 8 ? "Billar" : "Dominó",
    estado: "abiertaPropia" as const,
    tiempoInicio: "14:30",
    jugadores: Number.parseInt(mesaId) > 8 ? 4 : undefined,
  }

  const calcularTimer = (tiempoInicio: string) => {
    const ahora = new Date()
    const [horas, minutos] = tiempoInicio.split(":").map(Number)
    const inicio = new Date()
    inicio.setHours(horas, minutos, 0, 0)

    const diferenciaMs = ahora.getTime() - inicio.getTime()
    const totalMinutos = Math.floor(diferenciaMs / 1000 / 60)
    const hrs = Math.floor(totalMinutos / 60)
    const mins = totalMinutos % 60

    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
  }

  const buscarProductos = (termino: string) => {
    if (termino.length < 2) {
      setProductosFiltrados([])
      setMostrarSugerencias(false)
      return
    }

    const filtrados = productos.filter((producto) => producto.nombre.toLowerCase().includes(termino.toLowerCase()))
    setProductosFiltrados(filtrados)
    setMostrarSugerencias(true)
  }

  const seleccionarProducto = (producto: Producto) => {
    setBusquedaProducto(producto.nombre)
    setMostrarSugerencias(false)
  }

  const registrarConsumo = () => {
    const productoSeleccionado = productos.find((p) => p.nombre.toLowerCase() === busquedaProducto.toLowerCase())

    if (!productoSeleccionado || cantidad <= 0) return

    const nuevoConsumo: ConsumoItem = {
      id: Date.now(),
      producto: productoSeleccionado,
      cantidad,
      descuento: 0,
      subtotal: productoSeleccionado.precio * cantidad,
    }

    setConsumos([...consumos, nuevoConsumo])
    setBusquedaProducto("")
    setCantidad(1)
  }

  const eliminarConsumo = (id: number) => {
    setConsumos(consumos.filter((c) => c.id !== id))
  }

  const subtotalConsumos = consumos.reduce((total, item) => total + item.subtotal, 0)

  const calcularMontoJuego = () => {
    const tiempoTranscurrido = calcularTimer(mesaData.tiempoInicio)
    const [horas, minutos] = tiempoTranscurrido.split(":").map(Number)
    const totalMinutos = horas * 60 + minutos

    if (mesaData.tipo === "Billar") {
      const bloques = Math.ceil(totalMinutos / 30)
      return bloques * 10 // Q10 por bloque de 30 minutos
    } else {
      const horasCompletas = Math.ceil(totalMinutos / 60)
      const jugadores = mesaData.jugadores || 2
      return horasCompletas * jugadores * 6 // Q6 por jugador por hora
    }
  }

  const montoJuego = calcularMontoJuego()
  const totalParcial = subtotalConsumos + montoJuego

  const getChipTipoJuego = () => {
    if (mesaData.tipo === "Billar") {
      return "Billar 30′"
    }
    return `${mesaData.tipoJuego} 60′`
  }

  return (
    <div className="min-h-screen bg-bg pt-16 pl-16">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header local */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-ink">Mesa {mesaData.numero}</h1>
              <Badge variant="outline" className="text-sm font-medium">
                {getChipTipoJuego()}
              </Badge>
              <Badge className="bg-destructive text-destructive-foreground">Abierta</Badge>
            </div>
            <div className="text-4xl font-mono font-bold text-brand">{calcularTimer(mesaData.tiempoInicio)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda - Consumos */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card Agregar consumo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Agregar consumo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Input
                    placeholder="Buscar producto..."
                    value={busquedaProducto}
                    onChange={(e) => {
                      setBusquedaProducto(e.target.value)
                      buscarProductos(e.target.value)
                    }}
                    onFocus={() => buscarProductos(busquedaProducto)}
                  />
                  {mostrarSugerencias && productosFiltrados.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                      {productosFiltrados.map((producto) => (
                        <button
                          key={producto.id}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 flex justify-between items-center"
                          onClick={() => seleccionarProducto(producto)}
                        >
                          <span>{producto.nombre}</span>
                          <span className="text-sm text-gray-500">Q{producto.precio.toFixed(2)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Cantidad"
                    value={cantidad}
                    onChange={(e) => setCantidad(Number.parseInt(e.target.value) || 1)}
                    min="1"
                    className="w-32"
                  />
                  <Button onClick={registrarConsumo} className="flex-1">
                    Registrar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Al registrar consumo se descuenta stock (placeholder)</p>
              </CardContent>
            </Card>

            {/* Tabla de consumos */}
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
                      <TableHead className="text-right">P. Unitario</TableHead>
                      <TableHead className="text-right">Descuento</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consumos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No hay consumos registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      consumos.map((consumo) => (
                        <TableRow key={consumo.id}>
                          <TableCell className="font-medium">{consumo.producto.nombre}</TableCell>
                          <TableCell className="text-center">{consumo.cantidad}</TableCell>
                          <TableCell className="text-right">Q{consumo.producto.precio.toFixed(2)}</TableCell>
                          <TableCell className="text-right">Q{consumo.descuento.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">Q{consumo.subtotal.toFixed(2)}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => eliminarConsumo(consumo.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Columna derecha - Resumen */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumen de sesión</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Subtotal consumos:</span>
                    <span className="font-medium">Q{subtotalConsumos.toFixed(2)}</span>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Tiempo de juego:</span>
                      <span className="font-mono">{calcularTimer(mesaData.tiempoInicio)}</span>
                    </div>

                    {mesaData.tipo === "Billar" ? (
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Bloques de 30′ a Q10/bloque:</span>
                          <span>Q{montoJuego.toFixed(2)}</span>
                        </div>
                        <p className="text-xs">(Primer bloque ya cobrado al abrir)</p>
                      </div>
                    ) : (
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>Jugadores: {mesaData.jugadores}</span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span>Q6 por jugador por hora:</span>
                          <span>Q{montoJuego.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total parcial:</span>
                      <span className="text-brand">Q{totalParcial.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
