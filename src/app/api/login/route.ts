import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    const user = await prisma.users.findUnique({
      where: { email },
    })


    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
  return NextResponse.json(
    { error: "Credenciales incorrectas" },
    { status: 401 }
  )
  }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
    })

  } catch (error) {
    console.error("ERROR LOGIN:", error)

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}