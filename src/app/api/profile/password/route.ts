import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"

export async function PATCH(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 10)

    await prisma.users.update({
      where: { email },
      data: { password_hash: hashed },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("ERROR UPDATE PASSWORD:", error)
    return NextResponse.json({ error: "Error actualizando contraseña" }, { status: 500 })
  }
}