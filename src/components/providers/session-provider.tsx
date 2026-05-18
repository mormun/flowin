"use client"

import { SessionProvider } from "next-auth/react"

// Wrapper del SessionProvider de NextAuth.
// Necesario para poder usar useSession() en componentes cliente de Next.js App Router.
export default function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}