// Authentication types
export interface AuthUser {
  id: string
  nombre: string
  correo: string
  usuario: string // username for login
  rol: "Administrador" | "Operador"
}

export interface AuthSession {
  user: AuthUser
  token: string
  expiraEn: string // ISO8601
}

export interface UsuarioConPassword {
  id: string
  nombre: string
  correo: string
  usuario: string // unique username
  rol: "Administrador" | "Operador"
  activo: boolean
  passwordHash: string // SHA-256 hex
  mustChangePassword: boolean
  creadoEn: string // ISO8601
}
