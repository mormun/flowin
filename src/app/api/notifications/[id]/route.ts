import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { id } = await params
    const notificationId = Number(id)

    if (isNaN(notificationId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const userId = Number(session.user.id)

    // updateMany con filtro por user_id garantiza que solo se actualiza
    // si la notificación realmente pertenece al usuario autenticado
    const result = await prisma.notifications.updateMany({
      where: {
        id: notificationId,
        user_id: userId,
      },
      data: { read: true },
    })

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Notificación no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("ERROR NOTIFICATION PATCH:", error)
    return NextResponse.json(
      { error: "Error al actualizar notificación" },
      { status: 500 }
    )
  }
}