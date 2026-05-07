import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcrypt"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.users.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.active || !user.password_hash) return null

        const ok = await bcrypt.compare(credentials.password, user.password_hash)
        if (!ok) return null

        // Normaliza el rol: si en BBDD hay un valor inesperado o null,
        // lo tratamos como "user" por seguridad
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
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
}