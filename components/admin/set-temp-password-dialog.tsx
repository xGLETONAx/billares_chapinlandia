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
import { useAuthStore } from "@/lib/auth/auth-store"
import { toast } from "sonner"
import { Copy, CheckCircle2 } from "lucide-react"
import type { UsuarioConPassword } from "@/lib/auth/types"

interface SetTempPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuario: UsuarioConPassword
}

export function SetTempPasswordDialog({ open, onOpenChange, usuario }: SetTempPasswordDialogProps) {
  const generateTempPassword = useAuthStore((s) => s.generateTempPassword)
  const setTempPassword = useAuthStore((s) => s.setTempPassword)

  const [tempPassword, setTempPasswordState] = useState("")
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleGenerate = async () => {
    setIsLoading(true)

    try {
      const password = generateTempPassword()
      await setTempPassword(usuario.id, password)
      setTempPasswordState(password)
      toast.success("Contraseña temporal generada")
    } catch (error) {
      toast.error("Error al generar contraseña temporal")
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
    setTempPasswordState("")
    setCopied(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {!tempPassword ? (
          <>
            <DialogHeader>
              <DialogTitle>Establecer contraseña temporal</DialogTitle>
              <DialogDescription>
                Se generará una contraseña temporal para {usuario.nombre}. El usuario deberá cambiarla al iniciar
                sesión.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                La contraseña temporal se generará automáticamente y se mostrará en pantalla para que puedas copiarla y
                compartirla con el usuario.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button onClick={handleGenerate} disabled={isLoading} className="bg-[#16a34a] hover:bg-[#15803d]">
                {isLoading ? "Generando..." : "Generar contraseña"}
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
                Copia esta contraseña y compártela con {usuario.nombre}. Podrá ingresar con esta contraseña y deberá
                cambiarla al entrar.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Contraseña temporal</Label>
                <div className="flex gap-2">
                  <Input value={tempPassword} readOnly className="font-mono text-lg" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    className={copied ? "text-success" : ""}
                    title="Copiar"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="bg-[#16a34a] hover:bg-[#15803d]">
                Entendido
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
