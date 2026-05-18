import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"

// GET /api/tickets/[id]
// Devuelve el detalle completo de un ticket por su ID,
// incluyendo adjuntos, categoría y usuario asignado.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar sesión activa
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { id } = await params
    const ticketId = Number(id)

    // Validar que el ID sea un número válido
    if (isNaN(ticketId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    // Obtener el ticket con sus relaciones principales
    const ticket = await prisma.tickets.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        title: true,
        description: true,
        priority: true,
        category_id: true,
        status_id: true,
        created_at: true,
        updated_at: true,
        closed_at: true,
        created_by: true,
        assigned_to: true,
        attachments: true,
        categories: {
          select: { id: true, name: true, active: true },
        },
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 })
    }

    // Obtener datos del técnico asignado si existe
    let assignedUser = null
    if (ticket.assigned_to) {
      assignedUser = await prisma.users.findUnique({
        where: { id: ticket.assigned_to },
        select: { id: true, name: true, surname: true, email: true },
      })
    }

    return NextResponse.json({ ...ticket, assigned_user: assignedUser })
  } catch (error) {
    console.error("ERROR GET /api/tickets/[id]:", error)
    return NextResponse.json({ error: "Error obteniendo ticket" }, { status: 500 })
  }
}