import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"

// POST /api/notifications/mark-all-read
// Marca todas las notificaciones no leídas del usuario autenticado como leídas.
// Devuelve el número de notificaciones actualizadas.
export async function POST() {
  try {
    // Verificar sesión activa
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const userId = Number(session.user.id)

    // Actualizar todas las notificaciones no leídas del usuario en una sola operación
    const result = await prisma.notifications.updateMany({
      where: { user_id: userId, read: false },
      data: { read: true },
    })

    return NextResponse.json({ success: true, count: result.count })
  } catch (error) {
    console.error("ERROR POST /api/notifications/mark-all-read:", error)
    return NextResponse.json({ error: "Error al marcar notificaciones como leídas" }, { status: 500 })
  }
}