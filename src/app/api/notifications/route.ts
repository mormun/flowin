import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"

// GET /api/notifications
// Devuelve las últimas 50 notificaciones del usuario autenticado
// junto con el contador de no leídas.
export async function GET() {
  try {
    // Verificar sesión activa
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const userId = Number(session.user.id)

    // Obtener notificaciones y contador de no leídas en paralelo
    const [notifications, unreadCount] = await Promise.all([
      prisma.notifications.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        take: 50,
        select: {
          id: true,
          title: true,
          message: true,
          read: true,
          created_at: true,
          // Incluir datos básicos del ticket asociado para el enlace en la notificación
          ticket: {
            select: { id: true, title: true },
          },
        },
      }),
      prisma.notifications.count({
        where: { user_id: userId, read: false },
      }),
    ])

    return NextResponse.json({ notifications, unread_count: unreadCount })
  } catch (error) {
    console.error("ERROR GET /api/notifications:", error)
    return NextResponse.json({ error: "Error al obtener notificaciones" }, { status: 500 })
  }
}