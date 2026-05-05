"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()

  const [user, setUser] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated")
    if (isAuth) {
      router.replace("/dashboard")
    } else {
      setIsCheckingAuth(false)
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user && !password) {
      toast.warning("Campos vacíos", { description: "Introduce email y contraseña" })
      return
    }
    if (!user) {
      toast.warning("Falta el email", { description: "Introduce tu correo electrónico" })
      return
    }
    if (!password) {
      toast.warning("Falta la contraseña", { description: "Introduce tu contraseña" })
      return
    }

    try {
      setLoading(true)
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error("Error al iniciar sesión", { description: "Email o contraseña incorrectos" })
        return
      }

      localStorage.setItem("isAuthenticated", "true")
      localStorage.setItem("userId", data.id)
      localStorage.setItem("userEmail", data.email)
      localStorage.setItem("userRole", data.role)
      router.push("/dashboard")
    } catch {
      toast.error("Error de conexión con el servidor")
    } finally {
      setLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ backgroundColor: "var(--color-bg)" }}>
        <div className="flex items-center gap-2" style={{ color: "var(--color-text-muted)" }}>
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <span className="text-sm">Cargando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col md:flex-row">

      {/* Panel izquierdo — formulario */}
      <div
        className="flex w-full flex-col items-center justify-center p-8 md:w-96"
        style={{ backgroundColor: "var(--color-surface)", borderRight: "1px solid var(--color-border)" }}
      >
        <div className="w-full max-w-xs">

          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <Image
              src="/logo_render.png"
              alt="logo"
              width={100}
              height={100}
              priority
              style={{ width: "auto", height: "auto" }}
            />
          </div>

          {/* Título */}
          <div className="mb-6">
            <h1 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
              Iniciar sesión
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
              Accede con tu cuenta corporativa
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                Email
              </label>
              <input
                type="email"
                placeholder="usuario@empresa.com"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.625rem 0.875rem",
                  borderRadius: "var(--radius-md)",
                  border: user ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                  backgroundColor: "var(--color-bg)",
                  color: "var(--color-text)",
                  fontSize: "0.9375rem",
                  outline: "none",
                  transition: "border-color 150ms",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = user ? "var(--color-primary)" : "var(--color-border)")}
              />
            </div>

            {/* Contraseña */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                Contraseña
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.625rem 0.875rem",
                  borderRadius: "var(--radius-md)",
                  border: password ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                  backgroundColor: "var(--color-bg)",
                  color: "var(--color-text)",
                  fontSize: "0.9375rem",
                  outline: "none",
                  transition: "border-color 150ms",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = password ? "var(--color-primary)" : "var(--color-border)")}
              />
            </div>

            {/* Botón submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-full font-medium transition disabled:opacity-50"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "#fff",
                fontSize: "0.9375rem",
                padding: "0.6rem 1.5rem",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) =>
                !loading && ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-primary-hover)")
              }
              onMouseLeave={(e) =>
                !loading && ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-primary)")
              }
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Accediendo...
                </>
              ) : (
                "Acceder"
              )}
            </button>

          </form>
        </div>
      </div>

      {/* Panel derecho — fondo decorativo */}
      <div
        className="hidden flex-1 md:flex md:items-center md:justify-center"
        style={{ backgroundColor: "var(--color-bg)" }}
      >
        <div
          className="flex flex-col items-center gap-4 select-none"
          style={{ color: "var(--color-text-faint)", opacity: 0.4 }}
        >
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="text-sm tracking-widest uppercase">Sistema de tickets</span>
        </div>
      </div>

    </div>
  )
}