"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  Ticket, PlusCircle, User, Inbox, Users, Tag, Settings, LayoutGrid,
  Clock, CheckCircle, XCircle, AlertCircle, TrendingUp, UserCheck, CalendarClock, UserX
} from "lucide-react"

type StatCard = { title: string; value: number | string; type?: "number" | "text" }

// Accesos directos al dashboard según rol
const SHORTCUTS: Record<string, { label: string; icon: React.ReactNode; href: string; description: string }[]> = {
  user: [
    { label: "Mis tickets",   icon: <Ticket size={28} />,    href: "/dashboard/my-tickets",    description: "Ver todos tus tickets" },
    { label: "Abrir ticket",  icon: <PlusCircle size={28} />, href: "/dashboard/tickets/new",  description: "Crea una nueva solicitud" },
    { label: "Perfil",        icon: <User size={28} />,       href: "/dashboard/profile",       description: "Gestiona tu cuenta" },
  ],
  tech: [
    { label: "Bandeja",      icon: <Inbox size={28} />,      href: "/dashboard/bandeja",       description: "Todos los tickets asignados" },
    { label: "Tickets",      icon: <Ticket size={28} />,     href: "/dashboard/tickets",       description: "Todos los tickets" },
    { label: "Abrir ticket", icon: <PlusCircle size={28} />, href: "/dashboard/tickets/new",   description: "Crea una nueva solicitud" },
    { label: "Perfil",       icon: <User size={28} />,       href: "/dashboard/profile",       description: "Gestiona tu cuenta" },
  ],
  admin: [
    { label: "Usuarios",     icon: <Users size={28} />,      href: "/dashboard/users",         description: "Gestión de usuarios" },
    { label: "Categorías",   icon: <Tag size={28} />,        href: "/dashboard/categories",    description: "Categorías de tickets" },
    { label: "Estados",      icon: <Settings size={28} />,   href: "/dashboard/status",        description: "Estados del sistema" },
    { label: "Tickets",      icon: <LayoutGrid size={28} />, href: "/dashboard/tickets",       description: "Todos los tickets" },
    { label: "Abrir ticket", icon: <PlusCircle size={28} />, href: "/dashboard/tickets/new",   description: "Crea una nueva solicitud" },
    { label: "Perfil",       icon: <User size={28} />,       href: "/dashboard/profile",       description: "Gestiona tu cuenta" },
  ],
}

// Título y descripción del panel según rol
const ROLE_META: Record<string, { title: string; description: string }> = {
  user:  { title: "Bienvenido",          description: "Aquí tienes un resumen de tu actividad" },
  tech:  { title: "Panel técnico",       description: "Gestión y seguimiento de tickets" },
  admin: { title: "Panel administrativo", description: "Vista general del sistema" },
}

// Icono asociado a cada métrica del dashboard
const STAT_ICONS: Record<string, React.ReactNode> = {
  "Tickets abiertos":        <AlertCircle size={22} />,
  "Abiertos este mes":       <CalendarClock size={22} />,
  "Tickets solucionados":    <CheckCircle size={22} />,
  "Tickets cerrados":        <XCircle size={22} />,
  "Categoría más utilizada": <Tag size={22} />,
  "Tickets en proceso":      <Clock size={22} />,
  "Sin asignar":             <Inbox size={22} />,
  "Mis tickets":             <Ticket size={22} />,
  "Cerrados este mes":       <CheckCircle size={22} />,
  "Usuarios activos":        <UserCheck size={22} />,
  "Categorías activas":      <Tag size={22} />,
  "Tickets totales":         <TrendingUp size={22} />,
  "Total usuarios":          <Users size={22} />,
  "Usuarios inactivos":      <UserX size={22} />,
  "Categorías existentes":   <Tag size={22} />,
}

// Estilo visual (gradiente, colores) para cada tarjeta de estadística
const STAT_STYLES: Record<string, { gradient: string; iconColor: string; valueColor: string; border: string }> = {
  "Tickets abiertos":        { gradient: "linear-gradient(135deg, #fef3c7, #fde68a)", iconColor: "#b45309", valueColor: "#92400e", border: "#fcd34d" },
  "Abiertos este mes":       { gradient: "linear-gradient(135deg, #dbeafe, #bfdbfe)", iconColor: "#2563eb", valueColor: "#1d4ed8", border: "#93c5fd" },
  "Tickets solucionados":    { gradient: "linear-gradient(135deg, #dcfce7, #bbf7d0)", iconColor: "#16a34a", valueColor: "#15803d", border: "#86efac" },
  "Tickets cerrados":        { gradient: "linear-gradient(135deg, #f1f5f9, #e2e8f0)", iconColor: "#64748b", valueColor: "#475569", border: "#cbd5e1" },
  "Categoría más utilizada": { gradient: "linear-gradient(135deg, #ede9fe, #ddd6fe)", iconColor: "#7c3aed", valueColor: "#6d28d9", border: "#c4b5fd" },
  "Sin asignar":             { gradient: "linear-gradient(135deg, #fee2e2, #fecaca)", iconColor: "#dc2626", valueColor: "#b91c1c", border: "#f87171" },
  "Mis tickets":             { gradient: "linear-gradient(135deg, #cffafe, #a5f3fc)", iconColor: "#0891b2", valueColor: "#0e7490", border: "#67e8f9" },
  "Cerrados este mes":       { gradient: "linear-gradient(135deg, #dcfce7, #bbf7d0)", iconColor: "#16a34a", valueColor: "#15803d", border: "#86efac" },
  "Usuarios activos":        { gradient: "linear-gradient(135deg, #cffafe, #a5f3fc)", iconColor: "#0891b2", valueColor: "#0e7490", border: "#67e8f9" },
  "Categorías activas":      { gradient: "linear-gradient(135deg, #dbeafe, #bfdbfe)", iconColor: "#2563eb", valueColor: "#1d4ed8", border: "#93c5fd" },
  "Tickets totales":         { gradient: "linear-gradient(135deg, #fef3c7, #fde68a)", iconColor: "#b45309", valueColor: "#92400e", border: "#fcd34d" },
  "Total usuarios":          { gradient: "linear-gradient(135deg, #ede9fe, #ddd6fe)", iconColor: "#7c3aed", valueColor: "#6d28d9", border: "#c4b5fd" },
  "Usuarios inactivos":      { gradient: "linear-gradient(135deg, #fee2e2, #fecaca)", iconColor: "#dc2626", valueColor: "#b91c1c", border: "#f87171" },
  "Categorías existentes":   { gradient: "linear-gradient(135deg, #dbeafe, #bfdbfe)", iconColor: "#2563eb", valueColor: "#1d4ed8", border: "#93c5fd" },
}

// Tarjeta de estadística con icono, título y valor
function StatsCard({ title, value, type }: StatCard) {
  const s = STAT_STYLES[title] ?? {
    gradient: "linear-gradient(135deg, #f1f5f9, #e2e8f0)",
    iconColor: "var(--color-text-muted)",
    valueColor: "var(--color-text)",
    border: "var(--color-border)",
  }
  const icon = STAT_ICONS[title] ?? <TrendingUp size={22} />
  const isText = type === "text"

  return (
    <div
      className="rounded-xl flex items-center gap-4"
      style={{ backgroundColor: "var(--color-surface)", border: `1px solid ${s.border}`, boxShadow: "var(--shadow-sm)", padding: "1.375rem 1.625rem" }}
    >
      <div
        className="flex items-center justify-center rounded-xl flex-shrink-0"
        style={{ width: "52px", height: "52px", background: s.gradient, color: s.iconColor }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>
          {title}
        </p>
        {isText ? (
          // Valor de texto (ej: nombre de categoría): truncado con tooltip
          <p className="font-semibold truncate" style={{ color: s.valueColor, fontSize: "1rem", lineHeight: 1.3 }} title={String(value)}>
            {value}
          </p>
        ) : (
          // Valor numérico: fuente grande y tabular
          <p className="text-3xl font-bold tabular-nums" style={{ color: s.valueColor, lineHeight: 1.1 }}>
            {value}
          </p>
        )}
      </div>
    </div>
  )
}

// Tarjeta de acceso directo: navega al href al hacer clic
function ShortcutCard({ label, icon, href, description }: { label: string; icon: React.ReactNode; href: string; description: string }) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push(href)}
      className="flex flex-col items-center text-center rounded-xl transition"
      style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)", padding: "1.75rem 1.25rem 1.5rem", cursor: "pointer", gap: "0.875rem" }}
      onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--color-primary)"; el.style.boxShadow = "var(--shadow-md)"; el.style.transform = "translateY(-2px)" }}
      onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--color-border)"; el.style.boxShadow = "var(--shadow-sm)"; el.style.transform = "translateY(0)" }}
    >
      <div
        className="flex items-center justify-center rounded-2xl"
        style={{ width: "64px", height: "64px", backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)" }}
      >
        {icon}
      </div>
      <div>
        <p className="text-base font-semibold" style={{ color: "var(--color-text)" }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-faint)" }}>{description}</p>
      </div>
    </button>
  )
}

// Skeleton de carga: muestra placeholders animados mientras llegan los datos
function Skeleton({ count, height = "h-24" }: { count: number; height?: string }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${height} animate-pulse rounded-xl`} style={{ backgroundColor: "var(--color-surface)" }} />
      ))}
    </>
  )
}

// Sección con título y grid de tarjetas adaptable al número de columnas
function Section({ label, children, cols = 3 }: { label: string; children: React.ReactNode; cols?: number }) {
  return (
    <div>
      <p
        className="text-xs font-bold uppercase tracking-widest"
        style={{ color: "var(--color-text-text)", marginBottom: "0.875rem", paddingLeft: "0.25rem" }}
      >
        {label}
      </p>
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(${cols === 6 ? "140px" : "220px"}, 100%), 1fr))` }}
      >
        {children}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [cards, setCards] = useState<StatCard[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [error, setError] = useState(false)

  const role      = session?.user?.role ?? ""
  const meta      = ROLE_META[role] ?? { title: "Dashboard", description: "" }
  const shortcuts = SHORTCUTS[role] ?? []

  // Cargar estadísticas del dashboard según rol del usuario
  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated" || !role) { setLoadingStats(false); return }

    setLoadingStats(true)
    setError(false)

    fetch("/api/dashboard/stats")
      .then((res) => { if (!res.ok) throw new Error(); return res.json() })
      .then((data) => setCards(data.cards))
      .catch(() => setError(true))
      .finally(() => setLoadingStats(false))
  }, [role, status])

  return (
    <div style={{ width: "100%", padding: "2rem 3rem 2rem 2.5rem" }}>
      {/* Cabecera con fecha, título y descripción según rol */}
      <div style={{ marginBottom: "2.25rem" }}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-faint)" }}>
          {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
        <h2 className="mt-1.5 text-2xl font-bold" style={{ color: "var(--color-text)" }}>{meta.title}</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>{meta.description}</p>
      </div>

      <div className="flex flex-col gap-8">
        {/* Accesos directos según rol */}
        <Section label="Accesos directos" cols={shortcuts.length || 3}>
          {shortcuts.map((s) => <ShortcutCard key={s.href} {...s} />)}
        </Section>

        <div style={{ height: "1px", backgroundColor: "var(--color-divider)" }} />

        {/* Estadísticas del rol */}
        <Section label="Estadísticas">
          {(status === "loading" || loadingStats) && <Skeleton count={role === "user" ? 5 : 3} />}

          {status !== "loading" && !loadingStats && error && (
            <div
              className="col-span-full flex items-center gap-3 rounded-xl p-5"
              style={{ backgroundColor: "var(--color-error-light)", border: "1px solid var(--color-border)" }}
            >
              <AlertCircle size={18} color="var(--color-error)" />
              <p className="text-sm font-medium" style={{ color: "var(--color-error)" }}>
                No se pudieron cargar las estadísticas. Inténtalo de nuevo.
              </p>
            </div>
          )}

          {status !== "loading" && !loadingStats && !error && cards.map((card, i) => (
            <StatsCard key={i} title={card.title} value={card.value} type={card.type} />
          ))}
        </Section>
      </div>
    </div>
  )
}