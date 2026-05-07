import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
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

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials") {
        return true
      }

      if (account?.provider === "google") {
        if (!user.email) return false

        const dbUser = await prisma.users.findUnique({
          where: { email: user.email },
        })

        if (!dbUser) {
          return "/login?error=NotAuthorized"
        }

        if (!dbUser.active) {
          return "/login?error=AccountDisabled"
        }

        return true
      }

      return false
    },

    async jwt({ token, user, account }) {
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