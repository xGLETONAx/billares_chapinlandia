"use client"

import { useState } from "react"
import { useCatalogStore } from "@/lib/admin/catalog-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Package, AlertTriangle, TrendingUp, TrendingDown, Search, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export default function InventarioPage() {
  const productos = useCatalogStore((s) => s.getProductosActivos())
  const addMovimiento = useCatalogStore((s) => s.addMovimiento)
  const getStockActual = useCatalogStore((s) => s.getStockActual)
  const getKardex = useCatalogStore((s) => s.getKardex)

  const [activeTab, setActiveTab] = useState<"stock" | "kardex">("stock")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [productoSeleccionado, setProductoSeleccionado] = useState("")
  const [tipoMovimiento, setTipoMovimiento] = useState<"entrada" | "salida">("entrada")
  const [cantidad, setCantidad] = useState("")
  const [motivo, setMotivo] = useState("")

  const productosConStock = productos.map((p) => ({
    ...p,
    stock: getStockActual(p.id),
  }))

  const productosFiltrados = productosConStock.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigo?.toLowerCase().includes(busqueda.toLowerCase()),
  )

  const handleOpenDialog = () => {
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setProductoSeleccionado("")
    setTipoMovimiento("entrada")
    setCantidad("")
    setMotivo("")
  }

  const handleSubmit = () => {
    if (!productoSeleccionado) {
      toast.error("Selecciona un producto")
      return
    }
    if (!cantidad || Number(cantidad) <= 0) {
      toast.error("Ingresa una cantidad válida")
      return
    }
    if (!motivo.trim()) {
      toast.error("Ingresa un motivo")
      return
    }

    const producto = productos.find((p) => p.id === productoSeleccionado)
    if (!producto) return

    addMovimiento({
      id: `mov-${Date.now()}`,
      producto_id: productoSeleccionado,
      producto_nombre: producto.nombre,
      tipo: tipoMovimiento,
      cantidad: Number(cantidad),
      motivo: motivo.trim(),
      fecha: new Date().toISOString(),
      usuario: "Operador",
    })

    toast.success(`Movimiento de ${tipoMovimiento} registrado correctamente`)
    handleCloseDialog()
  }

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="w-3 h-3" />
          Sin stock
        </Badge>
      )
    }
    if (stock < 10) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 gap-1">
          <AlertTriangle className="w-3 h-3" />
          Stock bajo
        </Badge>
      )
    }
    return (
      <Badge variant="default" className="bg-success text-success-foreground gap-1">
        <Package className="w-3 h-3" />
        Disponible
      </Badge>
    )
  }

  const kardexCompleto = productos.flatMap((p) => {
    const movimientos = getKardex(p.id)
    return movimientos.map((m) => ({
      ...m,
      producto_nombre: p.nombre,
      producto_codigo: p.codigo,
    }))
  })

  const kardexFiltrado = kardexCompleto
    .filter(
      (m) =>
        m.producto_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        m.producto_codigo?.toLowerCase().includes(busqueda.toLowerCase()) ||
        m.motivo.toLowerCase().includes(busqueda.toLowerCase()),
    )
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Inventario</h1>
        <p className="text-muted-foreground">Gestiona el stock de productos y consulta el kardex de movimientos</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "stock" | "kardex")}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="stock">Stock actual</TabsTrigger>
            <TabsTrigger value="kardex">Kardex</TabsTrigger>
          </TabsList>
          <Button onClick={handleOpenDialog} className="gap-2">
            <Plus className="w-4 h-4" />
            Registrar movimiento
          </Button>
        </div>

        <TabsContent value="stock">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Stock de productos</CardTitle>
                  <CardDescription>Consulta las existencias actuales de cada producto</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar producto..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Stock actual</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No se encontraron productos
                      </TableCell>
                    </TableRow>
                  ) : (
                    productosFiltrados.map((producto) => (
                      <TableRow key={producto.id}>
                        <TableCell className="font-mono text-sm">{producto.codigo || "—"}</TableCell>
                        <TableCell className="font-medium">{producto.nombre}</TableCell>
                        <TableCell className="text-center">
                          <span className="font-bold text-lg">{producto.stock}</span>
                        </TableCell>
                        <TableCell className="text-right">Q{producto.precio.toFixed(2)}</TableCell>
                        <TableCell>{getStockBadge(producto.stock)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total productos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{productos.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Con stock bajo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {productosConStock.filter((p) => p.stock > 0 && p.stock < 10).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Sin stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {productosConStock.filter((p) => p.stock === 0).length}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="kardex">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Kardex de movimientos</CardTitle>
                  <CardDescription>Historial completo de entradas y salidas de inventario</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar movimiento..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Usuario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kardexFiltrado.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No hay movimientos registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    kardexFiltrado.map((movimiento) => (
                      <TableRow key={movimiento.id}>
                        <TableCell className="font-mono text-sm">
                          {new Date(movimiento.fecha).toLocaleString("es-GT", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{movimiento.producto_nombre}</div>
                            {movimiento.producto_codigo && (
                              <div className="text-xs text-muted-foreground">{movimiento.producto_codigo}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {movimiento.tipo === "entrada" ? (
                            <Badge variant="default" className="bg-success text-success-foreground gap-1">
                              <TrendingUp className="w-3 h-3" />
                              Entrada
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <TrendingDown className="w-3 h-3" />
                              Salida
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-bold">{movimiento.cantidad}</span>
                        </TableCell>
                        <TableCell className="text-sm">{movimiento.motivo}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{movimiento.usuario}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-6 bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Criterios de aceptación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Stock actual: muestra existencias de cada producto con alertas visuales</p>
          <p>• Kardex: historial completo de movimientos (entradas/salidas) ordenado por fecha descendente</p>
          <p>• Registrar movimiento: entrada o salida con cantidad, motivo y usuario</p>
          <p>• El stock se actualiza automáticamente con cada movimiento</p>
        </CardContent>
      </Card>

      {/* Register Movement Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar movimiento de inventario</DialogTitle>
            <DialogDescription>Registra una entrada o salida de productos del inventario</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="form-producto">
                Producto <span className="text-destructive">*</span>
              </Label>
              <Select value={productoSeleccionado} onValueChange={setProductoSeleccionado}>
                <SelectTrigger id="form-producto">
                  <SelectValue placeholder="Seleccionar producto..." />
                </SelectTrigger>
                <SelectContent>
                  {productos.map((producto) => (
                    <SelectItem key={producto.id} value={producto.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{producto.nombre}</span>
                        <span className="ml-4 text-xs text-muted-foreground">Stock: {getStockActual(producto.id)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="form-tipo">
                Tipo de movimiento <span className="text-destructive">*</span>
              </Label>
              <Select value={tipoMovimiento} onValueChange={(val: any) => setTipoMovimiento(val)}>
                <SelectTrigger id="form-tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada (aumenta stock)</SelectItem>
                  <SelectItem value="salida">Salida (disminuye stock)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="form-cantidad">
                Cantidad <span className="text-destructive">*</span>
              </Label>
              <Input
                id="form-cantidad"
                type="number"
                min="1"
                placeholder="0"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="form-motivo">
                Motivo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="form-motivo"
                placeholder="Compra, venta, ajuste, merma, etc."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>Registrar movimiento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
