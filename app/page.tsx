"use client"

import { useState, useEffect, useMemo } from "react"
import { Sidebar } from "@/components/sidebar"
import { StatsOverview } from "@/components/stats-overview"
import { MesaCard } from "@/components/mesa-card"
import { SoloConsumoCard } from "@/components/solo-consumo-card"
import { FiltrosMesas } from "@/components/filtros-mesas"
import { FiltrosSoloConsumo } from "@/components/filtros-solo-consumo"
import { LeyendaEstados } from "@/components/leyenda-estados"
import { AbrirSesionDialog } from "@/components/abrir-sesion-dialog"
import { ResumenDialog } from "@/components/resumen-dialog"
import { CarritoModal } from "@/components/carrito-modal"
import { CrearConsumoDialog } from "@/components/crear-consumo-dialog"
import { NuevaMesaDialog } from "@/components/nueva-mesa-dialog"
import { ConfirmarEliminarDialog } from "@/components/confirmar-eliminar-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { useStore } from "@/lib/store/store"
import { toast } from "sonner"
import { calcularCostoJuego, elapsedHHMM, elapsedHHMMForSesion } from "@/lib/store/helpers"
import { useCatalogStore } from "@/lib/admin/catalog-store"
import {
  calcularIngresosHoy,
  calcularMesasActivas,
  calcularTiempoPromedio,
  calcularOcupacion,
  formatearMoneda,
  formatearHoras,
  formatearPorcentaje,
} from "@/lib/kpis"

// C-YYYYMMDD-###
const nextSoloCodeFromStore = (sesiones: Array<{ tipo_origen: string; id_origen: string; fecha_inicio: string }>) => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  const todayStr = `${y}-${m}-${d}` // fecha_inicio ISO empieza con esto
  const prefix = `C-${y}${m}${d}-`

  const hoy = sesiones.filter(
    (s) => s.tipo_origen === "solo_consumo" && String(s.fecha_inicio || "").startsWith(todayStr),
  )

  const nums = hoy
    .map((s) => {
      const match = String(s.id_origen || "").match(new RegExp(`^${prefix}(\\d{3})$`))
      return match ? Number(match[1]) : 0
    })
    .filter(Boolean)

  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `${prefix}${String(next).padStart(3, "0")}`
}

// Normaliza "C-..." → "..."
const normalizeSoloConsumoCode = (code?: string) => String(code ?? "").replace(/^C-/, "")
// Extrae "C-..." de títulos del modal
const extractTicketIdFromTitle = (title?: string) => {
  const m = String(title ?? "").match(/Consumos\s+–\s+(C-[A-Za-z0-9-]+)/)
  return m ? m[1] : ""
}

function generateNextConsumoCodeDaily(existing: { ticketId: string; fechaCreacion: string }[]) {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, "0")
  const d = String(today.getDate()).padStart(2, "0")
  const prefix = `C-${y}${m}${d}-`

  const hoy = existing.filter((x) => (x.fechaCreacion || "").startsWith(`${y}-${m}-${d}`))
  const nums = hoy
    .map((x) => {
      const match = x.ticketId.match(new RegExp(`^${prefix}(\\d{3})$`))
      return match ? Number(match[1]) : 0
    })
    .filter(Boolean)
  const next = (nums.length ? Math.max(...nums) : 0) + 1

  return `${prefix}${String(next).padStart(3, "0")}`
}

const mesasData = [
  // --- Billar: 3 mesas ---
  {
    numero: 1,
    categoria: "billar" as const,
    tipo: "Billar",
    tipoJuego: "billar-30",
    estado: "abiertaPropia" as const, // una abierta para poder finalizar
    tiempoInicio: "16:00",
    consumo: 0,
    deshabilitada: false,
  },
  { numero: 2, categoria: "billar" as const, tipo: "Billar", estado: "libre" as const, deshabilitada: false },
  { numero: 3, categoria: "billar" as const, tipo: "Billar", estado: "libre" as const, deshabilitada: false },

  // --- Juegos de mesa: 3 mesas ---
  {
    numero: 9,
    categoria: "juegos" as const,
    tipo: "Dominó",
    tipoJuego: "domino-60",
    estado: "abiertaPropia" as const, // una abierta para poder finalizar
    tiempoInicio: "16:10",
    jugadores: 4,
    consumo: 0,
    deshabilitada: false,
  },
  { numero: 10, categoria: "juegos" as const, tipo: "Cartas", estado: "libre" as const, deshabilitada: false },
  { numero: 11, categoria: "juegos" as const, tipo: "Ajedrez", estado: "libre" as const, deshabilitada: false },
]

export default function HomePage() {
  const [categoriaActiva, setCategoriaActiva] = useState("billar")
  const [estadoFiltro, setEstadoFiltro] = useState("todas")
  const [busqueda, setBusqueda] = useState("")
  const [estadoFiltroSolo, setEstadoFiltroSolo] = useState("abiertos")
  const [busquedaSolo, setBusquedaSolo] = useState("")
  const debouncedBusquedaSolo = useDebounce(busquedaSolo, 300)
  const [mesaSeleccionada, setMesaSeleccionada] = useState<number | null>(null)
  const [resumenDialogOpen, setResumenDialogOpen] = useState(false)
  const [mesaResumen, setMesaResumen] = useState<any>(null)
  const [soloConsumoDialogOpen, setSoloConsumoDialogOpen] = useState(false)
  const [soloConsumoResumen, setSoloConsumoResumen] = useState<any>(null)
  const [crearConsumoDialogOpen, setCrearConsumoDialogOpen] = useState(false)
  const [carritoModalOpen, setCarritoModalOpen] = useState(false)
  const [carritoData, setCarritoData] = useState<any>(null)
  const [consumosCarrito, setConsumosCarrito] = useState<any[]>([])
  const [nuevaMesaDialogOpen, setNuevaMesaDialogOpen] = useState(false)
  const [confirmarEliminarOpen, setConfirmarEliminarOpen] = useState(false)
  const [mesaAEliminar, setMesaAEliminar] = useState<number | null>(null)
  const [mesas, setMesas] = useState(mesasData)

  const sesiones = useStore((s) => s.sesiones)
  const { getSesion } = useStore()
  const payments = useStore((s) => s.payments)

  useEffect(() => {
    setMesas((prev) =>
      prev.map((m) => {
        const sid = `sesion-mesa-${m.numero}`
        const ses = sesiones.find((s) => s.id === sid && s.estado === "open") // ← aquí el fix
        return {
          ...m,
          estado: ses ? "abiertaPropia" : "libre",
          tiempoInicio: ses?.tiempo_inicio ?? m.tiempoInicio,
          jugadores: ses?.jugadores ?? m.jugadores,
        }
      }),
    )
  }, [sesiones])

  useEffect(() => {
    if (!carritoModalOpen || !carritoData?.title) return

    // Detectar mesa o solo-consumo y su sesionId
    const esMesa = /Consumos – Mesa (\d+)/.test(carritoData.title)
    let sesionId = ""
    if (esMesa) {
      const numero = Number((carritoData.title.match(/Mesa (\d+)/) ?? [])[1] || 0)
      sesionId = `sesion-mesa-${numero}`
    } else {
      const ticketId = extractTicketIdFromTitle(carritoData.title)
      sesionId = `sesion-consumo-${normalizeSoloConsumoCode(ticketId)}`
    }

    const s = useStore.getState().getSesion?.(sesionId)
    if (!s || s.estado !== "open") {
      // Se cerró o desapareció → cerrar modal y limpiar
      setCarritoModalOpen(false)
      setConsumosCarrito([])
      setCarritoData(null)
    }
  }, [sesiones, carritoModalOpen, carritoData])

  useEffect(() => {
    const savedTab = sessionStorage.getItem("bc.activeTab")
    if (savedTab && ["billar", "juegos", "solo-consumo"].includes(savedTab)) {
      setCategoriaActiva(savedTab)
    }
  }, [])

  const handleTabChange = (newTab: string) => {
    setCategoriaActiva(newTab)
    sessionStorage.setItem("bc.activeTab", newTab)
  }

  const handleIniciarSesion = (numeroMesa: number) => {
    setMesaSeleccionada(numeroMesa)
  }

  type AbrirSesionPayload = {
    mesaNumero: number
    tipoJuego: string // ej. "billar-30", "domino-60"
    jugadores?: number // solo aplica a juegos de mesa
  }

  const handleConfirmAbrirSesion = ({ mesaNumero, tipoJuego, jugadores }: AbrirSesionPayload) => {
    const now = new Date()
    const hhmm = now.toTimeString().slice(0, 5)

    const sesionId = `sesion-mesa-${mesaNumero}`
    const nuevaSesion = {
      id: sesionId,
      tipo_origen: "mesa" as const,
      id_origen: String(mesaNumero),
      estado: "open" as const,
      fecha_inicio: now.toISOString(),
      tiempo_inicio: hhmm,
      jugadores: jugadores ?? undefined,
      tipo_juego: tipoJuego,
      consumos: [],
      importe_juego: 0,
      correcciones: [],
    }

    // ✅ Persistimos de verdad
    useStore.getState().openSesion(nuevaSesion)

    // UI local (opcional): se actualizará también por el efecto de sesiones (paso c)
    setMesas((prev) =>
      prev.map((m) => (m.numero === mesaNumero ? { ...m, estado: "abiertaPropia", tiempoInicio: hhmm } : m)),
    )

    setMesaSeleccionada(null)
  }

  const handleFinalizarSesion = (numeroMesa: number) => {
    const sesionId = `sesion-mesa-${numeroMesa}`
    const sesion = getSesion?.(sesionId)

    const toConsumos = (lines?: any[]) =>
      lines?.map((l) => ({
        id: l.producto_id ?? String(Math.random()),
        producto: l.nombre ?? l.producto ?? "Producto",
        cantidad: l.cantidad ?? 1,
        precio: l.precio_unit ?? l.precio ?? 0,
        total: l.total_linea ?? (l.precio_unit ?? 0) * (l.cantidad ?? 1),
      })) ?? []

    if (sesion) {
      const freeze = elapsedHHMM(sesion.fecha_inicio, sesion.tiempo_inicio)
      // ⬇️ congela en el store
      useStore.getState().freezeSesion(sesionId, freeze)

      setMesaResumen({
        numero: numeroMesa,
        tipoJuego: sesion.tipo_juego,
        jugadores: sesion.jugadores,
        tiempoCongelado: freeze, // el mismo que verá el modal
        consumos: toConsumos(sesion.consumos),
      })
    } else {
      // fallback demo
      const mesa = mesas.find((m) => m.numero === numeroMesa)
      const freeze = mesa?.tiempoInicio ? elapsedHHMM(new Date().toISOString(), mesa.tiempoInicio) : "00:00"
      setMesaResumen({
        numero: mesa?.numero ?? numeroMesa,
        tipoJuego: mesa?.tipoJuego,
        jugadores: mesa?.jugadores,
        tiempoCongelado: freeze,
        consumos: [],
      })
    }

    setResumenDialogOpen(true)
  }

  const handleNuevoConsumo = () => {
    setCrearConsumoDialogOpen(true)
  }

  const handleFinalizarConsumo = (ticketId: string) => {
    const sesionId = `sesion-consumo-${normalizeSoloConsumoCode(ticketId)}`
    const sesion = getSesion?.(sesionId)

    const toConsumos = (lines?: any[]) =>
      lines?.map((l) => ({
        id: l.producto_id ?? String(Math.random()),
        producto: l.nombre ?? l.producto ?? "Producto",
        cantidad: l.cantidad ?? 1,
        precio: l.precio_unit ?? l.precio ?? 0,
        total: l.total_linea ?? (l.precio_unit ?? 0) * (l.cantidad ?? 1),
      })) ?? []

    if (sesion) {
      setSoloConsumoResumen({ ticketId, consumos: toConsumos(sesion.consumos) })
    } else {
      // Si no hay sesión, no hay nada que finalizar
      return
    }

    setSoloConsumoDialogOpen(true)
  }

  const handleAbrirCarritoMesa = (numero: number, tipo: string, tipoJuego?: string) => {
    const sesionId = `sesion-mesa-${numero}`
    const s = useStore.getState().getSesion?.(sesionId)

    // Bloqueo si no hay sesión o no está open
    if (!s || s.estado !== "open") {
      toast.error("Primero inicia la sesión de la mesa para agregar consumos.")
      return
    }

    const gameChip =
      tipo === "Billar" || tipo === "Carambola"
        ? `${tipo} 30′`
        : tipoJuego
          ? `${tipoJuego.split("-")[0].charAt(0).toUpperCase() + tipoJuego.split("-")[0].slice(1)} 60′`
          : `${tipo} 60′`

    setCarritoData({
      title: `Consumos – Mesa ${numero}`,
      gameChip,
      showSessionInfo: true,
      sessionInfo: {
        tipo,
        jugadores: s?.jugadores,
        tarifa: tipo === "Billar" || tipo === "Carambola" ? "Q10 por bloque de 30′" : "Q6 por jugador por hora",
      },
    })

    // Mapear store → UI del modal
    const ui = (s?.consumos ?? []).map((c, i) => ({
      id: i + 1,
      producto: c.nombre,
      cantidad: c.cantidad,
      precio: c.precio_unit,
      total: c.total_linea,
    }))
    setConsumosCarrito(ui)
    setCarritoModalOpen(true)
  }

  const handleAbrirCarritoSoloConsumo = (ticketId: string) => {
    const sesionId = `sesion-consumo-${normalizeSoloConsumoCode(ticketId)}`
    let s = useStore.getState().getSesion?.(sesionId)

    // Si la card está "abierta" pero no hay sesión en store (caso demo), la creamos on-demand
    if (!s) {
      const now = new Date()
      useStore.getState().openSesion({
        id: sesionId,
        tipo_origen: "solo_consumo",
        id_origen: ticketId,
        estado: "open",
        fecha_inicio: now.toISOString(),
        consumos: [],
        importe_juego: 0,
        correcciones: [],
      } as any)
      s = useStore.getState().getSesion?.(sesionId)
      toast.info("Ticket abierto para agregar consumos.")
    }

    if (!s || s.estado !== "open") {
      toast.error("Este ticket no está abierto.")
      return
    }

    setCarritoData({
      title: `Consumos – ${ticketId}`,
      showSessionInfo: false,
    })

    const ui = (s?.consumos ?? []).map((c, i) => ({
      id: i + 1,
      producto: c.nombre,
      cantidad: c.cantidad,
      precio: c.precio_unit,
      total: c.total_linea,
    }))
    setConsumosCarrito(ui)
    setCarritoModalOpen(true)
  }

  const handleAddConsumo = (producto: string, cantidad: number, precio?: number, productoId?: string) => {
    if (!carritoData?.title) return

    const esMesa = /Consumos – Mesa (\d+)/.test(carritoData.title)
    if (esMesa) {
      const numero = Number((carritoData.title.match(/Mesa (\d+)/) ?? [])[1] || 0)
      const sesionId = `sesion-mesa-${numero}`

      const precioFinal = precio ?? 10 // Use catalog price or fallback
      const item = {
        producto_id: productoId ?? `prod-${Date.now()}`,
        nombre: producto,
        cantidad,
        precio_unit: precioFinal,
        total_linea: precioFinal * cantidad,
      }

      useStore.getState().addConsumoToSesion(sesionId, item)

      const s = useStore.getState().getSesion?.(sesionId)
      const ui = (s?.consumos ?? []).map((c, i) => ({
        id: i + 1,
        producto: c.nombre,
        cantidad: c.cantidad,
        precio: c.precio_unit,
        total: c.total_linea,
      }))
      setConsumosCarrito(ui)
      return
    }

    // SOLO CONSUMO
    const ticketId = extractTicketIdFromTitle(carritoData.title)
    const sesionId = `sesion-consumo-${normalizeSoloConsumoCode(ticketId)}`

    const s = useStore.getState().getSesion?.(sesionId)
    if (!s || s.estado !== "open") {
      toast.error("El ticket no está abierto. Crea/abre el consumo primero.")
      return
    }

    const precioFinal = precio ?? 10 // Use catalog price or fallback
    const item = {
      producto_id: productoId ?? `prod-${Date.now()}`,
      nombre: producto,
      cantidad,
      precio_unit: precioFinal,
      total_linea: precioFinal * cantidad,
    }

    useStore.getState().addConsumoToSesion(sesionId, item)

    const s2 = useStore.getState().getSesion?.(sesionId)
    const ui = (s2?.consumos ?? []).map((c, i) => ({
      id: i + 1,
      producto: c.nombre,
      cantidad: c.cantidad,
      precio: c.precio_unit,
      total: c.total_linea,
    }))
    setConsumosCarrito(ui)
  }

  const handleRemoveConsumo = (id: number) => {
    if (!carritoData?.title) return

    const esMesa = /Consumos – Mesa (\d+)/.test(carritoData.title)
    if (esMesa) {
      const numero = Number((carritoData.title.match(/Mesa (\d+)/) ?? [])[1] || 0)
      const sesionId = `sesion-mesa-${numero}`

      const s = useStore.getState().getSesion?.(sesionId)
      const real = (s?.consumos ?? [])[id - 1] // id = i+1
      if (!real) return

      useStore.getState().removeConsumoFromSesion(sesionId, real.producto_id)

      const s2 = useStore.getState().getSesion?.(sesionId)
      const ui = (s2?.consumos ?? []).map((c, i) => ({
        id: i + 1,
        producto: c.nombre,
        cantidad: c.cantidad,
        precio: c.precio_unit,
        total: c.total_linea,
      }))
      setConsumosCarrito(ui)
      return
    }

    // SOLO CONSUMO
    const ticketId = extractTicketIdFromTitle(carritoData.title)
    const sesionId = `sesion-consumo-${normalizeSoloConsumoCode(ticketId)}`

    const s = useStore.getState().getSesion?.(sesionId)
    const real = (s?.consumos ?? [])[id - 1]
    if (!real) return

    useStore.getState().removeConsumoFromSesion(sesionId, real.producto_id)

    const s2 = useStore.getState().getSesion?.(sesionId)
    const ui = (s2?.consumos ?? []).map((c, i) => ({
      id: i + 1,
      producto: c.nombre,
      cantidad: c.cantidad,
      precio: c.precio_unit,
      total: c.total_linea,
    }))
    setConsumosCarrito(ui)
  }

  const handleNuevaMesa = () => {
    setNuevaMesaDialogOpen(true)
  }

  const handleCrearMesa = (codigo: string, tipoMesa?: string) => {
    // Find the next available number
    const numerosExistentes = mesas.filter((m) => m.categoria === categoriaActiva).map((m) => m.numero)
    const siguienteNumero = Math.max(...numerosExistentes, 0) + 1

    let nuevaMesa: any = {
      numero: siguienteNumero,
      categoria: categoriaActiva as "billar" | "juegos",
      estado: "libre" as const,
      deshabilitada: false,
    }

    if (categoriaActiva === "billar") {
      nuevaMesa = {
        ...nuevaMesa,
        tipo: tipoMesa === "carambola-30" ? "Carambola" : "Billar",
        tipoJuego: tipoMesa,
      }
    } else {
      // For juegos de mesa, all use generic "Juegos de mesa" type
      nuevaMesa = {
        ...nuevaMesa,
        tipo: "Juegos de mesa",
        tipoJuego: "juegos-60",
      }
    }

    setMesas([...mesas, nuevaMesa])
  }

  const handleToggleHabilitar = (numeroMesa: number) => {
    setMesas((prevMesas) =>
      prevMesas.map((mesa) => (mesa.numero === numeroMesa ? { ...mesa, deshabilitada: !mesa.deshabilitada } : mesa)),
    )
  }

  const handleEliminarMesa = (numeroMesa: number) => {
    const mesa = mesas.find((m) => m.numero === numeroMesa)
    if (mesa && mesa.estado === "libre" && !mesa.deshabilitada) {
      setMesaAEliminar(numeroMesa)
      setConfirmarEliminarOpen(true)
    }
  }

  const confirmarEliminarMesa = () => {
    if (mesaAEliminar) {
      setMesas((prevMesas) => prevMesas.filter((mesa) => mesa.numero !== mesaAEliminar))
      setMesaAEliminar(null)
    }
  }

  const mesasFiltradas = mesas.filter((mesa) => {
    const cumpleCategoria = mesa.categoria === categoriaActiva

    const cumpleEstado =
      estadoFiltro === "todas" ||
      (estadoFiltro === "libre" && mesa.estado === "libre" && !mesa.deshabilitada) ||
      (estadoFiltro === "abierta" && mesa.estado === "abiertaPropia") // 👈 quitamos abiertaOtro

    const cumpleBusqueda = busqueda === "" || mesa.numero.toString().includes(busqueda)

    // Show disabled tables only in "todas" filter
    const cumpleDeshabilitada = estadoFiltro === "todas" || !mesa.deshabilitada

    return cumpleCategoria && cumpleEstado && cumpleBusqueda && cumpleDeshabilitada
  })

  const getSiguienteNumero = () => {
    const numerosExistentes = mesas.filter((m) => m.categoria === categoriaActiva).map((m) => m.numero)
    return Math.max(...numerosExistentes, 0) + 1
  }

  const soloConsumosFiltrados = useMemo(() => {
    const base = sesiones
      .filter((s) => s.tipo_origen === "solo_consumo")
      .map((s) => ({
        ticketId: s.id_origen, // ← key única
        estado: s.estado === "open" ? "abierto" : "cerrado",
        total: (s.consumos || []).reduce((acc, it) => acc + (it.total_linea || 0), 0),
        clienteNombre: "", // si no lo guardas, queda vacío
        fechaCreacion: s.fecha_inicio?.slice(0, 10) || "",
      }))

    return base.filter((consumo) => {
      const okEstado =
        estadoFiltroSolo === "todos" ||
        (estadoFiltroSolo === "abiertos" && consumo.estado === "abierto") ||
        (estadoFiltroSolo === "cerrados" && consumo.estado === "cerrado")

      const okBusqueda =
        debouncedBusquedaSolo === "" ||
        consumo.ticketId.toLowerCase().includes(debouncedBusquedaSolo.toLowerCase()) ||
        consumo.clienteNombre.toLowerCase().includes(debouncedBusquedaSolo.toLowerCase())

      return okEstado && okBusqueda
    })
  }, [sesiones, estadoFiltroSolo, debouncedBusquedaSolo])

  const handleCrearConsumo = (clienteNombre: string, nota?: string) => {
    const nuevoId = useCatalogStore.getState().getNextSoloConsumoCode()

    const now = new Date()
    useStore.getState().openSesion({
      id: `sesion-consumo-${normalizeSoloConsumoCode(nuevoId)}`,
      tipo_origen: "solo_consumo",
      id_origen: nuevoId,
      estado: "open",
      fecha_inicio: now.toISOString(),
      consumos: [],
      importe_juego: 0,
      correcciones: [],
    } as any)
  }

  const kpis = useMemo(() => {
    // Count total active tables (not disabled)
    const totalMesas = mesas.filter((m) => !m.deshabilitada).length

    // Calculate KPIs
    const ingresosHoy = calcularIngresosHoy(payments)
    const { activas, total } = calcularMesasActivas(sesiones, totalMesas)
    const tiempoPromedio = calcularTiempoPromedio(sesiones, payments)
    const ocupacion = calcularOcupacion(sesiones, totalMesas)

    return {
      mesasActivas: activas,
      mesasTotal: total,
      tiempoPromedio: formatearHoras(tiempoPromedio),
      ingresosHoy: formatearMoneda(ingresosHoy),
      ocupacion: formatearPorcentaje(ocupacion),
    }
  }, [sesiones, payments, mesas])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="ml-16 lg:ml-64 pt-20 lg:pt-24 transition-all duration-300">
        <div className="p-6 max-w-screen-2xl mx-auto">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-foreground mb-2">Mesas</h2>
            <p className="text-muted-foreground">Gestiona el estado y las sesiones de todas las mesas de billar</p>
          </div>

          <div className="mb-6">
            <StatsOverview
              mesasActivas={kpis.mesasActivas}
              mesasTotal={kpis.mesasTotal}
              tiempoPromedio={kpis.tiempoPromedio}
              ingresosHoy={kpis.ingresosHoy}
              ocupacion={kpis.ocupacion}
            />
          </div>

          <Tabs value={categoriaActiva} onValueChange={handleTabChange} className="mb-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="billar">Billar</TabsTrigger>
              <TabsTrigger value="juegos">Juegos de mesa</TabsTrigger>
              <TabsTrigger value="solo-consumo">Solo consumo</TabsTrigger>
            </TabsList>

            <TabsContent value="billar" className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <FiltrosMesas
                  estadoFiltro={estadoFiltro}
                  onEstadoChange={setEstadoFiltro}
                  busqueda={busqueda}
                  onBusquedaChange={setBusqueda}
                />
                <Button
                  onClick={handleNuevaMesa}
                  className="flex items-center gap-2"
                  style={{ backgroundColor: "#16a34a", color: "white" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#15803d"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#16a34a"
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Nueva mesa
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                {mesasFiltradas.map((mesa) => {
                  const ses = sesiones.find((s) => s.id === `sesion-mesa-${mesa.numero}` && s.estado === "open")

                  // Subtotal productos
                  const subtotal = (ses?.consumos ?? []).reduce((acc, it) => acc + (it.total_linea || 0), 0)

                  // ⬇️ HH:MM centralizado (respeta freeze si existe)
                  const hhmm = elapsedHHMMForSesion(ses)
                  const costoJuego = calcularCostoJuego(hhmm, ses?.tipo_juego, ses?.jugadores)
                  const monto = subtotal + costoJuego

                  return (
                    <MesaCard
                      key={mesa.numero}
                      numero={mesa.numero}
                      tipo={mesa.tipo}
                      tipoJuego={mesa.tipoJuego}
                      estado={mesa.estado}
                      tiempoInicio={ses?.tiempo_inicio ?? mesa.tiempoInicio}
                      jugadores={ses?.jugadores ?? mesa.jugadores}
                      consumo={monto}
                      deshabilitada={mesa.deshabilitada}
                      onIniciarSesion={handleIniciarSesion}
                      onFinalizarSesion={handleFinalizarSesion}
                      onAbrirCarrito={handleAbrirCarritoMesa}
                      onToggleHabilitar={handleToggleHabilitar}
                      onEliminar={handleEliminarMesa}
                      currentTab="billar"
                      timerHHMM={hhmm}
                    />
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="juegos" className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <FiltrosMesas
                  estadoFiltro={estadoFiltro}
                  onEstadoChange={setEstadoFiltro}
                  busqueda={busqueda}
                  onBusquedaChange={setBusqueda}
                />
                <Button
                  onClick={handleNuevaMesa}
                  className="flex items-center gap-2"
                  style={{ backgroundColor: "#16a34a", color: "white" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#15803d"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#16a34a"
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Nueva mesa
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                {mesasFiltradas.map((mesa) => {
                  const ses = sesiones.find((s) => s.id === `sesion-mesa-${mesa.numero}` && s.estado === "open")

                  const subtotal = (ses?.consumos ?? []).reduce((acc, it) => acc + (it.total_linea || 0), 0)

                  // ⬇️ HH:MM centralizado (respeta freeze si existe)
                  const hhmm = elapsedHHMMForSesion(ses)
                  const costoJuego = calcularCostoJuego(hhmm, ses?.tipo_juego, ses?.jugadores)
                  const monto = subtotal + costoJuego

                  return (
                    <MesaCard
                      key={mesa.numero}
                      numero={mesa.numero}
                      tipo={mesa.tipo}
                      tipoJuego={mesa.tipoJuego}
                      estado={mesa.estado}
                      tiempoInicio={ses?.tiempo_inicio ?? mesa.tiempoInicio}
                      jugadores={ses?.jugadores ?? mesa.jugadores}
                      consumo={monto}
                      deshabilitada={mesa.deshabilitada}
                      onIniciarSesion={handleIniciarSesion}
                      onFinalizarSesion={handleFinalizarSesion}
                      onAbrirCarrito={handleAbrirCarritoMesa}
                      onToggleHabilitar={handleToggleHabilitar}
                      onEliminar={handleEliminarMesa}
                      currentTab="juegos"
                      timerHHMM={hhmm}
                    />
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="solo-consumo" className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <FiltrosSoloConsumo
                  estadoFiltro={estadoFiltroSolo}
                  onEstadoChange={setEstadoFiltroSolo}
                  busqueda={busquedaSolo}
                  onBusquedaChange={setBusquedaSolo}
                />
                <Button
                  onClick={handleNuevoConsumo}
                  className="flex items-center gap-2"
                  style={{ backgroundColor: "#16a34a", color: "white" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#15803d"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#16a34a"
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Nuevo consumo
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                {soloConsumosFiltrados.map((consumo) => (
                  <SoloConsumoCard
                    key={consumo.ticketId}
                    ticketId={consumo.ticketId}
                    estado={consumo.estado}
                    total={consumo.total}
                    clienteNombre={consumo.clienteNombre}
                    currentTab="solo-consumo"
                    onFinalizarConsumo={handleFinalizarConsumo}
                    onAgregarConsumos={handleAbrirCarritoSoloConsumo}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <LeyendaEstados />

          <AbrirSesionDialog
            mesaNumero={mesaSeleccionada}
            categoria={categoriaActiva === "solo-consumo" ? "billar" : categoriaActiva}
            isOpen={mesaSeleccionada !== null}
            onClose={() => setMesaSeleccionada(null)}
            onConfirm={({ tipoJuego, jugadores }) =>
              handleConfirmAbrirSesion({
                mesaNumero: mesaSeleccionada as number,
                tipoJuego,
                jugadores,
              })
            }
          />

          <ResumenDialog
            isOpen={resumenDialogOpen}
            onClose={() => setResumenDialogOpen(false)}
            tipo="mesa"
            mesaNumero={mesaResumen?.numero}
            tipoJuego={mesaResumen?.tipoJuego}
            jugadores={mesaResumen?.jugadores}
            tiempoCongelado={mesaResumen?.tiempoCongelado}
            consumos={mesaResumen?.consumos || []}
            fromTab={categoriaActiva as "billar" | "juegos" | "solo-consumo"}
            onSeguirJugando={() => {
              console.log("Resuming game...")
            }}
          />

          <ResumenDialog
            isOpen={soloConsumoDialogOpen}
            onClose={() => setSoloConsumoDialogOpen(false)}
            tipo="solo-consumo"
            ticketId={soloConsumoResumen?.ticketId}
            consumos={soloConsumoResumen?.consumos || []}
            fromTab="solo-consumo"
            onSeguirJugando={() => {
              console.log("Continue consuming...")
            }}
          />

          <CarritoModal
            open={carritoModalOpen}
            onOpenChange={(open) => {
              setCarritoModalOpen(open)
              if (!open) {
                setConsumosCarrito([])
                setCarritoData(null)
              }
            }}
            title={carritoData?.title || ""}
            gameChip={carritoData?.gameChip}
            consumos={consumosCarrito}
            onAddConsumo={handleAddConsumo}
            onRemoveConsumo={handleRemoveConsumo}
            showSessionInfo={carritoData?.showSessionInfo}
            sessionInfo={carritoData?.sessionInfo}
          />

          <CrearConsumoDialog
            open={crearConsumoDialogOpen}
            onOpenChange={setCrearConsumoDialogOpen}
            onCrearConsumo={handleCrearConsumo}
          />

          <NuevaMesaDialog
            open={nuevaMesaDialogOpen}
            onOpenChange={setNuevaMesaDialogOpen}
            categoria={categoriaActiva === "solo-consumo" ? "billar" : categoriaActiva}
            onCrearMesa={handleCrearMesa}
            siguienteNumero={getSiguienteNumero()}
          />

          <ConfirmarEliminarDialog
            open={confirmarEliminarOpen}
            onOpenChange={setConfirmarEliminarOpen}
            mesaNumero={mesaAEliminar || 0}
            onConfirmar={confirmarEliminarMesa}
          />
        </div>
      </main>
    </div>
  )
}
