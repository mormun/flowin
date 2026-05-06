"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getUserEmail } from "@/lib/auth-client"
import { toast } from "sonner"

type Ticket = {
  id: number
  title: string
  priority: string
  status_id: number
  created_at: string
  categories: { name: string } | null
  status: { name: string } | null
  users_tickets_created_byTousers: { name: string; surname: string } | null
  users_tickets_assigned_toTousers: { id: number; name: string; surname: string } | null
}

const PRIORITY_STYLES: Record<string, { bg: string; color: string }> = {
  "Crítica": { bg: "var(--color-error-light)", color: "var(--color-error)" },
  "Alta": { bg: "var(--color-warning-light)", color: "var(--color-warning)" },
  "Media": { bg: "#fef9c3", color: "#854d0e" },
  "Baja": { bg: "var(--color-success-light)", color: "var(--color-success)" },
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  "Nuevo": { bg: "#dbeafe", color: "#1d4ed8" },
  "Proceso": { bg: "var(--color-primary-light)", color: "var(--color-primary)" },
  "Pendiente": { bg: "#fef9c3", color: "#854d0e" },
  "Solucionado": { bg: "var(--color-success-light)", color: "var(--color-success)" },
  "Cancelado": { bg: "var(--color-error-light)", color: "var(--color-error)" },
  "Cerrado": { bg: "var(--color-bg)", color: "var(--color-text-muted)" },
}

const ITEMS_PER_PAGE = 10

const Badge = ({ label, styles }: { label: string; styles: { bg: string; color: string } }) => (
  <span
    className="inline-flex items-center rounded-full text-sm font-medium"
    style={{
      backgroundColor: styles.bg,
      color: styles.color,
      padding: "0.10rem 0.75rem",
      whiteSpace: "nowrap",
      lineHeight: 1.4,
    }}
  >
    {label}
  </span>
)

export default function BandejaPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState<"id" | "title" | "priority" | "date">("date")
  const [currentPage, setCurrentPage] = useState(1)
  const router = useRouter()

  useEffect(() => {
    const email = getUserEmail()
    if (!email) return
    fetch(`/api/tickets?bandeja=true&email=${encodeURIComponent(email)}`)
      .then((res) => { if (!res.ok) throw new Error(); return res.json() })
      .then((data) => setTickets(data))
      .catch(() => toast.error("Error cargando tickets"))
      .finally(() => setLoading(false))
  }, [])

  const filtered = tickets
    .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
    .filter((t) => statusFilter === "all" || t.status?.name === statusFilter)
    .sort((a, b) => {
      if (sortBy === "id") return a.id - b.id
      if (sortBy === "title") return a.title.localeCompare(b.title)
      if (sortBy === "priority") return a.priority.localeCompare(b.priority)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const SortTh = ({ label, value }: { label: string; value: typeof sortBy }) => (
    <th
      className="cursor-pointer select-none pr-4 text-left text-sm font-semibold uppercase tracking-wider"
      style={{
        color: sortBy === value ? "var(--color-primary)" : "var(--color-text-muted)",
        paddingTop: "1rem",
        paddingBottom: "1rem",
      }}
      onClick={() => { setSortBy(value); setCurrentPage(1) }}
    >
      <span className="flex items-center gap-1">
        {label}
        {sortBy === value && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </span>
    </th>
  )

  const PlainTh = ({ label, right }: { label: string; right?: boolean }) => (
    <th
      className="pr-4 text-sm font-semibold uppercase tracking-wider"
      style={{
        color: "var(--color-text-muted)",
        paddingTop: "1rem",
        paddingBottom: "1rem",
        textAlign: right ? "right" : "left",
      }}
    >
      {label}
    </th>
  )

  return (
    <div style={{ width: "100%", padding: "2rem 3rem 2rem 2.5rem", marginTop: "1.5rem" }}>

      {/* Título */}
      <div style={{ marginBottom: "1.25rem" }}>
        <h2 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
          Bandeja de tickets
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
          Tickets sin asignar y los asignados a ti
        </p>
      </div>

      {/* Filtros */}
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center" style={{ marginBottom: "1.25rem" }}>
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2.5"
          style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", width: "260px" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-faint)" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Buscar ticket..."
            className="flex-1 bg-transparent outline-none ring-0 border-0"
            style={{ color: "var(--color-text)", fontSize: "0.9375rem" }}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
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
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
        >
          <option value="all">Todos los estados</option>
          <option value="Nuevo">Nuevo</option>
          <option value="Proceso">En proceso</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Solucionado">Solucionado</option>
        </select>
      </div>

      {/* Tabla */}
      <div
        className="w-full overflow-x-auto rounded-xl"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}
      >
        {loading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg" style={{ backgroundColor: "var(--color-surface-offset)" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: "var(--color-text-faint)" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <p className="text-base font-medium" style={{ color: "var(--color-text-muted)" }}>
              No hay tickets en tu bandeja
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                <th
                  className="cursor-pointer select-none pr-4 text-left text-sm font-semibold uppercase tracking-wider"
                  style={{
                    color: sortBy === "id" ? "var(--color-primary)" : "var(--color-text-muted)",
                    paddingLeft: "2rem",
                    paddingTop: "1rem",
                    paddingBottom: "1rem",
                  }}
                  onClick={() => { setSortBy("id"); setCurrentPage(1) }}
                >
                  <span className="flex items-center gap-1">
                    ID TICKET
                    {sortBy === "id" && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    )}
                  </span>
                </th>
                <SortTh label="Título" value="title" />
                <PlainTh label="Categoría" />
                <SortTh label="Prioridad" value="priority" />
                <PlainTh label="Estado" />
                <PlainTh label="Creado por" />
                <PlainTh label="Asignado a" />
                <SortTh label="Fecha" value="date" />
              </tr>
            </thead>
            <tbody>
              {paginated.map((t, idx) => (
                <tr
                  key={t.id}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: idx < paginated.length - 1 ? "1px solid var(--color-divider)" : "none" }}
                  onClick={() => router.push(`/dashboard/tickets/${t.id}`)}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-surface-offset)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
                >
                  {/* ID */}
                  <td
                    className="text-base tabular-nums font-medium"
                    style={{ paddingTop: "0.875rem", paddingBottom: "0.875rem", color: "var(--color-text)", paddingLeft: "2rem", paddingRight: "1rem" }}
                  >
                    #{t.id}
                  </td>
                  {/* Título */}
                  <td style={{ paddingTop: "0.875rem", paddingBottom: "0.875rem", paddingRight: "1rem", maxWidth: "200px" }}>
                    <span className="block truncate text-base font-medium" style={{ color: "var(--color-text)" }}>
                      {t.title}
                    </span>
                  </td>
                  {/* Categoría */}
                  <td className="text-base" style={{ paddingTop: "0.875rem", paddingBottom: "0.875rem", paddingRight: "1rem", color: "var(--color-text)" }}>
                    {t.categories?.name ?? "—"}
                  </td>
                  {/* Prioridad */}
                  <td style={{ paddingTop: "0.875rem", paddingBottom: "0.875rem", paddingRight: "1rem" }}>
                    <Badge
                      label={t.priority}
                      styles={PRIORITY_STYLES[t.priority] ?? { bg: "var(--color-bg)", color: "var(--color-text-muted)" }}
                    />
                  </td>
                  {/* Estado */}
                  <td style={{ paddingTop: "0.875rem", paddingBottom: "0.875rem", paddingRight: "1rem" }}>
                    <Badge
                      label={t.status?.name ?? "—"}
                      styles={STATUS_STYLES[t.status?.name ?? ""] ?? { bg: "var(--color-bg)", color: "var(--color-text-muted)" }}
                    />
                  </td>
                  {/* Creado por */}
                  <td className="text-base" style={{ paddingTop: "0.875rem", paddingBottom: "0.875rem", paddingRight: "1rem", color: "var(--color-text)" }}>
                    {t.users_tickets_created_byTousers
                      ? `${t.users_tickets_created_byTousers.name} ${t.users_tickets_created_byTousers.surname}`
                      : "—"}
                  </td>
                  {/* Asignado a */}
                  <td className="text-base" style={{ paddingTop: "0.875rem", paddingBottom: "0.875rem", paddingRight: "1rem", color: "var(--color-text)" }}>
                    {t.users_tickets_assigned_toTousers
                      ? `${t.users_tickets_assigned_toTousers.name} ${t.users_tickets_assigned_toTousers.surname}`
                      : <span style={{ color: "var(--color-text-faint)", fontStyle: "italic" }}>Sin asignar</span>}
                  </td>
                  {/* Fecha */}
                  <td className="text-base tabular-nums" style={{ paddingTop: "0.875rem", paddingBottom: "0.875rem", paddingRight: "1rem", color: "var(--color-text)" }}>
                    {new Date(t.created_at).toLocaleDateString("es-ES")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} de {filtered.length}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg text-sm font-medium transition disabled:opacity-40"
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-muted)",
                padding: "0.5rem 1rem",
              }}
            >
              ←
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...")
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={i} className="px-2 py-1.5 text-sm" style={{ color: "var(--color-text-faint)" }}>…</span>
                ) : (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(p as number)}
                    className="rounded-lg text-sm font-medium transition"
                    style={{
                      backgroundColor: currentPage === p ? "var(--color-primary)" : "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      color: currentPage === p ? "#fff" : "var(--color-text-muted)",
                      padding: "0.5rem 1rem",
                    }}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg text-sm font-medium transition disabled:opacity-40"
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-muted)",
                padding: "0.5rem 1rem",
              }}
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}