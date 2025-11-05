"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Package,
  Calculator,
  CreditCard,
  MessageSquare,
  Hash,
  Building2,
  Users,
  Package2,
  FileText,
  ArrowRight,
} from "lucide-react"

const adminSections = [
  {
    title: "Productos",
    description: "Gestiona el catálogo de productos, precios y disponibilidad",
    icon: Package,
    href: "/admin/productos",
    color: "text-blue-600",
  },
  {
    title: "Reglas de cobro",
    description: "Configura tarifas de billar y juegos de mesa",
    icon: Calculator,
    href: "/admin/reglas",
    color: "text-green-600",
  },
  {
    title: "Métodos de pago",
    description: "Habilita o deshabilita métodos de pago disponibles",
    icon: CreditCard,
    href: "/admin/pagos",
    color: "text-purple-600",
  },
  {
    title: "Motivos",
    description: "Define motivos para correcciones y descuentos",
    icon: MessageSquare,
    href: "/admin/motivos",
    color: "text-orange-600",
  },
  {
    title: "Correlativos",
    description: "Configura el formato de códigos para tickets de solo consumo",
    icon: Hash,
    href: "/admin/correlativos",
    color: "text-cyan-600",
  },
  {
    title: "Identidad",
    description: "Personaliza el nombre comercial y branding del negocio",
    icon: Building2,
    href: "/admin/identidad",
    color: "text-pink-600",
  },
  {
    title: "Usuarios",
    description: "Gestiona los usuarios del sistema",
    icon: Users,
    href: "/admin/usuarios",
    color: "text-gray-600",
  },
  {
    title: "Inventario",
    description: "Gestiona stock y consulta el kárdex de productos",
    icon: Package2,
    href: "/admin/inventario/stock",
    color: "text-amber-600",
  },
  {
    title: "Bitácora",
    description: "Consulta el historial de cambios y acciones del sistema",
    icon: FileText,
    href: "/admin/bitacora",
    color: "text-gray-600",
  },
]

export default function AdminPage() {
  const router = useRouter()

  return (
    <div className="max-w-7xl mx-auto px-4 pt-16 md:pt-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Administración</h1>
        <p className="text-muted-foreground">
          Gestiona catálogos y reglas que afectan las operaciones en vivo sin alterar el histórico
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section) => {
          const Icon = section.icon
          return (
            <Card
              key={section.href}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(section.href)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg bg-muted", section.color)}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
                <CardDescription className="mt-2">{section.description}</CardDescription>
              </CardHeader>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ")
}
