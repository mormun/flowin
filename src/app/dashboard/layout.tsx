import type { ReactNode } from "react"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/auth"
import DashboardShell from "@/components/layout/dashboard-shell"

// Layout del dashboard: protege todas las rutas bajo /dashboard.
// Si no hay sesión activa, redirige al login antes de renderizar nada.
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return <DashboardShell>{children}</DashboardShell>
}