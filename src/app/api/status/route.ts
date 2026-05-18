import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"

// GET /api/status
// Devuelve todos los estados disponibles ordenados por ID.
// Accesible por cualquier usuario autenticado.
export async function GET() {
  try {
    // Verificar sesión activa
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const statuses = await prisma.status.findMany({
      orderBy: { id: "asc" },
    })

    return NextResponse.json(statuses)
  } catch (error) {
    console.error("ERROR GET /api/status:", error)
    return NextResponse.json({ error: "Error al obtener estados" }, { status: 500 })
  }
}

// PATCH /api/status
// Actualiza el nombre y descripción de un estado. Solo admin.
// No permite crear ni eliminar estados para preservar la integridad del flujo.
export async function PATCH(req: Request) {
  try {
    // Verificar sesión y rol admin
    const session = await getServerSession(authOptions)
    if (!session?.user?.role) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id, name, description } = await req.json()

    // Validar campos obligatorios
    if (!id) {
      return NextResponse.json({ error: "ID obligatorio" }, { status: 400 })
    }
    if (!name?.trim()) {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 })
    }

    // Actualizar solo los campos presentes en el body
    const status = await prisma.status.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
      },
    })

    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error("ERROR PATCH /api/status:", error)
    return NextResponse.json({ error: "Error al actualizar estado" }, { status: 500 })
  }
}