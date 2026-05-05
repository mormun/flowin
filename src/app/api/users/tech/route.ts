import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const technicians = await prisma.users.findMany({
      where: {
        role: "tech",
        active: true,
      },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(technicians)
  } catch (error) {
    console.error("ERROR TECHNICIANS:", error)

    return NextResponse.json(
      { error: "Error obteniendo técnicos" },
      { status: 500 }
    )
  }
}