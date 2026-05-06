import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")
  const role = searchParams.get("role")

  if (!email || !role)
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })

  try {

    // ── USER ──────────────────────────────────────────────────
    if (role === "user") {
      const user = await prisma.users.findUnique({ where: { email } })
      if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

      const now = new Date()
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      const [abiertos, abiertosMes, solucionados, cerrados, categorias] = await Promise.all([
        // Tickets abiertos en total
        prisma.tickets.count({
          where: { created_by: user.id, status: { name: { in: ["Nuevo", "Pendiente", "Proceso"] } } },
        }),
        // Tickets abiertos en el último mes
        prisma.tickets.count({
          where: {
            created_by: user.id,
            status: { name: { in: ["Nuevo", "Pendiente", "Proceso"] } },
            created_at: { gte: firstOfMonth },
          },
        }),
        // Tickets solucionados
        prisma.tickets.count({
          where: { created_by: user.id, status: { name: "Solucionado" } },
        }),
        // Tickets cerrados
        prisma.tickets.count({
          where: { created_by: user.id, status: { name: "Cerrado" } },
        }),
        // Categoría más utilizada
        prisma.tickets.groupBy({
          by: ["category_id"],
          where: { created_by: user.id, category_id: { not: null } },
          _count: { category_id: true },
          orderBy: { _count: { category_id: "desc" } },
          take: 1,
        }),
      ])

      // Resolver nombre de la categoría más usada
      let topCategoria = "—"
      if (categorias.length > 0 && categorias[0].category_id) {
        const cat = await prisma.categories.findUnique({
          where: { id: categorias[0].category_id },
          select: { name: true },
        })
        if (cat) topCategoria = cat.name
      }

      return NextResponse.json({
        cards: [
          { title: "Tickets abiertos", value: abiertos, type: "number" },
          { title: "Abiertos este mes", value: abiertosMes, type: "number" },
          { title: "Tickets solucionados", value: solucionados, type: "number" },
          { title: "Tickets cerrados", value: cerrados, type: "number" },
          { title: "Categoría más utilizada", value: topCategoria, type: "text" },
        ],
      })
    }

    // ── TECH ──────────────────────────────────────────────────
    if (role === "tech") {
      const user = await prisma.users.findUnique({ where: { email } })
      if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

      const now = new Date()
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      const [cerradosTotales, cerradosMes, enProceso, categorias] = await Promise.all([
        // Tickets cerrados en total asignados al técnico
        prisma.tickets.count({
          where: { assigned_to: user.id, status: { name: "Cerrado" } },
        }),
        // Tickets cerrados en el último mes asignados al técnico
        prisma.tickets.count({
          where: {
            assigned_to: user.id,
            status: { name: "Cerrado" },
            closed_at: { gte: firstOfMonth },
          },
        }),
        // Tickets en proceso asignados al técnico
        prisma.tickets.count({
          where: { assigned_to: user.id, status: { name: "Proceso" } },
        }),
        // Categoría más asignada al técnico
        prisma.tickets.groupBy({
          by: ["category_id"],
          where: { assigned_to: user.id, category_id: { not: null } },
          _count: { category_id: true },
          orderBy: { _count: { category_id: "desc" } },
          take: 1,
        }),
      ])

      // Resolver nombre de la categoría más asignada
      let topCategoria = "—"
      if (categorias.length > 0 && categorias[0].category_id) {
        const cat = await prisma.categories.findUnique({
          where: { id: categorias[0].category_id },
          select: { name: true },
        })
        if (cat) topCategoria = cat.name
      }

      return NextResponse.json({
        cards: [
          { title: "Tickets cerrados", value: cerradosTotales, type: "number" },
          { title: "Cerrados este mes", value: cerradosMes, type: "number" },
          { title: "Tickets en proceso", value: enProceso, type: "number" },
          { title: "Categoría más utilizada", value: topCategoria, type: "text" },
        ],
      })
    }

    // ── ADMIN ─────────────────────────────────────────────────
    if (role === "admin") {
      const [
        totalUsers,
        activeUsers,
        inactiveUsers,
        totalTickets,
        openTickets,
        closedTickets,
        totalCategories,
      ] = await Promise.all([
        prisma.users.count(),
        prisma.users.count({ where: { active: true } }),
        prisma.users.count({ where: { active: false } }),
        prisma.tickets.count(),
        prisma.tickets.count({
          where: { status: { name: { notIn: ["Cerrado", "Cancelado"] } } },
        }),
        prisma.tickets.count({
          where: { status: { name: "Cerrado" } },
        }),
        prisma.categories.count(),
      ])

      return NextResponse.json({
        cards: [
          { title: "Total usuarios", value: totalUsers },
          { title: "Usuarios activos", value: activeUsers },
          { title: "Usuarios inactivos", value: inactiveUsers },
          { title: "Tickets totales", value: totalTickets },
          { title: "Tickets abiertos", value: openTickets },
          { title: "Tickets cerrados", value: closedTickets },
          { title: "Categorías existentes", value: totalCategories },
        ],
      })
    }

    return NextResponse.json({ error: "Rol no válido" }, { status: 400 })

  } catch (error) {
    console.error("ERROR DASHBOARD STATS:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}