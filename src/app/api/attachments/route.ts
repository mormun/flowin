import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const ticketId = Number(formData.get("ticketId"))
    const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

    if (!file || !ticketId) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "El archivo no puede superar los 10 MB" },
        { status: 413 }
      )
    }

    // Sanitizar nombre de archivo
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const uploadDir = path.join(process.cwd(), "public", "uploads", String(ticketId))

    // Crear carpeta si no existe
    await mkdir(uploadDir, { recursive: true })

    // Guardar archivo
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(path.join(uploadDir, safeName), buffer)

    // Guardar referencia en BBDD
    const attachment = await prisma.attachments.create({
      data: {
        ticket_id: ticketId,
        filename: safeName,
        file_path: `/uploads/${ticketId}/${safeName}`,
      },
    })

    return NextResponse.json(attachment, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Error subiendo archivo" }, { status: 500 })
  }
}