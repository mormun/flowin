import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/auth"

// PATCH /api/profile/password
// Actualiza la contraseña del usuario autenticado.
export async function PATCH(req: Request) {
  try {
    // Verificar sesión activa
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { password } = await req.json()

    // Validar que se haya proporcionado una contraseña
    if (!password) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 })
    }

    // Hashear la nueva contraseña y actualizar en BD
    const hashed = await bcrypt.hash(password, 10)
    await prisma.users.update({
      where: { email: session.user.email },
      data: { password_hash: hashed },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("ERROR PATCH /api/profile/password:", error)
    return NextResponse.json({ error: "Error actualizando contraseña" }, { status: 500 })
  }
}