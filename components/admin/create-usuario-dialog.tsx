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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useAuthStore } from "@/lib/auth/auth-store"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"

interface CreateUsuarioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateUsuarioDialog({ open, onOpenChange }: CreateUsuarioDialogProps) {
  const createUsuario = useAuthStore((s) => s.createUsuario)
  const getUsuarioByUsername = useAuthStore((s) => s.getUsuarioByUsername)
  const getUsuarioByEmail = useAuthStore((s) => s.getUsuarioByEmail)
  const hashPassword = useAuthStore((s) => s.hashPassword)

  const [nombre, setNombre] = useState("")
  const [usuario, setUsuario] = useState("")
  const [correo, setCorreo] = useState("")
  const [rol, setRol] = useState<"Administrador" | "Operador">("Operador")
  const [activo, setActivo] = useState(true)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleClose = () => {
    setNombre("")
    setUsuario("")
    setCorreo("")
    setRol("Operador")
    setActivo(true)
    setPassword("")
    setConfirmPassword("")
    setShowPassword(false)
    setShowConfirmPassword(false)
    onOpenChange(false)
  }

  const handleSubmit = async () => {
    // Validations
    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }

    if (!usuario.trim()) {
      toast.error("El usuario es obligatorio")
      return
    }

    if (!correo.trim()) {
      toast.error("El correo es obligatorio")
      return
    }

    if (!password) {
      toast.error("La contraseña es obligatoria")
      return
    }

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    // Check unique username
    if (getUsuarioByUsername(usuario.trim())) {
      toast.error("Ya existe un usuario con ese nombre de usuario")
      return
    }

    // Check unique email
    if (getUsuarioByEmail(correo.trim())) {
      toast.error("Ya existe un usuario con ese correo")
      return
    }

    setIsLoading(true)

    try {
      const passwordHash = await hashPassword(password)

      createUsuario({
        nombre: nombre.trim(),
        usuario: usuario.trim(),
        correo: correo.trim(),
        rol,
        activo,
        passwordHash,
        mustChangePassword: false,
      })

      toast.success("Usuario creado exitosamente")
      handleClose()
    } catch (error) {
      toast.error("Error al crear el usuario")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear usuario</DialogTitle>
          <DialogDescription>Crea un nuevo usuario del sistema con sus credenciales</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre completo"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="usuario">Usuario *</Label>
            <Input
              id="usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Nombre de usuario único"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">Se usará para iniciar sesión</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="correo">Correo *</Label>
            <Input
              id="correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="correo@ejemplo.com"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">Debe ser único en el sistema</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rol">Rol</Label>
            <Select value={rol} onValueChange={(v) => setRol(v as "Administrador" | "Operador")} disabled={isLoading}>
              <SelectTrigger id="rol">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Administrador">Administrador</SelectItem>
                <SelectItem value="Operador">Operador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                disabled={isLoading}
                className="pr-10"
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                disabled={isLoading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="activo">Estado activo</Label>
            <Switch id="activo" checked={activo} onCheckedChange={setActivo} disabled={isLoading} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="bg-[#16a34a] hover:bg-[#15803d]">
            {isLoading ? "Creando..." : "Crear usuario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
