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
import { Plus, Edit, Power, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import type { Motivo } from "@/lib/admin/types"

export default function MotivosPage() {
  const motivos = useCatalogStore((s) => s.getMotivos())
  const addMotivo = useCatalogStore((s) => s.addMotivo)
  const updateMotivo = useCatalogStore((s) => s.updateMotivo)
  const toggleMotivoActivo = useCatalogStore((s) => s.toggleMotivoActivo)

  const [activeTab, setActiveTab] = useState<"correccion" | "descuento">("correccion")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMotivo, setEditingMotivo] = useState<Motivo | null>(null)

  const [formData, setFormData] = useState({
    tipo: "correccion" as "correccion" | "descuento",
    descripcion: "",
    activo: true,
  })

  const motivosFiltrados = motivos.filter((m) => m.tipo === activeTab)

  const handleOpenDialog = (motivo?: Motivo) => {
    if (motivo) {
      setEditingMotivo(motivo)
      setFormData({
        tipo: motivo.tipo,
        descripcion: motivo.descripcion,
        activo: motivo.activo,
      })
    } else {
      setEditingMotivo(null)
      setFormData({
        tipo: activeTab,
        descripcion: "",
        activo: true,
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingMotivo(null)
    setFormData({
      tipo: "correccion",
      descripcion: "",
      activo: true,
    })
  }

  const handleSubmit = () => {
    if (!formData.descripcion.trim()) {
      toast.error("La descripción es obligatoria")
      return
    }

    if (editingMotivo) {
      updateMotivo(editingMotivo.id, {
        descripcion: formData.descripcion.trim(),
        activo: formData.activo,
      })
      toast.success("Motivo actualizado correctamente")
    } else {
      const nuevoMotivo: Motivo = {
        id: `motivo-${Date.now()}`,
        tipo: formData.tipo,
        descripcion: formData.descripcion.trim(),
        activo: formData.activo,
      }
      addMotivo(nuevoMotivo)
      toast.success("Motivo creado correctamente")
    }

    handleCloseDialog()
  }

  const handleToggleActivo = (id: string) => {
    toggleMotivoActivo(id)
    const motivo = motivos.find((m) => m.id === id)
    if (motivo) {
      toast.success(motivo.activo ? "Motivo inactivado" : "Motivo activado")
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pt-16 md:pt-20">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Motivos</h1>
        <p className="text-muted-foreground">Gestiona los motivos para correcciones de consumo y descuentos en cobro</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "correccion" | "descuento")}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="correccion">Corrección</TabsTrigger>
            <TabsTrigger value="descuento">Descuento</TabsTrigger>
          </TabsList>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="w-4 h-4" />
            Crear motivo
          </Button>
        </div>

        <TabsContent value="correccion">
          <Card>
            <CardHeader>
              <CardTitle>Motivos de corrección</CardTitle>
              <CardDescription>
                Obligatorios al corregir consumos. Aparecen en el selector cuando se modifica una línea de consumo.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {motivosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No hay motivos de corrección
                      </TableCell>
                    </TableRow>
                  ) : (
                    motivosFiltrados.map((motivo) => (
                      <TableRow key={motivo.id}>
                        <TableCell className="font-medium">{motivo.descripcion}</TableCell>
                        <TableCell>
                          {motivo.activo ? (
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
                              onClick={() => handleOpenDialog(motivo)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActivo(motivo.id)}
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
        </TabsContent>

        <TabsContent value="descuento">
          <Card>
            <CardHeader>
              <CardTitle>Motivos de descuento</CardTitle>
              <CardDescription>
                Opcionales al aplicar descuentos en cobro. Aparecen en el selector cuando se ingresa un descuento.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {motivosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No hay motivos de descuento
                      </TableCell>
                    </TableRow>
                  ) : (
                    motivosFiltrados.map((motivo) => (
                      <TableRow key={motivo.id}>
                        <TableCell className="font-medium">{motivo.descripcion}</TableCell>
                        <TableCell>
                          {motivo.activo ? (
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
                              onClick={() => handleOpenDialog(motivo)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActivo(motivo.id)}
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
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingMotivo ? "Editar motivo" : "Crear motivo"}</DialogTitle>
            <DialogDescription>
              {editingMotivo
                ? "Modifica los datos del motivo."
                : `Crea un nuevo motivo de ${activeTab === "correccion" ? "corrección" : "descuento"}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!editingMotivo && (
              <div className="space-y-2">
                <Label htmlFor="form-tipo">Tipo</Label>
                <Select value={formData.tipo} onValueChange={(val: any) => setFormData({ ...formData, tipo: val })}>
                  <SelectTrigger id="form-tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="correccion">Corrección</SelectItem>
                    <SelectItem value="descuento">Descuento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="form-descripcion">
                Descripción <span className="text-destructive">*</span>
              </Label>
              <Input
                id="form-descripcion"
                placeholder="Error en cantidad"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
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
            <Button onClick={handleSubmit}>{editingMotivo ? "Guardar cambios" : "Crear motivo"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
