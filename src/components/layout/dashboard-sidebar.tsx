"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { getUserRole } from "@/lib/auth-client"

type MenuItem = { label: string; href: string; active: boolean }

export function DashboardSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])

  useEffect(() => {
    const role = getUserRole()
    let items: Omit<MenuItem, "active">[] = []

    if (role === "user") items = [
      { label: "Inicio", href: "/dashboard" },
      { label: "Mis tickets", href: "/dashboard/my-tickets" },
      { label: "Abrir ticket", href: "/dashboard/tickets/new" },
    ]

    if (role === "tech") items = [
      { label: "Inicio", href: "/dashboard" },
      { label: "Bandeja de tickets", href: "/dashboard/bandeja" },
      { label: "Tickets", href: "/dashboard/tickets" },
      { label: "Abrir ticket", href: "/dashboard/tickets/new" },
    ]

    if (role === "admin") items = [
      { label: "Inicio", href: "/dashboard" },
      { label: "Usuarios", href: "/dashboard/users" },
      { label: "Categorías", href: "/dashboard/categories" },
      { label: "Estados", href: "/dashboard/status" },
      { label: "Tickets", href: "/dashboard/tickets" },
      { label: "Abrir ticket", href: "/dashboard/tickets/new" },
    ]

    setMenuItems(items.map((item) => ({
      ...item,
      active: pathname === item.href,
    })))
  }, [pathname])

  return (
    <aside
      style={{
        width: "240px",
        minWidth: "240px",
        minHeight: "100vh",
        backgroundColor: "var(--color-surface)",
        borderRight: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        padding: "1.5rem 0.75rem",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "0.75rem 0.5rem 1.5rem",
          marginBottom: "0.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "1px solid var(--color-divider)",
        }}
      >
        <Image
          src="/logo_render.png"
          alt="Flow-in"
          width={150}
          height={94}
          priority
          className="h-auto w-auto"
        />

        {/* Botón cerrar — solo móvil */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 flex md:hidden"
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "var(--radius-md)",
            color: "var(--color-text-muted)",
            alignItems: "center",
            justifyContent: "center",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
          aria-label="Cerrar menú"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      {/* Label */}
      <p style={{
        fontSize: "0.7rem", fontWeight: 600,
        textTransform: "uppercase", letterSpacing: "0.08em",
        color: "var(--color-text-faint)",
        padding: "0 0.75rem",
        marginBottom: "0.375rem",
      }}>
        Navegación
      </p>

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {menuItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "0.625rem 0.75rem",
              borderRadius: "var(--radius-md)",
              fontSize: "1.125rem",        // ← de 0.9rem a ~15px
              fontWeight: item.active ? 600 : 500, // ← más peso en ambos casos
              color: item.active
                ? "var(--color-primary-dark)"
                : "#3d3d3d",                // ← gris oscuro en reposo
              backgroundColor: item.active
                ? "var(--color-primary-light)"
                : "transparent",
              textDecoration: "none",
              transition: "background-color 120ms, color 120ms",
            }}
            onMouseEnter={(e) => {
              if (!item.active) {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  "var(--color-surface-offset)"
                  ; (e.currentTarget as HTMLElement).style.color = "#1a1917" // ← casi negro al hover
              }
            }}
            onMouseLeave={(e) => {
              if (!item.active) {
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"
                  ; (e.currentTarget as HTMLElement).style.color = "#3d3d3d"
              }
            }}
          >
            {item.active && (
              <span
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  backgroundColor: "var(--color-primary)",
                  flexShrink: 0,
                }}
              />
            )}
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}