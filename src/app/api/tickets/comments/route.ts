import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { ticketId, userEmail, content, is_system } = await req.json()

    if (!ticketId || !content?.trim()) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    // Comentario de sistema — no necesita usuario
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

    // Comentario normal — requiere usuario
    if (!userEmail) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    const user = await prisma.users.findUnique({
      where: { email: userEmail },
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