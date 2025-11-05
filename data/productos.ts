export interface Producto {
  id: number
  nombre: string
  precio: number
  categoria: string
}

export const productos: Producto[] = [
  { id: 1, nombre: "Coca Cola", precio: 8.0, categoria: "Bebidas" },
  { id: 2, nombre: "Pepsi", precio: 8.0, categoria: "Bebidas" },
  { id: 3, nombre: "Agua Pura", precio: 5.0, categoria: "Bebidas" },
  { id: 4, nombre: "Cerveza Gallo", precio: 15.0, categoria: "Bebidas" },
  { id: 5, nombre: "Crisps Naturales", precio: 6.0, categoria: "Snacks" },
  { id: 6, nombre: "Crisps BBQ", precio: 6.0, categoria: "Snacks" },
  { id: 7, nombre: "Nachos", precio: 12.0, categoria: "Snacks" },
  { id: 8, nombre: "Cigarros Marlboro", precio: 25.0, categoria: "Cigarros" },
  { id: 9, nombre: "Cigarros Lucky Strike", precio: 22.0, categoria: "Cigarros" },
  { id: 10, nombre: "Sandwich Mixto", precio: 18.0, categoria: "Comida" },
]
