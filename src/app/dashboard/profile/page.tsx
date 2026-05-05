"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { User, Lock } from "lucide-react"

const baseInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.625rem 0.875rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  backgroundColor: "var(--color-surface)",
  color: "var(--color-text)",
  fontSize: "0.9375rem",
  outline: "none",
  transition: "border-color 150ms",
}

const dynInput = (filled: boolean): React.CSSProperties => ({
  ...baseInputStyle,
  borderColor: filled ? "var(--color-primary)" : "var(--color-border)",
})

const disabledInputStyle: React.CSSProperties = {
  ...baseInputStyle,
  backgroundColor: "var(--color-surface-offset)",
  color: "var(--color-text-muted)",
  cursor: "not-allowed",
  borderColor: "var(--color-border)",
}

export default function ProfilePage() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [surname, setSurname] = useState("")
  const [email, setEmail] = useState("")
  const [registrationDate, setRegistrationDate] = useState("")
  const [loadingSave, setLoadingSave] = useState(false)

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loadingPassword, setLoadingPassword] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const storedEmail = localStorage.getItem("userEmail")
        if (!storedEmail) return

        const res = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: storedEmail }),
        })

        const data = await res.json()
        if (!res.ok) { console.error(data.error); return }

        setName(data.name || "")
        setSurname(data.surname || "")
        setEmail(data.email || "")
        setRegistrationDate(data.registration_date || "")
      } catch (error) {
        console.error("Error cargando perfil:", error)
      }
    }

    fetchProfile()
  }, [])

  const handleSave = async () => {
    if (!name.trim()) { toast.warning("El nombre no puede estar vacío"); return }

    try {
      setLoadingSave(true)
      const storedEmail = localStorage.getItem("userEmail")

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: storedEmail, name, surname }),
      })

      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Error al guardar"); return }

      toast.success("Datos guardados correctamente")
    } catch (error) {
      console.error("Error guardando perfil:", error)
      toast.error("Error al guardar los datos")
    } finally {
      setLoadingSave(false)
    }
  }

  const handlePasswordUpdate = async () => {
    if (!newPassword) { toast.warning("Introduce una nueva contraseña"); return }
    if (newPassword.length < 8) { toast.warning("La contraseña debe tener al menos 8 caracteres"); return }
    if (newPassword !== confirmPassword) { toast.error("Las contraseñas no coinciden"); return }

    try {
      setLoadingPassword(true)
      const storedEmail = localStorage.getItem("userEmail")

      const res = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: storedEmail, password: newPassword }),
      })

      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Error al actualizar la contraseña"); return }

      toast.success("Contraseña actualizada correctamente")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      console.error("Error actualizando contraseña:", error)
      toast.error("Error al actualizar la contraseña")
    } finally {
      setLoadingPassword(false)
    }
  }

  return (
    <div style={{ width: "100%", padding: "2.5rem 4rem 3rem 3.5rem" }}>

      {/* Cabecera */}
      <div style={{ marginBottom: "2rem" }}>
        <h2 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
          Mi perfil
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
          Gestiona tu información personal y credenciales de acceso
        </p>
      </div>

      <div className="flex flex-col gap-6">

        {/* ── Sección: Datos personales ──────────────────────── */}
        <div
          className="rounded-xl"
          style={{
            padding: "2.5rem 3rem",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {/* Título sección */}
          <div className="flex items-center gap-2" style={{ marginBottom: "1.5rem" }}>
            <User size={16} style={{ color: "var(--color-text-muted)" }} />
            <h3 className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
              Datos personales
            </h3>
          </div>

          <div className="flex flex-col gap-5">

            {/* Nombre + Apellidos */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                  Nombre
                </label>
                <input
                  style={dynInput(name.length > 0)}
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = name ? "var(--color-primary)" : "var(--color-border)")}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                  Apellidos
                </label>
                <input
                  style={dynInput(surname.length > 0)}
                  placeholder="Tus apellidos"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = surname ? "var(--color-primary)" : "var(--color-border)")}
                />
              </div>
            </div>

            {/* Email (sólo lectura) */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                Email
              </label>
              <input
                style={disabledInputStyle}
                value={email}
                disabled
                readOnly
              />
            </div>

            {/* Fecha de registro */}
            {registrationDate && (
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Cuenta registrada el{" "}
                <span style={{ color: "var(--color-text)" }}>
                  {new Date(registrationDate).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </p>
            )}

            {/* Separador */}
            <div style={{ height: "1px", backgroundColor: "var(--color-divider)" }} />

            {/* Botón guardar */}
            <div className="flex items-center justify-end">
              <button
                onClick={handleSave}
                disabled={loadingSave}
                className="flex items-center gap-2 rounded-full font-medium transition disabled:opacity-50 whitespace-nowrap"
                style={{
                  backgroundColor: "var(--color-primary)",
                  color: "#fff",
                  fontSize: "0.9375rem",
                  padding: "0.55rem 1.5rem",
                  border: "none",
                  cursor: loadingSave ? "not-allowed" : "pointer",
                }}
                onMouseEnter={(e) =>
                  !loadingSave && ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-primary-hover)")
                }
                onMouseLeave={(e) =>
                  !loadingSave && ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-primary)")
                }
              >
                {loadingSave ? (
                  <>
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Guardando...
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </button>
            </div>

          </div>
        </div>

        {/* ── Sección: Cambiar contraseña ─────────────────────── */}
        <div
          className="rounded-xl"
          style={{
            padding: "2.5rem 3rem",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {/* Título sección */}
          <div className="flex items-center gap-2" style={{ marginBottom: "1.5rem" }}>
            <Lock size={16} style={{ color: "var(--color-text-muted)" }} />
            <h3 className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
              Cambiar contraseña
            </h3>
          </div>

          <div className="flex flex-col gap-5">

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  style={dynInput(newPassword.length > 0)}
                  placeholder="Mínimo 8 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = newPassword ? "var(--color-primary)" : "var(--color-border)")}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  style={{
                    ...dynInput(confirmPassword.length > 0),
                    ...(confirmPassword && newPassword !== confirmPassword
                      ? { borderColor: "var(--color-error)" }
                      : {}),
                  }}
                  placeholder="Repite la contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
                  onBlur={(e) => {
                    if (confirmPassword && newPassword !== confirmPassword) {
                      e.currentTarget.style.borderColor = "var(--color-error)"
                    } else {
                      e.currentTarget.style.borderColor = confirmPassword ? "var(--color-primary)" : "var(--color-border)"
                    }
                  }}
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs" style={{ color: "var(--color-error)" }}>
                    Las contraseñas no coinciden
                  </p>
                )}
              </div>
            </div>

            {/* Separador */}
            <div style={{ height: "1px", backgroundColor: "var(--color-divider)" }} />

            {/* Botón actualizar */}
            <div className="flex items-center justify-end">
              <button
                onClick={handlePasswordUpdate}
                disabled={loadingPassword}
                className="flex items-center gap-2 rounded-full font-medium transition disabled:opacity-50 whitespace-nowrap"
                style={{
                  backgroundColor: "var(--color-primary)",
                  color: "#fff",
                  fontSize: "0.9375rem",
                  padding: "0.55rem 1.5rem",
                  border: "none",
                  cursor: loadingPassword ? "not-allowed" : "pointer",
                }}
                onMouseEnter={(e) =>
                  !loadingPassword && ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-primary-hover)")
                }
                onMouseLeave={(e) =>
                  !loadingPassword && ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-primary)")
                }
              >
                {loadingPassword ? (
                  <>
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Actualizando...
                  </>
                ) : (
                  "Actualizar contraseña"
                )}
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}