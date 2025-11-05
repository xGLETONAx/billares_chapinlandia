"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface ConsumoItem {
  producto: string
  cantidad: number
  precioUnitario: number
  total: number
}

interface ResumenSoloConsumoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticketId: string
  items: ConsumoItem[]
  subtotal: number
  fechaCierre?: string
  operador?: string
}

export function ResumenSoloConsumoModal({
  open,
  onOpenChange,
  ticketId,
  items,
  subtotal,
  fechaCierre = "2024-01-15",
  operador = "Operador",
}: ResumenSoloConsumoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden" aria-describedby="sc-desc">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Resumen — Solo consumo (cerrado)</DialogTitle>
          <DialogDescription id="sc-desc" className="sr-only">
            Resumen del consumo cerrado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto">
          {/* Tabla de productos */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <h3 className="font-medium text-gray-900">Productos consumidos</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Producto</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Cantidad</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Precio unit.</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{item.producto}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-center">{item.cantidad}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">Q{item.precioUnitario.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                        Q{item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subtotal */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-green-800">Subtotal final</span>
              <span className="text-2xl font-bold text-green-900">Q{subtotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Metadatos */}
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <p>
              Cerrado el {fechaCierre} por {operador}
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="secondary" onClick={() => onOpenChange(false)} className="flex items-center gap-2">
            <X className="w-4 h-4" />
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
