"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutGrid, Clock, BarChart3, Settings, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

const menuItems = [
  {
    title: "Mesas",
    icon: LayoutGrid,
    href: "/",
  },
  {
    title: "Resumen de Consumos",
    icon: Clock,
    href: "/consumos",
  },
  {
    title: "Reportes",
    icon: BarChart3,
    href: "/reportes",
  },
  {
    title: "Administración",
    icon: Settings,
    href: "/admin",
  },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>(["Administración"])
  const router = useRouter()
  const pathname = usePathname()

  const isItemActive = (item: (typeof menuItems)[0]) => {
    if (item.href === "/") {
      return pathname === "/" || pathname.startsWith("/mesas")
    }
    return pathname === item.href || pathname.startsWith(item.href + "/")
  }

  useState(() => {
    if (pathname.startsWith("/admin") && !expandedItems.includes("Administración")) {
      setExpandedItems(["Administración"])
    }
  })

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-[var(--header-h)] z-40 bg-sidebar border-r border-sidebar-border transition-all duration-300",
        "h-[calc(100vh-var(--header-h))] overflow-y-auto",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex flex-col h-full">
        {/* Toggle button */}
        <div className="flex justify-end p-2 border-b border-sidebar-border flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="w-8 h-8 p-0">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {/* Menu items */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = isItemActive(item)
            return (
              <Button
                key={item.href}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start h-11",
                  collapsed && "px-2",
                  isActive && "bg-sidebar-primary text-sidebar-primary-foreground",
                )}
                onClick={() => handleNavigation(item.href)}
              >
                <Icon className={cn("w-5 h-5", !collapsed && "mr-3")} />
                {!collapsed && <span className="font-medium">{item.title}</span>}
              </Button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
