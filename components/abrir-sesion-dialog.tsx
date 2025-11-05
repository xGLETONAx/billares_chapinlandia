"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useState } from "react"

interface AbrirSesionDialogProps {
  mesaNumero: number | null
  categoria: string
  isOpen: boolean
  onClose: () => void
  onConfirm?: (payload: { tipoJuego: string; jugadores?: number }) => void
}

export function AbrirSesionDialog({
  mesaNumero,
  categoria,
  isOpen,
  onClose,
  onConfirm,             // 👈 traer onConfirm
}: AbrirSesionDialogProps) {
  const [tipoJuegoSeleccionado, setTipoJuegoSeleccionado] = useState("")
  const [numJugadores, setNumJugadores] = useState(2)

  const opcionesJuego =
    categoria === "billar"
      ? [{ value: "billar-30", label: "Billar 30′" }]
      : [
          { value: "domino-60", label: "Dominó 60′" },
          { value: "cartas-60", label: "Cartas 60′" },
          { value: "ajedrez-60", label: "Ajedrez 60′" },
          { value: "damas-60", label: "Damas 60′" },
        ]

  // Para mesas de billar fijas, preseleccionar y deshabilitar
  const esBillarFijo = categoria === "billar"
  const valorPorDefecto = esBillarFijo ? "billar-30" : ""

  const tipoJuegoPreview = (categoria === "billar" ? "billar-30" : tipoJuegoSeleccionado) || ""
const esJuegoMesa =
  tipoJuegoPreview.includes("domino") ||
  tipoJuegoPreview.includes("cartas") ||
  tipoJuegoPreview.includes("ajedrez") ||
  tipoJuegoPreview.includes("damas")

  const handleAbrirSesion = () => {
  // Resolver tipo de juego final
  const tipoJuegoFinal = esBillarFijo ? "billar-30" : tipoJuegoSeleccionado;

  // Validación mínima: si no es billar, exigir selección
  if (!esBillarFijo && !tipoJuegoFinal) return;

  // Enviar al padre para que cree la sesión en el store
  onConfirm?.({
    tipoJuego: tipoJuegoFinal,
    jugadores: esJuegoMesa ? numJugadores : undefined,
  });

  // Limpiar/close
  onClose();
  setTipoJuegoSeleccionado("");
  setNumJugadores(2);
};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Abrir sesión</DialogTitle>
          <DialogDescription className="sr-only">Formulario para abrir una nueva sesión de juego</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="tipo-juego" className="text-sm font-medium">
              Tipo de juego
            </label>
            <Select
              value={esBillarFijo ? valorPorDefecto : tipoJuegoSeleccionado}
              onValueChange={setTipoJuegoSeleccionado}
              disabled={esBillarFijo}
            >
              <SelectTrigger id="tipo-juego">
                <SelectValue placeholder="Selecciona el tipo de juego" />
              </SelectTrigger>
              <SelectContent>
                {opcionesJuego.map((opcion) => (
                  <SelectItem key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(esJuegoMesa || (!esBillarFijo && !tipoJuegoSeleccionado)) && !esBillarFijo && (
            <div className="space-y-2">
              <label htmlFor="jugadores" className="text-sm font-medium">
                Jugadores
              </label>
              <Input
                id="jugadores"
                type="number"
                min="1"
                step="1"
                value={numJugadores}
                onChange={(e) => setNumJugadores(Number.parseInt(e.target.value) || 1)}
                className="w-full"
              />
            </div>
          )}

          <Alert>
            <AlertDescription className="text-sm">
              {esBillarFijo || tipoJuegoSeleccionado === "billar-30"
                ? "Bloque: 30′ · Tarifa: Q10 por bloque · Al abrir la sesión se cobra Q10 (primer bloque) · Tolerancia 10′ al superar cada hora."
                : esJuegoMesa
                  ? "Tarifa: Q6 por persona por hora · Cobro mínimo 1 hora por persona. Aplica a Dominó, Cartas, Ajedrez y Damas."
                  : "Selecciona un tipo de juego para ver las tarifas"}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleAbrirSesion} disabled={!esBillarFijo && !tipoJuegoSeleccionado}>
            Abrir sesión
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
