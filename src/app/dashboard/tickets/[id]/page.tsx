"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { RefreshCcw, AlertTriangle, UserPlus, ThumbsUp, ArrowLeft, Send, Paperclip, X } from "lucide-react"
import { Tooltip } from "@/components/ui/tooltip"
import { useSession } from "next-auth/react"

// Hook para pausar polling cuando la pestaña no está visible
function useDocumentVisible() {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const handleChange = () => setVisible(!document.hidden)
    document.addEventListener("visibilitychange", handleChange)
    return () => document.removeEventListener("visibilitychange", handleChange)
  }, [])
  return visible
}

// ───── Tipos ─────

type Ticket = {
  id: number
  title: string
  description: string
  priority: string
  category_id: number
  categories: { id: number; name: string; active: boolean } | null
  status_id: number
  created_at: string
  updated_at?: string | null
  closed_at?: string | null
  created_by: number
  assigned_to?: number | null
  assigned_user?: { id: number; name: string; surname: string } | null
  attachments?: { id: number; filename: string | null; file_path: string | null }[]
}

type Comment = {
  id: number
  content: string
  created_at: string
  is_system?: boolean
  user?: { name: string; surname: string; role?: string; email?: string }
}

// ───── Estilos y constantes ─────

const PRIORITY_STYLES: Record<string, { bg: string; color: string }> = {
  Crítica: { bg: "var(--color-error-light)", color: "var(--color-error)" },
  Alta:    { bg: "var(--color-warning-light)", color: "var(--color-warning)" },
  Media:   { bg: "#fef9c3", color: "#854d0e" },
  Baja:    { bg: "var(--color-success-light)", color: "var(--color-success)" },
}

const STATUS_LABELS: Record<number, string> = {
  1: "Nuevo", 2: "En Proceso", 3: "Pendiente",
  4: "Solucionado", 5: "Cerrado", 6: "Cancelado",
}

const STATUS_STYLES: Record<number, { bg: string; color: string }> = {
  1: { bg: "#dbeafe", color: "#1d4ed8" },
  2: { bg: "var(--color-error-light)", color: "var(--color-error)" },
  3: { bg: "var(--color-primary-light)", color: "var(--color-primary)" },
  4: { bg: "#fef9c3", color: "#854d0e" },
  5: { bg: "var(--color-success-light)", color: "var(--color-success)" },
  6: { bg: "var(--color-surface-offset)", color: "var(--color-text-muted)" },
}

// Estilo para etiquetas de sección (cabeceras pequeñas en mayúsculas)
const sectionLabelStyle: React.CSSProperties = {
  fontSize: "0.6875rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "var(--color-text)",
  marginBottom: "0.625rem",
  paddingLeft: "0.25rem",
}

// Estilo para etiquetas de metadatos del ticket
const metaLabelStyle: React.CSSProperties = {
  fontSize: "0.6875rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--color-text)",
}

// ───── Componentes UI reutilizables ─────

// Muestra una fecha y hora formateada, o "—" si no hay valor
const DateTimeValue = ({ iso }: { iso?: string | null }) => {
  if (!iso) return <span className="text-sm" style={{ color: "var(--color-text-faint)" }}>—</span>
  const date = new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
  const time = new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
  return (
    <span className="text-sm tabular-nums" style={{ color: "var(--color-text)" }}>
      {date}
      <span style={{ color: "var(--color-text-faint)", margin: "0 0.35rem" }}>·</span>
      {time}
    </span>
  )
}

const Badge = ({ label, bg, color }: { label: string; bg: string; color: string }) => (
  <span
    className="inline-flex items-center rounded-full font-medium whitespace-nowrap"
    style={{ backgroundColor: bg, color, padding: "0.10rem 0.75rem", fontSize: "0.875rem", lineHeight: 1.6 }}
  >
    {label}
  </span>
)

// Columna de metadato con etiqueta y valor
const MetaCol = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1">
    <span style={metaLabelStyle}>{label}</span>
    <div>{children}</div>
  </div>
)

// Modal genérico con título, subtítulo y contenido
const Modal = ({ open, onClose, title, subtitle, children }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode
}) =>
  open ? (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="rounded-2xl flex flex-col" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-lg)", padding: "1.75rem 2rem", maxWidth: "440px", width: "90%" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between" style={{ marginBottom: "0.5rem" }}>
          <div className="flex flex-col flex-1">
            <h3 className="text-lg font-bold" style={{ color: "var(--color-text)", marginBottom: "0.25rem" }}>{title}</h3>
            {subtitle && <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-full transition" style={{ width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "none", color: "var(--color-text-muted)", cursor: "pointer" }} onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-surface-offset)")} onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}>
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  ) : null

// Select genérico para modales
const ModalSelect = ({ value, onChange, children }: { value: string | number; onChange: (v: string) => void; children: React.ReactNode }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg outline-none" style={{ padding: "0.75rem 1rem", fontSize: "0.9375rem", backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)", marginTop: "1rem" }}>
    {children}
  </select>
)

// Footer estándar de modal con botones Cancelar y Confirmar
const ModalFooter = ({ onClose, onConfirm, confirmLabel }: { onClose: () => void; onConfirm: () => void; confirmLabel: string }) => (
  <div className="flex justify-end gap-2" style={{ marginTop: "1.5rem" }}>
    <button onClick={onClose} className="rounded-lg text-sm font-medium transition" style={{ backgroundColor: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "0.5rem 1rem" }} onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-surface-offset)")} onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}>
      Cancelar
    </button>
    <button onClick={onConfirm} className="rounded-full text-sm font-medium transition" style={{ backgroundColor: "var(--color-primary)", color: "#fff", border: "none", cursor: "pointer", padding: "0.5rem 1.25rem" }} onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.9")} onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}>
      {confirmLabel}
    </button>
  </div>
)

// Botón icono circular con tooltip y color configurable
const IconBtn = ({ title, onClick, color, hoverBg, children }: {
  title: string; onClick: () => void; color: string; hoverBg: string; children: React.ReactNode
}) => (
  <Tooltip text={title}>
    <button
      onClick={onClick}
      className="rounded-full transition flex items-center justify-center"
      style={{ width: "40px", height: "40px", flexShrink: 0, border: `2px solid ${color}`, color, background: "none", cursor: "pointer" }}
      onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = hoverBg}
      onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
    >
      {children}
    </button>
  </Tooltip>
)

// ───── Estilos de burbuja de chat por rol ─────
const BUBBLE = {
  self:   { align: "flex-end" as const,   bg: "var(--color-primary)", color: "#fff",     nameColor: "#fff",     br: "1rem 1rem 0.25rem 1rem" },
  tech:   { align: "flex-start" as const, bg: "#dae8f7",              color: "#1b3a57",  nameColor: "#2563eb",  br: "1rem 1rem 1rem 0.25rem" },
  admin:  { align: "flex-start" as const, bg: "#e7d7c4",              color: "#2b1f10",  nameColor: "#da7101",  br: "1rem 1rem 1rem 0.25rem" },
  user:   { align: "flex-start" as const, bg: "#ebebeb",              color: "#28251d",  nameColor: "#7a7974",  br: "1rem 1rem 1rem 0.25rem" },
  system: { align: "center" as const,     bg: "#e6e4df",              color: "#7a7974",  nameColor: "#bab9b4",  br: "9999px" },
}

// Burbuja de chat: mensajes de usuario o notificaciones de sistema
function ChatBubble({ comment, isSelf }: { comment: Comment; isSelf: boolean }) {
  const rawRole = comment.user?.role?.toLowerCase() ?? "user"
  const bubbleRole = comment.is_system
    ? "system"
    : isSelf
      ? "self"
      : (rawRole as keyof typeof BUBBLE) in BUBBLE
        ? (rawRole as keyof typeof BUBBLE)
        : "user"

  const s = BUBBLE[bubbleRole]
  const authorLabel = comment.is_system ? "Sistema" : comment.user ? `${comment.user.name} ${comment.user.surname}` : "—"
  const timestamp = new Date(comment.created_at).toLocaleString("es-ES", {
    hour: "2-digit", minute: "2-digit", day: "numeric", month: "short",
  })

  // Mensaje de sistema: pill centrado
  if (bubbleRole === "system") {
    return (
      <div className="flex flex-col items-center gap-1">
        <div style={{ backgroundColor: s.bg, color: s.color, borderRadius: s.br, padding: "0.25rem 1rem", fontSize: "0.75rem" }}>
          {comment.content}
        </div>
        <p style={{ color: "#bab9b4", fontSize: "0.7rem" }}>{timestamp}</p>
      </div>
    )
  }

  // Mensaje de usuario: burbuja alineada según quién habla
  return (
    <div className="flex flex-col" style={{ alignItems: s.align }}>
      <div style={{ backgroundColor: s.bg, color: s.color, maxWidth: "68%", minWidth: "120px", borderRadius: s.br, padding: "0.75rem 1.125rem" }}>
        {!isSelf && (
          <p style={{ color: s.nameColor, fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.375rem" }}>
            {authorLabel}
          </p>
        )}
        <p style={{ fontSize: "0.875rem", lineHeight: "1.6" }}>{comment.content}</p>
      </div>
      <p style={{ color: "#bab9b4", fontSize: "0.75rem", marginTop: "0.25rem", paddingInline: "0.25rem" }}>
        {timestamp}
      </p>
    </div>
  )
}

// ───── Máquina de estados ─────

// Mapa de estados por nombre para evitar IDs hardcodeados
const STATUS_IDS: Record<string, number> = {
  Nuevo: 1, "En Proceso": 2, Pendiente: 3,
  Solucionado: 4, Cerrado: 5, Cancelado: 6,
}

// Devuelve las transiciones de estado disponibles según rol y contexto del usuario
function getAvailableTransitions(
  currentStatusId: number,
  role: "user" | "tech" | "admin",
  isCreator: boolean,
  isAssignedToMe: boolean
): { id: number; label: string }[] {
  const NUEVO      = STATUS_IDS["Nuevo"]
  const EN_PROCESO = STATUS_IDS["En Proceso"]
  const PENDIENTE  = STATUS_IDS["Pendiente"]
  const SOLUCIONADO = STATUS_IDS["Solucionado"]
  const CERRADO    = STATUS_IDS["Cerrado"]
  const CANCELADO  = STATUS_IDS["Cancelado"]

  // Estados finales: sin transiciones posibles
  if (currentStatusId === CERRADO || currentStatusId === CANCELADO) return []

  // Desde Nuevo: solo cancelar
  if (currentStatusId === NUEVO) {
    if (role === "user" && isCreator) return [{ id: CANCELADO, label: "Cancelar ticket" }]
    if (role === "tech" || role === "admin") return [{ id: CANCELADO, label: "Cancelar ticket" }]
    return []
  }

  // Desde En Proceso: pendiente, solucionado o cancelar
  if (currentStatusId === EN_PROCESO) {
    if (role === "user") return []
    if (role === "tech" && !isAssignedToMe) return []
    if ((role === "tech" && isAssignedToMe) || role === "admin") {
      return [
        { id: PENDIENTE, label: "Pendiente" },
        { id: SOLUCIONADO, label: "Solucionado" },
        { id: CANCELADO, label: "Cancelar ticket" },
      ]
    }
    return []
  }

  // Desde Pendiente: reanudar o cancelar
  if (currentStatusId === PENDIENTE) {
    if (role === "user") return []
    if (role === "tech" && !isAssignedToMe) return []
    if ((role === "tech" && isAssignedToMe) || role === "admin") {
      return [
        { id: EN_PROCESO, label: "En Proceso" },
        { id: CANCELADO, label: "Cancelar ticket" },
      ]
    }
    return []
  }

  // Desde Solucionado: el creador puede aceptar (cerrar) o rechazar (volver a En Proceso)
  if (currentStatusId === SOLUCIONADO) {
    if (role === "user" && isCreator) {
      return [
        { id: CERRADO, label: "Aceptar solución (cerrar)" },
        { id: EN_PROCESO, label: "Rechazar (volver a En Proceso)" },
      ]
    }
    return []
  }

  return []
}

// ───── Componente principal ─────

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Estado del usuario actual
  const [role, setRole] = useState<"user" | "tech" | "admin" | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)

  // Estado del ticket y carga
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)

  // Estado de los modales de acción
  const [newStatus, setNewStatus] = useState<number | null>(null)
  const [openStatusModal, setOpenStatusModal] = useState(false)
  const [newPriority, setNewPriority] = useState("")
  const [openPriorityModal, setOpenPriorityModal] = useState(false)
  const [technicians, setTechnicians] = useState<any[]>([])
  const [selectedTech, setSelectedTech] = useState<number | null>(null)
  const [openAssignModal, setOpenAssignModal] = useState(false)
  const [openSolutionModal, setOpenSolutionModal] = useState(false)

  // Estado del chat de comentarios
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")

  const isVisible = useDocumentVisible()

  // Extraer rol e ID del usuario desde la sesión
  useEffect(() => {
    const user = session?.user as any
    const userRole = user?.role as "user" | "tech" | "admin" | undefined
    setRole(userRole ?? null)
    setCurrentUserId(user?.id ? Number(user.id) : null)
  }, [session])

  // Cargar ticket con auto-refresh cada 20s (pausa si el usuario está escribiendo)
  useEffect(() => {
    if (!id) return
    const loadTicket = async () => {
      try {
        const res = await fetch(`/api/tickets/${id}`)
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          toast.error(data?.error ?? "Error cargando ticket")
          setLoading(false)
          return
        }
        const data = await res.json()
        setTicket(data)
        setNewStatus(data.status_id)
      } catch (e) {
        console.error("Error cargando ticket:", e)
        toast.error("Error cargando ticket")
      } finally {
        setLoading(false)
      }
    }

    loadTicket()

    if (!isVisible) return
    const interval = setInterval(() => {
      if (document.hidden || newComment.trim()) return
      loadTicket()
    }, 20000)

    return () => clearInterval(interval)
  }, [id, isVisible, newComment])

  // Cargar comentarios con auto-refresh cada 20s (pausa si el usuario está escribiendo)
  useEffect(() => {
    if (!id) return
    const loadComments = async () => {
      const res = await fetch(`/api/tickets/comments/${id}`)
      const data = await res.ok ? await res.json() : []
      setComments(Array.isArray(data) ? data : [])
    }

    loadComments()

    if (!isVisible) return
    const interval = setInterval(() => {
      if (document.hidden || newComment.trim()) return
      loadComments()
    }, 20000)

    return () => clearInterval(interval)
  }, [id, isVisible, newComment])

  // Scroll automático al último comentario cuando llegan nuevos mensajes
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [comments])

  // Cargar lista de técnicos activos (bajo demanda al abrir modal de asignación)
  const loadTechnicians = async () => {
    const res = await fetch("/api/users/tech")
    setTechnicians(await res.json())
  }

  // Helper: enviar PATCH al endpoint de actualización de tickets
  const patch = (body: object) =>
    fetch("/api/tickets/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ticket!.id, ...body }),
    })

  // Recargar comentarios desde la API
  const refreshComments = async () => {
    const res = await fetch(`/api/tickets/comments/${id}`)
    if (!res.ok) return
    const data = await res.json()
    setComments(Array.isArray(data) ? data : [])
  }

  // Devuelve el nombre de la categoría, indicando si está desactivada
  const getCategoryName = () => {
    if (!ticket?.categories) return "Sin categoría"
    return ticket.categories.active
      ? ticket.categories.name
      : `${ticket.categories.name} (desactivada)`
  }

  // Insertar un comentario de sistema (cambios de estado, asignaciones, etc.)
  const addSystemComment = async (content: string) => {
    await fetch("/api/tickets/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId: ticket!.id, content, is_system: true }),
    })
    await new Promise(resolve => setTimeout(resolve, 100))
    await refreshComments()
  }

  // Actualizar estado del ticket desde el modal
  const handleUpdate = async () => {
    if (!ticket || newStatus === null) return
    await patch({ status_id: newStatus })
    setTicket({ ...ticket, status_id: newStatus })
    setOpenStatusModal(false)
    await addSystemComment(`Estado cambiado a "${STATUS_LABELS[newStatus]}"`)
    toast.success("Estado actualizado")
  }

  // Actualizar prioridad del ticket desde el modal
  const handlePriorityUpdate = async () => {
    if (!ticket || !newPriority) return
    await patch({ priority: newPriority })
    setTicket({ ...ticket, priority: newPriority })
    setOpenPriorityModal(false)
    await addSystemComment(`Prioridad cambiada a "${newPriority}"`)
    toast.success("Prioridad actualizada")
  }

  // Asignar técnico al ticket y refrescar datos desde la API
  const handleAssign = async () => {
    if (!ticket || !selectedTech) return
    await patch({ assigned_to: selectedTech })
    const assignedUser = technicians.find(t => t.id === selectedTech)

    const res = await fetch(`/api/tickets/${id}`)
    if (res.ok) {
      const updated = await res.json()
      setTicket(updated)
      setNewStatus(updated.status_id)
    }

    setOpenAssignModal(false)
    setSelectedTech(null)
    await addSystemComment(`Ticket asignado a ${assignedUser?.name ?? ""} ${assignedUser?.surname ?? ""}`.trim())
    toast.success("Técnico asignado")
  }

  // Enviar comentario de usuario al chat
  const handleAddComment = async () => {
    if (!newComment.trim()) return
    const userEmail = session?.user?.email
    const res = await fetch("/api/tickets/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId: ticket?.id, userEmail, content: newComment }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Error desconocido" }))
      toast.error(err.error ?? "No se pudo añadir el comentario")
      return
    }
    await refreshComments()
    setNewComment("")
  }

  // Aceptar solución: cierra el ticket
  const handleAcceptSolution = async () => {
    if (!ticket) return
    await patch({ status_id: STATUS_IDS["Cerrado"] })
    setTicket({ ...ticket, status_id: STATUS_IDS["Cerrado"] })
    setOpenSolutionModal(false)
    await addSystemComment("Solución aceptada. Ticket cerrado.")
    toast.success("Solución aceptada. Ticket cerrado.")
  }

  // Rechazar solución: vuelve el ticket a En Proceso
  const handleRejectSolution = async () => {
    if (!ticket) return
    await patch({ status_id: STATUS_IDS["En Proceso"] })
    setTicket({ ...ticket, status_id: STATUS_IDS["En Proceso"] })
    setOpenSolutionModal(false)
    await addSystemComment("Solución rechazada. El ticket vuelve a En Proceso.")
    toast.error("Solución rechazada. El ticket vuelve a En Proceso.")
  }

  // Estado de carga
  if (loading) return (
    <div style={{ width: "100%", padding: "2rem 3rem 2rem 2.5rem" }} className="flex items-center gap-2">
      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>Cargando ticket…</span>
    </div>
  )
  if (!ticket || !role) return null

  // ───── Variables derivadas del estado ─────
  const isCreator = ticket.created_by === currentUserId
  const isAssignedToMe = ticket.assigned_to === currentUserId
  const allowedTransitions = getAvailableTransitions(ticket.status_id, role, isCreator, isAssignedToMe)
  const isFinalStatus = ticket.status_id === STATUS_IDS["Cerrado"] || ticket.status_id === STATUS_IDS["Cancelado"]
  const isActiveStatus = ticket.status_id === STATUS_IDS["Nuevo"] || ticket.status_id === STATUS_IDS["En Proceso"] || ticket.status_id === STATUS_IDS["Pendiente"]

  // Visibilidad de botones de acción según rol y estado
  const showChangeStatusBtn = allowedTransitions.length > 0
  const showChangePriorityBtn = isActiveStatus && (role === "admin" || (role === "tech" && (isAssignedToMe || ticket.assigned_to === null)))
  const showAssignTechBtn = isActiveStatus && (role === "admin" || (role === "tech" && (isAssignedToMe || ticket.assigned_to === null)))
  const showSolutionBtn = role === "user" && isCreator && ticket.status_id === STATUS_IDS["Solucionado"]
  const showActionsPanel = showChangeStatusBtn || showChangePriorityBtn || showAssignTechBtn || showSolutionBtn

  return (
    <div style={{ width: "100%", padding: "0 3rem 2rem 2.5rem" }}>

      {/* Botón volver */}
      <div className="flex items-center" style={{ marginBottom: "1.25rem" }}>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-medium transition"
          style={{ color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", padding: "0.375rem 0.5rem", borderRadius: "var(--radius-md)" }}
          onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = "var(--color-surface-offset)"; el.style.color = "var(--color-text)" }}
          onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = "transparent"; el.style.color = "var(--color-text-muted)" }}
        >
          <ArrowLeft size={15} />
          Volver
        </button>
      </div>

      {/* Fila superior: metadatos del ticket + panel de acciones */}
      <div className="flex items-stretch gap-5" style={{ marginBottom: "1.25rem" }}>
        <div className="flex flex-col flex-1">
          <p style={sectionLabelStyle}>Detalles del ticket</p>
          <div className="rounded-xl flex-1" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)", padding: "1.25rem 1.75rem" }}>
            <div className="flex flex-wrap items-start gap-x-10 gap-y-4">
              <MetaCol label="Id ticket">
                <span className="text-sm font-bold tabular-nums" style={{ color: "var(--color-text)" }}>#{ticket.id}</span>
              </MetaCol>
              <MetaCol label="Fecha de creación"><DateTimeValue iso={ticket.created_at} /></MetaCol>
              <MetaCol label="Categoría">
                <span className="text-sm" style={{ color: "var(--color-text)" }}>{getCategoryName()}</span>
              </MetaCol>
              <MetaCol label="Estado">
                <Badge label={STATUS_LABELS[ticket.status_id] ?? "—"} bg={STATUS_STYLES[ticket.status_id]?.bg ?? "var(--color-bg)"} color={STATUS_STYLES[ticket.status_id]?.color ?? "var(--color-text-muted)"} />
              </MetaCol>
              <MetaCol label="Prioridad">
                <Badge label={ticket.priority} bg={PRIORITY_STYLES[ticket.priority]?.bg ?? "var(--color-bg)"} color={PRIORITY_STYLES[ticket.priority]?.color ?? "var(--color-text-muted)"} />
              </MetaCol>
              <MetaCol label="Asignado a">
                <span className="text-sm" style={{ color: ticket.assigned_user ? "var(--color-text)" : "var(--color-text-faint)" }}>
                  {ticket.assigned_user ? `${ticket.assigned_user.name} ${ticket.assigned_user.surname}` : "Sin asignar"}
                </span>
              </MetaCol>
              <MetaCol label="Última actualización"><DateTimeValue iso={ticket.updated_at} /></MetaCol>
              <MetaCol label="Fecha de cierre"><DateTimeValue iso={ticket.closed_at} /></MetaCol>
            </div>
          </div>
        </div>

        {/* Panel de acciones: solo visible si hay acciones disponibles */}
        {showActionsPanel && (
          <div className="flex flex-col" style={{ minWidth: "fit-content" }}>
            <p style={sectionLabelStyle}>Acciones</p>
            <div className="rounded-xl flex-1 flex flex-row items-center gap-3" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)", padding: "1.25rem 1.5rem" }}>
              {showChangeStatusBtn && (
                <IconBtn title="Cambiar estado" onClick={() => { setNewStatus(null); setOpenStatusModal(true) }} color="var(--color-primary)" hoverBg="var(--color-primary-light)">
                  <RefreshCcw size={15} />
                </IconBtn>
              )}
              {showChangePriorityBtn && (
                <IconBtn title="Cambiar prioridad" onClick={() => { setNewPriority(ticket.priority); setOpenPriorityModal(true) }} color="var(--color-warning)" hoverBg="var(--color-warning-light)">
                  <AlertTriangle size={15} />
                </IconBtn>
              )}
              {showAssignTechBtn && (
                <IconBtn title="Asignar técnico" onClick={async () => { await loadTechnicians(); setOpenAssignModal(true) }} color="var(--color-blue)" hoverBg="var(--color-blue-highlight)">
                  <UserPlus size={15} />
                </IconBtn>
              )}
              {showSolutionBtn && (
                <IconBtn title="Ver solución" onClick={() => setOpenSolutionModal(true)} color="var(--color-success)" hoverBg="var(--color-success-light)">
                  <ThumbsUp size={15} />
                </IconBtn>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Descripción del ticket */}
      <div style={{ marginBottom: "1.25rem" }}>
        <p style={sectionLabelStyle}>Descripción del ticket</p>
        <div className="rounded-xl" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)", padding: "2rem" }}>
          <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)", marginBottom: "0.875rem" }}>{ticket.title}</h3>
          <p className="text-sm" style={{ color: "var(--color-text-muted)", lineHeight: "1.75" }}>{ticket.description}</p>
        </div>
      </div>

      {/* Archivos adjuntos (solo si existen) */}
      {ticket.attachments && ticket.attachments.length > 0 && (
        <div style={{ marginBottom: "1.25rem" }}>
          <p style={sectionLabelStyle}>Archivo adjunto</p>
          <div className="rounded-xl" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)", padding: "1rem 1.75rem" }}>
            {ticket.attachments.map((att) => (
              
                key={att.id}
                href={`/api/attachments/download/${att.id}`}
                download={att.filename ?? "archivo"}
                className="inline-flex items-center gap-2 rounded-lg transition"
                style={{
                  color: "var(--color-primary)",
                  fontSize: "0.9375rem",
                  fontWeight: 500,
                  textDecoration: "none",
                  padding: "0.375rem 0.75rem",
                  backgroundColor: "var(--color-primary-light)",
                  border: "1px solid color-mix(in oklab, var(--color-primary) 25%, transparent)",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-primary-highlight)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-primary-light)")}
              >
                <Paperclip size={14} />
                {att.filename ?? "Descargar archivo"}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Chat de seguimiento del ticket */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ marginBottom: "0.625rem", paddingLeft: "0.25rem" }}>
          <span style={sectionLabelStyle}>Seguimiento del ticket</span>
        </div>
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
          <div className="flex flex-col gap-4 overflow-y-auto" style={{ minHeight: "300px", maxHeight: "420px", padding: "2rem 3rem" }}>
            {comments.length === 0 ? (
              <div className="flex flex-1 items-center justify-center py-12">
                <p className="text-sm" style={{ color: "var(--color-text-faint)" }}>Sin mensajes aún. Sé el primero en comentar.</p>
              </div>
            ) : (
              comments.map((c) => (
                <ChatBubble key={c.id} comment={c} isSelf={(c as any).user_id === currentUserId} />
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input de nuevo comentario */}
          <div className="flex items-center gap-3 px-6 py-4" style={{ borderTop: "1px solid var(--color-border)" }}>
            <input
              className="flex-1 rounded-lg outline-none"
              style={{
                padding: "0.625rem 0.875rem",
                fontSize: "0.9375rem",
                backgroundColor: isFinalStatus ? "var(--color-surface-offset)" : "var(--color-bg)",
                border: newComment ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                color: isFinalStatus ? "var(--color-text-faint)" : "var(--color-text)",
                transition: "border-color 150ms",
                cursor: isFinalStatus ? "not-allowed" : "text",
              }}
              placeholder={isFinalStatus ? "No se pueden añadir comentarios en tickets cerrados o cancelados" : "Escribe un mensaje…"}
              value={newComment}
              onChange={(e) => !isFinalStatus && setNewComment(e.target.value)}
              onKeyDown={(e) => !isFinalStatus && e.key === "Enter" && !e.shiftKey && handleAddComment()}
              onFocus={(e) => !isFinalStatus && (e.currentTarget.style.borderColor = "var(--color-primary)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = newComment ? "var(--color-primary)" : "var(--color-border)")}
              disabled={isFinalStatus}
            />
            <button
              onClick={handleAddComment}
              className="flex items-center justify-center rounded-full transition"
              style={{
                width: "40px", height: "40px", flexShrink: 0,
                backgroundColor: !isFinalStatus && newComment.trim() ? "var(--color-primary)" : "var(--color-surface-offset)",
                color: !isFinalStatus && newComment.trim() ? "#fff" : "var(--color-text-faint)",
                border: "none",
                cursor: !isFinalStatus && newComment.trim() ? "pointer" : "not-allowed",
                transition: "background-color 150ms",
              }}
              onMouseEnter={(e) => !isFinalStatus && newComment.trim() && ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-primary-hover)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = !isFinalStatus && newComment.trim() ? "var(--color-primary)" : "var(--color-surface-offset)")}
              disabled={isFinalStatus || !newComment.trim()}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal: cambiar estado */}
      <Modal open={openStatusModal} onClose={() => setOpenStatusModal(false)} title="Cambiar estado" subtitle="Selecciona el nuevo estado del ticket">
        <ModalSelect value={newStatus === null ? "" : newStatus} onChange={(v) => { setNewStatus(Number(v)) }}>
          <option value="">Selecciona estado</option>
          {allowedTransitions.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </ModalSelect>
        <ModalFooter onClose={() => setOpenStatusModal(false)} onConfirm={handleUpdate} confirmLabel="Actualizar estado" />
      </Modal>

      {/* Modal: cambiar prioridad */}
      <Modal open={openPriorityModal} onClose={() => setOpenPriorityModal(false)} title="Cambiar prioridad" subtitle="Selecciona la nueva prioridad del ticket">
        <ModalSelect value={newPriority} onChange={setNewPriority}>
          <option value="Baja">Baja</option>
          <option value="Media">Media</option>
          <option value="Alta">Alta</option>
          <option value="Crítica">Crítica</option>
        </ModalSelect>
        <ModalFooter onClose={() => setOpenPriorityModal(false)} onConfirm={handlePriorityUpdate} confirmLabel="Actualizar prioridad" />
      </Modal>

      {/* Modal: asignar técnico */}
      <Modal open={openAssignModal} onClose={() => { setOpenAssignModal(false); setSelectedTech(null) }} title="Asignar técnico" subtitle="Elige el técnico responsable de este ticket">
        <ModalSelect value={selectedTech ?? ""} onChange={(v) => setSelectedTech(Number(v))}>
          <option value="">Selecciona técnico</option>
          {technicians.map(t => <option key={t.id} value={t.id}>{t.name} {t.surname}</option>)}
        </ModalSelect>
        <ModalFooter onClose={() => { setOpenAssignModal(false); setSelectedTech(null) }} onConfirm={handleAssign} confirmLabel="Asignar" />
      </Modal>

      {/* Modal: ver y aceptar/rechazar solución */}
      <Modal open={openSolutionModal} onClose={() => setOpenSolutionModal(false)} title="Solución propuesta" subtitle="Revisa los mensajes y decide si aceptas la solución">
        <div className="flex flex-col gap-3 overflow-y-auto rounded-lg" style={{ maxHeight: "220px", backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)", padding: "0.875rem", marginBottom: "1.5rem" }}>
          {comments.length === 0
            ? <p className="text-sm" style={{ color: "var(--color-text-faint)" }}>Sin mensajes aún.</p>
            : comments.map(c => (
              <div key={c.id} className="rounded-lg" style={{ padding: "0.75rem", backgroundColor: "var(--color-surface-offset)" }}>
                <p className="text-sm" style={{ color: "var(--color-text)" }}>{c.content}</p>
                <p className="mt-1 text-xs" style={{ color: "var(--color-text-faint)" }}>{new Date(c.created_at).toLocaleString("es-ES")}</p>
              </div>
            ))}
        </div>
        <div style={{ height: "1px", backgroundColor: "var(--color-divider)", marginBottom: "1.5rem" }} />
        <div className="flex justify-end gap-2">
          <button onClick={() => setOpenSolutionModal(false)} className="rounded-lg text-sm font-medium transition" style={{ backgroundColor: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "0.5rem 1rem" }} onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-surface-offset)")} onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}>
            Cancelar
          </button>
          <button onClick={handleRejectSolution} className="rounded-full text-sm font-medium transition" style={{ backgroundColor: "var(--color-error)", color: "#fff", border: "none", cursor: "pointer", padding: "0.5rem 1.25rem" }} onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.9")} onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}>
            Rechazar
          </button>
          <button onClick={handleAcceptSolution} className="rounded-full text-sm font-medium transition" style={{ backgroundColor: "var(--color-success)", color: "#fff", border: "none", cursor: "pointer", padding: "0.5rem 1.25rem" }} onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.9")} onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}>
            Aceptar solución
          </button>
        </div>
      </Modal>

    </div>
  )
}