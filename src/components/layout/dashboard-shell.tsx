"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"

// Shell principal del dashboard: gestiona el layout de sidebar + header + contenido.
// En móvil el sidebar es un drawer deslizante; en desktop es fijo y siempre visible.
export default function DashboardShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>

      {/* Overlay oscuro: visible en móvil cuando el sidebar está abierto */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 md:hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-screen">

        {/* Sidebar: drawer en móvil, fijo en desktop */}
        <div
          className={`
            fixed inset-y-0 left-0 z-30 transition-transform duration-300 ease-in-out
            md:relative md:translate-x-0 md:flex md:flex-shrink-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <DashboardSidebar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Área principal: header sticky + contenido */}
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