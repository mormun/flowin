import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const userId = Number(session.user.id)

    const result = await prisma.notifications.updateMany({
      where: {
        user_id: userId,
        read: false,
      },
      data: { read: true },
    })

    return NextResponse.json({
      success: true,
      count: result.count,
    })
  } catch (error) {
    console.error("ERROR MARK ALL NOTIFICATIONS READ:", error)
    return NextResponse.json(
      { error: "Error al marcar notificaciones como leídas" },
      { status: 500 }
    )
  }
}