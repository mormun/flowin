import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

// Tamaño máximo permitido para archivos adjuntos: 10 MB
const MAX_SIZE = 10 * 1024 * 1024

// POST /api/attachments
// Sube un archivo adjunto y lo asocia a un ticket.
// Solo pueden adjuntar: el creador del ticket, el técnico asignado y los admins.
export async function POST(req: NextRequest) {
  try {
    // Verificar sesión activa
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Obtener el usuario de BD para verificar rol e identidad
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Extraer fichero y ticketId del formulario
    const formData = await req.formData()
    const file = formData.get("file") as File
    const ticketId = Number(formData.get("ticketId"))

    if (!file || !ticketId) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 })
    }

    // Verificar que el ticket existe
    const ticket = await prisma.tickets.findUnique({
      where: { id: ticketId },
      select: { id: true, created_by: true, assigned_to: true },
    })
    if (!ticket) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 })
    }

    // Comprobar que el usuario tiene permiso para adjuntar en este ticket
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

    // Validar tamaño del archivo
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "El archivo no puede superar los 10 MB" },
        { status: 413 }
      )
    }

    // Sanitizar el nombre del archivo para evitar caracteres problemáticos
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const buffer = Buffer.from(await file.arrayBuffer())

    // Guardar el fichero en el sistema de archivos local (Docker)
    // Ruta: public/uploads/{ticketId}/{filename}
    const uploadDir = path.join(process.cwd(), "public", "uploads", String(ticketId))
    await mkdir(uploadDir, { recursive: true })
    await writeFile(path.join(uploadDir, safeName), buffer)
    const filePath = `/uploads/${ticketId}/${safeName}`

    // Registrar el adjunto en BD
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