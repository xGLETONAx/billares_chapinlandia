"use client"

import { useCatalogStore } from "@/lib/admin/catalog-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { AlertCircle, CreditCard, Banknote, ArrowLeftRight, Smartphone } from "lucide-react"
import { toast } from "sonner"

const iconMap: Record<string, any> = {
  Efectivo: Banknote,
  Tarjeta: CreditCard,
  Transferencia: ArrowLeftRight,
  Mixto: Smartphone,
}

export default function PagosPage() {
  const metodosPago = useCatalogStore((s) => s.metodosPago)
  const toggleMetodoPago = useCatalogStore((s) => s.toggleMetodoPago)

  const handleToggle = (id: string, nombre: string, currentState: boolean) => {
    // Check if trying to disable the last enabled method
    const habilitados = metodosPago.filter((m) => m.habilitado)
    if (habilitados.length === 1 && currentState) {
      toast.error("No se puede deshabilitar todos los métodos de pago")
      return
    }

    toggleMetodoPago(id)
    toast.success(currentState ? `${nombre} deshabilitado` : `${nombre} habilitado`)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-16 md:pt-20">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Métodos de pago</h1>
        <p className="text-muted-foreground">Habilita o deshabilita los métodos de pago disponibles en el sistema</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Métodos disponibles</CardTitle>
          <CardDescription>
            Los métodos habilitados aparecerán en el flujo de cobro. Debe haber al menos un método habilitado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {metodosPago.map((metodo) => {
            const Icon = iconMap[metodo.nombre] || CreditCard
            return (
              <div key={metodo.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Icon className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <Label htmlFor={metodo.id} className="text-base font-medium cursor-pointer">
                      {metodo.nombre}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {metodo.nombre === "Efectivo" && "Pago en efectivo al momento del cobro"}
                      {metodo.nombre === "Tarjeta" && "Pago con tarjeta de crédito o débito"}
                      {metodo.nombre === "Transferencia" && "Transferencia bancaria o electrónica"}
                      {metodo.nombre === "Mixto" && "Combinación de dos o más métodos de pago"}
                    </p>
                  </div>
                </div>
                <Switch
                  id={metodo.id}
                  checked={metodo.habilitado}
                  onCheckedChange={() => handleToggle(metodo.id, metodo.nombre, metodo.habilitado)}
                />
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
