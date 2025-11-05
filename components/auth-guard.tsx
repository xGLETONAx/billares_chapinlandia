"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/auth/auth-store"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isSessionValid = useAuthStore((s) => s.isSessionValid)

  useEffect(() => {
    // Public routes that don't require authentication
    const publicRoutes = ["/login"]
    const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

    if (!isPublicRoute && !isSessionValid()) {
      // Redirect to login if not authenticated
      router.push("/login")
    } else if (pathname === "/login" && isSessionValid()) {
      // Redirect to home if already authenticated and trying to access login
      router.push("/")
    }
  }, [pathname, isSessionValid, router])

  return <>{children}</>
}
