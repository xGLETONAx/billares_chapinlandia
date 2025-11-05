"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ResumenConsumoSoloPage() {
  const router = useRouter()

  useEffect(() => {
    sessionStorage.setItem("bc.activeTab", "solo-consumo")
    router.replace("/")
  }, [router])

  return (
    <div className="container mx-auto p-6 pt-20">
      <div className="text-center">
        <p>Redirigiendo...</p>
      </div>
    </div>
  )
}
