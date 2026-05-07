import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const statuses = await prisma.status.findMany({
      orderBy: { id: "asc" },
    })

    return NextResponse.json(statuses)
  } catch (error) {
    console.error("ERROR STATUS GET:", error)
    return NextResponse.json({ error: "Error al obtener estados" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.role) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id, name, description } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "ID obligatorio" }, { status: 400 })
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 })
    }

    const status = await prisma.status.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
      },
    })

    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error("ERROR STATUS PATCH:", error)
    return NextResponse.json({ error: "Error al actualizar estado" }, { status: 500 })
  }
}