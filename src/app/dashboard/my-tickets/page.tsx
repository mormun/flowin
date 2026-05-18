"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Search, Plus } from "lucide-react"
import Link from "next/link"

// Hook para pausar polling cuando la pestaña no está visible
function useDocumentVisible() {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const handleChange = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', handleChange)
    return () => document.removeEventListener('visibilitychange', handleChange)
  }, [])
  return visible
}

type Ticket = {
  id: number
  title: string
  priority: string
  category_id: number | null
  categories: { name: string } | null
  status_id: number
  created_at: string
}

const PRIORITY_STYLES: Record<string, { bg: string; color: string }> = {
  Crítica: { bg: "var(--color-error-light)", color: "var(--color-error)" },
  Alta: { bg: "var(--color-warning-light)", color: "var(--color-warning)" },
  Media: { bg: "#fef9c3", color: "#854d0e" },
  Baja: { bg: "var(--color-success-light)", color: "var(--color-success)" },
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

const Badge = ({ label, bg, color }: { label: string; bg: string; color: string }) => (
  <span
    className="inline-flex items-center rounded-full text-sm font-medium"
    style={{ backgroundColor: bg, color, padding: "0.10rem 0.75rem", whiteSpace: "nowrap", lineHeight: 1.4 }}
  >
    {label}
  </span>
)

const SortTh = ({
  label, value, current, onClick, firstCol,
}: {
  label: string
  value: string
  current: string
  onClick: () => void
  firstCol?: boolean
}) => (
  <th
    className="cursor-pointer select-none pr-4 text-left text-sm font-semibold uppercase tracking-wider"
    style={{
      color: current === value ? "var(--color-primary)" : "var(--color-text-muted)",
      paddingLeft: firstCol ? "2rem" : undefined,
      paddingTop: "1rem",
      paddingBottom: "1rem",
    }}
    onClick={onClick}
  >
    <span className="flex items-center gap-1">
      {label}
      {current === value && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      )}
    </span>
  </th>
)

const ITEMS_PER_PAGE = 8

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<"id" | "title" | "priority" | "date">("date")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const router = useRouter()
  const isVisible = useDocumentVisible()

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await fetch("/api/my-tickets")
        const data = await res.json()
        if (!res.ok) {
          toast.error(data?.error ?? "Error cargando tickets")
          return
        }
        setTickets(data)
      } catch {
        toast.error("Error de conexión")
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()

    // Auto-refresh cada 20s si la pestaña está visible
    if (!isVisible) return
    const interval = setInterval(() => {
      if (document.hidden) return
      fetchTickets()
    }, 20000)

    return () => clearInterval(interval)
  }, [isVisible])

  const filtered = useMemo(() => {
    return tickets
      .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
      .filter((t) => {
        if (statusFilter === "all") return true
        if (statusFilter === "open") return t.status_id !== 6 && t.status_id !== 2
        if (statusFilter === "closed") return t.status_id === 6 || t.status_id === 2
        return true
      })
      .sort((a, b) => {
        if (sortBy === "id") return a.id - b.id
        if (sortBy === "title") return a.title.localeCompare(b.title)
        if (sortBy === "priority") return a.priority.localeCompare(b.priority)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }, [tickets, search, sortBy, statusFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, sortBy, statusFilter])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <div style={{ width: "100%", padding: "2rem 3rem 2rem 2.5rem", marginTop: "1.5rem" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <h2 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>Mis tickets</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>Historial de tickets creados por ti</p>
      </div>

      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" style={{ marginBottom: "1.25rem" }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2.5"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", width: "260px" }}
          >
            <Search size={14} color="var(--color-text-faint)" />
            <input
              type="text"
              placeholder="Buscar ticket..."
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="open">Activos</option>
            <option value="closed">Cerrados / Cancelados</option>
          </select>
        </div>
        <Link
          href="/dashboard/tickets/new"
          className="flex items-center gap-2 rounded-full font-bold transition whitespace-nowrap"
          style={{ backgroundColor: "var(--color-primary)", color: "#fff", fontSize: "0.9375rem", padding: "0.55rem 1.5rem", textDecoration: "none" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-primary-hover)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-primary)")}
        >
          <Plus size={15} /> Nuevo ticket
        </Link>
      </div>

      <div
        className="w-full overflow-x-auto rounded-xl"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}
      >
        {loading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 rounded-lg animate-pulse" style={{ backgroundColor: "var(--color-surface-offset)" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: "var(--color-text-faint)" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <p className="mb-3 text-base font-medium" style={{ color: "var(--color-text-muted)" }}>Aún no tienes tickets</p>
            <Link
              href="/dashboard/tickets/new"
              className="flex items-center gap-1.5 rounded-full text-sm font-medium transition"
              style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary-dark)", textDecoration: "none", padding: "0.4rem 1rem" }}
            >
              <Plus size={14} /> Crear primer ticket
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                <SortTh label="ID Ticket" value="id" current={sortBy} firstCol onClick={() => setSortBy("id")} />
                <SortTh label="Título" value="title" current={sortBy} onClick={() => setSortBy("title")} />
                <th
                  className="pr-4 text-left text-sm font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-text-muted)", paddingTop: "1rem", paddingBottom: "1rem" }}
                >
                  Categoría
                </th>
                <SortTh label="Prioridad" value="priority" current={sortBy} onClick={() => setSortBy("priority")} />
                <th
                  className="pr-4 text-left text-sm font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-text-muted)", paddingTop: "1rem", paddingBottom: "1rem" }}
                >
                  Estado
                </th>
                <SortTh label="Fecha" value="date" current={sortBy} onClick={() => setSortBy("date")} />
              </tr>
            </thead>
            <tbody>
              {paginated.map((t, idx) => (
                <tr
                  key={t.id}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: idx < paginated.length - 1 ? "1px solid var(--color-divider)" : "none" }}
                  onClick={() => router.push(`/dashboard/tickets/${t.id}`)}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-surface-offset)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
                >
                  <td
                    className="text-base tabular-nums font-medium"
                    style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem", color: "var(--color-text)", paddingLeft: "2rem", paddingRight: "1rem" }}
                  >
                    #{t.id}
                  </td>
                  <td style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem", paddingRight: "1rem", maxWidth: "220px" }}>
                    <span className="block truncate text-base font-medium" style={{ color: "var(--color-text)" }}>
                      {t.title}
                    </span>
                  </td>
                  <td className="text-base" style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem", paddingRight: "1rem", color: "var(--color-text)" }}>
                    {t.categories?.name ?? "—"}
                  </td>
                  <td style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem", paddingRight: "1rem" }}>
                    <Badge
                      label={t.priority}
                      bg={PRIORITY_STYLES[t.priority]?.bg ?? "var(--color-bg)"}
                      color={PRIORITY_STYLES[t.priority]?.color ?? "var(--color-text-muted)"}
                    />
                  </td>
                  <td style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem", paddingRight: "1rem" }}>
                    <Badge
                      label={STATUS_LABELS[t.status_id] ?? "—"}
                      bg={STATUS_STYLES[t.status_id]?.bg ?? "var(--color-bg)"}
                      color={STATUS_STYLES[t.status_id]?.color ?? "var(--color-text-muted)"}
                    />
                  </td>
                  <td className="text-base tabular-nums" style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem", paddingRight: "1rem", color: "var(--color-text)" }}>
                    {new Date(t.created_at).toLocaleDateString("es-ES")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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