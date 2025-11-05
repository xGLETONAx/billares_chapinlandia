"use client"

import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"
import Image from "next/image"
import { useAuthStore } from "@/lib/auth/auth-store"

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const session = useAuthStore((s) => s.getSession())
  const logout = useAuthStore((s) => s.logout)

  // Don't show header on login page
  if (pathname === "/login") {
    return null
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 max-w-screen-2xl mx-auto">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 relative">
            <Image
              src="/images/logo-billares-chapinlandia.jpg"
              alt="Billares Chapinlandia"
              fill
              className="object-contain"
            />
          </div>
          <h1 className="text-xl font-bold text-foreground">Billares Chapinlandia</h1>
        </div>

        {/* Usuario y cerrar sesión */}
        {session && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span>
                Usuario: <span className="font-semibold text-foreground">{session.user.nombre}</span>
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center space-x-2 bg-transparent"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
