import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")
  const role = searchParams.get("role")

  if (!email || !role) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })
  }

  try {

    // ── ROL: user ──────────────────────────────────────────────
    if (role === "user") {
      const user = await prisma.users.findUnique({ where: { email } })
      if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

      const [total, open, inProgress] = await Promise.all([
        // Todos los tickets creados por el usuario
        prisma.tickets.count({
          where: { created_by: user.id },
        }),
        // Tickets abiertos = cualquier estado que no sea "Cerrado"
        prisma.tickets.count({
          where: {
            created_by: user.id,
            status: { name: { not: "Cerrado" } },
          },
        }),
        // Tickets en proceso
        prisma.tickets.count({
          where: {
            created_by: user.id,
            status: { name: "Proceso" },
          },
        }),
      ])

      return NextResponse.json({
        cards: [
          { title: "Tickets creados",    value: total },
          { title: "Tickets abiertos",   value: open },
          { title: "Tickets en proceso", value: inProgress },
        ],
      })
    }

    // ── ROL: tech (placeholder hasta siguiente iteración) ──────
    if (role === "tech") {
      return NextResponse.json({
        cards: [
          { title: "Sin asignar", value: 0 },
          { title: "Mis tickets", value: 0 },
          { title: "Cerrados este mes", value: 0 },
        ],
      })
    }

    // ── ROL: admin (placeholder hasta siguiente iteración) ─────
    if (role === "admin") {
      return NextResponse.json({
        cards: [
          { title: "Usuarios activos",   value: 0 },
          { title: "Categorías activas", value: 0 },
          { title: "Tickets totales",    value: 0 },
        ],
      })
    }

    return NextResponse.json({ error: "Rol no válido" }, { status: 400 })

  } catch (error) {
    console.error("ERROR DASHBOARD STATS:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}