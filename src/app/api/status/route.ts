import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET — todos los estados
export async function GET() {
  try {
    const statuses = await prisma.status.findMany({
      orderBy: { id: "asc" },
    })
    return NextResponse.json(statuses)
  } catch (error) {
    console.error("ERROR STATUS GET:", error)
    return NextResponse.json({ error: "Error al obtener estados" }, { status: 500 })
  }
}

// PATCH — editar nombre y descripción (no se crean ni eliminan estados)
export async function PATCH(req: Request) {
  try {
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