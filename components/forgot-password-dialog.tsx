"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore, SHOW_TEMP_ON_FORGOT } from "@/lib/auth/auth-store"
import { toast } from "sonner"
import { Copy, CheckCircle2 } from "lucide-react"

interface ForgotPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ForgotPasswordDialog({ open, onOpenChange }: ForgotPasswordDialogProps) {
  const forgotPassword = useAuthStore((s) => s.forgotPassword)

  const [usuarioOrEmail, setUsuarioOrEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [tempPassword, setTempPassword] = useState("")
  const [copied, setCopied] = useState(false)

  const handleSubmit = async () => {
    if (!usuarioOrEmail.trim()) {
      toast.error("Por favor ingresa tu usuario o correo")
      return
    }

    setIsLoading(true)

    try {
      const result = await forgotPassword(usuarioOrEmail.trim())

      if (result.success) {
        setShowSuccess(true)
        if (result.tempPassword) {
          setTempPassword(result.tempPassword)
        }
      } else {
        toast.error(result.error || "Error al generar contraseña temporal")
      }
    } catch (error) {
      toast.error("Error al procesar la solicitud")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(tempPassword)
    setCopied(true)
    toast.success("Contraseña copiada al portapapeles")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setUsuarioOrEmail("")
    setShowSuccess(false)
    setTempPassword("")
    setCopied(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {!showSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle>¿Olvidaste tu contraseña?</DialogTitle>
              <DialogDescription>
                Ingresa tu usuario o correo electrónico para generar una contraseña temporal.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="usuarioOrEmail">Usuario o correo</Label>
                <Input
                  id="usuarioOrEmail"
                  placeholder="Ingresa tu usuario o correo"
                  value={usuarioOrEmail}
                  onChange={(e) => setUsuarioOrEmail(e.target.value)}
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSubmit()
                    }
                  }}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-[#16a34a] hover:bg-[#15803d] text-white"
              >
                {isLoading ? "Generando..." : "Enviar contraseña temporal"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                Contraseña temporal generada
              </DialogTitle>
              <DialogDescription>
                {SHOW_TEMP_ON_FORGOT
                  ? "Tu contraseña temporal ha sido generada. Cópiala y úsala para iniciar sesión."
                  : "Hemos enviado una contraseña temporal al correo registrado."}
              </DialogDescription>
            </DialogHeader>

            {SHOW_TEMP_ON_FORGOT && tempPassword && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Contraseña temporal</Label>
                  <div className="flex gap-2">
                    <Input value={tempPassword} readOnly className="font-mono" />
                    <Button variant="outline" size="icon" onClick={handleCopy} className={copied ? "text-success" : ""}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Solo para demo: En producción, esta contraseña se enviaría por correo electrónico.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button onClick={handleClose} className="bg-[#16a34a] hover:bg-[#15803d] text-white">
                Entendido
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
