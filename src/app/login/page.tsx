import { Suspense } from "react"
import LoginForm from "./login-form"

// Suspense necesario para que LoginForm pueda usar useSearchParams()
// (requerido por Next.js en rutas con parámetros de búsqueda como ?error=)
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}