"use client"

import { useState } from "react"
import { useCatalogStore } from "@/lib/admin/catalog-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AlertCircle, Save, Building2 } from "lucide-react"
import { toast } from "sonner"

export default function IdentidadPage() {
  const identidad = useCatalogStore((s) => s.getIdentidad())
  const updateIdentidad = useCatalogStore((s) => s.updateIdentidad)

  const [formData, setFormData] = useState({
    nombreComercial: identidad?.nombreComercial || "",
    textoContacto: identidad?.textoContacto || "",
  })

  const handleSave = () => {
    // Validation
    if (!formData.nombreComercial.trim()) {
      toast.error("El nombre comercial es obligatorio")
      return
    }

    updateIdentidad({
      nombreComercial: formData.nombreComercial.trim(),
      textoContacto: formData.textoContacto.trim() || undefined,
    })

    toast.success("Identidad actualizada correctamente")
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-16 md:pt-20">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Identidad</h1>
        <p className="text-muted-foreground">
          Personaliza el nombre comercial y la información de contacto del negocio
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Información del negocio</CardTitle>
          <CardDescription>Esta información se usa para encabezados y branding interno del sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nombre-comercial">
              Nombre comercial <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nombre-comercial"
              placeholder="Billares Chapinlandia"
              value={formData.nombreComercial}
              onChange={(e) => setFormData({ ...formData, nombreComercial: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Nombre que aparecerá en el sistema y reportes</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="moneda">Moneda</Label>
            <Input id="moneda" value="Q (Quetzal)" disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">La moneda es fija y no se puede cambiar</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="texto-contacto">Texto de contacto (opcional)</Label>
            <Textarea
              id="texto-contacto"
              placeholder="Tel: 2345-6789 | billares@chapinlandia.com"
              rows={3}
              value={formData.textoContacto}
              onChange={(e) => setFormData({ ...formData, textoContacto: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Información de contacto que puede aparecer en documentos internos
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

      {/* Preview Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Vista previa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-6 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{formData.nombreComercial || "Nombre del negocio"}</h3>
                <p className="text-sm text-muted-foreground">{formData.textoContacto || "Información de contacto"}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Así aparecerá la identidad en el sistema</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
