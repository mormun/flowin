"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Pencil, Trash2, ToggleLeft, ToggleRight, Plus, X, Check, Search } from "lucide-react"

type Category = {
  id: number
  name: string
  description: string | null
  active: boolean | null
}

// ───── Componentes UI reutilizables ─────

const Badge = ({ label, bg, color }: { label: string; bg: string; color: string }) => (
  <span
    className="inline-flex items-center rounded-full text-sm font-medium"
    style={{ backgroundColor: bg, color, padding: "0.10rem 0.75rem", whiteSpace: "nowrap", lineHeight: 1.4 }}
  >
    {label}
  </span>
)

// Modal genérico con fondo oscuro — se cierra al hacer clic fuera
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

// Estilos compartidos para inputs de formulario
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

// Variante compacta para inputs de edición inline en tabla
const inlineInputStyle: React.CSSProperties = { ...inputStyle, padding: "0.375rem 0.625rem", fontSize: "0.875rem" }

const BtnPrimary = ({ children, onClick, disabled }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex items-center gap-2 rounded-full font-medium transition disabled:opacity-50 whitespace-nowrap"
    style={{ backgroundColor: "var(--color-primary)", color: "#fff", fontSize: "0.9375rem", padding: "0.55rem 1.5rem", border: "none", cursor: disabled ? "not-allowed" : "pointer" }}
    onMouseEnter={(e) => !disabled && ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-primary-hover)")}
    onMouseLeave={(e) => !disabled && ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-primary)")}
  >
    {children}
  </button>
)

const BtnGhost = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition"
    style={{ color: "var(--color-text-muted)", backgroundColor: "transparent", border: "none", cursor: "pointer" }}
    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-surface-offset)")}
    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
  >
    {children}
  </button>
)

const BtnDanger = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
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

// Botón icono cuadrado con variante de peligro (rojo)
const IconBtn = ({ icon, onClick, title, danger }: {
  icon: React.ReactNode; onClick: () => void; title?: string; danger?: boolean
}) => (
  <button
    onClick={onClick}
    title={title}
    className="flex h-8 w-8 items-center justify-center rounded-lg transition"
    style={{ color: danger ? "var(--color-error)" : "var(--color-text-muted)", backgroundColor: "transparent", border: "none", cursor: "pointer" }}
    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = danger ? "var(--color-error-light)" : "var(--color-surface-offset)")}
    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
  >
    {icon}
  </button>
)

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Estado del modal de creación
  const [openCreateModal, setOpenCreateModal] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [creating, setCreating] = useState(false)

  // Estado de edición inline en tabla
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")

  // Estado del modal de confirmación de eliminación
  const [openDeleteModal, setOpenDeleteModal] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)

  // Cargar todas las categorías desde la API (panel admin, sin filtro de activas)
  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories")
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Error cargando categorías"); return }
      setCategories(data)
    } catch {
      toast.error("Error cargando categorías")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCategories() }, [])

  // Filtrado por nombre o descripción en cliente
  const filtered = categories.filter((c) =>
    `${c.name} ${c.description ?? ""}`.toLowerCase().includes(search.toLowerCase())
  )

  // Crear nueva categoría
  const handleCreate = async () => {
    if (!newName.trim()) { toast.warning("El nombre es obligatorio"); return }
    setCreating(true)
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDescription }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Error al crear categoría"); return }
      toast.success("Categoría creada")
      setNewName(""); setNewDescription(""); setOpenCreateModal(false)
      fetchCategories()
    } catch {
      toast.error("Error al crear categoría")
    } finally {
      setCreating(false)
    }
  }

  // Guardar edición inline de nombre y descripción
  const handleEdit = async (id: number) => {
    if (!editName.trim()) { toast.warning("El nombre es obligatorio"); return }
    try {
      const res = await fetch("/api/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: editName, description: editDescription }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Error al actualizar categoría"); return }
      toast.success("Categoría actualizada")
      setEditingId(null)
      fetchCategories()
    } catch {
      toast.error("Error al actualizar categoría")
    }
  }

  // Activar o desactivar categoría (toggle)
  const handleToggleActive = async (category: Category) => {
    try {
      const res = await fetch("/api/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: category.id, active: !category.active }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Error al actualizar categoría"); return }
      toast.success(category.active ? "Categoría desactivada" : "Categoría activada")
      fetchCategories()
    } catch {
      toast.error("Error al actualizar categoría")
    }
  }

  // Confirmar y ejecutar eliminación de categoría
  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return
    try {
      const res = await fetch("/api/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deletingCategory.id }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Error al eliminar categoría"); return }
      toast.success("Categoría eliminada")
      setOpenDeleteModal(false); setDeletingCategory(null)
      fetchCategories()
    } catch {
      toast.error("Error al eliminar categoría")
    }
  }

  return (
    <div style={{ width: "100%", padding: "2.5rem 4rem 3rem 3.5rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h2 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>Categorías</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>Gestión de categorías de tickets</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" style={{ marginBottom: "1.5rem" }}>
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2.5"
          style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", width: "260px" }}
        >
          <Search size={14} color="var(--color-text-faint)" />
          <input
            type="text"
            placeholder="Buscar categoría..."
            className="flex-1 bg-transparent outline-none ring-0 border-0"
            style={{ color: "var(--color-text)", fontSize: "0.9375rem" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <BtnPrimary onClick={() => setOpenCreateModal(true)}>
          <Plus size={15} /> Nueva categoría
        </BtnPrimary>
      </div>

      <div
        className="w-full overflow-x-auto rounded-xl"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}
      >
        {loading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-lg animate-pulse" style={{ backgroundColor: "var(--color-surface-offset)" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: "var(--color-text-faint)" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <p className="text-base font-medium" style={{ color: "var(--color-text-muted)" }}>No hay categorías que mostrar</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Id", "Nombre", "Descripción", "Estado", "Acciones"].map((h, i) => (
                  <th
                    key={i}
                    className="text-left text-sm font-semibold uppercase tracking-wider"
                    style={{
                      color: "var(--color-text-muted)",
                      paddingLeft: i === 0 ? "2rem" : undefined,
                      paddingTop: "1rem",
                      paddingBottom: "1rem",
                      paddingRight: i === 4 ? "1.5rem" : "1rem",
                      textAlign: i === 4 ? "right" : "left",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((cat, idx) => (
                <tr
                  key={cat.id}
                  style={{ borderBottom: idx < filtered.length - 1 ? "1px solid var(--color-divider)" : "none" }}
                >
                  <td
                    className="py-3.5 text-base tabular-nums font-medium"
                    style={{ color: "var(--color-text-faint)", paddingLeft: "2rem", paddingRight: "1rem" }}
                  >
                    {cat.id}
                  </td>

                  {/* Modo edición inline: muestra inputs en lugar de texto */}
                  {editingId === cat.id ? (
                    <>
                      <td className="py-2 pr-2">
                        <input
                          style={inlineInputStyle}
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          style={inlineInputStyle}
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Descripción"
                        />
                      </td>
                      <td />
                      <td className="py-2 pr-6">
                        <div className="flex justify-end gap-1">
                          <IconBtn icon={<Check size={14} />} onClick={() => handleEdit(cat.id)} title="Guardar" />
                          <IconBtn icon={<X size={14} />} onClick={() => setEditingId(null)} title="Cancelar" />
                        </div>
                      </td>
                    </>
                  ) : (
                    // Modo lectura: muestra datos y botones de acción
                    <>
                      <td className="py-3.5 pr-4">
                        <span className="text-base font-medium" style={{ color: "var(--color-text)" }}>{cat.name}</span>
                      </td>
                      <td className="py-3.5 pr-4 text-base" style={{ color: "var(--color-text-muted)" }}>
                        {cat.description ?? "—"}
                      </td>
                      <td className="py-3.5 pr-4">
                        <Badge
                          label={cat.active ? "Activa" : "Inactiva"}
                          bg={cat.active ? "var(--color-success-light)" : "var(--color-surface-offset)"}
                          color={cat.active ? "var(--color-success)" : "var(--color-text-muted)"}
                        />
                      </td>
                      <td className="py-3.5 pr-6">
                        <div className="flex justify-end gap-0.5">
                          <IconBtn
                            icon={<Pencil size={16} />}
                            onClick={() => {
                              setEditingId(cat.id)
                              setEditName(cat.name)
                              setEditDescription(cat.description ?? "")
                            }}
                            title="Editar"
                          />
                          <IconBtn
                            icon={cat.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            onClick={() => handleToggleActive(cat)}
                            title={cat.active ? "Desactivar" : "Activar"}
                          />
                          <IconBtn
                            icon={<Trash2 size={16} />}
                            onClick={() => { setDeletingCategory(cat); setOpenDeleteModal(true) }}
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

      {/* Modal: crear categoría */}
      {openCreateModal && (
        <Modal onClose={() => setOpenCreateModal(false)}>
          <div className="flex items-center justify-between" style={{ marginBottom: "1.75rem" }}>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>Nueva categoría</h3>
              <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>Rellena los datos de la nueva categoría</p>
            </div>
            <IconBtn icon={<X size={16} />} onClick={() => setOpenCreateModal(false)} />
          </div>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                Nombre <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <input
                style={inputStyle}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre de la categoría"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" style={{ color: "var(--color-text)" }}>Descripción</label>
              <textarea
                rows={3}
                className="resize-none rounded-lg outline-none transition"
                style={{
                  padding: "0.625rem 0.875rem",
                  fontSize: "0.9375rem",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-bg)",
                  color: "var(--color-text)",
                }}
                placeholder="Descripción opcional"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
            <div style={{ height: "1px", backgroundColor: "var(--color-divider)" }} />
            <div className="flex justify-end gap-2">
              <BtnGhost onClick={() => { setOpenCreateModal(false); setNewName(""); setNewDescription("") }}>
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
                ) : "Crear categoría"}
              </BtnPrimary>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: confirmar eliminación */}
      {openDeleteModal && deletingCategory && (
        <Modal onClose={() => { setOpenDeleteModal(false); setDeletingCategory(null) }}>
          <div className="flex items-center justify-between" style={{ marginBottom: "1.75rem" }}>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>Eliminar categoría</h3>
              <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>Esta acción no se puede deshacer</p>
            </div>
            <IconBtn icon={<X size={16} />} onClick={() => { setOpenDeleteModal(false); setDeletingCategory(null) }} />
          </div>
          <p className="text-sm" style={{ color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>
            ¿Estás seguro de que quieres eliminar{" "}
            <span className="font-semibold" style={{ color: "var(--color-text)" }}>"{deletingCategory.name}"</span>?
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-faint)", marginBottom: "1.75rem" }}>
            Si la categoría tiene tickets asociados no podrá eliminarse.
          </p>
          <div style={{ height: "1px", backgroundColor: "var(--color-divider)", marginBottom: "1.5rem" }} />
          <div className="flex justify-end gap-2">
            <BtnGhost onClick={() => { setOpenDeleteModal(false); setDeletingCategory(null) }}>Cancelar</BtnGhost>
            <BtnDanger onClick={handleDeleteConfirm}>
              <Trash2 size={14} /> Eliminar categoría
            </BtnDanger>
          </div>
        </Modal>
      )}
    </div>
  )
}