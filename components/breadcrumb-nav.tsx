"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface BreadcrumbNavProps {
  items: Array<{
    label: string
    href?: string
  }>
  backHref?: string
  backLabel?: string
}

export function BreadcrumbNav({ items, backHref = "/", backLabel = "Volver" }: BreadcrumbNavProps) {
  const router = useRouter()

  return (
    <div className="flex items-center justify-between mb-6 pt-4">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            {index > 0 && <ChevronRight className="w-4 h-4" />}
            <span className={index === items.length - 1 ? "text-foreground font-medium" : ""}>{item.label}</span>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={() => router.push(backHref)} className="flex items-center space-x-2">
        <ChevronLeft className="w-4 h-4" />
        <span>{backLabel}</span>
      </Button>
    </div>
  )
}
