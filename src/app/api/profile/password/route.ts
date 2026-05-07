import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import bcrypt from "bcrypt"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/auth"

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { password } = await req.json()

    if (!password) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 10)

    await prisma.users.update({
      where: { email: session.user.email },
      data: { password_hash: hashed },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("ERROR UPDATE PASSWORD:", error)
    return NextResponse.json({ error: "Error actualizando contraseña" }, { status: 500 })
  }
}