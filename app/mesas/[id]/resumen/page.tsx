"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ResumenMesaPage() {
  const router = useRouter()

  useEffect(() => {
    const savedTab = sessionStorage.getItem("bc.activeTab") || "billar"
    router.replace("/")
  }, [router])

  return (
    <div className="container mx-auto p-6 pt-24">
      <div className="text-center">
        <p>Redirigiendo...</p>
      </div>
    </div>
  )
}
