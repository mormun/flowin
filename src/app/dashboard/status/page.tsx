"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Pencil, X, Check } from "lucide-react"

type Status = {
  id: number
  name: string
  description: string | null
  active: boolean | null
}

const STATUS_DOT: Record<string, string> = {
  "Nuevo":       "#006494",
  "Proceso":     "var(--color-primary)",
  "Pendiente":   "#854d0e",
  "Solucionado": "var(--color-success)",
  "Cancelado":   "var(--color-error)",
  "Cerrado":     "var(--color-text-faint)",
}

const inlineInputStyle = {
  width: "100%",
  padding: "0.375rem 0.625rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  backgroundColor: "var(--color-bg)",
  color: "var(--color-text)",
  fontSize: "0.875rem",
  outline: "none",
}

const IconBtn = ({
  icon, onClick, title,
}: {
  icon: React.ReactNode; onClick: () => void; title?: string
}) => (
  <button
    onClick={onClick}
    title={title}
    className="flex h-8 w-8 items-center justify-center rounded-lg transition"
    style={{ color: "var(--color-text-muted)", backgroundColor: "transparent" }}
    onMouseEnter={(e) =>
      ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-surface-offset)")
    }
    onMouseLeave={(e) =>
      ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")
    }
  >
    {icon}
  </button>
)

export default function StatusPage() {
  const [statuses, setStatuses] = useState<Status[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")

  const fetchStatuses = async () => {
    try {
      const res = await fetch("/api/status")
      const data = await res.json()
      setStatuses(data)
    } catch {
      toast.error("Error cargando estados")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStatuses() }, [])

  const handleEdit = async (id: number) => {
    if (!editName.trim()) { toast.warning("El nombre es obligatorio"); return }
    try {
      const res = await fetch("/api/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: editName, description: editDescription }),
      })
      if (!res.ok) { const data = await res.json(); toast.error(data.error); return }
      toast.success("Estado actualizado")
      setEditingId(null)
      fetchStatuses()
    } catch {
      toast.error("Error al actualizar estado")
    }
  }

  return (
    <div
      style={{
        width: "100%",
        padding: "2rem 3rem 2rem 2.5rem",
        marginTop: "1.5rem",
      }}
    >
      {/* Título */}
      <div style={{ marginBottom: "1.25rem" }}>
        <h2 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
          Estados
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
          Puedes editar el nombre y la descripción. No es posible crear ni eliminar estados.
        </p>
      </div>

      {/* Aviso */}
      <div
        className="mb-5 flex items-start gap-3 rounded-lg px-4 py-3"
        style={{
          backgroundColor: "var(--color-warning-light)",
          border: "1px solid color-mix(in oklab, var(--color-warning) 25%, transparent)",
        }}
      >
        <svg
          width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="var(--color-warning)" strokeWidth="2"
          className="mt-0.5 shrink-0"
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <p className="text-sm" style={{ color: "var(--color-warning)" }}>
          Modificar el nombre de un estado puede afectar a la lógica interna de la
          aplicación. Hazlo solo si es estrictamente necesario.
        </p>
      </div>

      {/* Tabla */}
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
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-10 rounded-lg animate-pulse"
                style={{ backgroundColor: "var(--color-surface-offset)" }}
              />
            ))}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Id", "Estado", "Descripción", "Acciones"].map((h, i) => (
                  <th
                    key={i}
                    className="pr-4 text-left text-sm font-semibold uppercase tracking-wider"
                    style={{
                      color: "var(--color-text-muted)",
                      paddingLeft: i === 0 ? "2rem" : undefined,
                      paddingTop: "1rem",
                      paddingBottom: "1rem",
                      textAlign: i === 3 ? "right" : "left",
                      paddingRight: i === 3 ? "1.5rem" : undefined,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {statuses.map((s, idx) => (
                <tr
                  key={s.id}
                  style={{
                    borderBottom:
                      idx < statuses.length - 1
                        ? "1px solid var(--color-divider)"
                        : "none",
                  }}
                >
                  <td
                    className="py-3.5 text-base tabular-nums font-medium"
                    style={{
                      color: "var(--color-text-faint)",
                      paddingLeft: "2rem",
                      paddingRight: "1rem",
                    }}
                  >
                    {s.id}
                  </td>

                  {editingId === s.id ? (
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
                      <td className="py-2 pr-6">
                        <div className="flex justify-end gap-1">
                          <IconBtn icon={<Check size={14} />} onClick={() => handleEdit(s.id)} title="Guardar" />
                          <IconBtn icon={<X size={14} />} onClick={() => setEditingId(null)} title="Cancelar" />
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor: STATUS_DOT[s.name] ?? "var(--color-text-faint)",
                            }}
                          />
                          <span className="text-base font-medium" style={{ color: "var(--color-text)" }}>
                            {s.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 text-base" style={{ color: "var(--color-text-muted)" }}>
                        {s.description ?? "—"}
                      </td>
                      <td className="py-3.5 pr-6">
                        <div className="flex justify-end">
                          <IconBtn
                            icon={<Pencil size={16} />}
                            onClick={() => {
                              setEditingId(s.id)
                              setEditName(s.name)
                              setEditDescription(s.description ?? "")
                            }}
                            title="Editar"
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
    </div>
  )
}