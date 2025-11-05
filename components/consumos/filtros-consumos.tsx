"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Search } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface FiltrosConsumosProps {
  dateRange: { from: Date | undefined; to: Date | undefined }
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void
  tipoJuego: "todos" | "billar" | "juegos-mesa" | "solo-consumo"
  onTipoJuegoChange: (tipo: "todos" | "billar" | "juegos-mesa" | "solo-consumo") => void
  estado: "todas" | "abierta" | "cerrada" | "sin-sesion"
  onEstadoChange: (estado: "todas" | "abierta" | "cerrada" | "sin-sesion") => void
  busqueda: string
  onBusquedaChange: (busqueda: string) => void
}

export function FiltrosConsumos({
  dateRange,
  onDateRangeChange,
  tipoJuego,
  onTipoJuegoChange,
  estado,
  onEstadoChange,
  busqueda,
  onBusquedaChange,
}: FiltrosConsumosProps) {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Rango de fechas */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Rango de fechas</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yy", { locale: es })} -{" "}
                        {format(dateRange.to, "dd/MM/yy", { locale: es })}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yy", { locale: es })
                    )
                  ) : (
                    "Seleccionar fechas"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={(range) => onDateRangeChange(range || { from: undefined, to: undefined })}
                  numberOfMonths={2}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Tipo de juego */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Operación</label>
            <Select value={tipoJuego} onValueChange={onTipoJuegoChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="billar">Billar</SelectItem>
                <SelectItem value="juegos-mesa">Juegos de mesa</SelectItem>
                <SelectItem value="solo-consumo">Solo consumo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Estado</label>
            <Select value={estado} onValueChange={onEstadoChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="abierta">Abierta</SelectItem>
                <SelectItem value="cerrada">Cerrada</SelectItem>
                <SelectItem value="sin-sesion">Sin sesión</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Búsqueda */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Buscar mesa</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Mesa o código..."
                value={busqueda}
                onChange={(e) => onBusquedaChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
