import NextAuth from "next-auth"
import { authOptions } from "@/auth"

// Handler estándar de NextAuth para Next.js App Router.
// Gestiona todas las rutas de autenticación bajo /api/auth/*
// (login, logout, sesión, callbacks OAuth, etc.)
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }