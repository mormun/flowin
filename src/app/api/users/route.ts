import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const currentUser = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })

    if (!currentUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    if (currentUser.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const users = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        role: true,
        active: true,
        registration_date: true,
      },
      orderBy: { id: "asc" },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("ERROR USERS GET:", error)
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const currentUser = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })

    if (!currentUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    if (currentUser.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { name, surname, email, role, password } = await req.json()

    if (!name || !surname || !email || !role || !password) {
      return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 })
    }

    const existing = await prisma.users.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 })
    }

    const password_hash = await bcrypt.hash(password, 10)

    const user = await prisma.users.create({
      data: { name, surname, email, role, password_hash },
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("ERROR USERS POST:", error)
    return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const currentUser = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })

    if (!currentUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    if (currentUser.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id, name, surname, email, role, active, resetPassword } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "ID obligatorio" }, { status: 400 })
    }

    if (resetPassword) {
      const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$"
      const newPassword = Array.from({ length: 10 }, () =>
        chars[Math.floor(Math.random() * chars.length)]
      ).join("")

      const password_hash = await bcrypt.hash(newPassword, 10)

      await prisma.users.update({
        where: { id },
        data: { password_hash },
      })

      return NextResponse.json({ success: true, generatedPassword: newPassword })
    }

    const user = await prisma.users.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(surname !== undefined && { surname }),
        ...(email !== undefined && { email }),
        ...(role !== undefined && { role }),
        ...(active !== undefined && { active }),
      },
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("ERROR USERS PATCH:", error)
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const currentUser = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })

    if (!currentUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    if (currentUser.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "ID obligatorio" }, { status: 400 })
    }

    const ticketCount = await prisma.tickets.count({
      where: {
        OR: [{ created_by: id }, { assigned_to: id }],
      },
    })

    if (ticketCount > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar: tiene ${ticketCount} ticket(s) asociado(s). Desactívalo en su lugar.` },
        { status: 409 }
      )
    }

    await prisma.users.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("ERROR USERS DELETE:", error)
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 })
  }
}