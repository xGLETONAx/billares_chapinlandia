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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, ExternalLink } from "lucide-react"
import { useState } from "react"
import { useCatalogStore } from "@/lib/admin/catalog-store"
import { useRouter } from "next/navigation"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface ConsumoItem {
  id: number
  producto: string
  cantidad: number
  precio: number
  total: number
}

interface CarritoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  gameChip?: string
  consumos: ConsumoItem[]
  onAddConsumo: (producto: string, cantidad: number, precio: number, id: number) => void
  onRemoveConsumo: (id: number) => void
  showSessionInfo?: boolean
  sessionInfo?: {
    tipo: string
    jugadores?: number
    tarifa: string
  }
}

export function CarritoModal({
  open,
  onOpenChange,
  title,
  gameChip,
  consumos,
  onAddConsumo,
  onRemoveConsumo,
  showSessionInfo = false,
  sessionInfo,
}: CarritoModalProps) {
  const productos = useCatalogStore((s) => s.productos)
  const router = useRouter()

  const [busqueda, setBusqueda] = useState("")
  const [cantidad, setCantidad] = useState(1)
  const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null)
  const [popoverOpen, setPopoverOpen] = useState(false)

  const subtotalConsumos = consumos.reduce((sum, item) => sum + item.total, 0)

  const productosActivos = productos.filter((p) => p.activo)

  const productosFiltrados = productosActivos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigo?.toLowerCase().includes(busqueda.toLowerCase()),
  )

  const handleAgregar = () => {
    if (productoSeleccionado) {
      onAddConsumo(productoSeleccionado.nombre, cantidad, productoSeleccionado.precio, productoSeleccionado.id)
      setProductoSeleccionado(null)
      setBusqueda("")
      setCantidad(1)
      setPopoverOpen(false)
    }
  }

  const handleSelectProducto = (producto: any) => {
    setProductoSeleccionado(producto)
    setBusqueda(producto.nombre)
    setPopoverOpen(false)
  }

  const handleClose = () => {
    setBusqueda("")
    setCantidad(1)
    setProductoSeleccionado(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] sm:max-w-4xl h-[80vh] max-h-[80vh] p-0 flex flex-col">
        {/* Fixed Header */}
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            {title}
            {gameChip && (
              <Badge variant="secondary" className="ml-2">
                {gameChip}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">Modal para gestionar consumos y productos</DialogDescription>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Left Column - 2fr equivalent */}
            <div className="lg:col-span-2 space-y-6">
              {/* Agregar consumo section */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">Agregar consumo</h3>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="busqueda" className="text-sm font-medium mb-2 block">
                      Seleccionar producto
                    </Label>
                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={popoverOpen}
                          className="w-full justify-between h-11 bg-transparent"
                        >
                          {productoSeleccionado ? productoSeleccionado.nombre : "Buscar producto..."}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Buscar producto..." value={busqueda} onValueChange={setBusqueda} />
                          <CommandList>
                            <CommandEmpty>
                              <div className="py-6 text-center text-sm">
                                <p className="text-muted-foreground mb-2">No se encontró el producto</p>
                                <Button
                                  variant="link"
                                  size="sm"
                                  onClick={() => {
                                    router.push("/admin/productos")
                                    setPopoverOpen(false)
                                  }}
                                  className="gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Crear en Administración
                                </Button>
                              </div>
                            </CommandEmpty>
                            <CommandGroup>
                              {productosFiltrados.map((producto) => (
                                <CommandItem
                                  key={producto.id}
                                  value={producto.nombre}
                                  onSelect={() => handleSelectProducto(producto)}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <div>
                                      <div className="font-medium">{producto.nombre}</div>
                                      {producto.codigo && (
                                        <div className="text-xs text-muted-foreground">{producto.codigo}</div>
                                      )}
                                    </div>
                                    <div className="font-mono text-sm">Q{producto.precio.toFixed(2)}</div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="w-24">
                    <Label htmlFor="cantidad" className="text-sm font-medium mb-2 block">
                      Cantidad
                    </Label>
                    <Input
                      id="cantidad"
                      type="number"
                      min="1"
                      value={cantidad}
                      onChange={(e) => setCantidad(Number(e.target.value))}
                      className="h-11"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleAgregar}
                      className="h-11 px-4 bg-green-600 hover:bg-green-700 text-white"
                      disabled={!productoSeleccionado}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                </div>
                {productoSeleccionado && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-md">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Precio unitario:</span>
                      <span className="font-medium">Q{productoSeleccionado.precio.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-bold">Q{(productoSeleccionado.precio * cantidad).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Consumos registrados section */}
              <div className="border rounded-lg p-4 flex-1">
                <h3 className="font-semibold mb-4">Consumos registrados</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-left">Producto</TableHead>
                        <TableHead className="text-center w-20">Cantidad</TableHead>
                        <TableHead className="text-right w-24">Precio unit.</TableHead>
                        <TableHead className="text-right w-24">Total</TableHead>
                        <TableHead className="w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consumos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No hay consumos registrados
                          </TableCell>
                        </TableRow>
                      ) : (
                        consumos.map((consumo) => (
                          <TableRow key={consumo.id}>
                            <TableCell className="font-medium">{consumo.producto}</TableCell>
                            <TableCell className="text-center">{consumo.cantidad}</TableCell>
                            <TableCell className="text-right">Q{consumo.precio.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-medium">Q{consumo.total.toFixed(2)}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => onRemoveConsumo(consumo.id)}>
                                Quitar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Right Column - 1fr equivalent */}
            <div className="space-y-6">
              {/* Subtotal section */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">Subtotal consumos</h3>
                <div className="text-2xl font-bold text-right">Q{subtotalConsumos.toFixed(2)}</div>
              </div>

              {/* Session info section */}
              {showSessionInfo && sessionInfo && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-4">Información de sesión</h3>
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">{sessionInfo.tarifa}</div>
                    {sessionInfo.jugadores && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Jugadores:</span>
                        <span className="font-medium">{sessionInfo.jugadores}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <DialogFooter className="flex-shrink-0 px-6 py-4 border-t gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cerrar
          </Button>
          <Button variant="outline" onClick={handleClose}>
            Volver a la sesión
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
