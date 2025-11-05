"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Clock, Users, DollarSign, ShoppingCart, MoreVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface MesaCardProps {
  numero: number
  tipo: string
  estado: "libre" | "abiertaPropia" | "abiertaOtro" | "pendiente_cobro"
  tiempoInicio?: string
  jugadores?: number
  consumo?: number
  tipoJuego?: string
  sesionId?: string
  className?: string
  deshabilitada?: boolean
  onIniciarSesion?: (numero: number) => void
  onFinalizarSesion?: (numero: number) => void
  onAbrirCarrito?: (numero: number, tipo: string, tipoJuego?: string) => void
  onToggleHabilitar?: (numero: number) => void
  onEliminar?: (numero: number) => void
  currentTab?: string
  timerHHMM?: string
}

export function MesaCard({
  numero,
  tipo,
  estado,
  tiempoInicio,
  jugadores,
  consumo,
  tipoJuego,
  sesionId,
  className,
  deshabilitada = false,
  onIniciarSesion,
  onFinalizarSesion,
  onAbrirCarrito,
  onToggleHabilitar,
  onEliminar,
  currentTab = "billar",
  timerHHMM,
}: MesaCardProps) {
  const router = useRouter()

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "libre":
        return "bg-success text-success-foreground"
      case "abiertaPropia":
        return "bg-destructive text-destructive-foreground"
      case "abiertaOtro":
        return "bg-warning text-warning-foreground"
      case "pendiente_cobro":
        return "bg-blue-500 text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case "libre":
        return "Libre"
      case "abiertaPropia":
        return "Abierta"
      case "abiertaOtro":
        return "Abierta (Otro)"
      case "pendiente_cobro":
        return "Pendiente cobro"
      default:
        return "Desconocido"
    }
  }

  const getTimerStyles = (estado: string) => {
    switch (estado) {
      case "libre":
        return "text-gray-500 bg-gray-100"
      case "abiertaPropia":
        return "text-brand bg-green-50"
      case "abiertaOtro":
        return "text-yellow-700 bg-yellow-50"
      case "pendiente_cobro":
        return "text-blue-700 bg-blue-50"
      default:
        return "text-gray-500 bg-gray-100"
    }
  }

  const getChipTipoJuego = () => {
    if (tipo === "Billar" || tipo === "Carambola") {
      return `${tipo} 30′`
    }
    if (tipoJuego) {
      const nombreJuego = tipoJuego.split("-")[0]
      return `${nombreJuego.charAt(0).toUpperCase() + nombreJuego.slice(1)} 60′`
    }
    return `${tipo} 60′`
  }

  const esJuegoMesa = tipo !== "Billar" && tipo !== "Carambola"

  const handleCarritoClick = () => {
    if (deshabilitada) return
    onAbrirCarrito?.(numero, tipo, tipoJuego)
  }

  const handleIniciarClick = () => {
    if (deshabilitada) return
    onIniciarSesion?.(numero)
  }

  const handleFinalizarClick = () => {
    if (deshabilitada) return
    onFinalizarSesion?.(numero)
  }

  const puedeEliminar = estado === "libre" && !deshabilitada

  return (
    <Card
      className={cn("hover:shadow-md transition-shadow", deshabilitada && "opacity-60 bg-gray-50", className)}
      role="group"
      aria-labelledby={`mesa-${numero}-title`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          {estado !== "libre" && (
  <Badge variant="outline" className="text-xs font-medium">
    {getChipTipoJuego()}
  </Badge>
)}
          <div className="flex items-center gap-2">
            {deshabilitada && (
              <Badge variant="secondary" className="text-xs">
                Deshabilitada
              </Badge>
            )}
            <Badge className={getEstadoColor(estado)}>{getEstadoTexto(estado)}</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Opciones de mesa</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onToggleHabilitar?.(numero)}>
                  {deshabilitada ? "Habilitar" : "Deshabilitar"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onEliminar?.(numero)}
                  disabled={!puedeEliminar}
                  className={!puedeEliminar ? "opacity-50 cursor-not-allowed" : ""}
                >
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <CardTitle id={`mesa-${numero}-title`} className="text-lg font-bold">
          Mesa {numero}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className={cn("w-full h-20 rounded-lg flex items-center justify-center", getTimerStyles(estado))}>
  <span className="text-3xl font-mono font-bold tracking-wider">
    {estado !== "libre" ? (timerHHMM ?? "00:00") : "00:00"}
  </span>
</div>

        {estado !== "libre" && (
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span className="text-xs">Inicio:</span>
              <span className="font-medium">{tiempoInicio || "00:00"}</span>
            </div>

            {esJuegoMesa && (
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span className="text-xs">Jugadores:</span>
                <span className="font-medium">{jugadores || 2}</span>
              </div>
            )}

            <div className="flex items-center space-x-1">
              <DollarSign className="w-3 h-3" />
              <span className="text-xs">Monto:</span>
              <span className="font-medium">Q{consumo?.toFixed(2) || "0.00"}</span>
            </div>
          </div>
        )}

        <div className="pt-2 space-y-2">
          <div className="flex gap-2">
            {estado === "libre" ? (
              <Button
                className="flex-1"
                variant="default"
                aria-label={`Iniciar sesión en mesa ${numero}`}
                onClick={handleIniciarClick}
                disabled={deshabilitada}
              >
                Iniciar sesión
              </Button>
            ) : estado === "abiertaPropia" ? (
              <Button
                className="flex-1"
                variant="destructive"
                aria-label={`Finalizar sesión de mesa ${numero}`}
                onClick={handleFinalizarClick}
                disabled={deshabilitada}
              >
                Finalizar sesión
              </Button>
            ) : estado === "pendiente_cobro" ? (
              <Button className="flex-1" variant="default" onClick={handleFinalizarClick} disabled={deshabilitada}>
                Ver resumen
              </Button>
            ) : (
              <Button
                className="flex-1"
                variant="secondary"
                aria-label={`Ver sesión de mesa ${numero}`}
                onClick={handleFinalizarClick}
                disabled={deshabilitada}
              >
                Ver sesión
              </Button>
            )}

            <Button
              size="icon"
              variant="outline"
              aria-label="Abrir consumos de la mesa"
              title="Abrir consumos de la mesa"
              onClick={handleCarritoClick}
              disabled={deshabilitada}
            >
              <ShoppingCart className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
