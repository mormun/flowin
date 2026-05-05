"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated")
    if (!isAuth) {
      router.replace("/login")
    } else {
      setIsChecking(false)
    }
  }, [router])

  if (isChecking) return null

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 md:hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-screen">

        {/* Sidebar */}
        <div
          className={`
            fixed inset-y-0 left-0 z-30 transition-transform duration-300 ease-in-out
            md:relative md:translate-x-0 md:flex md:flex-shrink-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <DashboardSidebar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Contenido principal */}
        <div className="flex flex-1 flex-col min-h-screen min-w-0">
          <DashboardHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 p-6 md:p-8 lg:p-10">
            {children}
          </main>
        </div>

      </div>
    </div>
  )
}