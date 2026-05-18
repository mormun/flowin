import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/auth"

// GET /api/profile
// Devuelve los datos del perfil del usuario autenticado.
export async function GET() {
  try {
    // Verificar sesión activa
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Obtener datos del usuario desde BD
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    })
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Devolver solo los campos necesarios para el perfil
    return NextResponse.json({
      id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      role: user.role,
      registration_date: user.registration_date,
    })
  } catch (error) {
    console.error("ERROR GET /api/profile:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// PATCH /api/profile
// Actualiza el nombre y apellido del usuario autenticado.
export async function PATCH(req: Request) {
  try {
    // Verificar sesión activa
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { name, surname } = await req.json()

    // Actualizar nombre y apellido en BD
    const updatedUser = await prisma.users.update({
      where: { email: session.user.email },
      data: { name, surname },
    })

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    console.error("ERROR PATCH /api/profile:", error)
    return NextResponse.json({ error: "Error actualizando perfil" }, { status: 500 })
  }
}