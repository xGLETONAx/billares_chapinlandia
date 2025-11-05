"use client"

import type React from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useState } from "react"

interface CrearConsumoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCrearConsumo: (clienteNombre: string, nota?: string) => void
}

export function CrearConsumoDialog({ open, onOpenChange, onCrearConsumo }: CrearConsumoDialogProps) {
  const [clienteNombre, setClienteNombre] = useState("")
  const [nota, setNota] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!clienteNombre.trim()) {
      return
    }

    setIsSubmitting(true)

    try {
      onCrearConsumo(clienteNombre.trim(), nota.trim() || undefined)

      // Reset form
      setClienteNombre("")
      setNota("")
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setClienteNombre("")
    setNota("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Crear consumo</DialogTitle>
          <DialogDescription className="sr-only">Formulario para crear un nuevo consumo</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cliente-nombre" className="text-sm font-medium">
              Nombre del cliente *
            </Label>
            <Input
              id="cliente-nombre"
              type="text"
              placeholder="Ingresa el nombre del cliente"
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              required
              className="w-full"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nota" className="text-sm font-medium">
              Nota (opcional)
            </Label>
            <Textarea
              id="nota"
              placeholder="Agregar una nota corta..."
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              className="w-full resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1 bg-transparent"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!clienteNombre.trim() || isSubmitting}
              className="flex-1 !bg-green-600 !text-white hover:!bg-green-700"
            >
              {isSubmitting ? "Creando..." : "Crear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
