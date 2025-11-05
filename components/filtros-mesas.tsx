"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface FiltrosMesasProps {
  estadoFiltro: string
  onEstadoChange: (estado: string) => void
  busqueda: string
  onBusquedaChange: (busqueda: string) => void
}

export function FiltrosMesas({ estadoFiltro, onEstadoChange, busqueda, onBusquedaChange }: FiltrosMesasProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:justify-start mb-6">
      {/* Buscador a la izquierda */}
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Buscar por código..."
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
          className="pl-10"
          aria-label="Buscar mesa por código"
        />
      </div>

      {/* Filtro a la par */}
      <div className="w-full sm:w-40">
        <Select value={estadoFiltro} onValueChange={onEstadoChange}>
          <SelectTrigger>
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="libre">Libre</SelectItem>
            <SelectItem value="abierta">Abierta</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
