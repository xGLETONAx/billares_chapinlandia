"use client"

import { cn } from "@/lib/utils"

import { useState, useMemo, useEffect } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  Cell,
  LabelList,
} from "recharts"
import { CalendarIcon, Download, Printer, Receipt, DollarSign, CreditCard, TrendingUp, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

import { TooltipProvider } from "@/components/ui/tooltip" // Import Tooltip from shadcn/ui

import { Tooltip as RechartsTooltip } from "recharts"

import { getVentasCerradasFiltradas, type Operacion, getDomainValues } from "@/lib/ventas"
import { juegoNetoCents, productosNetoCents, toCents, fromCents, clamp } from "@/lib/reportes/math"
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

// type Operacion = { // Redeclared Operacion - This is the error
//   id: string
//   fecha: Date
//   tipo: "billar" | "juegos" | "solo-consumo"
//   mesa?: string
//   tipoMesa?: "billar" | "juegos"
//   metodoPago: "efectivo" | "tarjeta" | "transferencia" | "mixto"
//   usuario: string
//   productos: { nombre: string; cantidad: number; precio: number }[]
//   ingresoJuego: number
//   ingresoConsumos: number
//   total: number
//   descuento: number
//   estado: "abierta" | "cerrada"
// }

// The Operacion type is now imported from "@/lib/ventas", so this local declaration is redundant and removed.

// const generateMockOperaciones = (): Operacion[] => { ... }

const chartConfig = {
  ventas: {
    label: "Ventas",
    color: "#0b6b3a",
  },
  ingreso: {
    label: "Ingreso",
    color: "#2fbf71",
  },
  efectivo: {
    label: "Efectivo",
    color: "#0b6b3a",
  },
  tarjeta: {
    label: "Tarjeta",
    color: "#2fbf71",
  },
  transferencia: {
    label: "Transferencia",
    color: "#ffb703",
  },
  mixto: {
    label: "Mixto",
    color: "#6b7280",
  },
}

// Paleta mínima y estable (sin archivos externos)
const GAME_COLORS = { juego: "#3B82F6", productos: "#10B981" } // azul / verde
const PAY_COLORS = { efectivo: "#10B981", tarjeta: "#3B82F6", transferencia: "#F59E0B", mixto: "#8B5CF6" } // verde/azul/ámbar/morado
const FALLBACK_COLOR = "#D1D5DB" // Gris claro
const PAYMENT_ORDER = ["Efectivo", "Tarjeta", "Transferencia", "Mixto"]

// Normaliza porcentajes para que sumen exactamente 100.0%
function normalizePercentages(values: number[]): number[] {
  if (values.length === 0) return []

  // Redondear todos menos el último
  const rounded = values.slice(0, -1).map((v) => +v.toFixed(1))
  const sumRounded = rounded.reduce((a, b) => a + b, 0)

  // El último = 100.0 - suma(anteriores), acotado a [0, 100]
  const last = Math.max(0, Math.min(100, +(100 - sumRounded).toFixed(1)))

  return [...rounded, last]
}

// Convierte objeto de totales a % con 1 decimal
function toShare(obj: Record<string, number>) {
  const total = Object.values(obj).reduce((a, b) => a + b, 0) || 1
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(obj)) out[k] = +((v * 100) / total).toFixed(1)
  return out
}

// A partir de un array [{categoria, valor}], arma {clave: total} con claves indicadas (lowercase)
function totalsFromArray(arr: Array<{ categoria: string; valor: number }>, keysLower: string[]) {
  const map: Record<string, number> = Object.fromEntries(keysLower.map((k) => [k, 0]))
  for (const item of arr) {
    const k = item.categoria.toLowerCase()
    if (k in map) map[k] += item.valor || 0
  }
  return map
}

// Custom tooltip for lollipop chart
const CustomLollipopTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null
  const data = payload[0].payload
  return (
    <div className="bg-background border border-border rounded-lg shadow-lg p-3">
      <p className="font-semibold mb-1">Participación</p>
      <div className="text-sm">
        {data.name} — {data.percentage.toFixed(1)}% (Q{" "}
        {data.amount.toLocaleString("es-GT", { minimumFractionDigits: 2 })})
      </div>
    </div>
  )
}

const CustomFueraMesaTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null
  const v = payload[0]?.value ?? 0
  return (
    <div className="bg-background border border-border rounded-lg shadow-lg p-3">
      <p className="font-semibold mb-1">{label}</p>
      <div className="text-sm">Ingreso: Q{Number(v).toLocaleString("es-GT", { minimumFractionDigits: 2 })}</div>
    </div>
  )
}

// Custom tooltip for daily revenue line chart
const CustomDailyRevenueTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null
  const data = payload[0]
  return (
    <div className="bg-background border border-border rounded-lg shadow-lg p-3">
      <p className="font-semibold mb-1">{data.payload.fecha}</p>
      <div className="text-sm">Ventas: Q{data.value.toLocaleString("es-GT", { minimumFractionDigits: 2 })}</div>
    </div>
  )
}

const LollipopChart = ({
  data,
  colors,
  height = 200,
  showLegend = false,
  mobileHeight, // Added mobileHeight prop
}: {
  data: Array<{ name: string; percentage: number; amount: number }>
  colors: Record<string, string>
  height?: number
  showLegend?: boolean
  mobileHeight?: number // Added mobileHeight prop
}) => {
  // Sort by percentage descending
  const sortedData = [...data].sort((a, b) => b.percentage - a.percentage)

  // Validate and normalize percentages to sum exactly 100.0%
  const percentages = sortedData.map((d) => d.percentage)
  const sum = percentages.reduce((a, b) => a + b, 0)

  let normalizedData = sortedData
  if (sum > 0 && (sum < 99.9 || sum > 100.1)) {
    // Find the largest percentage and adjust it
    const maxIndex = sortedData.findIndex((d) => d.percentage === Math.max(...percentages))
    const adjustment = 100 - (sum - sortedData[maxIndex].percentage)
    normalizedData = sortedData.map((item, idx) =>
      idx === maxIndex ? { ...item, percentage: Math.max(0, Math.min(100, adjustment)) } : item,
    )
  }

  // Dynamic height based on screen size
  const chartHeight = typeof window !== "undefined" && window.innerWidth < 768 ? mobileHeight || height : height

  return (
    <div style={{ height: `${chartHeight}px` }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={normalizedData} layout="vertical" margin={{ right: 80, top: showLegend ? 40 : 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 12, fill: "#64748b" }}
          />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fill: "#334155" }} width={110} tickLine={false} />
          <RechartsTooltip content={<CustomLollipopTooltip />} />
          {showLegend && (
            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 10 }} iconType="circle" />
          )}
          <Bar dataKey="percentage" radius={[0, 4, 4, 0]} barSize={4}>
            {normalizedData.map((entry, index) => {
              const colorKey = entry?.name?.toLowerCase() || ""
              const color = colors[colorKey] || FALLBACK_COLOR
              return <Cell key={`cell-${index}`} fill={color} />
            })}
            <LabelList
              dataKey="percentage"
              position="right"
              content={(props: any) => {
                const { x, y, width, value, index } = props
                const entry = normalizedData[index]

                if (!entry || !entry.name) return null

                // Hide label if percentage < 3%
                if (value < 3) return null

                // Circle marker at the end of the bar
                const circleX = x + width
                const circleY = y + 2 // Center vertically with the thin bar
                const circleRadius = 5

                return (
                  <g>
                    {/* Lollipop circle */}
                    <circle
                      cx={circleX}
                      cy={circleY}
                      r={circleRadius}
                      fill={colors[entry.name.toLowerCase()] || FALLBACK_COLOR}
                      stroke="#fff"
                      strokeWidth={1.5}
                    />
                    {/* Percentage label */}
                    <text
                      x={circleX + circleRadius + 8}
                      y={circleY}
                      fill="#334155"
                      fontSize={13}
                      fontWeight={500}
                      dominantBaseline="middle"
                    >
                      {value.toFixed(1)}%
                    </text>
                  </g>
                )
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

const round2 = (num: number): number => Math.round(num * 100) / 100

// The following functions have been removed:
// - toCents (now imported)
// - fromCents (now imported)
// - clampCents (now imported as clamp)
// - juegoNetoCents (now imported)
// - productosNetoCents (now imported)

const getProductIncome = (op: Operacion, productoNombre: string): number => {
  return op.productos.filter((p) => p.nombre === productoNombre).reduce((sum, p) => sum + p.precio * p.cantidad, 0)
}

function ingresoSegunModo(
  op: Operacion,
  modo: "resumen" | "solo-juego" | "solo-productos" | "solo-consumos",
  selectedProductName?: string,
): number {
  if (modo === "solo-juego") {
    return fromCents(juegoNetoCents(op))
  }

  if (modo === "solo-productos" || modo === "solo-consumos") {
    if (selectedProductName) {
      return fromCents(productosNetoCents(op, selectedProductName))
    }
    return fromCents(productosNetoCents(op))
  }

  // modo === "resumen"
  if (selectedProductName) {
    return fromCents(productosNetoCents(op, selectedProductName))
  }
  return op.total
}

// Devuelve CENTAVOS según modo/selección, sin redondeos intermedios
function ingresoSegunModoCents(
  op: Operacion,
  modo: "resumen" | "solo-juego" | "solo-productos" | "solo-consumos",
  selectedProductName?: string | null,
): number {
  if (modo === "solo-juego") {
    return juegoNetoCents(op)
  }

  if (modo === "solo-productos") {
    // Productos en mesa y fuera (según alcance), SIEMPRE NETO
    return productosNetoCents(op, selectedProductName)
  }

  if (modo === "solo-consumos") {
    // Tickets sin mesa (ya se filtran en baseDataset), también NETO
    return productosNetoCents(op, selectedProductName)
  }

  // modo === "resumen"
  if (selectedProductName) {
    return productosNetoCents(op, selectedProductName)
  }
  return toCents(op.total || 0)
}

export default function ReportesPage() {
  const { toast } = useToast()

  const [modoAnalisis, setModoAnalisis] = useState<"resumen" | "solo-juego" | "solo-productos" | "solo-consumos">(
    "resumen",
  )

  const [datePreset, setDatePreset] = useState("mes-actual")
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })

  const [tipoOperacion, setTipoOperacion] = useState("todos")
  const [metodoPago, setMetodoPago] = useState("todos")
  const [usuario, setUsuario] = useState<string>("todos") // ahora guarda el nombre real o "todos"
  const [mesa, setMesa] = useState<string>("todas") // guarda "Mesa 1" o "todas"
  const [producto, setProducto] = useState<string>("todos") // guarda el nombre real o "todos"
  const [vistaTabla, setVistaTabla] = useState("dia")
  const [desglosarPorMesa, setDesglosarPorMesa] = useState(true)
  const [sortMesaBy, setSortMesaBy] = useState<"total" | "sesiones" | "juego" | "consumos">("total")
  const [sortMesaOrder, setSortMesaOrder] = useState<"asc" | "desc">("desc")

  const [tipoMesa, setTipoMesa] = useState<"todos" | "billar" | "juegos">("todos")
  const [segmentarPorTipoMesa, setSegmentarPorTipoMesa] = useState(false)
  const [segmentarPorTipo, setSegmentarPorTipo] = useState(false) // Nuevo estado para segmentar en modo resumen

  const [hasShownSoloConsumosToast, setHasShownSoloConsumosToast] = useState(false)
  const [verDetalleProductos, setVerDetalleProductos] = useState(false)


  useEffect(() => {
    if (modoAnalisis !== "resumen" && !desglosarPorMesa && vistaTabla === "mesa") {
      setVistaTabla("dia")
    }
  }, [modoAnalisis, desglosarPorMesa, vistaTabla])

  useEffect(() => {
    if (modoAnalisis === "solo-consumos" && desglosarPorMesa) {
      setDesglosarPorMesa(false)
    }
  }, [modoAnalisis, desglosarPorMesa])

  useEffect(() => {
    if (tipoOperacion === "solo-consumo" && desglosarPorMesa) {
      toast({
        title: "Configuración no válida",
        description:
          "Los tickets de Solo consumo no tienen mesa. Desactiva 'Solo consumo' o usa 'Solo productos (en mesa y fuera)' sin desglose por mesa.",
        variant: "destructive",
      })
      setDesglosarPorMesa(false)
    }
  }, [tipoOperacion, desglosarPorMesa, toast])

  useEffect(() => {
    if (modoAnalisis === "solo-juego") {
      // Forzar Desglosar por mesa ON
      setDesglosarPorMesa(true)
      // Reset product to todos (disabled in UI)
      setProducto("todos")
    } else if (modoAnalisis === "solo-productos") {
      setDesglosarPorMesa(false)
    }
  }, [modoAnalisis])

  useEffect(() => {
    if (modoAnalisis === "solo-juego" && vistaTabla === "producto") {
      setVistaTabla("dia")
    }
  }, [modoAnalisis, vistaTabla])

  useEffect(() => {
    if (modoAnalisis === "resumen") {
      // Limpiar filtros que no aplican en modo Resumen
      setTipoOperacion("todos")
      setMesa("todas")
      setProducto("todos")
      setTipoMesa("todos")
      // Forzar Alcance ON
      setDesglosarPorMesa(true)
      // IMPORTANTE: NO tocar vistaTabla en Resumen
    }
  }, [modoAnalisis])

  useEffect(() => {
    setMesa("todas")
  }, [producto, desglosarPorMesa])

  useEffect(() => {
    if (modoAnalisis === "solo-consumos" && !hasShownSoloConsumosToast) {
      toast({
        title: "Modo cambiado",
        description: "Cambiamos a Solo consumos para evitar resultados ambiguos.",
      })
      setHasShownSoloConsumosToast(true)
    }
  }, [modoAnalisis, hasShownSoloConsumosToast, toast])

  useEffect(() => {
    if (modoAnalisis !== "solo-consumos") {
      setHasShownSoloConsumosToast(false)
    }
  }, [modoAnalisis])

  const dateRangeBoundaries = useMemo(() => {
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    let startDate: Date
    let endDate: Date = new Date(today)

    switch (datePreset) {
      case "hoy": {
        startDate = new Date(today)
        startDate.setHours(0, 0, 0, 0)
        break
      }
      case "ayer": {
        startDate = new Date(today)
        startDate.setDate(startDate.getDate() - 1)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(startDate)
        endDate.setHours(23, 59, 59, 999)
        break
      }
      case "semana-actual": {
        startDate = new Date(today)
        const dayOfWeek = startDate.getDay()
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Monday = 0
        startDate.setDate(startDate.getDate() - diff)
        startDate.setHours(0, 0, 0, 0)
        break
      }
      case "semana-anterior": {
        const lastMonday = new Date(today)
        const dayOfWeek = lastMonday.getDay()
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
        lastMonday.setDate(lastMonday.getDate() - diff - 7)
        lastMonday.setHours(0, 0, 0, 0)

        startDate = lastMonday
        endDate = new Date(lastMonday)
        endDate.setDate(endDate.getDate() + 6)
        endDate.setHours(23, 59, 59, 999)
        break
      }
      case "mes-actual": {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        startDate.setHours(0, 0, 0, 0)
        break
      }
      case "mes-anterior": {
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(today.getFullYear(), today.getMonth(), 0)
        endDate.setHours(23, 59, 59, 999)
        break
      }
      case "personalizado": {
        if (!dateRange.from || !dateRange.to) {
          // Default to current month if custom but no dates selected
          startDate = new Date(today.getFullYear(), today.getMonth(), 1)
          startDate.setHours(0, 0, 0, 0)
        } else {
          startDate = new Date(dateRange.from)
          startDate.setHours(0, 0, 0, 0)
          endDate = new Date(dateRange.to)
          endDate.setHours(23, 59, 59, 999)
        }
        break
      }
      default: {
        // Default to current month
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        startDate.setHours(0, 0, 0, 0)
      }
    }

    return { startDate, endDate }
  }, [datePreset, dateRange])

  const allOperaciones = useMemo(() => {
    return getVentasCerradasFiltradas({
      dateStart: dateRangeBoundaries.startDate,
      dateEnd: dateRangeBoundaries.endDate,
      metodo: metodoPago === "todos" ? undefined : (metodoPago as any),
      usuario: usuario === "todos" ? undefined : usuario, // ← literal
      producto: producto === "todos" ? undefined : producto, // ← literal
      tipoOperacion: tipoOperacion === "todos" ? undefined : (tipoOperacion as any),
    })
  }, [dateRangeBoundaries, metodoPago, usuario, producto, tipoOperacion])

  const baseDataset = useMemo(() => {
    return allOperaciones.filter((op) => {
      // Date range filter
      const opDate = new Date(op.fecha)
      opDate.setHours(0, 0, 0, 0)
      if (opDate < dateRangeBoundaries.startDate || opDate > dateRangeBoundaries.endDate) return false
      if (op.estado === "abierta") return false

      // Mode-specific filtering
      if (modoAnalisis === "solo-juego") {
        if (op.tipo !== "billar" && op.tipo !== "juegos") return false
        if (!op.mesa) return false
      } else if (modoAnalisis === "solo-productos") {
        if (desglosarPorMesa && !op.mesa) return false
      } else if (modoAnalisis === "solo-consumos") {
        if (op.tipo !== "solo-consumo") return false
      } else {
        if (modoAnalisis !== "resumen" && desglosarPorMesa && !op.mesa) return false
      }

      if (modoAnalisis === "resumen" && tipoOperacion !== "todos") {
        if (tipoOperacion === "billar" && op.tipo !== "billar") return false
        if (tipoOperacion === "juegos" && op.tipo !== "juegos") return false
      }

      if (metodoPago !== "todos" && op.metodoPago !== metodoPago) return false
      if (usuario !== "todos" && op.usuario !== usuario) return false

      if ((modoAnalisis === "resumen" || modoAnalisis === "solo-productos") && producto !== "todos") {
        if (!op.productos.some((p) => p.nombre === producto)) return false
      }

      if (modoAnalisis !== "resumen" && mesa !== "todas" && op.mesa !== mesa) return false

      if ((modoAnalisis === "solo-juego" || modoAnalisis === "solo-productos") && tipoMesa !== "todos") {
        if (tipoMesa === "billar" && op.tipoMesa !== "billar") return false
        if (tipoMesa === "juegos" && op.tipoMesa !== "juegos") return false
      }

      return true
    })
  }, [
    allOperaciones,
    dateRangeBoundaries,
    tipoOperacion,
    mesa,
    metodoPago,
    usuario,
    producto,
    desglosarPorMesa,
    modoAnalisis,
    tipoMesa,
  ])

  // Dominios globales (del resultado de allOperaciones)
  const domainAll = useMemo(() => getDomainValues(allOperaciones), [allOperaciones])

  // Dominios según el dataset ya filtrado (fecha, modo, usuario, método, etc.)
  const domainScoped = useMemo(() => getDomainValues(baseDataset), [baseDataset])

  // Opciones de cada select
  const usuarioOptions = domainAll.usuarios

  const productoOptions = useMemo(
    () => (modoAnalisis === "solo-productos" ? domainAll.productos : []),
    [modoAnalisis, domainAll],
  )

  const mesaOptions = useMemo(() => {
    // Mostrar mesa solo en:
    // - solo-juego
    // - solo-productos + desglosarPorMesa = ON
    if (!(modoAnalisis === "solo-juego" || (modoAnalisis === "solo-productos" && desglosarPorMesa))) return []

    // Respetar filtro tipoMesa
    return domainScoped.mesas.filter((m) => {
      if (tipoMesa === "todos") return true
      const n = Number.parseInt(m.replace(/\D/g, ""))
      return tipoMesa === "billar" ? n <= 5 : n >= 6
    })
  }, [modoAnalisis, desglosarPorMesa, domainScoped, tipoMesa])

  const selectedProductName = useMemo(() => (producto === "todos" ? null : producto), [producto])

  const showMesaFilter = modoAnalisis === "solo-juego" || (modoAnalisis === "solo-productos" && desglosarPorMesa)

  const showTopMesasChart =
    mesa === "todas" &&
    modoAnalisis !== "solo-consumos" &&
    modoAnalisis !== "resumen" && // Ocultar en modo Resumen
    (modoAnalisis === "solo-juego" || (modoAnalisis === "solo-productos" && desglosarPorMesa))

  const kpis = useMemo(() => {
    let totalCents = 0
    const metodoCents: Record<string, number> = {}

    baseDataset.forEach((op) => {
      const cents = ingresoSegunModoCents(op, modoAnalisis, selectedProductName)
      totalCents += cents
      metodoCents[op.metodoPago] = (metodoCents[op.metodoPago] || 0) + cents
    })

    const totalVentas = fromCents(totalCents)
    const ticketsCerrados = baseDataset.length
    const ticketPromedio = ticketsCerrados > 0 ? +(totalVentas / ticketsCerrados).toFixed(2) : 0

    const metodoEntries = Object.entries(metodoCents).sort((a, b) => b[1] - a[1])
    const dominanteCents = metodoEntries.length ? metodoEntries[0][1] : 0
    const metodoDominantePercent = totalCents > 0 ? +((dominanteCents * 100) / totalCents).toFixed(1) : 0

    return {
      totalVentas: +totalVentas.toFixed(2),
      ticketsCerrados,
      ticketPromedio,
      metodoDominante: {
        metodo: metodoEntries.length
          ? metodoEntries[0][0].charAt(0).toUpperCase() + metodoEntries[0][0].slice(1)
          : "N/A",
        valor: metodoDominantePercent,
      },
    }
  }, [baseDataset, modoAnalisis, selectedProductName])

  const totalVentas = round2(kpis.totalVentas)
  const ticketsCerrados = kpis.ticketsCerrados
  const ticketPromedio = kpis.ticketPromedio

  const dailyRevenueData = useMemo(() => {
    const dayMap: Record<string, number> = {}

    baseDataset.forEach((op) => {
      const dayKey = format(new Date(op.fecha), "yyyy-MM-dd")
      if (!dayMap[dayKey]) dayMap[dayKey] = 0
      const cents = ingresoSegunModoCents(op, modoAnalisis, selectedProductName)
      dayMap[dayKey] += cents
    })

    const result = Object.entries(dayMap)
      .map(([day, cents]) => ({
        fecha: format(new Date(day), "dd/MMM", { locale: es }),
        ventas: +fromCents(cents).toFixed(2),
      }))
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())

    const sumaDiaria = result.reduce((sum, d) => sum + d.ventas, 0)
    const diff = Math.abs(sumaDiaria - kpis.totalVentas)
    if (diff > 0.01) {
      console.warn(
        `[v0] Validación: Suma diaria (Q${sumaDiaria.toFixed(2)}) != KPI (Q${kpis.totalVentas.toFixed(2)}), diff: Q${diff.toFixed(2)}`,
      )
    }

    return result
  }, [baseDataset, modoAnalisis, selectedProductName, kpis.totalVentas])

  const gameVsProductsData = useMemo(() => {
    if (modoAnalisis !== "resumen") return []

    let productosCentsTotal = 0
    let juegoCentsTotal = 0
    let baseCents = 0

    baseDataset.forEach((op) => {
      const productosCents = productosNetoCents(op)
      const juegoCents = juegoNetoCents(op)
      const totalCents = toCents(op.total)

      productosCentsTotal += productosCents
      juegoCentsTotal += juegoCents
      baseCents += totalCents
    })

    if (baseCents === 0) return []

    const pctProductos = +((fromCents(productosCentsTotal) * 100) / fromCents(baseCents)).toFixed(1)
    const pctJuego = +((fromCents(juegoCentsTotal) * 100) / fromCents(baseCents)).toFixed(1)

    const totalBase = +fromCents(baseCents).toFixed(2)
    const juegoAbsoluto = +fromCents(juegoCentsTotal).toFixed(2)
    const productosAbsoluto = +fromCents(productosCentsTotal).toFixed(2)

    const sumaCategories = juegoAbsoluto + productosAbsoluto
    const diff = Math.abs(sumaCategories - totalBase)
    if (diff > 0.5) {
      console.warn(
        `[v0] Validación Juego vs Productos: Suma categorías (Q${sumaCategories.toFixed(2)}) != Base (Q${totalBase.toFixed(2)}), diff: Q${diff.toFixed(2)}`,
      )
    }

    return [
      {
        categoria: "Juego",
        valor: pctJuego,
        valorAbsoluto: juegoAbsoluto,
        totalBase,
        diff: 0,
      },
      {
        categoria: "Productos",
        valor: pctProductos,
        valorAbsoluto: productosAbsoluto,
        totalBase,
        diff: 0,
      },
    ]
  }, [baseDataset, modoAnalisis])

  const topMesasData = useMemo(() => {
    if (!showTopMesasChart) return []

    const mesaMap: Record<
      string,
      { ingresoTotal: number; ingresoBillar: number; ingresoJuegos: number; tipo: string }
    > = {}

    baseDataset.forEach((op) => {
      const mesaKey = modoAnalisis === "resumen" ? (op.mesa ?? "Sin mesa") : op.mesa
      if (!mesaKey) return // en modos no-resumen, ya viene filtrado por alcance

      if (!mesaMap[mesaKey]) {
        mesaMap[mesaKey] = { ingresoTotal: 0, ingresoBillar: 0, ingresoJuegos: 0, tipo: op.tipoMesa || "" }
      }

      let incomeCents = 0
      if (modoAnalisis === "resumen") {
        if (selectedProductName) {
          incomeCents = productosNetoCents(op, selectedProductName)
        } else {
          incomeCents = toCents(op.total)
        }
      } else if (modoAnalisis === "solo-juego") {
        incomeCents = juegoNetoCents(op)
      } else if (modoAnalisis === "solo-productos") {
        incomeCents = productosNetoCents(op, selectedProductName)
      }

      const income = fromCents(incomeCents)
      mesaMap[mesaKey].ingresoTotal = round2(mesaMap[mesaKey].ingresoTotal + income)

      if (op.tipoMesa === "billar") {
        mesaMap[mesaKey].ingresoBillar = round2(mesaMap[mesaKey].ingresoBillar + income)
      } else if (op.tipoMesa === "juegos") {
        mesaMap[mesaKey].ingresoJuegos = round2(mesaMap[mesaKey].ingresoJuegos + income)
      }
    })

    const mesasArray = Object.entries(mesaMap).map(([mesa, data]) => ({
      mesa,
      ingreso: data.ingresoTotal,
      ingresoBillar: data.ingresoBillar,
      ingresoJuegos: data.ingresoJuegos,
      tipo: data.tipo,
    }))

    return mesasArray.sort((a, b) => b.ingreso - a.ingreso).slice(0, 5)
  }, [baseDataset, showTopMesasChart, selectedProductName, modoAnalisis])

  const canSegmentByType = useMemo(() => {
    if (modoAnalisis === "resumen") {
      if (tipoOperacion !== "todos") return false
      const hasBillar = topMesasData.some((m) => m.ingresoBillar > 0)
      const hasJuegos = topMesasData.some((m) => m.ingresoJuegos > 0)
      return hasBillar && hasJuegos
    } else if (modoAnalisis === "solo-juego" || modoAnalisis === "solo-productos") {
      // Check if there are both billar and juegos tables in the data
      const hasBillar = topMesasData.some((m) => m.ingresoBillar > 0)
      const hasJuegos = topMesasData.some((m) => m.ingresoJuegos > 0)
      return hasBillar && hasJuegos
    }
    return false
  }, [tipoOperacion, topMesasData, modoAnalisis])

  const fueraDeMesaData = useMemo(() => {
    if (modoAnalisis !== "solo-productos") {
      return { total: 0, count: 0, byDay: [] }
    }

    const fueraDeMesaOps = allOperaciones.filter((op) => {
      // Apply same filters as baseDataset but only count operations without mesa
      const opDate = new Date(op.fecha)
      opDate.setHours(0, 0, 0, 0)
      if (opDate < dateRangeBoundaries.startDate || opDate > dateRangeBoundaries.endDate) {
        return false
      }
      if (op.estado === "abierta") {
        return false
      }
      if (op.mesa) {
        return false // Only count operations without mesa
      }

      // Apply other filters
      if (metodoPago !== "todos" && op.metodoPago !== metodoPago) {
        return false
      }

      // Usuario
      if (usuario !== "todos" && op.usuario !== usuario) {
        return false
      }

      // Apply product filter
      if (selectedProductName) {
        const hasProduct = op.productos.some((p) => p.nombre === selectedProductName)
        if (!hasProduct) {
          return false
        }
      }

      return true
    })

    const total = fueraDeMesaOps.reduce((sum, op) => {
      return sum + fromCents(productosNetoCents(op, selectedProductName))
    }, 0)

    // Calculate by day
    const dayMap: Record<string, number> = {}
    fueraDeMesaOps.forEach((op) => {
      const dayKey = format(new Date(op.fecha), "yyyy-MM-dd")
      if (!dayMap[dayKey]) {
        dayMap[dayKey] = 0
      }
      dayMap[dayKey] += fromCents(productosNetoCents(op, selectedProductName))
    })

    const byDay = Object.entries(dayMap)
      .map(([day, ingreso]) => ({
        fecha: format(new Date(day), "dd/MMM", { locale: es }),
        ingreso: round2(ingreso),
      }))
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())

    return {
      total: round2(total),
      count: fueraDeMesaOps.length,
      byDay,
    }
  }, [modoAnalisis, allOperaciones, dateRangeBoundaries, metodoPago, usuario, selectedProductName])

  const operacionesFueraDeMesa = useMemo(() => {
    if (modoAnalisis !== "solo-productos" || desglosarPorMesa) return 0

    return allOperaciones.filter((op) => {
      // Rango de fechas y estado
      const opDate = new Date(op.fecha)
      opDate.setHours(0, 0, 0, 0)
      if (opDate < dateRangeBoundaries.startDate || opDate > dateRangeBoundaries.endDate) return false
      if (op.estado === "abierta") return false

      // Solo sin mesa
      if (op.mesa) return false

      // Método
      if (metodoPago !== "todos" && op.metodoPago !== metodoPago) return false

      // Usuario (literal)
      if (usuario !== "todos" && op.usuario !== usuario) return false

      // Producto (literal seleccionado, si aplica)
      if (producto !== "todos") {
        const hasProducto = op.productos.some((p) => p.nombre === producto)
        if (!hasProducto) return false
      }

      return true
    }).length
  }, [modoAnalisis, desglosarPorMesa, allOperaciones, dateRangeBoundaries, metodoPago, usuario, producto])

  const paymentMixData = useMemo(() => {
    let totalCents = 0
    const metodoCents: Record<string, number> = {}

    baseDataset.forEach((op) => {
      const cents = ingresoSegunModoCents(op, modoAnalisis, selectedProductName)
      metodoCents[op.metodoPago] = (metodoCents[op.metodoPago] || 0) + cents
      totalCents += cents
    })

    const result = Object.entries(metodoCents).map(([metodo, cents]) => ({
      metodo: metodo.charAt(0).toUpperCase() + metodo.slice(1),
      valor: totalCents > 0 ? +((cents * 100) / totalCents).toFixed(1) : 0,
      valorAbsoluto: +fromCents(cents).toFixed(2),
    }))

    const sumaMetodos = result.reduce((sum, m) => sum + m.valorAbsoluto, 0)
    const diff = Math.abs(sumaMetodos - kpis.totalVentas)
    if (diff > 0.01) {
      console.warn(
        `[v0] Validación Métodos: Suma métodos (Q${sumaMetodos.toFixed(2)}) != KPI (Q${kpis.totalVentas.toFixed(2)}), diff: Q${diff.toFixed(2)}`,
      )
    }

    return result
  }, [baseDataset, modoAnalisis, selectedProductName, kpis.totalVentas])

  const tableData = useMemo(() => {
    switch (vistaTabla) {
      case "dia": {
        const dayMap: Record<string, { cents: number; tickets: number }> = {}

        baseDataset.forEach((op) => {
          const dateKey = op.fecha.toLocaleDateString("es-GT", { year: "numeric", month: "2-digit", day: "2-digit" })
          if (!dayMap[dateKey]) dayMap[dateKey] = { cents: 0, tickets: 0 }
          const cents = ingresoSegunModoCents(op, modoAnalisis, selectedProductName)
          dayMap[dateKey].cents += cents
          dayMap[dateKey].tickets += 1
        })

        return Object.entries(dayMap)
          .map(([fecha, data]) => {
            const ventas = fromCents(data.cents)
            return {
              fecha,
              ventas: `Q${ventas.toFixed(2)}`,
              tickets: data.tickets,
              promedio: `Q${(ventas / data.tickets).toFixed(2)}`,
            }
          })
          .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      }

      case "mesa": {
  const mesaMap: Record<string, { sesiones: number; juegoC: number; consumosC: number }> = {}

  baseDataset.forEach((op) => {
    const key = modoAnalisis === "resumen" ? (op.mesa ?? "Sin mesa") : op.mesa
    if (!key) return // en modos donde se exige mesa

    if (!mesaMap[key]) mesaMap[key] = { sesiones: 0, juegoC: 0, consumosC: 0 }
    mesaMap[key].sesiones += 1
    mesaMap[key].juegoC += juegoNetoCents(op)
    mesaMap[key].consumosC += productosNetoCents(op)
  })

  const mesasArray = Object.entries(mesaMap).map(([mesa, data]) => {
    const juegoQ = fromCents(data.juegoC)
    const consumosQ = fromCents(data.consumosC)
    const totalQ = juegoQ + consumosQ
    return { mesa, sesiones: data.sesiones, juegoQ, consumosQ, totalQ }
  })

  // --- Orden ---
  const pickTotalForMode = (m: (typeof mesasArray)[number]) =>
    modoAnalisis === "solo-juego" ? m.juegoQ :
    modoAnalisis === "solo-productos" ? m.consumosQ : m.totalQ

  const sorted = [...mesasArray].sort((a, b) => {
    const aVal =
      sortMesaBy === "total" ? pickTotalForMode(a) :
      sortMesaBy === "sesiones" ? a.sesiones :
      sortMesaBy === "juego" ? a.juegoQ : a.consumosQ

    const bVal =
      sortMesaBy === "total" ? pickTotalForMode(b) :
      sortMesaBy === "sesiones" ? b.sesiones :
      sortMesaBy === "juego" ? b.juegoQ : b.consumosQ

    return sortMesaOrder === "desc" ? bVal - aVal : aVal - bVal
  })

  // Validación rápida (usa el total acorde al modo)
  const sumForMode = sorted.reduce((sum, m) => {
    const t = modoAnalisis === "solo-juego" ? m.juegoQ :
              modoAnalisis === "solo-productos" ? m.consumosQ : m.totalQ
    return sum + t
  }, 0)
  if (modoAnalisis === "resumen") {
    const diff = Math.abs(sumForMode - kpis.totalVentas)
    if (diff > 0.5) {
      console.warn(
        `[v0] Validación Tabla Mesa (Resumen): suma Q${sumForMode.toFixed(2)} != KPI Q${kpis.totalVentas.toFixed(2)}`
      )
    }
  }

  // --- Filas (define strings locales antes de usarlas) ---
  return sorted.map((m) => {
    const ingresoJuego = `Q${m.juegoQ.toFixed(2)}`
    const ingresoConsumos = `Q${m.consumosQ.toFixed(2)}`
    const totalSoloJuego = `Q${m.juegoQ.toFixed(2)}`
    const totalSoloConsumos = `Q${m.consumosQ.toFixed(2)}`
    const totalResumen = `Q${m.totalQ.toFixed(2)}`

    if (modoAnalisis === "solo-juego") {
      return { mesa: m.mesa, sesiones: m.sesiones, ingresoJuego, total: totalSoloJuego }
    }
    if (modoAnalisis === "solo-productos") {
      return { mesa: m.mesa, sesiones: m.sesiones, ingresoConsumos, total: totalSoloConsumos }
    }
    // Resumen
    return { mesa: m.mesa, sesiones: m.sesiones, ingresoJuego, ingresoConsumos, total: totalResumen }
  })
}

      case "juego": {
        const juegoMap: Record<"Billar" | "Juegos de mesa", { sesiones: number; cents: number }> = {
          Billar: { sesiones: 0, cents: 0 },
          "Juegos de mesa": { sesiones: 0, cents: 0 },
        }

        baseDataset.forEach((op) => {
          const jCents = juegoNetoCents(op)
          const key: "Billar" | "Juegos de mesa" = op.tipoMesa === "billar" ? "Billar" : "Juegos de mesa"
          juegoMap[key].sesiones += 1
          juegoMap[key].cents += jCents
        })

        return (Object.entries(juegoMap) as Array<[string, { sesiones: number; cents: number }]>).map(
          ([juego, data]) => ({
            juego,
            sesiones: data.sesiones,
            ingreso: `Q${fromCents(data.cents).toFixed(2)}`,
          }),
        )
      }

      case "producto": {
  // Map por producto
  const productoMap: Record<string, { qty: number; brutoCents: number; netoCents: number; descCents: number }> = {}

  baseDataset.forEach((op) => {
    // Construye líneas de productos brutas en CENTAVOS
    const lineas = op.productos.map(l => ({
      nombre: l.nombre,
      qty: l.cantidad,
      brutoCents: toCents(l.precio * l.cantidad),
    }))

    const brutoProductosCents = lineas.reduce((a, b) => a + b.brutoCents, 0)
    const brutoJuegoCents = toCents(op.ingresoJuego)
    const brutoTotalCents = brutoProductosCents + brutoJuegoCents
    const descTicketCents = toCents(op.descuento || 0)

    // Si no hay descuento a prorratear, neto = bruto por línea
    if (descTicketCents === 0 || brutoProductosCents === 0 || brutoTotalCents === 0) {
      lineas.forEach(l => {
        if (!productoMap[l.nombre]) productoMap[l.nombre] = { qty: 0, brutoCents: 0, netoCents: 0, descCents: 0 }
        productoMap[l.nombre].qty += l.qty
        productoMap[l.nombre].brutoCents += l.brutoCents
        productoMap[l.nombre].netoCents += l.brutoCents
        // descCents += 0
      })
      return
    }

    // Prorrateo del descuento SOLO sobre la parte de productos:
    const descProductosCents = Math.round(descTicketCents * (brutoProductosCents / brutoTotalCents))
    const netoProductosCents = clamp(brutoProductosCents - descProductosCents)

    // 1) Asignación proporcional por línea (centavos)
    const factor = netoProductosCents / brutoProductosCents
    const asignaciones = lineas.map(l => Math.round(l.brutoCents * factor))

    // 2) Ajuste a la última línea para cuadrar EXACTO
    const sumaAsignada = asignaciones.reduce((a, b) => a + b, 0)
    let diff = netoProductosCents - sumaAsignada
    if (diff !== 0) {
      // Ajusta la última línea con importe > 0
      for (let i = lineas.length - 1; i >= 0; i--) {
        if (lineas[i].brutoCents > 0) {
          asignaciones[i] = clamp(asignaciones[i] + diff)
          break
        }
      }
    }

    // 3) Acumula por producto
    lineas.forEach((l, idx) => {
      const netoLinea = asignaciones[idx]
      const descLinea = l.brutoCents - netoLinea
      if (!productoMap[l.nombre]) productoMap[l.nombre] = { qty: 0, brutoCents: 0, netoCents: 0, descCents: 0 }
      productoMap[l.nombre].qty += l.qty
      productoMap[l.nombre].brutoCents += l.brutoCents
      productoMap[l.nombre].netoCents += netoLinea
      productoMap[l.nombre].descCents += descLinea
    })
  })

  // Salida: agrega columnas opcionales y el “i” con detalle
  return Object.entries(productoMap).map(([producto, data]) => {
    const brutoQ = fromCents(data.brutoCents)
    const netoQ  = fromCents(data.netoCents)
    const descQ  = fromCents(data.descCents)

    const row: any = {
      producto,
      cantidad: data.qty,
      ingreso: `Q${netoQ.toFixed(2)}`,
      bruto: `Q${brutoQ.toFixed(2)}`,            // 👈 siempre presentes
      descAsignado: `Q${descQ.toFixed(2)}`,      // 👈 siempre presentes
    }

    if (verDetalleProductos) {
      row.__detalle = { brutoQ, descQ, netoQ }   // solo el popover/ayuda cuando ON
    }
    return row
  })
}

      case "usuario": {
        const usuarioMap: Record<string, { tickets: number; cents: number; desc: number }> = {}

        baseDataset.forEach((op) => {
          if (!usuarioMap[op.usuario]) usuarioMap[op.usuario] = { tickets: 0, cents: 0, desc: 0 }
          usuarioMap[op.usuario].tickets += 1
          usuarioMap[op.usuario].cents += ingresoSegunModoCents(op, modoAnalisis, selectedProductName)
          usuarioMap[op.usuario].desc += op.descuento || 0
        })

        return Object.entries(usuarioMap).map(([usuario, d]) => {
          const total = fromCents(d.cents)
          return {
            usuario,
            tickets: d.tickets,
            total: `Q${total.toFixed(2)}`,
            descuento: `Q${d.desc.toFixed(2)}`,
            ticketProm: `Q${(total / d.tickets).toFixed(2)}`,
          }
        })
      }

      case "metodo": {
        return paymentMixData.map((pm) => ({
          metodo: pm.metodo,
          valor: `${pm.valor}%`,
          total: `Q${pm.valorAbsoluto.toFixed(2)}`,
        }))
      }

      default:
        return []
    }
  }, [
    vistaTabla,
    baseDataset,
    modoAnalisis,
    selectedProductName,
    sortMesaBy,
    sortMesaOrder,
    paymentMixData,
    kpis.totalVentas,
    verDetalleProductos,
  ])

    useEffect(() => {
  if (modoAnalisis !== "solo-productos" || vistaTabla !== "producto" || tableData.length === 0) return

  // Suma los Q... de la tabla
  const sum = tableData.reduce((acc, row: any) => {
    const n = Number(String(row.ingreso).replace(/[^\d.-]/g, "")) || 0
    return acc + n
  }, 0)

  const diff = Math.abs(sum - kpis.totalVentas)
  if (diff > 0.01) {
    console.warn("[reportes] mismatch productos netos vs KPI", {
      sumPorProducto: sum.toFixed(2),
      kpi: kpis.totalVentas.toFixed(2),
      diff: diff.toFixed(2),
    })
  }
}, [modoAnalisis, vistaTabla, tableData, kpis.totalVentas])

useEffect(() => {
  if (modoAnalisis !== "solo-productos" || vistaTabla !== "producto" || tableData.length === 0 || !verDetalleProductos) return

  const sumNeto  = tableData.reduce((acc: number, r: any) => acc + (Number(String(r.ingreso).replace(/[^\d.-]/g, "")) || 0), 0)
  const sumBruto = tableData.reduce((acc: number, r: any) => acc + (Number(String(r.bruto )?.replace(/[^\d.-]/g, "")) || 0), 0)
  const sumDesc  = tableData.reduce((acc: number, r: any) => acc + (Number(String(r.descAsignado)?.replace(/[^\d.-]/g, "")) || 0), 0)

  const lhs = +(sumBruto - sumDesc).toFixed(2)
  const rhs = +sumNeto.toFixed(2)
  if (Math.abs(lhs - rhs) > 0.01) {
    console.warn("[reportes] Bruto - Desc. != Neto (producto)", { lhs, rhs, sumBruto, sumDesc, sumNeto })
  }
}, [modoAnalisis, vistaTabla, tableData, verDetalleProductos])

  const hasData = baseDataset.length > 0

  // --- Fuera de mesa: participación y colapso por defecto ---
  const [fueraCollapsed, setFueraCollapsed] = useState(false)

  const fueraShare = useMemo(() => {
    // En "Solo productos" + Alcance global, kpis.totalVentas == total de productos (mesa + sin mesa)
    if (modoAnalisis !== "solo-productos" || desglosarPorMesa) return 0
    const totalProductos = kpis.totalVentas || 0
    const fuera = fueraDeMesaData.total || 0
    return totalProductos > 0 ? +((fuera * 100) / totalProductos).toFixed(1) : 0
  }, [modoAnalisis, desglosarPorMesa, kpis.totalVentas, fueraDeMesaData.total])

  useEffect(() => {
    // Colapsa por defecto si <5%. Si >20% destácala (badge en la UI de la tarjeta).
    if (modoAnalisis === "solo-productos" && !desglosarPorMesa) {
      setFueraCollapsed(fueraShare < 5)
    } else {
      setFueraCollapsed(false)
    }
  }, [modoAnalisis, desglosarPorMesa, fueraShare])

  const handleExportar = () => {
    if (!hasData) return
    toast({
      title: "Exportar",
      description: "Funcionalidad no implementada",
    })
  }

  const handleImprimir = () => {
    if (!hasData) return
    toast({
      title: "Imprimir",
      description: "Funcionalidad no implementada",
    })
  }

  const handleClearFilters = () => {
    setModoAnalisis("resumen")
    setDatePreset("mes-actual")
    setDateRange({ from: undefined, to: undefined })
    setTipoOperacion("todos")
    setMetodoPago("todos")
    setUsuario("todos")
    setMesa("todas")
    setProducto("todos")
    setDesglosarPorMesa(true)
    // Reset new filters
    setTipoMesa("todos")
    setSegmentarPorTipoMesa(false)
    setSegmentarPorTipo(false) // Resetear nuevo filtro
  }

  // 🔄 Reemplazar getTableColumns por un esquema con keys
type Col = { key: string; label: string }

function getTableSchema(
  modo: "resumen" | "solo-juego" | "solo-productos" | "solo-consumos",
  vista: "dia" | "mesa" | "juego" | "producto" | "usuario" | "metodo",
): Col[] {
  if (vista === "dia") return [
    { key: "fecha",       label: "Fecha" },
    { key: "ventas",      label: "Ventas" },
    { key: "tickets",     label: "Tickets cerrados" },
    { key: "promedio",    label: "Ticket prom." },
  ]

  if (vista === "usuario") return [
    { key: "usuario",     label: "Usuario" },
    { key: "tickets",     label: "Tickets cerrados" },
    { key: "total",       label: "Total cobrado" },
    { key: "descuento",   label: "Descuento total" },
    { key: "ticketProm",  label: "Ticket prom." },
  ]

  if (vista === "metodo") return [
    { key: "metodo",      label: "Método" },
    { key: "total",       label: "Ventas" },
    { key: "valor",       label: "% de participación" },
  ]

  if (vista === "juego") return [
    { key: "juego",       label: "Juego" },
    { key: "sesiones",    label: "Sesiones" },
    { key: "ingreso",     label: "Ingreso" },
  ]

  if (vista === "producto") return [
    { key: "producto",    label: "Producto" },
    { key: "cantidad",    label: "Cantidad vendida" },
    { key: "ingreso",     label: "Ingreso (neto)" }, // 👈 aclaramos neto aquí
  ]

  // vista === "mesa"
  if (modo === "solo-juego") return [
    { key: "mesa",            label: "Mesa" },
    { key: "sesiones",        label: "Sesiones cerradas" },
    { key: "ingresoJuego",    label: "Ingreso juego" },
    { key: "total",           label: "Total" },
  ]
  if (modo === "solo-productos") return [
    { key: "mesa",            label: "Mesa" },
    { key: "sesiones",        label: "Sesiones cerradas" },
    { key: "ingresoConsumos", label: "Ingreso consumos" },
    { key: "total",           label: "Total" },
  ]
  // resumen
  return [
    { key: "mesa",            label: "Mesa" },
    { key: "sesiones",        label: "Sesiones cerradas" },
    { key: "ingresoJuego",    label: "Ingreso juego" },
    { key: "ingresoConsumos", label: "Ingreso consumos" },
    { key: "total",           label: "Total" },
  ]
}

  const showMesaTableView = useMemo(() => {
    if (modoAnalisis === "solo-consumos") return false // no hay mesa
    if (modoAnalisis === "resumen") return true // SIEMPRE disponible en Resumen
    return desglosarPorMesa // en otros modos, sigue dependiendo del switch
  }, [modoAnalisis, desglosarPorMesa])

  const showSingleMesaCard = mesa !== "todas" && showMesaFilter && desglosarPorMesa

  const getActiveFilters = () => {
    const filters: string[] = []

    if (tipoOperacion !== "todos") {
      const tipoLabels: Record<string, string> = {
        billar: "Billar",
        juegos: "Juegos de mesa",
        "solo-consumo": "Solo consumo",
      }
      filters.push(tipoLabels[tipoOperacion])
    }

    if (mesa !== "todas") filters.push(mesa) // ← ya guardas "Mesa 3"

    if (metodoPago !== "todos") filters.push(metodoPago.charAt(0).toUpperCase() + metodoPago.slice(1))

    if (modoAnalisis === "solo-productos" && producto !== "todos") filters.push(producto) // ← literal

    if (usuario !== "todos") filters.push(usuario) // ← literal

    return filters
  }

  const activeFilters = getActiveFilters()

  const getContextChips = () => {
    const chips: string[] = []

    const modeLabels: Record<string, string> = {
      resumen: "Resumen",
      "solo-juego": "Solo juego (por mesa)",
      "solo-productos": "Solo productos (en mesa y fuera)",
      "solo-consumos": "Solo consumos (tickets sin mesa)",
    }
    chips.push(`Modo: ${modeLabels[modoAnalisis]}`)

    // Rango de fechas
    if (datePreset === "personalizado" && dateRange.from && dateRange.to) {
      chips.push(
        `${format(dateRange.from, "dd/MM/yyyy", { locale: es })} - ${format(dateRange.to, "dd/MM/yy", { locale: es })}`,
      )
    } else {
      const presetLabels: Record<string, string> = {
        hoy: "Hoy",
        ayer: "Ayer",
        "semana-actual": "Semana actual",
        "semana-anterior": "Semana anterior",
        "mes-actual": "Mes actual",
        "mes-anterior": "Mes anterior",
      }
      chips.push(presetLabels[datePreset] || "Mes actual")
    }

    if (modoAnalisis === "resumen") {
      if (usuario !== "todos") chips.push(`Usuario/Cajero: ${usuario}`) // ← literal
      if (metodoPago !== "todos") chips.push(metodoPago.charAt(0).toUpperCase() + metodoPago.slice(1))
      return chips
    }

    if (desglosarPorMesa) chips.push("Desglosado por mesa")

    if (modoAnalisis === "solo-productos" && !desglosarPorMesa && operacionesFueraDeMesa > 0) {
      chips.push(`Incluye tickets sin mesa (${operacionesFueraDeMesa})`)
    }

    if (mesa !== "todas") chips.push(mesa) // ← literal

    if (modoAnalisis === "solo-productos" && producto !== "todos") chips.push(`Producto: ${producto}`) // ← literal

    if (modoAnalisis === "resumen" && tipoOperacion !== "todos") {
      const tipoLabels: Record<string, string> = { billar: "Billar", juegos: "Juegos de mesa" }
      chips.push(`Tipo: ${tipoLabels[tipoOperacion]}`)
    }

    if (metodoPago !== "todos") chips.push(metodoPago.charAt(0).toUpperCase() + metodoPago.slice(1))
    if (usuario !== "todos") chips.push(usuario) // ← literal

    if ((modoAnalisis === "solo-juego" || modoAnalisis === "solo-productos") && tipoMesa !== "todos") {
      const tipoMesaLabels: Record<string, string> = { billar: "Tipo: Billar", juegos: "Tipo: Juegos de mesa" }
      chips.push(tipoMesaLabels[tipoMesa])
    }

    return chips
  }

  const contextChips = getContextChips()

  const getProductoNombre = () => (producto === "todos" ? null : producto)

  const productoNombre = getProductoNombre()

  const getScopeDescription = () => {
    if (selectedProductName) {
      return `Solo consumos de ${selectedProductName}`
    } else if (tipoOperacion === "billar" || tipoOperacion === "juegos") {
      return "Solo ingreso de juego"
    } else if (tipoOperacion === "solo-consumo") {
      return "Solo ingreso de consumos"
    } else {
      return "Juego + Consumos"
    }
  }

  const scopeDescription = getScopeDescription()

  const singleMesaData = useMemo(() => {
    if (mesa === "todas" || !desglosarPorMesa) return null
    const mesaOps = baseDataset.filter((op) => op.mesa === mesa)

    const sesiones = mesaOps.length
    let juegoCents = 0
    let consumosCents = 0

    mesaOps.forEach((op) => {
      if (modoAnalisis === "solo-juego") {
        juegoCents += juegoNetoCents(op)
        return
      }
      if (modoAnalisis === "solo-productos") {
        consumosCents += productosNetoCents(op, selectedProductName)
        return
      }
      // Resumen
      if (selectedProductName) {
        consumosCents += productosNetoCents(op, selectedProductName)
      } else {
        juegoCents += juegoNetoCents(op)
        consumosCents += productosNetoCents(op)
      }
    })

    const ingresoJuego = fromCents(juegoCents)
    const ingresoConsumos = fromCents(consumosCents)
    const total = modoAnalisis === "solo-juego" ? ingresoJuego : ingresoJuego + ingresoConsumos

    return { mesa, sesiones, ingresoJuego, ingresoConsumos, total }
  }, [mesa, baseDataset, desglosarPorMesa, modoAnalisis, selectedProductName])

  const getSingleMesaSubtitle = () => {
    if (modoAnalisis === "solo-juego") return "Mostrando solo ingreso de juego"
    if (modoAnalisis === "solo-productos") {
      return selectedProductName
        ? `Mostrando solo consumos de ${selectedProductName}`
        : "Mostrando solo ingreso de consumos"
    }
    // Resumen
    return selectedProductName
      ? `Mostrando solo consumos de ${selectedProductName}`
      : "Mostrando ingreso de juego + consumos"
  }

  useEffect(() => {
    if (modoAnalisis !== "solo-productos") return
    if (!hasData) return

    const tolerance = 0.5

    // 1) Calcula TOTAL con mesa directamente del dataset en centavos (consistente con el KPI)
    let conMesaCents = 0
    baseDataset.forEach((op) => {
      if (op.mesa) conMesaCents += ingresoSegunModoCents(op, modoAnalisis, selectedProductName)
    })
    const conMesa = +fromCents(conMesaCents).toFixed(2)

    // 2) “Fuera de mesa” ya lo tienes:
    const sinMesa = +fueraDeMesaData.total.toFixed(2)

    // 3) Según el alcance, valida correctamente
    const kpi = +kpis.totalVentas.toFixed(2)

    if (!desglosarPorMesa) {
      // Global: con mesa + sin mesa debe igualar KPI
      const combined = +(conMesa + sinMesa).toFixed(2)
      if (Math.abs(combined - kpi) > tolerance) {
        console.warn(
          `[v0] C3 validation failed (GLOBAL): Con mesa (${conMesa.toFixed(2)}) + Fuera de mesa (${sinMesa.toFixed(2)}) = ${combined.toFixed(2)} != KPI Total (${kpi.toFixed(2)})`,
        )
      }
    } else {
      // Desglosado por mesa: KPI ya ES "con mesa"; no mezcles sin mesa aquí
      if (Math.abs(conMesa - kpi) > tolerance) {
        console.warn(
          `[v0] C3 validation failed (MESAS): Con mesa (${conMesa.toFixed(2)}) != KPI Total (${kpi.toFixed(2)})`,
        )
      }
    }
  }, [modoAnalisis, desglosarPorMesa, hasData, baseDataset, selectedProductName, fueraDeMesaData, kpis])

  useEffect(() => {
    if (modoAnalisis === "solo-consumos") {
      // forzar la vista a "producto" para evitar "Por juego"
      setVistaTabla("producto")
    }
  }, [modoAnalisis])

  useEffect(() => {
    if (!hasData) return

    const tolerance = 0.5

    // A1: If Modo=Resumen and Producto=Todos → Top5 and Table order = Total desc
    if (modoAnalisis === "resumen" && producto === "todos") {
      if (sortMesaBy !== "total" || sortMesaOrder !== "desc") {
        console.warn("[v0] A1 violation: Modo=Resumen and Producto=Todos but sort is not Total desc")
      }
    }

    // A2: If Modo=Resumen and segmentation ON → for each bar: Juego + Productos === Total
    if (modoAnalisis === "resumen" && segmentarPorTipo && canSegmentByType && !selectedProductName) {
      topMesasData.forEach((mesa) => {
        const sum = mesa.ingresoBillar + mesa.ingresoJuegos
        if (Math.abs(sum - mesa.ingreso) > tolerance) {
          console.warn("[v0] A2 violation: Segmentation sum mismatch", {
            mesa: mesa.mesa,
            billar: mesa.ingresoBillar,
            juegos: mesa.ingresoJuegos,
            sum,
            total: mesa.ingreso,
            diff: Math.abs(sum - mesa.ingreso),
          })
        }
      })
    }

    // A3: If Producto≠Todos → hide segmentation toggle
    if (producto !== "todos" && canSegmentByType) {
      console.warn("[v0] A3 violation: Producto≠Todos but segmentation toggle is visible")
    }

    // A4: If Modo=Solo juego → Product disabled; Desglosar=ON
    if (modoAnalisis === "solo-juego") {
      if (!desglosarPorMesa) {
        console.warn("[v0] A4 violation: Modo=Solo juego but Desglosar≠ON")
      }
    }

    // A5: If Modo=Solo productos and Desglosar=OFF → chip "Incluye tickets sin mesa" visible
    if (modoAnalisis === "solo-productos" && !desglosarPorMesa) {
      const hasChip = contextChips.some((chip) => chip.includes("Incluye tickets sin mesa"))
      if (!hasChip) {
        console.warn("[v0] A5 violation: Modo=Solo productos and Desglosar=OFF but chip not visible")
      }
    }

    // A6: If empty state → show CTA
    // Already handled in UI

    if (
      (modoAnalisis === "solo-juego" || modoAnalisis === "solo-productos") &&
      segmentarPorTipoMesa &&
      canSegmentByType
    ) {
      topMesasData.forEach((mesa) => {
        const sum = mesa.ingresoBillar + mesa.ingresoJuegos
        if (Math.abs(sum - mesa.ingreso) > tolerance) {
          console.warn("[v0] Table type segmentation sum mismatch", {
            mesa: mesa.mesa,
            billar: mesa.ingresoBillar,
            juegos: mesa.ingresoJuegos,
            sum,
            total: mesa.ingreso,
            diff: Math.abs(sum - mesa.ingreso),
          })
        }
      })
    }

    // Existing validations
    const sumPorDia = dailyRevenueData.reduce((sum, d) => sum + d.ventas, 0)
    if (Math.abs(sumPorDia - kpis.totalVentas) > 0.01) {
      console.warn("[v0] KPI Total Sales ≠ sum Por día", {
        kpiTotal: kpis.totalVentas,
        sumPorDia,
        diff: Math.abs(sumPorDia - kpis.totalVentas),
      })
    }

    const sumPorMetodo = paymentMixData.reduce((sum, pm) => sum + pm.valorAbsoluto, 0)
    if (Math.abs(sumPorMetodo - kpis.totalVentas) > 0.01) {
      console.warn("[v0] KPI Total Sales ≠ sum Por método", {
        kpiTotal: kpis.totalVentas,
        sumPorMetodo,
        diff: Math.abs(sumPorMetodo - kpis.totalVentas),
      })
    }
  }, [
    hasData,
    kpis,
    dailyRevenueData,
    paymentMixData,
    modoAnalisis,
    producto,
    segmentarPorTipo,
    segmentarPorTipoMesa, // <-- Added
    canSegmentByType,
    topMesasData,
    desglosarPorMesa,
    contextChips,
    sortMesaBy,
    sortMesaOrder,
    selectedProductName, // Added selectedProductName
  ])

const cols = useMemo(() => {
  const base = getTableSchema(modoAnalisis, vistaTabla as any)
  if (vistaTabla === "producto" && verDetalleProductos) {
    // Insertamos Bruto y Desc. asignado antes de Ingreso (neto)
    const idx = base.findIndex(c => c.key === "ingreso")
    const extra: Col[] = [
      { key: "bruto",        label: "Bruto" },
      { key: "descAsignado", label: "Desc. asignado" },
    ]
    const withExtras = [...base]
    withExtras.splice(idx, 0, ...extra)
    return withExtras
  }
  return base
}, [modoAnalisis, vistaTabla, verDetalleProductos])

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <Sidebar />

        <main className="ml-16 lg:ml-64 pt-20 lg:pt-24 transition-all duration-300">
          <div className="p-6 max-w-screen-2xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Reportes</h2>
              <p className="text-muted-foreground">Análisis histórico y agregado de ventas y operaciones</p>
            </div>

            {!hasData && (
              <Card className="border-warning bg-warning/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-warning mt-0.5" />
                    <div className="space-y-2">
                      <p className="font-medium text-warning-foreground">Sin datos para el contexto actual</p>
                      <p className="text-sm text-muted-foreground">
                        Ajusta los filtros o el rango de fechas para ver información.
                      </p>
                      <Button variant="outline" size="sm" onClick={handleClearFilters} className="mt-2 bg-transparent">
                        Limpiar todos los filtros
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {hasData ? (
                    <>
                      <div className="text-2xl font-bold">
                        Q{kpis.totalVentas.toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Del periodo seleccionado</p>
                    </>
                  ) : (
                    <div className="text-muted-foreground">
                      <p className="text-sm">Sin datos</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tickets Cerrados</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpis.ticketsCerrados}</div>
                  <p className="text-xs text-muted-foreground mt-1">Operaciones con pago registrado</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {hasData ? (
                    <>
                      <div className="text-2xl font-bold">
                        Q{kpis.ticketPromedio.toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Por operación cerrada</p>
                    </>
                  ) : (
                    <div className="text-muted-foreground">
                      <p className="text-sm">Sin datos</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Método Dominante</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {hasData ? (
                    <>
                      <div className="text-2xl font-bold">{kpis.metodoDominante.metodo}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {kpis.metodoDominante.valor.toFixed(1)}% de participación
                      </p>
                    </>
                  ) : (
                    <div className="text-muted-foreground">
                      <p className="text-sm">Sin datos</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Filtros
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto">
                        <Info className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-96">
                      <div className="space-y-3">
                        <p className="font-semibold text-base">¿A dónde ir?</p>
                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>Quiero un vistazo general de ingresos y participación</strong> → Resumen.
                          </p>
                          <p>
                            <strong>Quiero saber qué mesas rinden mejor</strong> → Solo juego.
                          </p>
                          <p>
                            <strong>Quiero saber qué productos venden más (en mesa o fuera de mesa)</strong> → Solo
                            productos.
                          </p>
                          <p>
                            <strong>Quiero ver solo tickets sin mesa</strong> → Solo consumos.
                          </p>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="modoAnalisis">Modo de análisis</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-4 w-4">
                            <Info className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-2">
                            <p className="font-semibold">Modo de análisis</p>
                            <p className="text-sm text-muted-foreground">
                              <strong>Resumen:</strong> Vistazo general de ingresos y participación (juego vs
                              productos).
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <strong>Solo juego:</strong> Muestra solo ingreso de juego por mesa (producto
                              deshabilitado).
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <strong>Solo productos:</strong> Muestra solo consumos/productos (tipo de operación fijo a
                              consumos).
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <strong>Solo consumos:</strong> Vista dedicada para consumos sin mesa (personas).
                            </p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Select
                      value={modoAnalisis}
                      onValueChange={(value) => {
                        setModoAnalisis(value as "resumen" | "solo-juego" | "solo-productos" | "solo-consumos")
                      }}
                    >
                      <SelectTrigger id="modoAnalisis">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resumen">Resumen</SelectItem>
                        <SelectItem value="solo-juego">Solo juego (por mesa)</SelectItem>
                        <SelectItem value="solo-productos">Solo productos (en mesa y fuera)</SelectItem>
                        <SelectItem value="solo-consumos">Solo consumos (tickets sin mesa)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="datePreset">Rango de fechas</Label>
                    <Select value={datePreset} onValueChange={setDatePreset}>
                      <SelectTrigger id="datePreset">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hoy">Hoy</SelectItem>
                        <SelectItem value="ayer">Ayer</SelectItem>
                        <SelectItem value="semana-actual">Semana actual</SelectItem>
                        <SelectItem value="semana-anterior">Semana anterior</SelectItem>
                        <SelectItem value="mes-actual">Mes actual</SelectItem>
                        <SelectItem value="mes-anterior">Mes anterior</SelectItem>
                        <SelectItem value="personalizado">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {datePreset === "personalizado" && (
                    <div className="space-y-2">
                      <Label htmlFor="customDateRange">Desde - Hasta</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="customDateRange"
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
                            onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                            numberOfMonths={2}
                            locale={es}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}

                  {(modoAnalisis === "solo-juego" || (modoAnalisis === "solo-productos" && desglosarPorMesa)) && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label htmlFor="tipoMesa">Tipo de juego</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-4 w-4" />
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-2">
                              <p className="font-semibold">Tipo de juego</p>
                              <p className="text-sm text-muted-foreground">
                                Filtra las operaciones por tipo de mesa (Billar o Juegos de mesa).
                              </p>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <Select value={tipoMesa} onValueChange={(v) => setTipoMesa(v as "todos" | "billar" | "juegos")}>
                        <SelectTrigger id="tipoMesa">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          <SelectItem value="billar">Billar</SelectItem>
                          <SelectItem value="juegos">Juegos de mesa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {showMesaFilter && modoAnalisis !== "resumen" && (
                    <div className="space-y-2">
                      <Label htmlFor="mesa">Mesa</Label>
                      <Select value={mesa} onValueChange={setMesa}>
                        <SelectTrigger id="mesa">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todas">Todas</SelectItem>
                          {mesaOptions.length === 0
                            ? null
                            : mesaOptions.map((m) => (
                                <SelectItem key={m} value={m}>
                                  {m}
                                </SelectItem>
                              ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Mesa filter is now completely hidden in Resumen mode */}

                  <div className="space-y-2">
                    <Label htmlFor="metodoPago">Método de pago</Label>
                    <Select value={metodoPago} onValueChange={setMetodoPago}>
                      <SelectTrigger id="metodoPago">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="tarjeta">Tarjeta</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                        <SelectItem value="mixto">Mixto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="usuario">Usuario/Cajero</Label>
                    <Select value={usuario} onValueChange={setUsuario}>
                      <SelectTrigger id="usuario">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        {usuarioOptions.length === 0
                          ? null
                          : usuarioOptions.map((u) => (
                              <SelectItem key={u} value={u}>
                                {u}
                              </SelectItem>
                            ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {modoAnalisis === "solo-productos" && (
                    <div className="space-y-2">
                      <Label htmlFor="producto">Producto</Label>
                      <Select
                        value={producto}
                        onValueChange={setProducto}
                        disabled={modoAnalisis === "solo-juego" || modoAnalisis === "solo-consumos"}
                      >
                        <SelectTrigger id="producto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          {productoOptions.length === 0
                            ? null
                            : productoOptions.map((p) => (
                                <SelectItem key={p} value={p}>
                                  {p}
                                </SelectItem>
                              ))}
                        </SelectContent>
                      </Select>
                      {(modoAnalisis === "solo-juego" || modoAnalisis === "solo-consumos") && (
                        <p className="text-xs text-muted-foreground">No aplica en este modo</p>
                      )}
                    </div>
                  )}

                  {modoAnalisis !== "solo-consumos" && modoAnalisis !== "resumen" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label htmlFor="desglosarPorMesa" className="text-sm font-medium">
                          Alcance
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-4 w-4">
                              <Info className="h-3 w-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-2">
                              <p className="font-semibold">Desglosar por mesa</p>
                              <p className="text-sm text-muted-foreground">
                                <strong>ON:</strong> Solo ventas asignadas a mesa. Habilita filtro de mesa y agrupación
                                "Por mesa".
                              </p>
                              <p className="text-sm text-muted-foreground">
                                <strong>OFF:</strong> Todas las ventas (global). Oculta filtro de mesa y agrupación "Por
                                mesa".
                              </p>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="flex items-center space-x-2 h-10">
                        <Switch
                          id="desglosarPorMesa"
                          checked={desglosarPorMesa}
                          onCheckedChange={setDesglosarPorMesa}
                          disabled={modoAnalisis === "solo-juego"}
                        />
                        <Label htmlFor="desglosarPorMesa" className="text-sm cursor-pointer">
                          Desglosar por mesa
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {modoAnalisis === "solo-juego"
                          ? "Forzado ON en modo Solo juego"
                          : desglosarPorMesa
                            ? "Solo ventas asignadas a mesa"
                            : "Todas las ventas (global)"}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 auto-rows-auto items-start gap-6">
              {/* Ingresos por Día - Full width */}
              <Card className="lg:col-span-8 lg:col-start-3 xl:col-span-8 xl:col-start-3">
                <CardHeader>
                  <CardTitle>Ingresos por Día</CardTitle>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Incluye solo cierres del periodo seleccionado</p>
                    {contextChips.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {contextChips.map((chip, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {chip}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {dailyRevenueData.length > 0 && dailyRevenueData.some((d) => d.ventas > 0) ? (
                    <>
                      <ChartContainer config={chartConfig}>
                        <div className="w-full h-[220px] sm:h-[240px] md:h-[260px] lg:h-[280px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dailyRevenueData} margin={{ top: 8, right: 12, left: 0, bottom: 12 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="fecha"
                                tick={{ fontSize: 12 }}
                                height={40}
                                interval="preserveStartEnd"
                                minTickGap={10}
                              />
                              <YAxis tick={{ fontSize: 12 }} />
                              <RechartsTooltip content={<CustomDailyRevenueTooltip />} />
                              <Line
                                type="monotone"
                                dataKey="ventas"
                                stroke="var(--color-ventas)"
                                strokeWidth={2}
                                dot={{ r: 2 }}
                                connectNulls
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </ChartContainer>

                      {modoAnalisis === "resumen" && (
                        <div className="mt-4 pt-4 border-t space-y-2">
                          <p className="text-sm font-medium text-muted-foreground mb-3">Ver detalle en:</p>
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="justify-start bg-transparent"
                              onClick={() => {
                                setModoAnalisis("solo-juego")
                                // Preservar: rango de fechas, método de pago, usuario
                                // Los estados de dateRange, metodoPago y usuario ya están preservados
                                toast({
                                  title: "Modo cambiado",
                                  description: "Ahora estás viendo Solo juego (por mesa)",
                                })
                              }}
                            >
                              Ver Detalle de Juego por Mesa
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="justify-start bg-transparent"
                              onClick={() => {
                                setModoAnalisis("solo-productos")
                                // Preservar: rango de fechas, método de pago, usuario
                                toast({
                                  title: "Modo cambiado",
                                  description: "Ahora estás viendo Solo productos (en mesa y fuera)",
                                })
                              }}
                            >
                              Ver Detalle de Productos
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="justify-start bg-transparent"
                              onClick={() => {
                                setModoAnalisis("solo-consumos")
                                // Preservar: rango de fechas, método de pago, usuario
                                toast({
                                  title: "Modo cambiado",
                                  description: "Ahora estás viendo Solo consumos (tickets sin mesa)",
                                })
                              }}
                            >
                              Ver Solo Consumos (sin mesa)
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-[360px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center space-y-3">
                        <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="font-medium">Sin registros para el contexto actual</p>
                        <Button variant="outline" size="sm" onClick={handleClearFilters}>
                          Limpiar filtros
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {modoAnalisis === "resumen" && (
                <Card className="lg:col-span-6">
                  <CardHeader>
                    <div className="space-y-2">
                      <CardTitle>Participación: Juego vs. Productos</CardTitle>
                      {gameVsProductsData.length > 0 && gameVsProductsData[0].diff > 0 && (
                        <div className="text-xs text-amber-600 dark:text-amber-500 flex items-start gap-1.5 bg-amber-50 dark:bg-amber-950/20 p-2 rounded-md">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4 flex-shrink-0 mt-0.5"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>
                            Se detectó una diferencia de Q
                            {gameVsProductsData[0].diff.toLocaleString("es-GT", { minimumFractionDigits: 2 })}. Este
                            gráfico usa solo ventas cerradas con pago registrado.
                          </span>
                        </div>
                      )}
                      <div className="space-y-1">
                        {contextChips.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {contextChips.map((chip, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {chip}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {gameVsProductsData.length > 0 ? (
                      <div className="w-full h-[240px] sm:h-[260px] md:h-[280px]">
                        <LollipopChart
                          data={gameVsProductsData.map((item) => ({
                            name: item.categoria,
                            percentage: item.valor,
                            amount: item.valorAbsoluto,
                          }))}
                          colors={GAME_COLORS}
                          height={280}
                          mobileHeight={240}
                          showLegend={false}
                        />
                      </div>
                    ) : (
                      <div className="h-[280px] flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">Sin ventas en el período seleccionado</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex-col gap-1 text-sm border-t pt-3 mt-3 min-h-[40px]">
                    <div className="flex items-center gap-2 font-medium leading-none">Distribución por Categoría</div>
                    <div className="leading-none text-muted-foreground text-xs">
                      Base: Ventas Totales = Q
                      {gameVsProductsData.length > 0
                        ? gameVsProductsData[0].totalBase.toLocaleString("es-GT", { minimumFractionDigits: 2 })
                        : "0.00"}
                    </div>
                  </CardFooter>
                </Card>
              )}

              <Card className="lg:col-span-6">
                <CardHeader>
                  <div className="space-y-2">
                    <CardTitle>Participación: Método de Pago</CardTitle>
                    <div className="space-y-1">
                      {contextChips.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {contextChips.map((chip, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {chip}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {paymentMixData.length > 0 && paymentMixData.some((pm) => pm.valor > 0) ? (
                    metodoPago !== "todos" ? (
                      <div className="h-[360px] flex items-center justify-center">
                        <div className="text-center space-y-4">
                          <div className="text-4xl font-bold text-primary">
                            {metodoPago.charAt(0).toUpperCase() + metodoPago.slice(1)}
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Ventas totales</p>
                            <p className="text-3xl font-bold">
                              Q
                              {paymentMixData
                                .find((pm) => pm.metodo.toLowerCase() === metodoPago)
                                ?.valorAbsoluto.toLocaleString("es-GT", { minimumFractionDigits: 2 }) || "0.00"}
                            </p>
                            <p className="text-sm text-muted-foreground">100% del filtro seleccionado</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-full h-[240px] sm:h-[260px] md:h-[280px]">
                          <LollipopChart
                            data={paymentMixData.map((item) => ({
                              name: item.metodo,
                              percentage: item.valor,
                              amount: item.valorAbsoluto,
                            }))}
                            colors={PAY_COLORS}
                            height={280}
                            mobileHeight={240}
                            showLegend={false}
                          />
                        </div>
                      </>
                    )
                  ) : (
                    <div className="h-[280px] flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">Sin datos para mostrar</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex-col gap-1 text-sm border-t pt-3 mt-3 min-h-[40px]">
                  <div className="flex items-center gap-2 font-medium leading-none">
                    Distribución por Método de Pago
                  </div>
                  <div className="leading-none text-muted-foreground text-xs">
                    Base: Ventas Totales = Q
                    {paymentMixData.length > 0
                      ? paymentMixData
                          .reduce((sum, item) => sum + item.valorAbsoluto, 0)
                          .toLocaleString("es-GT", { minimumFractionDigits: 2 })
                      : "0.00"}
                  </div>
                </CardFooter>
              </Card>

              {modoAnalisis === "solo-productos" && !desglosarPorMesa && fueraDeMesaData.count > 0 && (
                <Card className="lg:col-span-6">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle>Fuera de mesa</CardTitle>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            Modo: Solo productos
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Alcance: Global
                          </Badge>
                          {fueraShare > 20 && (
                            <Badge variant="destructive" className="text-xs">
                              Alto: {fueraShare.toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFueraCollapsed((v) => !v)}
                        className="bg-transparent"
                      >
                        {fueraCollapsed ? "Expandir" : "Colapsar"}
                      </Button>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Total consumos fuera de mesa</p>
                        <p className="text-2xl font-bold">
                          Q{fueraDeMesaData.total.toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {fueraShare.toFixed(1)}% del total de productos
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Operaciones</p>
                        <p className="text-2xl font-bold">{fueraDeMesaData.count}</p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          Incluye tickets sin mesa ({operacionesFueraDeMesa || fueraDeMesaData.count})
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  {!fueraCollapsed && (
                    <CardContent>
                      <ChartContainer config={chartConfig}>
                        <div className="w-full h-[240px] sm:h-[260px] md:h-[280px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={fueraDeMesaData.byDay} margin={{ top: 8, right: 12, left: 0, bottom: 12 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="fecha"
                                tick={{ fontSize: 12 }}
                                interval="preserveStartEnd"
                                minTickGap={10}
                              />
                              <YAxis tick={{ fontSize: 12 }} />
                              <RechartsTooltip content={<CustomFueraMesaTooltip />} />
                              <Bar dataKey="ingreso" fill="var(--color-ingreso)" radius={[2, 2, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </ChartContainer>
                    </CardContent>
                  )}
                </Card>
              )}

              {showSingleMesaCard && singleMesaData && (
                <Card className="lg:col-span-6 flex flex-col">
                  <CardHeader>
                    <CardTitle>Desempeño de Mesa Seleccionada</CardTitle>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{getSingleMesaSubtitle()}</p>
                      {contextChips.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {contextChips.map((chip, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {chip}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="py-2">
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-primary mb-2">{singleMesaData.mesa}</div>
                        <p className="text-sm text-muted-foreground">Mesa seleccionada</p>
                      </div>

                      {/* usa grid responsivo para aprovechar ancho */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Sesiones cerradas</p>
                          <p className="text-2xl font-bold">{singleMesaData.sesiones}</p>
                        </div>
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Ingreso juego</p>
                          <p className="text-2xl font-bold">
                            Q{singleMesaData.ingresoJuego.toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Ingreso total</p>
                          <p className="text-2xl font-bold">
                            Q{singleMesaData.total.toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {showTopMesasChart && (
                <Card className="lg:col-span-6">
                  <CardHeader>
                    <div className="space-y-2">
                      <CardTitle>Top 5 mesas (por ingreso)</CardTitle>
                      {contextChips.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {contextChips.map((chip, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {chip}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        id="segmentarPorTipoMesa"
                        checked={segmentarPorTipoMesa}
                        onCheckedChange={setSegmentarPorTipoMesa}
                        disabled={!canSegmentByType}
                      />
                      <Label
                        htmlFor="segmentarPorTipoMesa"
                        className={cn("text-sm", !canSegmentByType && "text-muted-foreground")}
                      >
                        Segmentar por tipo de mesa
                      </Label>
                      {!canSegmentByType && (
                        <span className="text-xs text-muted-foreground">No hay más tipos de mesa en el resultado.</span>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    {topMesasData.length > 0 ? (
                      <ChartContainer config={chartConfig}>
                        <div className="w-full h-[240px] sm:h-[260px] md:h-[280px]">
                          <ResponsiveContainer width="100%" height="100%">
                            {(modoAnalisis === "solo-juego" && segmentarPorTipoMesa && canSegmentByType) ||
                            (modoAnalisis === "solo-productos" &&
                              desglosarPorMesa &&
                              segmentarPorTipoMesa &&
                              canSegmentByType) ? (
                              <BarChart data={topMesasData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" tick={{ fontSize: 12 }} />
                                <YAxis dataKey="mesa" type="category" tick={{ fontSize: 12 }} width={60} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Legend />
                                <Bar
                                  dataKey="ingresoBillar"
                                  stackId="a"
                                  fill="#0b6b3a"
                                  name="Billar"
                                  radius={[0, 0, 0, 0]}
                                />
                                <Bar
                                  dataKey="ingresoJuegos"
                                  stackId="a"
                                  fill="#2fbf71"
                                  name="Juegos de Mesa"
                                  radius={[0, 4, 4, 0]}
                                />
                              </BarChart>
                            ) : (
                              <BarChart data={topMesasData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" tick={{ fontSize: 12 }} />
                                <YAxis dataKey="mesa" type="category" tick={{ fontSize: 12 }} width={60} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="ingreso" fill="var(--color-ingreso)" radius={[0, 4, 4, 0]} />
                              </BarChart>
                            )}
                          </ResponsiveContainer>
                        </div>
                      </ChartContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <p className="text-sm text-muted-foreground mb-4">Sin registros para el contexto actual</p>
                        <Button variant="outline" size="sm" onClick={handleClearFilters}>
                          Limpiar filtros
                        </Button>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="flex-col gap-1 text-sm border-t pt-3 mt-3 min-h-[40px]">
                    <div className="flex items-center gap-2 font-medium leading-none">Top 5 mesas por ingreso</div>
                    <div className="leading-none text-muted-foreground text-xs">
                      Base: Ventas Totales = Q{kpis.totalVentas.toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                    </div>
                  </CardFooter>
                </Card>
              )}
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>Datos Agregados</CardTitle>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        {producto !== "todos" && vistaTabla === "producto"
                          ? `Vista consolidada del filtro actual (Producto: ${productoNombre})`
                          : `Vista consolidada de lo filtrado arriba agrupado por ${
                              vistaTabla === "dia"
                                ? "día"
                                : vistaTabla === "mesa"
                                  ? "mesa"
                                  : vistaTabla === "producto"
                                    ? "producto"
                                    : vistaTabla === "usuario"
                                      ? "usuario"
                                      : "método"
                            }`}
                      </p>
                      {contextChips.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {contextChips.map((chip, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {chip}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={vistaTabla}
                      onValueChange={(value) => {
                        if (value === "mesa" && modoAnalisis !== "resumen" && !desglosarPorMesa) {
                          setVistaTabla("dia")
                          toast({
                            title: "Vista no disponible",
                            description: 'La vista "Por mesa" requiere que Alcance esté activado.',
                            variant: "destructive",
                          })
                          console.log(
                            "[v0] Telemetry: User attempted to select 'Por mesa' with Alcance = OFF (non-Resumen)",
                          )
                          return
                        }
                        setVistaTabla(value)
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Agrupar por" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dia">Por Día</SelectItem>
                        <SelectItem value="usuario">Por Usuario</SelectItem>
                        <SelectItem value="metodo">Por Método de Pago</SelectItem>

                        {modoAnalisis !== "solo-productos" && modoAnalisis !== "solo-consumos" && (
                          <SelectItem value="juego">Por Juego</SelectItem>
                        )}

                        {modoAnalisis !== "solo-juego" && <SelectItem value="producto">Por Producto</SelectItem>}

                        {showMesaTableView && <SelectItem value="mesa">Por Mesa</SelectItem>}
                      </SelectContent>
                    </Select>
                    {vistaTabla === "mesa" && (
                      <Select
                        value={`${sortMesaBy}-${sortMesaOrder}`}
                        onValueChange={(value) => {
                          const [by, order] = value.split("-") as [
                            "total" | "sesiones" | "juego" | "consumos",
                            "asc" | "desc",
                          ]
                          setSortMesaBy(by)
                          setSortMesaOrder(order)
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Ordenar por" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="total-desc">Total (mayor a menor)</SelectItem>
                          <SelectItem value="total-asc">Total (menor a mayor)</SelectItem>
                          <SelectItem value="sesiones-desc">Sesiones (mayor a menor)</SelectItem>
                          <SelectItem value="sesiones-asc">Sesiones (menor a mayor)</SelectItem>
                          <SelectItem value="juego-desc">Ingreso juego (mayor a menor)</SelectItem>
                          <SelectItem value="juego-asc">Ingreso juego (menor a mayor)</SelectItem>
                          <SelectItem value="consumos-desc">Ingreso consumos (mayor a menor)</SelectItem>
                          <SelectItem value="consumos-asc">Ingreso consumos (menor a mayor)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
  <Table>
    <TableHeader>
  <TableRow>
    {cols.map((c) => {
      // En "producto", la columna ingreso lleva tooltip
      const isProductoNeto = vistaTabla === "producto" && c.key === "ingreso"
      return (
        <TableHead key={c.key}>
          {isProductoNeto ? (
            <div className="flex items-center gap-1">
              {c.label}
              <UITooltip>
                <TooltipTrigger asChild>
                  <button className="inline-flex items-center justify-center h-4 w-4 rounded-full text-muted-foreground">
                    <Info className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="start" className="max-w-xs text-xs">
                  Importes netos prorrateados cuando el ticket tuvo descuento.
                </TooltipContent>
              </UITooltip>
            </div>
          ) : (
            c.label
          )}
        </TableHead>
      )
    })}
  </TableRow>
</TableHeader>
    <TableBody>
  {tableData.length > 0 ? (
    tableData.map((row, idx) => (
      <TableRow key={idx}>
        {cols.map((c) => {
          const val = (row as any)[c.key]
          // Caso especial: vista producto + ingreso + detalle ON
          if (vistaTabla === "producto" && c.key === "ingreso" && verDetalleProductos && (row as any).__detalle) {
            const d = (row as any).__detalle as { brutoQ: number; descQ: number; netoQ: number }
            return (
              <TableCell key={c.key}>
                <div className="flex items-center gap-2">
                  <span>{val}</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Info className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 text-sm">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Bruto</span>
                          <span>Q{d.brutoQ.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Desc. asignado</span>
                          <span>− Q{d.descQ.toFixed(2)}</span>
                        </div>
                        <div className="border-t pt-1 flex justify-between font-medium">
                          <span>Neto</span>
                          <span>Q{d.netoQ.toFixed(2)}</span>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </TableCell>
            )
          }

          // Render normal
          return <TableCell key={c.key}>{val}</TableCell>
        })}
      </TableRow>
    ))
  ) : (
    /* ... tu vacío actual ... */
    <TableRow>
      <TableCell colSpan={cols.length} className="text-center py-8 text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <Info className="h-8 w-8 opacity-50" />
          <p className="font-medium">Sin registros para el contexto actual</p>
          <Button variant="outline" size="sm" onClick={handleClearFilters}>
            Limpiar filtros
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )}
</TableBody>
  </Table>
  {vistaTabla === "producto" && (
  <div className="flex items-center gap-2">
    <Switch id="verDetalleProductos" checked={verDetalleProductos} onCheckedChange={setVerDetalleProductos} />
    <Label htmlFor="verDetalleProductos" className="text-sm cursor-pointer">
      Mostrar detalle (Bruto / Desc.)
    </Label>
  </div>
)}
</div>
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {tableData.length} {tableData.length === 1 ? "registro" : "registros"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}
