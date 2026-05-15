import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/auth"
import { put } from "@vercel/blob"

const MAX_SIZE = 4 * 1024 * 1024 // 4 MB (límite Vercel Free)

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const ticketId = Number(formData.get("ticketId"))

    if (!file || !ticketId) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 })
    }

    const ticket = await prisma.tickets.findUnique({
      where: { id: ticketId },
      select: { id: true, created_by: true, assigned_to: true },
    })
    if (!ticket) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 })
    }

    const canUpload =
      user.role === "admin" ||
      ticket.created_by === user.id ||
      ticket.assigned_to === user.id

    if (!canUpload) {
      return NextResponse.json(
        { error: "No autorizado para adjuntar archivos a este ticket" },
        { status: 403 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "El archivo no puede superar los 4 MB" },
        { status: 413 }
      )
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")

    // ───── Vercel Blob Storage ─────
    const blob = await put(`attachments/${ticketId}/${safeName}`, file, {
      access: 'public',
    })

    // ───── Guardar en BBDD ─────
    const attachment = await prisma.attachments.create({
      data: {
        ticket_id: ticketId,
        filename: safeName,
        file_path: blob.url,
      },
    })

    return NextResponse.json(attachment, { status: 201 })
  } catch (err) {
    console.error("Error en POST /api/attachments:", err)
    return NextResponse.json({ error: "Error subiendo archivo" }, { status: 500 })
  }
}