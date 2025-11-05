"use client"

import { useState, useMemo } from "react"
import { useCatalogStore } from "@/lib/admin/catalog-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { Search, Package, AlertTriangle, Edit2 } from "lucide-react"

export default function StockPage() {
  const { toast } = useToast()
  const productos = useCatalogStore((s) => s.productos)
  const motivos = useCatalogStore((s) => s.motivos)
  const registrarMovimiento = useCatalogStore((s) => s.registrarMovimiento)
  const updateProductoStock = useCatalogStore((s) => s.updateProductoStock)

  const [searchTerm, setSearchTerm] = useState("")
  const [showCriticalOnly, setShowCriticalOnly] = useState(false)
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false)
  const [selectedProducto, setSelectedProducto] = useState<string | null>(null)

  // Adjust stock form
  const [cantidad, setCantidad] = useState("")
  const [motivoId, setMotivoId] = useState("")
  const [observacion, setObservacion] = useState("")
  const [motivoTexto, setMotivoTexto] = useState("")

  // Edit stock config form
  const [editAfectaStock, setEditAfectaStock] = useState(true)
  const [editStockMinimo, setEditStockMinimo] = useState(0)
  const [pendingAfectaStock, setPendingAfectaStock] = useState(false)

  const motivosCorreccion = useMemo(() => motivos.filter((m) => m.tipo === "correccion" && m.activo), [motivos])

  const filteredProductos = useMemo(() => {
    let filtered = productos

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.nombre.toLowerCase().includes(term) ||
          p.categoria.toLowerCase().includes(term) ||
          p.codigo?.toLowerCase().includes(term),
      )
    }

    // Critical filter
    if (showCriticalOnly) {
      filtered = filtered.filter(
        (p) =>
          p.afectaStock && p.stockActual !== undefined && p.stockMinimo !== undefined && p.stockActual <= p.stockMinimo,
      )
    }

    return filtered
  }, [productos, searchTerm, showCriticalOnly])

  const handleOpenAdjust = (productoId: string) => {
    setSelectedProducto(productoId)
    setCantidad("")
    setMotivoId("")
    setObservacion("")
    setMotivoTexto("")
    setAdjustDialogOpen(true)
  }

  const handleOpenEdit = (productoId: string) => {
    const producto = productos.find((p) => p.id === productoId)
    if (!producto) return

    setSelectedProducto(productoId)
    setEditAfectaStock(producto.afectaStock ?? true)
    setEditStockMinimo(producto.stockMinimo ?? 0)
    setEditDialogOpen(true)
  }

  const handleAdjustStock = () => {
    if (!selectedProducto) return

    const producto = productos.find((p) => p.id === selectedProducto)
    if (!producto) return

    // Validations
    if (!cantidad || cantidad === "0") {
      toast({
        title: "Error",
        description: "Ingresa una cantidad válida (ej. +5 o -2)",
        variant: "destructive",
      })
      return
    }

    if (!motivoId) {
      toast({
        title: "Error",
        description: "Selecciona un motivo",
        variant: "destructive",
      })
      return
    }

    if (motivoId === "otro" && !motivoTexto.trim()) {
      toast({
        title: "Error",
        description: "El detalle es obligatorio para 'Otro'",
        variant: "destructive",
      })
      return
    }

    const cantidadNum = Number.parseFloat(cantidad)
    if (isNaN(cantidadNum)) {
      toast({
        title: "Error",
        description: "La cantidad debe ser un número válido",
        variant: "destructive",
      })
      return
    }

    registrarMovimiento({
      productoId: selectedProducto,
      fechaISO: new Date().toISOString(),
      tipo: "ajuste",
      cantidad: cantidadNum,
      usuario: "Sistema", // TODO: use actual user
      observacion: observacion || undefined,
      motivo_id: motivoId === "otro" ? null : motivoId,
      motivo_texto: motivoId === "otro" ? motivoTexto : null,
    })

    toast({
      title: "Ajuste aplicado",
      description: "Stock actualizado correctamente",
    })

    setAdjustDialogOpen(false)
  }

  const handleEditStock = () => {
    if (!selectedProducto) return

    const producto = productos.find((p) => p.id === selectedProducto)
    if (!producto) return

    // Validation
    if (editStockMinimo < 0) {
      toast({
        title: "Error",
        description: "El mínimo no puede ser negativo",
        variant: "destructive",
      })
      return
    }

    // Check if disabling afectaStock
    if (producto.afectaStock && !editAfectaStock) {
      setPendingAfectaStock(true)
      setConfirmDisableOpen(true)
      return
    }

    // Save changes
    updateProductoStock(selectedProducto, editAfectaStock, editStockMinimo)

    toast({
      title: "Cambios guardados",
      description: "Configuración de inventario actualizada",
    })

    setEditDialogOpen(false)
  }

  const handleConfirmDisable = () => {
    if (!selectedProducto) return

    updateProductoStock(selectedProducto, false, editStockMinimo)

    toast({
      title: "Cambios guardados",
      description: "Este producto ya no afecta inventario",
    })

    setConfirmDisableOpen(false)
    setEditDialogOpen(false)
  }

  const selectedProductoData = selectedProducto ? productos.find((p) => p.id === selectedProducto) : null

  return (
    <TooltipProvider>
      <div className="space-y-6 px-4 pt-16 md:pt-20">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Stock</h1>
          <p className="text-muted-foreground">Gestiona el inventario actual de productos</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, categoría o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="critical-only" checked={showCriticalOnly} onCheckedChange={setShowCriticalOnly} />
            <Label htmlFor="critical-only" className="cursor-pointer">
              Solo críticos
            </Label>
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-center">Afecta stock</TableHead>
                <TableHead className="text-right">Stock actual</TableHead>
                <TableHead className="text-right">Mínimo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProductos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No se encontraron productos</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProductos.map((producto) => {
                  const isCritical =
                    producto.afectaStock &&
                    producto.stockActual !== undefined &&
                    producto.stockMinimo !== undefined &&
                    producto.stockActual <= producto.stockMinimo

                  return (
                    <TableRow key={producto.id}>
                      <TableCell className="font-medium">{producto.nombre}</TableCell>
                      <TableCell>{producto.categoria}</TableCell>
                      <TableCell className="text-center">
                        {producto.afectaStock ? (
                          <Badge variant="outline">Sí</Badge>
                        ) : (
                          <Badge variant="secondary">No afecta</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {producto.afectaStock ? (producto.stockActual ?? 0) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {producto.afectaStock ? (producto.stockMinimo ?? 0) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {producto.activo ? (
                            <Badge variant="default">Activo</Badge>
                          ) : (
                            <Badge variant="secondary">Inactivo</Badge>
                          )}
                          {isCritical && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Crítico
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!producto.afectaStock ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button size="sm" variant="outline" disabled>
                                    Ajustar
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Este producto no lleva inventario</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => handleOpenAdjust(producto.id)}>
                              Ajustar
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(producto.id)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Adjust Stock Dialog */}
        <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajustar stock</DialogTitle>
              <DialogDescription>
                Registra una entrada (+) o salida (−) del inventario.
                {selectedProductoData && (
                  <span className="block mt-1 font-medium text-foreground">{selectedProductoData.nombre}</span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cantidad">Cantidad</Label>
                <Input
                  id="cantidad"
                  placeholder="Ej. +5 o −2"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="motivo">Motivo (obligatorio)</Label>
                <Select value={motivoId} onValueChange={setMotivoId}>
                  <SelectTrigger id="motivo">
                    <SelectValue placeholder="Selecciona un motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {motivosCorreccion.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.descripcion}
                      </SelectItem>
                    ))}
                    <SelectItem value="otro">Otro (especificar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {motivoId === "otro" && (
                <div>
                  <Label htmlFor="motivo-texto">Detalle (obligatorio)</Label>
                  <Textarea
                    id="motivo-texto"
                    placeholder="Describe el motivo del ajuste…"
                    value={motivoTexto}
                    onChange={(e) => setMotivoTexto(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
              <div>
                <Label htmlFor="observacion">Observación (opcional)</Label>
                <Textarea
                  id="observacion"
                  placeholder="Notas adicionales…"
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAdjustStock}>Registrar ajuste</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Stock Config Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar inventario</DialogTitle>
              <DialogDescription>
                Configura cómo se gestiona el inventario de este producto.
                {selectedProductoData && (
                  <span className="block mt-1 font-medium text-foreground">{selectedProductoData.nombre}</span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="afecta-stock">Afecta stock</Label>
                  <p className="text-sm text-muted-foreground">
                    Si está desactivado, este producto no registra movimientos ni alertas
                  </p>
                </div>
                <Switch id="afecta-stock" checked={editAfectaStock} onCheckedChange={setEditAfectaStock} />
              </div>
              <div>
                <Label htmlFor="stock-minimo">Stock mínimo</Label>
                <Input
                  id="stock-minimo"
                  type="number"
                  min="0"
                  value={editStockMinimo}
                  onChange={(e) => setEditStockMinimo(Number.parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditStock}>Guardar cambios</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirm Disable Alert */}
        <AlertDialog open={confirmDisableOpen} onOpenChange={setConfirmDisableOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Desactivar control de inventario</AlertDialogTitle>
              <AlertDialogDescription>
                Este producto dejará de registrar movimientos en Kárdex. ¿Deseas continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDisable}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}
