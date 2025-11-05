"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { KpisConsumos } from "@/components/consumos/kpis-consumos"
import { FiltrosConsumos } from "@/components/consumos/filtros-consumos"
import { TablaConsumos } from "@/components/consumos/tabla-consumos"
import { DetalleConsumoModal } from "@/components/consumos/detalle-consumo-modal"
import { useStore } from "@/lib/store/store"
import { calcElapsed, formatElapsed } from "@/lib/store/helpers"
import type { Payment } from "@/lib/store/types"

interface ConsumoDisplay {
  id: string
  mesa: string
  codigo: string
  juego: string
  tipo: "billar" | "juegos-mesa" | "solo-consumo"
  estado: "Abierta" | "Cerrada"
  inicio: string
  tiempo: string
  subtotalConsumos: number
  totalParcial: number
  jugadores?: number
  consumos: Array<{
    id: number
    producto: string
    cantidad: number
    precio: number
    total: number
  }>
  fechaCreacion: string
  payment?: Payment
}

export default function ConsumosPage() {
  const { sesiones, getPayments } = useStore()

  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: new Date(),
    to: new Date(),
  })
  const [tipoJuego, setTipoJuego] = useState("todos")
  const [estado, setEstado] = useState("todas")
  const [busqueda, setBusqueda] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [consumoSeleccionado, setConsumoSeleccionado] = useState<ConsumoDisplay | null>(null)

    const allConsumos = useMemo((): ConsumoDisplay[] => {
    const payments = getPayments();

    // util felpudo p/fechas
    const inRange = (d: Date, from?: Date, to?: Date) => {
      if (!from && !to) return true;
      const dd = new Date(d);
      dd.setHours(0, 0, 0, 0);
      if (from) {
        const f = new Date(from); f.setHours(0,0,0,0);
        if (dd < f) return false;
      }
      if (to) {
        const t = new Date(to); t.setHours(0,0,0,0);
        if (dd > t) return false;
      }
      return true;
    };

    // 1) CERRADAS/PAGADAS: desde payments (hecho contable + snapshot)
    const cerradasDesdePayments: ConsumoDisplay[] = payments
      .filter(p => inRange(new Date(p.fecha_hora), dateRange.from, dateRange.to))
      .map((p) => {
        const esSoloConsumo = p.tipo_origen === "solo_consumo";
        const tipo: ConsumoDisplay["tipo"] = esSoloConsumo
          ? "solo-consumo"
          : (Number.parseInt(p.id_origen.replace(/\D/g, "")) <= 5 ? "billar" : "juegos-mesa");

        return {
          id: p.id, // <-- ID del pago: permite histórico aun si es "Mesa 1" repetida
          mesa: esSoloConsumo ? p.id_origen : `Mesa ${p.id_origen}`,
          codigo: esSoloConsumo ? p.id_origen : `M-${p.id_origen.padStart(3, "0")}`,
          juego: esSoloConsumo ? "Solo consumo" : (tipo === "billar" ? "Billar 30′" : "Juegos de mesa 60′"),
          tipo,
          estado: "Cerrada",
          inicio: "", // no recalculamos, el detalle ya muestra todo desde snapshot
          tiempo: (p as any).snapshot?.tiempo_congelado || "—",
          subtotalConsumos: p.snapshot.subtotal_productos,
          totalParcial: p.pago.total_neto, // en cerradas mostramos el total real
          jugadores: undefined, // si luego lo guardas en snapshot lo puedes mostrar
          consumos: p.snapshot.items.map((it, idx) => ({
            id: idx + 1,
            producto: it.nombre,
            cantidad: it.cantidad,
            precio: it.precio_unit,
            total: (it as any).total_linea ?? it.cantidad * it.precio_unit,
          })),
          fechaCreacion: new Date(p.fecha_hora).toISOString().split("T")[0],
          payment: p,
        }
      });

    // 2) ABIERTAS: desde sesiones (solo las open)
    const abiertasDesdeSesiones: ConsumoDisplay[] = sesiones
      .filter(s => s.estado === "open")
      .filter(s => inRange(new Date(s.fecha_inicio), dateRange.from, dateRange.to))
      .map((sesion) => {
        const subtotalConsumos = sesion.consumos.reduce((sum, it) => sum + it.total_linea, 0);

        // tiempo en vivo
        let tiempo = "—";
        if (sesion.tipo_origen === "mesa" && sesion.tiempo_inicio) {
          const ahora = new Date();
          const [h, m] = sesion.tiempo_inicio.split(":").map(Number);
          const inicio = new Date(sesion.fecha_inicio);
          inicio.setHours(h, m, 0, 0);
          const ms = calcElapsed(ahora, inicio);
          tiempo = formatElapsed(ms);
        }

        // costo parcial abierto (solo para mostrar)
        let costoJuego = 0;
        if (sesion.tipo_origen === "mesa" && sesion.tiempo_inicio) {
          const ahora = new Date();
          const [H, M] = sesion.tiempo_inicio.split(":").map(Number);
          const inicio = new Date(sesion.fecha_inicio);
          inicio.setHours(H, M, 0, 0);
          const ms = calcElapsed(ahora, inicio);
          const totalMin = Math.floor(ms / 1000 / 60);
          if (sesion.tipo_juego?.includes("billar")) {
            const bloques = Math.ceil(totalMin / 30);
            costoJuego = bloques * 10;
          } else {
            const horas = Math.ceil(totalMin / 60);
            costoJuego = horas * 6 * (sesion.jugadores || 2);
          }
        }

        const tipo: ConsumoDisplay["tipo"] =
          sesion.tipo_origen === "solo_consumo"
            ? "solo-consumo"
            : (sesion.tipo_juego?.includes("billar") ? "billar" : "juegos-mesa");

        const juego =
          sesion.tipo_origen === "solo_consumo"
            ? "Solo consumo"
            : (tipo === "billar" ? "Billar 30′" : "Juegos de mesa 60′");

        return {
          id: sesion.id, // distinto del payment.id
          mesa: sesion.tipo_origen === "mesa" ? `Mesa ${sesion.id_origen}` : sesion.id_origen,
          codigo: sesion.tipo_origen === "mesa" ? `M-${sesion.id_origen.padStart(3, "0")}` : sesion.id_origen,
          juego,
          tipo,
          estado: "Abierta",
          inicio: sesion.tiempo_inicio || "—",
          tiempo,
          subtotalConsumos,
          totalParcial: subtotalConsumos + costoJuego,
          jugadores: sesion.jugadores,
          consumos: sesion.consumos.map((c, idx) => ({
            id: idx + 1,
            producto: c.nombre,
            cantidad: c.cantidad,
            precio: c.precio_unit,
            total: c.total_linea,
          })),
          fechaCreacion: new Date(sesion.fecha_inicio).toISOString().split("T")[0],
          payment: undefined,
        }
      });

    // merge: primero abiertas (vivas), luego el histórico contable
    return [...abiertasDesdeSesiones, ...cerradasDesdePayments];
  }, [sesiones, getPayments, dateRange.from, dateRange.to]);


  const consumosFiltrados = useMemo(() => {
    return allConsumos.filter((consumo) => {
      // Filtro de tipo de juego
      if (tipoJuego !== "todos" && consumo.tipo !== tipoJuego) {
        return false
      }

      // Filtro de estado
      if (estado !== "todas") {
        if (estado === "abierta" && consumo.estado !== "Abierta") return false
        if (estado === "cerrada" && consumo.estado !== "Cerrada") return false
      }

      // Filtro de búsqueda (mesa o código)
      if (busqueda) {
        const searchLower = busqueda.toLowerCase()
        const mesaMatch = consumo.mesa.toLowerCase().includes(searchLower)
        const codigoMatch = consumo.codigo.toLowerCase().includes(searchLower)
        if (!mesaMatch && !codigoMatch) return false
      }

      return true
    })
  }, [allConsumos, tipoJuego, estado, busqueda])

// KPIs SOLO con pagos en rango de fechas
    const kpis = useMemo(() => {
    const payments = getPayments().filter(p => {
      const d = new Date(p.fecha_hora);
      const fromOk = !dateRange.from || d >= new Date(new Date(dateRange.from).setHours(0,0,0,0));
      const toOk   = !dateRange.to   || d <= new Date(new Date(dateRange.to).setHours(23,59,59,999));
      return fromOk && toOk;
    });

    // Ingresos reales (juego + productos – descuentos)
    const consumosHoy = payments.reduce((sum, p) => sum + (p.pago.total_neto || 0), 0);

    // Ítems vendidos (del snapshot)
    const itemsVendidos = payments.reduce((sum, p) => {
      return sum + (p.snapshot.items?.reduce((acc, it) => acc + it.cantidad, 0) || 0);
    }, 0);

    // Mesas con consumo (EXCLUYE solo-consumo)
    const mesasConConsumo = payments.filter(
      p => p.tipo_origen === "mesa" && (p.snapshot.items?.length || 0) > 0
    ).length;

    return { consumosHoy, itemsVendidos, mesasConConsumo };
  }, [getPayments, dateRange.from, dateRange.to]);

  const handleVerDetalle = (consumo: ConsumoDisplay) => {
    setConsumoSeleccionado(consumo)
    setModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />

      <main className="ml-16 lg:ml-64 pt-20 lg:pt-24 transition-all duration-300">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Encabezado */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Resumen de Consumos</h1>
            <p className="text-muted-foreground mt-1">Vista global de consumos por mesa y sesión</p>
          </div>

          {/* KPIs */}
          <KpisConsumos
            consumosHoy={kpis.consumosHoy}
            itemsVendidos={kpis.itemsVendidos}
            mesasConConsumo={kpis.mesasConConsumo}
          />

          {/* Filtros */}
          <FiltrosConsumos
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            tipoJuego={tipoJuego}
            onTipoJuegoChange={setTipoJuego}
            estado={estado}
            onEstadoChange={setEstado}
            busqueda={busqueda}
            onBusquedaChange={setBusqueda}
          />

          {/* Tabla */}
          <TablaConsumos consumos={consumosFiltrados} onVerDetalle={handleVerDetalle} />

          {/* Modal de detalle */}
          {consumoSeleccionado && (
            <DetalleConsumoModal
              isOpen={modalOpen}
              onClose={() => {
                setModalOpen(false)
                setConsumoSeleccionado(null)
              }}
              tipo={consumoSeleccionado.tipo}
              mesa={consumoSeleccionado.tipo === "solo-consumo" ? undefined : consumoSeleccionado.mesa}
              codigo={consumoSeleccionado.tipo === "solo-consumo" ? consumoSeleccionado.codigo : undefined}
              estado={consumoSeleccionado.estado}
              tiempoCongelado={consumoSeleccionado.tiempo}
              horaInicio={consumoSeleccionado.inicio}
              jugadores={consumoSeleccionado.jugadores}
              consumos={consumoSeleccionado.consumos}
              payment={consumoSeleccionado.payment}
            />
          )}
        </div>
      </main>
    </div>
  )
}
