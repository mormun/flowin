import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"

// GET /api/tickets/comments/[id]
// Devuelve todos los comentarios de un ticket ordenados cronológicamente.
// Incluye datos del autor (nombre, apellido, rol, email).
export async function GET(
  _req: Request,
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

    // Obtener comentarios con datos del autor incluidos
    const comments = await prisma.comments.findMany({
      where: { ticket_id: ticketId },
      orderBy: { created_at: "asc" },
      include: {
        users: {
          select: { name: true, surname: true, role: true, email: true },
        },
      },
    })

    // Renombrar "users" a "user" para uniformizar la respuesta hacia el cliente
    const normalized = comments.map(({ users, ...c }) => ({
      ...c,
      user: users ?? undefined,
    }))

    return NextResponse.json(normalized)
  } catch (error) {
    console.error("ERROR GET /api/tickets/comments/[id]:", error)
    return NextResponse.json({ error: "Error obteniendo comentarios" }, { status: 500 })
  }
}