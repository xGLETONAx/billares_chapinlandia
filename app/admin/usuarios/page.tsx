"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Pencil, Shield, Plus, KeyRound, Key } from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/lib/auth/auth-store"
import { CreateUsuarioDialog } from "@/components/admin/create-usuario-dialog"
import { EditUsuarioDialog } from "@/components/admin/edit-usuario-dialog"
import { ChangePasswordDialog } from "@/components/admin/change-password-dialog"
import { SetTempPasswordDialog } from "@/components/admin/set-temp-password-dialog"
import type { UsuarioConPassword } from "@/lib/auth/types"

export default function UsuariosPage() {
  const usuarios = useAuthStore((s) => s.getUsuarios())
  const toggleUsuarioActivo = useAuthStore((s) => s.toggleUsuarioActivo)

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false)
  const [tempPasswordDialogOpen, setTempPasswordDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UsuarioConPassword | null>(null)

  const usuariosActivos = useMemo(() => usuarios.filter((u) => u.activo), [usuarios])

  const handleToggleActivo = (user: UsuarioConPassword) => {
    const success = toggleUsuarioActivo(user.id)

    if (!success) {
      toast.error("No puedes inactivar al último administrador activo")
      return
    }

    toast.success(user.activo ? "Usuario inactivado" : "Usuario activado")
  }

  const handleChangePassword = (user: UsuarioConPassword) => {
    setSelectedUser(user)
    setChangePasswordDialogOpen(true)
  }

  const handleSetTempPassword = (user: UsuarioConPassword) => {
    setSelectedUser(user)
    setTempPasswordDialogOpen(true)
  }

  const handleEdit = (user: UsuarioConPassword) => {
    setSelectedUser(user)
    setEditDialogOpen(true)
  }

  return (
    <div className="space-y-6 pt-16 md:pt-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground mt-2">Gestión de usuarios del sistema</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2 bg-[#16a34a] hover:bg-[#15803d]">
          <Plus className="w-4 h-4" />
          Crear usuario
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios del sistema</CardTitle>
          <CardDescription>
            Gestiona los usuarios con acceso al sistema. Todos los cambios se registran en la bitácora.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Cambiar contraseña</TableHead>
                  <TableHead>Fecha creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No hay usuarios registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  usuarios.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.nombre}</TableCell>
                      <TableCell className="text-muted-foreground">{user.usuario}</TableCell>
                      <TableCell className="text-muted-foreground">{user.correo}</TableCell>
                      <TableCell>
                        <Badge variant="default" className="gap-1">
                          <Shield className="w-3 h-3" />
                          {user.rol}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.activo ? "default" : "secondary"}>
                          {user.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.mustChangePassword ? (
                          <Badge variant="outline" className="text-warning border-warning">
                            Temporal
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.creadoEn).toLocaleDateString("es-GT")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(user)} title="Editar usuario">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleChangePassword(user)}
                            title="Cambiar contraseña"
                          >
                            <KeyRound className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetTempPassword(user)}
                            title="Establecer contraseña temporal"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button
                            variant={user.activo ? "outline" : "default"}
                            size="sm"
                            onClick={() => handleToggleActivo(user)}
                          >
                            {user.activo ? "Inactivar" : "Activar"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateUsuarioDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      {selectedUser && (
        <>
          <EditUsuarioDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} usuario={selectedUser} />
          <ChangePasswordDialog
            open={changePasswordDialogOpen}
            onOpenChange={setChangePasswordDialogOpen}
            usuario={selectedUser}
          />
          <SetTempPasswordDialog
            open={tempPasswordDialogOpen}
            onOpenChange={setTempPasswordDialogOpen}
            usuario={selectedUser}
          />
        </>
      )}
    </div>
  )
}
