import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function proxy(req) {
    const role = req.nextauth.token?.role as string | undefined
    const { pathname } = req.nextUrl

    // Solo admin
    if (
      pathname.startsWith("/dashboard/users") ||
      pathname.startsWith("/dashboard/categories") ||
      pathname.startsWith("/dashboard/status")
    ) {
      if (role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
    }

    // Solo user
    if (pathname.startsWith("/dashboard/my-tickets")) {
      if (role !== "user") {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
    }

    // Solo tech
    if (pathname.startsWith("/dashboard/bandeja")) {
      if (role !== "tech") {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
    }

    // Listado de tickets (exacto): solo admin y tech
    if (pathname === "/dashboard/tickets") {
      if (role !== "admin" && role !== "tech") {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ["/dashboard/:path*"],
}