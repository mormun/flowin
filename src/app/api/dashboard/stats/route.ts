import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")
  const role  = searchParams.get("role")

  if (!email || !role)
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })

  try {

    // ── USER ──────────────────────────────────────────────────
    if (role === "user") {
      const user = await prisma.users.findUnique({ where: { email } })
      if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

      const [abiertos, enProceso, solucionados, cerrados] = await Promise.all([
        prisma.tickets.count({
          where: { created_by: user.id, status: { name: { in: ["Nuevo", "Pendiente"] } } },
        }),
        prisma.tickets.count({
          where: { created_by: user.id, status: { name: "Proceso" } },
        }),
        prisma.tickets.count({
          where: { created_by: user.id, status: { name: "Solucionado" } },
        }),
        prisma.tickets.count({
          where: { created_by: user.id, status: { name: "Cerrado" } },
        }),
      ])

      return NextResponse.json({
        cards: [
          { title: "Tickets abiertos",     value: abiertos },
          { title: "Tickets en proceso",   value: enProceso },
          { title: "Tickets solucionados", value: solucionados },
          { title: "Tickets cerrados",     value: cerrados },
        ],
      })
    }

    // ── TECH ──────────────────────────────────────────────────
    if (role === "tech") {
      const user = await prisma.users.findUnique({ where: { email } })
      if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

      const now = new Date()
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      const [sinAsignar, misTickets, cerradosMes] = await Promise.all([
        prisma.tickets.count({
          where: { assigned_to: null, status: { name: { notIn: ["Cerrado", "Cancelado"] } } },
        }),
        prisma.tickets.count({
          where: { assigned_to: user.id, status: { name: { notIn: ["Cerrado", "Cancelado"] } } },
        }),
        prisma.tickets.count({
          where: { assigned_to: user.id, status: { name: "Cerrado" }, closed_at: { gte: firstOfMonth } },
        }),
      ])

      return NextResponse.json({
        cards: [
          { title: "Sin asignar",       value: sinAsignar },
          { title: "Mis tickets",       value: misTickets },
          { title: "Cerrados este mes", value: cerradosMes },
        ],
      })
    }

    // ── ADMIN ─────────────────────────────────────────────────
    if (role === "admin") {
      const [usuariosActivos, categoriasActivas, ticketsTotales] = await Promise.all([
        prisma.users.count({ where: { active: true } }),
        prisma.categories.count({ where: { active: true } }),
        prisma.tickets.count(),
      ])

      return NextResponse.json({
        cards: [
          { title: "Usuarios activos",   value: usuariosActivos },
          { title: "Categorías activas", value: categoriasActivas },
          { title: "Tickets totales",    value: ticketsTotales },
        ],
      })
    }

    return NextResponse.json({ error: "Rol no válido" }, { status: 400 })

  } catch (error) {
    console.error("ERROR DASHBOARD STATS:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}