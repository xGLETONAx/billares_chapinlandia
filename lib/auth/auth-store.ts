import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { AuthSession, UsuarioConPassword } from "./types"
import { useCatalogStore } from "@/lib/admin/catalog-store"

// Demo flag for showing temp passwords
export const SHOW_TEMP_ON_FORGOT = false

interface AuthState {
  session: AuthSession | null
  usuarios: UsuarioConPassword[]
}

interface AuthActions {
  // Session management
  login: (usuario: string, password: string, recordarme: boolean) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  getSession: () => AuthSession | null
  isSessionValid: () => boolean

  // User management
  getUsuarios: () => UsuarioConPassword[]
  getUsuario: (id: string) => UsuarioConPassword | undefined
  getUsuarioByUsername: (usuario: string) => UsuarioConPassword | undefined
  getUsuarioByEmail: (correo: string) => UsuarioConPassword | undefined
  createUsuario: (usuario: Omit<UsuarioConPassword, "id" | "creadoEn">) => void
  updateUsuario: (id: string, updates: Partial<UsuarioConPassword>) => void
  toggleUsuarioActivo: (id: string) => boolean // returns false if can't deactivate

  // Password management
  hashPassword: (password: string) => Promise<string>
  verifyPassword: (password: string, hash: string) => Promise<boolean>
  changePassword: (userId: string, newPassword: string) => Promise<void>
  generateTempPassword: () => string
  setTempPassword: (userId: string, tempPassword: string) => Promise<void>
  forgotPassword: (usuarioOrEmail: string) => Promise<{ success: boolean; tempPassword?: string; error?: string }>

  // Initialization
  seedAdminUser: () => Promise<void>
}

const initialState: AuthState = {
  session: null,
  usuarios: [],
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Session management
      login: async (usuario, password, recordarme) => {
        const user = get().getUsuarioByUsername(usuario)

        if (!user) {
          return { success: false, error: "Credenciales inválidas" }
        }

        if (!user.activo) {
          return { success: false, error: "Usuario inactivo" }
        }

        const isValid = await get().verifyPassword(password, user.passwordHash)
        if (!isValid) {
          return { success: false, error: "Credenciales inválidas" }
        }

        // Create session
        const now = new Date()
        const expiracion = new Date(now)
        if (recordarme) {
          expiracion.setDate(expiracion.getDate() + 30) // 30 days
        } else {
          expiracion.setHours(expiracion.getHours() + 12) // 12 hours
        }

        const session: AuthSession = {
          user: {
            id: user.id,
            nombre: user.nombre,
            correo: user.correo,
            usuario: user.usuario,
            rol: user.rol,
          },
          token: crypto.randomUUID(),
          expiraEn: expiracion.toISOString(),
        }

        set({ session })

        // Log to bitácora
        useCatalogStore.getState().addBitacoraEntry({
          usuario: user.nombre,
          accion: "Login exitoso",
          nota: `Usuario: ${user.usuario}`,
        })

        return { success: true }
      },

      logout: () => {
        const session = get().session
        if (session) {
          useCatalogStore.getState().addBitacoraEntry({
            usuario: session.user.nombre,
            accion: "Logout",
            nota: `Usuario: ${session.user.usuario}`,
          })
        }
        set({ session: null })
      },

      getSession: () => {
        const session = get().session
        if (!session) return null

        // Check if expired
        const now = new Date()
        const expira = new Date(session.expiraEn)
        if (now > expira) {
          set({ session: null })
          return null
        }

        return session
      },

      isSessionValid: () => {
        return get().getSession() !== null
      },

      // User management
      getUsuarios: () => get().usuarios,

      getUsuario: (id) => get().usuarios.find((u) => u.id === id),

      getUsuarioByUsername: (usuario) => get().usuarios.find((u) => u.usuario === usuario),

      getUsuarioByEmail: (correo) => get().usuarios.find((u) => u.correo === correo),

      createUsuario: (usuario) => {
        const newUsuario: UsuarioConPassword = {
          ...usuario,
          id: `u_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          creadoEn: new Date().toISOString(),
        }

        set((state) => ({
          usuarios: [...state.usuarios, newUsuario],
        }))

        const session = get().getSession()
        useCatalogStore.getState().addBitacoraEntry({
          usuario: session?.user.nombre || "Sistema",
          accion: "Crear usuario",
          referencia: newUsuario.id,
          nota: `Usuario: ${newUsuario.nombre} (${newUsuario.usuario})`,
        })
      },

      updateUsuario: (id, updates) => {
        set((state) => ({
          usuarios: state.usuarios.map((u) => (u.id === id ? { ...u, ...updates } : u)),
        }))

        const session = get().getSession()
        useCatalogStore.getState().addBitacoraEntry({
          usuario: session?.user.nombre || "Sistema",
          accion: "Editar usuario",
          referencia: id,
          nota: `Cambios: ${Object.keys(updates).join(", ")}`,
        })
      },

      toggleUsuarioActivo: (id) => {
        const usuario = get().getUsuario(id)
        if (!usuario) return false

        // Check if this is the last active admin
        if (usuario.activo && usuario.rol === "Administrador") {
          const activeAdmins = get().usuarios.filter((u) => u.activo && u.rol === "Administrador")
          if (activeAdmins.length === 1) {
            return false // Can't deactivate last admin
          }
        }

        set((state) => ({
          usuarios: state.usuarios.map((u) => (u.id === id ? { ...u, activo: !u.activo } : u)),
        }))

        const session = get().getSession()
        useCatalogStore.getState().addBitacoraEntry({
          usuario: session?.user.nombre || "Sistema",
          accion: usuario.activo ? "Inactivar usuario" : "Activar usuario",
          referencia: id,
          nota: `Usuario: ${usuario.nombre}`,
        })

        return true
      },

      // Password management
      hashPassword: async (password) => {
        const encoder = new TextEncoder()
        const data = encoder.encode(password)
        const hashBuffer = await crypto.subtle.digest("SHA-256", data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
        return hashHex
      },

      verifyPassword: async (password, hash) => {
        const passwordHash = await get().hashPassword(password)
        return passwordHash === hash
      },

      changePassword: async (userId, newPassword) => {
        const hash = await get().hashPassword(newPassword)
        set((state) => ({
          usuarios: state.usuarios.map((u) =>
            u.id === userId ? { ...u, passwordHash: hash, mustChangePassword: false } : u,
          ),
        }))

        const session = get().getSession()
        const usuario = get().getUsuario(userId)
        useCatalogStore.getState().addBitacoraEntry({
          usuario: session?.user.nombre || "Sistema",
          accion: "Cambiar contraseña (admin)",
          referencia: userId,
          nota: `Usuario: ${usuario?.nombre}`,
        })
      },

      generateTempPassword: () => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789-"
        let password = ""
        for (let i = 0; i < 10; i++) {
          password += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return password
      },

      setTempPassword: async (userId, tempPassword) => {
        const hash = await get().hashPassword(tempPassword)
        set((state) => ({
          usuarios: state.usuarios.map((u) =>
            u.id === userId ? { ...u, passwordHash: hash, mustChangePassword: true } : u,
          ),
        }))

        const session = get().getSession()
        const usuario = get().getUsuario(userId)
        useCatalogStore.getState().addBitacoraEntry({
          usuario: session?.user.nombre || "Sistema",
          accion: "Asignar contraseña temporal",
          referencia: userId,
          nota: `Usuario: ${usuario?.nombre}`,
        })
      },

      forgotPassword: async (usuarioOrEmail) => {
        const user = get().getUsuarioByUsername(usuarioOrEmail) || get().getUsuarioByEmail(usuarioOrEmail)

        if (!user) {
          return { success: false, error: "Usuario no encontrado" }
        }

        if (!user.activo) {
          return { success: false, error: "Usuario inactivo" }
        }

        const tempPassword = get().generateTempPassword()
        await get().setTempPassword(user.id, tempPassword)

        useCatalogStore.getState().addBitacoraEntry({
          usuario: "Sistema",
          accion: "Generar contraseña temporal (desde login)",
          referencia: user.id,
          nota: `Usuario: ${user.nombre}`,
        })

        return { success: true, tempPassword: SHOW_TEMP_ON_FORGOT ? tempPassword : undefined }
      },

      // Initialization
      seedAdminUser: async () => {
        const existingAdmin = get().getUsuarioByUsername("admin")
        if (existingAdmin) return

        const passwordHash = await get().hashPassword("admin123")

        const adminUser: UsuarioConPassword = {
          id: `u_${Date.now()}_admin`,
          nombre: "Administrador",
          correo: "admin@local",
          usuario: "admin",
          rol: "Administrador",
          activo: true,
          passwordHash,
          mustChangePassword: false,
          creadoEn: new Date().toISOString(),
        }

        set((state) => ({
          usuarios: [...state.usuarios, adminUser],
        }))

        useCatalogStore.getState().addBitacoraEntry({
          usuario: "Sistema",
          accion: "Seed de usuario admin creado por Sistema",
          referencia: adminUser.id,
          nota: "Usuario inicial: admin / admin123",
        })
      },
    }),
    {
      name: "auth-session-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        session: state.session,
        usuarios: state.usuarios,
      }),
    },
  ),
)
