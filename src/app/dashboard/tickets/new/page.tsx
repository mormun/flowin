"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Paperclip, X, ArrowLeft } from "lucide-react"
import { useSession } from "next-auth/react"

const PRIORITIES = ["Baja", "Media", "Alta", "Crítica"]

const PRIORITY_META: Record<string, { color: string; desc: string }> = {
  Baja: { color: "var(--color-success)", desc: "Sin urgencia, puede esperar" },
  Media: { color: "#854d0e", desc: "Impacto moderado en el trabajo" },
  Alta: { color: "var(--color-warning)", desc: "Requiere atención pronta" },
  Crítica: { color: "var(--color-error)", desc: "Bloquea el trabajo completamente" },
}

const baseInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.625rem 0.875rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  backgroundColor: "var(--color-surface)",
  color: "var(--color-text)",
  fontSize: "0.9375rem",
  outline: "none",
  transition: "border-color 150ms",
}

export default function NewTicketPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<number | "">("")
  const [priority, setPriority] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  const isDirty =
    title !== "" || description !== "" || category !== "" || priority !== "" || file !== null

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    }
  }, [status, router])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty) return
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isDirty])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories?active=true")
        const data = await res.json()

        if (!res.ok) {
          toast.error(data?.error ?? "Error cargando categorías")
          return
        }

        setCategories(data)
      } catch {
        toast.error("Error cargando categorías")
      } finally {
        setCategoriesLoading(false)
      }
    }

    if (status === "authenticated") {
      fetchCategories()
    }
  }, [status])

  const handleCancel = () => {
    if (isDirty) {
      const ok = confirm("Si sales ahora, perderás los datos del ticket. ¿Quieres continuar?")
      if (!ok) return
    }

    const role = (session?.user as { role?: string } | undefined)?.role

    if (role === "admin" || role === "tech") {
      router.push("/dashboard/tickets")
    } else {
      router.push("/dashboard/my-tickets")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status !== "authenticated") return
    if (!title) { toast.warning("Falta el título"); return }
    if (!description) { toast.warning("Falta la descripción"); return }
    if (category === "") { toast.warning("Selecciona una categoría"); return }
    if (!priority) { toast.warning("Selecciona una prioridad"); return }

    try {
      setLoading(true)

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category, priority }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data?.error ?? "Error al crear el ticket")
        return
      }

      const newTicket = data

      if (file) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("ticketId", String(newTicket.id))

        const uploadRes = await fetch("/api/attachments", {
          method: "POST",
          body: formData,
        })

        if (!uploadRes.ok) {
          const uploadData = await uploadRes.json().catch(() => null)
          toast.warning(uploadData?.error ?? "Ticket creado, pero hubo un error al subir el archivo")
        }
      }

      toast.success("Ticket creado correctamente", {
        description: "Tu solicitud ha sido registrada",
      })

      const role = (session?.user as { role?: string } | undefined)?.role

      if (role === "admin" || role === "tech") {
        router.push("/dashboard/tickets")
      } else {
        router.push("/dashboard/my-tickets")
      }
    } catch {
      toast.error("Error al crear el ticket")
    } finally {
      setLoading(false)
    }
  }

  const dynInput = (filled: boolean): React.CSSProperties => ({
    ...baseInputStyle,
    borderColor: filled ? "var(--color-primary)" : "var(--color-border)",
  })

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div style={{ width: "100%", padding: "2.5rem 4rem 3rem 3.5rem" }}>
        <div
          className="rounded-xl"
          style={{
            padding: "2.5rem 3rem",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="space-y-4">
            <div className="h-7 w-48 animate-pulse rounded-lg" style={{ backgroundColor: "var(--color-surface-offset)" }} />
            <div className="h-4 w-80 animate-pulse rounded-lg" style={{ backgroundColor: "var(--color-surface-offset)" }} />
            <div className="h-11 w-full animate-pulse rounded-lg" style={{ backgroundColor: "var(--color-surface-offset)" }} />
            <div className="h-36 w-full animate-pulse rounded-lg" style={{ backgroundColor: "var(--color-surface-offset)" }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        width: "100%",
        padding: "2.5rem 4rem 3rem 3.5rem",
      }}
    >
      <div className="flex items-center" style={{ marginBottom: "1.25rem" }}>
        <button
          onClick={handleCancel}
          className="flex items-center gap-1.5 text-sm font-medium transition"
          style={{
            color: "var(--color-text-muted)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0.375rem 0.5rem",
            borderRadius: "var(--radius-md)",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.backgroundColor = "var(--color-surface-offset)"
            el.style.color = "var(--color-text)"
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.backgroundColor = "transparent"
            el.style.color = "var(--color-text-muted)"
          }}
        >
          <ArrowLeft size={15} />
          Volver
        </button>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h2 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
          Crear ticket
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
          Describe tu incidencia o solicitud con el mayor detalle posible
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          className="rounded-xl"
          style={{
            padding: "2.5rem 3rem",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-base font-bold" style={{ color: "var(--color-text)" }}>
                  Título <span style={{ color: "var(--color-error)" }}>*</span>
                </label>
                <span className="text-xs tabular-nums" style={{ color: title.length >= 140 ? "var(--color-error)" : "var(--color-text-faint)" }}>
                  {title.length}/150
                </span>
              </div>
              <input
                style={dynInput(title.length > 0)}
                placeholder="Resumen breve del problema"
                value={title}
                maxLength={150}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = title ? "var(--color-primary)" : "var(--color-border)")}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-base font-bold" style={{ color: "var(--color-text)" }}>
                  Descripción <span style={{ color: "var(--color-error)" }}>*</span>
                </label>
                <span className="text-xs tabular-nums" style={{ color: description.length >= 450 ? "var(--color-error)" : "var(--color-text-faint)" }}>
                  {description.length}/500
                </span>
              </div>
              <textarea
                className="resize-none rounded-lg outline-none transition"
                style={{
                  minHeight: "140px",
                  padding: "0.625rem 0.875rem",
                  fontSize: "0.9375rem",
                  border: description ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text)",
                }}
                placeholder="Describe el problema con el mayor detalle posible: qué ocurre, cuándo empezó, qué has intentado..."
                value={description}
                maxLength={500}
                onChange={(e) => setDescription(e.target.value)}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = description ? "var(--color-primary)" : "var(--color-border)")}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-base font-medium" style={{ color: "var(--color-text)" }}>
                  Categoría <span style={{ color: "var(--color-error)" }}>*</span>
                </label>
                <select
                  style={dynInput(category !== "")}
                  value={category}
                  disabled={categoriesLoading}
                  onChange={(e) => setCategory(e.target.value === "" ? "" : Number(e.target.value))}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = category !== "" ? "var(--color-primary)" : "var(--color-border)")}
                >
                  <option value="">{categoriesLoading ? "Cargando categorías..." : "Selecciona una categoría"}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-base font-medium" style={{ color: "var(--color-text)" }}>
                  Prioridad <span style={{ color: "var(--color-error)" }}>*</span>
                </label>
                <select
                  style={dynInput(priority !== "")}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = priority ? "var(--color-primary)" : "var(--color-border)")}
                >
                  <option value="">Selecciona prioridad</option>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                {priority && PRIORITY_META[priority] && (
                  <p className="mt-0.5 text-xs" style={{ color: PRIORITY_META[priority].color }}>
                    {PRIORITY_META[priority].desc}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-base font-medium" style={{ color: "var(--color-text)" }}>
                Archivo adjunto
              </label>
              {file ? (
                <div
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                  style={{
                    backgroundColor: "var(--color-primary-light)",
                    border: "1px solid color-mix(in oklab, var(--color-primary) 30%, transparent)",
                  }}
                >
                  <Paperclip size={14} color="var(--color-primary)" />
                  <span className="flex-1 truncate text-sm" style={{ color: "var(--color-primary-dark)" }}>
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="flex h-6 w-6 items-center justify-center rounded-md"
                    style={{ color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer" }}
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <label
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition"
                  style={{
                    border: "1px dashed var(--color-border)",
                    color: "var(--color-text-muted)",
                    backgroundColor: "var(--color-bg)",
                    fontSize: "0.9375rem",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--color-primary)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)")}
                >
                  <Paperclip size={14} />
                  Seleccionar archivo (opcional)
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const selected = e.target.files?.[0]
                      if (!selected) return

                      if (selected.size > 10 * 1024 * 1024) {
                        toast.error("El archivo no puede superar los 10 MB")
                        e.target.value = ""
                        return
                      }

                      setFile(selected)
                    }}
                  />
                </label>
              )}
            </div>

            <div style={{ height: "1px", backgroundColor: "var(--color-divider)" }} />

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition"
                style={{ color: "var(--color-text-muted)", backgroundColor: "transparent", border: "none", cursor: "pointer" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-surface-offset)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={loading || categoriesLoading}
                className="flex items-center gap-2 rounded-full font-medium transition disabled:opacity-50 whitespace-nowrap"
                style={{
                  backgroundColor: "var(--color-primary)",
                  color: "#fff",
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  padding: "0.55rem 1.5rem",
                  border: "none",
                  cursor: loading || categoriesLoading ? "not-allowed" : "pointer",
                }}
                onMouseEnter={(e) =>
                  !(loading || categoriesLoading) && ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-primary-hover)")
                }
                onMouseLeave={(e) =>
                  !(loading || categoriesLoading) && ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-primary)")
                }
              >
                {loading ? (
                  <>
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Creando...
                  </>
                ) : (
                  "Crear ticket"
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}