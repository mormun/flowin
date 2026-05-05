import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ticketId = Number(id)

    if (isNaN(ticketId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

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
        assigned_to: true,
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 })
    }

    let assignedUser = null
    if (ticket.assigned_to) {
      assignedUser = await prisma.users.findUnique({
        where: { id: ticket.assigned_to },
        select: { id: true, name: true, surname: true, email: true },
      })
    }

    return NextResponse.json({ ...ticket, assigned_user: assignedUser })

  } catch (error) {
    console.error("ERROR TICKET DETAIL:", error)
    return NextResponse.json({ error: "Error obteniendo ticket" }, { status: 500 })
  }
}