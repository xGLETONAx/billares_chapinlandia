"use client"

import type React from "react"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Package,
  Calculator,
  CreditCard,
  MessageSquare,
  Hash,
  Building2,
  Package2,
  FileText,
  ChevronRight,
  Home,
  Users,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Sidebar } from "@/components/sidebar"

const adminMenuItems = [
  {
    title: "Inicio",
    icon: Home,
    href: "/admin",
  },
  {
    title: "Productos",
    icon: Package,
    href: "/admin/productos",
  },
  {
    title: "Reglas de cobro",
    icon: Calculator,
    href: "/admin/reglas",
  },
  {
    title: "Métodos de pago",
    icon: CreditCard,
    href: "/admin/pagos",
  },
  {
    title: "Motivos",
    icon: MessageSquare,
    href: "/admin/motivos",
  },
  {
    title: "Correlativos",
    icon: Hash,
    href: "/admin/correlativos",
  },
  {
    title: "Identidad",
    icon: Building2,
    href: "/admin/identidad",
  },
  {
    title: "Usuarios",
    icon: Users,
    href: "/admin/usuarios",
  },
  {
    title: "Inventario",
    icon: Package2,
    href: "/admin/inventario",
    children: [
      { title: "Stock", href: "/admin/inventario/stock" },
      { title: "Kárdex", href: "/admin/inventario/kardex" },
    ],
  },
  {
    title: "Bitácora",
    icon: FileText,
    href: "/admin/bitacora",
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile on mount
  useState(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 768)
    }
  })

  const isItemActive = (item: (typeof adminMenuItems)[0]) => {
    if (item.children) {
      return item.children.some((child) => pathname === child.href)
    }
    return pathname === item.href
  }

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  const getCurrentPageTitle = () => {
    for (const item of adminMenuItems) {
      if (item.children) {
        const child = item.children.find((c) => c.href === pathname)
        if (child) return child.title
      }
      if (item.href === pathname) return item.title
    }
    return "Administración"
  }

  return (
    <>
      <Sidebar />

      <div className="ml-16 lg:ml-64 min-h-screen flex">
        {/* Desktop: Vertical admin sub-nav with sticky positioning */}
        <aside
          className={cn(
            "hidden md:block w-64 border-r border-border bg-card flex-shrink-0",
            "sticky top-[var(--header-h)] h-[calc(100vh-var(--header-h))] overflow-y-auto",
          )}
        >
          <div className="p-6 border-b border-border flex-shrink-0">
            <h2 className="text-xl font-bold text-foreground">Administración</h2>
            <p className="text-sm text-muted-foreground mt-1">Gestión de catálogos y reglas</p>
          </div>
          <nav className="p-4 space-y-1">
            {adminMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = isItemActive(item)

              if (item.children) {
                return (
                  <div key={item.href} className="space-y-1">
                    <div
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium cursor-pointer",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                    <div className="ml-7 space-y-1">
                      {item.children.map((child) => (
                        <button
                          key={child.href}
                          onClick={() => handleNavigation(child.href)}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-md text-sm",
                            pathname === child.href
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                          )}
                        >
                          {child.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              }

              return (
                <button
                  key={item.href}
                  onClick={() => handleNavigation(item.href)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Main content area with independent scroll */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Mobile: Select dropdown */}
          <div
            className={cn(
              "md:hidden p-4 border-b border-border bg-card flex-shrink-0",
              "sticky top-[var(--header-h)] z-10",
            )}
          >
            <Select value={pathname} onValueChange={handleNavigation}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={getCurrentPageTitle()} />
              </SelectTrigger>
              <SelectContent>
                {adminMenuItems.map((item) => {
                  if (item.children) {
                    return item.children.map((child) => (
                      <SelectItem key={child.href} value={child.href}>
                        {item.title} - {child.title}
                      </SelectItem>
                    ))
                  }
                  return (
                    <SelectItem key={item.href} value={item.href}>
                      {item.title}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Breadcrumb */}
          {pathname !== "/admin" && (
            <div
              className={cn(
                "border-b border-border bg-card px-6 py-3 flex-shrink-0",
                "sticky top-[var(--header-h)] md:top-[var(--header-h)] z-8 pt-10 md:pt-12",
              )}
            >
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/admin" className="text-sm">
                      Administración
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-sm">{getCurrentPageTitle()}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          )}

          {/* Page content with scroll */}
          <main className="flex-1 p-6 overflow-y-auto">{children}</main>
        </div>
      </div>
    </>
  )
}
