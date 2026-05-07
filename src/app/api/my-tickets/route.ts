import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })

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