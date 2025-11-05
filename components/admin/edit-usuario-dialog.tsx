"use client"

import { useState, useEffect } from "react"
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
import { useAuthStore } from "@/lib/auth/auth-store"
import { toast } from "sonner"
import type { UsuarioConPassword } from "@/lib/auth/types"

interface EditUsuarioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuario: UsuarioConPassword
}

export function EditUsuarioDialog({ open, onOpenChange, usuario }: EditUsuarioDialogProps) {
  const updateUsuario = useAuthStore((s) => s.updateUsuario)
  const getUsuarioByUsername = useAuthStore((s) => s.getUsuarioByUsername)
  const getUsuarioByEmail = useAuthStore((s) => s.getUsuarioByEmail)

  const [nombre, setNombre] = useState(usuario.nombre)
  const [usuarioName, setUsuarioName] = useState(usuario.usuario)
  const [correo, setCorreo] = useState(usuario.correo)
  const [rol, setRol] = useState<"Administrador" | "Operador">(usuario.rol)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setNombre(usuario.nombre)
    setUsuarioName(usuario.usuario)
    setCorreo(usuario.correo)
    setRol(usuario.rol)
  }, [usuario])

  const handleSubmit = () => {
    // Validations
    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }

    if (!usuarioName.trim()) {
      toast.error("El usuario es obligatorio")
      return
    }

    if (!correo.trim()) {
      toast.error("El correo es obligatorio")
      return
    }

    // Check unique username (excluding current user)
    const existingByUsername = getUsuarioByUsername(usuarioName.trim())
    if (existingByUsername && existingByUsername.id !== usuario.id) {
      toast.error("Ya existe un usuario con ese nombre de usuario")
      return
    }

    // Check unique email (excluding current user)
    const existingByEmail = getUsuarioByEmail(correo.trim())
    if (existingByEmail && existingByEmail.id !== usuario.id) {
      toast.error("Ya existe un usuario con ese correo")
      return
    }

    setIsLoading(true)

    try {
      updateUsuario(usuario.id, {
        nombre: nombre.trim(),
        usuario: usuarioName.trim(),
        correo: correo.trim(),
        rol,
      })

      toast.success("Usuario actualizado exitosamente")
      onOpenChange(false)
    } catch (error) {
      toast.error("Error al actualizar el usuario")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
          <DialogDescription>Actualiza la información del usuario</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-nombre">Nombre *</Label>
            <Input
              id="edit-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre completo"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-usuario">Usuario *</Label>
            <Input
              id="edit-usuario"
              value={usuarioName}
              onChange={(e) => setUsuarioName(e.target.value)}
              placeholder="Nombre de usuario único"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-correo">Correo *</Label>
            <Input
              id="edit-correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="correo@ejemplo.com"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-rol">Rol</Label>
            <Select value={rol} onValueChange={(v) => setRol(v as "Administrador" | "Operador")} disabled={isLoading}>
              <SelectTrigger id="edit-rol">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Administrador">Administrador</SelectItem>
                <SelectItem value="Operador">Operador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="bg-[#16a34a] hover:bg-[#15803d]">
            {isLoading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
