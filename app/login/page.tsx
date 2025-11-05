"use client"

import type React from "react"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Lock, UserIcon } from "lucide-react"
import { useAuthStore } from "@/lib/auth/auth-store"
import { toast } from "sonner"
import { ForgotPasswordDialog } from "@/components/forgot-password-dialog"

export default function LoginPage() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)

  const [usuario, setUsuario] = useState("")
  const [password, setPassword] = useState("")
  const [recordarme, setRecordarme] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!usuario.trim()) {
      toast.error("Por favor ingresa tu usuario")
      return
    }

    if (!password) {
      toast.error("Por favor ingresa tu contraseña")
      return
    }

    setIsLoading(true)

    try {
      const result = await login(usuario.trim(), password, recordarme)

      if (result.success) {
        toast.success("Sesión iniciada correctamente")
        router.push("/")
      } else {
        toast.error(result.error || "Error al iniciar sesión")
      }
    } catch (error) {
      toast.error("Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit(e as any)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground mb-2">Iniciar Sesión</h1>
              <p className="text-sm text-muted-foreground">Ingresa tus credenciales para acceder al sistema</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Usuario field */}
              <div className="space-y-2">
                <Label htmlFor="usuario" className="text-sm font-medium text-foreground">
                  Usuario o correo
                </Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="usuario"
                    type="text"
                    placeholder="Ingresa tu usuario o correo"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-10"
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-10 pr-10"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me and forgot password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recordarme"
                    checked={recordarme}
                    onCheckedChange={(checked) => setRecordarme(checked as boolean)}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor="recordarme"
                    className="text-sm text-foreground cursor-pointer select-none font-normal"
                  >
                    Recordarme
                  </Label>
                </div>
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(true)}
                  className="text-sm text-primary hover:underline"
                  disabled={isLoading}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Ingresando..." : "Ingresar"}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex flex-1 bg-[#0b6b3a] items-center justify-center p-8">
        <div className="text-center text-white max-w-md">
          <div className="mb-8 flex justify-center">
            <div className="w-32 h-32 relative bg-white rounded-full p-4">
              <Image
                src="/images/logo-billares-chapinlandia.jpg"
                alt="Billares Chapinlandia"
                fill
                className="object-contain rounded-full"
              />
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-4">Billares Chapinlandia</h2>
          <h3 className="text-2xl font-semibold mb-4">Bienvenido</h3>
          <p className="text-lg text-white/90">Controla mesas, consumos y cierres en un solo lugar.</p>
        </div>
      </div>

      {/* Forgot password dialog */}
      <ForgotPasswordDialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen} />
    </div>
  )
}
