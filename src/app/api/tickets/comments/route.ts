import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { ticketId, content, is_system } = await req.json()

    if (!ticketId || !content?.trim()) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    // Comentarios automáticos del sistema: sin restricciones
    if (is_system) {
      const newComment = await prisma.comments.create({
        data: {
          ticket_id: Number(ticketId),
          content,
          is_system: true,
        },
      })

      return NextResponse.json(newComment)
    }

    // ───── Bloqueo de comentarios en estados finales (Cerrado / Cancelado) ─────
    const ticket = await prisma.tickets.findUnique({
      where: { id: Number(ticketId) },
      select: {
        status: { select: { name: true } },
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 })
    }

    if (ticket.status?.name === "Cerrado" || ticket.status?.name === "Cancelado") {
      return NextResponse.json(
        { error: "No se pueden añadir comentarios a un ticket cerrado o cancelado" },
        { status: 403 }
      )
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const newComment = await prisma.comments.create({
      data: {
        ticket_id: Number(ticketId),
        user_id: user.id,
        content,
        is_system: false,
      },
    })

    return NextResponse.json(newComment)
  } catch (error) {
    console.error("ERROR COMMENT POST:", error)
    return NextResponse.json({ error: "Error creando comentario" }, { status: 500 })
  }
}