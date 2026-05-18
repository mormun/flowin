import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

// Middleware de autorización para todas las rutas bajo /dashboard.
// Protege rutas según el rol del usuario, redirigiendo al dashboard
// si intenta acceder a una sección no permitida para su rol.
export default withAuth(
  function proxy(req) {
    const role = req.nextauth.token?.role as string | undefined
    const { pathname } = req.nextUrl

    // Rutas exclusivas de admin: usuarios, categorías y estados
    if (
      pathname.startsWith("/dashboard/users") ||
      pathname.startsWith("/dashboard/categories") ||
      pathname.startsWith("/dashboard/status")
    ) {
      if (role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
    }

    // Ruta exclusiva de user: mis tickets
    if (pathname.startsWith("/dashboard/my-tickets")) {
      if (role !== "user") {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
    }

    // Ruta exclusiva de tech: bandeja de tickets
    if (pathname.startsWith("/dashboard/bandeja")) {
      if (role !== "tech") {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
    }

    // Listado completo de tickets: solo admin y tech (coincidencia exacta de ruta)
    if (pathname === "/dashboard/tickets") {
      if (role !== "admin" && role !== "tech") {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
    }

    return NextResponse.next()
  },
  {
    // Cualquier usuario sin token válido es redirigido al login por NextAuth
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

// Aplicar el middleware a todas las rutas del dashboard
export const config = {
  matcher: ["/dashboard/:path*"],
}