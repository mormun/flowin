import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

async function requireAdmin() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.role) {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) }
  }

  if (session.user.role !== "admin") {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 403 }) }
  }

  return { session }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.role) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const onlyActive = searchParams.get("active") === "true"

    // Listar TODAS las categorías (panel de gestión) → solo admin
    // Listar solo las activas (formularios) → cualquier autenticado
    if (!onlyActive && session.user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

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

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin()
    if ("error" in auth) return auth.error

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

export async function PATCH(req: Request) {
  try {
    const auth = await requireAdmin()
    if ("error" in auth) return auth.error

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

export async function DELETE(req: Request) {
  try {
    const auth = await requireAdmin()
    if ("error" in auth) return auth.error

    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "ID obligatorio" }, { status: 400 })
    }

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