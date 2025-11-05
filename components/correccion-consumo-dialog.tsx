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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useState, useMemo } from "react"
import { useCatalogStore } from "@/lib/admin/catalog-store"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CorreccionConsumoDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (motivoId: string, motivoTexto: string) => void
}

export function CorreccionConsumoDialog({ isOpen, onClose, onConfirm }: CorreccionConsumoDialogProps) {
  const [motivoId, setMotivoId] = useState("")
  const [detalle, setDetalle] = useState("")

  const motivos = useCatalogStore((s) => s.motivos)
  const motivosCorreccion = useMemo(() => motivos.filter((m) => m.tipo === "correccion" && m.activo), [motivos])

  const handleConfirm = () => {
    if (!motivoId) {
      return
    }

    if (motivoId === "otro" && !detalle.trim()) {
      return
    }

    const motivoTexto = motivoId === "otro" ? detalle : ""
    onConfirm(motivoId, motivoTexto)

    // Reset form
    setMotivoId("")
    setDetalle("")
    onClose()
  }

  const handleCancel = () => {
    setMotivoId("")
    setDetalle("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Motivo de corrección</DialogTitle>
          <DialogDescription>
            Por favor, indica el motivo por el cual necesitas corregir los consumos. Este campo es obligatorio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo *</Label>
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
            <div className="space-y-2">
              <Label htmlFor="detalle">Detalle *</Label>
              <Textarea
                id="detalle"
                placeholder="Especifica el motivo de la corrección"
                value={detalle}
                onChange={(e) => setDetalle(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!motivoId || (motivoId === "otro" && !detalle.trim())}>
            Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
