"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface NuevaMesaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoria: "billar" | "juegos"
  onCrearMesa: (codigo: string, tipoMesa?: string) => void
  siguienteNumero: number
}

export function NuevaMesaDialog({ open, onOpenChange, categoria, onCrearMesa, siguienteNumero }: NuevaMesaDialogProps) {
  const [codigo, setCodigo] = useState("")
  const [tipoMesa, setTipoMesa] = useState<string>("")

  // Set default values when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      if (categoria === "billar") {
        setCodigo(`Mesa ${siguienteNumero}`)
        setTipoMesa("billar-30")
      } else {
        setCodigo(`Mesa JM-${siguienteNumero}`)
        setTipoMesa("")
      }
    } else {
      setCodigo("")
      setTipoMesa("")
    }
    onOpenChange(newOpen)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (codigo.trim()) {
      // Pass the selected table type for billar, "juegos-60" for juegos
      onCrearMesa(codigo.trim(), categoria === "billar" ? tipoMesa : "juegos-60")
      handleOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nueva mesa</DialogTitle>
          <DialogDescription className="sr-only">
            Formulario para crear una nueva mesa de {categoria === "billar" ? "billar" : "juegos de mesa"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="codigo">Código</Label>
            <Input
              id="codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder={categoria === "billar" ? "Mesa 9" : "Mesa JM-5"}
              required
            />
          </div>

          {categoria === "billar" && (
            <div className="space-y-2">
              <Label htmlFor="tipo-mesa">Tipo de mesa</Label>
              <Select value={tipoMesa} onValueChange={setTipoMesa} required>
                <SelectTrigger id="tipo-mesa">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="billar-30">Billar 30′</SelectItem>
                  <SelectItem value="carambola-30">Carambola 30′</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Crear</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
