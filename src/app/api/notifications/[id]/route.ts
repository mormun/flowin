import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"

// PATCH /api/notifications/[id]
// Marca una notificación como leída.
// Solo puede marcarla el propietario de la notificación.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar sesión activa
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { id } = await params
    const notificationId = Number(id)

    // Validar que el ID sea un número válido
    if (isNaN(notificationId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const userId = Number(session.user.id)

    // Usar updateMany con filtro por user_id para garantizar que el usuario
    // solo puede marcar sus propias notificaciones (evita acceso cruzado)
    const result = await prisma.notifications.updateMany({
      where: { id: notificationId, user_id: userId },
      data: { read: true },
    })

    // Si count === 0 la notificación no existe o no pertenece al usuario
    if (result.count === 0) {
      return NextResponse.json({ error: "Notificación no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("ERROR PATCH /api/notifications/[id]:", error)
    return NextResponse.json({ error: "Error al actualizar notificación" }, { status: 500 })
  }
}