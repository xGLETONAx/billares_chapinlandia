"use client"

import { useState } from "react"
import { useCatalogStore } from "@/lib/admin/catalog-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AlertCircle, Save } from "lucide-react"
import { toast } from "sonner"

export default function CorrelativosPage() {
  const correlativo = useCatalogStore((s) => s.getCorrelativo())
  const updateCorrelativo = useCatalogStore((s) => s.updateCorrelativo)

  const [formData, setFormData] = useState({
    prefijo: correlativo?.prefijo || "C-",
    longitud: String(correlativo?.longitud || 3),
    proximoNumero: String(correlativo?.proximoNumero || 1),
  })

  const getEjemplo = () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, "0")
    const d = String(now.getDate()).padStart(2, "0")
    const num = String(formData.proximoNumero).padStart(Number(formData.longitud), "0")
    return `${formData.prefijo}${y}${m}${d}-${num}`
  }

  const handleSave = () => {
    // Validation
    if (!formData.prefijo.trim()) {
      toast.error("El prefijo es obligatorio")
      return
    }
    if (Number(formData.longitud) < 1 || Number(formData.longitud) > 10) {
      toast.error("La longitud debe estar entre 1 y 10")
      return
    }
    if (Number(formData.proximoNumero) < 1) {
      toast.error("El próximo número debe ser mayor a 0")
      return
    }

    updateCorrelativo({
      prefijo: formData.prefijo.trim(),
      longitud: Number(formData.longitud),
      proximoNumero: Number(formData.proximoNumero),
    })

    toast.success("Configuración de correlativos actualizada")
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-16 md:pt-20">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Correlativos</h1>
        <p className="text-muted-foreground">Configura el formato de códigos para tickets de solo consumo (sin mesa)</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Configuración de correlativos</CardTitle>
          <CardDescription>
            Define el prefijo, longitud y próximo número para generar códigos únicos de tickets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prefijo">Prefijo</Label>
              <Input
                id="prefijo"
                placeholder="C-"
                value={formData.prefijo}
                onChange={(e) => setFormData({ ...formData, prefijo: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Texto que precede al código (ej: C-, TKT-)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitud">Longitud</Label>
              <Input
                id="longitud"
                type="number"
                min="1"
                max="10"
                value={formData.longitud}
                onChange={(e) => setFormData({ ...formData, longitud: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Dígitos del número secuencial (1-10)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proximo-numero">Próximo número</Label>
              <Input
                id="proximo-numero"
                type="number"
                min="1"
                value={formData.proximoNumero}
                onChange={(e) => setFormData({ ...formData, proximoNumero: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Siguiente número a asignar</p>
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-muted/50">
            <Label className="text-sm font-medium">Vista previa</Label>
            <p className="text-lg font-mono mt-2">{getEjemplo()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Formato: {formData.prefijo}AAAAMMDD-{String(0).padStart(Number(formData.longitud), "0")}
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" />
              Guardar cambios
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
