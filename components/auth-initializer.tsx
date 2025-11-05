"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/lib/auth/auth-store"

export function AuthInitializer() {
  useEffect(() => {
    // Seed admin user on first load
    useAuthStore.getState().seedAdminUser()
  }, [])

  return null
}
