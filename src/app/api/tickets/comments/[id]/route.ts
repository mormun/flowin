import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { id } = await params
    const ticketId = Number(id)

    if (isNaN(ticketId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const comments = await prisma.comments.findMany({
      where: { ticket_id: ticketId },
      orderBy: { created_at: "asc" },
      include: {
        users: {
          select: {
            name: true,
            surname: true,
            role: true,
            email: true,
          },
        },
      },
    })

    const normalized = comments.map(({ users, ...c }) => ({
      ...c,
      user: users ?? undefined,
    }))

    return NextResponse.json(normalized)
  } catch (error) {
    console.error("ERROR COMMENT GET:", error)
    return NextResponse.json({ error: "Error obteniendo comentarios" }, { status: 500 })
  }
}