import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"

// Forzar runtime Node.js (necesario para bcrypt y otras dependencias nativas)
export const runtime = "nodejs"

// Helper: verifica que el usuario esté autenticado y sea admin.
// Devuelve { error } si no cumple, o { session } si pasa la validación.
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

// GET /api/categories
// ?active=true  → devuelve solo categorías activas (cualquier usuario autenticado, para formularios)
// (sin param)   → devuelve todas las categorías (solo admin, para panel de gestión)
export async function GET(req: Request) {
  try {
    // Verificar sesión activa
    const session = await getServerSession(authOptions)
    if (!session?.user?.role) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const onlyActive = searchParams.get("active") === "true"

    // Listar todas requiere rol admin
    if (!onlyActive && session.user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const categories = await prisma.categories.findMany({
      where: onlyActive ? { active: true } : undefined,
      orderBy: { id: "asc" },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error("ERROR GET /api/categories:", error)
    return NextResponse.json({ error: "Error al obtener categorías" }, { status: 500 })
  }
}

// POST /api/categories
// Crea una nueva categoría. Solo admin.
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin()
    if ("error" in auth) return auth.error

    const { name, description } = await req.json()

    // Validar campo obligatorio
    if (!name) {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 })
    }

    const category = await prisma.categories.create({
      data: { name, description },
    })

    return NextResponse.json({ success: true, category })
  } catch (error) {
    console.error("ERROR POST /api/categories:", error)
    return NextResponse.json({ error: "Error al crear categoría" }, { status: 500 })
  }
}

// PATCH /api/categories
// Actualiza nombre, descripción o estado activo de una categoría. Solo admin.
export async function PATCH(req: Request) {
  try {
    const auth = await requireAdmin()
    if ("error" in auth) return auth.error

    const { id, name, description, active } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "ID obligatorio" }, { status: 400 })
    }

    // Solo actualizar los campos que vienen en el body
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
    console.error("ERROR PATCH /api/categories:", error)
    return NextResponse.json({ error: "Error al actualizar categoría" }, { status: 500 })
  }
}

// DELETE /api/categories
// Elimina una categoría. Solo admin.
// Bloquea la eliminación si hay tickets asociados a esa categoría.
export async function DELETE(req: Request) {
  try {
    const auth = await requireAdmin()
    if ("error" in auth) return auth.error

    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "ID obligatorio" }, { status: 400 })
    }

    // Comprobar que no haya tickets usando esta categoría
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
    console.error("ERROR DELETE /api/categories:", error)
    return NextResponse.json({ error: "Error al eliminar categoría" }, { status: 500 })
  }
}