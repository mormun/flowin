import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const all = searchParams.get("all") === "true"
    const bandeja = searchParams.get("bandeja") === "true"

    const currentUser = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, role: true },
    })

    if (!currentUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    if (bandeja) {
      const tickets = await prisma.tickets.findMany({
        where: {
          OR: [
            {
              assigned_to: null,
              status: { name: "Nuevo" },
            },
            {
              assigned_to: currentUser.id,
              status: { name: { notIn: ["Cerrado", "Cancelado"] } },
            },
          ],
        },
        include: {
          categories: { select: { name: true } },
          status: { select: { name: true } },
          users_tickets_created_byTousers: { select: { name: true, surname: true } },
          users_tickets_assigned_toTousers: { select: { id: true, name: true, surname: true } },
        },
        orderBy: { created_at: "desc" },
      })

      return NextResponse.json(tickets)
    }

    const tickets = await prisma.tickets.findMany({
      where: all
        ? undefined
        : {
            status: {
              name: { notIn: ["Cerrado", "Cancelado"] },
            },
          },
      include: {
        categories: { select: { name: true } },
        status: { select: { name: true } },
        users_tickets_created_byTousers: { select: { name: true, surname: true } },
        users_tickets_assigned_toTousers: { select: { id: true, name: true, surname: true } },
      },
      orderBy: { created_at: "desc" },
    })

    return NextResponse.json(tickets)
  } catch (error) {
    console.error("ERROR GET TICKETS:", error)
    return NextResponse.json({ error: "Error obteniendo tickets" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { title, description, category, priority } = await req.json()

    if (!title?.trim() || !description?.trim() || !category || !priority) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const ticket = await prisma.tickets.create({
      data: {
        title,
        description,
        category_id: category,
        priority,
        status_id: 1,
        created_by: user.id,
      },
    })

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error("ERROR CREATE TICKET:", error)
    return NextResponse.json({ error: "Error al crear ticket" }, { status: 500 })
  }
}