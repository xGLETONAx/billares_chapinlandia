"use client"

import { useState } from "react"
import { useCatalogStore } from "@/lib/admin/catalog-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { AlertCircle, Save } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ReglasPage() {
  const reglaBillar = useCatalogStore((s) => s.getReglaCobro("billar"))
  const reglaJuegos = useCatalogStore((s) => s.getReglaCobro("juegos"))
  const updateReglaCobro = useCatalogStore((s) => s.updateReglaCobro)

  const [showWarning, setShowWarning] = useState(false)

  // Billar form state
  const [billarForm, setBillarForm] = useState({
    duracionBloque: String(reglaBillar?.duracionBloque || 30),
    precioBloque: String(reglaBillar?.precioBloque || 10),
    cobrarPrimerBloque: reglaBillar?.cobrarPrimerBloque ?? true,
    tolerancia: String(reglaBillar?.tolerancia || 10),
  })

  // Juegos form state
  const [juegosForm, setJuegosForm] = useState({
    precioPorJugadorHora: String(reglaJuegos?.precioPorJugadorHora || 6),
  })

  const handleSaveBillar = () => {
    // Validation
    if (Number(billarForm.duracionBloque) <= 0) {
      toast.error("La duración del bloque debe ser mayor a 0")
      return
    }
    if (Number(billarForm.precioBloque) <= 0) {
      toast.error("El precio del bloque debe ser mayor a 0")
      return
    }
    if (Number(billarForm.tolerancia) < 0) {
      toast.error("La tolerancia no puede ser negativa")
      return
    }

    updateReglaCobro("billar", {
      duracionBloque: Number(billarForm.duracionBloque),
      precioBloque: Number(billarForm.precioBloque),
      cobrarPrimerBloque: billarForm.cobrarPrimerBloque,
      tolerancia: Number(billarForm.tolerancia),
    })

    setShowWarning(true)
    toast.success("Reglas de billar actualizadas")

    // Hide warning after 5 seconds
    setTimeout(() => setShowWarning(false), 5000)
  }

  const handleSaveJuegos = () => {
    // Validation
    if (Number(juegosForm.precioPorJugadorHora) <= 0) {
      toast.error("El precio por jugador/hora debe ser mayor a 0")
      return
    }

    updateReglaCobro("juegos", {
      precioPorJugadorHora: Number(juegosForm.precioPorJugadorHora),
    })

    setShowWarning(true)
    toast.success("Reglas de juegos de mesa actualizadas")

    // Hide warning after 5 seconds
    setTimeout(() => setShowWarning(false), 5000)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-16 md:pt-20">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Reglas de cobro</h1>
        <p className="text-muted-foreground">Configura las tarifas y reglas para billar y juegos de mesa</p>
      </div>

      {showWarning && (
        <Alert className="mb-6 border-warning bg-warning/10">
          <AlertCircle className="h-4 w-4 text-warning-foreground" />
          <AlertDescription className="text-warning-foreground">
            Los cambios aplican a nuevos cálculos (sesiones nuevas o próximos redondeos). Las sesiones abiertas
            mantendrán las reglas anteriores hasta que se recalculen.
          </AlertDescription>
        </Alert>
      )}

      {/* Billar Rules */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Billar</CardTitle>
          <CardDescription>Configura la duración de bloques, precio y tolerancia para mesas de billar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duracion-bloque">Duración del bloque (minutos)</Label>
              <Input
                id="duracion-bloque"
                type="number"
                min="1"
                value={billarForm.duracionBloque}
                onChange={(e) => setBillarForm({ ...billarForm, duracionBloque: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Tiempo estándar por bloque de juego</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="precio-bloque">Precio por bloque (Q)</Label>
              <Input
                id="precio-bloque"
                type="number"
                step="0.01"
                min="0"
                value={billarForm.precioBloque}
                onChange={(e) => setBillarForm({ ...billarForm, precioBloque: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Costo de cada bloque de tiempo</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tolerancia">Tolerancia (minutos)</Label>
            <Input
              id="tolerancia"
              type="number"
              min="0"
              value={billarForm.tolerancia}
              onChange={(e) => setBillarForm({ ...billarForm, tolerancia: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Tiempo de gracia antes de cobrar el siguiente bloque (ej: 10 minutos)
            </p>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="cobrar-primer-bloque">Cobrar primer bloque al abrir</Label>
              <p className="text-xs text-muted-foreground">
                Si está activado, se cobra el primer bloque inmediatamente al iniciar la sesión
              </p>
            </div>
            <Switch
              id="cobrar-primer-bloque"
              checked={billarForm.cobrarPrimerBloque}
              onCheckedChange={(checked) => setBillarForm({ ...billarForm, cobrarPrimerBloque: checked })}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveBillar} className="gap-2">
              <Save className="w-4 h-4" />
              Guardar cambios
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Juegos de Mesa Rules */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Juegos de mesa</CardTitle>
          <CardDescription>Configura el precio por jugador por hora para juegos de mesa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="precio-jugador-hora">Precio por jugador por hora (Q)</Label>
            <Input
              id="precio-jugador-hora"
              type="number"
              step="0.01"
              min="0"
              value={juegosForm.precioPorJugadorHora}
              onChange={(e) => setJuegosForm({ ...juegosForm, precioPorJugadorHora: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Tarifa que se multiplica por el número de jugadores y las horas jugadas
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveJuegos} className="gap-2">
              <Save className="w-4 h-4" />
              Guardar cambios
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
