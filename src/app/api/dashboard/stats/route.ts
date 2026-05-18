import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/auth"

// GET /api/dashboard/stats
// Devuelve las estadísticas del dashboard según el rol del usuario:
//   "user"  → métricas de sus propios tickets
//   "tech"  → métricas de tickets asignados
//   "admin" → métricas globales del sistema
export async function GET() {
  // Verificar sesión activa
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !session?.user?.role) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const email = session.user.email
  const role = session.user.role

  try {
    // ───── Estadísticas para rol "user" ─────
    if (role === "user") {
      const user = await prisma.users.findUnique({ where: { email } })
      if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

      const now = new Date()
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      // Ejecutar todas las consultas en paralelo para mayor rendimiento
      const [abiertos, abiertosMes, solucionados, cerrados, categorias] = await Promise.all([
        prisma.tickets.count({
          where: { created_by: user.id, status: { name: { in: ["Nuevo", "Pendiente", "En Proceso"] } } },
        }),
        prisma.tickets.count({
          where: {
            created_by: user.id,
            status: { name: { in: ["Nuevo", "Pendiente", "En Proceso"] } },
            created_at: { gte: firstOfMonth },
          },
        }),
        prisma.tickets.count({
          where: { created_by: user.id, status: { name: "Solucionado" } },
        }),
        prisma.tickets.count({
          where: { created_by: user.id, status: { name: "Cerrado" } },
        }),
        // Categoría más usada por el usuario
        prisma.tickets.groupBy({
          by: ["category_id"],
          where: { created_by: user.id, category_id: { not: null } },
          _count: { category_id: true },
          orderBy: { _count: { category_id: "desc" } },
          take: 1,
        }),
      ])

      // Resolver el nombre de la categoría más usada
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

    // ───── Estadísticas para rol "tech" ─────
    if (role === "tech") {
      const user = await prisma.users.findUnique({ where: { email } })
      if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

      const now = new Date()
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      // Ejecutar todas las consultas en paralelo
      const [cerradosTotales, cerradosMes, enProceso, categorias] = await Promise.all([
        prisma.tickets.count({
          where: { assigned_to: user.id, status: { name: "Cerrado" } },
        }),
        prisma.tickets.count({
          where: {
            assigned_to: user.id,
            status: { name: "Cerrado" },
            closed_at: { gte: firstOfMonth },
          },
        }),
        prisma.tickets.count({
          where: { assigned_to: user.id, status: { name: "En Proceso" } },
        }),
        // Categoría más frecuente en tickets asignados al técnico
        prisma.tickets.groupBy({
          by: ["category_id"],
          where: { assigned_to: user.id, category_id: { not: null } },
          _count: { category_id: true },
          orderBy: { _count: { category_id: "desc" } },
          take: 1,
        }),
      ])

      // Resolver el nombre de la categoría más usada
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

    // ───── Estadísticas para rol "admin" ─────
    if (role === "admin") {
      // Ejecutar todas las consultas globales en paralelo
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
    console.error("ERROR GET /api/dashboard/stats:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}