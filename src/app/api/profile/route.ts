import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    const user = await prisma.users.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      role: user.role,
      registration_date: user.registration_date,
    })
  } catch (error) {
    console.error("ERROR PROFILE:", error)

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const { email, name, surname } = await req.json()

    const updatedUser = await prisma.users.update({
      where: { email },
      data: {
        name,
        surname,
      },
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
    })
  } catch (error) {
    console.error("ERROR UPDATE PROFILE:", error)

    return NextResponse.json(
      { error: "Error actualizando perfil" },
      { status: 500 }
    )
  }
}