import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    const user = await prisma.users.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const tickets = await prisma.tickets.findMany({
      where: { created_by: user.id },
      orderBy: { created_at: "desc" },
      include: {
        categories: { select: { name: true } },
      },
    })

    return NextResponse.json(tickets)

  } catch (error) {
    console.error("ERROR MY TICKETS:", error)
    return NextResponse.json({ error: "Error obteniendo tickets" }, { status: 500 })
  }
}