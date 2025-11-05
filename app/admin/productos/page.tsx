"use client"

import { useState } from "react"
import { useCatalogStore } from "@/lib/admin/catalog-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Plus, Search, Edit, Power, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import type { Producto } from "@/lib/admin/types"

const categorias = ["Bebidas", "Snacks", "Comida", "Postres", "Otros"]

export default function ProductosPage() {
  const productos = useCatalogStore((s) => s.productos)
  const addProducto = useCatalogStore((s) => s.addProducto)
  const updateProducto = useCatalogStore((s) => s.updateProducto)
  const toggleProductoActivo = useCatalogStore((s) => s.toggleProductoActivo)

  const [busqueda, setBusqueda] = useState("")
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas")
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    categoria: "",
    precio: "",
    activo: true,
  })

  const productosFiltrados = productos.filter((p) => {
    const matchBusqueda =
      busqueda === "" ||
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigo?.toLowerCase().includes(busqueda.toLowerCase())

    const matchCategoria = filtroCategoria === "todas" || p.categoria === filtroCategoria

    const matchEstado =
      filtroEstado === "todos" || (filtroEstado === "activo" && p.activo) || (filtroEstado === "inactivo" && !p.activo)

    return matchBusqueda && matchCategoria && matchEstado
  })

  const handleOpenDialog = (producto?: Producto) => {
    if (producto) {
      setEditingProducto(producto)
      setFormData({
        codigo: producto.codigo || "",
        nombre: producto.nombre,
        categoria: producto.categoria,
        precio: String(producto.precio),
        activo: producto.activo,
      })
    } else {
      setEditingProducto(null)
      setFormData({
        codigo: "",
        nombre: "",
        categoria: "",
        precio: "",
        activo: true,
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingProducto(null)
    setFormData({
      codigo: "",
      nombre: "",
      categoria: "",
      precio: "",
      activo: true,
    })
  }

  const handleSubmit = () => {
    // Validation
    if (!formData.nombre.trim()) {
      toast.error("El nombre del producto es obligatorio")
      return
    }
    if (!formData.categoria) {
      toast.error("La categoría es obligatoria")
      return
    }
    if (!formData.precio || Number(formData.precio) <= 0) {
      toast.error("El precio debe ser mayor a 0")
      return
    }

    if (editingProducto) {
      // Update existing
      updateProducto(editingProducto.id, {
        codigo: formData.codigo.trim() || undefined,
        nombre: formData.nombre.trim(),
        categoria: formData.categoria,
        precio: Number(formData.precio),
        activo: formData.activo,
      })
      toast.success("Producto actualizado correctamente")
    } else {
      // Create new
      const nuevoProducto: Producto = {
        id: `prod-${Date.now()}`,
        codigo: formData.codigo.trim() || undefined,
        nombre: formData.nombre.trim(),
        categoria: formData.categoria,
        precio: Number(formData.precio),
        activo: formData.activo,
      }
      addProducto(nuevoProducto)
      toast.success("Producto creado correctamente")
    }

    handleCloseDialog()
  }

  const handleToggleActivo = (id: string) => {
    toggleProductoActivo(id)
    const producto = productos.find((p) => p.id === id)
    if (producto) {
      toast.success(producto.activo ? "Producto inactivado" : "Producto activado")
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pt-16 md:pt-20">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Productos</h1>
        <p className="text-muted-foreground">Gestiona el catálogo de productos disponibles para consumo</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros y búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="busqueda">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="busqueda"
                  placeholder="Nombre o código..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="categoria">Categoría</Label>
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger id="categoria">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {categorias.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="estado">Estado</Label>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger id="estado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="activo">Activos</SelectItem>
                  <SelectItem value="inactivo">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">
          Mostrando {productosFiltrados.length} de {productos.length} productos
        </p>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Crear producto
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No se encontraron productos
                  </TableCell>
                </TableRow>
              ) : (
                productosFiltrados.map((producto) => (
                  <TableRow key={producto.id}>
                    <TableCell className="font-mono text-sm">
                      {producto.codigo || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="font-medium">{producto.nombre}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{producto.categoria}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">Q{producto.precio.toFixed(2)}</TableCell>
                    <TableCell>
                      {producto.activo ? (
                        <Badge variant="default" className="bg-success text-success-foreground">
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(producto)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActivo(producto.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Power className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingProducto ? "Editar producto" : "Crear producto"}</DialogTitle>
            <DialogDescription>
              {editingProducto
                ? "Modifica los datos del producto. Los cambios se aplicarán de inmediato."
                : "Completa los datos del nuevo producto."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="form-codigo">Código (opcional)</Label>
              <Input
                id="form-codigo"
                placeholder="BEB-001"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="form-nombre">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="form-nombre"
                placeholder="Coca Cola"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="form-categoria">
                Categoría <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.categoria} onValueChange={(val) => setFormData({ ...formData, categoria: val })}>
                <SelectTrigger id="form-categoria">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="form-precio">
                Precio (Q) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="form-precio"
                type="number"
                step="0.01"
                min="0"
                placeholder="10.00"
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="form-activo">Estado</Label>
              <Select
                value={formData.activo ? "activo" : "inactivo"}
                onValueChange={(val) => setFormData({ ...formData, activo: val === "activo" })}
              >
                <SelectTrigger id="form-activo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>{editingProducto ? "Guardar cambios" : "Crear producto"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
