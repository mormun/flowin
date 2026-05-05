import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET — categorías con filtro opcional por estado
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const onlyActive = searchParams.get("active") === "true"

    const categories = await prisma.categories.findMany({
      where: onlyActive ? { active: true } : undefined,
      orderBy: { id: "asc" },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error("ERROR CATEGORIES GET:", error)
    return NextResponse.json({ error: "Error al obtener categorías" }, { status: 500 })
  }
}

// POST — crear categoría
export async function POST(req: Request) {
  try {
    const { name, description } = await req.json()

    if (!name) {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 })
    }

    const category = await prisma.categories.create({
      data: { name, description },
    })

    return NextResponse.json({ success: true, category })
  } catch (error) {
    console.error("ERROR CATEGORIES POST:", error)
    return NextResponse.json({ error: "Error al crear categoría" }, { status: 500 })
  }
}

// PATCH — editar nombre/descripción o activar/desactivar
export async function PATCH(req: Request) {
  try {
    const { id, name, description, active } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "ID obligatorio" }, { status: 400 })
    }

    const category = await prisma.categories.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(active !== undefined && { active }),
      },
    })

    return NextResponse.json({ success: true, category })
  } catch (error) {
    console.error("ERROR CATEGORIES PATCH:", error)
    return NextResponse.json({ error: "Error al actualizar categoría" }, { status: 500 })
  }
}

// DELETE — eliminar categoría (solo si no tiene tickets asociados)
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "ID obligatorio" }, { status: 400 })
    }

    // Comprobar si tiene tickets asociados
    const ticketCount = await prisma.tickets.count({
      where: { category_id: id },
    })

    if (ticketCount > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar: tiene ${ticketCount} ticket(s) asociado(s)` },
        { status: 409 }
      )
    }

    await prisma.categories.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("ERROR CATEGORIES DELETE:", error)
    return NextResponse.json({ error: "Error al eliminar categoría" }, { status: 500 })
  }
}