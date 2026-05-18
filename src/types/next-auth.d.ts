import { DefaultSession } from "next-auth"

// Extensión de tipos de NextAuth para incluir id y rol en Session, User y JWT.
// Sin esta declaración, TypeScript no reconocería session.user.id ni session.user.role.

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "user" | "tech" | "admin"
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: "user" | "tech" | "admin"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: "user" | "tech" | "admin"
  }
}