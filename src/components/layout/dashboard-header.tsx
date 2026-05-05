"use client"

import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"

// ── Mapa de segmentos URL → nombre en español ─────────────────
const ROUTE_NAMES: Record<string, string> = {
  "dashboard":  "Inicio",
  "tickets":    "Tickets",
  "my-tickets":         "Mis tickets",
  "bandeja":    "Bandeja",
  "profile":    "Perfil",
  "users":      "Usuarios",
  "categories": "Categorías",
  "status":     "Estados",
  "new":        "Nuevo ticket",
}

// ── Excepciones: ruta padre personalizada por ruta completa ───
const PARENT_OVERRIDE: Record<string, string> = {
  "/dashboard/tickets/new": "/dashboard/my-tickets",
}

export function DashboardHeader({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("")

  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail")
    const storedRole  = localStorage.getItem("userRole")
    if (storedEmail) setEmail(storedEmail)
    if (storedRole)  setRole(storedRole)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("userRole")
    localStorage.removeItem("userId")
    router.push("/login")
  }

  const segments = pathname.split("/").filter(Boolean)

  const buildHref = (index: number) => {
    const accumulated = "/" + segments.slice(0, index + 1).join("/")
    const fullPath = "/" + segments.join("/")
    if (PARENT_OVERRIDE[fullPath] && index === segments.length - 2) {
      return PARENT_OVERRIDE[fullPath]
    }
    return accumulated
  }

  const translateSegment = (segment: string) =>
    ROUTE_NAMES[segment.toLowerCase()] ??
    segment.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase())

  return (
    <header
      style={{
        height: "64px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 1.75rem",
        backgroundColor: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        position: "sticky", top: 0, zIndex: 10,
      }}
    >
      {/* Izquierda */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Hamburguesa móvil */}
        <button
          onClick={onMenuToggle}
          className="flex md:hidden"
          style={{
            width: "36px", height: "36px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--color-bg)",
            border: "1px solid var(--color-border)",
            alignItems: "center", justifyContent: "center",
            color: "var(--color-text-muted)",
          }}
          aria-label="Abrir menú"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "1.125rem" }}>
          {segments.map((segment, index) => {
            const isLast = index === segments.length - 1
            const href = buildHref(index)
            const label = translateSegment(segment)

            return (
              <span key={index} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {index > 0 && (
                  <span style={{ color: "var(--color-text-faint)" }}>/</span>
                )}
                {isLast ? (
                  <span style={{ color: "var(--color-text)", fontWeight: 500 }}>
                    {label}
                  </span>
                ) : (
                  <Link
                    href={href}
                    style={{
                      color: "var(--color-text-muted)",
                      fontWeight: 400,
                      textDecoration: "none",
                      transition: "color 120ms",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--color-text)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)")}
                  >
                    {label}
                  </Link>
                )}
              </span>
            )
          })}
        </div>
      </div>

      {/* Derecha */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Link
          href="/dashboard/profile"
          style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "6px 10px",
            borderRadius: "var(--radius-lg)",
            textDecoration: "none",
            transition: "background-color 120ms",
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-bg)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
        >
          {/* Avatar */}
          <div style={{
            width: "32px", height: "32px",
            borderRadius: "50%",
            backgroundColor: "var(--color-primary-light)",
            border: "2px solid var(--color-primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.875rem", fontWeight: 600,
            color: "var(--color-primary-dark)",
            flexShrink: 0,
          }}>
            {email ? email.charAt(0).toUpperCase() : "?"}
          </div>

          {/* Info */}
          <div className="hidden md:flex" style={{ flexDirection: "column", lineHeight: 1.3 }}>
            <span style={{ fontSize: "1.125rem", fontWeight: 500, color: "var(--color-text)" }}>
              {email || "Usuario"}
            </span>
            <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", textTransform: "capitalize" }}>
              {role}
            </span>
          </div>
        </Link>

        <div style={{ width: "1px", height: "20px", backgroundColor: "var(--color-border)" }} />

        <button
          onClick={handleLogout}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "6px 12px",
            borderRadius: "var(--radius-md)",
            fontSize: "1.125rem",
            fontWeight: 500,
            color: "var(--color-text-muted)",
            background: "none",
            border: "none",
            cursor: "pointer",
            transition: "background-color 120ms, color 120ms",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-error-light)"
            ;(e.currentTarget as HTMLElement).style.color = "var(--color-error)"
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"
            ;(e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)"
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Salir
        </button>
      </div>
    </header>
  )
}