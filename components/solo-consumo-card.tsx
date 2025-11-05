"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, Receipt } from "lucide-react"
import { cn } from "@/lib/utils"
import { ResumenSoloConsumoModal } from "./resumen-solo-consumo-modal"
import { useStore } from "@/lib/store/store"
import { useState } from "react"

const normalizeSoloConsumoCode = (code?: string) => String(code ?? "").replace(/^C-/, "")

interface SoloConsumoCardProps {
  ticketId: string
  estado: "abierto" | "cerrado"
  total: number
  clienteNombre?: string
  className?: string
  currentTab?: string
  onFinalizarConsumo?: (ticketId: string) => void
  onAgregarConsumos?: (ticketId: string) => void
}

export function SoloConsumoCard({
  ticketId,
  estado,
  total,
  clienteNombre,
  className,
  currentTab = "solo-consumo",
  onFinalizarConsumo,
  onAgregarConsumos,
}: SoloConsumoCardProps) {
  const [showResumenModal, setShowResumenModal] = useState(false)

 const sesionSolo = useStore((s) =>
   s.sesiones.find((x) => x.id === `sesion-consumo-${normalizeSoloConsumoCode(ticketId)}`)
 )
  const itemsResumen = (sesionSolo?.consumos ?? []).map((c) => ({
    producto: c.nombre,
    cantidad: c.cantidad,
    precioUnitario: c.precio_unit,
    total: c.total_linea,
  }))
  const subtotalResumen = itemsResumen.reduce((a, b) => a + b.total, 0)

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "abierto":
        return "bg-green-600 text-white border-green-600"
      case "cerrado":
        return "bg-gray-100 text-gray-700 border-transparent"
      default:
        return "bg-gray-100 text-gray-700 border-transparent"
    }
  }

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case "abierto":
        return "Abierto"
      case "cerrado":
        return "Cerrado"
      default:
        return "Desconocido"
    }
  }

  const handleAgregarConsumos = () => {
    onAgregarConsumos?.(ticketId)
  }

  const handleFinalizarConsumo = () => {
    if (estado === "cerrado") {
      setShowResumenModal(true)
    } else {
      onFinalizarConsumo?.(ticketId)
    }
  }

  const handleDuplicarConsumo = (items: any[], newCode: string) => {
    // This would typically create a new consumption in the parent component's state
    // For now, we'll just close the modal and show the toast (handled in modal)
    console.log("[v0] Duplicating consumption with code:", newCode, "and items:", items)
  }

  return (
    <>
      <Card
        className={cn("hover:shadow-md transition-shadow overflow-hidden", className)}
        role="group"
        aria-labelledby={`consumo-${ticketId}-title`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs font-medium">
              Solo consumo
            </Badge>
            <Badge className={getEstadoColor(estado)}>{getEstadoTexto(estado)}</Badge>
          </div>
          <div className="space-y-1">
            <CardTitle id={`consumo-${ticketId}-title`} className="text-lg font-bold">
              Consumo {ticketId}
            </CardTitle>
            {clienteNombre && <p className="text-sm text-muted-foreground">Cliente: {clienteNombre}</p>}
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="w-full h-20 rounded-lg bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <Receipt className="w-8 h-8 mx-auto text-gray-500 mb-1" />
              <span className="text-sm text-gray-600">Solo productos</span>
            </div>
          </div>

          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <DollarSign className="w-3 h-3" />
              <span className="text-xs">Total parcial:</span>
              <span className="font-medium">Q{subtotalResumen.toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-2">
            {estado === "abierto" ? (
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button
                  className="w-full"
                  variant="default"
                  onClick={handleAgregarConsumos}
                  style={{ backgroundColor: "#16a34a", color: "white" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#15803d"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#16a34a"
                  }}
                >
                  Agregar consumos
                </Button>
                <Button className="w-full" variant="destructive" onClick={handleFinalizarConsumo}>
                  Finalizar consumo
                </Button>
              </div>
            ) : (
              <Button className="w-full" variant="secondary" onClick={handleFinalizarConsumo}>
                Ver resumen
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <ResumenSoloConsumoModal
        open={showResumenModal}
        onOpenChange={setShowResumenModal}
        ticketId={ticketId}
        items={itemsResumen}
        subtotal={subtotalResumen}
        fechaCierre="2024-01-15"
        operador="Operador"
        onDuplicarConsumo={handleDuplicarConsumo}
      />
    </>
  )
}
