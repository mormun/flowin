"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  Pencil, Trash2, ToggleLeft, ToggleRight,
  Plus, X, Check, KeyRound, Copy, Search
} from "lucide-react"

type User = {
  id: number
  name: string
  surname: string
  email: string
  role: string
  active: boolean | null
  registration_date: string | null
}

const ROLE_LABELS: Record<string, string> = {
  user: "Usuario",
  tech: "Técnico",
  admin: "Administrador",
}

const ROLE_STYLES: Record<string, { bg: string; color: string }> = {
  user: { bg: "#dbeafe", color: "#1d4ed8" },
  tech: { bg: "var(--color-primary-light)", color: "var(--color-primary)" },
  admin: { bg: "var(--color-warning-light)", color: "var(--color-warning)" },
}

const Badge = ({ label, bg, color }: { label: string; bg: string; color: string }) => (
  <span
    className="inline-flex items-center rounded-full text-sm font-medium"
    style={{
      backgroundColor: bg,
      color,
      padding: "0.10rem 0.75rem",
      whiteSpace: "nowrap",
      lineHeight: 1.4,
    }}
  >
    {label}
  </span>
)

const Modal = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center"
    style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
    onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
  >
    <div
      className="w-full max-w-md rounded-xl shadow-xl"
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-lg)",
        padding: "2rem 2.5rem 2.5rem 2.5rem",
      }}
    >
      {children}
    </div>
  </div>
)

const FormField = ({
  label, required, children,
}: {
  label: string; required?: boolean; children: React.ReactNode
}) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
      {label}
      {required && <span style={{ color: "var(--color-error)" }}> *</span>}
    </label>
    {children}
  </div>
)

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.625rem 0.875rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  backgroundColor: "var(--color-bg)",
  color: "var(--color-text)",
  fontSize: "0.9375rem",
  outline: "none",
  transition: "border-color 150ms",
}

const inlineInputStyle: React.CSSProperties = { ...inputStyle, padding: "0.375rem 0.625rem", fontSize: "0.875rem" }

const BtnPrimary = ({
  children, onClick, disabled,
}: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex items-center gap-2 rounded-full font-medium transition disabled:opacity-50 whitespace-nowrap"
    style={{
      backgroundColor: "var(--color-primary)",
      color: "#fff",
      fontSize: "0.9375rem",
      padding: "0.55rem 1.5rem",
      border: "none",
      cursor: disabled ? "not-allowed" : "pointer",
    }}
    onMouseEnter={(e) =>
      !disabled &&
      ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-primary-hover)")
    }
    onMouseLeave={(e) =>
      !disabled &&
      ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-primary)")
    }
  >
    {children}
  </button>
)

const BtnGhost = ({
  children, onClick,
}: {
  children: React.ReactNode; onClick?: () => void
}) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition"
    style={{ color: "var(--color-text-muted)", backgroundColor: "transparent", border: "none", cursor: "pointer" }}
    onMouseEnter={(e) =>
      ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-surface-offset)")
    }
    onMouseLeave={(e) =>
      ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")
    }
  >
    {children}
  </button>
)

const BtnDanger = ({
  children, onClick,
}: {
  children: React.ReactNode; onClick?: () => void
}) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition"
    style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)", border: "none", cursor: "pointer" }}
    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.85")}
    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
  >
    {children}
  </button>
)

const IconBtn = ({
  icon, onClick, title, danger,
}: {
  icon: React.ReactNode; onClick: () => void; title?: string; danger?: boolean
}) => (
  <button
    onClick={onClick}
    title={title}
    className="flex h-8 w-8 items-center justify-center rounded-lg transition"
    style={{
      color: danger ? "var(--color-error)" : "var(--color-text-muted)",
      backgroundColor: "transparent",
      border: "none",
      cursor: "pointer",
    }}
    onMouseEnter={(e) =>
    ((e.currentTarget as HTMLElement).style.backgroundColor = danger
      ? "var(--color-error-light)"
      : "var(--color-surface-offset)")
    }
    onMouseLeave={(e) =>
      ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")
    }
  >
    {icon}
  </button>
)

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")

  const [openCreateModal, setOpenCreateModal] = useState(false)
  const [newName, setNewName] = useState("")
  const [newSurname, setNewSurname] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newRole, setNewRole] = useState("user")
  const [newPassword, setNewPassword] = useState("")
  const [creating, setCreating] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editSurname, setEditSurname] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editRole, setEditRole] = useState("")

  const [openDeleteModal, setOpenDeleteModal] = useState(false)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)

  const [openResetModal, setOpenResetModal] = useState(false)
  const [resettingUser, setResettingUser] = useState<User | null>(null)
  const [generatedPassword, setGeneratedPassword] = useState("")

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users")
      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.error ?? "Error cargando usuarios")
        return
      }
      setUsers(data)
    } catch {
      toast.error("Error cargando usuarios")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const filteredUsers = users
    .filter((u) =>
      `${u.name} ${u.surname} ${u.email}`.toLowerCase().includes(search.toLowerCase())
    )
    .filter((u) => roleFilter === "all" || u.role === roleFilter)

  const handleCreate = async () => {
    const trimmedName = newName.trim()
    const trimmedSurname = newSurname.trim()
    const trimmedEmail = newEmail.trim()

    if (!trimmedName || !trimmedSurname || !trimmedEmail) {
      toast.warning("Nombre, apellido y email son obligatorios"); return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.warning("Formato de email no válido"); return
    }
    if (newPassword && newPassword.length < 8) {
      toast.warning("La contraseña debe tener al menos 8 caracteres"); return
    }

    setCreating(true)
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          surname: trimmedSurname,
          email: trimmedEmail,
          role: newRole,
          password: newPassword || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success("Usuario creado correctamente")
      setOpenCreateModal(false)
      setNewName(""); setNewSurname(""); setNewEmail(""); setNewRole("user"); setNewPassword("")
      fetchUsers()
    } catch {
      toast.error("Error al crear usuario")
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = async (id: number) => {
    if (!editName || !editSurname || !editEmail) {
      toast.warning("Nombre, apellido y email son obligatorios"); return
    }
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: editName, surname: editSurname, email: editEmail, role: editRole }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success("Usuario actualizado")
      setEditingId(null)
      fetchUsers()
    } catch {
      toast.error("Error al actualizar usuario")
    }
  }

  const handleToggleActive = async (user: User) => {
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, active: !user.active }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Error al actualizar usuario"); return }
      toast.success(user.active ? "Usuario desactivado" : "Usuario activado")
      fetchUsers()
    } catch {
      toast.error("Error al actualizar usuario")
    }
  }

  const handleResetPassword = async () => {
    if (!resettingUser) return
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: resettingUser.id, resetPassword: true }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setGeneratedPassword(data.generatedPassword)
    } catch {
      toast.error("Error al resetear contraseña")
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return
    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deletingUser.id }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success("Usuario eliminado")
      setOpenDeleteModal(false); setDeletingUser(null)
      fetchUsers()
    } catch {
      toast.error("Error al eliminar usuario")
    }
  }

  return (
    <div style={{ width: "100%", padding: "2.5rem 4rem 3rem 3.5rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h2 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
          Usuarios
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
          Gestión de usuarios del sistema
        </p>
      </div>

      <div
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        style={{ marginBottom: "1.5rem" }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2.5"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              width: "260px",
            }}
          >
            <Search size={14} color="var(--color-text-faint)" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              className="flex-1 bg-transparent outline-none ring-0 border-0"
              style={{ color: "var(--color-text)", fontSize: "0.9375rem" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="rounded-lg outline-none"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
              fontSize: "0.9375rem",
              padding: "0.625rem 2.5rem 0.625rem 1rem",
              width: "200px",
            }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">Todos los roles</option>
            <option value="user">Usuarios</option>
            <option value="tech">Técnicos</option>
            <option value="admin">Administradores</option>
          </select>
        </div>

        <BtnPrimary onClick={() => setOpenCreateModal(true)}>
          <Plus size={15} /> Nuevo usuario
        </BtnPrimary>
      </div>

      <div
        className="w-full overflow-x-auto rounded-xl"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {loading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-10 rounded-lg animate-pulse"
                style={{ backgroundColor: "var(--color-surface-offset)" }}
              />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: "var(--color-text-faint)" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <p className="text-base font-medium" style={{ color: "var(--color-text-muted)" }}>
              No hay usuarios que mostrar
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Id", "Nombre", "Email", "Rol", "Estado", "Registro", "Acciones"].map((h, i) => (
                  <th
                    key={i}
                    className="text-sm font-semibold uppercase tracking-wider"
                    style={{
                      color: "var(--color-text-muted)",
                      paddingLeft: i === 0 ? "2rem" : undefined,
                      textAlign: i === 6 ? "right" : "left",
                      paddingRight: i === 6 ? "1.5rem" : "1rem",
                      paddingTop: "1rem",
                      paddingBottom: "1rem",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, idx) => (
                <tr
                  key={u.id}
                  style={{
                    borderBottom: idx < filteredUsers.length - 1 ? "1px solid var(--color-divider)" : "none",
                  }}
                >
                  <td
                    className="py-3.5 text-base tabular-nums font-medium"
                    style={{ color: "var(--color-text-faint)", paddingLeft: "2rem", paddingRight: "1rem" }}
                  >
                    {u.id}
                  </td>

                  {editingId === u.id ? (
                    <>
                      <td className="py-2 pr-2">
                        <div className="flex gap-1.5">
                          <input style={inlineInputStyle} value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nombre" />
                          <input style={inlineInputStyle} value={editSurname} onChange={(e) => setEditSurname(e.target.value)} placeholder="Apellido" />
                        </div>
                      </td>
                      <td className="py-2 pr-2">
                        <input style={inlineInputStyle} value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Email" />
                      </td>
                      <td className="py-2 pr-2">
                        <select style={inlineInputStyle} value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                          <option value="user">Usuario</option>
                          <option value="tech">Técnico</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </td>
                      <td /><td />
                      <td className="py-2 pr-6">
                        <div className="flex justify-end gap-1">
                          <IconBtn icon={<Check size={14} />} onClick={() => handleEdit(u.id)} title="Guardar" />
                          <IconBtn icon={<X size={14} />} onClick={() => setEditingId(null)} title="Cancelar" />
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-3.5 pr-4">
                        <span className="text-base font-medium" style={{ color: "var(--color-text)" }}>
                          {u.name} {u.surname}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 text-base" style={{ color: "var(--color-text-muted)" }}>{u.email}</td>
                      <td className="py-3.5 pr-4">
                        <Badge
                          label={ROLE_LABELS[u.role] ?? u.role}
                          bg={ROLE_STYLES[u.role]?.bg ?? "var(--color-surface-offset)"}
                          color={ROLE_STYLES[u.role]?.color ?? "var(--color-text-muted)"}
                        />
                      </td>
                      <td className="py-3.5 pr-4">
                        <Badge
                          label={u.active ? "Activo" : "Inactivo"}
                          bg={u.active ? "var(--color-success-light)" : "var(--color-surface-offset)"}
                          color={u.active ? "var(--color-success)" : "var(--color-text-muted)"}
                        />
                      </td>
                      <td className="py-3.5 pr-4 text-base tabular-nums" style={{ color: "var(--color-text-muted)" }}>
                        {u.registration_date ? new Date(u.registration_date).toLocaleDateString("es-ES") : "—"}
                      </td>
                      <td className="py-3.5 pr-6">
                        <div className="flex justify-end gap-0.5">
                          <IconBtn
                            icon={<Pencil size={16} />}
                            onClick={() => { setEditingId(u.id); setEditName(u.name); setEditSurname(u.surname); setEditEmail(u.email); setEditRole(u.role) }}
                            title="Editar"
                          />
                          <IconBtn
                            icon={u.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            onClick={() => handleToggleActive(u)}
                            title={u.active ? "Desactivar" : "Activar"}
                          />
                          <IconBtn
                            icon={<KeyRound size={16} />}
                            onClick={() => { setResettingUser(u); setGeneratedPassword(""); setOpenResetModal(true) }}
                            title="Resetear contraseña"
                          />
                          <IconBtn
                            icon={<Trash2 size={16} />}
                            onClick={() => { setDeletingUser(u); setOpenDeleteModal(true) }}
                            title="Eliminar"
                            danger
                          />
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {openCreateModal && (
        <Modal onClose={() => setOpenCreateModal(false)}>
          <div className="flex items-center justify-between" style={{ marginBottom: "1.75rem" }}>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                Nuevo usuario
              </h3>
              <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                Rellena los datos del nuevo usuario
              </p>
            </div>
            <IconBtn icon={<X size={16} />} onClick={() => setOpenCreateModal(false)} />
          </div>

          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Nombre" required>
                <input style={inputStyle} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre" maxLength={80} />
              </FormField>
              <FormField label="Apellido" required>
                <input style={inputStyle} value={newSurname} onChange={(e) => setNewSurname(e.target.value)} placeholder="Apellido" maxLength={100} />
              </FormField>
            </div>
            <FormField label="Email" required>
              <input type="email" style={inputStyle} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="correo@ejemplo.com" maxLength={150} />
            </FormField>
            <FormField label="Rol" required>
              <select style={inputStyle} value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                <option value="user">Usuario</option>
                <option value="tech">Técnico</option>
                <option value="admin">Administrador</option>
              </select>
            </FormField>
            <FormField label="Contraseña inicial">
              <input
                type="password"
                style={inputStyle}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Opcional — déjalo vacío si solo usará Google"
                minLength={8}
                maxLength={72}
              />
              <p
                className="text-xs mt-1.5"
                style={{ color: "var(--color-text-muted)" }}
              >
                Si se deja vacío, el usuario solo podrá iniciar sesión con Google.
              </p>
            </FormField>

            <div style={{ height: "1px", backgroundColor: "var(--color-divider)" }} />

            <div className="flex justify-end gap-2">
              <BtnGhost onClick={() => {
                setOpenCreateModal(false)
                setNewName(""); setNewSurname(""); setNewEmail(""); setNewRole("user"); setNewPassword("")
              }}>
                Cancelar
              </BtnGhost>
              <BtnPrimary onClick={handleCreate} disabled={creating}>
                {creating ? (
                  <>
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Creando...
                  </>
                ) : "Crear usuario"}
              </BtnPrimary>
            </div>
          </div>
        </Modal>
      )}

      {openResetModal && resettingUser && (
        <Modal onClose={() => { setOpenResetModal(false); setResettingUser(null); setGeneratedPassword("") }}>
          <div className="flex items-center justify-between" style={{ marginBottom: "1.75rem" }}>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                Resetear contraseña
              </h3>
              <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                {resettingUser.name} {resettingUser.surname}
              </p>
            </div>
            <IconBtn icon={<X size={16} />} onClick={() => { setOpenResetModal(false); setResettingUser(null); setGeneratedPassword("") }} />
          </div>

          <p className="text-sm" style={{ color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
            Se generará una nueva contraseña aleatoria para este usuario. Deberás compartírsela manualmente.
          </p>

          {generatedPassword ? (
            <div className="flex flex-col gap-3" style={{ marginBottom: "1.5rem" }}>
              <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
                Nueva contraseña generada:
              </p>
              <div
                className="flex items-center gap-3 rounded-lg px-4 py-3"
                style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
              >
                <span className="flex-1 font-mono text-sm font-medium tracking-wider" style={{ color: "var(--color-text)" }}>
                  {generatedPassword}
                </span>
                <IconBtn
                  icon={<Copy size={13} />}
                  onClick={() => { navigator.clipboard.writeText(generatedPassword); toast.success("Copiada al portapapeles") }}
                  title="Copiar"
                />
              </div>
              <p className="text-xs" style={{ color: "var(--color-warning)" }}>
                ⚠️ Copia esta contraseña ahora. No se volverá a mostrar.
              </p>
            </div>
          ) : (
            <p className="text-xs" style={{ color: "var(--color-text-faint)", marginBottom: "1.5rem" }}>
              Haz clic en "Generar" para crear la nueva contraseña.
            </p>
          )}

          <div style={{ height: "1px", backgroundColor: "var(--color-divider)", marginBottom: "1.5rem" }} />

          <div className="flex justify-end gap-2">
            <BtnGhost onClick={() => { setOpenResetModal(false); setResettingUser(null); setGeneratedPassword("") }}>
              {generatedPassword ? "Cerrar" : "Cancelar"}
            </BtnGhost>
            {!generatedPassword && (
              <BtnPrimary onClick={handleResetPassword}>
                <KeyRound size={14} /> Generar contraseña
              </BtnPrimary>
            )}
          </div>
        </Modal>
      )}

      {openDeleteModal && deletingUser && (
        <Modal onClose={() => { setOpenDeleteModal(false); setDeletingUser(null) }}>
          <div className="flex items-center justify-between" style={{ marginBottom: "1.75rem" }}>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                Eliminar usuario
              </h3>
              <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                Esta acción no se puede deshacer
              </p>
            </div>
            <IconBtn icon={<X size={16} />} onClick={() => { setOpenDeleteModal(false); setDeletingUser(null) }} />
          </div>

          <p className="text-sm" style={{ color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>
            ¿Estás seguro de que quieres eliminar a{" "}
            <span className="font-semibold" style={{ color: "var(--color-text)" }}>
              {deletingUser.name} {deletingUser.surname}
            </span>?
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-faint)", marginBottom: "1.75rem" }}>
            Si el usuario tiene tickets asociados no podrá eliminarse. Desactívalo en su lugar.
          </p>

          <div style={{ height: "1px", backgroundColor: "var(--color-divider)", marginBottom: "1.5rem" }} />

          <div className="flex justify-end gap-2">
            <BtnGhost onClick={() => { setOpenDeleteModal(false); setDeletingUser(null) }}>
              Cancelar
            </BtnGhost>
            <BtnDanger onClick={handleDeleteConfirm}>
              <Trash2 size={14} /> Eliminar usuario
            </BtnDanger>
          </div>
        </Modal>
      )}
    </div>
  )
}