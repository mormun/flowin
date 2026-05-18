import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notifyTechsOnNewTicket } from "@/lib/notifications"

// GET /api/tickets
// Devuelve tickets según el modo indicado por query params:
//   ?bandeja=true  → tickets de la bandeja del técnico (sin asignar + asignados a él, no cerrados)
//   ?all=true      → todos los tickets (admin)
//   (sin params)   → tickets activos (excluye Cerrado y Cancelado)
export async function GET(req: Request) {
  try {
    // Verificar sesión activa
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const all = searchParams.get("all") === "true"
    const bandeja = searchParams.get("bandeja") === "true"

    // Obtener usuario actual para filtros por identidad/rol
    const currentUser = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, role: true },
    })
    if (!currentUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Modo bandeja: tickets sin asignar (estado Nuevo) + tickets asignados al técnico actual (no cerrados)
    if (bandeja) {
      const tickets = await prisma.tickets.findMany({
        where: {
          OR: [
            { assigned_to: null, status: { name: "Nuevo" } },
            {
              assigned_to: currentUser.id,
              status: { name: { notIn: ["Cerrado", "Cancelado"] } },
            },
          ],
        },
        include: {
          categories: { select: { name: true } },
          status: { select: { name: true } },
          users_tickets_created_byTousers: { select: { name: true, surname: true } },
          users_tickets_assigned_toTousers: { select: { id: true, name: true, surname: true } },
        },
        orderBy: { created_at: "desc" },
      })
      return NextResponse.json(tickets)
    }

    // Modo normal: todos los tickets o solo los activos según el parámetro ?all
    const tickets = await prisma.tickets.findMany({
      where: all
        ? undefined
        : { status: { name: { notIn: ["Cerrado", "Cancelado"] } } },
      include: {
        categories: { select: { name: true } },
        status: { select: { name: true } },
        users_tickets_created_byTousers: { select: { name: true, surname: true } },
        users_tickets_assigned_toTousers: { select: { id: true, name: true, surname: true } },
      },
      orderBy: { created_at: "desc" },
    })

    return NextResponse.json(tickets)
  } catch (error) {
    console.error("ERROR GET /api/tickets:", error)
    return NextResponse.json({ error: "Error obteniendo tickets" }, { status: 500 })
  }
}

// POST /api/tickets
// Crea un nuevo ticket. El estado inicial es siempre "Nuevo" (status_id: 1).
// Notifica a todos los técnicos activos tras la creación.
export async function POST(req: Request) {
  try {
    // Verificar sesión activa
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { title, description, category, priority } = await req.json()

    // Validar campos obligatorios
    if (!title?.trim() || !description?.trim() || !category || !priority) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
    }

    // Obtener el ID del usuario creador
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Crear el ticket con estado inicial "Nuevo" (id=1)
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

    // Notificar a los técnicos sobre el nuevo ticket
    await notifyTechsOnNewTicket({ ticketId: ticket.id, actorId: user.id })

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error("ERROR POST /api/tickets:", error)
    return NextResponse.json({ error: "Error al crear ticket" }, { status: 500 })
  }
}