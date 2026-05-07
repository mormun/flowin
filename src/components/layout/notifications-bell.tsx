"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Bell } from "lucide-react"

type Notification = {
  id: number
  title: string
  message: string
  read: boolean
  created_at: string
  ticket: { id: number; title: string } | null
}

const POLL_INTERVAL_MS = 20000

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return "ahora"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `hace ${days} d`
  return new Date(date).toLocaleDateString("es-ES")
}

export function NotificationsBell() {
  const { status } = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Solo se muestran las no leídas
  const visibleNotifications = notifications.filter((n) => !n.read)

  useEffect(() => {
    if (status !== "authenticated") return

    const fetchNotifs = async () => {
      try {
        const res = await fetch("/api/notifications")
        if (!res.ok) return
        const data = await res.json()
        setNotifications(data.notifications ?? [])
        setUnreadCount(data.unread_count ?? 0)
      } catch {
        // Silencioso: no queremos toasts ruidosos por el polling
      }
    }

    fetchNotifs()
    const interval = setInterval(fetchNotifs, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [status])

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  const handleNotificationClick = (notif: Notification) => {
    setOpen(false)

    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
    fetch(`/api/notifications/${notif.id}`, { method: "PATCH" }).catch(() => {})

    if (notif.ticket?.id) {
      router.push(`/dashboard/tickets/${notif.ticket.id}`)
    }
  }

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
    fetch("/api/notifications/mark-all-read", { method: "POST" }).catch(() => {})
  }

  const badgeText = unreadCount > 9 ? "9+" : String(unreadCount)

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notificaciones"
        style={{
          position: "relative",
          width: "36px",
          height: "36px",
          borderRadius: "var(--radius-md)",
          backgroundColor: "var(--color-bg)",
          border: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-muted)",
          cursor: "pointer",
          transition: "color 120ms",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--color-text)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)")}
      >
        <Bell size={17} strokeWidth={2} />

        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              minWidth: "18px",
              height: "18px",
              padding: "0 5px",
              borderRadius: "9px",
              backgroundColor: "var(--color-error)",
              color: "white",
              fontSize: "0.6875rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            {badgeText}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "360px",
            maxHeight: "480px",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text)" }}>
              Notificaciones
            </span>
            {visibleNotifications.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.8125rem",
                  color: "var(--color-primary)",
                  padding: 0,
                }}
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {visibleNotifications.length === 0 ? (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  color: "var(--color-text-muted)",
                  fontSize: "0.875rem",
                }}
              >
                No tienes notificaciones nuevas
              </div>
            ) : (
              visibleNotifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "12px 16px",
                    border: "none",
                    borderBottom: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-primary-light)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    transition: "background-color 120ms",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "8px",
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "var(--color-text)",
                      }}
                    >
                      {n.title}
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-text-faint)",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--color-text-muted)",
                      lineHeight: 1.4,
                    }}
                  >
                    {n.message}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}