"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface PageHeaderProps {
  title: string
  breadcrumb?: string[]
  backLabel?: string
  backUrl?: string
  fromTab?: string
}

export function PageHeader({ title, breadcrumb, backLabel = "Volver a Mesas", backUrl, fromTab }: PageHeaderProps) {
  const router = useRouter()

  const getBackUrl = () => {
    const savedTab = sessionStorage.getItem("bc.activeTab") || "billar"

    if (fromTab) {
      // Save the tab before navigating back
      sessionStorage.setItem("bc.activeTab", fromTab)
      return "/"
    }

    if (backUrl) {
      return backUrl
    }

    // Default: go back to main page with saved tab
    return "/"
  }

  const getBackLabel = () => {
    const savedTab = sessionStorage.getItem("bc.activeTab") || "billar"

    if (fromTab === "solo-consumo") {
      return "Volver a Solo consumo"
    } else if (fromTab === "juegos") {
      return "Volver a Juegos de mesa"
    } else if (savedTab === "solo-consumo") {
      return "Volver a Solo consumo"
    } else if (savedTab === "juegos") {
      return "Volver a Juegos de mesa"
    }

    return backLabel
  }

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="text-sm text-muted-foreground mb-1">{breadcrumb.join(" / ")}</div>
        )}
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          const url = getBackUrl()
          router.push(url)
        }}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {getBackLabel()}
      </Button>
    </div>
  )
}
