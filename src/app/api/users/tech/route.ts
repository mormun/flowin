import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, active: true },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    if (!user.active) {
      return NextResponse.json({ error: "Usuario inactivo" }, { status: 403 })
    }

    const technicians = await prisma.users.findMany({
      where: {
        role: "tech",
        active: true,
      },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(technicians)
  } catch (error) {
    console.error("ERROR TECHNICIANS:", error)

    return NextResponse.json(
      { error: "Error obteniendo técnicos" },
      { status: 500 }
    )
  }
}