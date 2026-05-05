import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// 🔹 GET — tickets con soporte para bandeja, listado activo y listado completo
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const all    = searchParams.get("all")    === "true"
    const bandeja = searchParams.get("bandeja") === "true"
    const email  = searchParams.get("email")

    // ── Modo bandeja: tickets sin asignar (Nuevo) + asignados al técnico ──
    if (bandeja) {
      if (!email) {
        return NextResponse.json({ error: "Email requerido" }, { status: 400 })
      }

      const user = await prisma.users.findUnique({ where: { email } })
      if (!user) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
      }

      const tickets = await prisma.tickets.findMany({
        where: {
          OR: [
            // Tickets nuevos sin asignar
            {
              assigned_to: null,
              status: { name: "Nuevo" },
            },
            // Tickets asignados a este técnico (excluye cerrados y cancelados)
            {
              assigned_to: user.id,
              status: { name: { notIn: ["Cerrado", "Cancelado"] } },
            },
          ],
        },
        include: {
          categories: { select: { name: true } },
          status:     { select: { name: true } },
          users_tickets_created_byTousers:  { select: { name: true, surname: true } },
          users_tickets_assigned_toTousers: { select: { id: true, name: true, surname: true } },
        },
        orderBy: { created_at: "desc" },
      })

      return NextResponse.json(tickets)
    }

    // ── Modo normal: todos o solo activos ──
    const tickets = await prisma.tickets.findMany({
      where: all ? undefined : {
        status: {
          name: { notIn: ["Cerrado", "Cancelado"] },
        },
      },
      include: {
        categories: { select: { name: true } },
        status:     { select: { name: true } },
        users_tickets_created_byTousers:  { select: { name: true, surname: true } },
        users_tickets_assigned_toTousers: { select: { id: true, name: true, surname: true } },
      },
      orderBy: { created_at: "desc" },
    })

    return NextResponse.json(tickets)

  } catch (error) {
    console.error("ERROR GET TICKETS:", error)
    return NextResponse.json({ error: "Error obteniendo tickets" }, { status: 500 })
  }
}

// 🔹 POST — crear ticket (sin cambios)
export async function POST(req: Request) {
  try {
    const { title, description, category, priority, userEmail } = await req.json()

    const user = await prisma.users.findUnique({
      where: { email: userEmail },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 })
    }

    const ticket = await prisma.tickets.create({
      data: {
        title,
        description,
        category_id: category,
        priority,
        status_id: 1,
        created_by: user.id,
      },
    })

    return NextResponse.json({ success: true, ticket })

  } catch (error) {
    console.error("ERROR CREATE TICKET:", error)
    return NextResponse.json({ error: "Error al crear ticket" }, { status: 500 })
  }
}