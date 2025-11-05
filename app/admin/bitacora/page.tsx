"use client"

import { useState, useMemo } from "react"
import { useCatalogStore } from "@/lib/admin/catalog-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Search, CalendarIcon, User, FileText, AlertCircle } from "lucide-react"

export default function BitacoraPage() {
  const getBitacora = useCatalogStore((s) => s.getBitacora)
  const bitacora = useMemo(() => getBitacora(), [getBitacora])

  const [busqueda, setBusqueda] = useState("")
  const [filtroAccion, setFiltroAccion] = useState<string>("todas")
  const [filtroUsuario, setFiltroUsuario] = useState<string>("todos")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(),
    to: new Date(),
  })

  const accionesUnicas = useMemo(() => {
    const acciones = new Set(bitacora.map((entry) => entry.accion))
    return Array.from(acciones).sort()
  }, [bitacora])

  const usuariosUnicos = useMemo(() => {
    const usuarios = new Set(bitacora.map((entry) => entry.usuario))
    return Array.from(usuarios).sort()
  }, [bitacora])

  const bitacoraFiltrada = useMemo(() => {
    return bitacora
      .filter((entry) => {
        const cumpleAccion = filtroAccion === "todas" || entry.accion === filtroAccion
        const cumpleUsuario = filtroUsuario === "todos" || entry.usuario === filtroUsuario
        const cumpleBusqueda =
          busqueda === "" ||
          entry.accion.toLowerCase().includes(busqueda.toLowerCase()) ||
          entry.usuario.toLowerCase().includes(busqueda.toLowerCase()) ||
          (entry.referencia && entry.referencia.toLowerCase().includes(busqueda.toLowerCase())) ||
          (entry.nota && entry.nota.toLowerCase().includes(busqueda.toLowerCase()))

        let cumpleFecha = true
        if (dateRange.from || dateRange.to) {
          const entryDate = new Date(entry.fecha)
          entryDate.setHours(0, 0, 0, 0)

          if (dateRange.from && dateRange.to) {
            const from = new Date(dateRange.from)
            from.setHours(0, 0, 0, 0)
            const to = new Date(dateRange.to)
            to.setHours(23, 59, 59, 999)
            cumpleFecha = entryDate >= from && entryDate <= to
          } else if (dateRange.from) {
            const from = new Date(dateRange.from)
            from.setHours(0, 0, 0, 0)
            cumpleFecha = entryDate >= from
          } else if (dateRange.to) {
            const to = new Date(dateRange.to)
            to.setHours(23, 59, 59, 999)
            cumpleFecha = entryDate <= to
          }
        }

        return cumpleAccion && cumpleUsuario && cumpleBusqueda && cumpleFecha
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  }, [bitacora, filtroAccion, filtroUsuario, busqueda, dateRange])

  const formatFecha = (isoString: string) => {
    const date = new Date(isoString)
    return new Intl.DateTimeFormat("es-GT", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date)
  }

  const getAccionBadgeVariant = (accion: string): "default" | "secondary" | "destructive" | "outline" => {
    if (accion.toLowerCase().includes("crear") || accion.toLowerCase().includes("entrada")) return "default"
    if (accion.toLowerCase().includes("editar") || accion.toLowerCase().includes("actualizar")) return "secondary"
    if (accion.toLowerCase().includes("eliminar") || accion.toLowerCase().includes("inactivar")) return "destructive"
    return "outline"
  }

  return (
    <div className="space-y-6 px-4 pt-16 md:pt-20">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Bitácora de Actividad</h1>
        <p className="text-muted-foreground mt-2">
          Registro completo de todas las acciones realizadas en el sistema de administración
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de búsqueda</CardTitle>
          <CardDescription>Filtra las entradas de la bitácora por acción, usuario o búsqueda libre</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="busqueda">Búsqueda libre</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="busqueda"
                  placeholder="Buscar en bitácora..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filtro-accion">Acción</Label>
              <Select value={filtroAccion} onValueChange={setFiltroAccion}>
                <SelectTrigger id="filtro-accion">
                  <SelectValue placeholder="Todas las acciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las acciones</SelectItem>
                  {accionesUnicas.map((accion) => (
                    <SelectItem key={accion} value={accion}>
                      {accion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filtro-usuario">Usuario</Label>
              <Select value={filtroUsuario} onValueChange={setFiltroUsuario}>
                <SelectTrigger id="filtro-usuario">
                  <SelectValue placeholder="Todos los usuarios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los usuarios</SelectItem>
                  {usuariosUnicos.map((usuario) => (
                    <SelectItem key={usuario} value={usuario}>
                      {usuario}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha">Rango de fechas</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="fecha"
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registro de actividad</CardTitle>
          <CardDescription>
            {bitacoraFiltrada.length} {bitacoraFiltrada.length === 1 ? "entrada" : "entradas"} encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bitacoraFiltrada.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No se encontraron entradas</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                No hay entradas en la bitácora que coincidan con los filtros seleccionados. Intenta ajustar los
                criterios de búsqueda.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Fecha y hora
                      </div>
                    </TableHead>
                    <TableHead className="w-[120px]">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Usuario
                      </div>
                    </TableHead>
                    <TableHead className="w-[200px]">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Acción
                      </div>
                    </TableHead>
                    <TableHead>Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bitacoraFiltrada.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono text-xs">{formatFecha(entry.fecha)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.usuario}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getAccionBadgeVariant(entry.accion)}>{entry.accion}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {entry.referencia && (
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">Ref:</span> {entry.referencia}
                            </div>
                          )}
                          {entry.nota && <div className="text-sm">{entry.nota}</div>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">Información sobre la bitácora</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            La bitácora registra automáticamente todas las acciones realizadas en el sistema de administración,
            incluyendo:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Creación, edición y eliminación de productos</li>
            <li>Cambios en reglas de cobro y métodos de pago</li>
            <li>Gestión de motivos de corrección y descuento</li>
            <li>Actualizaciones de correlativos e identidad del negocio</li>
            <li>Movimientos de inventario (entradas y salidas)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
