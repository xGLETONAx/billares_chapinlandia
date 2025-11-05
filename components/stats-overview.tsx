import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LayoutGrid, Clock, DollarSign, TrendingUp } from "lucide-react"

interface StatsOverviewProps {
  mesasActivas: number
  mesasTotal: number
  tiempoPromedio: string
  ingresosHoy: string
  ocupacion: string
}

export function StatsOverview({
  mesasActivas,
  mesasTotal,
  tiempoPromedio,
  ingresosHoy,
  ocupacion,
}: StatsOverviewProps) {
  const stats = [
    {
      title: "Mesas Activas",
      value: mesasActivas.toString(),
      total: mesasTotal.toString(),
      icon: LayoutGrid,
      color: "text-primary",
    },
    {
      title: "Tiempo Promedio",
      value: tiempoPromedio,
      subtitle: "por sesión",
      icon: Clock,
      color: "text-blue-600",
    },
    {
      title: "Ingresos Hoy",
      value: ingresosHoy,
      subtitle: "consumos del día",
      icon: DollarSign,
      color: "text-success",
    },
    {
      title: "Ocupación",
      value: ocupacion,
      subtitle: "promedio diario",
      icon: TrendingUp,
      color: "text-warning",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <Icon className={`w-5 h-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.value}
                {stat.total && <span className="text-sm font-normal text-muted-foreground ml-1">/ {stat.total}</span>}
              </div>
              {stat.subtitle && <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
