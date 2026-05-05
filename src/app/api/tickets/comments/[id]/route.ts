import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params                    // ← await params en Next.js 16
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

    // Normaliza users → user para el frontend
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