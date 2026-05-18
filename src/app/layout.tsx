import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import AuthSessionProvider from "@/components/providers/session-provider"

// Fuentes de Google cargadas como variables CSS
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Flowin",
  description: "Sistema de gestión de incidencias",
}

// Layout raíz: envuelve toda la aplicación con el proveedor de sesión y el sistema de notificaciones
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <head>
        {/* Fuente Satoshi cargada desde Fontshare (usada en globals.css como --font-sans) */}
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthSessionProvider>
          {children}
          {/* Toaster global para notificaciones toast en toda la app */}
          <Toaster position="top-right" richColors expand={false} duration={4000} />
        </AuthSessionProvider>
      </body>
    </html>
  )
}