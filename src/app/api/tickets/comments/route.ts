import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"

// POST /api/tickets/comments
// Crea un comentario en un ticket.
// Los comentarios de sistema (is_system: true) se insertan sin restricciones.
// Los comentarios de usuario no están permitidos en tickets cerrados o cancelados.
export async function POST(req: Request) {
  try {
    // Verificar sesión activa
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { ticketId, content, is_system } = await req.json()

    // Validar campos obligatorios
    if (!ticketId || !content?.trim()) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    // Comentarios de sistema: se insertan directamente sin validaciones adicionales
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

    // Verificar que el ticket existe y obtener su estado
    const ticket = await prisma.tickets.findUnique({
      where: { id: Number(ticketId) },
      select: { status: { select: { name: true } } },
    })
    if (!ticket) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 })
    }

    // Bloquear comentarios en tickets con estado final
    if (ticket.status?.name === "Cerrado" || ticket.status?.name === "Cancelado") {
      return NextResponse.json(
        { error: "No se pueden añadir comentarios a un ticket cerrado o cancelado" },
        { status: 403 }
      )
    }

    // Obtener el ID del usuario que comenta
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Crear el comentario de usuario
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
    console.error("ERROR POST /api/tickets/comments:", error)
    return NextResponse.json({ error: "Error creando comentario" }, { status: 500 })
  }
}