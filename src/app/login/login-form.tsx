"use client"

import { useEffect, useState } from "react"
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
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    const error = searchParams.get("error")
    if (!error) return

    if (error === "NotAuthorized") {
      toast.error("Cuenta no autorizada", {
        description: "Tu email no está dado de alta en el sistema. Contacta con el administrador.",
      })
    } else if (error === "AccountDisabled") {
      toast.error("Cuenta desactivada", {
        description: "Tu cuenta está deshabilitada. Contacta con el administrador.",
      })
    } else if (error === "OAuthAccountNotLinked" || error === "OAuthSignin" || error === "OAuthCallback") {
      toast.error("Error con Google", {
        description: "No se ha podido completar el inicio de sesión con Google.",
      })
    }

    router.replace("/login")
  }, [searchParams, router])

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
      const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
      const result = await signIn("credentials", {
        email: user,
        password,
        redirect: false,
        callbackUrl,
      })

      if (result?.error) {
        toast.error("Error al iniciar sesión", { description: "Email o contraseña incorrectos" })
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

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true)
      const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
      await signIn("google", { callbackUrl })
    } catch {
      toast.error("Error de conexión con Google")
      setGoogleLoading(false)
    }
  }

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <div
        className="flex w-full flex-col items-center justify-center p-10 md:w-[440px]"
        style={{
          backgroundColor: "var(--color-surface)",
          borderRight: "1px solid var(--color-border)",
        }}
      >
        <div className="w-full max-w-sm">
          <div className="mb-16 flex justify-center">
            <Image
              src="/logo_render.png"
              alt="Flow-in"
              width={150}
              height={94}
              priority
              className="h-auto w-auto"
            />
          </div>

          <div className="mb-16">
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--color-text)" }}
            >
              Iniciar sesión
            </h1>
            <p className="mt-3 text-sm" style={{ color: "var(--color-text-muted)" }}>
              Accede con tu cuenta corporativa
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                Email
              </label>
              <input
                type="email"
                placeholder="usuario@empresa.com"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                autoComplete="email"
                className="w-full rounded-md px-3.5 py-3 text-[0.9375rem] outline-none transition"
                style={{
                  border: user
                    ? "1px solid var(--color-primary)"
                    : "1px solid var(--color-border)",
                  backgroundColor: "var(--color-bg)",
                  color: "var(--color-text)",
                }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                Contraseña
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-md px-3.5 py-3 text-[0.9375rem] outline-none transition"
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
              disabled={loading || googleLoading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-[0.9375rem] font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: "var(--color-primary)" }}
              onMouseEnter={(e) => {
                if (!loading && !googleLoading)
                  (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-primary-hover)"
              }}
              onMouseLeave={(e) => {
                if (!loading && !googleLoading)
                  (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-primary)"
              }}
            >
              {loading ? "Accediendo..." : "Acceder"}
            </button>
          </form>

          <div
            className="my-8 flex items-center gap-3"
            style={{ color: "var(--color-text-faint)" }}
          >
            <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border)" }} />
            <span className="text-xs uppercase tracking-wider">o</span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border)" }} />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="flex w-full items-center justify-center gap-3 rounded-full px-6 py-3 text-[0.9375rem] font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text)",
            }}
            onMouseEnter={(e) => {
              if (!loading && !googleLoading)
                (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-surface-offset)"
            }}
            onMouseLeave={(e) => {
              if (!loading && !googleLoading)
                (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-surface)"
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
              />
            </svg>
            {googleLoading ? "Conectando..." : "Continuar con Google"}
          </button>
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
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="text-sm font-bold tracking-widest uppercase">Sistema de tickets</span>
        </div>
      </div>
    </div>
  )
}