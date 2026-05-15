import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/auth"

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

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
        { error: "El archivo no puede superar los 10 MB" },
        { status: 413 }
      )
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const buffer = Buffer.from(await file.arrayBuffer())

    // ───── Supabase Storage mediante API REST directa ─────
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const storagePath = `${ticketId}/${safeName}`

    const uploadResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/attachments/${storagePath}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': file.type,
          'x-upsert': 'false',
        },
        body: buffer,
      }
    )

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error('Error uploading to Supabase via REST:', uploadResponse.status, errorText)
      return NextResponse.json(
        { error: `Error subiendo archivo: ${uploadResponse.statusText}` },
        { status: 500 }
      )
    }

    const filePath = `${supabaseUrl}/storage/v1/object/public/attachments/${storagePath}`

    // ───── Guardar en BBDD ─────
    const attachment = await prisma.attachments.create({
      data: {
        ticket_id: ticketId,
        filename: safeName,
        file_path: filePath,
      },
    })

    return NextResponse.json(attachment, { status: 201 })

  } catch (err) {
    console.error("Error en POST /api/attachments:", err)
    return NextResponse.json({ error: "Error subiendo archivo" }, { status: 500 })
  }
}