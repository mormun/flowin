import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  // Sesión basada en JWT (sin base de datos de sesiones)
  session: {
    strategy: "jwt",
  },

  // Páginas personalizadas de autenticación
  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    // — Proveedor de credenciales (email + contraseña) —
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        // Validación básica de campos
        if (!credentials?.email || !credentials?.password) return null

        // Buscar usuario en BD y verificar que esté activo
        const user = await prisma.users.findUnique({
          where: { email: credentials.email },
        })
        if (!user || !user.active || !user.password_hash) return null

        // Verificar contraseña con bcrypt
        const ok = await bcrypt.compare(credentials.password, user.password_hash)
        if (!ok) return null

        // Normalizar rol: solo "admin" y "tech" se mantienen, el resto es "user"
        const role: "user" | "tech" | "admin" =
          user.role === "admin" || user.role === "tech" ? user.role : "user"

        return {
          id: String(user.id),
          email: user.email,
          name: `${user.name ?? ""} ${user.surname ?? ""}`.trim(),
          role,
        }
      },
    }),

    // — Proveedor OAuth de Google —
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    // Callback ejecutado al iniciar sesión
    async signIn({ user, account }) {
      // Credenciales: ya validadas en authorize()
      if (account?.provider === "credentials") return true

      // Google: verificar que el usuario exista en BD y esté activo
      if (account?.provider === "google") {
        if (!user.email) return false

        const dbUser = await prisma.users.findUnique({
          where: { email: user.email },
        })

        if (!dbUser) return "/login?error=NotAuthorized"
        if (!dbUser.active) return "/login?error=AccountDisabled"

        return true
      }

      return false
    },

    // Callback para construir el JWT — se ejecuta al crear o refrescar el token
    async jwt({ token, user, account }) {
      // Login con Google: enriquecer el token con datos de BD (id y rol)
      if (account?.provider === "google" && user?.email) {
        const dbUser = await prisma.users.findUnique({
          where: { email: user.email },
        })
        if (dbUser) {
          const role: "user" | "tech" | "admin" =
            dbUser.role === "admin" || dbUser.role === "tech" ? dbUser.role : "user"
          token.id = String(dbUser.id)
          token.role = role
        }
        return token
      }

      // Login con credenciales: copiar id y rol al token
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },

    // Callback para exponer datos del token en la sesión del cliente
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
}