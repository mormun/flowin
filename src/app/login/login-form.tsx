"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Image from "next/image"
import { toast } from "sonner"

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [user, setUser] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user && !password) {
      toast.warning("Campos vacíos", {
        description: "Introduce email y contraseña",
      })
      return
    }

    if (!user) {
      toast.warning("Falta el email", {
        description: "Introduce tu correo electrónico",
      })
      return
    }

    if (!password) {
      toast.warning("Falta la contraseña", {
        description: "Introduce tu contraseña",
      })
      return
    }

    try {
      setLoading(true)

      const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

      const result = await signIn("credentials", {
        email: user,
        password,
        redirect: false,
        callbackUrl,
      })

      if (result?.error) {
        toast.error("Error al iniciar sesión", {
          description: "Email o contraseña incorrectos",
        })
        return
      }

      router.replace(result?.url || "/dashboard")
      router.refresh()
    } catch {
      toast.error("Error de conexión con el servidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <div
        className="flex w-full flex-col items-center justify-center p-8 md:w-96"
        style={{
          backgroundColor: "var(--color-surface)",
          borderRight: "1px solid var(--color-border)",
        }}
      >
        <div className="w-full max-w-xs">
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

          <div className="mb-6">
            <h1
              className="text-xl font-bold"
              style={{ color: "var(--color-text)" }}
            >
              Iniciar sesión
            </h1>
            <p
              className="mt-1 text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              Accede con tu cuenta corporativa
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                className="text-sm font-medium"
                style={{ color: "var(--color-text)" }}
              >
                Email
              </label>
              <input
                type="email"
                placeholder="usuario@empresa.com"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                autoComplete="email"
                className="w-full rounded-md px-3.5 py-2.5 text-[0.9375rem] outline-none transition"
                style={{
                  border: user
                    ? "1px solid var(--color-primary)"
                    : "1px solid var(--color-border)",
                  backgroundColor: "var(--color-bg)",
                  color: "var(--color-text)",
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="text-sm font-medium"
                style={{ color: "var(--color-text)" }}
              >
                Contraseña
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-md px-3.5 py-2.5 text-[0.9375rem] outline-none transition"
                style={{
                  border: password
                    ? "1px solid var(--color-primary)"
                    : "1px solid var(--color-border)",
                  backgroundColor: "var(--color-bg)",
                  color: "var(--color-text)",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-[0.9375rem] font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Accediendo..." : "Acceder"}
            </button>
          </form>
        </div>
      </div>

      <div
        className="hidden flex-1 md:flex md:items-center md:justify-center"
        style={{ backgroundColor: "var(--color-bg)" }}
      >
        <div
          className="flex flex-col items-center gap-4 select-none"
          style={{ color: "var(--color-text-faint)", opacity: 0.4 }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="text-sm tracking-widest uppercase">
            Sistema de tickets
          </span>
        </div>
      </div>
    </div>
  )
}