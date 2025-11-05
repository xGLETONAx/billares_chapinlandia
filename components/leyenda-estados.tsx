import { Badge } from "@/components/ui/badge"

export function LeyendaEstados() {
  return (
    <div className="mt-8 p-4 bg-muted/30 rounded-lg">
      <h3 className="text-sm font-semibold text-foreground mb-3">Leyenda de Estados:</h3>
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Badge className="bg-destructive text-destructive-foreground">Abierta</Badge>
          <span className="text-sm text-muted-foreground">Mesa Iniciada por el Usuario</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-success text-success-foreground">Libre</Badge>
          <span className="text-sm text-muted-foreground">Mesa Disponible</span>
        </div>
      </div>
    </div>
  )
}
