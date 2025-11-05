"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface FiltrosSoloConsumoProps {
  estadoFiltro: string
  onEstadoChange: (estado: string) => void
  busqueda: string
  onBusquedaChange: (busqueda: string) => void
}

export function FiltrosSoloConsumo({
  estadoFiltro,
  onEstadoChange,
  busqueda,
  onBusquedaChange,
}: FiltrosSoloConsumoProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:justify-start mb-6">
      {/* Buscador a la izquierda */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Buscar por nombre o código..."
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
          className="pl-10"
          aria-label="Buscar consumos por nombre o código"
        />
      </div>

      {/* Filtro a la par */}
      <div className="w-full sm:w-48">
        <Select value={estadoFiltro || "todos"} onValueChange={onEstadoChange}>
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="abiertos">Abiertos</SelectItem>
            <SelectItem value="cerrados">Cerrados</SelectItem>
                      </SelectContent>
        </Select>
      </div>
    </div>
  )
}
