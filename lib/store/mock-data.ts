import type { Producto, Sesion } from "./types"

export const mockProductos: Producto[] = [
  { id: "prod-1", nombre: "Coca Cola", precio: 8, categoria: "Bebidas" },
  { id: "prod-2", nombre: "Cerveza", precio: 12, categoria: "Bebidas" },
  { id: "prod-3", nombre: "Agua", precio: 5, categoria: "Bebidas" },
  { id: "prod-4", nombre: "Café", precio: 12, categoria: "Bebidas" },
  { id: "prod-5", nombre: "Nachos", precio: 25, categoria: "Comida" },
  { id: "prod-6", nombre: "Hamburguesa", precio: 35, categoria: "Comida" },
  { id: "prod-7", nombre: "Papas fritas", precio: 8, categoria: "Comida" },
  { id: "prod-8", nombre: "Sandwich", precio: 18, categoria: "Comida" },
]

export const mockSesionesAbiertas: Sesion[] = [
  {
    id: "sesion-mesa-1",
    tipo_origen: "mesa",
    id_origen: "1",
    estado: "open",
    fecha_inicio: new Date().toISOString(),
    tiempo_inicio: "14:30",
    tipo_juego: "billar-30",
    importe_juego: 0,
    consumos: [
      {
        producto_id: "prod-1",
        nombre: "Coca Cola",
        cantidad: 2,
        precio_unit: 8,
        total_linea: 16,
      },
      {
        producto_id: "prod-5",
        nombre: "Nachos",
        cantidad: 1,
        precio_unit: 25,
        total_linea: 25,
      },
    ],
    correcciones: [],
  },
  {
    id: "sesion-mesa-3",
    tipo_origen: "mesa",
    id_origen: "3",
    estado: "open",
    fecha_inicio: new Date().toISOString(),
    tiempo_inicio: "15:15",
    tipo_juego: "billar-30",
    importe_juego: 0,
    consumos: [],
    correcciones: [],
  },
  {
    id: "sesion-consumo-001",
    tipo_origen: "solo_consumo",
    id_origen: "C-001",
    estado: "open",
    fecha_inicio: new Date().toISOString(),
    importe_juego: 0,
    consumos: [
      {
        producto_id: "prod-1",
        nombre: "Coca Cola",
        cantidad: 1,
        precio_unit: 8,
        total_linea: 8,
      },
    ],
    correcciones: [],
  },
]
